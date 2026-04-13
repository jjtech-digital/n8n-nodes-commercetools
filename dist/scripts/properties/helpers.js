"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.REQUIRED_QUERY_PARAMS = exports.SINGULAR_MAP = void 0;
exports.humanize = humanize;
exports.buildDisplayName = buildDisplayName;
exports.isLocalizedField = isLocalizedField;
exports.resolveN8nType = resolveN8nType;
exports.resolveDefault = resolveDefault;
exports.placeholderToLabel = placeholderToLabel;
exports.makeActionFieldProperty = makeActionFieldProperty;
exports.makeFieldProperty = makeFieldProperty;
exports.toSingular = toSingular;
const helpers_1 = require("../collection/helpers");
Object.defineProperty(exports, "slugify", { enumerable: true, get: function () { return helpers_1.slugify; } });
function humanize(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
}
function buildDisplayName(dotPath) {
    return dotPath.split('.').map(humanize).join(' › ');
}
function isLocalizedField(field) {
    if (field.type !== 'json' && field.type !== 'string')
        return false;
    const ex = field.example;
    if (!ex || typeof ex !== 'object' || Array.isArray(ex))
        return false;
    const keys = Object.keys(ex);
    if (keys.length === 0)
        return false;
    return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
}
function resolveN8nType(field, localized) {
    if (localized)
        return 'json';
    if (field.type === 'number')
        return 'number';
    if (field.type === 'boolean')
        return 'boolean';
    if (field.type === 'json')
        return 'json';
    return 'string';
}
function resolveDefault(field, localized) {
    if (localized)
        return '{ "en": "" }';
    if (field.type === 'number')
        return 0;
    if (field.type === 'boolean')
        return false;
    if (field.type === 'json')
        return Array.isArray(field.example) ? '[]' : '{}';
    return '';
}
function placeholderToLabel(placeholder, suffix) {
    const stripped = placeholder.replace(new RegExp(`-${suffix.toLowerCase()}$`, 'i'), '');
    return (stripped
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ') +
        ' ' +
        suffix);
}
function makeActionFieldProperty(fieldName, field) {
    const localized = isLocalizedField(field);
    return {
        displayName: buildDisplayName(fieldName),
        name: fieldName,
        type: resolveN8nType(field, localized),
        default: resolveDefault(field, localized),
    };
}
function makeFieldProperty(paramName, field, displayOptions) {
    const localized = isLocalizedField(field);
    const prop = {
        displayName: buildDisplayName(field.name),
        name: paramName,
        type: resolveN8nType(field, localized),
        default: resolveDefault(field, localized),
        ...(field.required ? { required: true } : {}),
        ...(field.name === 'password' || field.name === 'currentPassword'
            ? { typeOptions: { password: true } }
            : {}),
    };
    if (displayOptions)
        prop.displayOptions = displayOptions;
    return prop;
}
exports.SINGULAR_MAP = {
    Addresses: 'Address',
    Categories: 'Category',
    Inventories: 'Inventory',
    Entries: 'Entry',
    Deliveries: 'Delivery',
    Queries: 'Query',
    Currencies: 'Currency',
    Countries: 'Country',
    Territories: 'Territory',
    Carts: 'Cart',
    Orders: 'Order',
    Products: 'Product',
    Customers: 'Customer',
    Payments: 'Payment',
    Channels: 'Channel',
    Reviews: 'Review',
    Stores: 'Store',
    Quotes: 'Quote',
    Zones: 'Zone',
    Types: 'Type',
    States: 'State',
    Messages: 'Message',
    Subscriptions: 'Subscription',
    Extensions: 'Extension',
    Taxes: 'Tax',
    ShoppingLists: 'Shopping List',
    DiscountCodes: 'Discount Code',
    ProductSelections: 'Product Selection',
    ProductTypes: 'Product Type',
    Projects: 'Project',
    BusinessUnits: 'Business Unit',
    'Business-units': 'Business Unit',
    AssociateRoles: 'Associate Role',
    ApprovalRules: 'Approval Rule',
    ApprovalFlows: 'Approval Flow',
    StagedQuotes: 'Staged Quote',
    QuoteRequests: 'Quote Request',
    StandalonePrices: 'Standalone Price',
    RecurringOrders: 'Recurring Order',
    'As-associate/In-business-unit/Approval-rules': 'Approval Rule',
    'As-associate/In-business-unit/Approval-flows': 'Approval Flow',
    'As-associate/In-business-unit/Carts': 'Associate Cart',
    'As-associate/In-business-unit/Orders': 'Associate Order',
    'As-associate/In-business-unit/Quotes': 'Associate Quote',
    'As-associate/In-business-unit/Quote-requests': 'Associate Quote Request',
    'As-associate/In-business-unit/Shopping-lists': 'Associate Shopping List',
    'As-associate/In-business-unit/Business-units': 'Associate Business Unit',
    'Standalone-prices': 'Standalone Price',
    'Product-tailoring': 'Product Tailoring',
    'Customer-groups': 'Customer Group',
    'Product-selections': 'Product Selection',
    'Cart-discounts': 'Cart Discount',
    'Discount-codes': 'Discount Code',
    'In-store/Business-units': 'Store Business Unit',
    'In-store/Cart-discounts': 'Store Cart Discount',
    'In-store/Carts': 'Store Cart',
    'In-store/Customers': 'Store Customer',
    'In-store/Orders': 'Store Order',
    'In-store/Quote-requests': 'Store Quote Request',
    'In-store/Quotes': 'Store Quote',
    'In-store/Shopping-lists': 'Store Shopping List',
    'In-store/Staged-quotes': 'Store Staged Quote',
    'In-store/Product-projections': 'Store Product Projection',
    'In-store/Shipping-methods': 'Store Shipping Method',
    'In-store/Products': 'Store Product',
};
function toSingular(folderName) {
    var _a;
    return (_a = exports.SINGULAR_MAP[folderName]) !== null && _a !== void 0 ? _a : folderName.replace(/ies$/, 'y').replace(/(?<=[^s])s$/, '');
}
exports.REQUIRED_QUERY_PARAMS = new Set(['cartId', 'orderEditId', 'country']);
//# sourceMappingURL=helpers.js.map