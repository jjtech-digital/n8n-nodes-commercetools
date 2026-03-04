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

	/**
	 * True when this is a search endpoint (POST .../search).
	 *
	 * CT search endpoints (Product Search, Order Search) accept a
	 * SearchRequest JSON body (query, sort, limit, offset, etc.) but their
	 * Postman entries have an *empty* body — so parseCollection produces
	 * bodyFields = []. The executor cannot assemble the body field-by-field.
	 *
	 * When isSearch=true:
	 *   - generateProperties emits a single JSON textarea for the full
	 *     SearchRequest body instead of individual body fields.
	 *   - The executor passes that JSON through directly as the POST body.
	 */
	isSearch?: boolean;

	/**
	 * True when this is an image-upload endpoint (POST .../images).
	 *
	 * The CT image-upload endpoint (POST /products/{id}/images) accepts a
	 * JSON body { url: "<image url>" } and fetches the image from that URL.
	 * Query params: variant (number), sku (string), staged (boolean), filename (string).
	 *
	 * When isImageUpload=true:
	 *   - generateProperties (generateImageUploadFields) emits: imageUrl (required),
	 *     filename, variant, sku, staged — as individual named fields.
	 *   - The executor sends { url: imageUrl } as the JSON body with the
	 *     query params assembled from those fields.
	 *   - bodyFields is [] (Postman body is empty) and is intentionally ignored.
	 */
	isImageUpload?: boolean;
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

/**
 * Match any folder whose name ENDS with the word "Action" or "Actions".
 */
function isUpdateActionsSubFolder(folderName: string): boolean {
	return /\bactions?$/i.test(folderName.trim());
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
function findFolder(items: any[], folderName: string, projectFolderName = 'Project'): any | null {
	const projectFolder = items.find(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(item: any) => item.name === projectFolderName && Array.isArray(item.item),
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const searchIn: any[] = projectFolder ? projectFolder.item : items;
	for (const item of searchIn) {
		if (item.name === folderName && Array.isArray(item.item)) return item;
	}

	return null;
}

function extractKeyPlaceholder(urlTemplate: string): string | undefined {
	const match = urlTemplate.match(/key=\{\{([^}]+)\}\}/);
	return match ? match[1] : undefined;
}

/**
 * Detect search endpoints: POST .../search
 *
 * These endpoints (Product Search: POST /products/search,
 * Order Search: POST /orders/search) have an empty Postman body,
 * so bodyFields will be []. We tag them so the generator and executor
 * can expose a single JSON passthrough field instead.
 */
function detectIsSearch(method: string, urlTemplate: string): boolean {
	return method === 'POST' && /\/search$/.test(urlTemplate);
}

/**
 * Detect image upload endpoints: POST .../images
 *
 * The CT image upload endpoint (POST /products/{id}/images) requires a raw
 * binary body, not JSON. Tag it so the executor sends binary data with the
 * correct Content-Type instead of a JSON payload.
 */
function detectIsImageUpload(method: string, urlTemplate: string): boolean {
	return method === 'POST' && /\/images$/.test(urlTemplate);
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

				const requiresIdFromUrl =
					/\/\{\{[^}]*[Ii][Dd]\}\}/.test(urlTemplate) ||
					urlTemplate.includes('{{ID}}') ||
					/\/\{[^}]*[Ii][Dd]\}/.test(urlTemplate);

				const requiresKey = /\/key=/.test(urlTemplate) || /key=\{\{/.test(urlTemplate);
				const keyPlaceholder = requiresKey ? extractKeyPlaceholder(urlTemplate) : undefined;

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

				// ── Classify special operation types ─────────────────────────
				const isSearch = detectIsSearch(method, urlTemplate);
				const isImageUpload = detectIsImageUpload(method, urlTemplate);

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
				});
			}
		};

		walkItems(folder.item, folderName, '', false);
	}

	return operations;
}
