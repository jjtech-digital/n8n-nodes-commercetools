import { IDataObject, IHookFunctions, NodeOperationError } from "n8n-workflow";
import { createSubscription, deleteSubscription, fetchSubscription, getBaseUrl } from "./subscription.utils";
import AWS from "aws-sdk";
import { AWSResponse, createRealAWSInfrastructure, deleteAWSInfrastructure } from "./awsInfra.utils";
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
            const eventsRaw = this.getNodeParameter('events') as string[] | string;
            const currentEvents = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
            const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as Record<string, string>;
            const hasAWSCredentials = !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey);
            const currentConfigHash = generateConfigHash(currentEvents, hasAWSCredentials);


            // Check if subscription exists
            if (!webhookData.subscriptionId) {
                return false;
            }

            // Check if configuration has changed
            if (webhookData.configHash !== currentConfigHash) {

                // Delete old subscription from CommerceTools
                try {
                    const baseUrl = await getBaseUrl.call(this);
                    const subscription = await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId) as IDataObject;
                    const version = subscription.version as number;
                    await deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
                } catch {
                    //TODO:
                }

                // Delete old AWS infrastructure if it exists
                if (webhookData.awsInfrastructure) {
                    try {
                        await deleteAWSInfrastructure(credentials, webhookData.awsInfrastructure);
                    } catch {
                        //TODO:
                    }
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
                await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId) as IDataObject;

                // If AWS infrastructure exists, verify it's still active
                if (webhookData.awsInfrastructure) {
                    try {
                        AWS.config.update({
                            accessKeyId: credentials.awsAccessKeyId,
                            secretAccessKey: credentials.awsSecretAccessKey,
                            region: webhookData.awsInfrastructure.region || 'us-east-1'
                        });

                        const lambda = new AWS.Lambda();
                        const sqs = new AWS.SQS();

                        // Check if Lambda function exists
                        try {
                            await lambda.getFunctionConfiguration({
                                FunctionName: webhookData.awsInfrastructure.lambdaFunctionName as string
                            }).promise();
                        } catch {
                            // Lambda doesn't exist, need to recreate
                            delete webhookData.subscriptionId;
                            delete webhookData.awsInfrastructure;
                            delete webhookData.configHash;
                            delete webhookData.events;
                            return false;
                        }

                        // Check if SQS queue exists
                        try {
                           await sqs.getQueueAttributes({
                                QueueUrl: webhookData.awsInfrastructure.queueUrl as string,
                                AttributeNames: ['ApproximateNumberOfMessages']
                            }).promise();
                        } catch {
                            // SQS doesn't exist, need to recreate
                            delete webhookData.subscriptionId;
                            delete webhookData.awsInfrastructure;
                            delete webhookData.configHash;
                            delete webhookData.events;
                            return false;
                        }
                    } catch {
                        // If we can't verify AWS, assume it needs recreation
                        delete webhookData.subscriptionId;
                        delete webhookData.awsInfrastructure;
                        delete webhookData.configHash;
                        delete webhookData.events;
                        return false;
                    }
                }
                return true;
            } catch {
                delete webhookData.subscriptionId;
                delete webhookData.awsInfrastructure;
                delete webhookData.configHash;
                delete webhookData.events;
                return false;
            }
        },

        create: async function (this: IHookFunctions): Promise<boolean> {

            const eventsRaw = this.getNodeParameter('events') as string[] | string;
            const events = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
            if (!events.length) {
                throw new NodeOperationError(
                    this.getNode(),
                    'At least one event must be selected',
                );
            }

            // Get credentials to check if AWS is configured
            const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as Record<string, string>;
            const hasAWSCredentials = !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey);

            const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
            const baseUrl = await getBaseUrl.call(this);

            let useAWS = false;
            let awsInfrastructure = null as unknown as AWSResponse;

            // Get webhook URL first
            const webhookUrl = this.getNodeWebhookUrl('default');
            if (!webhookUrl) {
                throw new NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
            }

            if (hasAWSCredentials) {

                // Create AWS infrastructure for the selected event type
                const primaryEvent = events[0];
                awsInfrastructure = await createRealAWSInfrastructure(credentials, primaryEvent, webhookUrl);

                // Store AWS configuration
                webhookData.awsInfrastructure = awsInfrastructure;
                useAWS = true;

            }

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


            if (useAWS && awsInfrastructure) {

                // Test Lambda function with a sample event
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
                                    type: "AWSInfrastructureTest",
                                    resource: {
                                        message: 'Subscription connectivity established successfully',
                                        timestamp: new Date().toISOString(),
                                    }
                                })
                            }
                        ]
                    };

                    const lambdaResponse = await lambda.invoke({
                        FunctionName: awsInfrastructure.lambdaFunctionName as string,
                        InvocationType: 'RequestResponse',
                        Payload: JSON.stringify(testPayload)
                    }).promise();

                    if (lambdaResponse.StatusCode === 200) {
                        JSON.parse(lambdaResponse.Payload as string);
                    }
                } catch {
                    //TODO:
                }
            }

            return true;
        },
        delete: async function (this: IHookFunctions): Promise<boolean> {
            const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;


            // Delete CommerceTools subscription
            if (webhookData.subscriptionId) {
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
                } catch {
                    //TODO:
                }
            }

            // Delete AWS infrastructure if it exists
            if (webhookData.awsInfrastructure) {

                try {
                    const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as Record<string, string>;
                    await deleteAWSInfrastructure(credentials, webhookData.awsInfrastructure);
                } catch {
                    //TODO:
                }
            }

            // Clear all stored data
            delete webhookData.subscriptionId;
            delete webhookData.awsInfrastructure;
            delete webhookData.configHash;
            delete webhookData.events;

            return true;
        },
    },
};