/**
 * Commercetools.node.ts
 *
 * The custom n8n node for commercetools.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { generatedProperties } from './generated/properties';
import type { ParsedOperation } from '../../scripts/parseCollection';
import operationsMap from './generated/operations.json';

export class Commercetools implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'commercetools',
		name: 'commercetools',
		icon: 'file:Commercetools.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Interact with the commercetools API. Operations are auto-generated from the official Postman collection.',
		defaults: { name: 'commercetools' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'commerceToolsOAuth2Api', required: true }],
		properties: generatedProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await executeOperation.call(this, i);
				returnData.push({ json: result as IDataObject });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// ─── Executor ─────────────────────────────────────────────────────────────────

async function executeOperation(this: IExecuteFunctions, i: number): Promise<unknown> {
	const creds = await this.getCredentials('commerceToolsOAuth2Api');
	const projectKey = creds.projectKey as string;
	const region = creds.region as string;
	const baseUrl = `https://api.${region}.commercetools.com`;

	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;
	const opDef = (operationsMap as Record<string, ParsedOperation>)[operation];
	if (!opDef) {
		throw new NodeOperationError(
			this.getNode(),
			`Unknown operation "${operation}". Re-run npm run generate to sync.`,
		);
	}

	// ── Build URL ─────────────────────────────────────────────────────────────

	let urlPath = opDef.urlTemplate
		.replace(/\{\{project-key\}\}/g, projectKey)
		.replace(/\{\{projectKey\}\}/g, projectKey);

	if (opDef.requiresId) {
		if (opDef.pathParamSegment && opDef.pathParamName) {
			// ── Non-standard path param: /customer-id={{customer-id}} ──────
			const paramValue = safeGet<string>(this, opDef.pathParamName, i, '');
			urlPath = urlPath.replace(
				new RegExp(opDef.pathParamSegment + '=\\{\\{[^}]+\\}\\}'),
				`${opDef.pathParamSegment}=${paramValue}`,
			);
		} else if (opDef.requiresKey) {
			// ── /key={{...}} endpoints ────────────────────────────────────
			//
			// Use opDef.keyPlaceholder (the exact variable name parsed from
			// the Postman URL at generate-time) so compound URLs like
			//   /products/key={{product-key}}/product-selections
			// are substituted correctly regardless of placeholder naming.
			const key = safeGet<string>(this, 'resourceKey', i, '');
			if (opDef.keyPlaceholder) {
				const escapedPlaceholder = opDef.keyPlaceholder.replace(/-/g, '\\-');
				urlPath = urlPath.replace(
					new RegExp(`key=\\{\\{${escapedPlaceholder}\\}\\}`),
					`key=${key}`,
				);
			} else {
				urlPath = urlPath.replace(/key=\{\{[^}]+\}\}/, `key=${key}`);
			}
		} else {
			// ── Standard /{{ID}} endpoints ────────────────────────────────
			const id = safeGet<string>(this, 'resourceId', i, '');
			urlPath = urlPath.replace(/\{\{[^}]*[Ii][Dd]\}\}/g, id).replace(/\/:id/g, `/${id}`);
		}
	}

	// Strip any remaining unreplaced {{variable}} placeholders.
	urlPath = urlPath.replace(/\{\{[^}]+\}\}/g, '');

	const fullUrl = `${baseUrl}${urlPath}`;

	// ── Image Upload — binary body, not JSON ──────────────────────────────────
	//
	// POST /products/{id}/images sends raw binary (application/octet-stream or
	// image/*), not a JSON payload. Handle it separately before the JSON path.
	if (opDef.isImageUpload || /\/images$/.test(opDef.urlTemplate)) {
		return await executeImageUpload.call(this, i, opDef, fullUrl);
	}

	// ── Build query string ────────────────────────────────────────────────────

	const queryParams: Record<string, string> = {};

	if (opDef.method === 'DELETE') {
		queryParams.version = String(safeGet<number>(this, 'version', i, 1));
	}

	if (['GET', 'HEAD'].includes(opDef.method)) {
		const filters = safeGet<Record<string, string>>(this, `queryParams__${operation}`, i, {});
		for (const [k, v] of Object.entries(filters)) {
			if (v !== null && v !== undefined && v !== '') {
				queryParams[k] = String(v);
			}
		}
	}

	// ── Build request body ────────────────────────────────────────────────────

	let body: Record<string, unknown> | undefined;

	if (['POST', 'PUT', 'PATCH'].includes(opDef.method)) {
		body = {};

		if (opDef.isSearch || /\/search$/.test(opDef.urlTemplate)) {
			// ── Search endpoint (POST .../search) ─────────────────────────
			// Detected by opDef.isSearch flag (post-regenerate) OR by URL
			// pattern (works without regenerating operations.json).
			//
			// CT Search body fields: query.and (json array), sort (json array),
			// limit (number), offset (number).
			//
			// Skip rules (differ from standard misc-POST):
			//   • Skip null/undefined                      — same as always
			//   • Skip empty arrays []                     — CT rejects { query: { and: [] } }
			//                                                with "exhausted input"; omitting the
			//                                                field entirely returns all results ✓
			//   • KEEP 0  (offset=0 is valid, must be sent)
			//   • KEEP '' (not applicable here but safe)
			//
			// Always attach body even if it ends up as {} — CT accepts that
			// for search and returns all results.
			for (const field of opDef.bodyFields) {
				const pname = `body__misc__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
				const val = safeGet<unknown>(this, pname, i, null);
				if (val === null || val === undefined) continue;
				const parsed = tryParseJson(val);
				// Skip empty arrays — CT search rejects { query: { and: [] } }
				if (Array.isArray(parsed) && parsed.length === 0) continue;
				setNested(body, field.name, parsed);
			}
		} else if (isMainUpdateOp(opDef)) {
			// ── Main update endpoint: build actions array ──────────────────
			body.version = safeGet<number>(this, 'version', i, 1);

			const rawJson = safeGet<unknown>(this, `actionsJson__${resource}`, i, '[]');
			let actions: unknown[] = tryParseArray(rawJson);

			if (actions.length === 0) {
				const rawUiValue = safeGet<unknown>(this, `actionsUi__${resource}`, i, '__NOT_FOUND__');
				console.info(`[CT DEBUG] actionsUi__${resource} raw value:`, JSON.stringify(rawUiValue));
				actions = buildActionsFromUi(this, i, resource);
				console.info(`[CT DEBUG] built actions:`, JSON.stringify(actions));
			}

			if (actions.length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					'No actions provided. Add at least one action via Actions (UI) or Actions (JSON).',
				);
			}

			body.actions = actions;
		} else if (/\bcreate\b/i.test(opDef.name)) {
			// ── Create: flat body fields ───────────────────────────────────
			for (const field of opDef.bodyFields) {
				if (field.name === 'version') continue;
				const pname = `body__create__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
				const val = safeGet<unknown>(this, pname, i, null);
				if (val === null || val === '' || val === 0) continue;
				setNested(body, field.name, tryParseJson(val));
			}
		} else {
			// ── Misc POST (Replicate Cart, Change Password, etc.) ──────────
			for (const field of opDef.bodyFields) {
				const pname = `body__misc__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
				const val = safeGet<unknown>(this, pname, i, null);
				if (val === null || val === '' || val === 0) continue;
				setNested(body, field.name, tryParseJson(val));
			}
		}
	}

	// ── Execute ───────────────────────────────────────────────────────────────

	const options: IHttpRequestOptions = {
		method: opDef.method as IHttpRequestOptions['method'],
		url: fullUrl,
		qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
		json: true,
		headers: ['POST', 'PUT', 'PATCH'].includes(opDef.method)
			? { 'Content-Type': 'application/json' }
			: undefined,
	};

	// For search ops, always send body even if empty ({} is valid — CT returns all results).
	const isSearchOp = opDef.isSearch || /\/search$/.test(opDef.urlTemplate);
	if (body && (isSearchOp || Object.keys(body).length > 0)) {
		options.body = body;
	}

	if (opDef.method === 'HEAD') {
		try {
			const headOptions = {
				...options,
				resolveWithFullResponse: true,
				simple: false,
			} as unknown as IHttpRequestOptions;
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'commerceToolsOAuth2Api',
				headOptions,
			);
			const statusCode: number = response.statusCode ?? response.status ?? 0;
			return {
				exists: statusCode >= 200 && statusCode < 300,
				statusCode,
				url: fullUrl,
			};
		} catch (err) {
			throw new NodeApiError(this.getNode(), err, {
				message: `[${opDef.name}]: ${(err as Error).message}`,
			});
		}
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'commerceToolsOAuth2Api',
			options,
		);
	} catch (err) {
		throw new NodeApiError(this.getNode(), err, {
			message: `[${opDef.name}]: ${(err as Error).message}`,
		});
	}
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

/**
 * Executes the CT image upload: POST /products/{id}/images
 *
 * CT requires raw binary image bytes in the body with Content-Type set to the
 * image mime type (image/jpeg, image/png, or image/gif). It does NOT accept a
 * JSON body with a URL — that returns:
 *   "Unsupported Content-Type: application/json. The supported formats are
 *    image/jpeg, image/png and image/gif."
 *
 * Strategy: download the image from imageUrl first using n8n's helpers.request,
 * then POST the raw buffer to CT with the correct Content-Type.
 *
 * Query params: variant OR sku (optional), staged (optional), filename (optional)
 * If neither variant nor sku is given, CT uploads to the Master Variant.
 */
async function executeImageUpload(
	this: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	fullUrl: string,
): Promise<unknown> {
	const imageUrl = safeGet<string>(this, 'imageUrl', i, '');
	const variant = safeGet<number>(this, 'variant', i, 0);
	const sku = safeGet<string>(this, 'sku', i, '');
	const staged = safeGet<boolean>(this, 'staged', i, true);
	const filename = safeGet<string>(this, 'filename', i, '');

	if (!imageUrl) {
		throw new NodeOperationError(
			this.getNode(),
			'Image URL is required. Provide a publicly accessible URL to the image (JPEG, PNG, or GIF).',
		);
	}

	// ── Step 1: Download the image from the URL ───────────────────────────────
	// Derive Content-Type from the URL extension, defaulting to image/jpeg.
	// CT requires one of: image/jpeg, image/png, image/gif.
	const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
	const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg'; // default covers .jpg, .jpeg, and unknown

	let imageBuffer: Buffer;
	try {
		imageBuffer = (await this.helpers.httpRequest({
			method: 'GET',
			url: imageUrl,
			encoding: null, // return raw Buffer, not string
			resolveWithFullResponse: false,
		} as unknown as IHttpRequestOptions
	)) as Buffer;
	} catch (err) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to download image from "${imageUrl}": ${(err as Error).message}`,
		);
	}

	// ── Step 2: Build CT query params ─────────────────────────────────────────
	const qs: Record<string, string> = {};
	if (variant > 0) {
		qs.variant = String(variant);
	} else if (sku) {
		qs.sku = sku;
	}
	// If neither is provided, CT defaults to the Master Variant — no param needed
	qs.staged = String(staged);
	if (filename) qs.filename = filename;

	// ── Step 3: POST raw binary to CT ─────────────────────────────────────────
	const options = {
		method: 'POST',
		url: fullUrl,
		qs,
		// Do NOT use json:true — we are sending raw binary, not JSON
		headers: { 'Content-Type': mimeType },
		body: imageBuffer,
		encoding: null,
	} as unknown as IHttpRequestOptions;

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'commerceToolsOAuth2Api',
			options,
		);
		// CT returns the updated Product as JSON string when encoding:null is set
		if (typeof response === 'string') {
			try {
				return JSON.parse(response);
			} catch {
				return { raw: response };
			}
		}
		if (Buffer.isBuffer(response)) {
			try {
				return JSON.parse(response.toString('utf8'));
			} catch {
				return { raw: response.toString('utf8') };
			}
		}
		return response;
	} catch (err) {
		throw new NodeApiError(this.getNode(), err, {
			message: `[${opDef.name}]: ${(err as Error).message}`,
		});
	}
}

// ─── isMainUpdateOp ───────────────────────────────────────────────────────────

function isMainUpdateOp(op: ParsedOperation): boolean {
	if (op.isUpdateAction) return false;
	// Guard against search/image ops whether detected by flag (post-regenerate)
	// or by URL pattern (pre-regenerate, current state).
	if (op.isSearch || /\/search$/.test(op.urlTemplate)) return false;
	if (op.isImageUpload || /\/images$/.test(op.urlTemplate)) return false;
	if (/\bupdate\b/i.test(op.name)) return true;
	return op.method === 'POST' && op.requiresId && op.bodyFields.some((f) => f.name === 'actions');
}

// ─── Build actions[] from UI fixedCollection ──────────────────────────────────

function buildActionsFromUi(ctx: IExecuteFunctions, i: number, resource: string): unknown[] {
	const uiData = safeGet<Record<string, Array<Record<string, unknown>>>>(
		ctx,
		`actionsUi__${resource}`,
		i,
		{},
	);

	const actions: unknown[] = [];

	for (const [actionType, itemArray] of Object.entries(uiData)) {
		if (!Array.isArray(itemArray)) continue;

		for (const item of itemArray) {
			const actionPayload: Record<string, unknown> = { action: actionType };

			for (const [key, value] of Object.entries(item)) {
				if (key === '_notice') continue;
				if (value === null || value === undefined || value === '') continue;
				actionPayload[key] = tryParseJson(value);
			}

			actions.push(actionPayload);
		}
	}

	return actions;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeGet<T>(ctx: IExecuteFunctions, name: string, i: number, fallback: T): T {
	try {
		return ctx.getNodeParameter(name, i, fallback) as T;
	} catch {
		return fallback;
	}
}

function tryParseJson(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
		try {
			return JSON.parse(trimmed);
		} catch {
			/* fall through */
		}
	}
	return value;
}

function tryParseArray(raw: unknown): unknown[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw.length > 0 ? raw : [];
	if (typeof raw !== 'string') return [];
	if (raw.trim() === '' || raw.trim() === '[]') return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
	} catch {
		return [];
	}
}

function setNested(obj: Record<string, unknown>, dotPath: string, value: unknown): void {
	const parts = dotPath.split('.');
	let cur = obj;
	for (let j = 0; j < parts.length - 1; j++) {
		if (typeof cur[parts[j]] !== 'object' || cur[parts[j]] === null) cur[parts[j]] = {};
		cur = cur[parts[j]] as Record<string, unknown>;
	}
	cur[parts[parts.length - 1]] = value;
}
