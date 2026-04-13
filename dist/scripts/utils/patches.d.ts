import type { ParsedOperation, BodyField } from '../collection/types';
interface OperationPatch {
    bodyFields?: BodyField[];
    actionBodyFields?: BodyField[];
    queryParams?: string[];
}
export declare const MANUAL_PATCHES: Record<string, OperationPatch>;
export declare function applyManualPatches(operations: ParsedOperation[]): void;
export {};
