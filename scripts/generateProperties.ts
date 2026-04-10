/**
 * scripts/generateProperties.ts
 *
 * Converts ParsedOperation[] → INodeProperties[].
 *
 * This is the thin orchestrator. All generator functions live in scripts/properties/:
 *   helpers.ts             — shared constants + field builders
 *   resourceAndOperation.ts— resource dropdown, operation dropdowns, version field
 *   idFields.ts            — ID / Key / container / secondary / associate / store / tertiary fields
 *   versionAndActions.ts   — Actions (JSON) + Actions (UI) fixedCollection
 *   bodyFields.ts          — create body, misc-POST body, search body fields
 *   imageAndQuery.ts       — image upload fields + query param Filters collection
 *
 * PERF-4: A single Map<folder → ops> index is built once and passed to all
 *          generators, replacing the O(folders × operations × 11) filter passes
 *          in the original implementation.
 */

import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from './collection/types';

import {
	generateResourceProperty,
	generateOperationProperties,
	generateVersionField,
} from './properties/resourceAndOperation';
import { generateIdFields } from './properties/idFields';
import { generateActionsJsonField, generateActionsUiField } from './properties/versionAndActions';
import {
	generateCreateBodyFields,
	generateMiscPostBodyFields,
	generateSearchBodyFields,
} from './properties/bodyFields';
import { generateImageUploadFields, generateQueryParamProperties } from './properties/imageAndQuery';

// Re-export individual generators for callers that import them directly.
export {
	generateResourceProperty,
	generateOperationProperties,
	generateVersionField,
	generateIdFields,
	generateActionsJsonField,
	generateActionsUiField,
	generateCreateBodyFields,
	generateMiscPostBodyFields,
	generateSearchBodyFields,
	generateImageUploadFields,
	generateQueryParamProperties,
};

// ─── Folder index builder (PERF-4) ────────────────────────────────────────────

/**
 * Build a Map from folder name → operations in that folder.
 * Constructed once; all 11 generators receive the same Map reference.
 */
function buildFolderIndex(
	operations: ParsedOperation[],
	folders: string[],
): Map<string, ParsedOperation[]> {
	const map = new Map<string, ParsedOperation[]>(folders.map((f) => [f, []]));
	for (const op of operations) {
		if (map.has(op.folder)) {
			map.get(op.folder)!.push(op);
		}
	}
	return map;
}

// ─── Master generator ─────────────────────────────────────────────────────────

export function generateAllNodeProperties(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	// PERF-4: index built once, shared by all generators
	const byFolder = buildFolderIndex(operations, folders);

	return [
		generateResourceProperty(folders),
		...generateOperationProperties(byFolder, folders),
		...generateIdFields(byFolder, folders),
		...generateVersionField(byFolder, folders),
		...generateActionsJsonField(byFolder, folders),
		...generateActionsUiField(byFolder, folders),
		...generateCreateBodyFields(byFolder, folders),
		...generateMiscPostBodyFields(byFolder, folders),
		...generateSearchBodyFields(byFolder, folders),
		...generateImageUploadFields(byFolder, folders),
		...generateQueryParamProperties(byFolder, folders),
	];
}
