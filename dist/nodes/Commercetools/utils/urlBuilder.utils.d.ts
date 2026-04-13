import type { IExecuteFunctions, INode } from 'n8n-workflow';
import type { ParsedOperation } from '../../../scripts/collection/types';
export declare function sanitizePathParam(node: INode, value: string, name: string): string;
export declare function safeGet<T>(ctx: IExecuteFunctions, name: string, i: number, fallback: T): T;
export declare function buildUrl(this: IExecuteFunctions, i: number, opDef: ParsedOperation, projectKey: string, baseUrl: string, operation: string): string;
