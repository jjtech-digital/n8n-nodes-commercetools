/**
 * generateProperties.ts
 *
 * Converts ParsedOperation[] → INodeProperties[]
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

/**
 * Determine whether a BodyField is a LocalizedString by inspecting its
 * example value from the Postman body.
 *
 * A field is localized if its example value is a plain object (not an array)
 * whose keys all look like IETF locale tags (e.g. "en", "en-US", "de-DE").
 *
 * This replaces the old LOCALIZED_FIELDS hardcoded set, which incorrectly
 * treated fields like BusinessUnit.name (plain string) as localized simply
 * because their field name appeared in the set.
 */
function isLocalizedField(field: BodyField): boolean {
	if (field.type !== 'json' && field.type !== 'string') return false;
	const ex = field.example;
	if (!ex || typeof ex !== 'object' || Array.isArray(ex)) return false;
	const keys = Object.keys(ex as Record<string, unknown>);
	if (keys.length === 0) return false;
	// All keys must match a locale tag pattern: 2-letter language, optional
	// hyphen + 2-letter region (e.g. "en", "en-US", "de", "zh-CN")
	return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
}

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
	'Business-units': 'Business Unit',
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

		// ── Custom Object — container/key path params ─────────────────
		const customObjectOps = topLevelOps
			.filter((op) => op.urlTemplate.includes('{{container}}'))
			.map((op) => op.value);
		if (customObjectOps.length > 0) {
			props.push({
				displayName: 'Container',
				name: 'container',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: customObjectOps } },
			});
			props.push({
				displayName: 'Key',
				name: 'resourceKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: customObjectOps } },
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

		// Secondary ID — for sub-resource endpoints like /business-units/{id}/associates/{associate-id}
		const opsNeedingSecondaryId = topLevelOps
			.filter((op) => op.secondaryIdPlaceholder)
			.map((op) => ({ value: op.value, placeholder: op.secondaryIdPlaceholder! }));

		// Group by placeholder name so identical placeholders share one field
		const bySecondaryPlaceholder = new Map<string, string[]>();
		for (const { value, placeholder } of opsNeedingSecondaryId) {
			if (!bySecondaryPlaceholder.has(placeholder)) bySecondaryPlaceholder.set(placeholder, []);
			bySecondaryPlaceholder.get(placeholder)!.push(value);
		}
		for (const [placeholder, opValues] of bySecondaryPlaceholder) {
			const label =
				placeholder
					.replace(/-id$/i, '')
					.split('-')
					.map((w) => w[0].toUpperCase() + w.slice(1))
					.join(' ') + ' ID';
			props.push({
				displayName: label,
				name: 'secondaryId',
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
					actionFields.push(makeActionFieldProperty(field.name, field));
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

// ─── 8. Generic POST body fields ─────────────────────────────────────────────

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
		...generateImageUploadFields(operations, folders),
		...generateQueryParamProperties(operations, folders),
	];
}

// ─── Field property builders ──────────────────────────────────────────────────

function makeActionFieldProperty(fieldName: string, field: BodyField): INodeProperties {
	const localized = isLocalizedField(field);
	const jsonDefault = Array.isArray(field.example) ? '[]' : '{}';

	return {
		displayName: buildDisplayName(fieldName),
		name: fieldName,
		type: localized
			? 'json'
			: field.type === 'number'
				? 'number'
				: field.type === 'boolean'
					? 'boolean'
					: field.type === 'json'
						? 'json'
						: 'string',
		default: localized
			? '{ "en": "" }'
			: field.type === 'number'
				? 0
				: field.type === 'boolean'
					? false
					: field.type === 'json'
						? jsonDefault
						: '',
	};
}

function makeFieldProperty(
	paramName: string,
	field: BodyField,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	const localized = isLocalizedField(field);
	const prop: INodeProperties = {
		displayName: buildDisplayName(field.name),
		name: paramName,
		type: localized
			? 'json'
			: field.type === 'number'
				? 'number'
				: field.type === 'boolean'
					? 'boolean'
					: field.type === 'json'
						? 'json'
						: 'string',
		default: localized
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
