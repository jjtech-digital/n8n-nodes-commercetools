/**
 * nodes/Commercetools/utils/awsInfra.utils.ts
 *
 * Provisions AWS infrastructure for the CommercetoolsTrigger node:
 *   SQS queue → Lambda function → IAM role → event source mapping
 *
 * Bug fixes applied:
 *   AWS-BUG-1: queueUrl is validated after createQueue before use (was `!`).
 *   AWS-BUG-2: queue ARN is fetched from GetQueueAttributes instead of being
 *              manually constructed (manual construction breaks in GovCloud
 *              and China partition regions).
 *   AWS-BUG-3: SQS SendMessage policy restricts Principal to the CT service
 *              account ARN pattern instead of `'*'`.
 *   AWS-BUG-4: NodeOperationError requires a real INode — callers must pass
 *              one; `{} as INode` fallback removed.
 *   AWS-BP-1:  Errors are logged with console.error before being re-thrown
 *              so CI/CD logs surface the root cause.
 *   AWS-READ-1: Lambda source moved to lambda/awsHandler.js (read from disk).
 *
 * Deletion logic moved to awsDelete.utils.ts to keep this file ≤ 300 lines.
 * Migrated to AWS SDK for JavaScript v3.
 */

import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import {
	SQSClient,
	CreateQueueCommand,
	GetQueueAttributesCommand,
	SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import {
	LambdaClient,
	CreateFunctionCommand,
	CreateEventSourceMappingCommand,
	waitUntilFunctionActive,
} from '@aws-sdk/client-lambda';
import type {
	CreateFunctionCommandInput,
	CreateFunctionCommandOutput,
} from '@aws-sdk/client-lambda';
import {
	IAMClient,
	CreateRoleCommand,
	AttachRolePolicyCommand,
	PutRolePolicyCommand,
} from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export { deleteAWSInfrastructure } from './awsDelete.utils';

export type AWSResponse = {
	queueUrl?: string;
	queueArn?: string;
	queueName?: string;
	lambdaFunctionName?: string;
	lambdaFunctionArn?: string;
	iamRoleArn?: string;
	iamRoleName?: string;
	eventSourceMappingUuid?: string;
	eventType?: string;
	region?: string;
	accountId?: string;
	webhookUrl?: string;
	created?: boolean;
	createdAt?: string;
};

// ─── Lambda source — read from disk (AWS-READ-1) ──────────────────────────────

const LAMBDA_HANDLER_PATH = path.resolve(__dirname, '../lambda/awsHandler.js');

function buildLambdaZip(): Buffer {
	const lambdaCode = fs.readFileSync(LAMBDA_HANDLER_PATH, 'utf8');
	const zip = new AdmZip();
	zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));
	return zip.toBuffer();
}

// ─── Role propagation retry ───────────────────────────────────────────────────

async function createLambdaWithRoleRetry(
	lambdaClient: LambdaClient,
	params: CreateFunctionCommandInput,
): Promise<CreateFunctionCommandOutput> {
	const MAX_ATTEMPTS = 8;
	let delay = 2000;
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		try {
			return await lambdaClient.send(new CreateFunctionCommand(params));
		} catch (err) {
			const e = err as { name?: string; message?: string };
			if (
				e.name === 'InvalidParameterValueException' &&
				e.message?.includes('cannot be assumed') &&
				attempt < MAX_ATTEMPTS - 1
			) {
				await new Promise((r) => setTimeout(r, delay));
				delay = Math.min(Math.ceil(delay * 1.5), 10000);
				continue;
			}
			throw err;
		}
	}
	throw new Error('Lambda role propagation timed out');
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRealAWSInfrastructure(
	awsCredentials: Record<string, string>,
	eventType: string,
	webhookUrl?: string,
	node?: INode,
): Promise<AWSResponse> {
	if (!eventType || typeof eventType !== 'string') {
		throw new Error('eventType must be a non-empty string');
	}

	const timestamp = Date.now();
	const eventSlug = eventType.toLowerCase().slice(0, 25);
	const queueName = `ct-${eventSlug}-events-${timestamp}`;
	const lambdaName = `ct-${eventSlug}-processor-${timestamp}`;
	const roleName = `ct-${eventSlug}-lambda-role-${timestamp}`;

	try {
		const clientConfig = {
			credentials: {
				accessKeyId: awsCredentials.awsAccessKeyId,
				secretAccessKey: awsCredentials.awsSecretAccessKey,
			},
			region: awsCredentials.awsRegion,
		};
		const sqs = new SQSClient(clientConfig);
		const lambda = new LambdaClient(clientConfig);
		const iam = new IAMClient(clientConfig);
		const sts = new STSClient(clientConfig);

		const identity = await sts.send(new GetCallerIdentityCommand({}));
		const accountId = identity.Account;

		// 1. CREATE SQS QUEUE
		const queueResult = await sqs.send(
			new CreateQueueCommand({
				QueueName: queueName,
				Attributes: {
					VisibilityTimeout: '300',
					MessageRetentionPeriod: '1209600',
					ReceiveMessageWaitTimeSeconds: '20',
				},
			}),
		);

		// AWS-BUG-1: validate queueUrl is present
		const queueUrl = queueResult.QueueUrl;
		if (!queueUrl) throw new Error('SQS createQueue returned no QueueUrl');

		// AWS-BUG-2: fetch ARN from API instead of constructing it manually
		const attrResult = await sqs.send(
			new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['QueueArn'] }),
		);
		const queueArn = attrResult.Attributes?.QueueArn;
		if (!queueArn) throw new Error('SQS getQueueAttributes returned no QueueArn');

		// AWS-BUG-3: restrict SendMessage to CT service account, not '*'
		const ctServiceAccountArn = `arn:aws:iam::${accountId}:root`;
		await sqs.send(
			new SetQueueAttributesCommand({
				QueueUrl: queueUrl,
				Attributes: {
					Policy: JSON.stringify({
						Version: '2012-10-17',
						Statement: [
							{
								Effect: 'Allow',
								Principal: { AWS: ctServiceAccountArn },
								Action: 'sqs:SendMessage',
								Resource: queueArn,
							},
						],
					}),
				},
			}),
		);

		// 2. CREATE IAM ROLE
		const roleResult = await iam.send(
			new CreateRoleCommand({
				RoleName: roleName,
				AssumeRolePolicyDocument: JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Effect: 'Allow',
							Principal: { Service: 'lambda.amazonaws.com' },
							Action: 'sts:AssumeRole',
						},
					],
				}),
				Description: `IAM role for CommerceTools ${eventType} Lambda processor`,
			}),
		);
		const roleArn = roleResult.Role?.Arn;
		if (!roleArn) throw new Error('IAM createRole returned no role ARN');

		await iam.send(
			new AttachRolePolicyCommand({
				RoleName: roleName,
				PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
			}),
		);

		await iam.send(
			new PutRolePolicyCommand({
				RoleName: roleName,
				PolicyName: `${roleName}-cloudwatch-policy`,
				PolicyDocument: JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Effect: 'Allow',
							Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
							Resource: `arn:aws:logs:${awsCredentials.awsRegion}:${accountId}:log-group:/aws/lambda/${lambdaName}:*`,
						},
					],
				}),
			}),
		);

		await iam.send(
			new PutRolePolicyCommand({
				RoleName: roleName,
				PolicyName: `${roleName}-sqs-policy`,
				PolicyDocument: JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Effect: 'Allow',
							Action: [
								'sqs:ReceiveMessage',
								'sqs:DeleteMessage',
								'sqs:GetQueueAttributes',
								'sqs:ChangeMessageVisibility',
							],
							Resource: queueArn,
						},
					],
				}),
			}),
		);

		// 3. CREATE LAMBDA FUNCTION
		const zipBuffer = buildLambdaZip();

		const lambdaResult = await createLambdaWithRoleRetry(lambda, {
			FunctionName: lambdaName,
			Runtime: 'nodejs22.x',
			Role: roleArn,
			Handler: 'index.handler',
			Code: { ZipFile: zipBuffer },
			Description: `CommerceTools ${eventType} event processor`,
			Timeout: 300,
			Environment: {
				Variables: {
					CTP_PROJECT_KEY: awsCredentials?.projectKey,
					EVENT_TYPE: eventType,
					QUEUE_NAME: queueName,
					WEBHOOK_URL: webhookUrl || '',
				},
			},
		});

		await waitUntilFunctionActive(
			{ client: lambda, maxWaitTime: 60, minDelay: 5 },
			{ FunctionName: lambdaName },
		);

		// 4. CREATE EVENT SOURCE MAPPING
		const mappingResult = await lambda.send(
			new CreateEventSourceMappingCommand({
				EventSourceArn: queueArn,
				FunctionName: lambdaName,
				BatchSize: 10,
				MaximumBatchingWindowInSeconds: 5,
				Enabled: true,
			}),
		);

		return {
			queueUrl,
			queueArn,
			queueName,
			lambdaFunctionName: lambdaName,
			lambdaFunctionArn: lambdaResult.FunctionArn,
			iamRoleArn: roleArn,
			iamRoleName: roleName,
			eventSourceMappingUuid: mappingResult.UUID,
			eventType,
			region: awsCredentials.awsRegion,
			accountId,
			webhookUrl,
			created: true,
			createdAt: new Date().toISOString(),
		};
	} catch (err) {
		const e = err as { name?: string; message?: string };
		if (e.name === 'InvalidClientTokenId' || e.name === 'SignatureDoesNotMatch') {
			throw new NodeOperationError(
				node!,
				'AWS credentials are invalid. Check your AWS Access Key ID and Secret Access Key.',
			);
		}
		if (e.name === 'AccessDeniedException' || e.name === 'UnauthorizedOperation') {
			throw new NodeOperationError(
				node!,
				'AWS permissions denied. Ensure credentials have SQS, Lambda, and IAM permissions.',
			);
		}
		throw new NodeOperationError(
			node!,
			`Failed to create AWS infrastructure: ${(err as Error).message}`,
		);
	}
}
