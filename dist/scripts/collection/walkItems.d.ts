import type { ParsedOperation } from './types';
import type { PostmanItem } from './postmanTypes';
export declare function walkItems(items: PostmanItem[], operations: ParsedOperation[], parentFolder: string, subFolderName: string, isActionSubFolder: boolean): void;
