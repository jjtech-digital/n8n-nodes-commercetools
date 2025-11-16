import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type CommonParameterOptions = {
	allowSort?: boolean;
	allowWhere?: boolean;
	allowPredicateVariables?: boolean;
};

export const applyCommonParameters = (
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

	const setValueField = (fieldName: string, queryName: string) => {
		const value = additionalFields[fieldName];
		if (value !== undefined && value !== null && value !== '') {
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

	setArrayField('localeProjection', 'localeProjection');
	setArrayField('storeProjection', 'storeProjection');

	if (Object.prototype.hasOwnProperty.call(additionalFields, 'staged')) {
		qs.staged = additionalFields.staged as boolean;
	}

	setValueField('priceCurrency', 'priceCurrency');
	setValueField('priceCountry', 'priceCountry');
	setValueField('priceCustomerGroup', 'priceCustomerGroup');
	setValueField('priceChannel', 'priceChannel');

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
		if (Object.prototype.hasOwnProperty.call(actionEntry, 'setProductKey')) {
			const setProductKey = actionEntry.setProductKey as IDataObject;
			const removeKey = Boolean(setProductKey.removeKey);
			const rawKey = (setProductKey.key as string | undefined)?.trim();

			const action: IDataObject = { action: 'setKey' };

			if (removeKey) {
				action.key = null;
			} else {
				if (!rawKey) {
					throw new NodeOperationError(
						context.getNode(),
						'New product key is required when Remove Key is not enabled',
						{ itemIndex },
					);
				}

				action.key = rawKey;
			}

			builtActions.push(action);
			continue;
		}

		if (Object.prototype.hasOwnProperty.call(actionEntry, 'changeProductName')) {
			const changeProductName = actionEntry.changeProductName as IDataObject;
			const localizedNamesRaw = (changeProductName.localizedNames as IDataObject) ?? {};
			const localizedValuesRaw = localizedNamesRaw.value;
			const localizedValues = Array.isArray(localizedValuesRaw)
				? (localizedValuesRaw as IDataObject[])
				: localizedValuesRaw
				? [localizedValuesRaw as IDataObject]
				: [];

			if (localizedValues.length === 0) {
				throw new NodeOperationError(
					context.getNode(),
					'At least one localized name is required for Change Product Name',
					{ itemIndex },
				);
			}

			const name: IDataObject = {};

			for (const localized of localizedValues) {
				const locale = (localized.locale as string | undefined)?.trim();
				const value = localized.value as string | undefined;

				if (!locale) {
					throw new NodeOperationError(context.getNode(), 'Locale is required for each localized product name', {
						itemIndex,
					});
				}

				if (value === undefined || value === '') {
					throw new NodeOperationError(
						context.getNode(),
						`Name value is required for locale "${locale}"`,
						{ itemIndex },
					);
				}

				name[locale] = value;
			}

			const action: IDataObject = {
				action: 'changeName',
				name,
			};

			if (Object.prototype.hasOwnProperty.call(changeProductName, 'staged')) {
				action.staged = changeProductName.staged as boolean;
			}

			builtActions.push(action);
		}
	}

	return builtActions;
};

export const coerceActions = (context: IExecuteFunctions, rawActions: unknown, itemIndex: number): IDataObject[] => {
	let actions = rawActions;

	if (typeof actions === 'string') {
		try {
			actions = JSON.parse(actions);
		} catch {
			throw new NodeOperationError(
				context.getNode(),
				'Actions must be valid JSON when provided as a string',
				{ itemIndex },
			);
		}
	}

	if (!Array.isArray(actions)) {
		throw new NodeOperationError(context.getNode(), 'Actions must be provided as an array', {
			itemIndex,
		});
	}

	for (const action of actions as unknown[]) {
		if (typeof action !== 'object' || action === null || Array.isArray(action)) {
			throw new NodeOperationError(context.getNode(), 'Each update action must be an object', {
				itemIndex,
			});
		}
	}

	return actions as IDataObject[];
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

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new NodeOperationError(context.getNode(), `${label} must be a JSON object`, {
			itemIndex,
		});
	}

	return value as IDataObject;
};
