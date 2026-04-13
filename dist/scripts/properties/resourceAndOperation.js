"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResourceProperty = generateResourceProperty;
exports.generateOperationProperties = generateOperationProperties;
exports.generateVersionField = generateVersionField;
const helpers_1 = require("./helpers");
const operationUtils_1 = require("../operationUtils");
function generateResourceProperty(folders) {
    return {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: folders.map((f) => ({
            name: (0, helpers_1.toSingular)(f),
            value: (0, helpers_1.slugify)(f),
        })),
        default: folders.length ? (0, helpers_1.slugify)(folders[0]) : '',
    };
}
function generateOperationProperties(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const topLevelOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction);
        if (topLevelOps.length === 0)
            continue;
        props.push({
            displayName: 'Operation',
            name: 'operation',
            type: 'options',
            noDataExpression: true,
            displayOptions: { show: { resource: [resourceValue] } },
            options: topLevelOps.map((op) => ({
                name: op.name,
                value: op.value,
                action: op.name,
            })),
            default: topLevelOps[0].value,
        });
    }
    return props;
}
function generateVersionField(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const opsNeedingVersion = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : [])
            .filter((op) => !op.isUpdateAction && ((0, operationUtils_1.isMainUpdateOp)(op) || op.method === 'DELETE'))
            .map((op) => op.value);
        if (opsNeedingVersion.length === 0)
            continue;
        props.push({
            displayName: 'Version',
            name: 'version',
            type: 'number',
            default: 1,
            required: true,
            displayOptions: { show: { resource: [resourceValue], operation: opsNeedingVersion } },
        });
    }
    return props;
}
//# sourceMappingURL=resourceAndOperation.js.map