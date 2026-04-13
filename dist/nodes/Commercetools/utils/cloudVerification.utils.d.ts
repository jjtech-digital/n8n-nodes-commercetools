import type { AWSResponse } from './awsInfra.utils';
import type { GCPResponse } from './gcpInfra.utils';
export declare function verifyAWSInfrastructure(credentials: Record<string, string>, infra: AWSResponse): Promise<boolean>;
export declare function verifyGCPInfrastructure(credentials: Record<string, string>, infra: GCPResponse): Promise<boolean>;
