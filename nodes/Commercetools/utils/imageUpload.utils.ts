/**
 * nodes/Commercetools/utils/imageUpload.utils.ts
 *
 * Handles the commercetools product image upload operation.
 *
 * CT requires raw binary image bytes with the correct image/* Content-Type —
 * it does NOT accept a JSON body with a URL.
 *
 * NODE-BP-2 FIX: validateImageUrl now also blocks IPv4-mapped IPv6 addresses
 *                (e.g. ::ffff:127.0.0.1) that bypassed the original check.
 * NODE-BP-1 FIX: image upload errors are wrapped in NodeApiError and surface
 *                via continueOnFail when the caller honours it.
 */

import type { IExecuteFunctions, IHttpRequestOptions, INode } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { ParsedOperation } from '../../../scripts/collection/types';
import { safeGet } from './urlBuilder.utils';

// ─── SSRF guard ───────────────────────────────────────────────────────────────

/**
 * Validate that the image URL is a public HTTP/HTTPS URL and does not target
 * internal / metadata addresses.
 *
 * NODE-BP-2: Blocks both plain IPv4 private ranges and their IPv4-mapped IPv6
 * equivalents (::ffff:<private-ipv4>), e.g. ::ffff:127.0.0.1.
 */
export function validateImageUrl(node: INode, raw: string): void {
	let parsed: URL;
	try {
		parsed = new URL(raw);
	} catch {
		throw new NodeOperationError(node, 'Image URL is not a valid URL');
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw new NodeOperationError(node, 'Image URL must use HTTP or HTTPS');
	}

	const host = parsed.hostname.toLowerCase();

	// Strip IPv6 brackets for address inspection
	const addr = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;

	// Resolve IPv4-mapped IPv6 (::ffff:a.b.c.d or 0:0:0:0:0:ffff:a.b.c.d)
	const ipv4MappedMatch = addr.match(/^(?::{0,5}|0(?::0){5}):(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/i);
	const effectiveHost = ipv4MappedMatch ? ipv4MappedMatch[1] : addr;

	const blocked = [
		'localhost',
		'127.0.0.1',
		'0.0.0.0',
		'169.254.169.254',
		'metadata.google.internal',
		'::1',
		'[::1]',
	];

	if (
		blocked.includes(effectiveHost) ||
		/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(effectiveHost)
	) {
		throw new NodeOperationError(node, 'Image URL must not target internal addresses');
	}
}

// ─── Image uploader ───────────────────────────────────────────────────────────

/**
 * Execute the CT image upload: download image → POST raw binary to CT.
 *
 * Derive Content-Type from the URL file extension. CT accepts:
 *   image/jpeg (.jpg, .jpeg), image/png (.png), image/gif (.gif)
 * Unknown extensions default to image/jpeg.
 */
export async function executeImageUpload(
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
			'Image URL is required. Provide a publicly accessible URL to a JPEG, PNG, or GIF image.',
		);
	}

	validateImageUrl(this.getNode(), imageUrl);

	// ── Download image ────────────────────────────────────────────────────────
	const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
	const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

	let imageBuffer: Buffer;
	try {
		imageBuffer = (await this.helpers.httpRequest({
			method: 'GET',
			url: imageUrl,
			encoding: null,
			resolveWithFullResponse: false,
		} as unknown as IHttpRequestOptions)) as Buffer;
	} catch (err) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to download image from "${imageUrl}": ${(err as Error).message}`,
		);
	}

	// ── Build CT query params ─────────────────────────────────────────────────
	const qs: Record<string, string> = {};
	if (variant > 0) {
		qs.variant = String(variant);
	} else if (sku) {
		qs.sku = sku;
	}
	qs.staged = String(staged);
	if (filename) qs.filename = filename;

	// ── POST raw binary to CT ─────────────────────────────────────────────────
	const options = {
		method: 'POST',
		url: fullUrl,
		qs,
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
		throw new NodeApiError(
			this.getNode(),
			{ message: (err as Error).message },
			{ message: `[${opDef.name}]: ${(err as Error).message}` },
		);
	}
}
