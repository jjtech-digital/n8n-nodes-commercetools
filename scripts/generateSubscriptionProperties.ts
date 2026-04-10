/**
 * scripts/generateSubscriptionProperties.ts
 *
 * Reads nodes/Commercetools/generated/ctp-event-registry.json and writes
 * nodes/Commercetools/generated/subscription.properties.ts.
 *
 * Can be called as a module (from generate.ts) or run standalone:
 *   npx ts-node scripts/generateSubscriptionProperties.ts
 *
 * Bug fixes applied:
 *   BUG-10: Renamed `escape` → `escapeSingleQuotes` to avoid shadowing the
 *            deprecated global `escape()` function.
 *   BUG-11: Added fs.existsSync pre-check so a missing registry file produces
 *            a clear error instead of an opaque JSON parse failure.
 *   READ-9: INodeProperties imported with `import type`.
 *   READ-10: formatDescription now uses plain-English phrasing with the event
 *             name rendered in title-case rather than lowercase.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Paths ────────────────────────────────────────────────────────────────────

const REGISTRY_PATH = path.resolve(
	process.cwd(),
	'nodes/Commercetools/generated/ctp-event-registry.json',
);

const OUTPUT_PATH = path.resolve(
	process.cwd(),
	'nodes/Commercetools/generated/subscription.properties.ts',
);

// ─── Types ────────────────────────────────────────────────────────────────────

type RegistryFile = {
	events: Array<{
		value: string;
		resourceTypeId?: string;
		subscriptionType?: 'message' | 'change';
	}>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventName(value: string): string {
	return value
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
		.trim();
}

/**
 * READ-10: description now reads naturally in the n8n UI.
 * Example: "Fires when a ProductPublished message is received for a product."
 */
function formatDescription(
	value: string,
	resourceTypeId: string,
	subscriptionType: 'message' | 'change',
): string {
	const eventName = formatEventName(value);

	if (subscriptionType === 'message') {
		return `Fires when a ${eventName} message is received for a ${resourceTypeId}.`;
	}

	return `Fires on any change to a ${resourceTypeId} (${eventName}).`;
}

/** BUG-10: renamed from `escape` to avoid shadowing the global `escape()`. */
function escapeSingleQuotes(str: string): string {
	return str.replace(/'/g, "\\'");
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateSubscriptionProperties(): void {
	// BUG-11: Check existence before reading to surface a clear error message.
	if (!fs.existsSync(REGISTRY_PATH)) {
		throw new Error(
			`[generateSubscriptionProperties] Registry file not found: ${REGISTRY_PATH}\n` +
				`Run the registry generator first (Step 2 in generate.ts).`,
		);
	}

	const registry: RegistryFile = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

	if (!registry.events || !Array.isArray(registry.events)) {
		throw new Error(
			`[generateSubscriptionProperties] Invalid registry format: missing events array in ${REGISTRY_PATH}`,
		);
	}

	const lines: string[] = [];

	for (const e of registry.events) {
		if (!e.resourceTypeId || !e.subscriptionType) {
			continue; // skip unmapped / unclassified entries
		}

		const name = formatEventName(e.value);
		const description = formatDescription(e.value, e.resourceTypeId, e.subscriptionType);

		lines.push(
			`    { name: '${escapeSingleQuotes(name)}', value: '${e.value}', resourceTypeId: '${e.resourceTypeId}', subscriptionType: '${e.subscriptionType}', description: '${escapeSingleQuotes(description)}' },`,
		);
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
