import type { IDataObject } from 'n8n-workflow';

/**
 * Order utility functions for commercetools integration
 */

/**
 * Validates order draft fields
 */
export function validateOrderDraft(orderDraft: IDataObject): void {
	// Basic validation for required fields
	if (orderDraft.customerEmail && !isValidEmail(orderDraft.customerEmail as string)) {
		throw new Error('Invalid customer email format');
	}

	if (orderDraft.locale && !isValidLocale(orderDraft.locale as string)) {
		throw new Error('Invalid locale format. Use format like "en", "en-US", etc.');
	}

	// Validate tax mode if provided
	const validTaxModes = ['Platform', 'External', 'ExternalAmount', 'Disabled'];
	if (orderDraft.taxMode && !validTaxModes.includes(orderDraft.taxMode as string)) {
		throw new Error(`Invalid tax mode. Must be one of: ${validTaxModes.join(', ')}`);
	}

	// Validate inventory mode if provided
	const validInventoryModes = ['None', 'TrackOnly', 'ReserveOnStock'];
	if (orderDraft.inventoryMode && !validInventoryModes.includes(orderDraft.inventoryMode as string)) {
		throw new Error(`Invalid inventory mode. Must be one of: ${validInventoryModes.join(', ')}`);
	}

	// Validate origin if provided
	const validOrigins = ['Customer', 'Merchant', 'Quote'];
	if (orderDraft.origin && !validOrigins.includes(orderDraft.origin as string)) {
		throw new Error(`Invalid origin. Must be one of: ${validOrigins.join(', ')}`);
	}
}

/**
 * Validates order import draft
 */
export function validateOrderImportDraft(importDraft: IDataObject): void {
	// Required fields for order import
	if (!importDraft.totalPrice) {
		throw new Error('totalPrice is required for order import');
	}

	const totalPrice = importDraft.totalPrice as IDataObject;
	if (!totalPrice.centAmount || !totalPrice.currencyCode) {
		throw new Error('totalPrice must have centAmount and currencyCode');
	}

	// Validate currency code format (ISO 4217)
	const currencyRegex = /^[A-Z]{3}$/;
	if (!currencyRegex.test(totalPrice.currencyCode as string)) {
		throw new Error('Invalid currency code format. Must be 3-letter ISO code like "EUR", "USD"');
	}

	// Validate line items if provided
	if (importDraft.lineItems && Array.isArray(importDraft.lineItems)) {
		const lineItems = importDraft.lineItems as IDataObject[];
		lineItems.forEach((item, index) => {
			if (!item.quantity || typeof item.quantity !== 'number') {
				throw new Error(`Line item at index ${index} must have a valid quantity`);
			}
		});
	}

	// Validate custom line items if provided
	if (importDraft.customLineItems && Array.isArray(importDraft.customLineItems)) {
		const customLineItems = importDraft.customLineItems as IDataObject[];
		customLineItems.forEach((item, index) => {
			if (!item.name || !item.quantity || !item.money) {
				throw new Error(`Custom line item at index ${index} must have name, quantity, and money`);
			}
			
			const money = item.money as IDataObject;
			if (!money.centAmount || !money.currencyCode) {
				throw new Error(`Custom line item at index ${index} money must have centAmount and currencyCode`);
			}
		});
	}

	// Validate customer email if provided
	if (importDraft.customerEmail && !isValidEmail(importDraft.customerEmail as string)) {
		throw new Error('Invalid customer email format');
	}
}

/**
 * Transforms order draft from UI format to commercetools format
 */
export function transformOrderDraft(orderDraftUi: IDataObject): IDataObject {
	const orderDraft: IDataObject = {};

	// Handle order draft fields transformation
	if (orderDraftUi.orderDraftFields && Array.isArray(orderDraftUi.orderDraftFields)) {
		const fields = (orderDraftUi.orderDraftFields as IDataObject[])[0] || {};
		
		Object.keys(fields).forEach(key => {
			const value = fields[key];
			if (value !== undefined && value !== null && value !== '') {
				// Transform specific fields that need special handling
				if (key === 'billingAddress' || key === 'shippingAddress') {
					try {
						orderDraft[key] = typeof value === 'string' ? JSON.parse(value as string) : value;
					} catch (error) {
						throw new Error(`Invalid JSON format for ${key}: ${error}`);
					}
				} else if (key === 'itemShippingAddresses' && typeof value === 'string') {
					try {
						orderDraft[key] = JSON.parse(value);
					} catch (error) {
						throw new Error(`Invalid JSON format for ${key}: ${error}`);
					}
				} else if (key === 'custom' && typeof value === 'string') {
					try {
						orderDraft[key] = JSON.parse(value);
					} catch (error) {
						throw new Error(`Invalid JSON format for custom fields: ${error}`);
					}
				} else {
					orderDraft[key] = value;
				}
			}
		});
	}

	validateOrderDraft(orderDraft);
	return orderDraft;
}

/**
 * Helper function to validate email format
 */
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Helper function to validate locale format
 */
function isValidLocale(locale: string): boolean {
	// Basic locale validation (language or language-country)
	const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
	return localeRegex.test(locale);
}

/**
 * Gets order query parameters with validation
 */
export function getOrderQueryParams(additionalFields: IDataObject): IDataObject {
	const qs: IDataObject = {};

	if (additionalFields.where) {
		qs.where = additionalFields.where;
	}

	if (additionalFields.sort) {
		qs.sort = additionalFields.sort;
	}

	if (additionalFields.limit) {
		const limit = Number(additionalFields.limit);
		if (limit < 1 || limit > 500) {
			throw new Error('Limit must be between 1 and 500');
		}
		qs.limit = limit;
	}

	if (additionalFields.offset) {
		const offset = Number(additionalFields.offset);
		if (offset < 0) {
			throw new Error('Offset must be 0 or greater');
		}
		qs.offset = offset;
	}

	if (additionalFields.withTotal !== undefined) {
		qs.withTotal = additionalFields.withTotal;
	}

	if (additionalFields.expand) {
		qs.expand = additionalFields.expand;
	}

	if (additionalFields.priceCurrency) {
		qs.priceCurrency = additionalFields.priceCurrency;
	}

	if (additionalFields.priceCountry) {
		qs.priceCountry = additionalFields.priceCountry;
	}

	if (additionalFields.priceCustomerGroup) {
		qs.priceCustomerGroup = additionalFields.priceCustomerGroup;
	}

	if (additionalFields.priceChannel) {
		qs.priceChannel = additionalFields.priceChannel;
	}

	if (additionalFields.localeProjection) {
		qs.localeProjection = additionalFields.localeProjection;
	}

	return qs;
}

/**
 * Format order response for better readability
 */
export function formatOrderResponse(order: IDataObject): IDataObject {
	// Return the order as-is but could add formatting logic here
	return {
		...order,
		// Add computed fields if needed
		...(order.totalPrice && {
			formattedTotalPrice: formatPrice(order.totalPrice as IDataObject),
		}),
		...(order.createdAt && {
			createdAtFormatted: new Date(order.createdAt as string).toLocaleString(),
		}),
		...(order.lastModifiedAt && {
			lastModifiedAtFormatted: new Date(order.lastModifiedAt as string).toLocaleString(),
		}),
	};
}

/**
 * Format price for display
 */
function formatPrice(price: IDataObject): string {
	const amount = price.centAmount as number;
	const currencyCode = price.currencyCode as string;
	const fractionDigits = price.fractionDigits as number || 2;
	
	const value = amount / Math.pow(10, fractionDigits);
	return `${value.toFixed(fractionDigits)} ${currencyCode}`;
}