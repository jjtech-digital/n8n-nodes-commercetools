import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type CommonParameterOptions = {
	allowSort?: boolean;
	allowWhere?: boolean;
	allowPredicateVariables?: boolean;
};

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
		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'addAddress')) {
			const addAddress = actionEntry.addAddress as IDataObject;
			const addressRaw = addAddress.address as string;
			
			let address: IDataObject;
			try {
				address = typeof addressRaw === 'string' ? JSON.parse(addressRaw) : addressRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Address must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'addAddress',
				address,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'addBillingAddressId')) {
			const addBillingAddressId = actionEntry.addBillingAddressId as IDataObject;
			const addressId = (addBillingAddressId.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Add Billing Address ID action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'addBillingAddressId',
				addressId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'changeEmail')) {
			const changeEmail = actionEntry.changeEmail as IDataObject;
			const email = (changeEmail.email as string)?.trim();

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
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setFirstName')) {
			const setFirstName = actionEntry.setFirstName as IDataObject;
			const firstName = setFirstName.firstName as string;

			builtActions.push({
				action: 'setFirstName',
				firstName,
			});
			continue;
		}

	
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setLastName')) {
			const setLastName = actionEntry.setLastName as IDataObject;
			const lastName = setLastName.lastName as string;

			builtActions.push({
				action: 'setLastName',
				lastName,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCompanyName')) {
			const setCompanyName = actionEntry.setCompanyName as IDataObject;
			const companyName = setCompanyName.companyName as string;

			builtActions.push({
				action: 'setCompanyName',
				companyName,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setKey')) {
			const setKey = actionEntry.setKey as IDataObject;
			const key = setKey.key as string;

			builtActions.push({
				action: 'setKey',
				key,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setExternalId')) {
			const setExternalId = actionEntry.setExternalId as IDataObject;
			const externalId = setExternalId.externalId as string;

			builtActions.push({
				action: 'setExternalId',
				externalId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomerNumber')) {
			const setCustomerNumber = actionEntry.setCustomerNumber as IDataObject;
			const customerNumber = setCustomerNumber.customerNumber as string;

			builtActions.push({
				action: 'setCustomerNumber',
				customerNumber,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setDateOfBirth')) {
			const setDateOfBirth = actionEntry.setDateOfBirth as IDataObject;
			const dateOfBirth = setDateOfBirth.dateOfBirth as string;

			builtActions.push({
				action: 'setDateOfBirth',
				dateOfBirth,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setLocale')) {
			const setLocale = actionEntry.setLocale as IDataObject;
			const locale = setLocale.locale as string;

			builtActions.push({
				action: 'setLocale',
				locale,
			});
			continue;
		}

	
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setMiddleName')) {
			const setMiddleName = actionEntry.setMiddleName as IDataObject;
			const middleName = setMiddleName.middleName as string;

			builtActions.push({
				action: 'setMiddleName',
				middleName,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setSalutation')) {
			const setSalutation = actionEntry.setSalutation as IDataObject;
			const salutation = setSalutation.salutation as string;

			builtActions.push({
				action: 'setSalutation',
				salutation,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setTitle')) {
			const setTitle = actionEntry.setTitle as IDataObject;
			const title = setTitle.title as string;

			builtActions.push({
				action: 'setTitle',
				title,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setVatId')) {
			const setVatId = actionEntry.setVatId as IDataObject;
			const vatId = setVatId.vatId as string;

			builtActions.push({
				action: 'setVatId',
				vatId,
			});
			continue;
		}

		
		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'addCustomerGroupAssignment')) {
			const addCustomerGroupAssignment = actionEntry.addCustomerGroupAssignment as IDataObject;
			const customerGroupRaw = addCustomerGroupAssignment.customerGroup as string;
			
			let customerGroup: IDataObject;
			try {
				customerGroup = typeof customerGroupRaw === 'string' ? JSON.parse(customerGroupRaw) : customerGroupRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Customer Group must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'addCustomerGroupAssignment',
				customerGroup,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomField')) {
			const setCustomField = actionEntry.setCustomField as IDataObject;
			const name = (setCustomField.name as string)?.trim();
			const valueRaw = setCustomField.value;

			if (!name) {
				throw new NodeOperationError(
					context.getNode(),
					'Field name is required for Set Custom Field action',
					{ itemIndex },
				);
			}

			let value: string | IDataObject | unknown;
			if (typeof valueRaw === 'string') {
				try {
					value = JSON.parse(valueRaw);
				} catch {
					value = valueRaw;
				}
			} else {
				value = valueRaw;
			}

			builtActions.push({
				action: 'setCustomField',
				name,
				value: value as string | IDataObject,
			});
			continue;
		}

	
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'addShippingAddressId')) {
			const addShippingAddressId = actionEntry.addShippingAddressId as IDataObject;
			const addressId = (addShippingAddressId.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Add Shipping Address ID action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'addShippingAddressId',
				addressId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'addStore')) {
			const addStore = actionEntry.addStore as IDataObject;
			const storeRaw = addStore.store as string;
			
			let store: IDataObject;
			try {
				store = typeof storeRaw === 'string' ? JSON.parse(storeRaw) : storeRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Store must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'addStore',
				store,
			});
			continue;
		}

	
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'changeAddress')) {
			const changeAddress = actionEntry.changeAddress as IDataObject;
			const addressId = (changeAddress.addressId as string)?.trim();
			const addressRaw = changeAddress.address as string;

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Change Address action',
					{ itemIndex },
				);
			}
			
			let address: IDataObject;
			try {
				address = typeof addressRaw === 'string' ? JSON.parse(addressRaw) : addressRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Address must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'changeAddress',
				addressId,
				address,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'removeAddress')) {
			const removeAddress = actionEntry.removeAddress as IDataObject;
			const addressId = (removeAddress.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Remove Address action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'removeAddress',
				addressId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'removeBillingAddressId')) {
			const removeBillingAddressId = actionEntry.removeBillingAddressId as IDataObject;
			const addressId = (removeBillingAddressId.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Remove Billing Address ID action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'removeBillingAddressId',
				addressId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'removeCustomerGroupAssignment')) {
			const removeCustomerGroupAssignment = actionEntry.removeCustomerGroupAssignment as IDataObject;
			const customerGroupRaw = removeCustomerGroupAssignment.customerGroup as string;
			
			let customerGroup: IDataObject;
			try {
				customerGroup = typeof customerGroupRaw === 'string' ? JSON.parse(customerGroupRaw) : customerGroupRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Customer Group must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'removeCustomerGroupAssignment',
				customerGroup,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'removeShippingAddressId')) {
			const removeShippingAddressId = actionEntry.removeShippingAddressId as IDataObject;
			const addressId = (removeShippingAddressId.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Remove Shipping Address ID action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'removeShippingAddressId',
				addressId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'removeStore')) {
			const removeStore = actionEntry.removeStore as IDataObject;
			const storeRaw = removeStore.store as string;
			
			let store: IDataObject;
			try {
				store = typeof storeRaw === 'string' ? JSON.parse(storeRaw) : storeRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Store must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'removeStore',
				store,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setAuthenticationMode')) {
			const setAuthenticationMode = actionEntry.setAuthenticationMode as IDataObject;
			const authMode = setAuthenticationMode.authMode as string;
			const password = setAuthenticationMode.password as string;

			const action: IDataObject = {
				action: 'setAuthenticationMode',
				authMode,
			};

			if (authMode === 'Password' && password) {
				action.password = password;
			}

			builtActions.push(action);
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomType')) {
			const setCustomType = actionEntry.setCustomType as IDataObject;
			const typeRaw = setCustomType.type as string;
			const fieldsRaw = setCustomType.fields as string;
			
			let type: IDataObject;
			let fields: IDataObject;
			
			try {
				type = typeof typeRaw === 'string' ? JSON.parse(typeRaw) : typeRaw;
				fields = typeof fieldsRaw === 'string' ? JSON.parse(fieldsRaw) : fieldsRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Type and Fields must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setCustomType',
				type,
				fields,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomTypeInAddress')) {
			const setCustomTypeInAddress = actionEntry.setCustomTypeInAddress as IDataObject;
			const addressId = (setCustomTypeInAddress.addressId as string)?.trim();
			const typeRaw = setCustomTypeInAddress.type as string;
			const fieldsRaw = setCustomTypeInAddress.fields as string;

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Set Custom Type in Address action',
					{ itemIndex },
				);
			}
			
			let type: IDataObject;
			let fields: IDataObject;
			
			try {
				type = typeof typeRaw === 'string' ? JSON.parse(typeRaw) : typeRaw;
				fields = typeof fieldsRaw === 'string' ? JSON.parse(fieldsRaw) : fieldsRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Type and Fields must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setCustomTypeInAddress',
				addressId,
				type,
				fields,
			});
			continue;
		}

	
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomerGroup')) {
			const setCustomerGroup = actionEntry.setCustomerGroup as IDataObject;
			const customerGroupRaw = setCustomerGroup.customerGroup as string;
			
			let customerGroup: IDataObject;
			try {
				customerGroup = typeof customerGroupRaw === 'string' ? JSON.parse(customerGroupRaw) : customerGroupRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Customer Group must be valid JSON',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setCustomerGroup',
				customerGroup,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomerGroupAssignments')) {
			const setCustomerGroupAssignments = actionEntry.setCustomerGroupAssignments as IDataObject;
			const customerGroupAssignmentsRaw = setCustomerGroupAssignments.customerGroupAssignments as string;
			
			let customerGroupAssignments: IDataObject[];
			try {
				customerGroupAssignments = typeof customerGroupAssignmentsRaw === 'string' ? JSON.parse(customerGroupAssignmentsRaw) : customerGroupAssignmentsRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Customer Group Assignments must be valid JSON array',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setCustomerGroupAssignments',
				customerGroupAssignments,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setCustomFieldInAddress')) {
			const setCustomFieldInAddress = actionEntry.setCustomFieldInAddress as IDataObject;
			const addressId = (setCustomFieldInAddress.addressId as string)?.trim();
			const name = (setCustomFieldInAddress.name as string)?.trim();
			const valueRaw = setCustomFieldInAddress.value;

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Set Custom Field in Address action',
					{ itemIndex },
				);
			}

			if (!name) {
				throw new NodeOperationError(
					context.getNode(),
					'Field name is required for Set Custom Field in Address action',
					{ itemIndex },
				);
			}

			let value: string | IDataObject | unknown;
			if (typeof valueRaw === 'string') {
				try {
					value = JSON.parse(valueRaw);
				} catch {
					value = valueRaw;
				}
			} else {
				value = valueRaw;
			}

			builtActions.push({
				action: 'setCustomFieldInAddress',
				addressId,
				name,
				value: value as string | IDataObject,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setDefaultBillingAddress')) {
			const setDefaultBillingAddress = actionEntry.setDefaultBillingAddress as IDataObject;
			const addressId = (setDefaultBillingAddress.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Set Default Billing Address action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setDefaultBillingAddress',
				addressId,
			});
			continue;
		}

	
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setDefaultShippingAddress')) {
			const setDefaultShippingAddress = actionEntry.setDefaultShippingAddress as IDataObject;
			const addressId = (setDefaultShippingAddress.addressId as string)?.trim();

			if (!addressId) {
				throw new NodeOperationError(
					context.getNode(),
					'Address ID is required for Set Default Shipping Address action',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setDefaultShippingAddress',
				addressId,
			});
			continue;
		}

		
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setStores')) {
			const setStores = actionEntry.setStores as IDataObject;
			const storesRaw = setStores.stores as string;
			
			let stores: IDataObject[];
			try {
				stores = typeof storesRaw === 'string' ? JSON.parse(storesRaw) : storesRaw;
			} catch {
				throw new NodeOperationError(
					context.getNode(),
					'Stores must be valid JSON array',
					{ itemIndex },
				);
			}

			builtActions.push({
				action: 'setStores',
				stores,
			});
			continue;
		}
	}

	return builtActions;
};