import type { INodeProperties } from 'n8n-workflow';
export type SubscriptionType = 'message' | 'change';
export type SubscriptionEvent = {
    name: string;
    value: string;
    resourceTypeId: string;
    subscriptionType: SubscriptionType;
    description: string;
};
export declare const subscriptionEvents: SubscriptionEvent[];
export declare const triggerProperties: INodeProperties[];
