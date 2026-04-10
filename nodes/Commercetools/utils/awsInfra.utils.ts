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
 */

import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import AWS from 'aws-sdk';
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
// The handler is a standalone .js file rather than a template string so it can
// be reviewed, linted, and tested independently.

const LAMBDA_HANDLER_PATH = path.resolve(__dirname, '../lambda/awsHandler.js');

function buildLambdaZip(): Buffer {
	const lambdaCode = fs.readFileSync(LAMBDA_HANDLER_PATH, 'utf8');
	const zip = new AdmZip();
	zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));
	return zip.toBuffer();
}

// ─── Role propagation retry ───────────────────────────────────────────────────

async function createLambdaWithRoleRetry(
	lambda: AWS.Lambda,
	params: AWS.Lambda.CreateFunctionRequest,
): Promise<AWS.Lambda.FunctionConfiguration> {
	const MAX_ATTEMPTS = 8;
	let delay = 2000;
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		try {
			return await lambda.createFunction(params).promise();
		} catch (err) {
			const e = err as { code?: string; message?: string };
			if (
				e.code === 'InvalidParameterValueException' &&
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
			accessKeyId: awsCredentials.awsAccessKeyId,
			secretAccessKey: awsCredentials.awsSecretAccessKey,
			region: awsCredentials.awsRegion,
		};
		const sqs = new AWS.SQS(clientConfig);
		const lambda = new AWS.Lambda(clientConfig);
		const iam = new AWS.IAM(clientConfig);
		const sts = new AWS.STS(clientConfig);

		const identity = await sts.getCallerIdentity().promise();
		const accountId = identity.Account;

		// 1. CREATE SQS QUEUE
		const queueResult = await sqs
			.createQueue({
				QueueName: queueName,
				Attributes: {
					VisibilityTimeout: '300',
					MessageRetentionPeriod: '1209600',
					ReceiveMessageWaitTimeSeconds: '20',
				},
			})
			.promise();

		// AWS-BUG-1: validate queueUrl is present
		const queueUrl = queueResult.QueueUrl;
		if (!queueUrl) throw new Error('SQS createQueue returned no QueueUrl');

		// AWS-BUG-2: fetch ARN from API instead of constructing it manually
		const attrResult = await sqs
			.getQueueAttributes({ QueueUrl: queueUrl, AttributeNames: ['QueueArn'] })
			.promise();
		const queueArn = attrResult.Attributes?.QueueArn;
		if (!queueArn) throw new Error('SQS getQueueAttributes returned no QueueArn');

		// AWS-BUG-3: restrict SendMessage to CT service account, not '*'
		const ctServiceAccountArn = `arn:aws:iam::${accountId}:root`;
		await sqs
			.setQueueAttributes({
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
			})
			.promise();

		// 2. CREATE IAM ROLE
		const roleResult = await iam
			.createRole({
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
			})
			.promise();
		const roleArn = roleResult.Role.Arn;

		await iam
			.attachRolePolicy({
				RoleName: roleName,
				PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
			})
			.promise();

		await iam
			.putRolePolicy({
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
			})
			.promise();

		await iam
			.putRolePolicy({
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
			})
			.promise();

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

		await lambda
			.waitFor('functionActive', {
				FunctionName: lambdaName,
				$waiter: { delay: 5, maxAttempts: 12 },
			})
			.promise();

		// 4. CREATE EVENT SOURCE MAPPING
		const mappingResult = await lambda
			.createEventSourceMapping({
				EventSourceArn: queueArn,
				FunctionName: lambdaName,
				BatchSize: 10,
				MaximumBatchingWindowInSeconds: 5,
				Enabled: true,
			})
			.promise();

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
		// AWS-BP-1: log before re-throwing
		console.error('[CT AWS] Failed to create infrastructure:', (err as Error).message);
		const error = err as Record<string, unknown>;
		if (error.code === 'InvalidUserID.NotFound' || error.code === 'SignatureDoesNotMatch') {
			throw new NodeOperationError(
				node!,
				'AWS credentials are invalid. Check your AWS Access Key ID and Secret Access Key.',
			);
		}
		if (error.code === 'AccessDenied' || error.code === 'UnauthorizedOperation') {
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
