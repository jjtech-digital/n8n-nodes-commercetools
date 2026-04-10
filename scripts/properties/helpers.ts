/**
 * scripts/properties/helpers.ts
 *
 * Shared constants and field-property builders used by all property generators.
 *
 * READ-5: resolveN8nType + resolveDefault replace duplicated nested ternary chains.
 * READ-6: placeholderToLabel replaces duplicated label-construction logic.
 * READ-7: Dead 'Taxe' entry removed from SINGULAR_MAP.
 * READ-8: REQUIRED_QUERY_PARAMS moved here alongside all other constants.
 * GEN-BUG-2: resolveDefault correctly checks field.example to pick '[]' vs '{}'.
 */

import type { INodeProperties } from 'n8n-workflow';
import type { BodyField } from '../collection/types';
import { slugify } from '../collection/helpers';

// ─── Display helpers ──────────────────────────────────────────────────────────

export function humanize(str: string): string {
	return str
		.replace(/([A-Z])/g, ' $1')
		.replace(/[_-]+/g, ' ')
		.trim()
		.replace(/^\w/, (c) => c.toUpperCase());
}

export function buildDisplayName(dotPath: string): string {
	return dotPath.split('.').map(humanize).join(' › ');
}

// ─── Locale detection ─────────────────────────────────────────────────────────

export function isLocalizedField(field: BodyField): boolean {
	if (field.type !== 'json' && field.type !== 'string') return false;
	const ex = field.example;
	if (!ex || typeof ex !== 'object' || Array.isArray(ex)) return false;
	const keys = Object.keys(ex as Record<string, unknown>);
	if (keys.length === 0) return false;
	return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
}

// ─── Type + default resolution (READ-5, GEN-BUG-2) ───────────────────────────

export function resolveN8nType(
	field: BodyField,
	localized: boolean,
): INodeProperties['type'] {
	if (localized) return 'json';
	if (field.type === 'number') return 'number';
	if (field.type === 'boolean') return 'boolean';
	if (field.type === 'json') return 'json';
	return 'string';
}

export function resolveDefault(
	field: BodyField,
	localized: boolean,
): string | number | boolean {
	if (localized) return '{ "en": "" }';
	if (field.type === 'number') return 0;
	if (field.type === 'boolean') return false;
	// GEN-BUG-2: distinguish object vs array defaults for JSON fields
	if (field.type === 'json') return Array.isArray(field.example) ? '[]' : '{}';
	return '';
}

// ─── Label helpers (READ-6) ───────────────────────────────────────────────────

export function placeholderToLabel(placeholder: string, suffix: 'ID' | 'Key'): string {
	const stripped = placeholder.replace(new RegExp(`-${suffix.toLowerCase()}$`, 'i'), '');
	return (
		stripped
			.split('-')
			.map((w) => w[0].toUpperCase() + w.slice(1))
			.join(' ') +
		' ' +
		suffix
	);
}

// ─── Field property builders ──────────────────────────────────────────────────

export function makeActionFieldProperty(fieldName: string, field: BodyField): INodeProperties {
	const localized = isLocalizedField(field);
	return {
		displayName: buildDisplayName(fieldName),
		name: fieldName,
		type: resolveN8nType(field, localized),
		default: resolveDefault(field, localized),
	};
}

export function makeFieldProperty(
	paramName: string,
	field: BodyField,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	const localized = isLocalizedField(field);
	const prop: INodeProperties = {
		displayName: buildDisplayName(field.name),
		name: paramName,
		type: resolveN8nType(field, localized),
		default: resolveDefault(field, localized),
		...(field.required ? { required: true } : {}),
		...(field.name === 'password' || field.name === 'currentPassword'
			? { typeOptions: { password: true } }
			: {}),
	};
	if (displayOptions) prop.displayOptions = displayOptions;
	return prop;
}

// ─── Singular map ─────────────────────────────────────────────────────────────

// READ-7: Dead 'Taxe' entry removed (not a valid English plural, never matched).

export const SINGULAR_MAP: Record<string, string> = {
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
	'As-associate/In-business-unit/Approval-rules': 'Approval Rule',
	'As-associate/In-business-unit/Approval-flows': 'Approval Flow',
	'As-associate/In-business-unit/Carts': 'Associate Cart',
	'As-associate/In-business-unit/Orders': 'Associate Order',
	'As-associate/In-business-unit/Quotes': 'Associate Quote',
	'As-associate/In-business-unit/Quote-requests': 'Associate Quote Request',
	'As-associate/In-business-unit/Shopping-lists': 'Associate Shopping List',
	'As-associate/In-business-unit/Business-units': 'Associate Business Unit',
	'Standalone-prices': 'Standalone Price',
	'Product-tailoring': 'Product Tailoring',
	'Customer-groups': 'Customer Group',
	'Product-selections': 'Product Selection',
	'Cart-discounts': 'Cart Discount',
	'Discount-codes': 'Discount Code',
	'In-store/Business-units': 'Store Business Unit',
	'In-store/Cart-discounts': 'Store Cart Discount',
	'In-store/Carts': 'Store Cart',
	'In-store/Customers': 'Store Customer',
	'In-store/Orders': 'Store Order',
	'In-store/Quote-requests': 'Store Quote Request',
	'In-store/Quotes': 'Store Quote',
	'In-store/Shopping-lists': 'Store Shopping List',
	'In-store/Staged-quotes': 'Store Staged Quote',
	'In-store/Product-projections': 'Store Product Projection',
	'In-store/Shipping-methods': 'Store Shipping Method',
	'In-store/Products': 'Store Product',
};

export function toSingular(folderName: string): string {
	return SINGULAR_MAP[folderName] ?? folderName.replace(/ies$/, 'y').replace(/(?<=[^s])s$/, '');
}

// READ-8: REQUIRED_QUERY_PARAMS moved here alongside all other constants.
export const REQUIRED_QUERY_PARAMS = new Set(['cartId', 'orderEditId', 'country']);

// Re-export slugify for convenience within the properties/ subtree
export { slugify };
