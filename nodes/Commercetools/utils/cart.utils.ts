import type { IDataObject } from 'n8n-workflow';
import { isUuid } from './common.utils';

/**
 * Utility functions for cart operations
 */

// Helper functions to reduce repetitive code
const safeAssign = (target: IDataObject, source: IDataObject, fieldMap: Record<string, string>) => {
	Object.entries(fieldMap).forEach(([sourceKey, targetKey]) => {
		if (source[sourceKey]) {
			target[targetKey] = source[sourceKey];
		}
	});
};

const createReference = (typeId: string, id?: unknown, key?: unknown) => {
	return id ? { typeId, id } : key ? { typeId, key } : undefined;
};

const safeJsonParse = (value: unknown, fallback = value) => {
	if (typeof value === 'string') {
		try {
			return JSON.parse(value);
		} catch {
			return fallback;
		}
	}
	return value;
};

const createMoneyObject = (money: IDataObject, defaultCurrency = 'USD') => ({
	type: 'centPrecision',
	currencyCode: (money.currencyCode as string) || defaultCurrency,
	centAmount: Number(money.centAmount),
});

const createTaxRate = (taxRateObj: IDataObject, defaultCountry = 'DE') => {
	const taxRate = extractNestedValue(taxRateObj, ['taxRate']) || taxRateObj;
	return {
		name: (taxRate.name as string) || '',
		amount: Number(taxRate.amount || 0),
		country: (taxRate.country as string) || defaultCountry,
		...(taxRate.state && { state: taxRate.state }),
	};
};

const extractNestedValue = (obj: IDataObject, path: string[]) => {
	return path.reduce((current, key) => current?.[key] as IDataObject, obj);
};

const handleChannelReference = (channelObj: IDataObject, typeId = 'channel') => {
	const channelRef = (channelObj.channelReference as IDataObject) ?? channelObj;
	return channelRef && (channelRef.id || channelRef.key)
		? createReference(typeId, channelRef.id, channelRef.key)
		: undefined;
};

const handleTargetsDelta = (targetsDelta: unknown) => {
	const parsed = safeJsonParse(targetsDelta);
	if (Array.isArray(parsed)) return { targets: parsed };
	if (parsed && typeof parsed === 'object' && (parsed as IDataObject).target) {
		return { targets: (parsed as IDataObject).target };
	}
	return undefined;
};

const createExternalTaxAmount = (taxAmountData: IDataObject, defaultCurrency = 'EUR') => {
	const result: IDataObject = {};

	// Handle totalGross
	const totalGrossMoney = extractNestedValue(taxAmountData, ['totalGross', 'money']);
	if (totalGrossMoney) {
		result.totalGross = createMoneyObject(totalGrossMoney, defaultCurrency);
	}

	// Handle taxRate
	const taxRateData =
		extractNestedValue(taxAmountData, ['taxRate', 'taxRate']) ||
		extractNestedValue(taxAmountData, ['taxRate']);
	if (taxRateData) {
		result.taxRate = createTaxRate({ taxRate: taxRateData });
	}

	return Object.keys(result).length > 0 ? result : undefined;
};

const createExternalTotalPrice = (totalPriceData: IDataObject, defaultCurrency = 'EUR') => {
	const result: IDataObject = {};

	// Handle price
	const priceMoney = extractNestedValue(totalPriceData, ['price', 'money']);
	if (priceMoney) {
		result.price = createMoneyObject(priceMoney, defaultCurrency);
	}

	// Handle totalPrice
	const totalPriceMoney = extractNestedValue(totalPriceData, ['totalPrice', 'money']);
	if (totalPriceMoney) {
		result.totalPrice = createMoneyObject(totalPriceMoney, defaultCurrency);
	}

	return Object.keys(result).length > 0 ? result : undefined;
};

const handleLineItemActions = (result: IDataObject, action: IDataObject, actionType: string) => {
	setLineItemIdentifier(result, action);

	switch (actionType) {
		case 'setLineItemTaxRate':
		case 'setShippingMethodTaxRate': {
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			const taxRateObj = extractNestedValue(action.externalTaxRate as IDataObject, ['taxRate']);
			if (taxRateObj) {
				result.externalTaxRate = createTaxRate({ taxRate: taxRateObj });
			}
			break;
		}

		case 'setLineItemPrice': {
			const externalPriceMoney = extractNestedValue(action.externalPrice as IDataObject, ['money']);
			if (externalPriceMoney) {
				result.externalPrice = createMoneyObject(externalPriceMoney);
			}
			break;
		}

		case 'setLineItemTaxAmount':
		case 'setShippingMethodTaxAmount': {
			if (action.shippingKey) result.shippingKey = action.shippingKey;
			const taxAmountData = extractNestedValue(action.externalTaxAmount as IDataObject, [
				'taxAmount',
			]);
			if (taxAmountData) {
				result.externalTaxAmount = createExternalTaxAmount(taxAmountData);
			}
			break;
		}

		case 'setLineItemTotalPrice': {
			const totalPriceData = extractNestedValue(action.externalTotalPrice as IDataObject, [
				'totalPrice',
			]);
			if (totalPriceData) {
				result.externalTotalPrice = createExternalTotalPrice(totalPriceData);
			}
			break;
		}

		case 'setLineItemDistributionChannel':
			if (action.distributionChannelId) {
				result.distributionChannel = createReference('channel', action.distributionChannelId);
			}
			break;
	}
};

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
export function formatLineItem(
	productId: string,
	variantId: number,
	quantity: number,
): IDataObject {
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
export function formatAddLineItemAction(
	productId: string,
	variantId: number,
	quantity: number,
): IDataObject {
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
export function formatChangeLineItemQuantityAction(
	lineItemId: string,
	quantity: number,
): IDataObject {
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

	// Simple field mappings  is used action directly map one input field one output field
	const simpleFieldMappings: Record<string, Record<string, string>> = {
		setAnonymousId: { anonymousId: 'anonymousId' },
		setCustomerEmail: { email: 'email' },
		setCustomerId: { customerId: 'customerId' },
		setKey: { key: 'key' },
		setLocale: { locale: 'locale' },
		setCountry: { country: 'country' },
		setPurchaseOrderNumber: { purchaseOrderNumber: 'purchaseOrderNumber' },
		changeTaxMode: { taxMode: 'taxMode' },
		changeTaxCalculationMode: { taxCalculationMode: 'taxCalculationMode' },
		changeTaxRoundingMode: { taxRoundingMode: 'taxRoundingMode' },
		changePriceRoundingMode: { priceRoundingMode: 'priceRoundingMode' },
	};

	// Handle simple field mappings

	if (simpleFieldMappings[actionType]) {
		safeAssign(result, action, simpleFieldMappings[actionType]);
		return result;
	}

	const buildAddressFromFields = (): IDataObject | undefined => {
		const fields: Array<keyof IDataObject> = [
			'key',
			'title',
			'salutation',
			'firstName',
			'lastName',
			'streetName',
			'streetNumber',
			'additionalStreetInfo',
			'postalCode',
			'city',
			'region',
			'state',
			'country',
			'company',
			'department',
			'building',
			'apartment',
			'pOBox',
			'phone',
			'mobile',
			'email',
			'fax',
			'additionalAddressInfo',
			'externalId',
		];
		const address: IDataObject = {};
		if (action.addressKey !== undefined && action.addressKey !== '') {
			address.key = action.addressKey;
		}
		for (const field of fields) {
			if (action[field] !== undefined && action[field] !== '') {
				address[field] = action[field];
			}
		}
		return Object.keys(address).length > 0 ? address : undefined;
	};

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
				const parsed =
					typeof action.address === 'string'
						? (() => {
								try {
									return JSON.parse(action.address as string);
								} catch {
									return undefined;
								}
							})()
						: action.address;
				if (parsed) result.address = formatAddress(parsed);
			} else {
				const address = buildAddressFromFields();
				if (address) result.address = formatAddress(address);
			}
			break;

		// Reference-based actions
		case 'setCustomerGroup':
			result.customerGroup = createReference(
				'customer-group',
				action.customerGroupId,
				action.customerGroupKey,
			);
			break;

		case 'setBusinessUnit':
			result.businessUnit = createReference(
				'business-unit',
				action.businessUnitId,
				action.businessUnitKey,
			);
			break;

		case 'setShippingMethod':
		case 'removeShippingMethod':
			result.shippingMethod = createReference(
				'shipping-method',
				action.shippingMethodId,
				action.shippingMethodKey,
			);
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
			result.code = action.code || action.discountCode;
			break;

		case 'removeDiscountCode': {
			const discountCodeRef =
				extractNestedValue(action.discountCode as IDataObject, ['discountCodeReference']) ||
				action.discountCode;
			if (discountCodeRef && (discountCodeRef.id || discountCodeRef.key)) {
				result.discountCode = {
					typeId: (discountCodeRef.typeId as string) || 'discount-code',
					...(discountCodeRef.id ? { id: discountCodeRef.id } : { key: discountCodeRef.key }),
				};
			}
			break;
		}

		// Payment actions
		case 'addPayment':
		case 'removePayment': {
			const paymentRef =
				extractNestedValue(action.payment as IDataObject, ['paymentReference']) || action.payment;
			result.payment =
				paymentRef && (paymentRef.id || paymentRef.key)
					? createReference(
							(paymentRef.typeId as string) || 'payment',
							paymentRef.id,
							paymentRef.key,
						)
					: createReference('payment', action.paymentId, action.paymentKey);
			break;
		}

		case 'addLineItem': {
			// Required fields
			safeAssign(result, action, {
				productId: 'productId',
			});
			if (action.variantId !== undefined) result.variantId = Number(action.variantId);
			if (action.quantity !== undefined) result.quantity = Number(action.quantity);

			// Handle channels
			if (action.distributionChannel) {
				result.distributionChannel = handleChannelReference(
					action.distributionChannel as IDataObject,
				);
			}
			if (action.supplyChannel) {
				result.supplyChannel = handleChannelReference(action.supplyChannel as IDataObject);
			}

			// Handle external price
			const externalPriceMoney = extractNestedValue(action.externalPrice as IDataObject, ['money']);
			if (externalPriceMoney) {
				result.externalPrice = createMoneyObject(externalPriceMoney);
			}

			// Handle external tax rate
			const taxRateObj = extractNestedValue(action.externalTaxRate as IDataObject, ['taxRate']);
			if (taxRateObj) {
				result.externalTaxRate = createTaxRate({ taxRate: taxRateObj });
			}

			// Handle shipping details
			if (action.targetsDelta) {
				result.shippingDetails = handleTargetsDelta(action.targetsDelta);
			}

			// Handle custom fields
			if (action.customFields) {
				result.custom = safeJsonParse(action.customFields);
			}
			break;
		}

		case 'removeLineItem':
			setLineItemIdentifier(result, action);
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
						centAmount: Number(money.centAmount),
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
								centAmount: Number(priceMoney.centAmount),
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
								centAmount: Number(totalMoney.centAmount),
							};
						}
					}
				}
			}
			break;

		// Line Item actions with complex handling
		case 'setLineItemTaxRate':
		case 'setShippingMethodTaxRate':
		case 'setLineItemPrice':
		case 'setLineItemTaxAmount':
		case 'setShippingMethodTaxAmount':
		case 'setLineItemDistributionChannel':
		case 'setLineItemTotalPrice': {
			handleLineItemActions(result, action, actionType);
			break;
		}

		case 'setLineItemSupplyChannel':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;

			if (action.supplyChannelId) {
				result.supplyChannel = {
					typeId: 'channel',
					id: action.supplyChannelId,
				};
			}
			break;

		case 'setLineItemShippingDetails':
			if (action.lineItemId) result.lineItemId = action.lineItemId;
			if (action.lineItemKey) result.lineItemKey = action.lineItemKey;

			if (action.shippingDetails) {
				try {
					result.shippingDetails =
						typeof action.shippingDetails === 'string'
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
					if (typeof action.targetsDelta === 'string') {
						result.targetsDelta = JSON.parse(action.targetsDelta);
					} else if (
						typeof action.targetsDelta === 'object' &&
						(action.targetsDelta as IDataObject).target
					) {
						result.targetsDelta = (action.targetsDelta as IDataObject).target;
					} else {
						result.targetsDelta = action.targetsDelta;
					}
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
					if (typeof action.targetsDelta === 'string') {
						result.targetsDelta = JSON.parse(action.targetsDelta);
					} else if (
						typeof action.targetsDelta === 'object' &&
						(action.targetsDelta as IDataObject).target
					) {
						result.targetsDelta = (action.targetsDelta as IDataObject).target;
					} else {
						result.targetsDelta = action.targetsDelta;
					}
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
					result.recurrenceInfo =
						typeof action.recurrenceInfo === 'string'
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
					result.recurrenceInfo =
						typeof action.recurrenceInfo === 'string'
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
					result.value =
						typeof action.customFieldValue === 'string'
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
					result.value =
						typeof action.customFieldValue === 'string'
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
					result.value =
						typeof action.customFieldValue === 'string'
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
					result.value =
						typeof action.customFieldValue === 'string'
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
					result.value =
						typeof action.customFieldValue === 'string'
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
					result.fields =
						typeof action.customFields === 'string'
							? JSON.parse(action.customFields)
							: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setBillingAddressCustomType':
		case 'setShippingAddressCustomType':
			if (
				action.customTypeId ||
				action.customTypeKey ||
				action.addressCustomTypeId ||
				action.addressCustomTypeKey
			) {
				const typeId = action.addressCustomTypeId ?? action.customTypeId;
				const typeKey = action.addressCustomTypeKey ?? action.customTypeKey;
				result.type = typeId ? { typeId: 'type', id: typeId } : { typeId: 'type', key: typeKey };
			}

			if (action.customFields) {
				if (typeof action.customFields === 'string') {
					const trimmed = action.customFields.trim();

					// Check if it's already JSON
					if (trimmed.startsWith('{')) {
						try {
							result.fields = JSON.parse(trimmed);

							// Validate it's an object
							if (typeof result.fields !== 'object' || Array.isArray(result.fields)) {
								throw new Error(
									'Custom Fields must be a JSON object (e.g., {"fieldName": "value"})',
								);
							}
						} catch (error) {
							throw new Error(`Invalid Custom Fields format: ${(error as Error).message}`);
						}
					} else if (trimmed) {
						// Plain string value - wrap it with the default field name from your Custom Type
						// This assumes your Custom Type has a field named "exampleStringField"
						// Replace this with your actual field name from CommerceTools Type definition!
						result.fields = {
							exampleStringField: trimmed,
						};
					}
				} else if (typeof action.customFields === 'object') {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setShippingCustomType':
			if (action.shippingKey) result.shippingKey = action.shippingKey;

			if (
				action.customTypeId ||
				action.customTypeKey ||
				action.shippingCustomTypeId ||
				action.shippingCustomTypeKey
			) {
				const typeId = action.shippingCustomTypeId ?? action.customTypeId;
				const typeKey = action.shippingCustomTypeKey ?? action.customTypeKey;
				result.type = typeId ? { typeId: 'type', id: typeId } : { typeId: 'type', key: typeKey };
			}

			if (action.customFields) {
				try {
					result.fields =
						typeof action.customFields === 'string'
							? JSON.parse(action.customFields)
							: action.customFields;
				} catch {
					result.fields = action.customFields;
				}
			}
			break;

		case 'setItemShippingAddressCustomType':
			if (action.addressKey) result.addressKey = action.addressKey;

			if (
				action.customTypeId ||
				action.customTypeKey ||
				action.addressCustomTypeId ||
				action.addressCustomTypeKey
			) {
				const typeId = action.addressCustomTypeId ?? action.customTypeId;
				const typeKey = action.addressCustomTypeKey ?? action.customTypeKey;
				result.type = typeId ? { typeId: 'type', id: typeId } : { typeId: 'type', key: typeKey };
			}

			if (action.customFields) {
				try {
					result.fields =
						typeof action.customFields === 'string'
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
				result.type = typeId ? { typeId: 'type', id: typeId } : { typeId: 'type', key: typeKey };
			}

			if (action.customFields) {
				try {
					result.fields =
						typeof action.customFields === 'string'
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
		case 'setDeleteDaysAfterLastModification': {
			const daysValue = action.deleteDaysAfterLastModification;
			if (daysValue !== undefined && daysValue !== null && daysValue !== '') {
				result.deleteDaysAfterLastModification = Number(daysValue);
			}
			break;
		}

		case 'setCartTotalTax':
			if (action.cartTotalTax !== undefined) {
				result.externalTotalGross = {
					type: 'centPrecision',
					currencyCode: action.currency || 'USD',
					centAmount: Number(action.cartTotalTax) * 100,
				};
			}
			break;

		// Custom shipping method
		case 'setCustomShippingMethod':
		case 'addCustomShippingMethod':
			{
				const parseOptionalJson = (value: unknown): unknown => {
					if (value === undefined || value === null || value === '') return undefined;
					if (typeof value === 'string') {
						const trimmed = value.trim();
						if (!trimmed) return undefined;
						try {
							return JSON.parse(trimmed);
						} catch {
							return value;
						}
					}
					if (typeof value === 'object') return value;
					return value;
				};

				const shippingMethodName = action.shippingMethodNameCustom ?? action.shippingMethodName;
				if (shippingMethodName) result.shippingMethodName = shippingMethodName;

				const shippingKey = action.shippingKeyCustom ?? action.shippingKey;
				if (shippingKey) result.shippingKey = shippingKey;

				const shippingAddressInput = action.shippingAddressCustom ?? action.shippingAddress;
				const shippingAddressParsed = parseOptionalJson(shippingAddressInput) as
					| IDataObject
					| undefined;
				if (shippingAddressParsed) {
					const address = (shippingAddressParsed as IDataObject).shippingAddress as
						| IDataObject
						| undefined;
					result.shippingAddress = address ?? shippingAddressParsed;
				}

				const shippingRateInput = action.shippingRateCustom ?? action.shippingRate;
				const shippingRateParsed = parseOptionalJson(shippingRateInput) as IDataObject | undefined;
				if (shippingRateParsed) {
					const rate = (shippingRateParsed as IDataObject).shippingRate as IDataObject | undefined;
					const rateValues = rate ?? shippingRateParsed;
					if (rateValues.currencyCode || rateValues.centAmount) {
						result.shippingRate = {
							price: {
								type: 'centPrecision',
								currencyCode: rateValues.currencyCode,
								centAmount: Number(rateValues.centAmount) || 0,
							},
						};
					} else if (rateValues.price) {
						result.shippingRate = rateValues;
					}
				} else if (action.shippingRatePrice && action.currency) {
					result.shippingRate = {
						price: {
							type: 'centPrecision',
							currencyCode: action.currency,
							centAmount: Number(action.shippingRatePrice) * 100,
						},
					};
				}

				const taxCategoryInput = action.taxCategoryCustomShipping as IDataObject | undefined;
				const taxRef = (taxCategoryInput?.taxCategoryReference as IDataObject) ?? undefined;
				if (taxRef?.id || taxRef?.key) {
					result.taxCategory = taxRef.id
						? { typeId: 'tax-category', id: taxRef.id }
						: { typeId: 'tax-category', key: taxRef.key };
				} else if (action.taxCategoryId) {
					result.taxCategory = { typeId: 'tax-category', id: action.taxCategoryId };
				} else if (action.taxCategoryKey) {
					result.taxCategory = { typeId: 'tax-category', key: action.taxCategoryKey };
				}

				const externalTaxRate = parseOptionalJson(action.externalTaxRateCustomShipping);
				if (externalTaxRate) result.externalTaxRate = externalTaxRate;

				const deliveries = parseOptionalJson(action.deliveriesCustomShipping);
				if (deliveries) result.deliveries = deliveries;

				const custom = parseOptionalJson(action.customFieldsCustomShipping);
				if (custom) result.custom = custom;

				const shippingRateInputCustom = parseOptionalJson(action.shippingRateInputCustom);
				if (shippingRateInputCustom) result.shippingRateInput = shippingRateInputCustom;
			}
			break;

		// Custom line item actions
		case 'addCustomLineItem':
			if (action.customLineItemName) {
				if (typeof action.customLineItemName === 'string') {
					result.name = { en: action.customLineItemName };
				} else if (typeof action.customLineItemName === 'object') {
					const localizedName = (action.customLineItemName as IDataObject).localizedName as
						| IDataObject
						| undefined;
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
					centAmount: Number(money.centAmount),
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
				const taxRef = (action.customLineItemTaxCategory as IDataObject)
					.taxCategoryReference as IDataObject;
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
			if (action.customLineItemQuantity !== undefined)
				result.quantity = Number(action.customLineItemQuantity);
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
					centAmount: Number(money.centAmount),
				};
			}
			break;

		case 'setCustomLineItemTaxRate': {
			if (action.customLineItemId) result.customLineItemId = action.customLineItemId;
			if (action.customLineItemKey) result.customLineItemKey = action.customLineItemKey;
			const customLineItemExternalTaxRate =
				action.customLineItemExternalTaxRate ?? action.externalTaxRate;
			let taxRate: IDataObject | undefined;
			if (
				customLineItemExternalTaxRate &&
				(customLineItemExternalTaxRate as IDataObject).externalTaxRate
			) {
				taxRate = (customLineItemExternalTaxRate as IDataObject).externalTaxRate as IDataObject;
			} else if (
				customLineItemExternalTaxRate &&
				(customLineItemExternalTaxRate as IDataObject).taxRate
			) {
				taxRate = (customLineItemExternalTaxRate as IDataObject).taxRate as IDataObject;
			}
			if (taxRate) {
				result.externalTaxRate = {
					name: taxRate.name,
					amount: Number(taxRate.amount),
					country: taxRate.country,
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
			const customLineItemExternalTaxAmount =
				action.customLineItemExternalTaxAmount ?? action.externalTaxAmount;
			let taxAmount: IDataObject | undefined;
			if (
				customLineItemExternalTaxAmount &&
				(customLineItemExternalTaxAmount as IDataObject).externalTaxAmount
			) {
				taxAmount = (customLineItemExternalTaxAmount as IDataObject)
					.externalTaxAmount as IDataObject;
			} else if (
				customLineItemExternalTaxAmount &&
				(customLineItemExternalTaxAmount as IDataObject).taxAmount
			) {
				taxAmount = (customLineItemExternalTaxAmount as IDataObject).taxAmount as IDataObject;
			}
			if (taxAmount) {
				result.externalTaxAmount = {
					totalGross: {
						type: 'centPrecision',
						currencyCode: ((taxAmount.totalGross as IDataObject)?.money as IDataObject)
							?.currencyCode,
						centAmount: Number(
							((taxAmount.totalGross as IDataObject)?.money as IDataObject)?.centAmount,
						),
					},
					taxRate: {
						name: ((taxAmount.taxRate as IDataObject)?.taxRate as IDataObject)?.name,
						amount: Number(((taxAmount.taxRate as IDataObject)?.taxRate as IDataObject)?.amount),
						country: ((taxAmount.taxRate as IDataObject)?.taxRate as IDataObject)?.country,
					},
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
					result.shippingDetails =
						typeof shippingDetails === 'string'
							? JSON.parse(shippingDetails as string)
							: shippingDetails;
				} catch {
					result.shippingDetails = shippingDetails;
				}
			}
			break;

		// Shopping list actions
		case 'addShoppingList':
			{
				const shoppingListInput = action.shoppingList as IDataObject | undefined;
				const shoppingListRef =
					(shoppingListInput?.shoppingListReference as IDataObject) ?? shoppingListInput;
				if (shoppingListRef && (shoppingListRef.id || shoppingListRef.key)) {
					result.shoppingList = {
						typeId: (shoppingListRef.typeId as string) || 'shopping-list',
						...(shoppingListRef.id ? { id: shoppingListRef.id } : { key: shoppingListRef.key }),
					};
				} else if (action.shoppingListId) {
					result.shoppingList = { typeId: 'shopping-list', id: action.shoppingListId };
				} else if (action.shoppingListKey) {
					result.shoppingList = { typeId: 'shopping-list', key: action.shoppingListKey };
				}

				const distributionInput = action.distributionChannel as IDataObject | undefined;
				const distributionRef =
					(distributionInput?.channelReference as IDataObject) ?? distributionInput;
				if (distributionRef && (distributionRef.id || distributionRef.key)) {
					result.distributionChannel = {
						typeId: (distributionRef.typeId as string) || 'channel',
						...(distributionRef.id ? { id: distributionRef.id } : { key: distributionRef.key }),
					};
				}

				const supplyInput = action.supplyChannel as IDataObject | undefined;
				const supplyRef = (supplyInput?.channelReference as IDataObject) ?? supplyInput;
				if (supplyRef && (supplyRef.id || supplyRef.key)) {
					result.supplyChannel = {
						typeId: (supplyRef.typeId as string) || 'channel',
						...(supplyRef.id ? { id: supplyRef.id } : { key: supplyRef.key }),
					};
				}
			}
			break;

		// Shipping rate input
		case 'setShippingRateInput':
			if (action.shippingRateInputType) {
				if (action.shippingRateInputType === 'Classification') {
					result.shippingRateInput = {
						type: 'Classification',
						key: action.classificationKey || '',
					};
				} else if (action.shippingRateInputType === 'Score') {
					result.shippingRateInput = {
						type: 'Score',
						score: Number(action.score || 0),
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
