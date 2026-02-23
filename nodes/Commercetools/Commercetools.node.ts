/**
 * Commercetools.node.ts
 *
 * The custom n8n node for commercetools.
 */

import type {
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
	//
	// Postman collection uses {{project-key}} (kebab-case).
	// Replace both variants to be safe.

	let urlPath = opDef.urlTemplate
		.replace(/\{\{project-key\}\}/g, projectKey)
		.replace(/\{\{projectKey\}\}/g, projectKey);

	if (opDef.requiresId) {
		if (/by\s*key/i.test(opDef.name)) {
			const key = safeGet<string>(this, 'resourceKey', i, '');
			urlPath = urlPath.replace(/key=\{\{[^}]+\}\}/, `key=${key}`);
			urlPath = urlPath.replace(/\{\{[^}]*[Kk]ey\}\}/, key);
		} else {
			const id = safeGet<string>(this, 'resourceId', i, '');
			urlPath = urlPath.replace(/\{\{[^}]*[Ii][Dd]\}\}/g, id).replace(/\/:id/g, `/${id}`);
		}
	}

	// Strip any remaining unreplaced {{variable}} placeholders to avoid broken URLs
	urlPath = urlPath.replace(/\{\{[^}]+\}\}/g, '');

	const fullUrl = `${baseUrl}${urlPath}`;

	// ── Build query string ────────────────────────────────────────────────────

	const queryParams: Record<string, string> = {};

	// DELETE: version goes in query string
	if (opDef.method === 'DELETE') {
		queryParams.version = String(safeGet<number>(this, 'version', i, 1));
	}

	// GET / HEAD: merge filters collection
	if (['GET', 'HEAD'].includes(opDef.method)) {
		const filters = safeGet<Record<string, string>>(this, `queryParams__${operation}`, i, {});
		// Only add non-empty filter values
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

		if (isMainUpdateOp(opDef)) {
			// ── Main update endpoint: build actions array ──────────────────
			body.version = safeGet<number>(this, 'version', i, 1);

			// Priority 1: raw JSON override (non-empty array only)
			const rawJson = safeGet<string>(this, `actionsJson__${resource}`, i, '[]');
			let actions: unknown[] = tryParseArray(rawJson);

			// Priority 2: UI builder
			if (actions.length === 0) {
				// Debug: log the raw fixedCollection value so we can see its shape
				const rawUiValue = safeGet<unknown>(this, `actionsUi__${resource}`, i, '__NOT_FOUND__');
				console.info(`[CT DEBUG] actionsUi__${resource} raw value:`, JSON.stringify(rawUiValue));
				actions = buildActionsFromUi(this, i, resource);
				console.info(`[CT DEBUG] built actions:`, JSON.stringify(actions));
			}

			// Require at least one action — CT rejects empty actions arrays
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
		}
	}

	// ── Execute ───────────────────────────────────────────────────────────────

	const options: IRequestOptions = {
		method: opDef.method as IRequestOptions['method'],
		url: fullUrl,
		qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
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

// ─── isMainUpdateOp (mirrors the generator logic) ────────────────────────────

function isMainUpdateOp(op: ParsedOperation): boolean {
	if (op.isUpdateAction) return false;
	if (/\bupdate\b/i.test(op.name)) return true;
	return op.method === 'POST' && op.requiresId && op.bodyFields.some((f) => f.name === 'actions');
}

// ─── Build actions[] from UI fixedCollection ──────────────────────────────────

/**
 * Reads the fixedCollection UI data and builds the CT `actions` array.
 *
 * fixedCollection structure (one option group per action type):
 *   actionsUi__products = {
 *     changeName:  [{ name: {"en":"..."} }],
 *     addPrice:    [{ variantId: 1, price: {...} }],
 *     publish:     [{ _notice: '' }],   ← zero-param actions
 *   }
 */
function buildActionsFromUi(ctx: IExecuteFunctions, i: number, resource: string): unknown[] {
	// n8n returns fixedCollection (multipleValues) data in two possible shapes
	// depending on version/context:
	//
	//   Shape A (object keyed by option name):
	//     { setMetaTitle: [{ metaTitle: '...', staged: false }], ... }
	//
	//   Shape B (some n8n versions wrap in a 'values' key or similar)
	//
	// We use the raw parameter value and handle both.
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
				// Skip the notice placeholder (zero-param actions like Publish)
				if (key === '_notice') continue;
				// Skip empty / null / undefined values — but keep false and 0
				if (value === null || value === undefined || value === '') continue;

				// Parse JSON strings back to objects/arrays
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

function tryParseArray(raw: string): unknown[] {
	if (!raw || raw.trim() === '' || raw.trim() === '[]') return [];
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
