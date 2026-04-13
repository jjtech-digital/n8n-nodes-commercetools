import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
export declare function generateResourceProperty(folders: string[]): INodeProperties;
export declare function generateOperationProperties(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
export declare function generateVersionField(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
