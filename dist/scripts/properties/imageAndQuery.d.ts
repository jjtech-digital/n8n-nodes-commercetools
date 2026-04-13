import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
export declare function generateImageUploadFields(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
export declare function generateQueryParamProperties(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
