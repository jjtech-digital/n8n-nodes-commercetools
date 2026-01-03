import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Real AWS SDK functions for infrastructure creation
async function createRealAWSInfrastructure(awsCredentials: any, eventType: string, webhookUrl?: string): Promise<any> {
	const AWS_REGION = 'us-east-1';
	
	console.log('🚀 Creating REAL AWS infrastructure automatically...');
	
	// Generate unique names based on event and timestamp
	const timestamp = Date.now();
	const queueName = `commercetools-${eventType.toLowerCase()}-events-${timestamp}`;
	const lambdaName = `commercetools-${eventType.toLowerCase()}-processor-${timestamp}`;
	const roleName = `commercetools-${eventType.toLowerCase()}-lambda-role-${timestamp}`;
	
	console.log(`🔧 Creating SQS Queue: ${queueName}`);
	console.log(`⚡ Creating Lambda Function: ${lambdaName}`);
	console.log(`🔐 Creating IAM Role: ${roleName}`);
	
	try {
		// Initialize AWS clients
		const AWS = require('aws-sdk');
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
		
		console.log(`📋 AWS Account ID: ${accountId}`);
		
		// 1. CREATE SQS QUEUE
		console.log('🔧 Creating SQS Queue...');
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
		
		console.log(`✅ SQS Queue created: ${queueUrl}`);
		
		// 2. CREATE IAM ROLE FOR LAMBDA
		console.log('🔐 Creating IAM Role for Lambda...');
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
		
		console.log(`✅ IAM Role created: ${roleArn}`);
		
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
const AWS = require('aws-sdk');
const https = require('https');
const http = require('http');

// Helper function to send webhook response
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
                console.log(\`✅ Webhook response sent: \${res.statusCode}\`);
                resolve({ statusCode: res.statusCode, data: responseData });
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Webhook error:', err);
            reject(err);
        });
        
        req.write(data);
        req.end();
    });
}

exports.handler = async (event, context) => {
    console.log('🎯 Processing CommerceTools ${eventType} Events:', JSON.stringify(event, null, 2));
    
    const results = [];
    const projectKey = process.env.CTP_PROJECT_KEY || 'n8n-ct-integration';
    const webhookUrl = process.env.WEBHOOK_URL;
    
    console.log(\`📋 Project Key: \${projectKey}\`);
    console.log(\`🔗 Webhook URL: \${webhookUrl ? 'Configured' : 'Not configured'}\`);
    
    for (const record of event.Records) {
        try {
            const messageBody = JSON.parse(record.body);
            const eventType = messageBody.type;
            const resource = messageBody.resource;
            
            console.log(\`📦 Processing \${eventType} for project: \${projectKey}\`);
            
            if (eventType === '${eventType}') {
                console.log('✅ ${eventType} Event Processed Successfully!');
                
                // Extract product information
                const productId = resource.id;
                const productKey = resource.key || 'N/A';
                const version = resource.version || 1;
                const masterVariant = resource.masterData?.current?.masterVariant;
                const sku = masterVariant?.sku || 'N/A';
                const productName = resource.masterData?.current?.name || {};
                const categories = resource.masterData?.current?.categories || [];
                
                console.log(\`📦 Product ID: \${productId}\`);
                console.log(\`🏷️  Product Key: \${productKey}\`);
                console.log(\`🔖 SKU: \${sku}\`);
                console.log(\`📝 Version: \${version}\`);
                console.log(\`📂 Categories: \${categories.length}\`);
                
                // Prepare webhook payload
                const webhookPayload = {
                    eventType: eventType,
                    timestamp: new Date().toISOString(),
                    projectKey: projectKey,
                    product: {
                        id: productId,
                        key: productKey,
                        version: version,
                        sku: sku,
                        name: productName,
                        categories: categories,
                        masterVariant: masterVariant
                    },
                    source: 'CommerceTools-Lambda',
                    processed: true,
                    message: 'Product ${eventType.toLowerCase()} event processed successfully'
                };
                
                // Send webhook response if URL is configured
                if (webhookUrl) {
                    try {
                        console.log('📤 Sending webhook response...');
                        const webhookResult = await sendWebhookResponse(webhookUrl, webhookPayload);
                        console.log(\`✅ Webhook sent successfully: \${webhookResult.statusCode}\`);
                        
                        webhookPayload.webhookStatus = 'sent';
                        webhookPayload.webhookResponse = webhookResult;
                    } catch (webhookError) {
                        console.error('❌ Webhook failed:', webhookError);
                        webhookPayload.webhookStatus = 'failed';
                        webhookPayload.webhookError = webhookError.message;
                    }
                } else {
                    console.log('⚠️  No webhook URL configured - skipping webhook response');
                    webhookPayload.webhookStatus = 'skipped';
                }
                
                // YOUR CUSTOM BUSINESS LOGIC HERE:
                // - Update inventory systems
                // - Send notifications
                // - Trigger workflows  
                // - Update analytics
                // - Call external APIs
                // - Process product data
                
                console.log('🔄 Processing product in business systems...');
                
                // Simulate some business processing
                await new Promise(resolve => setTimeout(resolve, 100));
                
                results.push({
                    status: 'success',
                    eventType: eventType,
                    productId: productId,
                    productKey: productKey,
                    sku: sku,
                    version: version,
                    processedAt: new Date().toISOString(),
                    projectKey: projectKey,
                    webhookStatus: webhookPayload.webhookStatus,
                    payload: webhookPayload
                });
                
                console.log(\`✅ Product \${productId} processed successfully\`);
                
            } else {
                console.log(\`⚠️  Unhandled event type: \${eventType}\`);
                results.push({
                    status: 'ignored',
                    eventType: eventType,
                    reason: 'Event type not configured for processing',
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ Error processing record:', error);
            results.push({
                status: 'error',
                error: error.message,
                record: record.body,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    console.log(\`📊 Processing complete: \${results.length} events processed\`);
    
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
            projectKey: projectKey,
            results: results,
            timestamp: new Date().toISOString()
        })
    };
    
    console.log('🎉 Lambda processing completed successfully!');
    return response;
};
`;
		
		// Create a proper ZIP file for Lambda deployment
		console.log('📦 Creating Lambda deployment package...');
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
					WEBHOOK_URL: webhookUrl || ''
				}
			}
		};
		
		const lambdaResult = await lambda.createFunction(lambdaParams).promise();
		console.log(`✅ Lambda Function created: ${lambdaResult.FunctionArn}`);
		
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
		
		console.log('🎉 AWS Infrastructure created successfully!');
		
		return {
			queueUrl: queueUrl,
			queueArn: queueArn,
			lambdaFunctionName: lambdaName,
			lambdaFunctionArn: lambdaResult.FunctionArn,
			iamRoleArn: roleArn,
			eventSourceMappingUuid: mappingResult.UUID,
			region: AWS_REGION,
			accountId: accountId,
			accessKeyId: awsCredentials.awsAccessKeyId,
			secretAccessKey: awsCredentials.awsSecretAccessKey,
			lambdaCode: lambdaCode,
			created: true
		};
		
	} catch (error) {
		console.error('❌ Error creating AWS infrastructure:', error);
		
		// Provide detailed error information for debugging
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

type StaticSubscriptionData = IDataObject & {
	subscriptionId?: string;
	awsInfrastructure?: any;
};

async function getBaseUrl(this: IHookFunctions | IWebhookFunctions): Promise<string> {
	const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;

	const projectKey = credentials.projectKey as string;
	const region = (credentials.region as string) || 'australia-southeast1.gcp';

	if (!projectKey) {
		throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials');
	}

	return `https://api.${region}.commercetools.com/${projectKey}`;
}

async function fetchSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string) {
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'GET',
		url: `${baseUrl}/subscriptions/${subscriptionId}`,
	});
}

async function deleteSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string, version: number) {
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'DELETE',
		url: `${baseUrl}/subscriptions/${subscriptionId}`,
		qs: {
			version,
		},
	});
}

async function createSubscription(
	this: IHookFunctions,
	params: {
		baseUrl: string;
		webhookUrl?: string;
		awsInfrastructure?: any;
		events: string[];
		useAWS: boolean;
	},
) {
	const { baseUrl, webhookUrl, awsInfrastructure, events, useAWS } = params;

	let body: IDataObject;

	if (useAWS && awsInfrastructure) {
		// Use SQS destination with proper CommerceTools API structure
		const destination: IDataObject = {
			type: 'SQS',
			queueUrl: awsInfrastructure.queueUrl,
			region: awsInfrastructure.region,
		};

		if (awsInfrastructure.accessKeyId && awsInfrastructure.secretAccessKey) {
			// Use Credentials authentication mode with proper field names
			destination.authenticationMode = 'Credentials';
			destination.accessKey = awsInfrastructure.accessKeyId;      // AccessKey ID
			destination.accessSecret = awsInfrastructure.secretAccessKey;  // Secret Access Key
			console.log('🔑 Using AWS Credentials authentication for SQS subscription');
		} else {
			// For IAM role-based auth, credentials must be omitted
			destination.authenticationMode = 'IAM';
			console.log('🔑 Using IAM authentication for SQS subscription');
		}

		body = {
			destination,
			messages: [
				{
					resourceTypeId: 'product',
					types: events,
				},
			],
		};
		console.log(`🔗 Creating CommerceTools subscription with SQS destination: ${awsInfrastructure.queueUrl}`);
	} else {
		// Use HTTP webhook destination
		body = {
			destination: {
				type: 'HTTP',
				url: webhookUrl,
			},
			messages: [
				{
					resourceTypeId: 'product',
					types: events,
				},
			],
		};
		console.log(`🔗 Creating CommerceTools subscription with HTTP destination: ${webhookUrl}`);
	}
	
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/subscriptions`,
		body,
	});
}

export class CommercetoolsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Commercetools Trigger',
		name: 'commercetoolsTrigger',
		icon: 'file:Commercetools.svg',
		group: ['trigger'],
		version: 1,
		description: 'Subscribe to Commercetools product events. Automatically creates AWS SQS + Lambda when AWS credentials are provided.',
		defaults: {
			name: 'Commercetools Trigger',
		},
		codex: {
			categories: ['Commercetools', 'Integration', 'Product'],
			subcategories: {
				Commercetools: ['Product'],
			},
			alias: ['commercetools', 'Commercetools'],
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'commerceToolsOAuth2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'commercetools-product-events',
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Product Events',
				name: 'productEvents',
				type: 'multiOptions',
				noDataExpression: true,
				required: true,
				options: [
					{
						name: 'Product Published',
						value: 'ProductPublished',
					},
					{
						name: 'Product Created',
						value: 'ProductCreated',
					},
					{
						name: 'Product Deleted',
						value: 'ProductDeleted',
					},
				],
				default: ['ProductPublished'],
				description: 'Product lifecycle events that will trigger this webhook',
			},
		],
	};

	webhookMethods = {
		default: {
			checkExists: async function (this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
				if (!webhookData.subscriptionId) {
					return false;
				}

				try {
					const baseUrl = await getBaseUrl.call(this);
					await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId);
					return true;
				} catch {
					delete webhookData.subscriptionId;
					return false;
				}
			},
			create: async function (this: IHookFunctions): Promise<boolean> {
				console.log('🚀 Starting CommerceTools trigger setup...');
				
				const eventsRaw = this.getNodeParameter('productEvents', 0) as string[] | string;
				const events = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
				if (!events.length) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one product event must be selected',
					);
				}

				// Get credentials to check if AWS is configured
				const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;
				const hasAWSCredentials = !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey);
				
				const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
				const baseUrl = await getBaseUrl.call(this);
				
				let useAWS = false;
				let awsInfrastructure: any = null;
				let webhookUrl: string | undefined;

				if (hasAWSCredentials) {
					console.log('🔧 AWS credentials detected - creating AWS infrastructure automatically...');
					
					// Get webhook URL for Lambda to send responses back to n8n
					webhookUrl = this.getNodeWebhookUrl('default');
					if (!webhookUrl) {
						throw new NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
					}
					console.log(`🔗 Lambda will send responses to: ${webhookUrl}`);
					
					// Create AWS infrastructure for the selected event type
					const primaryEvent = events[0]; // Use first selected event for naming
					awsInfrastructure = await createRealAWSInfrastructure(credentials, primaryEvent, webhookUrl);
					
					// Store AWS configuration
					webhookData.awsInfrastructure = awsInfrastructure;
					useAWS = true;
					
					console.log('✅ AWS infrastructure created successfully!');
					console.log(`📋 SQS Queue: ${awsInfrastructure.queueUrl}`);
					console.log(`🔧 Lambda Function: ${awsInfrastructure.lambdaFunctionName}`);
				} else {
					console.log('📡 Using HTTP webhook (no AWS credentials provided)');
					webhookUrl = this.getNodeWebhookUrl('default');
					if (!webhookUrl) {
						throw new NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
					}
					console.log(`🔗 Using webhook URL: ${webhookUrl}`);
				}

				console.log('🔗 Creating CommerceTools subscription...');
				const response = (await createSubscription.call(this, {
					baseUrl,
					webhookUrl,
					awsInfrastructure,
					events,
					useAWS,
				})) as IDataObject;

				const subscriptionId = response.id as string | undefined;
				if (!subscriptionId) {
					throw new NodeOperationError(
						this.getNode(),
						'Commercetools did not return a subscription identifier',
					);
				}

				webhookData.subscriptionId = subscriptionId;
				
				console.log('🎉 CommerceTools trigger setup completed successfully!');
				
				if (useAWS) {
					console.log('📦 Product events will be sent to SQS and processed by Lambda function');
					console.log(`🏷️  Event: ${events[0]} → SQS → Lambda`);
					console.log('💡 Lambda function will process events with CTP_PROJECT_KEY=n8n-ct-integration');
				} else {
					console.log('📦 Product events will be sent to HTTP webhook');
					console.log('💡 Events will be processed directly in this n8n workflow');
				}
				
				return true;
			},
			delete: async function (this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
				if (!webhookData.subscriptionId) {
					return true;
				}

				try {
					const baseUrl = await getBaseUrl.call(this);
					const subscription = (await fetchSubscription.call(
						this,
						baseUrl,
						webhookData.subscriptionId,
					)) as IDataObject;
					const version = subscription.version as number | undefined;
					if (typeof version !== 'number') {
						throw new NodeOperationError(this.getNode(), 'Failed to resolve subscription version');
					}
					await deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
				} catch (error) {
					const errorData = error as IDataObject;
					const statusCode =
						(errorData.statusCode as number | undefined) ??
						((errorData.cause as IDataObject)?.statusCode as number | undefined);
					if (statusCode !== 404) {
						throw error;
					}
				}

				delete webhookData.subscriptionId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		console.log('🎯 CommerceTools webhook received!');
		
		const bodyData = this.getBodyData() as IDataObject;
		const headers = this.getHeaderData();
		
		console.log('📦 Received webhook data:', {
			bodyKeys: Object.keys(bodyData),
			hasSource: !!bodyData.source,
			hasEventType: !!bodyData.eventType,
			hasProduct: !!bodyData.product,
			hasResults: !!bodyData.results
		});
		
		let outputData: IDataObject = {};
		
		// Check if this is a Lambda webhook response (processed event)
		if (bodyData.source === 'CommerceTools-Lambda' && bodyData.eventType) {
			console.log('✅ Processing Lambda webhook response');
			
			// Extract Lambda results and product data
			outputData = {
				// Main event info
				eventType: bodyData.eventType,
				timestamp: bodyData.timestamp || new Date().toISOString(),
				projectKey: bodyData.projectKey,
				source: 'CommerceTools-Lambda',
				processed: true,
				
				// Product data from Lambda
				product: bodyData.product || {},
				
				// Lambda processing results  
				message: bodyData.message || 'Lambda processed event',
				webhookStatus: bodyData.webhookStatus,
				
				// Results array from Lambda (the results you wrote)
				results: bodyData.results || [],
				
				// Mark this as Lambda processed
				lambdaProcessed: true,
				
				// Full Lambda payload for debugging
				lambdaPayload: bodyData
			};
			
			console.log('✅ Lambda data extracted - sending to workflow');
			
		} else {
			// Generic webhook data or direct CommerceTools events
			console.log('📄 Processing generic webhook data');
			
			outputData = {
				body: bodyData,
				headers: headers,
				timestamp: new Date().toISOString(),
				source: 'Direct-Webhook',
				processed: false,
				lambdaProcessed: false
			};
		}
		
		console.log('📤 Final output data:', {
			eventType: outputData.eventType,
			hasProduct: !!outputData.product,
			hasResults: Array.isArray(outputData.results) ? outputData.results.length : 0,
			lambdaProcessed: outputData.lambdaProcessed
		});
		
		return {
			workflowData: [this.helpers.returnJsonArray([outputData])],
		};
	}
}
