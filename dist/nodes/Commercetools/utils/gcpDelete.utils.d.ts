import type { INode } from 'n8n-workflow';
import type { GCPResponse } from './gcpInfra.utils';
export declare function deleteGCPInfrastructure(gcpCredentials: Record<string, string>, infrastructure: GCPResponse, node?: INode): Promise<void>;
