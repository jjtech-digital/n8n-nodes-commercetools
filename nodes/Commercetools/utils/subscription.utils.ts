import { IDataObject, IHookFunctions, IWebhookFunctions, NodeOperationError } from "n8n-workflow";
import { AWSResponse } from "./awsInfra.utils";

export async function getBaseUrl(this: IHookFunctions | IWebhookFunctions): Promise<string> {
    const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;

    const projectKey = credentials.projectKey as string;
    const region = (credentials.region as string) || 'australia-southeast1.gcp';

    if (!projectKey) {
        throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials');
    }

    return `https://api.${region}.commercetools.com/${projectKey}`;
}

export async function fetchSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string) {
    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'GET',
        url: `${baseUrl}/subscriptions/${subscriptionId}`,
    });
}

export async function deleteSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string, version: number) {
    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'DELETE',
        url: `${baseUrl}/subscriptions/${subscriptionId}`,
        qs: {
            version,
        },
    });
}

export async function createSubscription(
    this: IHookFunctions,
    params: {
        baseUrl: string;
        webhookUrl?: string;
        awsInfrastructure?: AWSResponse;
        events: string[];
        useAWS: boolean;
    },
) {
    const { baseUrl, webhookUrl, awsInfrastructure, events, useAWS } = params;

    // Separate events by resource type
    const productEvents = events.filter(event => event.startsWith('Product'));
    const customerEvents = events.filter(event => event.startsWith('Customer'));
    const categoryEvents = events.filter(event => event.startsWith('Category'));
    const cartEvents = events.filter(event => event.startsWith('Cart'));



    // Create messages array for each resource type that has events
    const messages: IDataObject[] = [];
    if (productEvents.length > 0) {
        messages.push({
            resourceTypeId: 'product',
            types: productEvents,
        });
    }
    if (customerEvents.length > 0) {
        messages.push({
            resourceTypeId: 'customer',
            types: customerEvents,
        });
    }
    if (categoryEvents.length > 0) {
       messages.push({
            resourceTypeId: 'category',
            types: categoryEvents,
        });
    }

    if (cartEvents.length > 0) {
       messages.push({
            resourceTypeId: 'cart',
            types: cartEvents,
        });
    }
    // Ensure we have at least one message
    if (messages.length === 0) {
        throw new NodeOperationError(this.getNode(), 'No valid events selected');
    }

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
        } else {
            // For IAM role-based auth, credentials must be omitted
            destination.authenticationMode = 'IAM';
        }

        body = {
            destination,
            messages,
        };
    } else {
        // Use HTTP webhook destination
        body = {
            destination: {
                type: 'HTTP',
                url: webhookUrl,
            },
            messages,
        };
    }

    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'POST',
        url: `${baseUrl}/subscriptions`,
        body,
    });
}
