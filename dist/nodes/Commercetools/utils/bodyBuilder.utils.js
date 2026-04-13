"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRequestBody = buildRequestBody;
exports.buildActionsFromUi = buildActionsFromUi;
exports.tryParseJson = tryParseJson;
exports.tryParseArray = tryParseArray;
exports.setNested = setNested;
const n8n_workflow_1 = require("n8n-workflow");
const operationUtils_1 = require("../../../scripts/operationUtils");
const urlBuilder_utils_1 = require("./urlBuilder.utils");
function buildRequestBody(ctx, i, opDef, resource, operation) {
    if (!['POST', 'PUT', 'PATCH'].includes(opDef.method))
        return undefined;
    const body = {};
    if (opDef.isSearch || /\/search$/.test(opDef.urlTemplate)) {
        buildSearchBody(ctx, i, opDef, resource, operation, body);
    }
    else if ((0, operationUtils_1.isMainUpdateOp)(opDef)) {
        buildUpdateBody(ctx, i, opDef, resource, body);
    }
    else if ((0, operationUtils_1.isCreateOp)(opDef)) {
        buildCreateBody(ctx, i, opDef, resource, operation, body);
    }
    else {
        buildMiscBody(ctx, i, opDef, resource, operation, body);
    }
    return body;
}
function buildSearchBody(ctx, i, opDef, resource, operation, body) {
    for (const field of opDef.bodyFields) {
        const pname = `body__search__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
        const val = (0, urlBuilder_utils_1.safeGet)(ctx, pname, i, null);
        if (val === null || val === undefined)
            continue;
        const parsed = tryParseJson(val);
        if (Array.isArray(parsed) && parsed.length === 0)
            continue;
        setNested(body, field.name, parsed);
    }
}
function buildUpdateBody(ctx, i, opDef, resource, body) {
    body.version = (0, urlBuilder_utils_1.safeGet)(ctx, 'version', i, 1);
    const rawJson = (0, urlBuilder_utils_1.safeGet)(ctx, `actionsJson__${resource}`, i, '[]');
    let actions = tryParseArray(rawJson);
    if (actions.length === 0) {
        actions = buildActionsFromUi(ctx, i, resource);
    }
    if (actions.length === 0) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'No actions provided. Add at least one action via Actions (UI) or Actions (JSON).');
    }
    body.actions = actions;
}
function buildCreateBody(ctx, i, opDef, resource, operation, body) {
    for (const field of opDef.bodyFields) {
        if (field.name === 'version')
            continue;
        const pname = `body__create__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
        const val = (0, urlBuilder_utils_1.safeGet)(ctx, pname, i, null);
        if (val === null || val === undefined || val === '')
            continue;
        setNested(body, field.name, tryParseJson(val));
    }
}
function buildMiscBody(ctx, i, opDef, resource, operation, body) {
    for (const field of opDef.bodyFields) {
        const pname = `body__misc__${resource}__${operation}__${field.name.replace(/\./g, '__')}`;
        const val = (0, urlBuilder_utils_1.safeGet)(ctx, pname, i, null);
        if (val === null || val === undefined || val === '')
            continue;
        setNested(body, field.name, tryParseJson(val));
    }
}
function buildActionsFromUi(ctx, i, resource) {
    const uiData = (0, urlBuilder_utils_1.safeGet)(ctx, `actionsUi__${resource}`, i, {});
    const actions = [];
    for (const [actionType, itemArray] of Object.entries(uiData)) {
        if (!Array.isArray(itemArray))
            continue;
        for (const item of itemArray) {
            const actionPayload = { action: actionType };
            for (const [key, value] of Object.entries(item)) {
                if (key === '_notice')
                    continue;
                if (value === null || value === undefined || value === '')
                    continue;
                actionPayload[key] = tryParseJson(value);
            }
            actions.push(actionPayload);
        }
    }
    return actions;
}
function tryParseJson(value) {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return restoreLocaleKeys(JSON.parse(trimmed));
        }
        catch {
        }
    }
    return value;
}
function tryParseArray(raw) {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw.length > 0 ? raw : [];
    if (typeof raw !== 'string')
        return [];
    if (raw.trim() === '' || raw.trim() === '[]')
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    }
    catch {
        return [];
    }
}
function restoreLocaleKeys(value) {
    if (Array.isArray(value))
        return value.map(restoreLocaleKeys);
    if (typeof value === 'object' && value !== null) {
        const obj = value;
        const keys = Object.keys(obj);
        const allLocale = keys.every((k) => /^[a-z]{2}(_[A-Z]{2})?$/.test(k));
        const result = {};
        for (const k of keys) {
            const newKey = allLocale ? k.replace('_', '-') : k;
            result[newKey] = restoreLocaleKeys(obj[k]);
        }
        return result;
    }
    return value;
}
function setNested(obj, dotPath, value) {
    const parts = dotPath.split('.');
    let cur = obj;
    for (let j = 0; j < parts.length - 1; j++) {
        if (typeof cur[parts[j]] !== 'object' || cur[parts[j]] === null)
            cur[parts[j]] = {};
        cur = cur[parts[j]];
    }
    cur[parts[parts.length - 1]] = value;
}
//# sourceMappingURL=bodyBuilder.utils.js.map