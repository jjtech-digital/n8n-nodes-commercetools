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


/**
 * Recursively transforms any property named 'name', 'description', 'slug', etc. containing a localizedField array into a locale-keyed object.
 */
export function preprocessLocalizedFields(obj: IDataObject): IDataObject {
	function transform(value: IDataObject): IDataObject {
		// Only process objects (not arrays or primitives)
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const newObj: IDataObject = {};
			for (const key of Object.keys(value)) {
				const currentValue = value[key] as IDataObject;

				// Handle localizedField property
				if (currentValue && typeof currentValue === 'object' && 'localizedField' in currentValue) {
					const localizedArr = currentValue.localizedField;
					if (Array.isArray(localizedArr)) {
						newObj[key] = {};
						for (const loc of localizedArr) {
							if (loc && typeof loc === 'object') {
								const locale = typeof loc.locale === 'string' ? loc.locale.trim() : '';
								const val = loc.value;
								if (locale && val !== undefined && val !== '') {
									(newObj[key] as IDataObject)[locale] = val;
								}
							}
						}
					} else {
						newObj[key] = currentValue;
					}
				} else {
					// Recursively transform nested values
					newObj[key] = transform(currentValue);
				}
			}
			return newObj;
		}
		// Return primitives and arrays as-is
		return value;
	}
	return transform(obj) as IDataObject;


}
/**
 * Transforms categoryId and categoryReference fields to nested category object for specific actions
 */
function transformFlatCategoryId(actionObj: IDataObject): IDataObject {
	// Handle flat categoryId for addToCategory, removeFromCategory
	if (
		actionObj && typeof actionObj === 'object' &&
		typeof actionObj.categoryId === 'string' && actionObj.categoryId !== '' &&
		typeof actionObj.action === 'string' && ['addToCategory', 'removeFromCategory'].includes(actionObj.action)
	) {
		return {
			...actionObj,
			category: {
				typeId: 'category',
				id: actionObj.categoryId,
			},
		};
	}

	// Handle categoryReference array for addToCategory
	if (
		actionObj && typeof actionObj === 'object' &&
		actionObj.category && typeof actionObj.category === 'object'
	) {
		const categoryObj = actionObj.category as IDataObject;
		if (Array.isArray(categoryObj.categoryReference) && categoryObj.categoryReference.length > 0) {
			const ref = categoryObj.categoryReference[0] as IDataObject | undefined;
			if (ref && typeof ref === 'object' && ref.typeId && (ref.id || ref.key)) {
				return {
					...actionObj,
					category: {
						typeId: ref.typeId,
						...(ref.id ? { id: ref.id } : {}),
						...(ref.key ? { key: ref.key } : {}),
					},
				};
			}
		}
	}
	return actionObj;
}

export const buildActionsFromUi = (
	context: IExecuteFunctions,
	actionsUi: IDataObject,
	itemIndex: number,
): IDataObject[] => {
	const builtActions: IDataObject[] = [];
	const rawActionEntries = actionsUi.action;
	let actionEntries: IDataObject[] = [];

	if (Array.isArray(rawActionEntries)) {
		actionEntries = rawActionEntries as IDataObject[];
	} else if (rawActionEntries) {
		actionEntries = [rawActionEntries as IDataObject];
	}

	for (const action of actionEntries) {
		const localized = preprocessLocalizedFields(action);
		const finalAction = transformFlatCategoryId(localized);
		builtActions.push(finalAction);
	}
	return builtActions;
}

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
