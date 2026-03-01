/**
 * generateProperties.ts
 *
 * Converts ParsedOperation[] → INodeProperties[]
 *
 * UI structure:
 *   Resource           Product | Customer
 *   Operation          [real names — no update actions shown here]
 *
 *   When Update by ID/Key is selected:
 *     <Resource> ID    string
 *     Version          number
 *     Actions (JSON)   json  [raw override — paste full actions array]
 *     Actions (UI)     fixedCollection (multipleValues)
 *       Each action type = its own option group with:
 *         - scalar fields (staged, scope, variantId…) as individual inputs
 *         - object/array fields as individual JSON editors
 *       [+ Add Action]
 *
 *   When Get/Query/Delete/Check is selected:
 *     <Resource> ID or Key
 *     Filters (query params collection)
 *
 *   When Create is selected:
 *     body fields
 *
 * No descriptions on any property — labels are self-explanatory.
 */

import type { INodeProperties } from 'n8n-workflow';
import type { BodyField, ParsedOperation } from './parseCollection';
import { slugify } from './parseCollection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function humanize(str: string): string {
	return str
		.replace(/([A-Z])/g, ' $1')
		.replace(/[_-]+/g, ' ')
		.trim()
		.replace(/^\w/, (c) => c.toUpperCase());
}

function buildDisplayName(dotPath: string): string {
	return dotPath.split('.').map(humanize).join(' › ');
}

const LOCALIZED_FIELDS = new Set([
	'name',
	'slug',
	'description',
	'metaTitle',
	'metaDescription',
	'metaKeywords',
]);

/**
 * FIX C: Proper singular form for folder names.
 *
 * The previous /s$/ strip mangled irregular plurals:
 *   Addresses → Addresse   (should be Address)
 *   Categories → Categorie (should be Category)
 *   Inventories → Inventorie (should be Inventory)
 *
 * This lookup covers all CT resource folder names. Falls back to simple
 * trailing-s strip for any unlisted name so new resources still work.
 */
const SINGULAR_MAP: Record<string, string> = {
	Addresses: 'Address',
	Categories: 'Category',
	Inventories: 'Inventory',
	Entries: 'Entry',
	Deliveries: 'Delivery',
	Queries: 'Query',
	Currencies: 'Currency',
	Countries: 'Country',
	Territories: 'Territory',
	// Standard -s plurals that the fallback handles fine but are listed for clarity:
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
	Taxe: 'Tax', // 'Taxes' → 'Taxe' via /s$/, so map 'Taxes' explicitly:
	Taxes: 'Tax',
	ShoppingLists: 'Shopping List',
	DiscountCodes: 'Discount Code',
	ProductSelections: 'Product Selection',
	ProductTypes: 'Product Type',
	Projects: 'Project',
	BusinessUnits: 'Business Unit',
	AssociateRoles: 'Associate Role',
	ApprovalRules: 'Approval Rule',
	ApprovalFlows: 'Approval Flow',
	StagedQuotes: 'Staged Quote',
	QuoteRequests: 'Quote Request',
	StandalonePrices: 'Standalone Price',
	RecurringOrders: 'Recurring Order',
};

function toSingular(folderName: string): string {
	return SINGULAR_MAP[folderName] ?? folderName.replace(/ies$/, 'y').replace(/(?<=[^s])s$/, '');
}

/**
 * Identifies the main "Update <Resource> by ID/Key" endpoint.
 * Robust: matches by name OR by body structure (has `actions` array).
 */
function isMainUpdateOp(op: ParsedOperation): boolean {
	if (op.isUpdateAction) return false;
	if (/\bupdate\b/i.test(op.name)) return true;
	// Fallback: POST to /:id with an `actions` array in the body
	return op.method === 'POST' && op.requiresId && op.bodyFields.some((f) => f.name === 'actions');
}

// ─── 1. Resource dropdown ─────────────────────────────────────────────────────

export function generateResourceProperty(folders: string[]): INodeProperties {
	return {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: folders.map((f) => ({
			name: toSingular(f),
			value: slugify(f),
		})),
		default: slugify(folders[0]),
	};
}

// ─── 2. Operation dropdown ────────────────────────────────────────────────────

export function generateOperationProperties(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const topLevelOps = operations.filter((op) => op.folder === folder && !op.isUpdateAction);
		if (topLevelOps.length === 0) continue;

		props.push({
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resourceValue] } },
			options: topLevelOps.map((op) => ({
				name: op.name,
				value: op.value,
				action: op.name,
			})),
			default: topLevelOps[0].value,
		});
	}

	return props;
}

// ─── 3. Resource ID and Key fields ───────────────────────────────────────────

export function generateIdFields(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const singular = toSingular(folder);
		const topLevelOps = operations.filter((op) => op.folder === folder && !op.isUpdateAction);

		// ── Standard /:id endpoints ────────────────────────────────────────
		// Use op.requiresKey (URL-derived flag) NOT the operation name to distinguish
		// ID vs Key endpoints. Name-based checks like /by\s*key/i fail for operations
		// named e.g. "Query Product Selections for Product by Product Key" where the
		// word "Product" sits between "by" and "Key".
		const opsNeedingId = topLevelOps
			.filter((op) => op.requiresId && !op.requiresKey && !op.pathParamName)
			.map((op) => op.value);

		if (opsNeedingId.length > 0) {
			props.push({
				displayName: `${singular} ID`,
				name: 'resourceId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opsNeedingId } },
			});
		}

		// ── /key={{key}} endpoints ─────────────────────────────────────────
		const opsNeedingKey = topLevelOps
			.filter((op) => op.requiresKey && !op.pathParamName)
			.map((op) => op.value);

		if (opsNeedingKey.length > 0) {
			props.push({
				displayName: `${singular} Key`,
				name: 'resourceKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opsNeedingKey } },
			});
		}

		// ── Non-standard path param endpoints ─────────────────────────────
		// e.g. /customer-id={{customerId}}, /email={{email}}, /password-token={{passwordToken}}
		// Each gets its own uniquely-named field so they don't collide with resourceId.
		// Group ops that share the same pathParamName (same field, multiple operations).
		const customParamOps = topLevelOps.filter((op) => op.requiresId && op.pathParamName);
		const byParamName = new Map<string, { label: string; opValues: string[] }>();
		for (const op of customParamOps) {
			const key = op.pathParamName!;
			if (!byParamName.has(key)) {
				byParamName.set(key, { label: op.pathParamLabel!, opValues: [] });
			}
			byParamName.get(key)!.opValues.push(op.value);
		}
		for (const [paramName, { label, opValues }] of byParamName) {
			props.push({
				displayName: label,
				name: paramName,
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opValues } },
			});
		}
	}

	return props;
}

// ─── 4. Version field ─────────────────────────────────────────────────────────

export function generateVersionField(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const opsNeedingVersion = operations
			.filter(
				(op) =>
					op.folder === folder &&
					!op.isUpdateAction &&
					(isMainUpdateOp(op) || op.method === 'DELETE'),
			)
			.map((op) => op.value);

		if (opsNeedingVersion.length === 0) continue;

		props.push({
			displayName: 'Version',
			name: 'version',
			type: 'number',
			default: 1,
			required: true,
			displayOptions: { show: { resource: [resourceValue], operation: opsNeedingVersion } },
		});
	}

	return props;
}

// ─── 5. Actions (JSON) ────────────────────────────────────────────────────────

export function generateActionsJsonField(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const mainUpdateOps = operations
			.filter((op) => op.folder === folder && isMainUpdateOp(op))
			.map((op) => op.value);

		if (mainUpdateOps.length === 0) continue;

		props.push({
			displayName: 'Actions (JSON)',
			name: `actionsJson__${resourceValue}`,
			type: 'json',
			default: '[]',
			description: 'Raw JSON array of actions. Overrides Actions (UI) when not empty.',
			displayOptions: { show: { resource: [resourceValue], operation: mainUpdateOps } },
		});
	}

	return props;
}

// ─── 6. Actions (UI) fixedCollection ─────────────────────────────────────────
//
// n8n fixedCollection does NOT support displayOptions inside values[].
// Solution: one option group per action type. Each group has its own values[].
//
// FIELD STRATEGY — uses op.actionBodyFields (fields from inside actions[0]):
//
//   actionBodyFields is a flat list of the fields extracted from the first
//   element of the `actions` array in the Postman body example. Each field is
//   either:
//     • scalar  (string/number/boolean)  → individual typed input
//     • json    (object or array)        → individual JSON editor
//
//   This gives us e.g. for AddAsset:
//     variantId  (number) → Number input
//     asset      (json)   → JSON editor
//
//   For actions with no parseable body (empty actionBodyFields), we fall back
//   to a single catch-all "Parameters" JSON editor so the group is never empty.

export function generateActionsUiField(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const mainUpdateOps = operations
			.filter((op) => op.folder === folder && isMainUpdateOp(op))
			.map((op) => op.value);

		if (mainUpdateOps.length === 0) continue;

		const updateActions = operations.filter((op) => op.folder === folder && op.isUpdateAction);

		if (updateActions.length === 0) continue;

		const optionGroups = updateActions.map((op) => {
			const actionFields: INodeProperties[] = [];

			// Use actionBodyFields — these are the fields extracted from
			// inside actions[0] in the Postman body, with `action`/`version` stripped.
			const fields = op.actionBodyFields;

			console.info(
				`OP: ${op.name} | actionBodyFields:`,
				fields.map((f) => `${f.name}(${f.type})`),
			);

			if (fields.length > 0) {
				for (const field of fields) {
					const isLocalized = LOCALIZED_FIELDS.has(field.name);
					actionFields.push(makeActionFieldProperty(field.name, field, isLocalized));
				}
			} else {
				// Zero-parameter actions (Publish, Unpublish, RevertStagedChanges…)
				// n8n fixedCollection requires at least one field in values[].
				// Use a notice so the user sees "No additional parameters" cleanly.
				actionFields.push({
					displayName: 'No additional parameters required for this action.',
					name: '_notice',
					type: 'notice',
					default: '',
				} as INodeProperties);
			}

			return {
				displayName: op.name, // "Add Asset"
				name: op.value, // "addAsset"
				values: actionFields,
			};
		});

		props.push({
			displayName: 'Actions (UI)',
			name: `actionsUi__${resourceValue}`,
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			default: {},
			placeholder: 'Add Action',
			displayOptions: { show: { resource: [resourceValue], operation: mainUpdateOps } },
			options: optionGroups,
		});
	}

	return props;
}

// ─── 7. Create body fields ────────────────────────────────────────────────────

export function generateCreateBodyFields(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const createOps = operations.filter(
			(op) => op.folder === folder && !op.isUpdateAction && /\bcreate\b/i.test(op.name),
		);

		for (const createOp of createOps) {
			for (const field of createOp.bodyFields) {
				if (field.name === 'version') continue;
				props.push(
					makeFieldProperty(
						`body__create__${resourceValue}__${createOp.value}__${field.name.replace(/\./g, '__')}`,
						field,
						{ show: { resource: [resourceValue], operation: [createOp.value] } },
					),
				);
			}
		}
	}

	return props;
}

// ─── 8. Generic POST body fields (non-create, non-update operations) ──────────
//
// FIX D: Previously, POST operations whose names didn't match /\bcreate\b/ or
// /\bupdate\b/ (e.g. "Replicate Cart", "Add Line Item to Cart in Store") had no
// body fields generated at all — they appeared in the operation dropdown but
// showed zero input fields, making them unusable.
//
// This section generates body fields for those remaining POST operations.

export function generateMiscPostBodyFields(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const miscPostOps = operations.filter(
			(op) =>
				op.folder === folder &&
				!op.isUpdateAction &&
				op.method === 'POST' &&
				!/\bcreate\b/i.test(op.name) &&
				!isMainUpdateOp(op) &&
				op.bodyFields.length > 0,
		);

		for (const op of miscPostOps) {
			for (const field of op.bodyFields) {
				if (field.name === 'version') continue;
				props.push(
					makeFieldProperty(
						`body__misc__${resourceValue}__${op.value}__${field.name.replace(/\./g, '__')}`,
						field,
						{ show: { resource: [resourceValue], operation: [op.value] } },
					),
				);
			}
		}
	}

	return props;
}

// ─── 9. Query param filters ───────────────────────────────────────────────────

export function generateQueryParamProperties(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		// Match GET and HEAD ops with query params.
		// Exclude ops that use a custom path param (e.g. customer-id=) — those get
		// their own dedicated input field from generateIdFields and have no extra filters.
		// Note: parseCollection now normalises methods to uppercase, so comparison is safe.
		const eligibleOps = operations.filter(
			(op) =>
				op.folder === folder &&
				!op.isUpdateAction &&
				!op.pathParamName &&
				['GET', 'HEAD'].includes(op.method) &&
				op.queryParams.length > 0,
		);

		for (const op of eligibleOps) {
			// Deduplicate and strip any remaining invalid param names
			const cleanParams = [
				...new Set(op.queryParams.filter((p) => p && !p.startsWith('/') && p.trim().length > 0)),
			];

			// Skip entirely if no usable params — avoids empty "Additional Fields" section
			if (cleanParams.length === 0) continue;

			props.push({
				displayName: 'Filters',
				name: `queryParams__${op.value}`,
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
				options: cleanParams.map((param) => ({
					displayName: humanize(param),
					name: param,
					type: 'string' as const,
					default: '',
				})),
			});
		}
	}

	return props;
}

// ─── Master generator ─────────────────────────────────────────────────────────

export function generateAllNodeProperties(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	return [
		generateResourceProperty(folders),
		...generateOperationProperties(operations, folders),
		...generateIdFields(operations, folders),
		...generateVersionField(operations, folders),
		...generateActionsJsonField(operations, folders),
		...generateActionsUiField(operations, folders),
		...generateCreateBodyFields(operations, folders),
		...generateMiscPostBodyFields(operations, folders), // FIX D
		...generateQueryParamProperties(operations, folders),
	];
}

// ─── Field property builders ──────────────────────────────────────────────────

/**
 * Builds an INodeProperties for a field inside an action group (no displayOptions needed —
 * n8n fixedCollection values[] items don't support displayOptions).
 */
function makeActionFieldProperty(
	fieldName: string,
	field: BodyField,
	isLocalized: boolean,
): INodeProperties {
	// For json fields: arrays default to '[]', objects default to '{}'
	const jsonDefault = Array.isArray(field.example) ? '[]' : '{}';

	const prop: INodeProperties = {
		displayName: buildDisplayName(fieldName),
		name: fieldName,
		type: isLocalized
			? 'json'
			: field.type === 'number'
				? 'number'
				: field.type === 'boolean'
					? 'boolean'
					: field.type === 'json'
						? 'json'
						: 'string',
		default: isLocalized
			? '{ "en": "" }'
			: field.type === 'number'
				? 0
				: field.type === 'boolean'
					? false
					: field.type === 'json'
						? jsonDefault
						: '',
	};
	return prop;
}

/**
 * Builds an INodeProperties for top-level body/create fields (with displayOptions).
 */
function makeFieldProperty(
	paramName: string,
	field: BodyField,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	const isLocalized = LOCALIZED_FIELDS.has(field.name);
	const prop: INodeProperties = {
		displayName: buildDisplayName(field.name),
		name: paramName,
		type: isLocalized
			? 'json'
			: field.type === 'number'
				? 'number'
				: field.type === 'boolean'
					? 'boolean'
					: field.type === 'json'
						? 'json'
						: 'string',
		default: isLocalized
			? '{ "en": "" }'
			: field.type === 'number'
				? 0
				: field.type === 'boolean'
					? false
					: field.type === 'json'
						? '[]'
						: '',
		...(field.required ? { required: true } : {}),
		...(field.name === 'password' || field.name === 'currentPassword'
			? { typeOptions: { password: true } }
			: {}),
	};

	if (displayOptions) prop.displayOptions = displayOptions;
	return prop;
}
