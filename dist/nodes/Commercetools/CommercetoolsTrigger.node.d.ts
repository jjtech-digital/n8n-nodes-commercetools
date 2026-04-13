import type { IDataObject, INodeType, INodeTypeDescription, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';
import type { AWSResponse } from './utils/awsInfra.utils';
import type { GCPResponse } from './utils/gcpInfra.utils';
export type StaticSubscriptionData = IDataObject & {
    subscriptionId?: string;
    awsInfrastructure?: AWSResponse;
    gcpInfrastructure?: GCPResponse;
    configHash?: string;
    events?: string[];
    lastVerifiedAt?: number;
};
export declare class CommercetoolsTrigger implements INodeType {
    description: INodeTypeDescription;
    webhookMethods: {
        default: {
            checkExists: (this: import("n8n-workflow").IHookFunctions) => Promise<boolean>;
            create: (this: import("n8n-workflow").IHookFunctions) => Promise<boolean>;
            delete: (this: import("n8n-workflow").IHookFunctions) => Promise<boolean>;
        };
    };
    webhook(this: IWebhookFunctions): Promise<IWebhookResponseData>;
}
