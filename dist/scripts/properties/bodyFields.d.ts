import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
export declare function generateCreateBodyFields(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
export declare function generateMiscPostBodyFields(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
export declare function generateSearchBodyFields(opsByFolder: Map<string, ParsedOperation[]>, folders: string[]): INodeProperties[];
