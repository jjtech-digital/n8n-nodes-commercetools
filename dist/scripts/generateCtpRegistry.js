"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCtpEventRegistry = generateCtpEventRegistry;
const typescript_1 = __importDefault(require("typescript"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SUB_RESOURCE_TO_PARENT = {
    delivery: 'order',
    parcel: 'order',
    'line-item': 'order',
    'custom-line-item': 'order',
    'return-info': 'order',
    cart: 'cart',
    'cart-discount': 'cart-discount',
    'discount-code': 'discount-code',
    'discount-group': 'discount-group',
    'recurring-order': 'recurring-order',
};
const EXCLUDED_MESSAGES = new Set([
    'ShoppingListStoreSet',
    'PaymentMethodCreated',
    'PaymentMethodDeleted',
    'PaymentMethodDefaultSet',
    'PaymentMethodKeySet',
    'PaymentMethodNameSet',
    'PaymentMethodMethodSet',
    'PaymentMethodInterfaceAccountSet',
    'PaymentMethodPaymentInterfaceSet',
    'PaymentMethodPaymentMethodStatusSet',
    'PaymentMethodCustomFieldAdded',
    'PaymentMethodCustomFieldChanged',
    'PaymentMethodCustomFieldRemoved',
    'PaymentMethodCustomTypeSet',
    'PaymentMethodCustomTypeRemoved',
]);
const pascalToKebab = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
function walk(dir) {
    let entries;
    try {
        entries = fs_1.default.readdirSync(dir);
    }
    catch (err) {
        throw new Error(`[generateCtpRegistry] Cannot read SDK directory: ${dir}\n` +
            `Make sure @commercetools/platform-sdk is installed (npm install).\n` +
            `Original error: ${err instanceof Error ? err.message : String(err)}`);
    }
    const files = [];
    for (const file of entries) {
        const full = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(full);
        if (stat.isDirectory())
            files.push(...walk(full));
        else if (file.endsWith('.d.ts'))
            files.push(full);
    }
    return files;
}
function parseFile(filePath, messageTypes, messageResourceTypeIds, changeResourceTypeIds) {
    let source;
    try {
        source = typescript_1.default.createSourceFile(filePath, fs_1.default.readFileSync(filePath, 'utf8'), typescript_1.default.ScriptTarget.Latest, true);
    }
    catch (err) {
        console.warn(`[generateCtpRegistry] Skipping unreadable file: ${filePath} — ${err instanceof Error ? err.message : err}`);
        return;
    }
    function visit(node) {
        if (typescript_1.default.isInterfaceDeclaration(node) && node.name.text.endsWith('MessagePayload')) {
            for (const member of node.members) {
                if (typescript_1.default.isPropertySignature(member) &&
                    member.name.getText() === 'type' &&
                    member.type &&
                    typescript_1.default.isLiteralTypeNode(member.type) &&
                    typescript_1.default.isStringLiteral(member.type.literal)) {
                    messageTypes.add(member.type.literal.text);
                }
            }
        }
        if (typescript_1.default.isTypeAliasDeclaration(node) && typescript_1.default.isUnionTypeNode(node.type)) {
            const typeName = node.name.text;
            if (typeName === 'MessageSubscriptionResourceTypeId' ||
                typeName === 'ChangeSubscriptionResourceTypeId') {
                for (const t of node.type.types) {
                    if (typescript_1.default.isLiteralTypeNode(t) && typescript_1.default.isStringLiteral(t.literal)) {
                        if (typeName === 'MessageSubscriptionResourceTypeId') {
                            messageResourceTypeIds.add(t.literal.text);
                        }
                        else {
                            changeResourceTypeIds.add(t.literal.text);
                        }
                    }
                }
            }
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(source);
}
function inferResourceType(message, allResources) {
    const kebab = pascalToKebab(message);
    const direct = allResources
        .filter((r) => kebab.startsWith(r))
        .sort((a, b) => b.length - a.length)[0];
    if (direct)
        return direct;
    const subMatch = Object.keys(SUB_RESOURCE_TO_PARENT)
        .filter((k) => kebab.startsWith(k))
        .sort((a, b) => b.length - a.length)[0];
    return subMatch ? SUB_RESOURCE_TO_PARENT[subMatch] : undefined;
}
function generateCtpEventRegistry(OUTPUT_DIR, options = {}) {
    var _a, _b;
    const SDK_PATH = (_a = options.sdkPath) !== null && _a !== void 0 ? _a : path_1.default.resolve(process.cwd(), 'node_modules/@commercetools/platform-sdk/dist/declarations/src/generated/models');
    const messageTypes = new Set();
    const messageResourceTypeIds = new Set();
    const changeResourceTypeIds = new Set();
    for (const filePath of walk(SDK_PATH)) {
        parseFile(filePath, messageTypes, messageResourceTypeIds, changeResourceTypeIds);
    }
    const allResources = Array.from(new Set([...messageResourceTypeIds, ...changeResourceTypeIds]));
    const allowed = options.allowedResources ? new Set(options.allowedResources) : undefined;
    const events = Array.from(messageTypes)
        .map((message) => {
        const resourceTypeId = inferResourceType(message, allResources);
        let subscriptionType;
        if (resourceTypeId) {
            if (messageResourceTypeIds.has(resourceTypeId)) {
                subscriptionType = 'message';
            }
            else if (changeResourceTypeIds.has(resourceTypeId)) {
                subscriptionType = 'change';
            }
        }
        return { value: message, resourceTypeId, subscriptionType };
    })
        .filter((e) => {
        if (EXCLUDED_MESSAGES.has(e.value))
            return false;
        if (!allowed)
            return true;
        return e.resourceTypeId && allowed.has(e.resourceTypeId);
    });
    events.sort((a, b) => a.value.localeCompare(b.value));
    const unmapped = events.filter((e) => !e.resourceTypeId);
    const unclassified = events.filter((e) => !e.subscriptionType);
    const output = {
        events,
        messageResourceTypeIds: Array.from(messageResourceTypeIds).sort(),
        changeResourceTypeIds: Array.from(changeResourceTypeIds).sort(),
        stats: {
            totalMessages: events.length,
            unmapped: unmapped.length,
            unclassified: unclassified.length,
        },
        unmapped,
        unclassified,
    };
    if (options.writeFile !== false) {
        const outputFile = (_b = options.outputFile) !== null && _b !== void 0 ? _b : 'ctp-event-registry.json';
        fs_1.default.writeFileSync(path_1.default.join(OUTPUT_DIR, outputFile), JSON.stringify(output, null, 2));
    }
    return output;
}
//# sourceMappingURL=generateCtpRegistry.js.map