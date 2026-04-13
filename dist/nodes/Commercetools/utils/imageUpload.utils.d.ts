import type { IExecuteFunctions, INode } from 'n8n-workflow';
import type { ParsedOperation } from '../../../scripts/collection/types';
export declare function validateImageUrl(node: INode, raw: string): void;
export declare function executeImageUpload(this: IExecuteFunctions, i: number, opDef: ParsedOperation, fullUrl: string): Promise<unknown>;
