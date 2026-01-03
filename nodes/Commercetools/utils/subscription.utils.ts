import { IDataObject, IHookFunctions, IWebhookFunctions, NodeOperationError } from "n8n-workflow";

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
        console.log(`🔗 Creating CommerceTools subscription with SQS destination`);
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
        console.log(`🔗 Creating CommerceTools subscription with HTTP destination`);
    }

    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'POST',
        url: `${baseUrl}/subscriptions`,
        body,
    });
}
