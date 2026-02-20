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
	requiresVersion: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
	return (
		name
			// Split PascalCase/camelCase words BEFORE stripping non-alpha chars
			// e.g. "SetMetaTitle" → "Set Meta Title", "addPrice" → "add Price"
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
			.replace(/[^a-zA-Z0-9\s]/g, '')
			.trim()
			.split(/\s+/)
			.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
			.join('')
	);
}

function formatLabel(dotPath: string): string {
	return dotPath
		.split('.')
		.map((s) => s.replace(/([A-Z])/g, ' $1').trim())
		.join(' › ')
		.replace(/^./, (c) => c.toUpperCase());
}

function isUpdateActionsSubFolder(folderName: string): boolean {
	return /update\s*action|action/i.test(folderName);
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

/**
 * Extract action-specific fields from inside actions[0].
 * Given: { "version": 2, "actions": [{ "action": "addAsset", "variantId": 1, "asset": {...} }] }
 * Returns fields for: variantId (number), asset (json)  — strips: action, version
 */
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
function findFolder(items: any[], folderName: string): any | null {
	for (const item of items) {
		if (item.name === folderName && Array.isArray(item.item)) return item;
		if (Array.isArray(item.item)) {
			const found = findFolder(item.item, folderName);
			if (found) return found;
		}
	}
	return null;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCollection(collection: any, folders: string[]): ParsedOperation[] {
	const operations: ParsedOperation[] = [];

	for (const folderName of folders) {
		const folder = findFolder(collection.item, folderName);
		if (!folder) {
			console.warn(`⚠️  Folder "${folderName}" not found in collection`);
			continue;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const walkItems = (
			items: any[],
			parentFolder: string,
			subFolderName: string,
			isActionSubFolder: boolean,
		) => {
			for (const item of items) {
				// ── Sub-folder ───────────────────────────────────────────────
				if (Array.isArray(item.item)) {
					const childIsActionFolder = isUpdateActionsSubFolder(item.name);
					walkItems(item.item, parentFolder, item.name, isActionSubFolder || childIsActionFolder);
					continue;
				}

				// ── Request item ─────────────────────────────────────────────
				const req = item.request;
				if (!req) continue;

				// Normalise method: Postman uses lowercase ("get", "post")
				const method = ((req.method as string) || 'GET').toUpperCase() as ParsedOperation['method'];

				// Parse body
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

				// Parse query params:
				//   • keep disabled params — Postman marks all optional params as disabled=true
				//     by default (they're just unchecked in the UI), so we must NOT skip them
				//   • skip Postman regex-pattern keys like /^var[.][a-zA-Z0-9]+$/
				//   • skip empty/null keys
				const queryParams: string[] = (req.url?.query || [])
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.filter((q: any) => q.key && !q.key.startsWith('/') && q.key.trim().length > 0)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.map((q: any) => q.key as string);

				// Build URL template
				const rawUrl: string = typeof req.url === 'string' ? req.url : req.url?.raw || '';
				const urlTemplate = rawUrl
					.replace('{{host}}', '')
					.replace(/https?:\/\/api\.[^/]+\.commercetools\.com/, '')
					.split('?')[0];

				// Detect if URL requires an ID or key
				const requiresId =
					/\/\{\{[^}]*[Ii][Dd]\}\}/.test(urlTemplate) ||
					urlTemplate.includes('{{ID}}') ||
					/\/\{[^}]*[Ii][Dd]\}/.test(urlTemplate);

				const requiresKey = /\/key=/.test(urlTemplate) || /key=\{\{/.test(urlTemplate);

				// requiresVersion
				const requiresVersion =
					method === 'DELETE' ||
					(['POST', 'PUT', 'PATCH'].includes(method) &&
						(rawBodyObj?.version !== undefined ||
							/"version"\s*:/.test(rawBodyRaw) ||
							/\bversion\b/.test(rawBodyRaw)));

				// ── Determine isUpdateAction ─────────────────────────────────
				const bodyHasActionsArray = bodyFields.some((f) => f.name === 'actions');

				const isLikelyMainUpdate =
					method === 'POST' && requiresId && bodyHasActionsArray && /\bupdate\b/i.test(item.name);

				const isUpdateAction =
					isActionSubFolder ||
					(method === 'POST' && requiresId && bodyHasActionsArray && !isLikelyMainUpdate);

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
					requiresId: requiresId || requiresKey,
					requiresVersion,
				});
			}
		};

		walkItems(folder.item, folderName, '', false);
	}

	return operations;
}
