import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
export declare function generateIdFields(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
