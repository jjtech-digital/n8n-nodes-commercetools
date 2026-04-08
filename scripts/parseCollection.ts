/**
 * parseCollection.ts
 *
 * Reads a Postman Collection v2.1 JSON file and extracts structured
 * operations per resource folder.
 */

export interface BodyField {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'json';
	required: boolean;
	example: unknown;
	description: string;
}

export interface ParsedOperation {
	name: string;
	value: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
	urlTemplate: string;
	bodyFields: BodyField[];
	actionBodyFields: BodyField[];
	queryParams: string[];
	description: string;
	folder: string;
	subFolder: string;
	isUpdateAction: boolean;
	requiresId: boolean;
	requiresKey: boolean;
	requiresVersion: boolean;
	pathParamLabel?: string;
	pathParamName?: string;
	pathParamSegment?: string;
	keyPlaceholder?: string;
	isSearch?: boolean;
	isImageUpload?: boolean;
	secondaryIdPlaceholder?: string;
	associateIdPlaceholder?: string;
	storeKeyPlaceholder?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatLabel(dotPath: string): string {
	return dotPath
		.split('.')
		.map((s) => s.replace(/([A-Z])/g, ' $1').trim())
		.join(' › ')
		.replace(/^./, (c) => c.toUpperCase());
}

function isUpdateActionsSubFolder(folderName: string): boolean {
	return /\bactions?$/i.test(folderName.trim());
}

/**
 * Returns true if the value is a LocalizedString object.
 *
 * A LocalizedString is a plain object (not array, not null) whose keys are
 * all IETF locale tags: 2-letter language code optionally followed by a
 * hyphen and 2-letter region code (e.g. "en", "en-US", "de", "zh-CN").
 *
 * This is used in extractFields to emit locale objects as a single json
 * field (preserving the full object as the example) rather than recursing
 * into them and emitting individual "name.en", "name.de" string fields.
 *
 * Examples:
 *   { "en": "Some Product" }           → true  (localized)
 *   { "en": "x", "de-AT": "y" }        → true  (localized)
 *   "commercetools"                     → false (plain string)
 *   { "typeId": "product-type", "id" }  → false (not locale keys)
 *   { "w": 303, "h": 197 }              → false (not locale keys)
 */
function isLocalizedObject(value: unknown): boolean {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const keys = Object.keys(value as Record<string, unknown>);
	if (keys.length === 0) return false;
	return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
}

function extractFields(obj: Record<string, unknown>, prefix = '', depth = 0): BodyField[] {
	if (depth > 3) return [];
	const fields: BodyField[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (Array.isArray(value)) {
			fields.push({
				name: path,
				type: 'json',
				required: false,
				example: value,
				description: `Array of ${key}`,
			});
		} else if (isLocalizedObject(value)) {
			// Emit as a single json field, preserving the locale object as the
			// example value. generateProperties.ts inspects field.example via
			// isLocalizedField() and renders it as a JSON textarea with locale hint.
			fields.push({
				name: path,
				type: 'json',
				required: depth === 0,
				example: value,
				description: formatLabel(path),
			});
		} else if (value !== null && typeof value === 'object') {
			fields.push(...extractFields(value as Record<string, unknown>, path, depth + 1));
		} else {
			fields.push({
				name: path,
				type:
					typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
				required: depth === 0,
				example: value,
				description: formatLabel(path),
			});
		}
	}

	return fields;
}

function extractActionBodyFields(rawBodyObj: Record<string, unknown>): BodyField[] {
	const actionsArray = rawBodyObj.actions;
	if (!Array.isArray(actionsArray) || actionsArray.length === 0) return [];

	const SKIP = new Set(['action', 'version', 'actions']);
	const actionObj = actionsArray[0] as Record<string, unknown>;
	if (!actionObj || typeof actionObj !== 'object') return [];

	const fields: BodyField[] = [];

	for (const [key, value] of Object.entries(actionObj)) {
		if (SKIP.has(key)) continue;

		if (Array.isArray(value)) {
			fields.push({
				name: key,
				type: 'json',
				required: false,
				example: value,
				description: formatLabel(key),
			});
		} else if (isLocalizedObject(value)) {
			fields.push({
				name: key,
				type: 'json',
				required: false,
				example: value,
				description: formatLabel(key),
			});
		} else if (value !== null && typeof value === 'object') {
			fields.push({
				name: key,
				type: 'json',
				required: false,
				example: value,
				description: formatLabel(key),
			});
		} else {
			fields.push({
				name: key,
				type:
					typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
				required: false,
				example: value,
				description: formatLabel(key),
			});
		}
	}

	return fields;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findFolder(items: any[], folderName: string, projectFolderName = 'Project'): any | null {
	const projectFolder = items.find(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(item: any) => item.name === projectFolderName && Array.isArray(item.item),
	);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const searchIn: any[] = projectFolder ? projectFolder.item : items;

	// Support slash-separated nested paths e.g. 'As-associate/In-business-unit/Approval-rules'
	const parts = folderName.split('/');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let current: any[] = searchIn;
	for (let idx = 0; idx < parts.length; idx++) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const found = current.find((i: any) => i.name === parts[idx] && Array.isArray(i.item));
		if (!found) return null;
		if (idx === parts.length - 1) return found;
		current = found.item;
	}
	return null;
}

function extractKeyPlaceholder(urlTemplate: string): string | undefined {
	const match = urlTemplate.match(/key=\{\{([^}]+)\}\}/);
	return match ? match[1] : undefined;
}

function detectIsSearch(method: string, urlTemplate: string): boolean {
	return method === 'POST' && /\/search$/.test(urlTemplate);
}

function detectIsImageUpload(method: string, urlTemplate: string): boolean {
	return method === 'POST' && /\/images$/.test(urlTemplate);
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCollection(collection: any, folders: string[]): ParsedOperation[] {
	const operations: ParsedOperation[] = [];

	for (const folderName of folders) {
		const folder = findFolder(collection.item, folderName);
		if (!folder) continue;

		const walkItems = (
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			items: any[],
			parentFolder: string,
			subFolderName: string,
			isActionSubFolder: boolean,
		) => {
			for (const item of items) {
				if (Array.isArray(item.item)) {
					const childIsActionFolder = isUpdateActionsSubFolder(item.name);
					walkItems(item.item, parentFolder, item.name, isActionSubFolder || childIsActionFolder);
					continue;
				}

				const req = item.request;
				if (!req) continue;

				const method = ((req.method as string) || 'GET').toUpperCase() as ParsedOperation['method'];

				let bodyFields: BodyField[] = [];
				let actionBodyFields: BodyField[] = [];
				let rawBodyObj: Record<string, unknown> = {};
				const rawBodyRaw: string =
					typeof req.body?.raw === 'string'
						? req.body.raw
						: req.body?.raw
							? JSON.stringify(req.body.raw)
							: '';

				try {
					if (rawBodyRaw) {
						const sanitized = rawBodyRaw
							.replace(/:\s*"\{\{[^}]+\}\}"/g, ': "placeholder"')
							.replace(/:\s*\{\{[^}]+\}\}/g, ': "placeholder"');
						try {
							rawBodyObj = JSON.parse(sanitized);
						} catch {
							rawBodyObj = JSON.parse(rawBodyRaw);
						}
						bodyFields = extractFields(rawBodyObj);
						actionBodyFields = extractActionBodyFields(rawBodyObj);
					}
				} catch {
					// not JSON body — skip
				}

				const queryParams: string[] = (req.url?.query || [])
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.filter((q: any) => q.key && !q.key.startsWith('/') && q.key.trim().length > 0)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.map((q: any) => q.key as string);

				const rawUrl: string = typeof req.url === 'string' ? req.url : req.url?.raw || '';
				const urlTemplate = rawUrl
					.replace('{{host}}', '')
					.replace(/https?:\/\/api\.[^/]+\.commercetools\.com/, '')
					.split('?')[0];

				const requiresIdFromUrl =
					/\/\{\{[^}]*[Ii][Dd]\}\}/.test(urlTemplate) ||
					urlTemplate.includes('{{ID}}') ||
					/\/\{[^}]*[Ii][Dd]\}/.test(urlTemplate);

				const requiresKey = /\/key=/.test(urlTemplate) || /key=\{\{/.test(urlTemplate);
				let keyPlaceholder = requiresKey ? extractKeyPlaceholder(urlTemplate) : undefined;

				const pathParamMatch = urlTemplate.match(/\/([a-z][a-z-]*)=\{\{([^}]+)\}\}/);
				const hasCustomPathParam = pathParamMatch !== null && pathParamMatch[1] !== 'key';

				let pathParamLabel: string | undefined;
				let pathParamName: string | undefined;
				let pathParamSegment: string | undefined;
				if (hasCustomPathParam) {
					pathParamLabel = pathParamMatch![1]
						.split('-')
						.map((w) => (w === 'id' ? 'ID' : w[0].toUpperCase() + w.slice(1)))
						.join(' ');
					pathParamName = pathParamMatch![1].replace(/-([a-z])/g, (_, c: string) =>
						c.toUpperCase(),
					);
					pathParamSegment = pathParamMatch![1];
				}

				const requiresId = requiresIdFromUrl || requiresKey || hasCustomPathParam;

				const requiresVersion =
					method === 'DELETE' ||
					(['POST', 'PUT', 'PATCH'].includes(method) &&
						(rawBodyObj?.version !== undefined ||
							/"version"\s*:/.test(rawBodyRaw) ||
							/\bversion\b/.test(rawBodyRaw)));

				const isUpdateAction = isActionSubFolder;
				const isSearch = detectIsSearch(method, urlTemplate);
				const isImageUpload = detectIsImageUpload(method, urlTemplate);

				// Detect secondary ID placeholder.
				// Two cases:
				//   1. Two {{...-id}} tokens: /business-units/{{business-unit-id}}/associates/{{associate-id}}
				//      → secondaryId is the second token
				//   2. One key= + one {{...-id}} token: /business-units/key={{associate-key}}/associates/{{associate-id}}
				//      → the primary identifier is the key; the ID token is the secondary
				const allIdPlaceholders = [...urlTemplate.matchAll(/\{\{([^}]*[Ii][Dd])\}\}/g)].map(
					(m) => m[1],
				);
				const uniqueIdPlaceholders = [...new Set(allIdPlaceholders)];
				let secondaryIdPlaceholder: string | undefined;
				if (uniqueIdPlaceholders.length >= 2) {
					// Two ID tokens — second one is secondary
					secondaryIdPlaceholder = uniqueIdPlaceholders[1];
				} else if (requiresKey && uniqueIdPlaceholders.length === 1) {
					// Key-based URL with an additional ID segment — that ID is secondary
					secondaryIdPlaceholder = uniqueIdPlaceholders[0];
				}

				// Detect associate-id for As-associate endpoints
				const associateIdMatch = urlTemplate.match(/as-associate\/\{\{([^}]+)\}\}/);
				const associateIdPlaceholder = associateIdMatch ? associateIdMatch[1] : undefined;
				// Remove associate-id from secondaryId to avoid duplicate fields
				if (associateIdPlaceholder && secondaryIdPlaceholder === associateIdPlaceholder) {
					secondaryIdPlaceholder = undefined;
				}
				// Detect store-key for In-store endpoints
				const storeKeyMatch = urlTemplate.match(/in-store\/key=\{\{([^}]+)\}\}/);
				const storeKeyPlaceholder = storeKeyMatch ? storeKeyMatch[1] : undefined;
				// If store-key was picked up as keyPlaceholder, replace it with
				// the actual resource key (second key= segment)
				if (storeKeyPlaceholder && keyPlaceholder === storeKeyPlaceholder) {
					const allKeyMatches = [...urlTemplate.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
					keyPlaceholder = allKeyMatches.length >= 2 ? allKeyMatches[1] : undefined;
				}
				operations.push({
					name: item.name,
					value: slugify(item.name),
					method,
					urlTemplate,
					bodyFields,
					actionBodyFields,
					queryParams,
					description:
						typeof req.description === 'string' ? req.description : req.description?.content || '',
					folder: parentFolder,
					subFolder: subFolderName,
					isUpdateAction,
					requiresId,
					requiresKey,
					requiresVersion,
					...(keyPlaceholder ? { keyPlaceholder } : {}),
					...(pathParamLabel ? { pathParamLabel, pathParamName, pathParamSegment } : {}),
					...(isSearch ? { isSearch: true } : {}),
					...(isImageUpload ? { isImageUpload: true } : {}),
					...(secondaryIdPlaceholder ? { secondaryIdPlaceholder } : {}),
					...(associateIdPlaceholder ? { associateIdPlaceholder } : {}),
					...(storeKeyPlaceholder ? { storeKeyPlaceholder } : {}),
				});
			}
		};

		walkItems(folder.item, folderName, '', false);
	}

	return operations;
}
