import type { IDataObject } from 'n8n-workflow';
import { isUuid } from './common.utils';

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

const buildAddressFromPrefixedFields = (action: IDataObject): IDataObject | undefined => {
	const fields = [
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

	const prefixes = ['billingAddress_', 'shippingAddress_', 'itemShippingAddress_', 'deliveryAddress_'];
	const address: IDataObject = {};

	for (const field of fields) {
		for (const prefix of prefixes) {
			const value = (action as IDataObject)[`${prefix}${field}`];
			if (value !== undefined && value !== '') {
				address[field] = value;
				break;
			}
		}
	}

	if (typeof address.country === 'string') {
		address.country = address.country.toUpperCase();
		const countryCode = address.country as string;
		if (!/^[A-Z]{2}$/.test(countryCode)) {
			throw new Error('Country must be a 2-letter ISO code (e.g. "DE", "US")');
		}
	}

	return Object.keys(address).length ? address : undefined;
};

const coerceAddressFromAction = (action: IDataObject): IDataObject | undefined => {
	const existing = action.address;
	if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
		return existing as IDataObject;
	}
	if (typeof existing === 'string') {
		try {
			const parsed = JSON.parse(existing);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as IDataObject;
			}
		} catch {
			// fall through to field-based build
		}
	}
	return buildAddressFromPrefixedFields(action);
};

export const handleSetBillingAddress = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setBillingAddress') return action;

	const address = coerceAddressFromAction(action);
	return {
		action: 'setBillingAddress',
		...(address ? { address } : {}),
	};
};
export const handleRemoveItemShippingAddress = (action: IDataObject): IDataObject => {
    if (action?.action !== 'removeItemShippingAddress') return action;

    const addressKey = (action.removeItemShippingAddressKey as string | undefined)?.trim()
        ?? (action.addressKey as string | undefined)?.trim()
        ?? (action.key as string | undefined)?.trim();

    return {
        action: 'removeItemShippingAddress',
        ...(addressKey ? { addressKey } : {}),
    };
};

export const handleRemoveDelivery = (action: IDataObject): IDataObject => {
	if (action?.action !== 'removeDelivery') return action;

	const deliveryId = (action.deliveryId as string | undefined)?.trim();
	const deliveryKey = (action.deliveryKey as string | undefined)?.trim();
	const identifyBy = (action.deliveryIdentifyBy as string | undefined) ?? 'id';

	return {
		action: 'removeDelivery',
		...(identifyBy === 'id'
			? (deliveryId ? { deliveryId } : deliveryKey ? { deliveryKey } : {})
			: (deliveryKey ? { deliveryKey } : deliveryId ? { deliveryId } : {})),
	};
};

export const handleSetShippingAddress = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setShippingAddress') return action;

	const address = coerceAddressFromAction(action);
	return {
		action: 'setShippingAddress',
		...(address ? { address } : {}),
	};
};

export const handleAddItemShippingAddress = (action: IDataObject): IDataObject => {
	if (action?.action !== 'addItemShippingAddress') return action;

	const address = coerceAddressFromAction(action);
	return {
		action: 'addItemShippingAddress',
		...(address ? { address } : {}),
	};
};

export const handleUpdateItemShippingAddress = (action: IDataObject): IDataObject => {
	if (action?.action !== 'updateItemShippingAddress') return action;

	const address = coerceAddressFromAction(action);
	const addressKey = (action.addressKey as string | undefined)
		?? (address?.key as string | undefined);

	return {
		action: 'updateItemShippingAddress',
		...(addressKey ? { addressKey } : {}),
		...(address ? { address } : {}),
	};
};

export const handleAddDelivery = (action: IDataObject): IDataObject => {
	if (action?.action !== 'addDelivery') return action;

	const unwrapFixedCollection = (value: unknown, key: string): IDataObject[] => {
		if (!value) return [];
		if (Array.isArray(value)) {
			return value
				.map((entry) => {
					if (entry && typeof entry === 'object' && key in (entry as IDataObject)) {
						return (entry as IDataObject)[key] as IDataObject;
					}
					return entry as IDataObject;
				})
				.filter((entry): entry is IDataObject => Boolean(entry));
		}
		if (typeof value === 'object') {
			const obj = value as IDataObject;
			if (key in obj) {
				const inner = obj[key];
				if (Array.isArray(inner)) return inner as IDataObject[];
				if (inner && typeof inner === 'object') return [inner as IDataObject];
			}
			return [obj];
		}
		return [];
	};

	const parseJsonArray = (value: unknown): IDataObject[] | undefined => {
		if (value === undefined || value === null || value === '') return undefined;
		if (Array.isArray(value)) return value as IDataObject[];
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) return undefined;
			try {
				const parsed = JSON.parse(trimmed);
				return Array.isArray(parsed) ? (parsed as IDataObject[]) : undefined;
			} catch {
				return undefined;
			}
		}
		return undefined;
	};

	const rawItems = (action.deliveryItems as IDataObject | undefined)?.item ?? action.deliveryItems;
	const itemsArray = unwrapFixedCollection(rawItems, 'item');
	const items: IDataObject[] = [];
	for (const item of itemsArray) {
		const id = (item.id as string | undefined)
			?? (item.lineItemId as string | undefined)
			?? (item.itemId as string | undefined);
		const quantity = Number(item.quantity ?? 0);
		if (id && !isUuid(id)) {
			throw new Error('Line Item ID must be a UUID');
		}
		if (!id || !quantity) continue;
		items.push({ id, quantity });
	}

	const address = coerceAddressFromAction(action);
	const rawParcels = (action.deliveryParcels as IDataObject | undefined)?.parcel ?? action.deliveryParcels;
	const parcelsArray = unwrapFixedCollection(rawParcels, 'parcel');
	const parcels: IDataObject[] = [];
	for (const parcel of parcelsArray) {
		if (parcel.measurements || parcel.trackingData) {
			parcels.push(parcel);
			continue;
		}
		const height = parcel.heightInMillimeter ?? parcel.measurementsHeightInMillimeter;
		const width = parcel.widthInMillimeter ?? parcel.measurementsWidthInMillimeter;
		const measurements = (height !== undefined || width !== undefined)
			? {
				...(height !== undefined ? { heightInMillimeter: Number(height) } : {}),
				...(width !== undefined ? { widthInMillimeter: Number(width) } : {}),
			}
			: undefined;

		const trackingData: IDataObject = {};
		if (parcel.trackingId !== undefined && parcel.trackingId !== '') trackingData.trackingId = parcel.trackingId;
		if (parcel.carrier !== undefined && parcel.carrier !== '') trackingData.carrier = parcel.carrier;
		if (parcel.provider !== undefined && parcel.provider !== '') trackingData.provider = parcel.provider;
		if (parcel.providerTransaction !== undefined && parcel.providerTransaction !== '') {
			trackingData.providerTransaction = parcel.providerTransaction;
		}
		if (parcel.isReturn !== undefined && parcel.isReturn !== '') trackingData.isReturn = Boolean(parcel.isReturn);

		const parcelDraft: IDataObject = {
			...(measurements ? { measurements } : {}),
			...(Object.keys(trackingData).length ? { trackingData } : {}),
		};

		if (Object.keys(parcelDraft).length) {
			parcels.push(parcelDraft);
		}
	}

	const parcelsFromJson = parseJsonArray(action.parcels);
	const parcelsFinal = parcels.length ? parcels : (parcelsFromJson ?? []);

	return {
		action: 'addDelivery',
		...(items.length ? { items } : {}),
		...(address ? { address } : {}),
		...(parcelsFinal.length ? { parcels: parcelsFinal } : {}),
	};
};
export const handleAddPayment = (action: IDataObject): IDataObject => {
	if (action?.action !== 'addPayment') return action;

	const typeId = 'payment';

	const existing = action.payment as IDataObject | undefined;
	if (existing && typeof existing === 'object') {
		const existingId = (existing.id as string | undefined)?.trim();
		const existingKey = (existing.key as string | undefined)?.trim();
		if (existingId || existingKey) {
			return {
				action: 'addPayment',
				payment: {
					typeId: (existing.typeId as string | undefined) || typeId,
					...(existingId ? { id: existingId } : { key: existingKey }),
				},
			};
		}
	}

	const paymentId = (action.paymentId as string | undefined)?.trim();
	const paymentKey = (action.paymentKey as string | undefined)?.trim();
	const identifyBy = (action.paymentIdentifyBy as string | undefined) ?? 'id';

	let payment: IDataObject | undefined;

	if (identifyBy === 'id' && paymentId) {
		payment = { typeId, id: paymentId };
	} else if (identifyBy === 'key' && paymentKey) {
		payment = { typeId, key: paymentKey };
	} else if (paymentId) {
		payment = { typeId, id: paymentId };
	} else if (paymentKey) {
		payment = { typeId, key: paymentKey };
	}

	return {
		action: 'addPayment',
		...(payment ? { payment } : {}),
	};
};
export const handleRemovePayment = (action: IDataObject): IDataObject => {
	if (action?.action !== 'removePayment') return action;

	const typeId = 'payment';

	const existing = action.payment as IDataObject | undefined;
	if (existing && typeof existing === 'object') {
		const existingId = (existing.id as string | undefined)?.trim();
		const existingKey = (existing.key as string | undefined)?.trim();
		if (existingId || existingKey) {
			return {
				action: 'removePayment',
				payment: {
					typeId: (existing.typeId as string | undefined) || typeId,
					...(existingId ? { id: existingId } : { key: existingKey }),
				},
			};
		}
	}

	const paymentId = (action.removePaymentId as string | undefined)?.trim();
	const paymentKey = (action.removePaymentKey as string | undefined)?.trim();
	const identifyBy = (action.removePaymentIdentifyBy as string | undefined) ?? 'id';

	let payment: IDataObject | undefined;

	if (identifyBy === 'id' && paymentId) {
		payment = { typeId, id: paymentId };
	} else if (identifyBy === 'key' && paymentKey) {
		payment = { typeId, key: paymentKey };
	} else if (paymentId) {
		payment = { typeId, id: paymentId };
	} else if (paymentKey) {
		payment = { typeId, key: paymentKey };
	}

	return {
		action: 'removePayment',
		...(payment ? { payment } : {}),
	};
};
export const handleSetCustomerEmail = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setCustomerEmail') return action;

	const email = (action.email as string | undefined)?.trim();

	return {
		action: 'setCustomerEmail',
		// If empty → omit so API removes any existing value
		...(email ? { email } : {}),
	};
};
export const handleChangePaymentState = (action: IDataObject): IDataObject => {
	if (action?.action !== 'changePaymentState') return action;

	return {
		action: 'changePaymentState',
		...(action.paymentState ? { paymentState: action.paymentState } : {}),
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

	const existing = action.businessUnit as IDataObject | undefined;
	if (existing && typeof existing === 'object') {
		const existingId = (existing.id as string | undefined)?.trim();
		const existingKey = (existing.key as string | undefined)?.trim();
		if (existingId || existingKey) {
			return {
				action: 'setBusinessUnit',
				businessUnit: {
					typeId: (existing.typeId as string | undefined) || typeId,
					...(existingId ? { id: existingId } : { key: existingKey }),
				},
			};
		}
	}

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
export const handleSetCustomerId = (action: IDataObject): IDataObject => {
	if (action?.action !== 'setCustomerId') return action;

	const customerId = (action.customerId as string | undefined)?.trim();

	return {
		action: 'setCustomerId',
		...(customerId ? { customerId } : {}),
	};
};
