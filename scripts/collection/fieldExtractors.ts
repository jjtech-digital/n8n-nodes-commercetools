/**
 * scripts/collection/fieldExtractors.ts
 *
 * Extracts BodyField[] from parsed Postman request bodies.
 * READ-13: Shared `classifyValue` eliminates duplicated branching logic that
 * previously existed separately in extractFields and extractActionBodyFields.
 */

import type { BodyField } from './types';
import { formatLabel, isLocalizedObject } from './helpers';

// ─── Internal helper ──────────────────────────────────────────────────────────

function classifyValue(value: unknown): 'json' | 'number' | 'boolean' | 'string' {
	if (
		Array.isArray(value) ||
		isLocalizedObject(value) ||
		(value !== null && typeof value === 'object')
	) {
		return 'json';
	}
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'string';
}

// ─── Public extractors ────────────────────────────────────────────────────────

/**
 * Recursively extract BodyField descriptors from a Postman request body object.
 *
 * Depth is capped at 3 to avoid unbounded recursion on deeply nested payloads.
 * Fields beyond that depth are silently skipped — this is intentional because
 * deeply nested fields are not practical to expose as individual n8n UI fields.
 */
export function extractFields(obj: Record<string, unknown>, prefix = '', depth = 0): BodyField[] {
	// Depth limit: deeper fields are not emitted as UI properties.
	// Increase this constant if a commercetools payload gains needed deep nesting.
	if (depth > 3) return [];
	const fields: BodyField[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		const kind = classifyValue(value);

		if (kind === 'json' && !Array.isArray(value) && !isLocalizedObject(value) && value !== null) {
			// Plain nested object — recurse rather than emitting a json blob
			fields.push(...extractFields(value as Record<string, unknown>, path, depth + 1));
		} else {
			fields.push({
				name: path,
				type: kind,
				required: depth === 0,
				example: value,
				description: formatLabel(path),
			});
		}
	}

	return fields;
}

/**
 * Extract BodyField descriptors from the first element of an `actions` array
 * inside a Postman request body.
 * Used to populate the Actions (UI) fixedCollection option groups.
 */
export function extractActionBodyFields(rawBodyObj: Record<string, unknown>): BodyField[] {
	const actionsArray = rawBodyObj.actions;
	if (!Array.isArray(actionsArray) || actionsArray.length === 0) return [];

	const SKIP = new Set(['action', 'version', 'actions']);
	const actionObj = actionsArray[0] as Record<string, unknown>;
	if (!actionObj || typeof actionObj !== 'object') return [];

	const fields: BodyField[] = [];

	for (const [key, value] of Object.entries(actionObj)) {
		if (SKIP.has(key)) continue;

		fields.push({
			name: key,
			type: classifyValue(value),
			required: false,
			example: value,
			description: formatLabel(key),
		});
	}

	return fields;
}
