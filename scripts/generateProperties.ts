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
 *   When Upload Product image is selected:
 *     Product ID
 *     Image URL        string  (required)
 *     Filename         string  (optional)
 *     Variant ID       number  (optional, 0 = master)
 *     SKU              string  (optional, alternative to Variant ID)
 *     Staged           boolean (default true)
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
	Taxe: 'Tax',
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
 */
function isMainUpdateOp(op: ParsedOperation): boolean {
	if (op.isUpdateAction) return false;
	if (/\bupdate\b/i.test(op.name)) return true;
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
			const fields = op.actionBodyFields;

			if (fields.length > 0) {
				for (const field of fields) {
					const isLocalized = LOCALIZED_FIELDS.has(field.name);
					actionFields.push(makeActionFieldProperty(field.name, field, isLocalized));
				}
			} else {
				actionFields.push({
					displayName: 'No additional parameters required for this action.',
					name: '_notice',
					type: 'notice',
					default: '',
				} as INodeProperties);
			}

			return {
				displayName: op.name,
				name: op.value,
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

// ─── 8. Generic POST body fields (non-create, non-update, non-search, non-image) ──

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
				!op.isSearch &&
				!op.isImageUpload &&
				op.bodyFields.length > 0,
		);

		for (const op of miscPostOps) {
			for (const field of op.bodyFields) {
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

// ─── 9. Search body fields ────────────────────────────────────────────────────
//
// Search endpoints (POST .../search) have a structured JSON body
// (query.and, sort, limit, offset). Generate individual typed fields
// for each so users can fill them in without writing raw JSON.

export function generateSearchBodyFields(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const searchOps = operations.filter(
			(op) => op.folder === folder && !op.isUpdateAction && op.isSearch,
		);

		for (const op of searchOps) {
			for (const field of op.bodyFields) {
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

// ─── 10. Image upload fields ──────────────────────────────────────────────────
//
// POST .../images has no JSON body — instead it takes a URL plus query params.
// The Postman collection lists filename, variant, sku, staged as (disabled)
// query params. We emit them as proper typed input fields.
//
// Field mapping (matching CT HTTP API Playground):
//   imageUrl  string   required  — URL CT will fetch the image from
//   filename  string   optional  — filename hint
//   variant   number   optional  — variant ID (0 = master variant)
//   sku       string   optional  — alternative to variant
//   staged    boolean  optional  — staged vs current (default true)

export function generateImageUploadFields(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const imageOps = operations.filter(
			(op) => op.folder === folder && !op.isUpdateAction && op.isImageUpload,
		);

		for (const op of imageOps) {
			// Image URL — required, not in Postman query params but needed by executor
			props.push({
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
				description:
					'Publicly accessible URL of the image (JPEG, PNG, or GIF, max 10 MB). ' +
					'commercetools fetches the image from this URL.',
			});

			// Query params from Postman: filename, variant, sku, staged
			// Use known types — Postman has no type info on disabled params
			const PARAM_DEFS: Array<{
				key: string;
				displayName: string;
				type: 'string' | 'number' | 'boolean';
				default: string | number | boolean;
				description: string;
			}> = [
				{
					key: 'filename',
					displayName: 'Filename',
					type: 'string',
					default: '',
					description: 'Optional filename to store with the image.',
				},
				{
					key: 'variant',
					displayName: 'Variant ID',
					type: 'number',
					default: 0,
					description:
						'ID of the ProductVariant to attach the image to. Leave 0 to use the Master Variant.',
				},
				{
					key: 'sku',
					displayName: 'SKU',
					type: 'string',
					default: '',
					description: 'SKU of the ProductVariant. Alternative to Variant ID.',
				},
				{
					key: 'staged',
					displayName: 'Staged',
					type: 'boolean',
					default: true,
					description: 'Whether to add the image to staged (true) or current (false) product data.',
				},
			];

			for (const param of PARAM_DEFS) {
				// Only emit params that are actually in the operation's queryParams list
				if (!op.queryParams.includes(param.key)) continue;

				props.push({
					displayName: param.displayName,
					name: param.key,
					type: param.type,
					default: param.default,
					displayOptions: { show: { resource: [resourceValue], operation: [op.value] } },
					description: param.description,
				} as INodeProperties);
			}
		}
	}

	return props;
}

// ─── 11. Query param filters (GET / HEAD) ────────────────────────────────────

export function generateQueryParamProperties(
	operations: ParsedOperation[],
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const eligibleOps = operations.filter(
			(op) =>
				op.folder === folder &&
				!op.isUpdateAction &&
				!op.pathParamName &&
				['GET', 'HEAD'].includes(op.method) &&
				op.queryParams.length > 0,
		);

		for (const op of eligibleOps) {
			const cleanParams = [
				...new Set(op.queryParams.filter((p) => p && !p.startsWith('/') && p.trim().length > 0)),
			];

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
		...generateMiscPostBodyFields(operations, folders),
		...generateSearchBodyFields(operations, folders),
		...generateImageUploadFields(operations, folders), // ← new
		...generateQueryParamProperties(operations, folders),
	];
}

// ─── Field property builders ──────────────────────────────────────────────────

function makeActionFieldProperty(
	fieldName: string,
	field: BodyField,
	isLocalized: boolean,
): INodeProperties {
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
