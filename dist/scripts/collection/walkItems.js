"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkItems = walkItems;
const helpers_1 = require("./helpers");
const fieldExtractors_1 = require("./fieldExtractors");
function detectIsSearch(method, urlTemplate) {
    return method === 'POST' && /\/search$/.test(urlTemplate);
}
function detectIsImageUpload(method, urlTemplate) {
    return method === 'POST' && /\/images$/.test(urlTemplate);
}
function extractKeyPlaceholder(urlTemplate) {
    const match = urlTemplate.match(/key=\{\{([^}]+)\}\}/);
    return match ? match[1] : undefined;
}
function resolveUrlTemplate(req) {
    var _a, _b;
    const rawUrl = typeof (req === null || req === void 0 ? void 0 : req.url) === 'string' ? req.url : ((_b = (_a = req === null || req === void 0 ? void 0 : req.url) === null || _a === void 0 ? void 0 : _a.raw) !== null && _b !== void 0 ? _b : '');
    return rawUrl
        .replace('{{host}}', '')
        .replace(/https?:\/\/api\.[^/]+\.commercetools\.com/, '')
        .split('?')[0];
}
function parseBody(req) {
    var _a, _b;
    const rawBodyRaw = typeof ((_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.raw) === 'string'
        ? req.body.raw
        : ((_b = req === null || req === void 0 ? void 0 : req.body) === null || _b === void 0 ? void 0 : _b.raw)
            ? JSON.stringify(req.body.raw)
            : '';
    let rawBodyObj = {};
    let bodyFields = [];
    let actionBodyFields = [];
    try {
        if (rawBodyRaw) {
            const sanitized = rawBodyRaw
                .replace(/:\s*"\{\{[^}]+\}\}"(\s*[,}\]])/g, ': "placeholder"$1')
                .replace(/:\s*\{\{[^}]+\}\}(\s*[,}\]])/g, ': "placeholder"$1');
            try {
                rawBodyObj = JSON.parse(sanitized);
            }
            catch {
                rawBodyObj = JSON.parse(rawBodyRaw);
            }
            bodyFields = (0, fieldExtractors_1.extractFields)(rawBodyObj);
            actionBodyFields = (0, fieldExtractors_1.extractActionBodyFields)(rawBodyObj);
        }
    }
    catch {
    }
    return { bodyFields, actionBodyFields, rawBodyObj, rawBodyRaw };
}
function detectRequiresVersion(method, rawBodyObj, rawBodyRaw) {
    if (method === 'DELETE')
        return true;
    if (!['POST', 'PUT', 'PATCH'].includes(method))
        return false;
    return (rawBodyObj === null || rawBodyObj === void 0 ? void 0 : rawBodyObj.version) !== undefined || /"version"\s*:\s*\d+/.test(rawBodyRaw);
}
function walkItems(items, operations, parentFolder, subFolderName, isActionSubFolder) {
    var _a, _b, _c, _d;
    for (const item of items) {
        if (Array.isArray(item.item)) {
            const childIsActionFolder = (0, helpers_1.isUpdateActionsSubFolder)(item.name);
            walkItems(item.item, operations, parentFolder, item.name, childIsActionFolder);
            continue;
        }
        const req = item.request;
        if (!req)
            continue;
        const method = (req.method || 'GET').toUpperCase();
        const urlTemplate = resolveUrlTemplate(req);
        const { bodyFields, actionBodyFields, rawBodyObj, rawBodyRaw } = parseBody(req);
        const queryParams = (typeof req.url !== 'string' ? ((_b = (_a = req.url) === null || _a === void 0 ? void 0 : _a.query) !== null && _b !== void 0 ? _b : []) : [])
            .filter((q) => q.key && !q.key.startsWith('/') && q.key.trim().length > 0)
            .map((q) => q.key);
        const requiresIdFromUrl = /\/\{\{[^}]*[Ii][Dd]\}\}/.test(urlTemplate) ||
            urlTemplate.includes('{{ID}}') ||
            /\/\{[^}]*[Ii][Dd]\}/.test(urlTemplate);
        const requiresKey = /\/key=/.test(urlTemplate) || /key=\{\{/.test(urlTemplate);
        let keyPlaceholder = requiresKey ? extractKeyPlaceholder(urlTemplate) : undefined;
        const pathParamMatch = urlTemplate.match(/\/([a-z][a-z-]*)=\{\{([^}]+)\}\}/);
        const hasCustomPathParam = pathParamMatch !== null && pathParamMatch[1] !== 'key';
        let pathParamLabel;
        let pathParamName;
        let pathParamSegment;
        if (hasCustomPathParam && pathParamMatch) {
            pathParamLabel = pathParamMatch[1]
                .split('-')
                .map((w) => (w === 'id' ? 'ID' : w[0].toUpperCase() + w.slice(1)))
                .join(' ');
            pathParamName = pathParamMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            pathParamSegment = pathParamMatch[1];
        }
        const requiresId = requiresIdFromUrl || requiresKey || hasCustomPathParam;
        const requiresVersion = detectRequiresVersion(method, rawBodyObj, rawBodyRaw);
        const isSearch = detectIsSearch(method, urlTemplate);
        const isImageUpload = detectIsImageUpload(method, urlTemplate);
        const allIdPlaceholders = [...urlTemplate.matchAll(/\{\{([^}]*[Ii][Dd])\}\}/g)].map((m) => m[1]);
        const uniqueIdPlaceholders = [...new Set(allIdPlaceholders)];
        let secondaryIdPlaceholder;
        if (uniqueIdPlaceholders.length >= 2) {
            secondaryIdPlaceholder = uniqueIdPlaceholders[1];
        }
        else if (requiresKey && uniqueIdPlaceholders.length === 1) {
            secondaryIdPlaceholder = uniqueIdPlaceholders[0];
        }
        const associateIdMatch = urlTemplate.match(/as-associate\/\{\{([^}]+)\}\}/);
        const associateIdPlaceholder = associateIdMatch ? associateIdMatch[1] : undefined;
        if (associateIdPlaceholder && secondaryIdPlaceholder === associateIdPlaceholder) {
            secondaryIdPlaceholder = undefined;
        }
        const storeKeyMatch = urlTemplate.match(/in-store\/key=\{\{([^}]+)\}\}/);
        const storeKeyPlaceholder = storeKeyMatch ? storeKeyMatch[1] : undefined;
        if (storeKeyPlaceholder && keyPlaceholder === storeKeyPlaceholder) {
            const allKeyMatches = [...urlTemplate.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
            keyPlaceholder = allKeyMatches.length >= 2 ? allKeyMatches[1] : undefined;
        }
        const description = typeof req.description === 'string'
            ? req.description
            : ((_d = (_c = req.description) === null || _c === void 0 ? void 0 : _c.content) !== null && _d !== void 0 ? _d : '');
        operations.push({
            name: item.name,
            value: (0, helpers_1.slugify)(item.name),
            method,
            urlTemplate,
            bodyFields,
            actionBodyFields,
            queryParams,
            description,
            folder: parentFolder,
            subFolder: subFolderName,
            isUpdateAction: isActionSubFolder,
            requiresId,
            requiresKey,
            requiresVersion,
            ...(keyPlaceholder ? { keyPlaceholder } : {}),
            ...(pathParamLabel ? { pathParamLabel, pathParamName, pathParamSegment } : {}),
            ...(isSearch ? { isSearch: true } : {}),
            ...(isImageUpload ? { isImageUpload: true } : {}),
            ...(secondaryIdPlaceholder ? { secondaryIdPlaceholder } : {}),
            ...(associateIdPlaceholder ? { associateIdPlaceholder } : {}),
            ...(storeKeyPlaceholder ? { storeKeyPlaceholder } : {}),
        });
    }
}
//# sourceMappingURL=walkItems.js.map