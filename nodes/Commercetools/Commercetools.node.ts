/**
 * Commercetools.node.ts
 *
 * The custom n8n node for commercetools.
 */

import type {
	IBinaryData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
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
	if (opDef.isImageUpload) {
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

		if (opDef.isSearch) {
			// ── Search endpoint (POST .../search) ─────────────────────────
			//
			// Product Search (POST /products/search) and Order Search
			// (POST /orders/search) accept a free-form SearchRequest JSON
			// body (query, sort, limit, offset, markMatchingVariants, etc.).
			//
			// The Postman entries for these have an *empty* body, so
			// bodyFields = [] and the field-by-field assembly produces {}.
			// CT rejects an empty body with a 400 error.
			//
			// Fix: expose a single "Search Request Body (JSON)" textarea in
			// the n8n UI (field name: searchBody__<resource>__<operation>)
			// and pass the parsed JSON through directly as the POST body.
			const rawSearchBody = safeGet<unknown>(
				this,
				`searchBody__${resource}__${operation}`,
				i,
				'{}',
			);
			const parsed = tryParseJson(rawSearchBody);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				body = parsed as Record<string, unknown>;
			}
			// If empty / invalid, send empty body — CT allows {} for search (returns all results)
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

	const options: IRequestOptions = {
		method: opDef.method as IRequestOptions['method'],
		url: fullUrl,
		qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
		json: true,
		headers: ['POST', 'PUT', 'PATCH'].includes(opDef.method)
			? { 'Content-Type': 'application/json' }
			: undefined,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (opDef.method === 'HEAD') {
		try {
			const headOptions: IRequestOptions = {
				...options,
				resolveWithFullResponse: true,
				simple: false,
			};
			const response = await this.helpers.requestWithAuthentication.call(
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
		return await this.helpers.requestWithAuthentication.call(
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
 * CT expects:
 *   - Raw binary body (the image bytes)
 *   - Content-Type: <image mime type> or application/octet-stream
 *   - Query params: variantId OR sku (required), staged (optional), filename (optional)
 *
 * In n8n, binary data comes from a preceding node (Read Binary File, HTTP
 * Request, etc.) and is accessed via item.binary[propertyName].
 *
 * The operation exposes these n8n fields (set by generateProperties):
 *   binaryPropertyName  — which binary property holds the image (default: "data")
 *   variantId           — variant to attach the image to (number, optional)
 *   sku                 — alternative to variantId (string, optional)
 *   staged              — whether to stage (boolean, default true)
 *   filename            — suggested filename (string, optional)
 */
async function executeImageUpload(
	this: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	fullUrl: string,
): Promise<unknown> {
	const binaryPropertyName = safeGet<string>(this, 'binaryPropertyName', i, 'data');
	const variantId = safeGet<number>(this, 'variantId', i, 0);
	const sku = safeGet<string>(this, 'sku', i, '');
	const staged = safeGet<boolean>(this, 'staged', i, true);
	const filename = safeGet<string>(this, 'filename', i, '');

	// Get binary data from the current input item
	const items = this.getInputData();
	const item = items[i];

	if (!item.binary || !item.binary[binaryPropertyName]) {
		throw new NodeOperationError(
			this.getNode(),
			`No binary data found on property "${binaryPropertyName}". ` +
				`Connect a node that outputs binary data (e.g. Read Binary File) ` +
				`and ensure the Binary Property Name matches.`,
		);
	}

	const binaryData: IBinaryData = item.binary[binaryPropertyName];
	const mimeType: string = binaryData.mimeType || 'application/octet-stream';

	// CT requires variantId or sku
	const qs: Record<string, string> = {};
	if (variantId > 0) {
		qs.variantId = String(variantId);
	} else if (sku) {
		qs.sku = sku;
	} else {
		throw new NodeOperationError(
			this.getNode(),
			'Image upload requires either a Variant ID or a SKU to identify which product variant to attach the image to.',
		);
	}
	qs.staged = String(staged);
	if (filename) qs.filename = filename;

	// Read the raw binary buffer
	const binaryBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

	const options: IRequestOptions = {
		method: 'POST',
		url: fullUrl,
		qs,
		// Do NOT set json:true — we're sending raw binary
		headers: { 'Content-Type': mimeType },
		body: binaryBuffer,
		encoding: null, // prevent n8n from treating the body as a string
	};

	try {
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'commerceToolsOAuth2Api',
			options,
		);
		// CT returns the updated Product as JSON; parse if returned as string
		if (typeof response === 'string') {
			try {
				return JSON.parse(response);
			} catch {
				return { raw: response };
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
	if (op.isSearch) return false;
	if (op.isImageUpload) return false;
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
