"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageUrl = validateImageUrl;
exports.executeImageUpload = executeImageUpload;
const n8n_workflow_1 = require("n8n-workflow");
const urlBuilder_utils_1 = require("./urlBuilder.utils");
function validateImageUrl(node, raw) {
    let parsed;
    try {
        parsed = new URL(raw);
    }
    catch {
        throw new n8n_workflow_1.NodeOperationError(node, 'Image URL is not a valid URL');
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new n8n_workflow_1.NodeOperationError(node, 'Image URL must use HTTP or HTTPS');
    }
    const host = parsed.hostname.toLowerCase();
    const addr = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
    const ipv4MappedMatch = addr.match(/^(?::{0,5}|0(?::0){5}):(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/i);
    const effectiveHost = ipv4MappedMatch ? ipv4MappedMatch[1] : addr;
    const blocked = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '169.254.169.254',
        'metadata.google.internal',
        '::1',
        '[::1]',
    ];
    if (blocked.includes(effectiveHost) ||
        /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(effectiveHost)) {
        throw new n8n_workflow_1.NodeOperationError(node, 'Image URL must not target internal addresses');
    }
}
async function executeImageUpload(i, opDef, fullUrl) {
    var _a, _b;
    const imageUrl = (0, urlBuilder_utils_1.safeGet)(this, 'imageUrl', i, '');
    const variant = (0, urlBuilder_utils_1.safeGet)(this, 'variant', i, 0);
    const sku = (0, urlBuilder_utils_1.safeGet)(this, 'sku', i, '');
    const staged = (0, urlBuilder_utils_1.safeGet)(this, 'staged', i, true);
    const filename = (0, urlBuilder_utils_1.safeGet)(this, 'filename', i, '');
    if (!imageUrl) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Image URL is required. Provide a publicly accessible URL to a JPEG, PNG, or GIF image.');
    }
    validateImageUrl(this.getNode(), imageUrl);
    const ext = (_b = (_a = imageUrl.split('?')[0].split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    let imageBuffer;
    try {
        imageBuffer = (await this.helpers.httpRequest({
            method: 'GET',
            url: imageUrl,
            encoding: null,
            resolveWithFullResponse: false,
        }));
    }
    catch (err) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to download image from "${imageUrl}": ${err.message}`);
    }
    const qs = {};
    if (variant > 0) {
        qs.variant = String(variant);
    }
    else if (sku) {
        qs.sku = sku;
    }
    qs.staged = String(staged);
    if (filename)
        qs.filename = filename;
    const options = {
        method: 'POST',
        url: fullUrl,
        qs,
        headers: { 'Content-Type': mimeType },
        body: imageBuffer,
        encoding: null,
    };
    try {
        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', options);
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            }
            catch {
                return { raw: response };
            }
        }
        if (Buffer.isBuffer(response)) {
            try {
                return JSON.parse(response.toString('utf8'));
            }
            catch {
                return { raw: response.toString('utf8') };
            }
        }
        return response;
    }
    catch (err) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), { message: err.message }, { message: `[${opDef.name}]: ${err.message}` });
    }
}
//# sourceMappingURL=imageUpload.utils.js.map