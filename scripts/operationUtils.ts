/**
 * scripts/operationUtils.ts
 *
 * Shared operation-classification helpers used by BOTH:
 *   - scripts/properties/ (generator)  — which UI fields to emit for an operation
 *   - nodes/Commercetools/Commercetools.node.ts (runtime) — which body-build branch to take
 *
 * GEN-BUG-1 / NODE-BUG-6: Previously each file had its own copy of isMainUpdateOp
 * with slightly different guards, causing generator/runtime divergence.
 * This single implementation is the authoritative source.
 */

import type { ParsedOperation } from './collection/types';

/**
 * Returns true when `op` is a "main" update operation — one that uses the
 * version + actions[] body shape.
 *
 * Exclusions (in priority order):
 *   1. createOrUpdateCustomObject — POST that looks like an update but uses a flat body
 *   2. isUpdateAction — a sub-action inside an update folder (handled separately)
 *   3. isSearch / URL ends in /search — search endpoint, not an update
 *   4. isImageUpload / URL ends in /images — binary upload, not an update
 *   5. Name contains "update" — explicit update ops always qualify
 *   6. POST + requiresId + has actions[] in body — implicit update pattern
 */
export function isMainUpdateOp(op: ParsedOperation): boolean {
	if (op.value === 'createOrUpdateCustomObject') return false;
	if (op.isUpdateAction) return false;
	if (op.isSearch || /\/search$/.test(op.urlTemplate)) return false;
	if (op.isImageUpload || /\/images$/.test(op.urlTemplate)) return false;
	if (/\bupdate\b/i.test(op.name)) return true;
	return op.method === 'POST' && op.requiresId && op.bodyFields.some((f) => f.name === 'actions');
}

/**
 * Returns true when `op` is a create operation that uses a flat body (not
 * an actions[] array).
 *
 * GEN-BUG-3: Centralising this regex in one place ensures the generator and
 * runtime are always in agreement about which operations are "create" ops.
 */
export function isCreateOp(op: ParsedOperation): boolean {
	return (
		!op.isUpdateAction &&
		!isMainUpdateOp(op) &&
		!op.isSearch &&
		!op.isImageUpload &&
		/\bcreate\b/i.test(op.name)
	);
}
