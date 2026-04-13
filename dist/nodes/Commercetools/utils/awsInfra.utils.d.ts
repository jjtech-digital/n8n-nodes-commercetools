import type { INode } from 'n8n-workflow';
export { deleteAWSInfrastructure } from './awsDelete.utils';
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
    webhookUrl?: string;
    created?: boolean;
    createdAt?: string;
};
export declare function createRealAWSInfrastructure(awsCredentials: Record<string, string>, eventType: string, webhookUrl?: string, node?: INode): Promise<AWSResponse>;
