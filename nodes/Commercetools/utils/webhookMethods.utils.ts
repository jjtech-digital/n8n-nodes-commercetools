import { IDataObject, IHookFunctions, NodeOperationError } from "n8n-workflow";
import { createSubscription, deleteSubscription, fetchSubscription, getBaseUrl } from "./subscription.utils";
import AWS from "aws-sdk";
import { createRealAWSInfrastructure } from "./awsInfra.utils";
import { StaticSubscriptionData } from "../CommercetoolsTrigger.node";

// Helper function to generate configuration hash
function generateConfigHash(events: string[], hasAWS: boolean): string {
    return JSON.stringify({ events: events.sort(), hasAWS });
}

export const triggerMethods = {
    default: {
        checkExists: async function (this: IHookFunctions): Promise<boolean> {
            const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;

            // Get current configuration
            const eventsRaw = this.getNodeParameter('productEvents', 0) as string[] | string;
            const currentEvents = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
            const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;
            const hasAWSCredentials = !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey);
            const currentConfigHash = generateConfigHash(currentEvents, hasAWSCredentials);

            console.log('🔍 Checking subscription existence...');
            console.log('   Current events:', currentEvents);
            console.log('   AWS enabled:', hasAWSCredentials);
            console.log('   Current config hash:', currentConfigHash);
            console.log('   Stored config hash:', webhookData.configHash);

            // Check if subscription exists
            if (!webhookData.subscriptionId) {
                console.log('❌ No subscription ID found - need to create new subscription');
                return false;
            }

            // Check if configuration has changed
            if (webhookData.configHash !== currentConfigHash) {
                console.log('⚠️  Configuration has changed - need to recreate subscription');
                console.log('   Old config:', webhookData.configHash);
                console.log('   New config:', currentConfigHash);

                // Delete old subscription from CommerceTools
                try {
                    const baseUrl = await getBaseUrl.call(this);
                    const subscription = await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId) as IDataObject;
                    const version = subscription.version as number;
                    await deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
                    console.log('✅ Old subscription deleted from CommerceTools');
                } catch (error) {
                    console.error('⚠️  Error deleting old subscription:', error);
                }

                // Clear old data
                delete webhookData.subscriptionId;
                delete webhookData.awsInfrastructure;
                delete webhookData.configHash;
                delete webhookData.events;
                return false;
            }

            // Verify subscription still exists in CommerceTools
            try {
                const baseUrl = await getBaseUrl.call(this);
                const subscription = await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId) as IDataObject;
                console.log(`✅ Subscription exists: ${webhookData.subscriptionId}`, subscription);
                console.log(`   Events: ${JSON.stringify(currentEvents)}`);
                console.log(`   AWS: ${hasAWSCredentials ? 'Yes' : 'No'}`);
                return true;
            } catch (error) {
                console.error('❌ Subscription not found in CommerceTools');
                delete webhookData.subscriptionId;
                delete webhookData.awsInfrastructure;
                delete webhookData.configHash;
                delete webhookData.events;
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

            // Get webhook URL first
            webhookUrl = this.getNodeWebhookUrl('default');
            if (!webhookUrl) {
                throw new NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
            }

            if (hasAWSCredentials) {
                console.log('🔧 AWS credentials detected - creating AWS infrastructure automatically...');
                console.log(`🔗 Lambda will send responses to: ${webhookUrl}`);

                // Create AWS infrastructure for the selected event type
                const primaryEvent = events[0];
                awsInfrastructure = await createRealAWSInfrastructure(credentials, primaryEvent, webhookUrl);

                // Store AWS configuration
                webhookData.awsInfrastructure = awsInfrastructure;
                useAWS = true;

                console.log('✅ AWS infrastructure created successfully!');
                console.log(`📋 SQS Queue: ${awsInfrastructure.queueUrl}`);
                console.log(`🔧 Lambda Function: ${awsInfrastructure.lambdaFunctionName}`);
            } else {
                console.log('📡 Using HTTP webhook (no AWS credentials provided)');
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

            // Store subscription data and config hash
            webhookData.subscriptionId = subscriptionId;
            webhookData.events = events;
            webhookData.configHash = generateConfigHash(events, hasAWSCredentials);

            console.log('🎉 CommerceTools trigger setup completed successfully!');
            console.log(`📋 Subscription ID: ${subscriptionId}`);
            console.log(`📋 Events: ${events.join(', ')}`);
            console.log(`📋 Config Hash: ${webhookData.configHash}`);

            if (useAWS && awsInfrastructure) {
                console.log('📦 Product events will be sent to SQS and processed by Lambda function');
                console.log(`🔗 Flow: CommerceTools → SQS → Lambda → n8n Webhook`);
                console.log(`💡 Lambda will automatically process events and send results to: ${webhookUrl}`);

                // Test Lambda function with a sample event
                console.log('🧪 Testing Lambda function...');
                try {
                    AWS.config.update({
                        accessKeyId: credentials.awsAccessKeyId as string,
                        secretAccessKey: credentials.awsSecretAccessKey as string,
                        region: awsInfrastructure.region
                    });

                    const lambda = new AWS.Lambda();
                    const testPayload = {
                        Records: [
                            {
                                body: JSON.stringify({
                                    type: awsInfrastructure.eventType,
                                    resource: {
                                        typeId: 'product',
                                        id: 'test-product-id',
                                        key: 'test-product-key',
                                        version: 1,
                                        masterData: {
                                            current: {
                                                name: { en: 'Test Product' },
                                                masterVariant: {
                                                    sku: 'TEST-SKU-001'
                                                },
                                                categories: []
                                            }
                                        }
                                    }
                                })
                            }
                        ]
                    };

                    console.log('📤 Sending test event to Lambda...');
                    const lambdaResponse = await lambda.invoke({
                        FunctionName: awsInfrastructure.lambdaFunctionName,
                        InvocationType: 'RequestResponse',
                        Payload: JSON.stringify(testPayload)
                    }).promise();

                    if (lambdaResponse.StatusCode === 200) {
                        console.log('✅ Lambda test successful!');
                        const responsePayload = JSON.parse(lambdaResponse.Payload as string);
                        console.log('📦 Lambda response:', JSON.stringify(responsePayload, null, 2));
                    } else {
                        console.warn('⚠️  Lambda test returned status:', lambdaResponse.StatusCode);
                    }
                } catch (error) {
                    console.error('❌ Lambda test failed:', error);
                    console.log('⚠️  This is not critical - Lambda will still process real events from SQS');
                }
            } else {
                console.log('📦 Product events will be sent directly to HTTP webhook');
                console.log(`🔗 Flow: CommerceTools → n8n Webhook`);
            }

            return true;
        },

        delete: async function (this: IHookFunctions): Promise<boolean> {
            const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;

            console.log('🗑️  Deleting CommerceTools subscription...');

            if (!webhookData.subscriptionId) {
                console.log('✅ No subscription to delete');
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
                console.log('✅ Subscription deleted from CommerceTools');
            } catch (error) {
                const errorData = error as IDataObject;
                const statusCode =
                    (errorData.statusCode as number | undefined) ??
                    ((errorData.cause as IDataObject)?.statusCode as number | undefined);
                if (statusCode !== 404) {
                    throw error;
                }
                console.log('⚠️  Subscription already deleted (404)');
            }

            // Clear all stored data
            delete webhookData.subscriptionId;
            delete webhookData.awsInfrastructure;
            delete webhookData.configHash;
            delete webhookData.events;

            console.log('✅ Subscription cleanup completed');
            return true;
        },
    },
};