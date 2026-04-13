/**
 * scripts/parseCollection.ts
 *
 * Thin entry-point for the Postman collection parser.
 *
 * All implementation lives in scripts/collection/:
 *   types.ts          — BodyField / ParsedOperation interfaces
 *   postmanTypes.ts   — Typed Postman shapes (no `any`)
 *   helpers.ts        — slugify, formatLabel, isUpdateActionsSubFolder
 *   fieldExtractors.ts— extractFields, extractActionBodyFields
 *   findFolder.ts     — findFolder with module-level cache (PERF-5)
 *   walkItems.ts      — walkItems top-level function (BP-8)
 *
 * Re-exports BodyField, ParsedOperation, and slugify for backward
 * compatibility with importers that reference this module directly.
 */

export type { BodyField, ParsedOperation } from './collection/types';
export { slugify } from './collection/helpers';

import type { ParsedOperation } from './collection/types';
import type { PostmanCollection } from './collection/postmanTypes';
import { findFolder } from './collection/findFolder';
import { walkItems } from './collection/walkItems';

/**
 * Parse a Postman Collection v2.1 object and return one ParsedOperation
 * per request item found inside the listed folders.
 *
 * @param collection  Parsed collection.json object
 * @param folders     Folder names (or slash-delimited paths) to process
 */
export function parseCollection(
	collection: PostmanCollection,
	folders: string[],
): ParsedOperation[] {
	const operations: ParsedOperation[] = [];

	for (const folderName of folders) {
		const folder = findFolder(collection.item, folderName);
		if (!folder?.item) continue;

		walkItems(folder.item, operations, folderName, '', false);
	}

	return operations;
}
