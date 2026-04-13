/**
 * scripts/utils/patches.ts
 *
 * Manual overrides for Postman collection items whose body examples are
 * missing or incomplete. Applied after parsing, before property generation.
 *
 * BP-1: applyManualPatches now MERGES patch fields rather than replacing
 *       the entire array. Fields already present by name are not duplicated.
 * BP-2: Each patch entry includes a "Root cause" comment so future maintainers
 *       can judge whether the patch is still needed after a collection update.
 */

import type { ParsedOperation, BodyField } from '../collection/types';

interface OperationPatch {
	bodyFields?: BodyField[];
	actionBodyFields?: BodyField[];
	queryParams?: string[];
}

// ─── Patch registry ───────────────────────────────────────────────────────────

export const MANUAL_PATCHES: Record<string, OperationPatch> = {
	// Root cause: Postman collection body for queryCustomObjects has no query
	// param examples; the parser finds an empty queryParams array.
	queryCustomObjects: {
		queryParams: ['container', 'sort', 'where', 'expand', 'limit', 'offset', 'withTotal'],
	},

	// Root cause: changeAssociateMode Postman item body is a placeholder object
	// with no real fields; extractFields returns [].
	changeAssociateMode: {
		bodyFields: [
			{
				name: 'version',
				type: 'string',
				required: true,
				example: 'placeholder',
				description: 'Version',
			},
			{
				name: 'actions',
				type: 'json',
				required: false,
				example: [{ action: 'changeAssociateMode', associateMode: 'ExplicitAndFromParent' }],
				description: 'Array of actions',
			},
		],
		actionBodyFields: [
			{
				name: 'associateMode',
				type: 'string',
				required: true,
				example: 'ExplicitAndFromParent',
				description: 'Associate Mode',
			},
		],
	},

	// Root cause: changeCartPredicate Postman item has no actionBodyFields example.
	changeCartPredicate: {
		actionBodyFields: [
			{
				name: 'cartPredicate',
				type: 'string',
				required: true,
				example: 'totalPrice.centAmount > 10000',
				description: 'Cart Predicate',
			},
		],
	},

	// Root cause: changeTarget Postman item has no actionBodyFields example.
	changeTarget: {
		actionBodyFields: [
			{
				name: 'target',
				type: 'json',
				required: true,
				example: { type: 'lineItems', predicate: '1 = 1' },
				description: 'Target',
			},
		],
	},

	// Root cause: setCartPredicate Postman item has no actionBodyFields example.
	setCartPredicate: {
		actionBodyFields: [
			{
				name: 'cartPredicate',
				type: 'string',
				required: false,
				example: 'totalPrice.centAmount > 10000',
				description: 'Cart Predicate',
			},
		],
	},
};

// ─── Applier ──────────────────────────────────────────────────────────────────

/**
 * Apply MANUAL_PATCHES to operations after parsing.
 *
 * BP-1 FIX: Merges patch fields instead of replacing the array entirely.
 * A patch is applied to fields that are already partially populated —
 * only fields not already present by name are added.
 */
export function applyManualPatches(operations: ParsedOperation[]): void {
	for (const op of operations) {
		const patch = MANUAL_PATCHES[op.value];
		if (!patch) continue;

		if (patch.bodyFields !== undefined) {
			const existing = new Set(op.bodyFields.map((f) => f.name));
			for (const pf of patch.bodyFields) {
				if (!existing.has(pf.name)) op.bodyFields.push(pf);
			}
		}

		if (patch.actionBodyFields !== undefined) {
			const existing = new Set(op.actionBodyFields.map((f) => f.name));
			for (const pf of patch.actionBodyFields) {
				if (!existing.has(pf.name)) op.actionBodyFields.push(pf);
			}
		}

		if (patch.queryParams !== undefined) {
			op.queryParams = patch.queryParams;
		}
	}
}
