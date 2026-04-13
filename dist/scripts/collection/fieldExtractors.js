"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFields = extractFields;
exports.extractActionBodyFields = extractActionBodyFields;
const helpers_1 = require("./helpers");
function classifyValue(value) {
    if (Array.isArray(value) ||
        (0, helpers_1.isLocalizedObject)(value) ||
        (value !== null && typeof value === 'object')) {
        return 'json';
    }
    if (typeof value === 'number')
        return 'number';
    if (typeof value === 'boolean')
        return 'boolean';
    return 'string';
}
function extractFields(obj, prefix = '', depth = 0) {
    if (depth > 3)
        return [];
    const fields = [];
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const kind = classifyValue(value);
        if (kind === 'json' && !Array.isArray(value) && !(0, helpers_1.isLocalizedObject)(value) && value !== null) {
            fields.push(...extractFields(value, path, depth + 1));
        }
        else {
            fields.push({
                name: path,
                type: kind,
                required: depth === 0,
                example: value,
                description: (0, helpers_1.formatLabel)(path),
            });
        }
    }
    return fields;
}
function extractActionBodyFields(rawBodyObj) {
    const actionsArray = rawBodyObj.actions;
    if (!Array.isArray(actionsArray) || actionsArray.length === 0)
        return [];
    const SKIP = new Set(['action', 'version', 'actions']);
    const actionObj = actionsArray[0];
    if (!actionObj || typeof actionObj !== 'object')
        return [];
    const fields = [];
    for (const [key, value] of Object.entries(actionObj)) {
        if (SKIP.has(key))
            continue;
        fields.push({
            name: key,
            type: classifyValue(value),
            required: false,
            example: value,
            description: (0, helpers_1.formatLabel)(key),
        });
    }
    return fields;
}
//# sourceMappingURL=fieldExtractors.js.map