import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Options for controlling which query parameters are allowed in Commercetools API calls
 */
type CommonParameterOptions = {
	/** Allow sort parameters for ordering results */
	allowSort?: boolean;
	/** Allow where predicates for filtering results */
	allowWhere?: boolean;
	/** Allow predicate variables for parameterized queries */
	allowPredicateVariables?: boolean;
};

/**
 * Commercetools reference types for type-safe reference handling
 */
type CommerceToolsReference = {
	typeId: 'customer-group' | 'store' | 'type' | 'address' | 'tax-category';
	id?: string;
	key?: string;
};

/**
 * Address data structure for Commercetools addresses
 */
type CommerceToolsAddress = {
	key?: string;
	title?: string;
	firstName?: string;
	lastName?: string;
	streetName?: string;
	streetNumber?: string;
	city?: string;
	postalCode?: string;
	country: string; // Required field
	state?: string;
	building?: string;
	apartment?: string;
	department?: string;
	phone?: string;
	mobile?: string;
	email?: string;
	fax?: string;
	pOBox?: string;
	additionalAddressInfo?: string;
	additionalStreetInfo?: string;
};

/**
 * Union type for all supported customer update actions
 */
type CustomerActionType = 
	| 'addAddress'
	| 'addBillingAddressId'
	| 'addCustomerGroupAssignment'
	| 'addShippingAddressId'
	| 'addStore'
	| 'changeAddress'
	| 'changeEmail'
	| 'removeAddress'
	| 'removeBillingAddressId'
	| 'removeCustomerGroupAssignment'
	| 'removeShippingAddressId'
	| 'removeStore'
	| 'setAuthenticationMode'
	| 'setCompanyName'
	| 'setCustomType'
	| 'setCustomTypeInAddress'
	| 'setCustomerNumber'
	| 'setCustomerGroup'
	| 'setCustomerGroupAssignments'
	| 'setCustomField'
	| 'setCustomFieldInAddress'
	| 'setCustomerStatus'
	| 'setDateOfBirth'
	| 'setDefaultBillingAddress'
	| 'setDefaultShippingAddress'
	| 'setEmailVerified'
	| 'setExternalId'
	| 'setFirstName'
	| 'setGender'
	| 'setKey'
	| 'setLanguage'
	| 'setLastName'
	| 'setLocale'
	| 'setMiddleName'
	| 'setMobileNumber'
	| 'setPhoneNumber'
	| 'setSalutation'
	| 'setStores'
	| 'setTaxCategory'
	| 'setTitle'
	| 'setVatId';



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
	
		
	/**
	 * Creates a properly typed address object from UI form fields
	 * @param entry - Form data entry containing address fields
	 * @returns Typed address object for Commercetools API
	 */
	const buildAddressFromFields = (entry: IDataObject): CommerceToolsAddress => {
		const address: Partial<CommerceToolsAddress> = {};
		
		// Optional fields
		if (entry.key && typeof entry.key === 'string') address.key = entry.key.trim();
		if (entry.title && typeof entry.title === 'string') address.title = entry.title.trim();
		if (entry.firstName && typeof entry.firstName === 'string') address.firstName = entry.firstName.trim();
		if (entry.lastName && typeof entry.lastName === 'string') address.lastName = entry.lastName.trim();
		if (entry.streetName && typeof entry.streetName === 'string') address.streetName = entry.streetName.trim();
		if (entry.streetNumber && typeof entry.streetNumber === 'string') address.streetNumber = entry.streetNumber.trim();
		if (entry.city && typeof entry.city === 'string') address.city = entry.city.trim();
		if (entry.postalCode && typeof entry.postalCode === 'string') address.postalCode = entry.postalCode.trim();
		if (entry.state && typeof entry.state === 'string') address.state = entry.state.trim();
		if (entry.building && typeof entry.building === 'string') address.building = entry.building.trim();
		if (entry.apartment && typeof entry.apartment === 'string') address.apartment = entry.apartment.trim();
		if (entry.department && typeof entry.department === 'string') address.department = entry.department.trim();
		if (entry.phone && typeof entry.phone === 'string') address.phone = entry.phone.trim();
		if (entry.mobile && typeof entry.mobile === 'string') address.mobile = entry.mobile.trim();
		if (entry.addressEmail && typeof entry.addressEmail === 'string') address.email = entry.addressEmail.trim();
		if (entry.fax && typeof entry.fax === 'string') address.fax = entry.fax.trim();
		if (entry.pOBox && typeof entry.pOBox === 'string') address.pOBox = entry.pOBox.trim();
		if (entry.additionalAddressInfo && typeof entry.additionalAddressInfo === 'string') {
			address.additionalAddressInfo = entry.additionalAddressInfo.trim();
		}
		if (entry.additionalStreetInfo && typeof entry.additionalStreetInfo === 'string') {
			address.additionalStreetInfo = entry.additionalStreetInfo.trim();
		}

		// Country is required for addresses
		if (entry.country && typeof entry.country === 'string') {
			address.country = entry.country.trim();
		}

		return address as CommerceToolsAddress;
	};

	/**
	 * Creates a typed Commercetools reference from ID or Key with validation
	 * @param entry - Form data entry
	 * @param idField - Name of the ID field
	 * @param keyField - Name of the Key field
	 * @param referenceType - Type of the reference (customer-group, store, etc.)
	 * @returns Typed Commercetools reference
	 * @throws NodeOperationError if neither ID nor Key is provided
	 */
	const getIdOrKeyReference = (
		entry: IDataObject,
		idField: string,
		keyField: string,
		referenceType: CommerceToolsReference['typeId']
	): CommerceToolsReference => {
		const id = typeof entry[idField] === 'string' ? entry[idField].trim() : '';
		const key = typeof entry[keyField] === 'string' ? entry[keyField].trim() : '';

		if (id) {
			return { typeId: referenceType, id };
		} else if (key) {
			return { typeId: referenceType, key };
		} else {
			throw new NodeOperationError(
				context.getNode(),
				`Either ${idField} or ${keyField} is required for ${referenceType} reference`,
				{ itemIndex },
			);
		}
	};

	/**
	 * Creates multiple typed Commercetools references from IDs or Keys
	 * Supports both array and comma-separated string formats for backward compatibility
	 * @param entry - Form data entry
	 * @param idsField - Name of the IDs field
	 * @param keysField - Name of the Keys field
	 * @param referenceType - Type of the references
	 * @returns Array of typed Commercetools references
	 * @throws NodeOperationError if no valid references are provided
	 */
	const getMultipleIdOrKeyReferences = (
		entry: IDataObject,
		idsField: string,
		keysField: string,
		referenceType: CommerceToolsReference['typeId']
	): CommerceToolsReference[] => {
		const idsRaw = entry[idsField];
		const keysRaw = entry[keysField];

		// Handle array format (from multi-select dropdowns)
		if (Array.isArray(idsRaw) && idsRaw.length > 0) {
			return idsRaw
				.map(id => String(id).trim())
				.filter(id => id.length > 0)
				.map(id => ({ typeId: referenceType, id }));
		} else if (Array.isArray(keysRaw) && keysRaw.length > 0) {
			return keysRaw
				.map(key => String(key).trim())
				.filter(key => key.length > 0)
				.map(key => ({ typeId: referenceType, key }));
		}

		// Handle string format (comma-separated, for backward compatibility)
		const ids = typeof idsRaw === 'string' ? idsRaw.trim() : '';
		const keys = typeof keysRaw === 'string' ? keysRaw.trim() : '';

		if (ids) {
			return ids
				.split(',')
				.map(id => id.trim())
				.filter(id => id.length > 0)
				.map(id => ({ typeId: referenceType, id }));
		} else if (keys) {
			return keys
				.split(',')
				.map(key => key.trim())
				.filter(key => key.length > 0)
				.map(key => ({ typeId: referenceType, key }));
		} else {
			throw new NodeOperationError(
				context.getNode(),
				`Either ${idsField} or ${keysField} is required for ${referenceType} references`,
				{ itemIndex },
			);
		}
	};

	/**
	 * Safely parses and validates custom field values
	 * @param valueRaw - Raw value from form
	 * @returns Parsed value or original if not JSON
	 */
	const parseCustomFieldValue = (valueRaw: unknown): string | number | boolean | object | null => {
		if (valueRaw === undefined || valueRaw === '') {
			return null;
		}
		
		try {
			return typeof valueRaw === 'string' ? JSON.parse(valueRaw) : valueRaw;
		} catch {
			return valueRaw;
		}
	};

	/**
	 * Builds custom fields object from fixedCollection format
	 * @param entry - Form data entry containing customFields
	 * @returns Custom fields object for Commercetools API
	 */
	const buildCustomFieldsFromCollection = (entry: IDataObject): IDataObject => {

		const customFields: IDataObject = {};
		const customFieldsData = entry.customFields as IDataObject;
	
		
		if (customFieldsData && customFieldsData.field) {
			const fields = Array.isArray(customFieldsData.field) ? customFieldsData.field : [customFieldsData.field];
			
			for (const field of fields as IDataObject[]) {
				const name = (field.name as string)?.trim();
				const value = field.value;
				
				if (name) {
					// Try to parse value as JSON, fallback to string
					customFields[name] = parseCustomFieldValue(value);
				}
			}
		}
		
	
		return customFields;
	};

	for (const actionEntry of actionEntries) {
		const actionType = actionEntry.actionType as CustomerActionType;

		if (!actionType) {
			throw new NodeOperationError(
				context.getNode(),
				'Action Type is required for each action',
				{ itemIndex },
			);
		}

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
				const fields = buildCustomFieldsFromCollection(actionEntry);

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
				const fields = buildCustomFieldsFromCollection(actionEntry);

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
				
				const value = parseCustomFieldValue(valueRaw);

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
				
				const value = parseCustomFieldValue(valueRaw);

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

			case 'setCustomerStatus': {
				if (actionEntry.customerStatus === undefined) {
					throw new NodeOperationError(context.getNode(), 'Customer status is required for setCustomerStatus action', {
						itemIndex,
					});
				}

				builtActions.push({
					action: 'setCustomerStatus',
					isActive: Boolean(actionEntry.customerStatus),
				});
				break;
			}

			case 'setEmailVerified': {
				if (actionEntry.emailVerified === undefined) {
					throw new NodeOperationError(context.getNode(), 'Email verified status is required for setEmailVerified action', {
						itemIndex,
					});
				}

				builtActions.push({
					action: 'setEmailVerified',
					isEmailVerified: Boolean(actionEntry.emailVerified),
				});
				break;
			}

			case 'setGender': {
				const gender = (actionEntry.gender as string)?.trim();
				if (!gender) {
					throw new NodeOperationError(context.getNode(), 'Gender is required for setGender action', {
						itemIndex,
					});
				}

				builtActions.push({
					action: 'setGender',
					gender,
				});
				break;
			}

			case 'setLanguage': {
				const language = (actionEntry.language as string)?.trim();
				if (!language) {
					throw new NodeOperationError(context.getNode(), 'Language is required for setLanguage action', {
						itemIndex,
					});
				}

				builtActions.push({
					action: 'setLanguage',
					language,
				});
				break;
			}

			case 'setMobileNumber': {
				const mobileNumber = (actionEntry.mobileNumber as string)?.trim();
				builtActions.push({
					action: 'setMobileNumber',
					mobile: mobileNumber || undefined,
				});
				break;
			}

			case 'setPhoneNumber': {
				const phoneNumber = (actionEntry.phoneNumber as string)?.trim();
				builtActions.push({
					action: 'setPhoneNumber',
					phone: phoneNumber || undefined,
				});
				break;
			}

			case 'setTaxCategory': {
				if (!actionEntry.taxCategoryId && !actionEntry.taxCategoryKey) {
					throw new NodeOperationError(context.getNode(), 'Tax category ID or key is required for setTaxCategory action', {
						itemIndex,
					});
				}

				const taxCategoryRef: CommerceToolsReference = {
					typeId: 'tax-category',
				};

				if (actionEntry.taxCategoryId) {
					taxCategoryRef.id = String(actionEntry.taxCategoryId);
				} else if (actionEntry.taxCategoryKey) {
					taxCategoryRef.key = String(actionEntry.taxCategoryKey);
				}

				builtActions.push({
					action: 'setTaxCategory',
					taxCategory: taxCategoryRef,
				});
				break;
			}

		}
	}


	return builtActions;
};