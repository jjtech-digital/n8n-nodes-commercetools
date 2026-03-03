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
	/**
	 * True when the URL uses a /key={{key}} or key={{key}} path pattern.
	 * Stored separately so the executor can route to the key branch even when
	 * the operation name does not follow the "by Key" naming convention
	 * (e.g. "Query Product Selections for Product by Product Key" has "Product Key"
	 * not "by Key", so /by\s*key/i fails to match).
	 */
	requiresKey: boolean;
	requiresVersion: boolean;
	/**
	 * Human-readable label for the path parameter when the URL uses a
	 * non-standard /segment={{value}} pattern, e.g. /customer-id={{customerId}}.
	 * Examples: "Customer ID", "Email", "Password Token".
	 * Undefined for standard /{{id}} and /key={{key}} endpoints.
	 */
	pathParamLabel?: string;
	/**
	 * The camelCase variable name extracted from the URL placeholder,
	 * used as the n8n input field name. e.g. 'customerId', 'email'.
	 * Undefined for standard /{{id}} and /key={{key}} endpoints.
	 */
	pathParamName?: string;
	/**
	 * The raw URL segment string before the = sign, e.g. 'customer-id'.
	 * Used by the executor to perform the URL substitution:
	 *   customer-id={{customer-id}} → customer-id=<value>
	 * Undefined for standard /{{id}} and /key={{key}} endpoints.
	 */
	pathParamSegment?: string;

	/**
	 * When requiresKey=true, the exact Postman placeholder variable name
	 * inside the key={{...}} part of the URL, e.g. 'product-key', 'cart-key'.
	 *
	 * The standard executor always substitutes `resourceKey` (a generic field),
	 * but some endpoints use a resource-specific placeholder like {{product-key}}
	 * instead of the generic {{key}}. This field lets the executor know the
	 * exact regex pattern to replace so the URL substitution always works
	 * regardless of the placeholder name used in the Postman collection.
	 *
	 * Examples:
	 *   key={{key}}          → keyPlaceholder = 'key'
	 *   key={{product-key}}  → keyPlaceholder = 'product-key'
	 *   key={{cart-key}}     → keyPlaceholder = 'cart-key'
	 */
	keyPlaceholder?: string;
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

/**
 * FIX A (v2): Match any folder whose name ENDS with the word "Action" or "Actions".
 *
 * Previous fix (`/^actions?$/i | /^update\s+actions?/i`) was still too narrow —
 * it missed CT sub-folders like:
 *   "Cart in Store Update Actions"   → action folder ✗ (was missed)
 *   "Product Update Actions"         → action folder ✗ (was missed)
 *   "Order Update Actions"           → action folder ✗ (was missed)
 *
 * These undetected folders caused their operations (e.g. "Add Custom Line Item",
 * "Add Discount Code") to leak into topLevelOps with isUpdateAction=false,
 * producing duplicate slugs in the operation dropdown and making ALL cart/product
 * fields invisible (selecting one of those leaked ops showed zero inputs).
 *
 * New rule: if the folder name ends with the standalone word "Action" or "Actions"
 * (word boundary \b ensures "Interactions", "Transactions", "Abstractions" don't match),
 * treat it as an update-actions sub-folder.
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

/**
 * Finds a resource folder by name within the CT Postman collection.
 *
 * The collection structure is:
 *   collection.item
 *     Authorization/
 *     Project/
 *       As-associate/
 *         Carts/       ← WRONG — associate-scoped endpoints, wrong URLs
 *         Orders/      ← WRONG
 *         ...
 *       In-business-unit/
 *         Carts/       ← WRONG
 *         ...
 *       Carts/         ← CORRECT — direct project endpoints we want
 *       Orders/        ← CORRECT
 *       Products/      ← CORRECT
 *       Customers/     ← CORRECT
 *
 * Strategy: find the top-level "Project" folder first, then search only its
 * DIRECT children (depth = 1). This skips the As-associate and In-business-unit
 * sub-trees entirely, so e.g. "Carts" resolves to Project > Carts, not
 * Project > As-associate > Carts.
 *
 * Configurable via the optional `projectFolderName` param for future-proofing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findFolder(items: any[], folderName: string, projectFolderName = 'Project'): any | null {
	// Step 1: find the top-level project container
	const projectFolder = items.find(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(item: any) => item.name === projectFolderName && Array.isArray(item.item),
	);

	// Step 2: search its direct children only
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const searchIn: any[] = projectFolder ? projectFolder.item : items;
	for (const item of searchIn) {
		if (item.name === folderName && Array.isArray(item.item)) return item;
	}

	return null;
}

/**
 * Extracts the placeholder variable name from inside a key={{...}} URL segment.
 *
 * The Postman collection is inconsistent — some endpoints use the generic
 * {{key}} placeholder, while others use a resource-scoped name like
 * {{product-key}}, {{cart-key}}, {{customer-key}}, etc.
 *
 * Examples:
 *   "/products/key={{key}}/..."         → 'key'
 *   "/products/key={{product-key}}/..." → 'product-key'
 *   "/carts/key={{cart-key}}"           → 'cart-key'
 *
 * Returns undefined if no key= pattern is found.
 */
function extractKeyPlaceholder(urlTemplate: string): string | undefined {
	const match = urlTemplate.match(/key=\{\{([^}]+)\}\}/);
	return match ? match[1] : undefined;
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

				// Detect if URL requires an ID or key.
				// Note: requiresKey is OR'd into requiresId so that all downstream
				// logic (generateIdFields, generateVersionField, etc.) works correctly
				// for both "by ID" and "by Key" endpoints using the single requiresId flag.
				const requiresIdFromUrl =
					/\/\{\{[^}]*[Ii][Dd]\}\}/.test(urlTemplate) ||
					urlTemplate.includes('{{ID}}') ||
					/\/\{[^}]*[Ii][Dd]\}/.test(urlTemplate);

				const requiresKey = /\/key=/.test(urlTemplate) || /key=\{\{/.test(urlTemplate);

				// Extract the exact placeholder name inside key={{...}} so the executor
				// can substitute the correct variable regardless of naming convention.
				// e.g. key={{product-key}} → 'product-key', key={{key}} → 'key'
				const keyPlaceholder = requiresKey ? extractKeyPlaceholder(urlTemplate) : undefined;

				// Detect non-standard path params like /customer-id={{customer-id}}.
				// These use a /segment={{value}} pattern instead of /{{value}} or /key={{value}}.
				// The URL placeholder name (e.g. 'customer-id') may itself contain hyphens,
				// so we convert both the segment AND the placeholder to camelCase for use as
				// an n8n field name (hyphens are invalid in n8n parameter names).
				const pathParamMatch = urlTemplate.match(/\/([a-z][a-z-]*)=\{\{([^}]+)\}\}/);
				// Only treat as custom path param if NOT the 'key=' pattern (already handled).
				const hasCustomPathParam = pathParamMatch !== null && pathParamMatch[1] !== 'key';

				let pathParamLabel: string | undefined;
				let pathParamName: string | undefined;
				let pathParamSegment: string | undefined;
				if (hasCustomPathParam) {
					// 'customer-id' → 'Customer ID', 'email' → 'Email', 'password-token' → 'Password Token'
					pathParamLabel = pathParamMatch![1]
						.split('-')
						.map((w) => (w === 'id' ? 'ID' : w[0].toUpperCase() + w.slice(1)))
						.join(' ');
					// Convert hyphenated segment to camelCase for a valid n8n field name.
					// 'customer-id' → 'customerId', 'password-token' → 'passwordToken'
					pathParamName = pathParamMatch![1].replace(/-([a-z])/g, (_, c: string) =>
						c.toUpperCase(),
					);
					// Keep the raw URL segment (e.g. 'customer-id') so the executor can
					// reconstruct the substitution: customer-id={{customer-id}} → customer-id=VALUE
					pathParamSegment = pathParamMatch![1];
				}

				const requiresId = requiresIdFromUrl || requiresKey || hasCustomPathParam;

				// requiresVersion
				const requiresVersion =
					method === 'DELETE' ||
					(['POST', 'PUT', 'PATCH'].includes(method) &&
						(rawBodyObj?.version !== undefined ||
							/"version"\s*:/.test(rawBodyRaw) ||
							/\bversion\b/.test(rawBodyRaw)));

				// ── Determine isUpdateAction ─────────────────────────────────
				//
				// FIX B: The previous heuristic was too aggressive:
				//   isUpdateAction = isActionSubFolder
				//                  || (POST && requiresId && hasActions && !isLikelyMainUpdate)
				//
				// The fallback condition (POST + requiresId + hasActions + !update in name)
				// caught legitimate top-level endpoints like "Replicate Cart" if they happened
				// to have an actions-like body, hiding them from the operation dropdown entirely.
				//
				// New rule: an operation is an update action ONLY if it lives inside a folder
				// that was explicitly identified as an update-actions sub-folder (isActionSubFolder).
				// The name/body heuristic is removed — the folder structure is the source of truth.
				const isUpdateAction = isActionSubFolder;

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
				});
			}
		};

		walkItems(folder.item, folderName, '', false);
	}

	return operations;
}
