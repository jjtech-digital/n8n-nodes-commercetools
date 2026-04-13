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
exports.generateSubscriptionProperties = generateSubscriptionProperties;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const REGISTRY_PATH = path.resolve(process.cwd(), 'nodes/Commercetools/generated/ctp-event-registry.json');
const OUTPUT_PATH = path.resolve(process.cwd(), 'nodes/Commercetools/generated/subscription.properties.ts');
function formatEventName(value) {
    return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim();
}
function formatDescription(value, resourceTypeId, subscriptionType) {
    const eventName = formatEventName(value);
    if (subscriptionType === 'message') {
        return `Fires when a ${eventName} message is received for a ${resourceTypeId}.`;
    }
    return `Fires on any change to a ${resourceTypeId} (${eventName}).`;
}
function escapeSingleQuotes(str) {
    return str.replace(/'/g, "\\'");
}
function generateSubscriptionProperties() {
    if (!fs.existsSync(REGISTRY_PATH)) {
        throw new Error(`[generateSubscriptionProperties] Registry file not found: ${REGISTRY_PATH}\n` +
            `Run the registry generator first (Step 2 in generate.ts).`);
    }
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    if (!registry.events || !Array.isArray(registry.events)) {
        throw new Error(`[generateSubscriptionProperties] Invalid registry format: missing events array in ${REGISTRY_PATH}`);
    }
    const lines = [];
    for (const e of registry.events) {
        if (!e.resourceTypeId || !e.subscriptionType) {
            continue;
        }
        const name = formatEventName(e.value);
        const description = formatDescription(e.value, e.resourceTypeId, e.subscriptionType);
        lines.push(`    { name: '${escapeSingleQuotes(name)}', value: '${e.value}', resourceTypeId: '${e.resourceTypeId}', subscriptionType: '${e.subscriptionType}', description: '${escapeSingleQuotes(description)}' },`);
    }
    const output = `/**
 * subscription.properties.ts
 *
 * AUTO-GENERATED — DO NOT EDIT MANUALLY
 * Generated at: ${new Date().toISOString()}
 */

import type { INodeProperties } from 'n8n-workflow';

export type SubscriptionType = 'message' | 'change';

export type SubscriptionEvent = {
  name: string;
  value: string;
  resourceTypeId: string;
  subscriptionType: SubscriptionType;
  description: string;
};

// ─── Generated event list ─────────────────────────────────────────────────────

export const subscriptionEvents: SubscriptionEvent[] = [
${lines.join('\n')}
];

export const triggerProperties: INodeProperties[] = [
  {
    displayName: 'Events',
    name: 'events',
    type: 'multiOptions',
    noDataExpression: true,
    required: true,
    options: subscriptionEvents.map(({ name, value, description }) => ({
      name,
      value,
      description,
    })),
    default: ['ProductPublished'],
    description: 'Select which commercetools events should trigger this workflow',
  },
];
`;
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
}
if (require.main === module) {
    generateSubscriptionProperties();
}
//# sourceMappingURL=generateSubscriptionProperties.js.map