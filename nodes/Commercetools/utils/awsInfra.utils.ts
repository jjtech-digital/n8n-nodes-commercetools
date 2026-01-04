import AWS from "aws-sdk";
import { INode, NodeOperationError } from "n8n-workflow";
import AdmZip from 'adm-zip';

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
    accessKeyId?: string;
    secretAccessKey?: string;
    webhookUrl?: string;
    lambdaCode?: string;
    created?: boolean;
    createdAt?: string;
};
// Real AWS SDK functions for infrastructure creation
export async function createRealAWSInfrastructure(awsCredentials: Record<string, string>, eventType: string, webhookUrl?: string): Promise<AWSResponse> {

    // Generate unique names based on event and timestamp
    const timestamp = Date.now();
    const queueName = `commercetools-${eventType.toLowerCase()}-events-${timestamp}`;
    const lambdaName = `commercetools-${eventType.toLowerCase()}-processor-${timestamp}`;
    const roleName = `commercetools-${eventType.toLowerCase()}-lambda-role-${timestamp}`;

    try {
        // Initialize AWS clients
        AWS.config.update({
            accessKeyId: awsCredentials.awsAccessKeyId,
            secretAccessKey: awsCredentials.awsSecretAccessKey,
            region: awsCredentials.awsRegion
        });

        const sqs = new AWS.SQS();
        const lambda = new AWS.Lambda();
        const iam = new AWS.IAM();
        const sts = new AWS.STS();

        // Get AWS Account ID
        const identity = await sts.getCallerIdentity().promise();
        const accountId = identity.Account;

        // 1. CREATE SQS QUEUE
        const queueParams = {
            QueueName: queueName,
            Attributes: {
                'VisibilityTimeout': '300',
                'MessageRetentionPeriod': '1209600', // 14 days
                'ReceiveMessageWaitTimeSeconds': '20' // Long polling
            }
        };

        const queueResult = await sqs.createQueue(queueParams).promise();
        const queueUrl = queueResult.QueueUrl;
        const queueArn = `arn:aws:sqs:${awsCredentials.awsRegion}:${accountId}:${queueName}`;

        // 2. CREATE IAM ROLE FOR LAMBDA
        const assumeRolePolicyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: { Service: 'lambda.amazonaws.com' },
                    Action: 'sts:AssumeRole'
                }
            ]
        };

        const roleParams = {
            RoleName: roleName,
            AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument),
            Description: `IAM role for CommerceTools ${eventType} Lambda processor`
        };

        const roleResult = await iam.createRole(roleParams).promise();
        const roleArn = roleResult.Role.Arn;

        // Attach basic Lambda execution policy
        await iam.attachRolePolicy({
            RoleName: roleName,
            PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        }).promise();

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
                        'sqs:ChangeMessageVisibility'
                    ],
                    Resource: queueArn
                }
            ]
        };

        await iam.putRolePolicy({
            RoleName: roleName,
            PolicyName: `${roleName}-sqs-policy`,
            PolicyDocument: JSON.stringify(sqsPolicyDocument)
        }).promise();

        // Wait for role to be available
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

        // 3. CREATE LAMBDA FUNCTION

        // Lambda function code
        const lambdaCode = `
        const https = require('https');
        const http = require('http');

        function sendWebhookResponse(webhookUrl, payload) {
            return new Promise((resolve, reject) => {
                const data = JSON.stringify(payload);
                const url = new URL(webhookUrl);
                const options = {
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': data.length,
                        'User-Agent': 'CommerceTools-Lambda-Processor/1.0'
                    }
                };

                const client = url.protocol === 'https:' ? https : http;
                const req = client.request(options, (res) => {
                    let responseData = '';
                    res.on('data', (chunk) => responseData += chunk);
                    res.on('end', () => {
                        resolve({ statusCode: res.statusCode, data: responseData });
                    });
                });

                req.on('error', (err) => {
                    reject(err);
                });

                req.write(data);
                req.end();
            });
        }

        exports.handler = async (event, context) => {
            const results = [];
            const projectKey = process.env.CTP_PROJECT_KEY;
            const webhookUrl = process.env.WEBHOOK_URL|| "";

            for (const record of event.Records) {
                try {
                    const messageBody = JSON.parse(record.body);
                    const eventType = messageBody.type;

                    if (eventType === '${eventType}') {
                        // Prepare webhook payload
                        const webhookPayload = {
                            eventType: eventType,
                            product: messageBody?.productProjection,
                            source: 'CommerceTools-Lambda',
                            processed: true,
                            message: 'Product ${eventType.toLowerCase()} event processed successfully'
                        };

                        // Send webhook response if URL is configured
                        if (webhookUrl) {
                            try {
                                const webhookResult = await sendWebhookResponse(webhookUrl, webhookPayload);

                                webhookPayload.webhookStatus = 'sent';
                                webhookPayload.webhookResponse = {
                                    statusCode: webhookResult.statusCode,
                                };
                            } catch (webhookError) {
                                webhookPayload.webhookStatus = 'failed';
                                webhookPayload.webhookError = webhookError.message;
                            }
                        } else {
                            webhookPayload.webhookStatus = 'skipped';
                        }

                        // Simulate some business processing
                        await new Promise(resolve => setTimeout(resolve, 100));
                        results.push({
                            status: 'success',
                            processedAt: new Date().toISOString(),
                            projectKey: projectKey,
                            payload: webhookPayload
                        });
                    } else {
                        results.push({
                            status: 'ignored',
                            eventType: eventType,
                            reason: 'Event type not configured for processing',
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    results.push({
                        status: 'error',
                        error: error.message,
                        stack: error.stack,
                        record: record.body,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Final response
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'CommerceTools ${eventType} events processed successfully',
                    processedEvents: results.length,
                    successfulEvents: results.filter(r => r.status === 'success').length,
                    ignoredEvents: results.filter(r => r.status === 'ignored').length,
                    errorEvents: results.filter(r => r.status === 'error').length,
                    webhookUrl: webhookUrl ? 'configured' : 'not configured',
                    results: results
                })
            };

            return response;
        };
`;
        const zip = new AdmZip();

        // Add the Lambda function code to the ZIP as index.js
        zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));

        // Get the ZIP buffer
        const zipBuffer = zip.toBuffer();

        const lambdaParams = {
            FunctionName: lambdaName,
            Runtime: 'nodejs18.x',
            Role: roleArn,
            Handler: 'index.handler',
            Code: {
                ZipFile: zipBuffer
            },
            Description: `CommerceTools ${eventType} event processor`,
            Timeout: 300,
            Environment: {
                Variables: {
                    CTP_PROJECT_KEY: 'n8n-ct-integration',
                    EVENT_TYPE: eventType,
                    QUEUE_NAME: queueName,
                    WEBHOOK_URL: webhookUrl || ""
                }
            }
        };

        const lambdaResult = await lambda.createFunction(lambdaParams).promise();

        await lambda.waitFor('functionActive', {
            FunctionName: lambdaName,
            $waiter: {
                delay: 5,
                maxAttempts: 12
            }
        }).promise();

        // 4. CREATE EVENT SOURCE MAPPING (SQS → Lambda)
        const eventSourceParams = {
            EventSourceArn: queueArn,
            FunctionName: lambdaName,
            BatchSize: 10,
            MaximumBatchingWindowInSeconds: 5,
            Enabled: true
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
            accessKeyId: awsCredentials.awsAccessKeyId,
            secretAccessKey: awsCredentials.awsSecretAccessKey,
            webhookUrl: webhookUrl,
            lambdaCode: lambdaCode,
            created: true,
            createdAt: new Date().toISOString()
        };

    } catch (err) {
        const error = err as Record<string, unknown>;
        if (error.code) {
            console.error(`AWS Error Code: ${error.code}`);
        }
        if (error.message) {
            console.error(`AWS Error Message: ${error.message}`);
        }
        if (error.statusCode) {
            console.error(`AWS Status Code: ${error.statusCode}`);
        }

        // Check for specific AWS credential issues
        if (error.code === 'InvalidUserID.NotFound' || error.code === 'SignatureDoesNotMatch') {
            throw new NodeOperationError(
                {} as INode,
                `AWS credentials are invalid. Please check your AWS Access Key ID and Secret Access Key. Error: ${error.message}`
            );
        }

        // Check for permission issues
        if (error.code === 'AccessDenied' || error.code === 'UnauthorizedOperation') {
            throw new NodeOperationError(
                {} as INode,
                `AWS permissions denied. Please ensure your AWS credentials have permissions for SQS, Lambda, and IAM operations. Error: ${error.message}`
            );
        }

        throw new NodeOperationError(
            {} as INode,
            `Failed to create AWS infrastructure: ${error.message || error}`
        );
    }
}

/**
 * Delete AWS infrastructure (Lambda, SQS, IAM Role)
 */
export async function deleteAWSInfrastructure(awsCredentials: Record<string, string>, infrastructure: AWSResponse): Promise<void> {

    try {
        // Initialize AWS clients
        AWS.config.update({
            accessKeyId: awsCredentials.awsAccessKeyId,
            secretAccessKey: awsCredentials.awsSecretAccessKey,
            region: infrastructure.region
        });

        const lambda = new AWS.Lambda();
        const sqs = new AWS.SQS();
        const iam = new AWS.IAM();

        // 1. DELETE EVENT SOURCE MAPPING
        if (infrastructure.eventSourceMappingUuid) {
            try {
                await lambda.deleteEventSourceMapping({
                    UUID: infrastructure.eventSourceMappingUuid
                }).promise();
            } catch (error) {
                if (error.code !== 'ResourceNotFoundException') {
                    console.error('⚠️  Error deleting Event Source Mapping:', error.message);
                }
            }

            // Wait for event source mapping to be fully deleted
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // 2. DELETE LAMBDA FUNCTION
        if (infrastructure.lambdaFunctionName) {
            try {
                await lambda.deleteFunction({
                    FunctionName: infrastructure.lambdaFunctionName
                }).promise();
            } catch (error) {
                if (error.code !== 'ResourceNotFoundException') {
                    console.error('⚠️  Error deleting Lambda Function:', error.message);
                }
            }
        }

        // 3. DELETE SQS QUEUE
        if (infrastructure.queueUrl) {
            try {
                await sqs.deleteQueue({
                    QueueUrl: infrastructure.queueUrl
                }).promise();
            } catch (error) {
                if (error.code !== 'AWS.SimpleQueueService.NonExistentQueue') {
                    console.error('⚠️  Error deleting SQS Queue:', error.message);
                }
            }
        }

        // 4. DELETE IAM ROLE POLICIES AND ROLE
        if (infrastructure.iamRoleName) {

            try {
                // Delete inline policies
                const inlinePolicyName = `${infrastructure.iamRoleName}-sqs-policy`;
                try {
                    await iam.deleteRolePolicy({
                        RoleName: infrastructure.iamRoleName,
                        PolicyName: inlinePolicyName
                    }).promise();
                } catch (error) {
                    if (error.code !== 'NoSuchEntity') {
                        console.error('⚠️  Error deleting inline policy:', error.message);
                    }
                }

                // Detach managed policies
                try {
                    await iam.detachRolePolicy({
                        RoleName: infrastructure.iamRoleName,
                        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
                    }).promise();
                } catch (error) {
                    if (error.code !== 'NoSuchEntity') {
                        console.error('⚠️  Error detaching managed policy:', error.message);
                    }
                }

                // Delete the role
                await iam.deleteRole({
                    RoleName: infrastructure.iamRoleName
                }).promise();
            } catch (error) {
                if (error.code !== 'NoSuchEntity') {
                    console.error('⚠️  Error deleting IAM Role:', error.message);
                }
            }
        }


    } catch (error) {
        console.error('❌ Error during AWS infrastructure deletion:', error);
        throw new NodeOperationError(
            {} as INode,
            `Failed to delete AWS infrastructure: ${error.message || error}. You may need to manually clean up resources in the AWS Console.`
        );
    }
}