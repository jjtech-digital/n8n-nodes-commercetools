/**
 * nodes/Commercetools/utils/bodyBuilder.utils.ts
 *
 * Builds the HTTP request body for commercetools API operations.
 *
 * Handles four distinct body shapes:
 *   1. Search  — POST .../search; body__search__ prefix; empty arrays omitted
 *   2. Update  — version + actions[]; from actionsJson or actionsUi
 *   3. Create  — flat body fields from body__create__ prefix
 *   4. Misc    — other POST body fields from body__misc__ prefix
 *
 * Extracted from Commercetools.node.ts to keep that file under 300 lines.
 *
 * NODE-BUG-1 FIX: create/misc branches no longer skip `val === 0`.
 *                  Zero is a valid numeric value (e.g. quantity=0, centAmount=0).
 *                  Only `null`, `undefined`, and `''` are skipped.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ParsedOperation } from '../../../scripts/collection/types';
import { isMainUpdateOp, isCreateOp } from '../../../scripts/operationUtils';
import { safeGet } from './urlBuilder.utils';

// ─── Public entry point ────────────────────────────────────────────────────────

/**
 * Build and return the JSON request body for the given operation.
 * Returns `undefined` for methods that don't send a body (GET, DELETE, HEAD).
 */
export function buildRequestBody(
	ctx: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	resource: string,
	operation: string,
): Record<string, unknown> | undefined {
	if (!['POST', 'PUT', 'PATCH'].includes(opDef.method)) return undefined;

	const body: Record<string, unknown> = {};

	if (opDef.isSearch || /\/search$/.test(opDef.urlTemplate)) {
		buildSearchBody(ctx, i, opDef, resource, operation, body);
	} else if (isMainUpdateOp(opDef)) {
		buildUpdateBody(ctx, i, opDef, resource, body);
	} else if (isCreateOp(opDef)) {
		buildCreateBody(ctx, i, opDef, resource, operation, body);
	} else {
		buildMiscBody(ctx, i, opDef, resource, operation, body);
	}

	return body;
}

// ─── Body builders ────────────────────────────────────────────────────────────

function buildSearchBody(
	ctx: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	resource: string,
	operation: string,
	body: Record<string, unknown>,
): void {
	for (const field of opDef.bodyFields) {
		// BP-6: search fields use body__search__ prefix (was body__misc__)
		const pname = `body__search__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
		const val = safeGet<unknown>(ctx, pname, i, null);
		if (val === null || val === undefined) continue;
		const parsed = tryParseJson(val);
		// Skip empty arrays — CT search rejects { query: { and: [] } }
		if (Array.isArray(parsed) && parsed.length === 0) continue;
		setNested(body, field.name, parsed);
	}
}

function buildUpdateBody(
	ctx: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	resource: string,
	body: Record<string, unknown>,
): void {
	body.version = safeGet<number>(ctx, 'version', i, 1);

	const rawJson = safeGet<unknown>(ctx, `actionsJson__${resource}`, i, '[]');
	let actions: unknown[] = tryParseArray(rawJson);

	if (actions.length === 0) {
		actions = buildActionsFromUi(ctx, i, resource);
	}

	if (actions.length === 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			'No actions provided. Add at least one action via Actions (UI) or Actions (JSON).',
		);
	}

	body.actions = actions;
}

function buildCreateBody(
	ctx: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	resource: string,
	operation: string,
	body: Record<string, unknown>,
): void {
	for (const field of opDef.bodyFields) {
		if (field.name === 'version') continue;
		const pname = `body__create__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
		const val = safeGet<unknown>(ctx, pname, i, null);
		// NODE-BUG-1 FIX: only skip null/undefined/'' — NOT 0 (zero is valid)
		if (val === null || val === undefined || val === '') continue;
		setNested(body, field.name, tryParseJson(val));
	}
}

function buildMiscBody(
	ctx: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	resource: string,
	operation: string,
	body: Record<string, unknown>,
): void {
	for (const field of opDef.bodyFields) {
		const pname = `body__misc__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
		const val = safeGet<unknown>(ctx, pname, i, null);
		// NODE-BUG-1 FIX: only skip null/undefined/'' — NOT 0
		if (val === null || val === undefined || val === '') continue;
		setNested(body, field.name, tryParseJson(val));
	}
}

// ─── Actions UI builder ────────────────────────────────────────────────────────

export function buildActionsFromUi(
	ctx: IExecuteFunctions,
	i: number,
	resource: string,
): unknown[] {
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

// ─── JSON utilities ───────────────────────────────────────────────────────────

export function tryParseJson(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
		try {
			return restoreLocaleKeys(JSON.parse(trimmed));
		} catch {
			/* fall through */
		}
	}
	return value;
}

export function tryParseArray(raw: unknown): unknown[] {
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

/**
 * Recursively convert underscore locale keys back to IETF hyphenated tags.
 *
 * n8n parameter names cannot contain hyphens, so the generator emits locale
 * keys as underscores (e.g. en_AU). CT requires hyphens (e.g. en-AU).
 * Only objects whose EVERY key matches the locale pattern are remapped.
 */
function restoreLocaleKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(restoreLocaleKeys);
	if (typeof value === 'object' && value !== null) {
		const obj = value as Record<string, unknown>;
		const keys = Object.keys(obj);
		const allLocale = keys.every((k) => /^[a-z]{2}(_[A-Z]{2})?$/.test(k));
		const result: Record<string, unknown> = {};
		for (const k of keys) {
			const newKey = allLocale ? k.replace('_', '-') : k;
			result[newKey] = restoreLocaleKeys(obj[k]);
		}
		return result;
	}
	return value;
}

// ─── Object utility ───────────────────────────────────────────────────────────

export function setNested(obj: Record<string, unknown>, dotPath: string, value: unknown): void {
	const parts = dotPath.split('.');
	let cur = obj;
	for (let j = 0; j < parts.length - 1; j++) {
		if (typeof cur[parts[j]] !== 'object' || cur[parts[j]] === null) cur[parts[j]] = {};
		cur = cur[parts[j]] as Record<string, unknown>;
	}
	cur[parts[parts.length - 1]] = value;
}
