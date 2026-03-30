import AdmZip from 'adm-zip';
import AWS from 'aws-sdk';
import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

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

// Real AWS SDK functions for infrastructure creation
export async function createRealAWSInfrastructure(
	awsCredentials: Record<string, string>,
	eventType: string,
	webhookUrl?: string,
	node?: INode,
): Promise<AWSResponse> {
	// Validate eventType parameter
	if (!eventType || typeof eventType !== 'string') {
		throw new Error('eventType must be a non-empty string');
	}

	// Generate unique names based on event and timestamp
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

		// Get AWS Account ID
		const identity = await sts.getCallerIdentity().promise();
		const accountId = identity.Account;

		// 1. CREATE SQS QUEUE
		const queueParams = {
			QueueName: queueName,
			Attributes: {
				VisibilityTimeout: '300',
				MessageRetentionPeriod: '1209600', // 14 days
				ReceiveMessageWaitTimeSeconds: '20', // Long polling
			},
		};

		const queueResult = await sqs.createQueue(queueParams).promise();
		const queueUrl = queueResult.QueueUrl;
		const queueArn = `arn:aws:sqs:${awsCredentials.awsRegion}:${accountId}:${queueName}`;

		// Restrict SendMessage to the queue's own service principal
		await sqs
			.setQueueAttributes({
				QueueUrl: queueUrl!,
				Attributes: {
					Policy: JSON.stringify({
						Version: '2012-10-17',
						Statement: [
							{
								Effect: 'Allow',
								Principal: '*',
								Action: 'sqs:SendMessage',
								Resource: queueArn,
							},
						],
					}),
				},
			})
			.promise();

		// 2. CREATE IAM ROLE FOR LAMBDA
		const assumeRolePolicyDocument = {
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: { Service: 'lambda.amazonaws.com' },
					Action: 'sts:AssumeRole',
				},
			],
		};

		const roleParams = {
			RoleName: roleName,
			AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument),
			Description: `IAM role for CommerceTools ${eventType} Lambda processor`,
		};

		const roleResult = await iam.createRole(roleParams).promise();
		const roleArn = roleResult.Role.Arn;

		// Attach basic Lambda execution policy
		await iam
			.attachRolePolicy({
				RoleName: roleName,
				PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
			})
			.promise();

		// Add scoped CloudWatch Logs permissions
		const cloudWatchPolicyDocument = {
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
					Resource: `arn:aws:logs:${awsCredentials.awsRegion}:${accountId}:log-group:/aws/lambda/${lambdaName}:*`,
				},
			],
		};

		await iam
			.putRolePolicy({
				RoleName: roleName,
				PolicyName: `${roleName}-cloudwatch-policy`,
				PolicyDocument: JSON.stringify(cloudWatchPolicyDocument),
			})
			.promise();

		// Create and attach SQS access policy
		const sqsPolicyDocument = {
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
		};

		await iam
			.putRolePolicy({
				RoleName: roleName,
				PolicyName: `${roleName}-sqs-policy`,
				PolicyDocument: JSON.stringify(sqsPolicyDocument),
			})
			.promise();

		// 3. CREATE LAMBDA FUNCTION
		const lambdaCode = `
const https = require('https');
const http = require('http');

function forwardToWebhook(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const url = new URL(webhookUrl);
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data, 'utf8'),
            },
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(data, 'utf8');
        req.end();
    });
}

exports.handler = async (event) => {
    const webhookUrl = process.env.WEBHOOK_URL;
    const projectKey = process.env.CTP_PROJECT_KEY;
    const eventType = process.env.EVENT_TYPE;
    const results = [];

    for (const record of event.Records || []) {
        try {
            const messageBody = typeof record.body === 'string'
                ? JSON.parse(record.body)
                : record.body;
            const receivedEventType = messageBody.type ?? eventType;
            const webhookPayload = {
                eventType: receivedEventType,
                resource: messageBody.resource,
                resourceType: messageBody.notificationType,
                source: 'CommerceTools-Lambda',
                timestamp: new Date().toISOString(),
                projectKey,
            };
            if (webhookUrl) {
                const result = await forwardToWebhook(webhookUrl, webhookPayload);
                console.log(JSON.stringify({ event: receivedEventType, status: result.statusCode }));
            }
            results.push({ status: 'success', eventType: receivedEventType });
        } catch (error) {
            console.error(JSON.stringify({ error: error.message, record: record.messageId }));
            results.push({ status: 'error', error: error.message });
        }
    }

    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
};
`;
		const zip = new AdmZip();
		zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));
		const zipBuffer = zip.toBuffer();

		const lambdaParams: AWS.Lambda.CreateFunctionRequest = {
			FunctionName: lambdaName,
			Runtime: 'nodejs22.x',
			Role: roleArn,
			Handler: 'index.handler',
			Code: {
				ZipFile: zipBuffer,
			},
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
		};

		// Create Lambda with IAM role propagation retry
		const lambdaResult = await createLambdaWithRoleRetry(lambda, lambdaParams);

		await lambda
			.waitFor('functionActive', {
				FunctionName: lambdaName,
				$waiter: {
					delay: 5,
					maxAttempts: 12,
				},
			})
			.promise();

		// 4. CREATE EVENT SOURCE MAPPING (SQS → Lambda)
		const eventSourceParams = {
			EventSourceArn: queueArn,
			FunctionName: lambdaName,
			BatchSize: 10,
			MaximumBatchingWindowInSeconds: 5,
			Enabled: true,
		};

		const mappingResult = await lambda.createEventSourceMapping(eventSourceParams).promise();

		return {
			queueUrl: queueUrl,
			queueArn: queueArn,
			queueName: queueName,
			lambdaFunctionName: lambdaName,
			lambdaFunctionArn: lambdaResult.FunctionArn,
			iamRoleArn: roleArn,
			iamRoleName: roleName,
			eventSourceMappingUuid: mappingResult.UUID,
			eventType: eventType,
			region: awsCredentials.awsRegion,
			accountId: accountId,
			webhookUrl: webhookUrl,
			created: true,
			createdAt: new Date().toISOString(),
		};
	} catch (err) {
		const error = err as Record<string, unknown>;

		// Check for specific AWS credential issues
		if (error.code === 'InvalidUserID.NotFound' || error.code === 'SignatureDoesNotMatch') {
			throw new NodeOperationError(
				node ?? ({} as INode),
				'AWS credentials are invalid. Please check your AWS Access Key ID and Secret Access Key.',
			);
		}

		// Check for permission issues
		if (error.code === 'AccessDenied' || error.code === 'UnauthorizedOperation') {
			throw new NodeOperationError(
				node ?? ({} as INode),
				'AWS permissions denied. Ensure your credentials have permissions for SQS, Lambda, and IAM operations.',
			);
		}

		throw new NodeOperationError(
			node ?? ({} as INode),
			'Failed to create AWS infrastructure. Check the n8n execution log for details.',
		);
	}
}

/**
 * Delete AWS infrastructure (Lambda, SQS, IAM Role)
 */
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
					.deleteEventSourceMapping({
						UUID: infrastructure.eventSourceMappingUuid,
					})
					.promise();
			} catch {
				// Deletion is best-effort
			}
			// Deletion is best-effort; proceed without waiting
		}

		// 2. DELETE LAMBDA FUNCTION
		if (infrastructure.lambdaFunctionName) {
			try {
				await lambda
					.deleteFunction({
						FunctionName: infrastructure.lambdaFunctionName,
					})
					.promise();
			} catch {
				// Deletion is best-effort
			}
		}

		// 3. DELETE SQS QUEUE
		if (infrastructure.queueUrl) {
			try {
				await sqs
					.deleteQueue({
						QueueUrl: infrastructure.queueUrl,
					})
					.promise();
			} catch {
				// Deletion is best-effort
			}
		}

		// 4. DELETE IAM ROLE POLICIES AND ROLE
		if (infrastructure.iamRoleName) {
			try {
				// Delete CloudWatch inline policy
				const cwPolicyName = `${infrastructure.iamRoleName}-cloudwatch-policy`;
				try {
					await iam
						.deleteRolePolicy({
							RoleName: infrastructure.iamRoleName,
							PolicyName: cwPolicyName,
						})
						.promise();
				} catch {
					// Deletion is best-effort
				}

				// Delete CloudWatch log group
				if (infrastructure.lambdaFunctionName) {
					const cloudwatchlogs = new AWS.CloudWatchLogs(clientConfig);
					try {
						await cloudwatchlogs
							.deleteLogGroup({
								logGroupName: `/aws/lambda/${infrastructure.lambdaFunctionName}`,
							})
							.promise();
					} catch {
						// Deletion is best-effort
					}
				}

				// Delete SQS inline policy
				const inlinePolicyName = `${infrastructure.iamRoleName}-sqs-policy`;
				try {
					await iam
						.deleteRolePolicy({
							RoleName: infrastructure.iamRoleName,
							PolicyName: inlinePolicyName,
						})
						.promise();
				} catch {
					// Deletion is best-effort
				}

				// Detach managed policies
				try {
					await iam
						.detachRolePolicy({
							RoleName: infrastructure.iamRoleName,
							PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
						})
						.promise();
				} catch {
					// Deletion is best-effort
				}

				// Delete the role
				await iam
					.deleteRole({
						RoleName: infrastructure.iamRoleName,
					})
					.promise();
			} catch {
				// Deletion is best-effort
			}
		}
	} catch {
		throw new NodeOperationError(
			node ?? ({} as INode),
			'Failed to delete AWS infrastructure. You may need to manually clean up resources in the AWS Console.',
		);
	}
}
