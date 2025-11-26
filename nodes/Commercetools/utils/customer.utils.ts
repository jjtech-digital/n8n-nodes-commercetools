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
	}

	return builtActions;
};