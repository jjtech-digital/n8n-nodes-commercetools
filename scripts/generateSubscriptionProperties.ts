/**
 * scripts/generateSubscriptionProperties.ts
 *
 * Reads @commercetools/platform-sdk type declarations and writes
 * nodes/Commercetools/properties/subscription.properties.ts
 *
 * Sources:
 *   subscription.d.ts → MessageSubscriptionResourceTypeIdValues (enum)
 *                     → ChangeSubscriptionResourceTypeIdValues  (enum)
 *                     → EventSubscriptionResourceTypeIdValues   (enum)
 *                     → EventTypeValues                         (enum)
 *   message.d.ts      → all `readonly type: 'XxxYyy'` message type strings
 *
 * Three CT subscription arrays:
 *   messages[]  → MessageSubscription { resourceTypeId, types?: string[] }
 *   changes[]   → ChangeSubscription  { resourceTypeId }           (no types!)
 *   events[]    → EventSubscription   { resourceTypeId, types?: EventType[] }
 *
 * The generated file imports resource type Sets LIVE from the SDK enum values
 * at runtime, so they stay current across SDK version bumps without needing
 * to re-run the generator.
 *
 * Can be called as a module (from generate.ts) or run standalone:
 *   npx ts-node scripts/generateSubscriptionProperties.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Paths ────────────────────────────────────────────────────────────────────

const SDK_BASE = path.resolve(
    __dirname,
    '../node_modules/@commercetools/platform-sdk/dist/declarations/src/generated/models',
);
const SUBSCRIPTION_DTS = path.join(SDK_BASE, 'subscription.d.ts');
const MESSAGE_DTS = path.join(SDK_BASE, 'message.d.ts');

export const SUBSCRIPTION_PROPERTIES_PATH = path.resolve(
    __dirname,
    '../nodes/Commercetools/properties/subscription.properties.ts',
);

// ─── SDK .d.ts parsing ────────────────────────────────────────────────────────

/**
 * Extract enum VALUES from a `declare enum XxxValues { A = "a", B = "b" }` block.
 * Enum parsing is more reliable than string union parsing — the shape is unambiguous.
 */
function parseEnumValues(src: string, enumName: string): string[] {
    const re = new RegExp(`enum ${enumName}\\s*\\{([^}]+)\\}`, 's');
    const match = src.match(re);
    if (!match) return [];
    return [...match[1].matchAll(/=\s*"([^"]+)"/g)].map(m => m[1]);
}

/**
 * Extract all `readonly type: 'MessageTypeName'` discriminator values from
 * message.d.ts (deduplicated, preserving first-seen order).
 */
function parseMessageTypeValues(src: string): string[] {
    const seen = new Set<string>();
    return [...src.matchAll(/readonly type:\s*'([A-Z][A-Za-z0-9]+)'/g)]
        .map(m => m[1])
        .filter(t => !seen.has(t) && !!seen.add(t));
}

// ─── Message type → resourceTypeId prefix table ───────────────────────────────
//
// Longest / most-specific prefixes MUST come before shorter ones that could
// match first (e.g. 'CustomerGroup' before 'Customer', 'ProductSelection' before 'Product').

const RESOURCE_PREFIXES: Array<[prefix: string, resourceTypeId: string]> = [
    // Order sub-resources (before 'Order')
    ['CustomLineItem', 'order'],
    ['LineItem', 'order'],
    ['DeliveryCustom', 'order'],
    ['Delivery', 'order'],
    ['ParcelAdded', 'order'],
    ['ParcelRemoved', 'order'],
    ['ParcelItems', 'order'],
    ['ParcelMeasurements', 'order'],
    ['ParcelTracking', 'order'],
    ['ReturnInfo', 'order'],
    ['PurchaseOrderNumber', 'order'],
    // Approval
    ['ApprovalRule', 'approval-rule'],
    ['ApprovalFlow', 'approval-flow'],
    // Business / B2B
    ['BusinessUnit', 'business-unit'],
    ['AssociateRole', 'associate-role'],
    // Product sub-types (before 'Product')
    ['ProductSelectionVariant', 'product-selection'],
    ['ProductSelectionProduct', 'product-selection'],
    ['ProductSelection', 'product-selection'],
    ['ProductTailoring', 'product-tailoring'],
    ['Product', 'product'],
    // Pricing
    ['StandalonePrice', 'standalone-price'],
    // Catalog
    ['Category', 'category'],
    // Customer sub-types (before 'Customer')
    ['CustomerGroup', 'customer-group'],
    ['CustomerEmailToken', 'customer-email-token'],
    ['CustomerPasswordToken', 'customer-password-token'],
    ['Customer', 'customer'],
    // Inventory
    ['InventoryEntry', 'inventory-entry'],
    // Misc
    ['Review', 'review'],
    ['Order', 'order'],
    ['Cart', 'cart'],
    ['Payment', 'payment'],
    ['ShoppingList', 'shopping-list'],
    ['Store', 'store'],
    // Quotes (specific before generic)
    ['QuoteRequest', 'quote-request'],
    ['StagedQuote', 'staged-quote'],
    ['Quote', 'quote'],
    // Recurring
    ['RecurringOrder', 'recurring-order'],
];

function resourceTypeFromMessageType(t: string): string | null {
    for (const [prefix, resourceTypeId] of RESOURCE_PREFIXES) {
        if (t.startsWith(prefix)) return resourceTypeId;
    }
    return null;
}

// ─── Humanize helpers ─────────────────────────────────────────────────────────

/** "ProductPublished" → "Product Published" */
function humanize(t: string): string {
    return t
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/** "product-selection" → "Product Selection" */
function humanizeResource(r: string): string {
    return r.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionType = 'message' | 'change' | 'event';

type EventEntry = {
    value: string;   // message type | 'change:{id}' | 'message:{id}' | event type
    name: string;
    resourceTypeId: string;
    subscriptionType: SubscriptionType;
    description: string;
};

// Map event type prefix → resourceTypeId for EventSubscription events.
// New event resources added to the SDK need a corresponding entry here.
const EVENT_PREFIX_MAP: Record<string, string> = {
    Checkout: 'checkout',
    Import: 'import-api',
};

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Controls which CT resourceTypeIds appear in the n8n trigger UI.
 *
 * Uses the same CT resourceTypeId strings that appear in subscription.d.ts:
 *   'product', 'order', 'customer', 'payment', 'cart', 'checkout', etc.
 *
 * Set to null to include ALL resources (default / no filter).
 *
 * Examples:
 *   ['product', 'order', 'customer']          ← only these three
 *   ['product', 'cart', 'checkout']           ← products + cart changes + checkout events
 *   null                                       ← everything (full list)
 */
export const RESOURCES_TO_GENERATE: string[] = [
    'product',
    'customer'
];

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Parse the SDK .d.ts files and write subscription.properties.ts.
 * Called by generate.ts, or directly when run as standalone.
 *
 * @param outputPath     Where to write the generated file
 * @param resourcesToInclude  Filter to specific resourceTypeIds; null = include all
 */
export function generateSubscriptionProperties(
    outputPath = SUBSCRIPTION_PROPERTIES_PATH,
    resourcesToInclude: string[] | null = RESOURCES_TO_GENERATE,
): void {
    for (const f of [SUBSCRIPTION_DTS, MESSAGE_DTS]) {
        if (!fs.existsSync(f)) {
            throw new Error(`Not found: ${f}\nRun: npm install @commercetools/platform-sdk`);
        }
    }

    const subSrc = fs.readFileSync(SUBSCRIPTION_DTS, 'utf8');
    const msgSrc = fs.readFileSync(MESSAGE_DTS, 'utf8');

    // ── Parse resource type sets from SDK enums ───────────────────────────────
    // Used for validation and routing during generation.
    // The generated file imports these live from the SDK at runtime.

    const messageResources = new Set(parseEnumValues(subSrc, 'MessageSubscriptionResourceTypeIdValues'));
    const changeResources = new Set(parseEnumValues(subSrc, 'ChangeSubscriptionResourceTypeIdValues'));
    const eventResources = new Set(parseEnumValues(subSrc, 'EventSubscriptionResourceTypeIdValues'));
    const eventTypeValues = parseEnumValues(subSrc, 'EventTypeValues');

    if (messageResources.size === 0 || changeResources.size === 0) {
        throw new Error('Could not parse SDK enums from subscription.d.ts — format may have changed');
    }

    console.log(`  ✓  Message resources:  ${messageResources.size}`);
    console.log(`  ✓  Change resources:   ${changeResources.size}`);
    console.log(`  ✓  Event resources:    ${eventResources.size}`);
    console.log(`  ✓  Event types:        ${eventTypeValues.length}`);

    // Resources in changes[] but not in messages[] → no message types, change-only
    const changeOnlyResources = [...changeResources]
        .filter(r => !messageResources.has(r))
        .sort();
    console.log(`  ✓  Change-only:        ${changeOnlyResources.length}`);

    // ── Parse message type discriminators from message.d.ts ───────────────────

    const allMessageTypes = parseMessageTypeValues(msgSrc);
    console.log(`  ✓  Message types:      ${allMessageTypes.length}`);

    const events: EventEntry[] = [];
    const unmapped: string[] = [];

    // 1. Individual message type events
    for (const value of allMessageTypes) {
        const resourceTypeId = resourceTypeFromMessageType(value);
        if (!resourceTypeId) { unmapped.push(value); continue; }
        if (!messageResources.has(resourceTypeId)) {
            console.warn(`  ⚠️  "${value}" → "${resourceTypeId}" not in MessageSubscriptionResourceTypeId — skipping`);
            continue;
        }
        events.push({
            value,
            name: humanize(value),
            resourceTypeId,
            subscriptionType: 'message',
            description: `Triggered on ${humanize(value).toLowerCase()} event`,
        });
    }

    if (unmapped.length) {
        console.warn(`\n  ⚠️  ${unmapped.length} unmapped message type(s) — add to RESOURCE_PREFIXES:`);
        unmapped.forEach(t => console.warn(`      • ${t}`));
        console.warn();
    }

    // 2. Message resources with no found types → catch-all entry (no types[] filter)
    const coveredResources = new Set(events.map(e => e.resourceTypeId));
    for (const resourceTypeId of [...messageResources].sort()) {
        if (!coveredResources.has(resourceTypeId)) {
            const hr = humanizeResource(resourceTypeId);
            console.warn(`  ℹ️  No message types found for "${resourceTypeId}" — adding catch-all`);
            events.push({
                value: `message:${resourceTypeId}`,
                name: `${hr} (all messages)`,
                resourceTypeId,
                subscriptionType: 'message',
                description: `Triggered on any message for ${hr.toLowerCase()} (no type filter)`,
            });
        }
    }

    // 3. Change-only events (one entry per resource, no types array in CT API)
    for (const resourceTypeId of changeOnlyResources) {
        const hr = humanizeResource(resourceTypeId);
        events.push({
            value: `change:${resourceTypeId}`,
            name: `${hr} (any change)`,
            resourceTypeId,
            subscriptionType: 'change',
            description: `Triggered on any change to a ${hr.toLowerCase()} resource`,
        });
    }

    // 4. Event subscription events (checkout, import-api, …)
    for (const value of eventTypeValues) {
        let resourceTypeId = '';
        for (const [prefix, rid] of Object.entries(EVENT_PREFIX_MAP)) {
            if (value.startsWith(prefix)) { resourceTypeId = rid; break; }
        }
        if (!resourceTypeId) {
            console.warn(`  ⚠️  Unknown event type prefix: "${value}" — add to EVENT_PREFIX_MAP`);
            continue;
        }
        events.push({
            value,
            name: humanize(value),
            resourceTypeId,
            subscriptionType: 'event',
            description: `Triggered on ${humanize(value).toLowerCase()} event`,
        });
    }

    // ── Apply RESOURCES_TO_GENERATE filter ───────────────────────────────────

    const allowedResources = resourcesToInclude ? new Set(resourcesToInclude) : null;

    if (allowedResources) {
        // Warn about any configured resourceTypeId not known to the SDK
        for (const r of allowedResources) {
            if (!messageResources.has(r) && !changeResources.has(r) && !eventResources.has(r)) {
                console.warn(`  ⚠️  RESOURCES_TO_GENERATE: "${r}" is not a known CT resourceTypeId — check spelling`);
            }
        }
        const before = events.length;
        events.splice(0, events.length, ...events.filter(e => allowedResources.has(e.resourceTypeId)));
        console.log(`\n  ✂️   Filtered: kept ${events.length} of ${before} events`);
        console.log(`       Resources: ${[...allowedResources].sort().join(', ')}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    const msgCount = events.filter(e => e.subscriptionType === 'message').length;
    const chgCount = events.filter(e => e.subscriptionType === 'change').length;
    const evtCount = events.filter(e => e.subscriptionType === 'event').length;
    console.log(`\n  ✅  Total: ${events.length} events (${msgCount} message, ${chgCount} change, ${evtCount} event)`);

    writeOutput(events, outputPath, resourcesToInclude);
}

// ─── Code generation ──────────────────────────────────────────────────────────

function writeOutput(events: EventEntry[], outputPath: string, resourcesToInclude: string[] | null): void {
    // Group by resourceTypeId for readable section comments in the output
    const byResource = new Map<string, EventEntry[]>();
    for (const e of events) {
        const bucket = byResource.get(e.resourceTypeId) ?? [];
        bucket.push(e);
        byResource.set(e.resourceTypeId, bucket);
    }

    const eventLines: string[] = [];
    for (const [resourceTypeId, entries] of [...byResource.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const types = [...new Set(entries.map(e => e.subscriptionType))].join('+');
        eventLines.push(`    // ── ${resourceTypeId} (${types}) ──`);
        for (const e of entries) {
            const q = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            eventLines.push(
                `    { name: '${q(e.name)}', value: '${e.value}', resourceTypeId: '${e.resourceTypeId}', subscriptionType: '${e.subscriptionType}', description: '${q(e.description)}' },`
            );
        }
        eventLines.push('');
    }

    const resourceNote = resourcesToInclude
        ? ` * Resources included (RESOURCES_TO_GENERATE):\n * ${resourcesToInclude.sort().join(', ')}`
        : ' * Resources included: ALL (RESOURCES_TO_GENERATE = null)';

    const ts = `/**
 * subscription.properties.ts
 *
 * AUTO-GENERATED — DO NOT EDIT MANUALLY
 * Generated by: scripts/generate.ts  (via generateSubscriptionProperties.ts)
 * Source: @commercetools/platform-sdk — subscription.d.ts + message.d.ts
 * Generated at: ${new Date().toISOString()}
 *
 * Regenerate: npm run generate
 * To change which resources appear in the UI, edit RESOURCES_TO_GENERATE
 * in scripts/generateSubscriptionProperties.ts then re-run npm run generate.
 *
${resourceNote}
 *
 * Three CT subscription arrays:
 *   messages[]  → MessageSubscription { resourceTypeId, types?: string[] }
 *   changes[]   → ChangeSubscription  { resourceTypeId }  (no per-type filtering)
 *   events[]    → EventSubscription   { resourceTypeId, types?: EventType[] }
 *
 * Resource type Sets are imported LIVE from the SDK enum values at runtime,
 * so they stay current across SDK version bumps without re-running the generator.
 */

import { INodeProperties } from 'n8n-workflow';
import {
    MessageSubscriptionResourceTypeIdValues,
    ChangeSubscriptionResourceTypeIdValues,
    EventSubscriptionResourceTypeIdValues,
} from '@commercetools/platform-sdk';

// ─── SDK-derived resource type sets (live, not hardcoded) ────────────────────

/** Resources supporting CT messages[] — MessageSubscriptionResourceTypeId */
export const MESSAGE_SUBSCRIPTION_RESOURCES = new Set<string>(
    Object.values(MessageSubscriptionResourceTypeIdValues),
);

/** Resources supporting CT changes[] — ChangeSubscriptionResourceTypeId */
export const CHANGE_SUBSCRIPTION_RESOURCES = new Set<string>(
    Object.values(ChangeSubscriptionResourceTypeIdValues),
);

/** Resources supporting CT events[] — EventSubscriptionResourceTypeId */
export const EVENT_SUBSCRIPTION_RESOURCES = new Set<string>(
    Object.values(EventSubscriptionResourceTypeIdValues),
);

// ─── Event type ───────────────────────────────────────────────────────────────

export type SubscriptionType = 'message' | 'change' | 'event';

export type SubscriptionEvent = {
    name: string;
    /**
     * One of:
     *   'ProductPublished'          → specific message type  → messages[].types[]
     *   'message:customer-group'    → all messages for resource → messages[] (no types filter)
     *   'change:cart'               → change resource        → changes[]
     *   'CheckoutPaymentAuthorized' → event type             → events[].types[]
     */
    value:            string;
    resourceTypeId:   string;
    subscriptionType: SubscriptionType;
    description:      string;
};

// ─── Generated event list ─────────────────────────────────────────────────────

export const subscriptionEvents: SubscriptionEvent[] = [
${eventLines.join('\n')}];

// ─── n8n property ─────────────────────────────────────────────────────────────

export const triggerProperties: INodeProperties[] = [
    {
        displayName:      'Events',
        name:             'events',
        type:             'multiOptions',
        noDataExpression: true,
        required:         true,
        options:          subscriptionEvents.map(({ name, value, description }) => ({ name, value, description })),
        default:          ['ProductPublished'],
        description:      'Select which commercetools events should trigger this workflow',
    },
];
`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, ts, 'utf8');
    console.log(`  ✅  Wrote ${outputPath}`);
}

// ─── Standalone entry point ───────────────────────────────────────────────────
// Only runs when invoked directly: npx ts-node scripts/generateSubscriptionProperties.ts

if (require.main === module) {
    console.log('\n🔔  Running subscription property generator (standalone)');
    console.log(`    ${new Date().toISOString()}\n`);
    try {
        generateSubscriptionProperties();
        console.log('\n✅  Done. Now run: npm run build\n');
    } catch (err) {
        console.error('❌  Failed:', err);
        process.exit(1);
    }
}