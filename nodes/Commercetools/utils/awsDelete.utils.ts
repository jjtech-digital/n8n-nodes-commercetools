/**
 * nodes/Commercetools/utils/awsDelete.utils.ts
 *
 * Deletes all AWS resources previously provisioned by awsInfra.utils.ts:
 *   - Event source mapping (SQS → Lambda)
 *   - Lambda function
 *   - SQS queue
 *   - IAM inline policies + managed policy attachment + IAM role
 *   - CloudWatch Logs log group
 *
 * Extracted from awsInfra.utils.ts to keep each file under 300 lines.
 * All deletions are best-effort: an error on one resource is logged but does
 * not prevent the remaining deletions from running.
 */

import AWS from 'aws-sdk';
import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { AWSResponse } from './awsInfra.utils';

export async function deleteAWSInfrastructure(
	awsCredentials: Record<string, string>,
	infrastructure: AWSResponse,
	node?: INode,
): Promise<void> {
	try {
		const clientConfig = {
			accessKeyId: awsCredentials.awsAccessKeyId,
			secretAccessKey: awsCredentials.awsSecretAccessKey,
			region: infrastructure.region,
		};
		const lambda = new AWS.Lambda(clientConfig);
		const sqs = new AWS.SQS(clientConfig);
		const iam = new AWS.IAM(clientConfig);

		// 1. DELETE EVENT SOURCE MAPPING
		if (infrastructure.eventSourceMappingUuid) {
			try {
				await lambda
					.deleteEventSourceMapping({ UUID: infrastructure.eventSourceMappingUuid })
					.promise();
			} catch (err) {
				console.warn('[CT AWS] Could not delete event source mapping:', (err as Error).message);
			}
		}

		// 2. DELETE LAMBDA FUNCTION
		if (infrastructure.lambdaFunctionName) {
			try {
				await lambda
					.deleteFunction({ FunctionName: infrastructure.lambdaFunctionName })
					.promise();
			} catch (err) {
				console.warn('[CT AWS] Could not delete Lambda function:', (err as Error).message);
			}
		}

		// 3. DELETE SQS QUEUE
		if (infrastructure.queueUrl) {
			try {
				await sqs.deleteQueue({ QueueUrl: infrastructure.queueUrl }).promise();
			} catch (err) {
				console.warn('[CT AWS] Could not delete SQS queue:', (err as Error).message);
			}
		}

		// 4. DELETE IAM ROLE + POLICIES
		if (infrastructure.iamRoleName) {
			await deleteIamRole(iam, infrastructure, clientConfig);
		}
	} catch (err) {
		throw new NodeOperationError(
			node ?? ({} as INode),
			`Failed to delete AWS infrastructure: ${(err as Error).message}. ` +
				`You may need to manually clean up resources in the AWS Console.`,
		);
	}
}

// ─── IAM role deletion helper ─────────────────────────────────────────────────

async function deleteIamRole(
	iam: AWS.IAM,
	infrastructure: AWSResponse,
	clientConfig: { accessKeyId: string; secretAccessKey: string; region?: string },
): Promise<void> {
	const roleName = infrastructure.iamRoleName!;

	// Inline policies
	for (const suffix of ['-cloudwatch-policy', '-sqs-policy']) {
		try {
			await iam.deleteRolePolicy({ RoleName: roleName, PolicyName: `${roleName}${suffix}` }).promise();
		} catch (err) {
			console.warn(`[CT AWS] Could not delete inline policy ${suffix}:`, (err as Error).message);
		}
	}

	// CloudWatch Logs log group
	if (infrastructure.lambdaFunctionName) {
		const cwl = new AWS.CloudWatchLogs(clientConfig);
		try {
			await cwl
				.deleteLogGroup({ logGroupName: `/aws/lambda/${infrastructure.lambdaFunctionName}` })
				.promise();
		} catch (err) {
			console.warn('[CT AWS] Could not delete CloudWatch log group:', (err as Error).message);
		}
	}

	// Managed policy detach
	try {
		await iam
			.detachRolePolicy({
				RoleName: roleName,
				PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
			})
			.promise();
	} catch (err) {
		console.warn('[CT AWS] Could not detach managed policy:', (err as Error).message);
	}

	// Delete the role
	try {
		await iam.deleteRole({ RoleName: roleName }).promise();
	} catch (err) {
		console.warn('[CT AWS] Could not delete IAM role:', (err as Error).message);
	}
}
