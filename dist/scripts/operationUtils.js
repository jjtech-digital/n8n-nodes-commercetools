"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMainUpdateOp = isMainUpdateOp;
exports.isCreateOp = isCreateOp;
function isMainUpdateOp(op) {
    if (op.value === 'createOrUpdateCustomObject')
        return false;
    if (op.isUpdateAction)
        return false;
    if (op.isSearch || /\/search$/.test(op.urlTemplate))
        return false;
    if (op.isImageUpload || /\/images$/.test(op.urlTemplate))
        return false;
    if (/\bupdate\b/i.test(op.name))
        return true;
    return op.method === 'POST' && op.requiresId && op.bodyFields.some((f) => f.name === 'actions');
}
function isCreateOp(op) {
    return (!op.isUpdateAction &&
        !isMainUpdateOp(op) &&
        !op.isSearch &&
        !op.isImageUpload &&
        /\bcreate\b/i.test(op.name));
}
//# sourceMappingURL=operationUtils.js.map