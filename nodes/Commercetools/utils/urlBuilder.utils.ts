/**
 * nodes/Commercetools/utils/urlBuilder.utils.ts
 *
 * Builds the final request URL from a ParsedOperation definition and
 * the user-supplied node parameters.
 *
 * Extracted from Commercetools.node.ts to keep that file under 300 lines
 * and to allow the URL-building logic to be unit-tested in isolation.
 */

import type { IExecuteFunctions, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ParsedOperation } from '../../../scripts/collection/types';

// ─── Path param sanitizer ──────────────────────────────────────────────────────

export function sanitizePathParam(node: INode, value: string, name: string): string {
	if (/[/\\%\0]/.test(value) || value.includes('..')) {
		throw new NodeOperationError(node, `Path parameter "${name}" contains invalid characters`);
	}
	return encodeURIComponent(value);
}

// ─── Safe parameter reader ─────────────────────────────────────────────────────

/**
 * Read a node parameter, returning `fallback` when the parameter does not
 * exist (e.g. it is not visible for this operation).
 *
 * NODE-BUG-2 FIX: The catch block re-throws anything that isn't an n8n
 * "parameter not found" error so genuine runtime exceptions are not silently
 * swallowed.
 */
export function safeGet<T>(ctx: IExecuteFunctions, name: string, i: number, fallback: T): T {
	try {
		return ctx.getNodeParameter(name, i, fallback) as T;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		// n8n throws when a parameter name is unknown for the current display state.
		// Any other error (e.g. type coercion failures) should propagate.
		if (msg.includes('not defined') || msg.includes('could not be found')) return fallback;
		throw err;
	}
}

// ─── URL builder ──────────────────────────────────────────────────────────────

/**
 * Substitute all Postman-style placeholders in the operation URL template
 * and return the final absolute URL.
 */
export function buildUrl(
	this: IExecuteFunctions,
	i: number,
	opDef: ParsedOperation,
	projectKey: string,
	baseUrl: string,
	operation: string,
): string {
	let urlPath = opDef.urlTemplate
		.replace(/\{\{project-key\}\}/g, projectKey)
		.replace(/\{\{projectKey\}\}/g, projectKey);

	// ── In-store endpoints — substitute store-key ─────────────────────────────
	if (urlPath.includes('in-store/key={{')) {
		const storeKey = safeGet<string>(this, 'storeKey', i, '');
		urlPath = urlPath.replace(/in-store\/key=\{\{[^}]+\}\}/, `in-store/key=${storeKey}`);
	}

	// ── Associate endpoints — substitute {{associate-id}} ─────────────────────
	if (urlPath.includes('{{associate-id}}')) {
		const associateId = safeGet<string>(this, 'associateId', i, '');
		urlPath = urlPath.replace(/\{\{associate-id\}\}/g, associateId);
	}

	// ── Tertiary key — substitute second key= segment ────────────────────────
	const keyMatches = [...urlPath.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
	if (keyMatches.length >= 2) {
		const tertiaryKey = safeGet<string>(this, 'tertiaryKey', i, '');
		const secondKeyPlaceholder = keyMatches[1];
		urlPath = urlPath.replace(
			new RegExp(`key=\\{\\{${secondKeyPlaceholder.replace(/-/g, '\\-')}\\}\\}`),
			`key=${tertiaryKey}`,
		);
	}

	// ── Custom Object — container/key path params ─────────────────────────────
	if (
		operation === 'getCustomObjectByContainerAndKey' ||
		operation === 'deleteCustomObjectByContainerAndKey'
	) {
		const container = sanitizePathParam(
			this.getNode(),
			safeGet<string>(this, 'container', i, ''),
			'container',
		);
		const key = sanitizePathParam(
			this.getNode(),
			safeGet<string>(this, 'resourceKey', i, ''),
			'resourceKey',
		);
		urlPath = urlPath
			.replace(/\{\{container\}\}/g, container)
			.replace(/\{\{custom-object-key\}\}/g, key);
	}

	// ── ID / Key substitution ─────────────────────────────────────────────────
	if (opDef.requiresId) {
		// Secondary ID — substitute before any remaining {{...-id}} tokens
		if (opDef.secondaryIdPlaceholder) {
			const secondaryId = sanitizePathParam(
				this.getNode(),
				safeGet<string>(this, 'secondaryId', i, ''),
				'secondaryId',
			);
			urlPath = urlPath.replace(
				new RegExp(`\\{\\{${opDef.secondaryIdPlaceholder.replace(/-/g, '\\-')}\\}\\}`),
				secondaryId,
			);
		}

		if (opDef.pathParamSegment && opDef.pathParamName) {
			// Non-standard path param: /customer-id={{customer-id}}
			const paramValue = sanitizePathParam(
				this.getNode(),
				safeGet<string>(this, opDef.pathParamName, i, ''),
				opDef.pathParamName,
			);
			urlPath = urlPath.replace(
				new RegExp(opDef.pathParamSegment + '=\\{\\{[^}]+\\}\\}'),
				`${opDef.pathParamSegment}=${paramValue}`,
			);
		} else if (opDef.requiresKey) {
			// /key={{...}} endpoints
			const key = sanitizePathParam(
				this.getNode(),
				safeGet<string>(this, 'resourceKey', i, ''),
				'resourceKey',
			);
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
			// Standard /{{ID}} endpoints
			const id = sanitizePathParam(
				this.getNode(),
				safeGet<string>(this, 'resourceId', i, ''),
				'resourceId',
			);
			urlPath = urlPath.replace(/\{\{[^}]*[Ii][Dd]\}\}/g, id).replace(/\/:id/g, `/${id}`);
		}
	}

	// Strip any remaining unreplaced {{variable}} placeholders
	urlPath = urlPath.replace(/\{\{[^}]+\}\}/g, '');

	return `${baseUrl}${urlPath}`;
}
