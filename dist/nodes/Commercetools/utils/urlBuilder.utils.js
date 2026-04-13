"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePathParam = sanitizePathParam;
exports.safeGet = safeGet;
exports.buildUrl = buildUrl;
const n8n_workflow_1 = require("n8n-workflow");
function sanitizePathParam(node, value, name) {
    if (/[/\\%\0]/.test(value) || value.includes('..')) {
        throw new n8n_workflow_1.NodeOperationError(node, `Path parameter "${name}" contains invalid characters`);
    }
    return encodeURIComponent(value);
}
function safeGet(ctx, name, i, fallback) {
    try {
        return ctx.getNodeParameter(name, i, fallback);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not defined') || msg.includes('could not be found'))
            return fallback;
        throw err;
    }
}
function buildUrl(i, opDef, projectKey, baseUrl, operation) {
    let urlPath = opDef.urlTemplate
        .replace(/\{\{project-key\}\}/g, projectKey)
        .replace(/\{\{projectKey\}\}/g, projectKey);
    if (urlPath.includes('in-store/key={{')) {
        const storeKey = safeGet(this, 'storeKey', i, '');
        urlPath = urlPath.replace(/in-store\/key=\{\{[^}]+\}\}/, `in-store/key=${storeKey}`);
    }
    if (urlPath.includes('{{associate-id}}')) {
        const associateId = safeGet(this, 'associateId', i, '');
        urlPath = urlPath.replace(/\{\{associate-id\}\}/g, associateId);
    }
    const keyMatches = [...urlPath.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
    if (keyMatches.length >= 2) {
        const tertiaryKey = safeGet(this, 'tertiaryKey', i, '');
        const secondKeyPlaceholder = keyMatches[1];
        urlPath = urlPath.replace(new RegExp(`key=\\{\\{${secondKeyPlaceholder.replace(/-/g, '\\-')}\\}\\}`), `key=${tertiaryKey}`);
    }
    if (operation === 'getCustomObjectByContainerAndKey' ||
        operation === 'deleteCustomObjectByContainerAndKey') {
        const container = sanitizePathParam(this.getNode(), safeGet(this, 'container', i, ''), 'container');
        const key = sanitizePathParam(this.getNode(), safeGet(this, 'resourceKey', i, ''), 'resourceKey');
        urlPath = urlPath
            .replace(/\{\{container\}\}/g, container)
            .replace(/\{\{custom-object-key\}\}/g, key);
    }
    if (opDef.requiresId) {
        if (opDef.secondaryIdPlaceholder) {
            const secondaryId = sanitizePathParam(this.getNode(), safeGet(this, 'secondaryId', i, ''), 'secondaryId');
            urlPath = urlPath.replace(new RegExp(`\\{\\{${opDef.secondaryIdPlaceholder.replace(/-/g, '\\-')}\\}\\}`), secondaryId);
        }
        if (opDef.pathParamSegment && opDef.pathParamName) {
            const paramValue = sanitizePathParam(this.getNode(), safeGet(this, opDef.pathParamName, i, ''), opDef.pathParamName);
            urlPath = urlPath.replace(new RegExp(opDef.pathParamSegment + '=\\{\\{[^}]+\\}\\}'), `${opDef.pathParamSegment}=${paramValue}`);
        }
        else if (opDef.requiresKey) {
            const key = sanitizePathParam(this.getNode(), safeGet(this, 'resourceKey', i, ''), 'resourceKey');
            if (opDef.keyPlaceholder) {
                const escapedPlaceholder = opDef.keyPlaceholder.replace(/-/g, '\\-');
                urlPath = urlPath.replace(new RegExp(`key=\\{\\{${escapedPlaceholder}\\}\\}`), `key=${key}`);
            }
            else {
                urlPath = urlPath.replace(/key=\{\{[^}]+\}\}/, `key=${key}`);
            }
        }
        else {
            const id = sanitizePathParam(this.getNode(), safeGet(this, 'resourceId', i, ''), 'resourceId');
            urlPath = urlPath.replace(/\{\{[^}]*[Ii][Dd]\}\}/g, id).replace(/\/:id/g, `/${id}`);
        }
    }
    urlPath = urlPath.replace(/\{\{[^}]+\}\}/g, '');
    return `${baseUrl}${urlPath}`;
}
//# sourceMappingURL=urlBuilder.utils.js.map