/**
 * Commercetools.node.ts
 *
 * Thin orchestrator for the commercetools n8n action node.
 *
 * Heavy logic lives in dedicated utility modules:
 *   urlBuilder.utils.ts   — URL construction and path param substitution
 *   bodyBuilder.utils.ts  — request body assembly for all operation types
 *   imageUpload.utils.ts  — SSRF-guarded image download + binary POST
 *
 * Bug fixes applied in this pass:
 *   GEN-BUG-1: isMainUpdateOp imported from scripts/operationUtils (shared
 *              source of truth for generator and runtime — was duplicated).
 *   NODE-BUG-1: create/misc branches no longer skip val === 0 (in bodyBuilder).
 *   NODE-BUG-2: safeGet re-throws non-"not-found" errors (in urlBuilder).
 *   NODE-BP-2:  IPv4-mapped IPv6 blocked in validateImageUrl (in imageUpload).
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
import type { ParsedOperation } from '../../scripts/collection/types';
import operationsMap from './generated/operations.json';
import { isMainUpdateOp } from '../../scripts/operationUtils';
import { buildUrl, safeGet } from './utils/urlBuilder.utils';
import { buildRequestBody } from './utils/bodyBuilder.utils';
import { executeImageUpload } from './utils/imageUpload.utils';

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
		usableAsTool: true,
		properties: generatedProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('commerceToolsOAuth2Api');

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await executeOperation.call(this, i, credentials);
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

async function executeOperation(
	this: IExecuteFunctions,
	i: number,
	creds: IDataObject,
): Promise<unknown> {
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

	const fullUrl = buildUrl.call(this, i, opDef, projectKey, baseUrl, operation);

	// ── Image upload — binary body, not JSON ──────────────────────────────────
	if (opDef.isImageUpload || /\/images$/.test(opDef.urlTemplate)) {
		return executeImageUpload.call(this, i, opDef, fullUrl);
	}

	// ── Build query string ────────────────────────────────────────────────────
	const queryParams: Record<string, string> = {};

	if (opDef.method === 'DELETE' && operation !== 'deleteCustomObjectByContainerAndKey') {
		queryParams.version = String(safeGet<number>(this, 'version', i, 1));
	}

	if (['GET', 'HEAD'].includes(opDef.method)) {
		const filters = safeGet<Record<string, string>>(this, `queryParams__${operation}`, i, {});
		for (const [k, v] of Object.entries(filters)) {
			if (v !== null && v !== undefined && v !== '') queryParams[k] = String(v);
		}
		for (const paramName of opDef.queryParams) {
			const val = safeGet<string>(this, `reqParam__${operation}__${paramName}`, i, '');
			if (val !== '') queryParams[paramName] = val;
		}
	}

	// ── Build request body ────────────────────────────────────────────────────
	const body = buildRequestBody(this, i, opDef, resource, operation);

	// ── HEAD check ────────────────────────────────────────────────────────────
	if (opDef.method === 'HEAD') {
		return executeHeadCheck.call(this, fullUrl, queryParams, opDef.name);
	}

	// ── Execute ───────────────────────────────────────────────────────────────
	const options: IHttpRequestOptions = {
		method: opDef.method as IHttpRequestOptions['method'],
		url: fullUrl,
		qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
		json: true,
	};

	const isSearchOp = opDef.isSearch || /\/search$/.test(opDef.urlTemplate);
	if (body && (isSearchOp || Object.keys(body).length > 0)) {
		options.body = body;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'commerceToolsOAuth2Api',
			options,
		);
	} catch (err) {
		throw new NodeApiError(
			this.getNode(),
			{ message: (err as Error).message },
			{ message: `[${opDef.name}]: ${(err as Error).message}` },
		);
	}
}

// ─── HEAD check ───────────────────────────────────────────────────────────────

async function executeHeadCheck(
	this: IExecuteFunctions,
	fullUrl: string,
	queryParams: Record<string, string>,
	opName: string,
): Promise<unknown> {
	try {
		await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'HEAD',
			url: fullUrl,
			qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
		} as IHttpRequestOptions);
		return { exists: true, statusCode: 200, url: fullUrl };
	} catch (err: unknown) {
		const statusCode = (err as Record<string, unknown>)?.statusCode ?? 404;
		if (statusCode === 404) return { exists: false, statusCode: 404, url: fullUrl };
		throw new NodeApiError(
			this.getNode(),
			{ message: (err as Error).message },
			{ message: `[${opName}]: ${(err as Error).message}` },
		);
	}
}

// Re-export for any callers that import isMainUpdateOp from this module
export { isMainUpdateOp };
