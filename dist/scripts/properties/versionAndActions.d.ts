import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
export declare function generateActionsJsonField(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
export declare function generateActionsUiField(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
