import type { IExecuteFunctions } from 'n8n-workflow';
import type { ParsedOperation } from '../../../scripts/collection/types';
export declare function buildRequestBody(ctx: IExecuteFunctions, i: number, opDef: ParsedOperation, resource: string, operation: string): Record<string, unknown> | undefined;
export declare function buildActionsFromUi(ctx: IExecuteFunctions, i: number, resource: string): unknown[];
export declare function tryParseJson(value: unknown): unknown;
export declare function tryParseArray(raw: unknown): unknown[];
export declare function setNested(obj: Record<string, unknown>, dotPath: string, value: unknown): void;
