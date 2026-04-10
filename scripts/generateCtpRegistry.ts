/**
 * scripts/generateCtpRegistry.ts
 *
 * Parses @commercetools/platform-sdk TypeScript declaration files and writes
 * nodes/Commercetools/generated/ctp-event-registry.json.
 *
 * Bug fixes applied:
 *   BUG-6:  Removed duplicate `.filter()` predicate line (was checking
 *            EXCLUDED_MESSAGES twice — the second check was dead code).
 *   BUG-7:  `allResources` array is built once after parsing completes and
 *            injected into `inferResourceType` as a parameter, instead of
 *            being re-created on every call inside a closure.
 *   PERF-3: EXCLUDED_MESSAGES moved to module level so it is initialised once,
 *            not recreated inside `generateCtpEventRegistry` on every call.
 *   BP-4:   `parseFile` wraps `readFileSync` in try/catch — a missing or
 *            unreadable .d.ts file now emits a warning instead of crashing.
 *   BP-5:   `walk` wraps `readdirSync` in try/catch — a missing SDK path now
 *            throws a descriptive error message.
 */

import ts from 'typescript';
import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionKind = 'message' | 'change';

export interface EventDef {
	value: string;
	resourceTypeId?: string;
	subscriptionType?: SubscriptionKind;
}

export interface GenerateOptions {
	sdkPath?: string;
	outputFile?: string;
	writeFile?: boolean;
	allowedResources?: readonly string[];
}

// ─── Sub-resource overrides ───────────────────────────────────────────────────

const SUB_RESOURCE_TO_PARENT: Record<string, string> = {
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

// ─── EXCLUDED_MESSAGES (PERF-3, module-level) ─────────────────────────────────
// Known false positives — valid SDK types but rejected by the CT Subscriptions API.

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pascalToKebab = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Walk directory recursively and return all .d.ts file paths.
 *
 * BP-5: readdirSync is wrapped in try/catch — a missing SDK path now throws a
 * descriptive error instead of an opaque ENOENT stack trace.
 */
function walk(dir: string): string[] {
	let entries: string[];
	try {
		entries = fs.readdirSync(dir);
	} catch (err) {
		throw new Error(
			`[generateCtpRegistry] Cannot read SDK directory: ${dir}\n` +
				`Make sure @commercetools/platform-sdk is installed (npm install).\n` +
				`Original error: ${err instanceof Error ? err.message : String(err)}`,
		);
	}

	const files: string[] = [];
	for (const file of entries) {
		const full = path.join(dir, file);
		const stat = fs.statSync(full);
		if (stat.isDirectory()) files.push(...walk(full));
		else if (file.endsWith('.d.ts')) files.push(full);
	}
	return files;
}

// ─── AST parser ───────────────────────────────────────────────────────────────

/**
 * Parse a single .d.ts file and populate the provided Sets with discovered
 * message type literals and subscription resource type IDs.
 *
 * BP-4: readFileSync is wrapped — an unreadable file emits a console.warn
 * instead of crashing the whole generation pipeline.
 */
function parseFile(
	filePath: string,
	messageTypes: Set<string>,
	messageResourceTypeIds: Set<string>,
	changeResourceTypeIds: Set<string>,
): void {
	let source: ts.SourceFile;
	try {
		source = ts.createSourceFile(
			filePath,
			fs.readFileSync(filePath, 'utf8'),
			ts.ScriptTarget.Latest,
			true,
		);
	} catch (err) {
		console.warn(
			`[generateCtpRegistry] Skipping unreadable file: ${filePath} — ${err instanceof Error ? err.message : err}`,
		);
		return;
	}

	function visit(node: ts.Node) {
		// Collect MessagePayload interface type literals
		if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith('MessagePayload')) {
			for (const member of node.members) {
				if (
					ts.isPropertySignature(member) &&
					member.name.getText() === 'type' &&
					member.type &&
					ts.isLiteralTypeNode(member.type) &&
					ts.isStringLiteral(member.type.literal)
				) {
					messageTypes.add(member.type.literal.text);
				}
			}
		}

		// Collect subscription resource type IDs from union type aliases
		if (ts.isTypeAliasDeclaration(node) && ts.isUnionTypeNode(node.type)) {
			const typeName = node.name.text;
			if (
				typeName === 'MessageSubscriptionResourceTypeId' ||
				typeName === 'ChangeSubscriptionResourceTypeId'
			) {
				for (const t of node.type.types) {
					if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
						if (typeName === 'MessageSubscriptionResourceTypeId') {
							messageResourceTypeIds.add(t.literal.text);
						} else {
							changeResourceTypeIds.add(t.literal.text);
						}
					}
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(source);
}

// ─── Resource type inference ──────────────────────────────────────────────────

/**
 * Infer the commercetools resource type ID for a MessagePayload type name.
 *
 * BUG-7: `allResources` is passed in as a parameter (built once after parsing),
 * not computed inside the function on every call.
 */
function inferResourceType(
	message: string,
	allResources: string[],
): string | undefined {
	const kebab = pascalToKebab(message);

	// Longest prefix match first
	const direct = allResources
		.filter((r) => kebab.startsWith(r))
		.sort((a, b) => b.length - a.length)[0];

	if (direct) return direct;

	// Fallback to explicit sub-resource overrides
	const subMatch = Object.keys(SUB_RESOURCE_TO_PARENT)
		.filter((k) => kebab.startsWith(k))
		.sort((a, b) => b.length - a.length)[0];

	return subMatch ? SUB_RESOURCE_TO_PARENT[subMatch] : undefined;
}

// ─── Main exportable function ─────────────────────────────────────────────────

export function generateCtpEventRegistry(OUTPUT_DIR: string, options: GenerateOptions = {}) {
	const SDK_PATH =
		options.sdkPath ??
		path.resolve(
			process.cwd(),
			'node_modules/@commercetools/platform-sdk/dist/declarations/src/generated/models',
		);

	const messageTypes = new Set<string>();
	const messageResourceTypeIds = new Set<string>();
	const changeResourceTypeIds = new Set<string>();

	// Parse all .d.ts files in the SDK models directory
	for (const filePath of walk(SDK_PATH)) {
		parseFile(filePath, messageTypes, messageResourceTypeIds, changeResourceTypeIds);
	}

	// BUG-7: Build allResources once after parsing completes
	const allResources = Array.from(
		new Set([...messageResourceTypeIds, ...changeResourceTypeIds]),
	);

	const allowed = options.allowedResources ? new Set(options.allowedResources) : undefined;

	const events: EventDef[] = Array.from(messageTypes)
		.map((message) => {
			const resourceTypeId = inferResourceType(message, allResources);

			let subscriptionType: SubscriptionKind | undefined;
			if (resourceTypeId) {
				if (messageResourceTypeIds.has(resourceTypeId)) {
					subscriptionType = 'message';
				} else if (changeResourceTypeIds.has(resourceTypeId)) {
					subscriptionType = 'change';
				}
			}

			return { value: message, resourceTypeId, subscriptionType };
		})
		// BUG-6: Single filter pass (was checking EXCLUDED_MESSAGES twice)
		.filter((e) => {
			if (EXCLUDED_MESSAGES.has(e.value)) return false;
			if (!allowed) return true;
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
		const outputFile = options.outputFile ?? 'ctp-event-registry.json';
		fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), JSON.stringify(output, null, 2));
	}

	return output;
}
