import type { IDataObject } from 'n8n-workflow';
import { isUuid } from './common.utils';

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

/**
 * Helper function to set line item identifier based on selection
 */
function setLineItemIdentifier(result: IDataObject, action: IDataObject): void {
	// Use the selected field based on lineItemSelection
	if (action.lineItemSelection === 'key' && action.lineItemKey) {
		result.lineItemKey = action.lineItemKey;
	} else if (action.lineItemSelection === 'id' && action.lineItemId) {
		result.lineItemId = action.lineItemId;
	} else {
		// Fallback: try both for backward compatibility
		if (action.lineItemId) result.lineItemId = action.lineItemId;
		if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
	}
}

/**
 * Handle cart update actions transformation
 */
export function handleCartActions(action: IDataObject): IDataObject {
	const actionType = action.action as string;
	const result: IDataObject = { action: actionType };

	switch (actionType) {
		// Simple actions with no additional fields
		case 'freezeCart':
		case 'unfreezeCart':
		case 'recalculate':
		case 'lockCart':
		case 'unlockCart':
			return result;

		// Address-based actions
		case 'setBillingAddress':
		case 'setShippingAddress':
		case 'addItemShippingAddress':
		case 'updateItemShippingAddress':
			if (action.address) {
				result.address = formatAddress(action.address as IDataObject);
			}
			break;

		// String field actions
		case 'setAnonymousId':
			if (action.anonymousId) result.anonymousId = action.anonymousId;
			break;
		case 'setCustomerEmail':
			if (action.customerEmail) result.email = action.customerEmail;
			break;
		case 'setCustomerId':
			if (action.customerId) result.customerId = action.customerId;
			break;
		case 'setKey':
			if (action.key) result.key = action.key;
			break;
		case 'setLocale':
			if (action.locale) result.locale = action.locale;
			break;
		case 'setCountry':
			if (action.country) result.country = action.country;
			break;
		case 'setPurchaseOrderNumber':
			if (action.purchaseOrderNumber) result.purchaseOrderNumber = action.purchaseOrderNumber;
			break;

		// Reference-based actions
		case 'setCustomerGroup':
			if (action.customerGroupId) {
				result.customerGroup = { typeId: 'customer-group', id: action.customerGroupId };
			} else if (action.customerGroupKey) {
				result.customerGroup = { typeId: 'customer-group', key: action.customerGroupKey };
			}
			break;

		case 'setBusinessUnit':
			if (action.businessUnitId) {
				result.businessUnit = { typeId: 'business-unit', id: action.businessUnitId };
			} else if (action.businessUnitKey) {
				result.businessUnit = { typeId: 'business-unit', key: action.businessUnitKey };
			}
			break;

		case 'addShippingMethod':
		case 'setShippingMethod':
		case 'removeShippingMethod':
			if (action.shippingMethodId) {
				result.shippingMethod = { typeId: 'shipping-method', id: action.shippingMethodId };
			} else if (action.shippingMethodKey) {
				result.shippingMethod = { typeId: 'shipping-method', key: action.shippingMethodKey };
			}
			break;

		// Custom type and field actions
		case 'setCustomType':
			if (action.customTypeId || action.customTypeKey) {
				result.type = action.customTypeId 
					? { typeId: 'type', id: action.customTypeId }
					: { typeId: 'type', key: action.customTypeKey };
				if (action.customFields) result.fields = action.customFields;
			}
			break;

		case 'setCustomField':
			if (action.customFieldName && action.customFieldValue !== undefined) {
				result.name = action.customFieldName;
				result.value = action.customFieldValue;
			}
			break;

		// Discount actions
		case 'addDiscountCode':
		case 'removeDiscountCode':
			if (action.discountCode) result.code = action.discountCode;
			break;

		// Payment actions
		case 'addPayment':
		case 'removePayment':
			if (action.paymentId) {
				result.payment = { typeId: 'payment', id: action.paymentId };
			} else if (action.paymentKey) {
				result.payment = { typeId: 'payment', key: action.paymentKey };
			}
			break;

		// Tax mode actions
		case 'changeTaxMode':
			if (action.taxMode) result.taxMode = action.taxMode;
			break;

		case 'changeTaxCalculationMode':
			if (action.taxCalculationMode) result.taxCalculationMode = action.taxCalculationMode;
			break;

		case 'changeTaxRoundingMode':
		case 'changePriceRoundingMode':
			if (action.roundingMode) result.roundingMode = action.roundingMode;
			break;

		// Line Item actions
		case 'changeLineItemQuantity':
			setLineItemIdentifier(result, action);
			if (action.quantity !== undefined) result.quantity = Number(action.quantity);
			
			if (action.externalPrice && typeof action.externalPrice === 'object') {
				const externalPrice = action.externalPrice as IDataObject;
				if (externalPrice.money && typeof externalPrice.money === 'object') {
					const money = externalPrice.money as IDataObject;
					result.externalPrice = {
						type: 'centPrecision',
						currencyCode: (money.currencyCode as string) || 'USD',
						centAmount: Number(money.centAmount)
					};
				}
			}
			
			if (action.externalTotalPrice && typeof action.externalTotalPrice === 'object') {
				const externalTotalPrice = action.externalTotalPrice as IDataObject;
				if (externalTotalPrice.totalPrice && typeof externalTotalPrice.totalPrice === 'object') {
					const totalPrice = externalTotalPrice.totalPrice as IDataObject;
					result.externalTotalPrice = {} as IDataObject;
					
					if (totalPrice.price && typeof totalPrice.price === 'object') {
						const priceObj = totalPrice.price as IDataObject;
						if (priceObj.money && typeof priceObj.money === 'object') {
							const priceMoney = priceObj.money as IDataObject;
							(result.externalTotalPrice as IDataObject).price = {
								type: 'centPrecision',
								currencyCode: (priceMoney.currencyCode as string) || 'USD',
								centAmount: Number(priceMoney.centAmount)
							};
						}
					}
					
					if (totalPrice.totalPrice && typeof totalPrice.totalPrice === 'object') {
						const totalPriceObj = totalPrice.totalPrice as IDataObject;
						if (totalPriceObj.money && typeof totalPriceObj.money === 'object') {
							const totalMoney = totalPriceObj.money as IDataObject;
							(result.externalTotalPrice as IDataObject).totalPrice = {
								type: 'centPrecision',
								currencyCode: (totalMoney.currencyCode as string) || 'USD',
								centAmount: Number(totalMoney.centAmount)
							};
						}
					}
				}
			}
			break;

		case 'setLineItemTaxRate':
			setLineItemIdentifier(result, action);
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			
			if (action.externalTaxRate && typeof action.externalTaxRate === 'object') {
				const externalTaxRate = action.externalTaxRate as IDataObject;
				if (externalTaxRate.taxRate && typeof externalTaxRate.taxRate === 'object') {
					const taxRate = externalTaxRate.taxRate as IDataObject;
					result.externalTaxRate = {
						name: (taxRate.name as string) || '',
						amount: Number(taxRate.amount || 0),
						country: (taxRate.country as string) || 'DE'
					} as IDataObject;
					if (taxRate.state && typeof taxRate.state === 'string') {
						(result.externalTaxRate as IDataObject).state = taxRate.state;
					}
				}
			}
			break;

		case 'setShippingMethodTaxRate':
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			
			if (action.externalTaxRate && typeof action.externalTaxRate === 'object') {
				const externalTaxRate = action.externalTaxRate as IDataObject;
				if (externalTaxRate.taxRate && typeof externalTaxRate.taxRate === 'object') {
					const taxRate = externalTaxRate.taxRate as IDataObject;
					result.externalTaxRate = {
						name: (taxRate.name as string) || '',
						amount: Number(taxRate.amount || 0),
						country: (taxRate.country as string) || 'DE'
					} as IDataObject;
					if (taxRate.state && typeof taxRate.state === 'string') {
						(result.externalTaxRate as IDataObject).state = taxRate.state;
					}
				}
			}
			break;

		case 'setLineItemPrice':
			setLineItemIdentifier(result, action);
			
			if (action.externalPrice && typeof action.externalPrice === 'object') {
				const externalPrice = action.externalPrice as IDataObject;
				if (externalPrice.money && typeof externalPrice.money === 'object') {
					const money = externalPrice.money as IDataObject;
					result.externalPrice = {
						type: 'centPrecision',
						currencyCode: (money.currencyCode as string) || 'EUR',
						centAmount: Number(money.centAmount)
					};
				}
			}
			break;

		case 'setLineItemTaxAmount':
			setLineItemIdentifier(result, action);
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			
			if (action.externalTaxAmount && typeof action.externalTaxAmount === 'object') {
				const externalTaxAmount = action.externalTaxAmount as IDataObject;
				if (externalTaxAmount.taxAmount && typeof externalTaxAmount.taxAmount === 'object') {
					const taxAmount = externalTaxAmount.taxAmount as IDataObject;
					result.externalTaxAmount = {} as IDataObject;
					
					// Handle totalGross
					if (taxAmount.totalGross && typeof taxAmount.totalGross === 'object') {
						const totalGross = taxAmount.totalGross as IDataObject;
						if (totalGross.money && typeof totalGross.money === 'object') {
							const money = totalGross.money as IDataObject;
							(result.externalTaxAmount as IDataObject).totalGross = {
								type: 'centPrecision',
								currencyCode: (money.currencyCode as string) || 'EUR',
								centAmount: Number(money.centAmount)
							};
						}
					}
					
					// Handle taxRate
					if (taxAmount.taxRate && typeof taxAmount.taxRate === 'object') {
						const taxRateObj = taxAmount.taxRate as IDataObject;
						if (taxRateObj.taxRate && typeof taxRateObj.taxRate === 'object') {
							const taxRate = taxRateObj.taxRate as IDataObject;
							(result.externalTaxAmount as IDataObject).taxRate = {
								name: (taxRate.name as string) || '',
								amount: Number(taxRate.amount || 0),
								country: (taxRate.country as string) || 'DE'
							} as IDataObject;
						}
					}
				}
			}
			break;

		case 'setShippingMethodTaxAmount':
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			
			if (action.externalTaxAmount && typeof action.externalTaxAmount === 'object') {
				const externalTaxAmount = action.externalTaxAmount as IDataObject;
				if (externalTaxAmount.taxAmount && typeof externalTaxAmount.taxAmount === 'object') {
					const taxAmount = externalTaxAmount.taxAmount as IDataObject;
					result.externalTaxAmount = {} as IDataObject;
					
					if (taxAmount.totalGross && typeof taxAmount.totalGross === 'object') {
						const totalGross = taxAmount.totalGross as IDataObject;
						if (totalGross.money && typeof totalGross.money === 'object') {
							const money = totalGross.money as IDataObject;
							(result.externalTaxAmount as IDataObject).totalGross = {
								type: 'centPrecision',
								currencyCode: (money.currencyCode as string) || 'EUR',
								centAmount: Number(money.centAmount)
							};
						}
					}
					
					if (taxAmount.taxRate && typeof taxAmount.taxRate === 'object') {
						const taxRateObj = taxAmount.taxRate as IDataObject;
						if (taxRateObj.taxRate && typeof taxRateObj.taxRate === 'object') {
							const taxRate = taxRateObj.taxRate as IDataObject;
							(result.externalTaxAmount as IDataObject).taxRate = {
								name: (taxRate.name as string) || '',
								amount: Number(taxRate.amount || 0),
								country: (taxRate.country as string) || 'DE'
							} as IDataObject;
						}
					}
				}
			}
			break;

		case 'setLineItemDistributionChannel':
			setLineItemIdentifier(result, action);
			
			if (action.distributionChannelId) {
				result.distributionChannel = {
					typeId: 'channel',
					id: action.distributionChannelId
				};
			}
			break;

		case 'setLineItemTotalPrice':
			setLineItemIdentifier(result, action);
			
			if (action.externalTotalPrice && typeof action.externalTotalPrice === 'object') {
				const externalTotalPrice = action.externalTotalPrice as IDataObject;
				if (externalTotalPrice.totalPrice && typeof externalTotalPrice.totalPrice === 'object') {
					const totalPriceData = externalTotalPrice.totalPrice as IDataObject;
					result.externalTotalPrice = {} as IDataObject;
					
					// Handle price
					if (totalPriceData.price && typeof totalPriceData.price === 'object') {
						const priceObj = totalPriceData.price as IDataObject;
						if (priceObj.money && typeof priceObj.money === 'object') {
							const priceMoney = priceObj.money as IDataObject;
							(result.externalTotalPrice as IDataObject).price = {
								type: 'centPrecision',
								currencyCode: (priceMoney.currencyCode as string) || 'EUR',
								centAmount: Number(priceMoney.centAmount)
							};
						}
					}
					
					// Handle totalPrice
					if (totalPriceData.totalPrice && typeof totalPriceData.totalPrice === 'object') {
						const totalPriceObj = totalPriceData.totalPrice as IDataObject;
						if (totalPriceObj.money && typeof totalPriceObj.money === 'object') {
							const totalMoney = totalPriceObj.money as IDataObject;
							(result.externalTotalPrice as IDataObject).totalPrice = {
								type: 'centPrecision',
								currencyCode: (totalMoney.currencyCode as string) || 'EUR',
								centAmount: Number(totalMoney.centAmount)
							};
						}
					}
				}
			}
			break;

		case 'setLineItemSupplyChannel':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			
			if (action.supplyChannelId) {
				result.supplyChannel = {
					typeId: 'channel',
					id: action.supplyChannelId
				};
			}
			break;

		case 'setLineItemShippingDetails':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			
			if (action.shippingDetails) {
				try {
					result.shippingDetails = typeof action.shippingDetails === 'string' 
						? JSON.parse(action.shippingDetails) 
						: action.shippingDetails;
				} catch {
					result.shippingDetails = action.shippingDetails;
				}
			}
			break;

		case 'applyDeltaToLineItemShippingDetailsTargets':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			
			if (action.targetsDelta) {
				try {
					result.targetsDelta = typeof action.targetsDelta === 'string' 
						? JSON.parse(action.targetsDelta) 
						: action.targetsDelta;
				} catch {
					// If parsing fails, treat as already parsed or return empty array
					result.targetsDelta = [];
				}
			}
			break;

		case 'applyDeltaToCustomLineItemShippingDetailsTargets':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			
			if (action.targetsDelta) {
				try {
					result.targetsDelta = typeof action.targetsDelta === 'string'
						? JSON.parse(action.targetsDelta)
						: action.targetsDelta;
				} catch {
					result.targetsDelta = [];
				}
			}
			break;

		case 'setLineItemRecurrenceInfo':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			
			if (action.recurrenceInfo) {
				try {
					result.recurrenceInfo = typeof action.recurrenceInfo === 'string' 
						? JSON.parse(action.recurrenceInfo) 
						: action.recurrenceInfo;
				} catch {
					result.recurrenceInfo = action.recurrenceInfo;
				}
			}
			break;

		case 'setCustomLineItemRecurrenceInfo':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			
			if (action.recurrenceInfo) {
				try {
					result.recurrenceInfo = typeof action.recurrenceInfo === 'string'
						? JSON.parse(action.recurrenceInfo)
						: action.recurrenceInfo;
				} catch {
					result.recurrenceInfo = action.recurrenceInfo;
				}
			}
			break;

		case 'setLineItemCustomField':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			if (action.customFieldName) result.name = action.customFieldName;
			
			if (action.customFieldValue !== undefined) {
				try {
					result.value = typeof action.customFieldValue === 'string' 
						? JSON.parse(action.customFieldValue) 
						: action.customFieldValue;
				} catch {
					result.value = action.customFieldValue;
				}
			}
			break;

		case 'setBillingAddressCustomField':
		case 'setShippingAddressCustomField':
			if (action.customFieldName) result.name = action.customFieldName;
			
			if (action.customFieldValue !== undefined) {
				try {
					result.value = typeof action.customFieldValue === 'string'
						? JSON.parse(action.customFieldValue)
						: action.customFieldValue;
				} catch {
					result.value = action.customFieldValue;
				}
			}
			break;

		case 'setShippingCustomField':
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			if (action.customFieldName) result.name = action.customFieldName;
			
			if (action.customFieldValue !== undefined) {
				try {
					result.value = typeof action.customFieldValue === 'string'
						? JSON.parse(action.customFieldValue)
						: action.customFieldValue;
				} catch {
					result.value = action.customFieldValue;
				}
			}
			break;

		case 'setItemShippingAddressCustomField':
			if (action.addressKey) result.addressKey = action.addressKey;
			if (action.customFieldName) result.name = action.customFieldName;
			
			if (action.customFieldValue !== undefined) {
				try {
					result.value = typeof action.customFieldValue === 'string'
						? JSON.parse(action.customFieldValue)
						: action.customFieldValue;
				} catch {
					result.value = action.customFieldValue;
				}
			}
			break;

		case 'setCustomLineItemCustomField':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			if (action.customFieldName) result.name = action.customFieldName;
			
			if (action.customFieldValue !== undefined) {
				try {
					result.value = typeof action.customFieldValue === 'string'
						? JSON.parse(action.customFieldValue)
						: action.customFieldValue;
				} catch {
					result.value = action.customFieldValue;
				}
			}
			break;

		case 'setLineItemCustomType':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			
			if (action.customTypeId || action.customTypeKey) {
				result.type = action.customTypeId
					? { typeId: 'type', id: action.customTypeId }
					: { typeId: 'type', key: action.customTypeKey };
			}
			
			if (action.customFields) {
				try {
					result.fields = typeof action.customFields === 'string' 
						? JSON.parse(action.customFields) 
						: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setBillingAddressCustomType':
		case 'setShippingAddressCustomType':
			if (action.customTypeId || action.customTypeKey || action.addressCustomTypeId || action.addressCustomTypeKey) {
				const typeId = action.addressCustomTypeId ?? action.customTypeId;
				const typeKey = action.addressCustomTypeKey ?? action.customTypeKey;
				result.type = typeId
					? { typeId: 'type', id: typeId }
					: { typeId: 'type', key: typeKey };
			}
			
			if (action.customFields) {
				try {
					result.fields = typeof action.customFields === 'string'
						? JSON.parse(action.customFields)
						: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setShippingCustomType':
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			
			if (action.customTypeId || action.customTypeKey || action.shippingCustomTypeId || action.shippingCustomTypeKey) {
				const typeId = action.shippingCustomTypeId ?? action.customTypeId;
				const typeKey = action.shippingCustomTypeKey ?? action.customTypeKey;
				result.type = typeId
					? { typeId: 'type', id: typeId }
					: { typeId: 'type', key: typeKey };
			}
			
			if (action.customFields) {
				try {
					result.fields = typeof action.customFields === 'string'
						? JSON.parse(action.customFields)
						: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setItemShippingAddressCustomType':
			if (action.addressKey) result.addressKey = action.addressKey;
			
			if (action.customTypeId || action.customTypeKey || action.addressCustomTypeId || action.addressCustomTypeKey) {
				const typeId = action.addressCustomTypeId ?? action.customTypeId;
				const typeKey = action.addressCustomTypeKey ?? action.customTypeKey;
				result.type = typeId
					? { typeId: 'type', id: typeId }
					: { typeId: 'type', key: typeKey };
			}
			
			if (action.customFields) {
				try {
					result.fields = typeof action.customFields === 'string'
						? JSON.parse(action.customFields)
						: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setCustomLineItemCustomType':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			
			if (
				action.customTypeId ||
				action.customTypeKey ||
				action.customLineItemCustomTypeId ||
				action.customLineItemCustomTypeKey
			) {
				const typeId = action.customLineItemCustomTypeId ?? action.customTypeId;
				const typeKey = action.customLineItemCustomTypeKey ?? action.customTypeKey;
				result.type = typeId
					? { typeId: 'type', id: typeId }
					: { typeId: 'type', key: typeKey };
			}
			
			if (action.customFields) {
				try {
					result.fields = typeof action.customFields === 'string'
						? JSON.parse(action.customFields)
						: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setLineItemInventoryMode':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;
			if (action.inventoryMode) result.inventoryMode = action.inventoryMode;
			break;

		// Numeric actions
		case 'setDeleteDaysAfterLastModification':
			if (action.deleteDaysAfterLastModification !== undefined) {
				result.deleteDaysAfterLastModification = Number(action.deleteDaysAfterLastModification);
			}
			break;

		case 'setCartTotalTax':
			if (action.cartTotalTax !== undefined) {
				result.externalTotalGross = {
					type: 'centPrecision',
					currencyCode: action.currency || 'USD',
					centAmount: Number(action.cartTotalTax) * 100
				};
			}
			break;

		// Custom shipping method
		case 'setCustomShippingMethod':
		case 'addCustomShippingMethod':
			if (action.shippingMethodName) {
				result.shippingMethodName = action.shippingMethodName;
				if (action.shippingRatePrice && action.currency) {
					result.shippingRate = {
						price: {
							type: 'centPrecision',
							currencyCode: action.currency,
							centAmount: Number(action.shippingRatePrice) * 100
						}
					};
				}
				if (action.taxCategoryId) {
					result.taxCategory = { typeId: 'tax-category', id: action.taxCategoryId };
				} else if (action.taxCategoryKey) {
					result.taxCategory = { typeId: 'tax-category', key: action.taxCategoryKey };
				}
			}
			break;

		// Custom line item actions
		case 'addCustomLineItem':
			if (action.customLineItemName) {
				if (typeof action.customLineItemName === 'string') {
					result.name = { en: action.customLineItemName };
				} else if (typeof action.customLineItemName === 'object') {
					const localizedName = (action.customLineItemName as IDataObject).localizedName as IDataObject | undefined;
					if (localizedName && typeof localizedName === 'object') {
						result.name = {};
						if (localizedName.en) (result.name as IDataObject).en = localizedName.en;
						if (localizedName.de) (result.name as IDataObject).de = localizedName.de;
					} else {
						result.name = action.customLineItemName as IDataObject;
					}
				}
			}
			if (action.customLineItemQuantity) result.quantity = Number(action.customLineItemQuantity);
			if (action.customLineItemMoney && (action.customLineItemMoney as IDataObject).money) {
				const money = (action.customLineItemMoney as IDataObject).money as IDataObject;
				result.money = {
					type: 'centPrecision',
					currencyCode: money.currencyCode,
					centAmount: Number(money.centAmount)
				};
			}
			if (action.customLineItemSlug) result.slug = action.customLineItemSlug;
			if (action.customLineItemKey) result.key = action.customLineItemKey;
			if (action.taxCategory && typeof action.taxCategory === 'string') {
				result.taxCategory = isUuid(action.taxCategory)
					? { typeId: 'tax-category', id: action.taxCategory }
					: { typeId: 'tax-category', key: action.taxCategory };
			} else if (
				action.customLineItemTaxCategory &&
				(action.customLineItemTaxCategory as IDataObject).taxCategoryReference
			) {
				const taxRef = (action.customLineItemTaxCategory as IDataObject).taxCategoryReference as IDataObject;
				if (taxRef.id || taxRef.key) {
					result.taxCategory = taxRef.id
						? { typeId: 'tax-category', id: taxRef.id }
						: { typeId: 'tax-category', key: taxRef.key };
				}
			}
			break;

		case 'removeCustomLineItem':
			if (action.customLineItemId || action.removeCustomLineItemId) {
				result.customLineItemId = action.customLineItemId ?? action.removeCustomLineItemId;
			}
			if (action.customLineItemKey || action.removeCustomLineItemKey) {
				result.customLineItemKey = action.customLineItemKey ?? action.removeCustomLineItemKey;
			}
			break;

		case 'changeCustomLineItemQuantity':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			if (action.customLineItemQuantity !== undefined) result.quantity = Number(action.customLineItemQuantity);
			break;

		case 'changeCustomLineItemPriceMode':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			if (action.customLineItemPriceMode) result.mode = action.customLineItemPriceMode;
			break;

		case 'changeCustomLineItemMoney':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			if (action.customLineItemMoney && (action.customLineItemMoney as IDataObject).money) {
				const money = (action.customLineItemMoney as IDataObject).money as IDataObject;
				result.money = {
					type: 'centPrecision',
					currencyCode: money.currencyCode,
					centAmount: Number(money.centAmount)
				};
			}
			break;

		case 'setCustomLineItemTaxRate': {
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			const customLineItemExternalTaxRate = action.customLineItemExternalTaxRate ?? action.externalTaxRate;
			let taxRate: IDataObject | undefined;
			if (customLineItemExternalTaxRate && (customLineItemExternalTaxRate as IDataObject).externalTaxRate) {
				taxRate = (customLineItemExternalTaxRate as IDataObject).externalTaxRate as IDataObject;
			} else if (customLineItemExternalTaxRate && (customLineItemExternalTaxRate as IDataObject).taxRate) {
				taxRate = (customLineItemExternalTaxRate as IDataObject).taxRate as IDataObject;
			}
			if (taxRate) {
				result.externalTaxRate = {
					name: taxRate.name,
					amount: Number(taxRate.amount),
					country: taxRate.country
				};
			}
			if (action.customLineItemShippingKey || action.shippingKey) {
				result.shippingKey = action.customLineItemShippingKey ?? action.shippingKey;
			}
			break;
		}

		case 'setCustomLineItemTaxAmount': {
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			const customLineItemExternalTaxAmount = action.customLineItemExternalTaxAmount ?? action.externalTaxAmount;
			let taxAmount: IDataObject | undefined;
			if (customLineItemExternalTaxAmount && (customLineItemExternalTaxAmount as IDataObject).externalTaxAmount) {
				taxAmount = (customLineItemExternalTaxAmount as IDataObject).externalTaxAmount as IDataObject;
			} else if (customLineItemExternalTaxAmount && (customLineItemExternalTaxAmount as IDataObject).taxAmount) {
				taxAmount = (customLineItemExternalTaxAmount as IDataObject).taxAmount as IDataObject;
			}
			if (taxAmount) {
				result.externalTaxAmount = {
					totalGross: {
						type: 'centPrecision',
						currencyCode: ((taxAmount.totalGross as IDataObject)?.money as IDataObject)?.currencyCode,
						centAmount: Number(((taxAmount.totalGross as IDataObject)?.money as IDataObject)?.centAmount)
					},
					taxRate: {
						name: ((taxAmount.taxRate as IDataObject)?.taxRate as IDataObject)?.name,
						amount: Number(((taxAmount.taxRate as IDataObject)?.taxRate as IDataObject)?.amount),
						country: ((taxAmount.taxRate as IDataObject)?.taxRate as IDataObject)?.country
					}
				};
			}
			if (action.customLineItemTaxAmountShippingKey || action.shippingKey) {
				result.shippingKey = action.customLineItemTaxAmountShippingKey ?? action.shippingKey;
			}
			break;
		}

		case 'setCustomLineItemShippingDetails':
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			if (action.shippingDetails || action.customLineItemShippingDetails) {
				const shippingDetails = action.shippingDetails ?? action.customLineItemShippingDetails;
				try {
					result.shippingDetails = typeof shippingDetails === 'string'
						? JSON.parse(shippingDetails as string)
						: shippingDetails;
				} catch {
					result.shippingDetails = shippingDetails;
				}
			}
			break;

		// Shopping list actions
		case 'addShoppingList':
			if (action.shoppingListId) {
				result.shoppingList = { typeId: 'shopping-list', id: action.shoppingListId };
			} else if (action.shoppingListKey) {
				result.shoppingList = { typeId: 'shopping-list', key: action.shoppingListKey };
			}
			break;

		// Shipping rate input
		case 'setShippingRateInput':
			if (action.shippingRateInputType) {
				if (action.shippingRateInputType === 'Classification') {
					result.shippingRateInput = {
						type: 'Classification',
						key: action.classificationKey || ''
					};
				} else if (action.shippingRateInputType === 'Score') {
					result.shippingRateInput = {
						type: 'Score',
						score: Number(action.score || 0)
					};
				}
			}
			break;

		// Direct discounts
		case 'setDirectDiscounts':
			if (action.directDiscounts) {
				result.discounts = action.directDiscounts;
			}
			break;

		// Item shipping address removal
		case 'removeItemShippingAddress':
			if (action.addressKey) result.addressKey = action.addressKey;
			break;

		default:
			// Return the action as-is if no special handling needed
			return { ...result, ...action };
	}

	return result;
}
