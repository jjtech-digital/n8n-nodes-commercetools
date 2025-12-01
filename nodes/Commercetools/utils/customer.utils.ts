import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type CommonParameterOptions = {
	allowSort?: boolean;
	allowWhere?: boolean;
	allowPredicateVariables?: boolean;
};

/**
 * Applies common query parameters for Commercetools API requests
 * @param qs - Query string object to modify
 * @param additionalFields - Additional fields from node parameters
 * @param options - Options to control which parameters are allowed
 */
export const applyCommonCustomerParameters = (
	qs: IDataObject,
	additionalFields: IDataObject = {},
	options: CommonParameterOptions = {},
) => {
	const setArrayField = (fieldName: string, queryName: string) => {
		const value = additionalFields[fieldName];
		if (Array.isArray(value) && value.length) {
			qs[queryName] = value;
		} else if (typeof value === 'string' && value.trim()) {
			
			const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
			if (arrayValue.length) {
				qs[queryName] = arrayValue;
			}
		}
	};

	
	setArrayField('expand', 'expand');

	if (options.allowSort) {
		setArrayField('sort', 'sort');
	}


	if (options.allowWhere) {
		setArrayField('where', 'where');
	}


	if (options.allowPredicateVariables) {
		const predicateVariables = ((additionalFields.predicateVariables as IDataObject)?.variable ?? []) as IDataObject[];
		for (const predicateVariable of predicateVariables) {
			const name = predicateVariable.name as string;
			if (!name) continue;
			qs[`var.${name}`] = predicateVariable.value as string;
		}
	}

	const customParameters = ((additionalFields.customParameters as IDataObject)?.parameter ?? []) as IDataObject[];
	for (const customParameter of customParameters) {
		const key = customParameter.key as string;
		if (!key) continue;
		qs[key] = customParameter.value as string;
	}
};

/**
 * Safely parses JSON input from string or returns object as-is
 * @param context - n8n execution context
 * @param raw - Raw input to parse (string or object)
 * @param label - Label for error reporting
 * @param itemIndex - Current item index for error context
 * @returns Parsed object or original if already an object
 */
export const coerceJsonInput = (
	context: IExecuteFunctions,
	raw: unknown,
	label: string,
	itemIndex: number,
): IDataObject => {
	let value = raw;

	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			throw new NodeOperationError(
				context.getNode(),
				`${label} must be valid JSON when provided as a string`,
				{ itemIndex },
			);
		}
	}

	if (typeof value !== 'object' || value === null) {
		throw new NodeOperationError(context.getNode(), `${label} must be a JSON object or array`, {
			itemIndex,
		});
	}

	return value as IDataObject;
};

/**
 * Builds Commercetools update actions from n8n UI parameters
 * Converts UI form data into proper Commercetools API action format
 * @param context - n8n execution context
 * @param actionsUi - UI actions data from node parameters
 * @param itemIndex - Current item index being processed
 * @returns Array of Commercetools update actions
 */
export const buildActionsFromUi = (
	context: IExecuteFunctions,
	actionsUi: IDataObject,
	itemIndex: number,
): IDataObject[] => {
	const builtActions: IDataObject[] = [];
	const rawActionEntries = actionsUi.action;
	const actionEntries = Array.isArray(rawActionEntries)
		? (rawActionEntries as IDataObject[])
		: rawActionEntries
		? [rawActionEntries as IDataObject]
		: [];

	for (const actionEntry of actionEntries) {
		const actionType = actionEntry.actionType as string;

		if (!actionType) {
			throw new NodeOperationError(
				context.getNode(),
				'Action Type is required for each action',
				{ itemIndex },
			);
		}

		// Helper function to create address object from individual fields
		const buildAddressFromFields = (entry: IDataObject): IDataObject => {
			const address: IDataObject = {};
			
			if (entry.key) address.key = entry.key;
			if (entry.title) address.title = entry.title;
			if (entry.firstName) address.firstName = entry.firstName;
			if (entry.lastName) address.lastName = entry.lastName;
			if (entry.streetName) address.streetName = entry.streetName;
			if (entry.streetNumber) address.streetNumber = entry.streetNumber;
			if (entry.city) address.city = entry.city;
			if (entry.postalCode) address.postalCode = entry.postalCode;
			if (entry.country) address.country = entry.country;
			if (entry.state) address.state = entry.state;
			if (entry.building) address.building = entry.building;
			if (entry.apartment) address.apartment = entry.apartment;
			if (entry.department) address.department = entry.department;
			if (entry.phone) address.phone = entry.phone;
			if (entry.mobile) address.mobile = entry.mobile;
			if (entry.addressEmail) address.email = entry.addressEmail;
			if (entry.fax) address.fax = entry.fax;
			if (entry.pOBox) address.pOBox = entry.pOBox;
			if (entry.additionalAddressInfo) address.additionalAddressInfo = entry.additionalAddressInfo;
			if (entry.additionalStreetInfo) address.additionalStreetInfo = entry.additionalStreetInfo;

			return address;
		};

		// Helper function to get ID or Key reference
		const getIdOrKeyReference = (entry: IDataObject, idField: string, keyField: string, referenceType: string): IDataObject => {
			const id = (entry[idField] as string)?.trim();
			const key = (entry[keyField] as string)?.trim();

			if (id) {
				return { typeId: referenceType, id };
			} else if (key) {
				return { typeId: referenceType, key };
			} else {
				throw new NodeOperationError(
					context.getNode(),
					`Either ${idField} or ${keyField} is required`,
					{ itemIndex },
				);
			}
		};

		// Helper function to get multiple ID or Key references
		const getMultipleIdOrKeyReferences = (entry: IDataObject, idsField: string, keysField: string, referenceType: string): IDataObject[] => {
			const ids = (entry[idsField] as string)?.trim();
			const keys = (entry[keysField] as string)?.trim();

			if (ids) {
				return ids.split(',').map(id => ({ typeId: referenceType, id: id.trim() }));
			} else if (keys) {
				return keys.split(',').map(key => ({ typeId: referenceType, key: key.trim() }));
			} else {
				throw new NodeOperationError(
					context.getNode(),
					`Either ${idsField} or ${keysField} is required`,
					{ itemIndex },
				);
			}
		};

		switch (actionType) {
			case 'addAddress': {
				const address = buildAddressFromFields(actionEntry);
				builtActions.push({
					action: 'addAddress',
					address,
				});
				break;
			}

			case 'addBillingAddressId': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Add Billing Address ID action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'addBillingAddressId',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'addCustomerGroupAssignment': {
				const customerGroup = getIdOrKeyReference(actionEntry, 'customerGroupId', 'customerGroupKey', 'customer-group');
				builtActions.push({
					action: 'addCustomerGroupAssignment',
					customerGroup,
				});
				break;
			}

			case 'addShippingAddressId': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Add Shipping Address ID action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'addShippingAddressId',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'addStore': {
				const store = getIdOrKeyReference(actionEntry, 'storeId', 'storeKey', 'store');
				builtActions.push({
					action: 'addStore',
					store,
				});
				break;
			}

			case 'changeAddress': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Change Address action',
						{ itemIndex },
					);
				}

				const address = buildAddressFromFields(actionEntry);
				builtActions.push({
					action: 'changeAddress',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
					address,
				});
				break;
			}

			case 'changeEmail': {
				const email = (actionEntry.email as string)?.trim();
				if (!email) {
					throw new NodeOperationError(
						context.getNode(),
						'Email is required for Change Email action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'changeEmail',
					email,
				});
				break;
			}

			case 'removeAddress': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Remove Address action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'removeAddress',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'removeBillingAddressId': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Remove Billing Address ID action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'removeBillingAddressId',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'removeCustomerGroupAssignment': {
				const customerGroup = getIdOrKeyReference(actionEntry, 'customerGroupId', 'customerGroupKey', 'customer-group');
				builtActions.push({
					action: 'removeCustomerGroupAssignment',
					customerGroup,
				});
				break;
			}

			case 'removeShippingAddressId': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Remove Shipping Address ID action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'removeShippingAddressId',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'removeStore': {
				const store = getIdOrKeyReference(actionEntry, 'storeId', 'storeKey', 'store');
				builtActions.push({
					action: 'removeStore',
					store,
				});
				break;
			}

			case 'setAuthenticationMode': {
				const authMode = (actionEntry.authMode as string)?.trim();
				const password = (actionEntry.password as string)?.trim();

				if (!authMode) {
					throw new NodeOperationError(
						context.getNode(),
						'Authentication Mode is required for Set Authentication Mode action',
						{ itemIndex },
					);
				}

				const action: IDataObject = {
					action: 'setAuthenticationMode',
					authMode,
				};

				if (authMode === 'Password' && password) {
					action.password = password;
				}

				builtActions.push(action);
				break;
			}

			case 'setCompanyName': {
				const companyName = (actionEntry.companyName as string)?.trim();
				builtActions.push({
					action: 'setCompanyName',
					companyName: companyName || undefined,
				});
				break;
			}

			case 'setCustomType': {
				const type = getIdOrKeyReference(actionEntry, 'typeId', 'typeKey', 'type');
				const fieldsRaw = actionEntry.fields as string;
				
				let fields: IDataObject = {};
				if (fieldsRaw && fieldsRaw.trim()) {
					try {
						fields = typeof fieldsRaw === 'string' ? JSON.parse(fieldsRaw) : fieldsRaw;
					} catch {
						throw new NodeOperationError(
							context.getNode(),
							'Fields must be valid JSON',
							{ itemIndex },
						);
					}
				}

				builtActions.push({
					action: 'setCustomType',
					type,
					fields,
				});
				break;
			}

			case 'setCustomTypeInAddress': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Set Custom Type in Address action',
						{ itemIndex },
					);
				}

				const type = getIdOrKeyReference(actionEntry, 'typeId', 'typeKey', 'type');
				const fieldsRaw = actionEntry.fields as string;
				
				let fields: IDataObject = {};
				if (fieldsRaw && fieldsRaw.trim()) {
					try {
						fields = typeof fieldsRaw === 'string' ? JSON.parse(fieldsRaw) : fieldsRaw;
					} catch {
						throw new NodeOperationError(
							context.getNode(),
							'Fields must be valid JSON',
							{ itemIndex },
						);
					}
				}

				builtActions.push({
					action: 'setCustomTypeInAddress',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
					type,
					fields,
				});
				break;
			}

			case 'setCustomerNumber': {
				const customerNumber = (actionEntry.customerNumber as string)?.trim();
				builtActions.push({
					action: 'setCustomerNumber',
					customerNumber: customerNumber || undefined,
				});
				break;
			}

			case 'setCustomerGroup': {
				const customerGroup = getIdOrKeyReference(actionEntry, 'customerGroupId', 'customerGroupKey', 'customer-group');
				builtActions.push({
					action: 'setCustomerGroup',
					customerGroup,
				});
				break;
			}

			case 'setCustomerGroupAssignments': {
				const customerGroupAssignments = getMultipleIdOrKeyReferences(actionEntry, 'customerGroupIds', 'customerGroupKeys', 'customer-group');
				builtActions.push({
					action: 'setCustomerGroupAssignments',
					customerGroupAssignments,
				});
				break;
			}

			case 'setCustomField': {
				const name = (actionEntry.name as string)?.trim();
				const valueRaw = actionEntry.value;

				if (!name) {
					throw new NodeOperationError(
						context.getNode(),
						'Field Name is required for Set Custom Field action',
						{ itemIndex },
					);
				}
				
			let value: string | number | boolean | object | null = null;
			if (valueRaw !== undefined && valueRaw !== '') {
				try {
					value = typeof valueRaw === 'string' ? JSON.parse(valueRaw) : valueRaw;
					} catch {
						value = valueRaw;
					}
				}

				builtActions.push({
					action: 'setCustomField',
					name,
					value,
				});
				break;
			}

			case 'setCustomFieldInAddress': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				const name = (actionEntry.name as string)?.trim();
				const valueRaw = actionEntry.value;

				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Set Custom Field in Address action',
						{ itemIndex },
					);
				}

				if (!name) {
					throw new NodeOperationError(
						context.getNode(),
						'Field Name is required for Set Custom Field in Address action',
						{ itemIndex },
					);
				}
				
			let value: string | number | boolean | object | null = null;
			if (valueRaw !== undefined && valueRaw !== '') {
				try {
					value = typeof valueRaw === 'string' ? JSON.parse(valueRaw) : valueRaw;
				} catch {
					value = valueRaw;
					}
				}

				builtActions.push({
					action: 'setCustomFieldInAddress',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
					name,
					value,
				});
				break;
			}

			case 'setDateOfBirth': {
				const dateOfBirth = (actionEntry.dateOfBirth as string)?.trim();
				builtActions.push({
					action: 'setDateOfBirth',
					dateOfBirth: dateOfBirth || undefined,
				});
				break;
			}

			case 'setDefaultBillingAddress': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Set Default Billing Address action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'setDefaultBillingAddress',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'setDefaultShippingAddress': {
				const addressId = (actionEntry.addressId as string)?.trim();
				const addressKey = (actionEntry.addressKey as string)?.trim();
				
				if (!addressId && !addressKey) {
					throw new NodeOperationError(
						context.getNode(),
						'Either Address ID or Address Key is required for Set Default Shipping Address action',
						{ itemIndex },
					);
				}

				builtActions.push({
					action: 'setDefaultShippingAddress',
					addressId: addressId || undefined,
					addressKey: addressKey || undefined,
				});
				break;
			}

			case 'setExternalId': {
				const externalId = (actionEntry.externalId as string)?.trim();
				builtActions.push({
					action: 'setExternalId',
					externalId: externalId || undefined,
				});
				break;
			}

			case 'setFirstName': {
				const firstName = (actionEntry.firstName as string)?.trim();
				builtActions.push({
					action: 'setFirstName',
					firstName: firstName || undefined,
				});
				break;
			}

			case 'setKey': {
				const key = (actionEntry.key as string)?.trim();
				builtActions.push({
					action: 'setKey',
					key: key || undefined,
				});
				break;
			}

			case 'setLastName': {
				const lastName = (actionEntry.lastName as string)?.trim();
				builtActions.push({
					action: 'setLastName',
					lastName: lastName || undefined,
				});
				break;
			}

			case 'setLocale': {
				const locale = (actionEntry.locale as string)?.trim();
				builtActions.push({
					action: 'setLocale',
					locale: locale || undefined,
				});
				break;
			}

			case 'setMiddleName': {
				const middleName = (actionEntry.middleName as string)?.trim();
				builtActions.push({
					action: 'setMiddleName',
					middleName: middleName || undefined,
				});
				break;
			}

			case 'setSalutation': {
				const salutation = (actionEntry.salutation as string)?.trim();
				builtActions.push({
					action: 'setSalutation',
					salutation: salutation || undefined,
				});
				break;
			}

			case 'setStores': {
				const stores = getMultipleIdOrKeyReferences(actionEntry, 'storeIds', 'storeKeys', 'store');
				builtActions.push({
					action: 'setStores',
					stores,
				});
				break;
			}

			case 'setTitle': {
				const title = (actionEntry.title as string)?.trim();
				builtActions.push({
					action: 'setTitle',
					title: title || undefined,
				});
				break;
			}

			case 'setVatId': {
				const vatId = (actionEntry.vatId as string)?.trim();
				builtActions.push({
					action: 'setVatId',
					vatId: vatId || undefined,
				});
				break;
			}

			default:
				throw new NodeOperationError(
					context.getNode(),
					`Unknown action type: ${actionType}`,
					{ itemIndex },
				);
		}
	}

	return builtActions;
};