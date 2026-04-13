import { OAuth2Client } from 'google-auth-library';
import type { INode } from 'n8n-workflow';
export { deleteGCPInfrastructure } from './gcpDelete.utils';
export type GCPResponse = {
    topicName: string;
    projectId: string;
    bucketName: string;
    functionName: string;
    region?: string;
};
type ParsedGCPCreds = {
    projectId: string;
    clientEmail: string;
    privateKey: string;
};
export declare function parseCredentials(raw: Record<string, string>): ParsedGCPCreds;
export declare function buildAuthClient(raw: Record<string, string>): Promise<{
    restAuth: OAuth2Client;
}>;
export declare function createGCPInfrastructure(gcpCredentials: Record<string, string>, webhookUrl: string, eventType: string, node?: INode): Promise<GCPResponse>;
