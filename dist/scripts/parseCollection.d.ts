export type { BodyField, ParsedOperation } from './collection/types';
export { slugify } from './collection/helpers';
import type { ParsedOperation } from './collection/types';
import type { PostmanCollection } from './collection/postmanTypes';
export declare function parseCollection(collection: PostmanCollection, folders: string[]): ParsedOperation[];
