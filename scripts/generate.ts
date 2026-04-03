/**
 * scripts/generate.ts
 *
 * SINGLE ENTRY POINT — run whenever:
 *   - The Postman collection updates
 *   - The commercetools SDK updates
 *
 *   npx ts-node scripts/generate.ts
 *   # or: npm run generate
 *
 * What it does:
 *
 *   STEP 1 — Postman collection → operation properties
 *       Generates:
 *         nodes/Commercetools/generated/properties.ts
 *         nodes/Commercetools/generated/operations.json
 *
 *   STEP 2 — SDK .d.ts → event registry
 *       Generates:
 *         nodes/Commercetools/generated/ctp-event-registry.json
 *
 *   STEP 3 — Event registry → subscription.properties.ts
 *       Generates:
 *         nodes/Commercetools/generated/subscription.properties.ts
 *
 * After running: npm run build
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

import { parseCollection } from './parseCollection';
import type { ParsedOperation, BodyField } from './parseCollection';
import { generateAllNodeProperties } from './generateProperties';

import { generateCtpEventRegistry } from './generateCtpRegistry';
import { generateSubscriptionProperties } from './generateSubscriptionProperties';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const COLLECTION_URL =
	'https://raw.githubusercontent.com/commercetools/commercetools-postman-collection/master/api/collection.json';

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
]; // For Actions;

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
]; // For Triggers;

// ─────────────────────────────────────────────────────────────────────────────
// Download helper
// ─────────────────────────────────────────────────────────────────────────────

function downloadFile(url: string, dest: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);

		https
			.get(url, (response) => {
				if (response.statusCode === 301 || response.statusCode === 302) {
					file.close();
					downloadFile(response.headers.location!, dest).then(resolve).catch(reject);
					return;
				}

				response.pipe(file);
				file.on('finish', () => file.close(() => resolve()));
			})
			.on('error', (err) => {
				fs.unlink(dest, () => {});
				reject(err);
			});
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual patches — fixes for operations where the Postman collection
// is missing body/action field definitions
// ─────────────────────────────────────────────────────────────────────────────

interface OperationPatch {
	bodyFields?: BodyField[];
	actionBodyFields?: BodyField[];
	queryParams?: string[];
}

const MANUAL_PATCHES: Record<string, OperationPatch> = {
	queryCustomObjects: {
		queryParams: ['container', 'sort', 'where', 'expand', 'limit', 'offset', 'withTotal'],
	},
	changeAssociateMode: {
		bodyFields: [
			{
				name: 'version',
				type: 'string',
				required: true,
				example: 'placeholder',
				description: 'Version',
			},
			{
				name: 'actions',
				type: 'json',
				required: false,
				example: [
					{
						action: 'changeAssociateMode',
						associateMode: 'ExplicitAndFromParent',
					},
				],
				description: 'Array of actions',
			},
		],
		actionBodyFields: [
			{
				name: 'associateMode',
				type: 'string',
				required: true,
				example: 'ExplicitAndFromParent',
				description: 'Associate Mode',
			},
		],
	},
	// Add more patches here in the future if the Postman collection
	// is missing fields for other operations. Example:
	// someOtherAction: {
	//   actionBodyFields: [
	//     { name: 'someField', type: 'string', required: true, example: '', description: '' },
	//   ],
	// },
};

function applyManualPatches(operations: ParsedOperation[]): void {
	for (const op of operations) {
		const patch = MANUAL_PATCHES[op.value];
		if (!patch) continue;

		if (patch.bodyFields !== undefined && op.bodyFields.length === 0) {
			op.bodyFields = patch.bodyFields;
		}

		if (patch.actionBodyFields !== undefined && op.actionBodyFields.length === 0) {
			op.actionBodyFields = patch.actionBodyFields;
		}

		if (patch.queryParams !== undefined) {
			op.queryParams = patch.queryParams;
		}

		//console.log(`  ✔ Patched missing fields for operation: ${op.value}`);
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Postman → Node operation properties
// ─────────────────────────────────────────────────────────────────────────────

async function generateFromCollection(): Promise<void> {
	try {
		await downloadFile(COLLECTION_URL, COLLECTION_LOCAL_PATH);
	} catch {
		if (!fs.existsSync(COLLECTION_LOCAL_PATH)) {
			throw new Error('No network and no local collection.json found.');
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const collection = require(COLLECTION_LOCAL_PATH);

	const operations = parseCollection(collection, FOLDERS_TO_GENERATE);

	applyManualPatches(operations);

	const nodeProperties = generateAllNodeProperties(operations, FOLDERS_TO_GENERATE);

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

	const opsMap: Record<string, unknown> = {};
	for (const op of operations) opsMap[op.value] = op;

	fs.writeFileSync(path.join(OUTPUT_DIR, 'operations.json'), JSON.stringify(opsMap, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — SDK → Registry JSON
// ─────────────────────────────────────────────────────────────────────────────

function generateRegistry(): void {
	generateCtpEventRegistry(OUTPUT_DIR, { allowedResources: RESOURCES_TO_GENERATE });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Registry → subscription.properties.ts
// ─────────────────────────────────────────────────────────────────────────────

function generateSubscriptions(): void {
	generateSubscriptionProperties();
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	try {
		await generateFromCollection();
		generateRegistry();
		generateSubscriptions();
	} catch {
		process.exit(1);
	}
}

main().catch(() => {
	process.exit(1);
});
