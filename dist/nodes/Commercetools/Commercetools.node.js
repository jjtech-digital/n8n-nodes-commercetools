"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMainUpdateOp = exports.Commercetools = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const properties_1 = require("./generated/properties");
const operations_json_1 = __importDefault(require("./generated/operations.json"));
const operationUtils_1 = require("../../scripts/operationUtils");
Object.defineProperty(exports, "isMainUpdateOp", { enumerable: true, get: function () { return operationUtils_1.isMainUpdateOp; } });
const urlBuilder_utils_1 = require("./utils/urlBuilder.utils");
const bodyBuilder_utils_1 = require("./utils/bodyBuilder.utils");
const imageUpload_utils_1 = require("./utils/imageUpload.utils");
class Commercetools {
    constructor() {
        this.description = {
            displayName: 'commercetools',
            name: 'commercetools',
            icon: 'file:Commercetools.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
            description: 'Interact with the commercetools API. Operations are auto-generated from the official Postman collection.',
            defaults: { name: 'commercetools' },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'commerceToolsOAuth2Api', required: true }],
            usableAsTool: true,
            properties: properties_1.generatedProperties,
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('commerceToolsOAuth2Api');
        for (let i = 0; i < items.length; i++) {
            try {
                const result = await executeOperation.call(this, i, credentials);
                returnData.push({ json: result });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message }, pairedItem: i });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Commercetools = Commercetools;
async function executeOperation(i, creds) {
    const projectKey = creds.projectKey;
    const region = creds.region;
    const baseUrl = `https://api.${region}.commercetools.com`;
    const resource = this.getNodeParameter('resource', i);
    const operation = this.getNodeParameter('operation', i);
    const opDef = operations_json_1.default[operation];
    if (!opDef) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown operation "${operation}". Re-run npm run generate to sync.`);
    }
    const fullUrl = urlBuilder_utils_1.buildUrl.call(this, i, opDef, projectKey, baseUrl, operation);
    if (opDef.isImageUpload || /\/images$/.test(opDef.urlTemplate)) {
        return imageUpload_utils_1.executeImageUpload.call(this, i, opDef, fullUrl);
    }
    const queryParams = {};
    if (opDef.method === 'DELETE' && operation !== 'deleteCustomObjectByContainerAndKey') {
        queryParams.version = String((0, urlBuilder_utils_1.safeGet)(this, 'version', i, 1));
    }
    if (['GET', 'HEAD'].includes(opDef.method)) {
        const filters = (0, urlBuilder_utils_1.safeGet)(this, `queryParams__${operation}`, i, {});
        for (const [k, v] of Object.entries(filters)) {
            if (v !== null && v !== undefined && v !== '')
                queryParams[k] = String(v);
        }
        for (const paramName of opDef.queryParams) {
            const val = (0, urlBuilder_utils_1.safeGet)(this, `reqParam__${operation}__${paramName}`, i, '');
            if (val !== '')
                queryParams[paramName] = val;
        }
    }
    const body = (0, bodyBuilder_utils_1.buildRequestBody)(this, i, opDef, resource, operation);
    if (opDef.method === 'HEAD') {
        return executeHeadCheck.call(this, fullUrl, queryParams, opDef.name);
    }
    const options = {
        method: opDef.method,
        url: fullUrl,
        qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        json: true,
    };
    const isSearchOp = opDef.isSearch || /\/search$/.test(opDef.urlTemplate);
    if (body && (isSearchOp || Object.keys(body).length > 0)) {
        options.body = body;
    }
    try {
        return await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', options);
    }
    catch (err) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), { message: err.message }, { message: `[${opDef.name}]: ${err.message}` });
    }
}
async function executeHeadCheck(fullUrl, queryParams, opName) {
    var _a;
    try {
        await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
            method: 'HEAD',
            url: fullUrl,
            qs: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });
        return { exists: true, statusCode: 200, url: fullUrl };
    }
    catch (err) {
        const statusCode = (_a = err === null || err === void 0 ? void 0 : err.statusCode) !== null && _a !== void 0 ? _a : 404;
        if (statusCode === 404)
            return { exists: false, statusCode: 404, url: fullUrl };
        throw new n8n_workflow_1.NodeApiError(this.getNode(), { message: err.message }, { message: `[${opName}]: ${err.message}` });
    }
}
//# sourceMappingURL=Commercetools.node.js.map