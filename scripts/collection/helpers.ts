/**
 * scripts/collection/helpers.ts
 *
 * Pure string-manipulation helpers used by the Postman collection parser.
 * No side effects; safe to import anywhere.
 */

/**
 * Convert a human-readable operation name into a camelCase identifier used as
 * the operation `value` in n8n node properties and in operations.json keys.
 *
 * Examples:
 *   "Get by ID"  → "getById"
 *   "Create Cart" → "createCart"
 */
export function slugify(name: string): string {
	return name
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/[^a-zA-Z0-9\s]/g, '')
		.trim()
		.split(/\s+/)
		.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
		.join('');
}

/**
 * Convert a dot-path field name ("address.city") into a human-readable label
 * ("Address › City").
 */
export function formatLabel(dotPath: string): string {
	return dotPath
		.split('.')
		.map((s) => s.replace(/([A-Z])/g, ' $1').trim())
		.join(' › ')
		.replace(/^./, (c) => c.toUpperCase());
}

/**
 * Returns true when a value is a LocalizedString object.
 *
 * A LocalizedString is a plain object (not array, not null) whose keys are
 * all IETF locale tags: 2-letter language code optionally followed by a
 * hyphen and 2-letter region code (e.g. "en", "en-US", "de", "zh-CN").
 */
export function isLocalizedObject(value: unknown): boolean {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const keys = Object.keys(value as Record<string, unknown>);
	if (keys.length === 0) return false;
	return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
}

/**
 * Returns true when a Postman folder name indicates it holds update-action
 * items (e.g. a folder called "Update Actions" or "Actions").
 */
export function isUpdateActionsSubFolder(folderName: string): boolean {
	return /\bactions?$/i.test(folderName.trim());
}
