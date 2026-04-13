"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIdFields = generateIdFields;
const helpers_1 = require("./helpers");
function generateIdFields(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const singular = (0, helpers_1.toSingular)(folder);
        const topLevelOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction);
        const opsNeedingId = topLevelOps
            .filter((op) => op.requiresId && !op.requiresKey && !op.pathParamName)
            .map((op) => op.value);
        if (opsNeedingId.length > 0) {
            props.push({
                displayName: `${singular} ID`,
                name: 'resourceId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: opsNeedingId } },
            });
        }
        const opsNeedingKey = topLevelOps
            .filter((op) => op.requiresKey && !op.pathParamName)
            .map((op) => op.value);
        if (opsNeedingKey.length > 0) {
            props.push({
                displayName: `${singular} Key`,
                name: 'resourceKey',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: opsNeedingKey } },
            });
        }
        const containerOps = topLevelOps
            .filter((op) => op.urlTemplate.includes('{{container}}'))
            .map((op) => op.value);
        if (containerOps.length > 0) {
            props.push({
                displayName: 'Container',
                name: 'container',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: containerOps } },
            });
        }
        const customKeyOps = topLevelOps
            .filter((op) => op.urlTemplate.includes('{{custom-object-key}}'))
            .map((op) => op.value);
        if (customKeyOps.length > 0) {
            props.push({
                displayName: 'Key',
                name: 'resourceKey',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: customKeyOps } },
            });
        }
        const byParamName = new Map();
        for (const op of topLevelOps.filter((op) => op.requiresId && op.pathParamName)) {
            const key = op.pathParamName;
            if (!byParamName.has(key))
                byParamName.set(key, { label: op.pathParamLabel, opValues: [] });
            byParamName.get(key).opValues.push(op.value);
        }
        for (const [paramName, { label, opValues }] of byParamName) {
            props.push({
                displayName: label,
                name: paramName,
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: opValues } },
            });
        }
        const bySecondaryPlaceholder = new Map();
        for (const op of topLevelOps.filter((op) => op.secondaryIdPlaceholder)) {
            const ph = op.secondaryIdPlaceholder;
            if (!bySecondaryPlaceholder.has(ph))
                bySecondaryPlaceholder.set(ph, []);
            bySecondaryPlaceholder.get(ph).push(op.value);
        }
        for (const [placeholder, opValues] of bySecondaryPlaceholder) {
            props.push({
                displayName: (0, helpers_1.placeholderToLabel)(placeholder, 'ID'),
                name: 'secondaryId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: opValues } },
            });
        }
        const associateOps = topLevelOps
            .filter((op) => op.associateIdPlaceholder)
            .map((op) => op.value);
        if (associateOps.length > 0) {
            props.push({
                displayName: 'Associate ID',
                name: 'associateId',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: associateOps } },
            });
        }
        const storeKeyOps = topLevelOps.filter((op) => op.storeKeyPlaceholder).map((op) => op.value);
        if (storeKeyOps.length > 0) {
            props.push({
                displayName: 'Store Key',
                name: 'storeKey',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: storeKeyOps } },
            });
        }
        const tertiaryEntries = topLevelOps
            .map((op) => {
            const keyMatches = [...op.urlTemplate.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
            return keyMatches.length >= 2 ? { op, tertiaryKeyPlaceholder: keyMatches[1] } : null;
        })
            .filter(Boolean);
        const byTertiaryKey = new Map();
        for (const { op, tertiaryKeyPlaceholder } of tertiaryEntries) {
            if (!byTertiaryKey.has(tertiaryKeyPlaceholder))
                byTertiaryKey.set(tertiaryKeyPlaceholder, []);
            byTertiaryKey.get(tertiaryKeyPlaceholder).push(op.value);
        }
        for (const [placeholder, opValues] of byTertiaryKey) {
            props.push({
                displayName: (0, helpers_1.placeholderToLabel)(placeholder, 'Key'),
                name: 'tertiaryKey',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: opValues } },
            });
        }
    }
    return props;
}
//# sourceMappingURL=idFields.js.map