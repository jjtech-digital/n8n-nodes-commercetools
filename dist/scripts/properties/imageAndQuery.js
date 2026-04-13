"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImageUploadFields = generateImageUploadFields;
exports.generateQueryParamProperties = generateQueryParamProperties;
const helpers_1 = require("./helpers");
const IMAGE_PARAM_DEFS = [
    {
        key: 'filename',
        displayName: 'Filename',
        type: 'string',
        default: '',
        description: 'Optional filename to store with the image.',
    },
    {
        key: 'variant',
        displayName: 'Variant ID',
        type: 'number',
        default: 0,
        description: 'ID of the ProductVariant to attach the image to. Leave 0 for Master Variant.',
    },
    {
        key: 'sku',
        displayName: 'SKU',
        type: 'string',
        default: '',
        description: 'SKU of the ProductVariant. Alternative to Variant ID.',
    },
    {
        key: 'staged',
        displayName: 'Staged',
        type: 'boolean',
        default: true,
        description: 'Whether to add the image to staged (true) or current (false) product data.',
    },
];
function humanize(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
}
function generateImageUploadFields(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const imageOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction && op.isImageUpload);
        for (const op of imageOps) {
            props.push({
                displayName: 'Image URL',
                name: 'imageUrl',
                type: 'string',
                default: '',
                required: true,
                displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
                description: 'Publicly accessible URL of the image (JPEG, PNG, or GIF, max 10 MB). ' +
                    'commercetools fetches the image from this URL.',
            });
            for (const param of IMAGE_PARAM_DEFS) {
                if (!op.queryParams.includes(param.key))
                    continue;
                props.push({
                    displayName: param.displayName,
                    name: param.key,
                    type: param.type,
                    default: param.default,
                    displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
                    description: param.description,
                });
            }
        }
    }
    return props;
}
function generateQueryParamProperties(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const eligibleOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : []).filter((op) => !op.isUpdateAction &&
            !op.pathParamName &&
            ['GET', 'HEAD'].includes(op.method) &&
            op.queryParams.length > 0);
        for (const op of eligibleOps) {
            const cleanParams = [
                ...new Set(op.queryParams.filter((p) => p && !p.startsWith('/') && p.trim().length > 0)),
            ];
            if (cleanParams.length === 0)
                continue;
            const requiredParams = cleanParams.filter((p) => helpers_1.REQUIRED_QUERY_PARAMS.has(p));
            const optionalParams = cleanParams.filter((p) => !helpers_1.REQUIRED_QUERY_PARAMS.has(p));
            for (const param of requiredParams) {
                props.push({
                    displayName: humanize(param),
                    name: `reqParam__${op.value}__${param}`,
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
                });
            }
            if (optionalParams.length === 0)
                continue;
            props.push({
                displayName: 'Filters',
                name: `queryParams__${op.value}`,
                type: 'collection',
                placeholder: 'Add Filter',
                default: {},
                displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
                options: optionalParams.map((param) => ({
                    displayName: humanize(param),
                    name: param,
                    type: 'string',
                    default: '',
                })),
            });
        }
    }
    return props;
}
//# sourceMappingURL=imageAndQuery.js.map