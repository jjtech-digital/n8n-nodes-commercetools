import type { BodyField } from './types';
export declare function extractFields(obj: Record<string, unknown>, prefix?: string, depth?: number): BodyField[];
export declare function extractActionBodyFields(rawBodyObj: Record<string, unknown>): BodyField[];
