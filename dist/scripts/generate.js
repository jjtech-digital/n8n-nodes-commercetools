"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parseCollection_1 = require("./parseCollection");
const generateProperties_1 = require("./generateProperties");
const generateCtpRegistry_1 = require("./generateCtpRegistry");
const generateSubscriptionProperties_1 = require("./generateSubscriptionProperties");
const download_1 = require("./utils/download");
const patches_1 = require("./utils/patches");
const COLLECTION_URL = 'https://raw.githubusercontent.com/commercetools/commercetools-postman-collection/master/api/collection.json';
const COLLECTION_LOCAL_PATH = path.resolve(__dirname, '../collection.json');
const OUTPUT_DIR = path.resolve(__dirname, '../nodes/Commercetools/generated');
const FOLDERS_TO_GENERATE = [
    'Products',
    'Customers',
    'Carts',
    'Orders',
    'Business-units',
    'Categories',
    'Channels',
    'Associate-roles',
    'Inventory',
    'Reviews',
    'Shopping-lists',
    'Types',
    'Custom-objects',
    'Payments',
    'Payment-methods',
    'Shipping-methods',
    'Zones',
    'Subscriptions',
    'States',
    'Quotes',
    'Quote-requests',
    'Staged-quotes',
    'Messages',
    'Extensions',
    'As-associate/In-business-unit/Approval-rules',
    'As-associate/In-business-unit/Approval-flows',
    'As-associate/In-business-unit/Carts',
    'As-associate/In-business-unit/Orders',
    'As-associate/In-business-unit/Quotes',
    'As-associate/In-business-unit/Quote-requests',
    'As-associate/In-business-unit/Shopping-lists',
    'As-associate/In-business-unit/Business-units',
    'Standalone-prices',
    'Stores',
    'Product-tailoring',
    'Customer-groups',
    'Product-selections',
    'Cart-discounts',
    'Discount-codes',
    'Product-discounts',
    'Product-types',
    'Product-projections',
    'Tax-categories',
    'Attribute-groups',
    'Api-clients',
    'Recurring-orders',
    'Recurrence-policies',
    'Discount-groups',
    'Project',
    'In-store/Business-units',
    'In-store/Cart-discounts',
    'In-store/Carts',
    'In-store/Customers',
    'In-store/Orders',
    'In-store/Quote-requests',
    'In-store/Quotes',
    'In-store/Shopping-lists',
    'In-store/Staged-quotes',
    'In-store/Product-projections',
    'In-store/Shipping-methods',
    'In-store/Products',
];
const RESOURCES_TO_GENERATE = [
    'product',
    'customer',
    'cart',
    'order',
    'business-unit',
    'category',
    'channel',
    'associate-role',
    'inventory-entry',
    'review',
    'shopping-list',
    'type',
    'custom-object',
    'payment',
    'payment-method',
    'shipping-method',
    'zone',
    'subscription',
    'state',
    'quote',
    'quote-request',
    'staged-quote',
    'message',
    'extension',
    'approval-rule',
    'approval-flow',
    'standalone-price',
    'store',
    'product-tailoring',
    'customer-group',
    'product-selection',
    'recurring-order',
    'discount-group',
];
async function generateFromCollection() {
    try {
        await (0, download_1.downloadFile)(COLLECTION_URL, COLLECTION_LOCAL_PATH);
    }
    catch {
        if (!fs.existsSync(COLLECTION_LOCAL_PATH)) {
            throw new Error('No network and no local collection.json found.');
        }
    }
    const collection = JSON.parse(fs.readFileSync(COLLECTION_LOCAL_PATH, 'utf8'));
    const operations = (0, parseCollection_1.parseCollection)(collection, FOLDERS_TO_GENERATE);
    (0, patches_1.applyManualPatches)(operations);
    const nodeProperties = (0, generateProperties_1.generateAllNodeProperties)(operations, FOLDERS_TO_GENERATE);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const propertiesTs = `/**
 * AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
 * Generated by: scripts/generate.ts
 * Source: ${COLLECTION_URL}
 * Generated at: ${new Date().toISOString()}
 */

import type { INodeProperties } from 'n8n-workflow';

export const generatedProperties: INodeProperties[] = ${JSON.stringify(nodeProperties, null, 2)};
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'properties.ts'), propertiesTs);
    const opsMap = {};
    for (const op of operations)
        opsMap[op.value] = op;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'operations.json'), JSON.stringify(opsMap, null, 2));
}
function generateRegistry() {
    (0, generateCtpRegistry_1.generateCtpEventRegistry)(OUTPUT_DIR, { allowedResources: RESOURCES_TO_GENERATE });
}
function generateSubscriptions() {
    (0, generateSubscriptionProperties_1.generateSubscriptionProperties)();
}
async function main() {
    try {
        await generateFromCollection();
        generateRegistry();
        generateSubscriptions();
    }
    catch (err) {
        console.error('[generate] Fatal error:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
main().catch((err) => {
    console.error('[generate] Unhandled rejection:', err instanceof Error ? err.message : err);
    process.exit(1);
});
//# sourceMappingURL=generate.js.map