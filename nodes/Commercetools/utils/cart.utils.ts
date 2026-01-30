import type { IDataObject } from 'n8n-workflow';

/**
 * Utility functions for cart operations
 */

/**
 * Validates if a cart draft has required fields
 */
export function validateCartDraft(cartDraft: IDataObject): boolean {
	if (!cartDraft.currency && !cartDraft.customerId) {
		return false;
	}
	return true;
}

/**
 * Formats line item for cart operations
 */
export function formatLineItem(productId: string, variantId: number, quantity: number): IDataObject {
	return {
		productId,
		variant: { id: variantId },
		quantity,
	};
}

/**
 * Formats address for cart operations
 */
export function formatAddress(address: IDataObject): IDataObject {
	return {
		country: address.country || 'US',
		firstName: address.firstName || '',
		lastName: address.lastName || '',
		streetName: address.streetName || '',
		city: address.city || '',
		postalCode: address.postalCode || '',
		...address,
	};
}

/**
 * Creates a basic cart draft structure
 */
export function createCartDraft(currency: string, customerId?: string): IDataObject {
	const draft: IDataObject = {
		currency,
	};

	if (customerId) {
		draft.customerId = customerId;
	}

	return draft;
}

/**
 * Formats discount code action
 */
export function formatDiscountCodeAction(code: string): IDataObject {
	return {
		action: 'addDiscountCode',
		code,
	};
}

/**
 * Formats line item action for adding items to cart
 */
export function formatAddLineItemAction(productId: string, variantId: number, quantity: number): IDataObject {
	return {
		action: 'addLineItem',
		productId,
		variantId,
		quantity,
	};
}

/**
 * Formats line item action for removing items from cart
 */
export function formatRemoveLineItemAction(lineItemId: string): IDataObject {
	return {
		action: 'removeLineItem',
		lineItemId,
	};
}

/**
 * Formats line item quantity change action
 */
export function formatChangeLineItemQuantityAction(lineItemId: string, quantity: number): IDataObject {
	return {
		action: 'changeLineItemQuantity',
		lineItemId,
		quantity,
	};
}