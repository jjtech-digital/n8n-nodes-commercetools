"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreateBodyFields = generateCreateBodyFields;
exports.generateMiscPostBodyFields = generateMiscPostBodyFields;
exports.generateSearchBodyFields = generateSearchBodyFields;
const helpers_1 = require("./helpers");
const operationUtils_1 = require("../operationUtils");
function generateCreateBodyFields(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const createOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction && (0, operationUtils_1.isCreateOp)(op));
        for (const createOp of createOps) {
            for (const field of createOp.bodyFields) {
                if (field.name === 'version')
                    continue;
                props.push((0, helpers_1.makeFieldProperty)(`body__create__${resourceValue}__${createOp.value}__${field.name.replace(/\./g, '__')}`, field, { show: { resource: [resourceValue], operation: [createOp.value] } }));
            }
        }
    }
    return props;
}
function generateMiscPostBodyFields(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const miscPostOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction &&
            op.method === 'POST' &&
            !(0, operationUtils_1.isCreateOp)(op) &&
            !(0, operationUtils_1.isMainUpdateOp)(op) &&
            !op.isSearch &&
            !op.isImageUpload &&
            op.bodyFields.length > 0);
        for (const op of miscPostOps) {
            for (const field of op.bodyFields) {
                props.push((0, helpers_1.makeFieldProperty)(`body__misc__${resourceValue}__${op.value}__${field.name.replace(/\./g, '__')}`, field, { show: { resource: [resourceValue], operation: [op.value] } }));
            }
        }
    }
    return props;
}
function generateSearchBodyFields(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const searchOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction && op.isSearch);
        for (const op of searchOps) {
            for (const field of op.bodyFields) {
                props.push((0, helpers_1.makeFieldProperty)(`body__search__${resourceValue}__${op.value}__${field.name.replace(/\./g, '__')}`, field, { show: { resource: [resourceValue], operation: [op.value] } }));
            }
        }
    }
    return props;
}
//# sourceMappingURL=bodyFields.js.map