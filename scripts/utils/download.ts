/**
 * scripts/utils/download.ts
 *
 * HTTPS file downloader with redirect handling and HTTP-error detection.
 *
 * Fixes applied:
 *   BUG-2: Null-check on redirect Location header before following.
 *   BUG-3: Non-2xx responses are rejected before writing to disk — prevents
 *           HTML error pages from silently overwriting collection.json.
 *   BUG-5: MAX_REDIRECTS guard prevents infinite redirect loops.
 */

import * as fs from 'fs';
import * as https from 'https';

const MAX_REDIRECTS = 5;

/**
 * Download a file from `url` to `dest`, following up to MAX_REDIRECTS
 * HTTP redirects.
 *
 * Rejects when:
 *   - More than MAX_REDIRECTS redirects are encountered
 *   - A redirect has no Location header
 *   - The final HTTP response status is not 2xx
 *   - A network error occurs
 */
export function downloadFile(url: string, dest: string, redirectDepth = 0): Promise<void> {
	if (redirectDepth > MAX_REDIRECTS) {
		return Promise.reject(new Error(`Too many redirects (>${MAX_REDIRECTS}) downloading ${url}`));
	}

	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);

		https
			.get(url, (response) => {
				// ── Redirect ──────────────────────────────────────────────────
				if (response.statusCode === 301 || response.statusCode === 302) {
					file.close();
					const location = response.headers.location;
					if (!location) {
						reject(
							new Error(`Redirect ${response.statusCode} with no Location header from ${url}`),
						);
						return;
					}
					downloadFile(location, dest, redirectDepth + 1)
						.then(resolve)
						.catch(reject);
					return;
				}

				// ── BUG-3: Reject non-2xx before writing anything ─────────────
				if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
					file.close();
					fs.unlink(dest, () => {}); // clean up empty/partial file
					reject(
						new Error(
							`HTTP ${response.statusCode} downloading collection from ${url}. ` +
								`Check the URL and your network connection.`,
						),
					);
					return;
				}

				// ── Success: pipe to disk ─────────────────────────────────────
				response.pipe(file);
				file.on('finish', () => file.close(() => resolve()));
			})
			.on('error', (err) => {
				fs.unlink(dest, () => {});
				reject(err);
			});
	});
}
