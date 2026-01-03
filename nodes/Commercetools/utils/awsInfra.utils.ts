import AWS from "aws-sdk";
import { NodeOperationError } from "n8n-workflow";

// Real AWS SDK functions for infrastructure creation
export async function createRealAWSInfrastructure(awsCredentials: any, eventType: string, webhookUrl?: string): Promise<any> {
    const AWS_REGION = 'us-east-1';

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
            region: AWS_REGION
        });

        const sqs = new AWS.SQS();
        const lambda = new AWS.Lambda();
        const iam = new AWS.IAM();
        const sts = new AWS.STS();

        // Get AWS Account ID
        const identity = await sts.getCallerIdentity().promise();
        const accountId = identity.Account;

        // 1. CREATE SQS QUEUE
        console.log('🔧 Creating SQS Queue...', queueName);
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
        const queueArn = `arn:aws:sqs:${AWS_REGION}:${accountId}:${queueName}`;

        console.log(`✅ SQS Queue created`);

        // 2. CREATE IAM ROLE FOR LAMBDA
        console.log('🔐 Creating IAM Role for Lambda...', lambdaName);
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

        console.log(`✅ IAM Role created`, roleName);

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

        console.log('✅ IAM Role policies attached');

        // Wait for role to be available
        console.log('⏳ Waiting for IAM role to propagate...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

        // 3. CREATE LAMBDA FUNCTION
        console.log('⚡ Creating Lambda Function...');

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
            const webhookUrl = "https://7614d35316a2.ngrok-free.app/webhook-test/5d606908-2a19-435a-a514-af3074dcc256/commercetools-product-events";

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

        const AdmZip = require('adm-zip');
        const zip = new AdmZip();

        // Add the Lambda function code to the ZIP as index.js
        zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));

        // Get the ZIP buffer
        const zipBuffer = zip.toBuffer();

        console.log(`📦 Lambda package created: ${zipBuffer.length} bytes`);

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
                    WEBHOOK_URL: "https://7614d35316a2.ngrok-free.app/webhook-test/5d606908-2a19-435a-a514-af3074dcc256/commercetools-product-events"
                }
            }
        };

        const lambdaResult = await lambda.createFunction(lambdaParams).promise();

        console.log('⏳ Waiting for Lambda to become ACTIVE...');

        await lambda.waitFor('functionActive', {
            FunctionName: lambdaName,
            $waiter: {
                delay: 5,
                maxAttempts: 12
            }
        }).promise();

        console.log('✅ Lambda is ACTIVE');

        // 4. CREATE EVENT SOURCE MAPPING (SQS → Lambda)
        console.log('🔗 Creating Event Source Mapping (SQS → Lambda)...');

        const eventSourceParams = {
            EventSourceArn: queueArn,
            FunctionName: lambdaName,
            BatchSize: 10,
            MaximumBatchingWindowInSeconds: 5,
            Enabled: true
        };

        const mappingResult = await lambda.createEventSourceMapping(eventSourceParams).promise();
        console.log('✅ Event Source Mapping created successfully');

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
            region: AWS_REGION,
            accountId: accountId,
            accessKeyId: awsCredentials.awsAccessKeyId,
            secretAccessKey: awsCredentials.awsSecretAccessKey,
            webhookUrl: webhookUrl,
            lambdaCode: lambdaCode,
            created: true,
            createdAt: new Date().toISOString()
        };

    } catch (error) {
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
                {} as any,
                `AWS credentials are invalid. Please check your AWS Access Key ID and Secret Access Key. Error: ${error.message}`
            );
        }

        // Check for permission issues
        if (error.code === 'AccessDenied' || error.code === 'UnauthorizedOperation') {
            throw new NodeOperationError(
                {} as any,
                `AWS permissions denied. Please ensure your AWS credentials have permissions for SQS, Lambda, and IAM operations. Error: ${error.message}`
            );
        }

        throw new NodeOperationError(
            {} as any,
            `Failed to create AWS infrastructure: ${error.message || error}`
        );
    }
}