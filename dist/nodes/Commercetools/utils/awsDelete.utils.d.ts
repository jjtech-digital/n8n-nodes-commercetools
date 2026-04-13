import type { INode } from 'n8n-workflow';
import type { AWSResponse } from './awsInfra.utils';
export declare function deleteAWSInfrastructure(awsCredentials: Record<string, string>, infrastructure: AWSResponse, node?: INode): Promise<void>;
