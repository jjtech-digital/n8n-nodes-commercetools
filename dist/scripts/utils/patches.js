"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANUAL_PATCHES = void 0;
exports.applyManualPatches = applyManualPatches;
exports.MANUAL_PATCHES = {
    queryCustomObjects: {
        queryParams: ['container', 'sort', 'where', 'expand', 'limit', 'offset', 'withTotal'],
    },
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
function applyManualPatches(operations) {
    for (const op of operations) {
        const patch = exports.MANUAL_PATCHES[op.value];
        if (!patch)
            continue;
        if (patch.bodyFields !== undefined) {
            const existing = new Set(op.bodyFields.map((f) => f.name));
            for (const pf of patch.bodyFields) {
                if (!existing.has(pf.name))
                    op.bodyFields.push(pf);
            }
        }
        if (patch.actionBodyFields !== undefined) {
            const existing = new Set(op.actionBodyFields.map((f) => f.name));
            for (const pf of patch.actionBodyFields) {
                if (!existing.has(pf.name))
                    op.actionBodyFields.push(pf);
            }
        }
        if (patch.queryParams !== undefined) {
            op.queryParams = patch.queryParams;
        }
    }
}
//# sourceMappingURL=patches.js.map