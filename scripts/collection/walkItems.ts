/**
 * scripts/collection/walkItems.ts
 *
 * Recursively walks a Postman collection folder tree and converts each
 * request item into a ParsedOperation.
 *
 * BP-8: `walkItems` is a top-level function (not a closure) so it can be
 * unit-tested in isolation.
 */

import type { ParsedOperation, BodyField } from './types';
import type { PostmanItem, PostmanUrl } from './postmanTypes';
import { slugify, isUpdateActionsSubFolder } from './helpers';
import { extractFields, extractActionBodyFields } from './fieldExtractors';

// ─── Small detection helpers ──────────────────────────────────────────────────

function detectIsSearch(method: string, urlTemplate: string): boolean {
	return method === 'POST' && /\/search$/.test(urlTemplate);
}

function detectIsImageUpload(method: string, urlTemplate: string): boolean {
	return method === 'POST' && /\/images$/.test(urlTemplate);
}

function extractKeyPlaceholder(urlTemplate: string): string | undefined {
	const match = urlTemplate.match(/key=\{\{([^}]+)\}\}/);
	return match ? match[1] : undefined;
}

// ─── URL builder ──────────────────────────────────────────────────────────────

function resolveUrlTemplate(req: PostmanItem['request']): string {
	const rawUrl: string =
		typeof req?.url === 'string' ? req.url : ((req?.url as PostmanUrl)?.raw ?? '');
	return rawUrl
		.replace('{{host}}', '')
		.replace(/https?:\/\/api\.[^/]+\.commercetools\.com/, '')
		.split('?')[0];
}

// ─── Body parsing ─────────────────────────────────────────────────────────────

function parseBody(req: PostmanItem['request']): {
	bodyFields: BodyField[];
	actionBodyFields: BodyField[];
	rawBodyObj: Record<string, unknown>;
	rawBodyRaw: string;
} {
	const rawBodyRaw: string =
		typeof req?.body?.raw === 'string'
			? req.body.raw
			: req?.body?.raw
				? JSON.stringify(req.body.raw)
				: '';

	let rawBodyObj: Record<string, unknown> = {};
	let bodyFields: BodyField[] = [];
	let actionBodyFields: BodyField[] = [];

	try {
		if (rawBodyRaw) {
			// BUG-13: Scope replacement to values that are *entirely* a Postman variable.
			// The trailing anchor prevents corruption of strings like "Use {{var}} here".
			const sanitized = rawBodyRaw
				.replace(/:\s*"\{\{[^}]+\}\}"(\s*[,}\]])/g, ': "placeholder"$1')
				.replace(/:\s*\{\{[^}]+\}\}(\s*[,}\]])/g, ': "placeholder"$1');
			try {
				rawBodyObj = JSON.parse(sanitized);
			} catch {
				rawBodyObj = JSON.parse(rawBodyRaw);
			}
			bodyFields = extractFields(rawBodyObj);
			actionBodyFields = extractActionBodyFields(rawBodyObj);
		}
	} catch {
		// Not a JSON body — skip silently
	}

	return { bodyFields, actionBodyFields, rawBodyObj, rawBodyRaw };
}

// ─── Version detection ────────────────────────────────────────────────────────

function detectRequiresVersion(
	method: string,
	rawBodyObj: Record<string, unknown>,
	rawBodyRaw: string,
): boolean {
	if (method === 'DELETE') return true;
	if (!['POST', 'PUT', 'PATCH'].includes(method)) return false;
	// BUG-12: Use the structured check first; tighten regex to avoid matching 'versionNumber'
	return rawBodyObj?.version !== undefined || /"version"\s*:\s*\d+/.test(rawBodyRaw);
}

// ─── Main walker ──────────────────────────────────────────────────────────────

/**
 * Recursively walk Postman collection items and push ParsedOperation entries
 * into the `operations` output array.
 *
 * @param items           Items at the current folder level
 * @param operations      Output array — entries are pushed here
 * @param parentFolder    Top-level folder name (e.g. "Products")
 * @param subFolderName   Current subfolder name for display
 * @param isActionSubFolder  Whether the current subtree is an update-actions group
 */
export function walkItems(
	items: PostmanItem[],
	operations: ParsedOperation[],
	parentFolder: string,
	subFolderName: string,
	isActionSubFolder: boolean,
): void {
	for (const item of items) {
		if (Array.isArray(item.item)) {
			const childIsActionFolder = isUpdateActionsSubFolder(item.name);
			// Only propagate isActionSubFolder when the child itself is an action folder.
			// This prevents non-action siblings from inheriting the flag via OR.
			walkItems(item.item, operations, parentFolder, item.name, childIsActionFolder);
			continue;
		}

		const req = item.request;
		if (!req) continue;

		const method = ((req.method as string) || 'GET').toUpperCase() as ParsedOperation['method'];
		const urlTemplate = resolveUrlTemplate(req);

		const { bodyFields, actionBodyFields, rawBodyObj, rawBodyRaw } = parseBody(req);

		const queryParams: string[] = (
			typeof req.url !== 'string' ? ((req.url as PostmanUrl)?.query ?? []) : []
		)
			.filter((q) => q.key && !q.key.startsWith('/') && q.key.trim().length > 0)
			.map((q) => q.key as string);

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
		if (hasCustomPathParam && pathParamMatch) {
			pathParamLabel = pathParamMatch[1]
				.split('-')
				.map((w) => (w === 'id' ? 'ID' : w[0].toUpperCase() + w.slice(1)))
				.join(' ');
			pathParamName = pathParamMatch[1].replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
			pathParamSegment = pathParamMatch[1];
		}

		const requiresId = requiresIdFromUrl || requiresKey || hasCustomPathParam;
		const requiresVersion = detectRequiresVersion(method, rawBodyObj, rawBodyRaw);
		const isSearch = detectIsSearch(method, urlTemplate);
		const isImageUpload = detectIsImageUpload(method, urlTemplate);

		// Detect secondary ID placeholder
		const allIdPlaceholders = [...urlTemplate.matchAll(/\{\{([^}]*[Ii][Dd])\}\}/g)].map(
			(m) => m[1],
		);
		const uniqueIdPlaceholders = [...new Set(allIdPlaceholders)];
		let secondaryIdPlaceholder: string | undefined;
		if (uniqueIdPlaceholders.length >= 2) {
			secondaryIdPlaceholder = uniqueIdPlaceholders[1];
		} else if (requiresKey && uniqueIdPlaceholders.length === 1) {
			secondaryIdPlaceholder = uniqueIdPlaceholders[0];
		}

		// Detect associate-id placeholder
		const associateIdMatch = urlTemplate.match(/as-associate\/\{\{([^}]+)\}\}/);
		const associateIdPlaceholder = associateIdMatch ? associateIdMatch[1] : undefined;
		if (associateIdPlaceholder && secondaryIdPlaceholder === associateIdPlaceholder) {
			secondaryIdPlaceholder = undefined;
		}

		// Detect store-key placeholder
		const storeKeyMatch = urlTemplate.match(/in-store\/key=\{\{([^}]+)\}\}/);
		const storeKeyPlaceholder = storeKeyMatch ? storeKeyMatch[1] : undefined;
		if (storeKeyPlaceholder && keyPlaceholder === storeKeyPlaceholder) {
			const allKeyMatches = [...urlTemplate.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
			keyPlaceholder = allKeyMatches.length >= 2 ? allKeyMatches[1] : undefined;
		}

		const description =
			typeof req.description === 'string'
				? req.description
				: ((req.description as { content?: string })?.content ?? '');

		operations.push({
			name: item.name,
			value: slugify(item.name),
			method,
			urlTemplate,
			bodyFields,
			actionBodyFields,
			queryParams,
			description,
			folder: parentFolder,
			subFolder: subFolderName,
			isUpdateAction: isActionSubFolder,
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
}
