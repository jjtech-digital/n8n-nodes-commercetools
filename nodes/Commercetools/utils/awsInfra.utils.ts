import AdmZip from "adm-zip";
import AWS from "aws-sdk";
import { INode, NodeOperationError } from "n8n-workflow";

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
    const queueName = `ct-${eventType.toLowerCase()}-events-${timestamp}`;
    const lambdaName = `ct-${eventType.toLowerCase()}-processor-${timestamp}`;
    const roleName = `ct-${eventType.toLowerCase()}-lambda-role-${timestamp}`;

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

        // Add explicit CloudWatch Logs permissions (belt and suspenders approach)
        const cloudWatchPolicyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    Resource: 'arn:aws:logs:*:*:*'
                }
            ]
        };

        await iam.putRolePolicy({
            RoleName: roleName,
            PolicyName: `${roleName}-cloudwatch-policy`,
            PolicyDocument: JSON.stringify(cloudWatchPolicyDocument)
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

        /**
         * Send webhook response to n8n
         */
        function sendWebhookResponse(webhookUrl, payload) {
            return new Promise((resolve, reject) => {
                console.log('═══════════════════════════════════════════════════════════');
                console.log('📤 SENDING WEBHOOK TO N8N');
                console.log('═══════════════════════════════════════════════════════════');
                console.log('🔗 Webhook URL:', webhookUrl);
                
                const data = JSON.stringify(payload);
                console.log('📦 Payload Size:', data.length, 'bytes');
                console.log('📦 Payload Preview (first 500 chars):', data.substring(0, 500));
                
                const url = new URL(webhookUrl);
                
                const options = {
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Length': Buffer.byteLength(data, 'utf8'),
                        'User-Agent': 'CommerceTools-Lambda-Processor/1.0',
                        'Accept': 'application/json'
                    }
                };
                
                console.log('📋 Request Options:', JSON.stringify(options, null, 2));

                const client = url.protocol === 'https:' ? https : http;
                
                const req = client.request(options, (res) => {
                    console.log('✅ Response Status:', res.statusCode, res.statusMessage);
                    
                    let responseData = '';
                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });
                    
                    res.on('end', () => {
                        console.log('✅ Webhook Response:');
                        console.log('═══════════════════════════════════════════════════════════');
                        resolve({ statusCode: res.statusCode, data: responseData });
                    });
                });

                req.on('error', (err) => {
                    console.error('═══════════════════════════════════════════════════════════');
                    console.error('❌ WEBHOOK ERROR');
                    console.error('Error:', err.message);
                    console.error('Error Stack:', err.stack);
                    console.error('═══════════════════════════════════════════════════════════');
                    reject(err);
                });

                req.write(data, 'utf8');
                req.end();
                console.log('📤 Webhook request sent');
            });
        }

        /**
         * Lambda Handler - Process CommerceTools events from SQS
         */
        exports.handler = async (event, context) => {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🎯 LAMBDA FUNCTION TRIGGERED');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📋 Request ID:', context.requestId);
            console.log('📋 Function Name:', context.functionName);
            console.log('📋 Function Version:', context.functionVersion);
            console.log('📋 Memory Limit:', context.memoryLimitInMB, 'MB');
            console.log('═══════════════════════════════════════════════════════════');
            
            const results = [];
            const projectKey = process.env.CTP_PROJECT_KEY;
            const eventType = process.env.EVENT_TYPE;
            const webhookUrl = process.env.WEBHOOK_URL || "";
            
            console.log('⚙️  Environment Variables:');
            console.log('   CTP_PROJECT_KEY:', projectKey);
            console.log('   EVENT_TYPE:', eventType);
            console.log('   WEBHOOK_URL:', webhookUrl ? 'Configured ✅' : 'Not configured ⚠️');
            console.log('═══════════════════════════════════════════════════════════');
            
            console.log('📊 Processing', event.Records?.length || 0, 'record(s)');
            console.log('═══════════════════════════════════════════════════════════');
            
            for (const record of event.Records || []) {
                console.log('───────────────────────────────────────────────────────────');
                console.log('📦 Processing Record');
                console.log('───────────────────────────────────────────────────────────');
                
                try {
                    // Parse the SQS message body
                    console.log('📦 Record Body Type:', typeof record.body);
                    const messageBody = typeof record.body === 'string' 
                        ? JSON.parse(record.body) 
                        : record.body;
                    
                    console.log('📦 Event Type:', messageBody.type);
                    
                    const receivedEventType = messageBody.type;

                    // Check if event type matches what we're configured for
                    if (receivedEventType === eventType) {
                        console.log('✅ Event type matches:', eventType);
                        
                        // Extract product data
                        const product = messageBody?.productProjection || messageBody?.resource || {};
                        
                        // Prepare webhook payload
                        const webhookPayload = {
                            eventType: receivedEventType,
                            product: product,
                            rawMessage: messageBody,
                            source: 'CommerceTools-Lambda',
                            processed: true,
                            message: \`Product ${eventType.toLowerCase()} event processed successfully\`,
                            timestamp: new Date().toISOString(),
                            projectKey: projectKey
                        };
                        
                        console.log('📦 Webhook Payload Prepared');

                        // Send webhook response if URL is configured
                        if (webhookUrl) {
                            console.log('📤 Sending webhook to n8n...');
                            try {
                                const webhookResult = await sendWebhookResponse(webhookUrl, webhookPayload);
                                
                                webhookPayload.webhookStatus = 'sent';
                                webhookPayload.webhookResponse = {
                                    statusCode: webhookResult.statusCode,
                                    timestamp: new Date().toISOString()
                                };
                                
                                console.log('✅ Webhook sent successfully');
                            } catch (webhookError) {
                                console.error('❌ Webhook failed:', webhookError.message);
                                
                                webhookPayload.webhookStatus = 'failed';
                                webhookPayload.webhookError = webhookError.message;
                            }
                        } else {
                            console.warn('⚠️  No webhook URL configured - skipping webhook');
                            webhookPayload.webhookStatus = 'skipped';
                        }

                        // Simulate business processing
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        results.push({
                            status: 'success',
                            processedAt: new Date().toISOString(),
                            projectKey: projectKey,
                            eventType: receivedEventType,
                            productId: product.id || 'N/A',
                            webhookStatus: webhookPayload.webhookStatus
                        });
                        
                        console.log('✅ Record processed successfully');
                        
                    } else {
                        console.log('⚠️  Event type mismatch');
                        console.log('   Expected:', eventType);
                        console.log('   Received:', receivedEventType);
                        
                        results.push({
                            status: 'ignored',
                            eventType: receivedEventType,
                            expectedEventType: eventType,
                            reason: 'Event type not configured for processing',
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                } catch (error) {
                    console.error('❌ Error processing record');
                    console.error('Error Message:', error.message);
                    console.error('Error Stack:', error.stack);
                    
                    results.push({
                        status: 'error',
                        error: error.message,
                        stack: error.stack,
                        record: record.body,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            console.log('═══════════════════════════════════════════════════════════');
            console.log('📊 PROCESSING SUMMARY');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('Total Records:', results.length);
            console.log('Successful:', results.filter(r => r.status === 'success').length);
            console.log('Ignored:', results.filter(r => r.status === 'ignored').length);
            console.log('Errors:', results.filter(r => r.status === 'error').length);
            console.log('═══════════════════════════════════════════════════════════');

            // Prepare Lambda response (for SQS, not sent to n8n)
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: \`CommerceTools ${ eventType } events processed successfully\`,
                    processedEvents: results.length,
                    successfulEvents: results.filter(r => r.status === 'success').length,
                    ignoredEvents: results.filter(r => r.status === 'ignored').length,
                    errorEvents: results.filter(r => r.status === 'error').length,
                    webhookUrl: webhookUrl ? 'configured' : 'not configured',
                    results: results,
                    timestamp: new Date().toISOString()
                })
            };
            
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🎉 Lambda Execution Complete');
            console.log('═══════════════════════════════════════════════════════════');
            
            return response;
        };
`;
        const zip = new AdmZip();
        zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));
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
            } catch {
                //TODO:
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
            } catch {
                //TODO:
            }
        }

        // 3. DELETE SQS QUEUE
        if (infrastructure.queueUrl) {
            try {
                await sqs.deleteQueue({
                    QueueUrl: infrastructure.queueUrl
                }).promise();
            } catch {
                //TODO:
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
                } catch {
                    //TODO:
                }

                // Detach managed policies
                try {
                    await iam.detachRolePolicy({
                        RoleName: infrastructure.iamRoleName,
                        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
                    }).promise();
                } catch {
                    //TODO:
                }

                // Delete the role
                await iam.deleteRole({
                    RoleName: infrastructure.iamRoleName
                }).promise();
            } catch {
                //TODO:
            }
        }


    } catch (error) {
        throw new NodeOperationError(
            {} as INode,
            `Failed to delete AWS infrastructure: ${error.message || error}. You may need to manually clean up resources in the AWS Console.`
        );
    }
}