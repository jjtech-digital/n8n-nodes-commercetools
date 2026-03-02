/**
 * scripts/generateSubscriptionProperties.ts
 *
 * Reads @commercetools/platform-sdk type declarations and writes
 * nodes/Commercetools/generated/subscription.properties.ts
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

const REGISTRY_PATH = path.resolve(
	process.cwd(),
	'nodes/Commercetools/generated/ctp-event-registry.json',
);

const OUTPUT_PATH = path.resolve(
	process.cwd(),
	'nodes/Commercetools/generated/subscription.properties.ts',
);

type RegistryFile = {
	events: Array<{
		value: string;
		resourceTypeId?: string;
		subscriptionType?: 'message' | 'change';
	}>;
};

function formatEventName(value: string): string {
	// ProductPublished → Product Published
	return value
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
		.trim();
}

function formatDescription(
	value: string,
	resourceTypeId: string,
	subscriptionType: 'message' | 'change',
): string {
	const readableName = formatEventName(value).toLowerCase();

	if (subscriptionType === 'message') {
		return `Triggers when ${readableName} occurs on a ${resourceTypeId}.`;
	}

	return `Triggers when a ${resourceTypeId} changes (${readableName}).`;
}

export function generateSubscriptionProperties(): void {
	const registry: RegistryFile = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

	if (!registry.events || !Array.isArray(registry.events)) {
		throw new Error('Invalid registry format: missing events array');
	}

	const lines: string[] = [];

	for (const e of registry.events) {
		if (!e.resourceTypeId || !e.subscriptionType) {
			continue; // skip unmapped/unclassified
		}

		const name = formatEventName(e.value);
		const description = formatDescription(e.value, e.resourceTypeId, e.subscriptionType);

		lines.push(
			`    { name: '${escape(name)}', value: '${e.value}', resourceTypeId: '${e.resourceTypeId}', subscriptionType: '${e.subscriptionType}', description: '${escape(description)}' },`,
		);
	}

	const output = `/**
 * subscription.properties.ts
 *
 * AUTO-GENERATED — DO NOT EDIT MANUALLY
 * Generated at: ${new Date().toISOString()}
 */

import { INodeProperties } from 'n8n-workflow';

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

	console.log('✅ Generated subscription.properties.ts');
}

function escape(str: string): string {
	return str.replace(/'/g, "\\'");
}

if (require.main === module) {
	generateSubscriptionProperties();
}
