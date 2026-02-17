import type { IDataObject } from 'n8n-workflow';

/**
 * Order utility functions for commercetools integration
 */

// ─── Action Handlers ──────────────────────────────────────────────────────────

export const handleSetOrderNumber = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setOrderNumber') return action;

	return {
		action: 'setOrderNumber',
		...(action.orderNumber ? { orderNumber: action.orderNumber } : {}),
	};
};

export const handleSetPurchaseOrderNumber = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setPurchaseOrderNumber') return action;

	return {
		action: 'setPurchaseOrderNumber',
		// If empty → omit so API removes any existing value
		...(action.purchaseOrderNumber ? { purchaseOrderNumber: action.purchaseOrderNumber } : {}),
	};
};

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateOrderDraft(orderDraft: IDataObject): void {
	if (orderDraft.customerEmail && !isValidEmail(orderDraft.customerEmail as string)) {
		throw new Error('Invalid customer email format');
	}

	if (orderDraft.locale && !isValidLocale(orderDraft.locale as string)) {
		throw new Error('Invalid locale format. Use format like "en", "en-US", etc.');
	}

	const validTaxModes = ['Platform', 'External', 'ExternalAmount', 'Disabled'];
	if (orderDraft.taxMode && !validTaxModes.includes(orderDraft.taxMode as string)) {
		throw new Error(`Invalid tax mode. Must be one of: ${validTaxModes.join(', ')}`);
	}

	const validInventoryModes = ['None', 'TrackOnly', 'ReserveOnStock'];
	if (orderDraft.inventoryMode && !validInventoryModes.includes(orderDraft.inventoryMode as string)) {
		throw new Error(`Invalid inventory mode. Must be one of: ${validInventoryModes.join(', ')}`);
	}

	const validOrigins = ['Customer', 'Merchant', 'Quote'];
	if (orderDraft.origin && !validOrigins.includes(orderDraft.origin as string)) {
		throw new Error(`Invalid origin. Must be one of: ${validOrigins.join(', ')}`);
	}
}

export function validateOrderImportDraft(importDraft: IDataObject): void {
	if (!importDraft.totalPrice) {
		throw new Error('totalPrice is required for order import');
	}

	const totalPrice = importDraft.totalPrice as IDataObject;
	if (!totalPrice.centAmount || !totalPrice.currencyCode) {
		throw new Error('totalPrice must have centAmount and currencyCode');
	}

	const currencyRegex = /^[A-Z]{3}$/;
	if (!currencyRegex.test(totalPrice.currencyCode as string)) {
		throw new Error('Invalid currency code format. Must be 3-letter ISO code like "EUR", "USD"');
	}

	if (importDraft.lineItems && Array.isArray(importDraft.lineItems)) {
		(importDraft.lineItems as IDataObject[]).forEach((item, index) => {
			if (!item.quantity || typeof item.quantity !== 'number') {
				throw new Error(`Line item at index ${index} must have a valid quantity`);
			}
		});
	}

	if (importDraft.customLineItems && Array.isArray(importDraft.customLineItems)) {
		(importDraft.customLineItems as IDataObject[]).forEach((item, index) => {
			if (!item.name || !item.quantity || !item.money) {
				throw new Error(`Custom line item at index ${index} must have name, quantity, and money`);
			}
			const money = item.money as IDataObject;
			if (!money.centAmount || !money.currencyCode) {
				throw new Error(`Custom line item at index ${index} money must have centAmount and currencyCode`);
			}
		});
	}

	if (importDraft.customerEmail && !isValidEmail(importDraft.customerEmail as string)) {
		throw new Error('Invalid customer email format');
	}
}

// ─── Transformers ─────────────────────────────────────────────────────────────

export function transformOrderDraft(orderDraftUi: IDataObject): IDataObject {
	const orderDraft: IDataObject = {};

	if (orderDraftUi.orderDraftFields && Array.isArray(orderDraftUi.orderDraftFields)) {
		const fields = (orderDraftUi.orderDraftFields as IDataObject[])[0] ?? {};
		const jsonFields = new Set(['billingAddress', 'shippingAddress', 'itemShippingAddresses', 'custom']);

		for (const [key, value] of Object.entries(fields)) {
			if (value === undefined || value === null || value === '') continue;

			if (jsonFields.has(key) && typeof value === 'string') {
				try {
					orderDraft[key] = JSON.parse(value);
				} catch {
					throw new Error(`Invalid JSON format for ${key}`);
				}
			} else {
				orderDraft[key] = value;
			}
		}
	}

	validateOrderDraft(orderDraft);
	return orderDraft;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export function getOrderQueryParams(additionalFields: IDataObject): IDataObject {
	const qs: IDataObject = {};

	if (additionalFields.where)              qs.where              = additionalFields.where;
	if (additionalFields.sort)               qs.sort               = additionalFields.sort;
	if (additionalFields.expand)             qs.expand             = additionalFields.expand;
	if (additionalFields.priceCurrency)      qs.priceCurrency      = additionalFields.priceCurrency;
	if (additionalFields.priceCountry)       qs.priceCountry       = additionalFields.priceCountry;
	if (additionalFields.priceCustomerGroup) qs.priceCustomerGroup = additionalFields.priceCustomerGroup;
	if (additionalFields.priceChannel)       qs.priceChannel       = additionalFields.priceChannel;
	if (additionalFields.localeProjection)   qs.localeProjection   = additionalFields.localeProjection;

	if (additionalFields.withTotal !== undefined) qs.withTotal = additionalFields.withTotal;

	if (additionalFields.limit !== undefined) {
		const limit = Number(additionalFields.limit);
		if (limit < 1 || limit > 500) throw new Error('Limit must be between 1 and 500');
		qs.limit = limit;
	}

	if (additionalFields.offset !== undefined) {
		const offset = Number(additionalFields.offset);
		if (offset < 0) throw new Error('Offset must be 0 or greater');
		qs.offset = offset;
	}

	return qs;
}

// ─── Response Formatting ──────────────────────────────────────────────────────

export function formatOrderResponse(order: IDataObject): IDataObject {
	return {
		...order,
		...(order.totalPrice && { formattedTotalPrice: formatPrice(order.totalPrice as IDataObject) }),
		...(order.createdAt && { createdAtFormatted: new Date(order.createdAt as string).toLocaleString() }),
		...(order.lastModifiedAt && { lastModifiedAtFormatted: new Date(order.lastModifiedAt as string).toLocaleString() }),
	};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: IDataObject): string {
	const amount = price.centAmount as number;
	const currencyCode = price.currencyCode as string;
	const fractionDigits = (price.fractionDigits as number) ?? 2;
	return `${(amount / Math.pow(10, fractionDigits)).toFixed(fractionDigits)} ${currencyCode}`;
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidLocale(locale: string): boolean {
	return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
}

export const handleSetBusinessUnit = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setBusinessUnit') return action;

	const typeId = 'business-unit';

	// Read both fields regardless of which dropdown is selected.
	// n8n keeps hidden field values in the payload, so we check both
	// and use whichever is non-empty — identifyBy is only a UI hint.
	const key = (action.businessUnitKey as string | undefined)?.trim() || undefined;
	const id = (action.businessUnitId as string | undefined)?.trim() || undefined;
	const identifyBy = (action.businessUnitIdentifyBy as string | undefined) ?? 'key';

	let businessUnit: IDataObject | undefined;

	if (identifyBy === 'id' && id) {
		businessUnit = { id, typeId };
	} else if (identifyBy === 'key' && key) {
		businessUnit = { key, typeId };
	} else if (id) {
		// identifyBy may be stale — trust the filled field
		businessUnit = { id, typeId };
	} else if (key) {
		businessUnit = { key, typeId };
	}

	return {
		action: 'setBusinessUnit',
		...(businessUnit ? { businessUnit } : {}),
	};
};