import ts from 'typescript';
import fs from 'fs';
import path from 'path';

/**
 * Types
 */
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

/**
 * Sub-resource overrides
 */
const subResourceToParent: Record<string, string> = {
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

const pascalToKebab = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Walk directory recursively
 */
function walk(dir: string): string[] {
	const files: string[] = [];

	for (const file of fs.readdirSync(dir)) {
		const full = path.join(dir, file);
		const stat = fs.statSync(full);

		if (stat.isDirectory()) files.push(...walk(full));
		else if (file.endsWith('.d.ts')) files.push(full);
	}

	return files;
}

/**
 * MAIN EXPORTABLE FUNCTION
 */
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

	/**
	 * Infer resource
	 */
	const inferResourceType = (message: string): string | undefined => {
		const kebab = pascalToKebab(message);

		// ✅ Combine BOTH resource sets
		const allResources = Array.from(new Set([...messageResourceTypeIds, ...changeResourceTypeIds]));

		// Longest prefix match first
		const direct = allResources
			.filter((r) => kebab.startsWith(r))
			.sort((a, b) => b.length - a.length)[0];

		if (direct) return direct;

		// Fallback to explicit overrides only if nothing matched
		const subMatch = Object.keys(subResourceToParent)
			.filter((k) => kebab.startsWith(k))
			.sort((a, b) => b.length - a.length)[0];

		if (subMatch) return subResourceToParent[subMatch];

		return undefined;
	};

	/**
	 * Parse AST
	 */
	function parseFile(filePath: string) {
		const source = ts.createSourceFile(
			filePath,
			fs.readFileSync(filePath, 'utf8'),
			ts.ScriptTarget.Latest,
			true,
		);

		function visit(node: ts.Node) {
			/**
			 * MessagePayload interfaces
			 */
			if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith('MessagePayload')) {
				node.members.forEach((member) => {
					if (
						ts.isPropertySignature(member) &&
						member.name.getText() === 'type' &&
						member.type &&
						ts.isLiteralTypeNode(member.type) &&
						ts.isStringLiteral(member.type.literal)
					) {
						messageTypes.add(member.type.literal.text);
					}
				});
			}

			/**
			 * Subscription enums
			 */
			if (ts.isTypeAliasDeclaration(node) && ts.isUnionTypeNode(node.type)) {
				const typeName = node.name.text;

				if (
					typeName === 'MessageSubscriptionResourceTypeId' ||
					typeName === 'ChangeSubscriptionResourceTypeId'
				) {
					node.type.types.forEach((t) => {
						if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
							if (typeName === 'MessageSubscriptionResourceTypeId') {
								messageResourceTypeIds.add(t.literal.text);
							} else {
								changeResourceTypeIds.add(t.literal.text);
							}
						}
					});
				}
			}

			ts.forEachChild(node, visit);
		}

		visit(source);
	}

	/**
	 * Execute parsing
	 */
	walk(SDK_PATH).forEach(parseFile);

	/**
	 * Build registry
	 */
	const allowed = options.allowedResources ? new Set(options.allowedResources) : undefined;

	// Known false positives — valid SDK types but rejected by CT API
	const EXCLUDED_MESSAGES = new Set(['ShoppingListStoreSet']);

	const events: EventDef[] = Array.from(messageTypes)
		.map((message) => {
			const resourceTypeId = inferResourceType(message);

			let subscriptionType: SubscriptionKind | undefined;

			if (resourceTypeId) {
				if (messageResourceTypeIds.has(resourceTypeId)) {
					subscriptionType = 'message';
				} else if (changeResourceTypeIds.has(resourceTypeId)) {
					subscriptionType = 'change';
				}
			}

			return {
				value: message,
				resourceTypeId,
				subscriptionType,
			};
		})
		// ✅ FILTER HERE
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

	/**
	 * Optional file write
	 */
	if (options.writeFile !== false) {
		const outputFile = options.outputFile ?? 'ctp-event-registry.json';

		fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), JSON.stringify(output, null, 2));
	}

	return output;
}
