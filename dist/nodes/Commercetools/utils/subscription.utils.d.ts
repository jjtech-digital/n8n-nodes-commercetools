import type { IHookFunctions, IWebhookFunctions } from 'n8n-workflow';
import type { AWSResponse } from './awsInfra.utils';
import type { GCPResponse } from './gcpInfra.utils';
export declare function getBaseUrl(this: IHookFunctions | IWebhookFunctions): Promise<string>;
export declare function fetchSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string): Promise<any>;
export declare function deleteSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string, version: number): Promise<any>;
export declare function createSubscription(this: IHookFunctions, params: {
    baseUrl: string;
    webhookUrl?: string;
    awsInfrastructure?: AWSResponse;
    gcpInfrastructure?: GCPResponse;
    events: string[];
    useAWS: boolean;
    useGCP: boolean;
}): Promise<unknown>;
