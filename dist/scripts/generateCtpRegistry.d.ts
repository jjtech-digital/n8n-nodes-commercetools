export type SubscriptionKind = 'message' | 'change';
export interface EventDef {
    value: string;
    resourceTypeId?: string;
    subscriptionType?: SubscriptionKind;
}
export interface GenerateOptions {
    sdkPath?: string;
    outputFile?: string;
    writeFile?: boolean;
    allowedResources?: readonly string[];
}
export declare function generateCtpEventRegistry(OUTPUT_DIR: string, options?: GenerateOptions): {
    events: EventDef[];
    messageResourceTypeIds: string[];
    changeResourceTypeIds: string[];
    stats: {
        totalMessages: number;
        unmapped: number;
        unclassified: number;
    };
    unmapped: EventDef[];
    unclassified: EventDef[];
};
