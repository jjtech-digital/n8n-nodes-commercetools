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

// Helper function to parse value based on type
function parseAttributeValue(value: string, type: string): any {
	try {
		switch (type) {
			case 'string':
				return value;

			case 'number':
				const num = Number(value);
				if (isNaN(num)) {
					throw new Error(`Cannot convert "${value}" to number`);
				}
				return num;

			case 'boolean':
				const lowerValue = value.toLowerCase().trim();
				if (lowerValue === 'true' || lowerValue === '1') return true;
				if (lowerValue === 'false' || lowerValue === '0') return false;
				throw new Error(`Cannot convert "${value}" to boolean. Use: true, false, 1, or 0`);

			default:
				return value;
		}
	} catch (error) {
		throw new Error(`Failed to parse value as ${type}: ${error.message}`);
	}
}

// Now attributeValue has the correct type!
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
	const attributesActions = ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'];
	for (const action of actionEntries) {
		const localized = preprocessLocalizedFields(action);
		let finalAction = transformFlatCategoryId(localized);
		// setting attribute to any type like attribute can be number, string and boolaean
		if (attributesActions.includes(action?.action as string)) {
			const attributeValue = parseAttributeValue(action?.value as string, action?.valueType as string);
			finalAction = {
				...action,
				value: attributeValue
			}
			delete finalAction?.valueType;
		}

		// if setPrices, map the values with preprocessing
		if (action?.action === 'setPrices') {
			const pricesData = (action?.prices as IDataObject)?.price as IDataObject[] || [];
			// Transform the fixedCollection format to your required format
			const modifiedPrices = pricesData?.map((price) => ({
				value: {
					currencyCode: price.currencyCode as string,
					centAmount: price.centAmount as number,
				},
			}));
			finalAction = {
				...action,
				prices: modifiedPrices,
			};
		}

		if (action?.action === 'addExternalImage') {
			const imageDetails = (action?.image as IDataObject)?.imageDetails as IDataObject
			const sizeData = (imageDetails?.dimensions as IDataObject)?.size as IDataObject
			const dimensions = {
				h: sizeData?.h as number || null,
				w: sizeData?.w as number || null
			}
			finalAction = {
				...action,
				image: {
					url: imageDetails?.url,
					label: imageDetails?.label,
					dimensions: dimensions
				}
			}
		}

    if (action?.action === 'setProductPriceCustomType') {

      // Initialize flatFields as empty object
      const flatFields: IDataObject = {};

      // Handle both single field object and field array structures
      if (action.fields) {
        // Case 1: Direct single field object with name/value
        if (
          typeof action.fields === 'object' &&
          'name' in (action.fields as IDataObject) &&
          'value' in (action.fields as IDataObject)
        ) {
          const fieldName = (action.fields as IDataObject).name as string;
          const fieldValue = (action.fields as IDataObject).value;
          if (fieldName) {
            flatFields[fieldName] = fieldValue;
          }
        }
        // Case 2: Object with field array 
        else if (
          typeof action.fields === 'object' &&
          'field' in (action.fields as IDataObject) &&
          Array.isArray((action.fields as IDataObject).field)
        ) {
          const fieldArray = (action.fields as IDataObject).field;
          if (Array.isArray(fieldArray)) {
            for (const fieldItem of fieldArray) {
              if (
                typeof fieldItem === 'object' &&
                'name' in fieldItem &&
                'value' in fieldItem
              ) {
                const fieldName = fieldItem.name as string;
                const fieldValue = fieldItem.value;
                if (fieldName) {
                  flatFields[fieldName] = fieldValue;
                }
              }
            }
          }
        }
      }

      // Flatten type to have 'id' and 'typeId' directly under 'type'
      let flatType: IDataObject = { id: '', typeId: 'type' };
      if (
        action.type &&
        typeof action.type === 'object' &&
        'typeReference' in (action.type as IDataObject) &&
        typeof (action.type as IDataObject).typeReference === 'object'
      ) {
        const typeRef = (action.type as IDataObject).typeReference as IDataObject;
        flatType = {
          id: typeof typeRef.id === 'string' ? typeRef.id : '',
          typeId: typeof typeRef.typeId === 'string' ? typeRef.typeId : 'type',
        };
      }

      finalAction = {
        ...action,
        fields: flatFields,
        type: flatType,
      };
    }

		if (action?.action === 'addToCategory' || action?.action === 'removeFromCategory') {
			finalAction = {
				...action,
				category: (action?.category as IDataObject)?.categoryDetails
			}
		}

		if (action?.action === 'setTaxCategory') {
			finalAction = {
				...action,
				taxCategory: (action?.taxCategory as IDataObject)?.taxCategoryDetails
			}
		}

		if (action?.action === 'setAssetSources') {
			const flatSources = (action.sources && typeof action.sources === 'object' && 'source' in action.sources)
				? (action.sources.source as IDataObject[])
				: [];

			finalAction = {
				...action,
				sources: flatSources
			};
		}

		if (action?.action === 'setAssetCustomType') {

			// Initialize flatFields as empty object
			const flatFields: IDataObject = {};

			if (
				action.fields &&
				typeof action.fields === 'object' &&
				'name' in (action.fields as IDataObject) &&
				'value' in (action.fields as IDataObject)
			) {

				const fieldName = (action.fields as IDataObject).name as string;
				const fieldValue = (action.fields as IDataObject).value;
				if (fieldName) {
					flatFields[fieldName] = fieldValue;
				}
			}


			// Flatten type to have 'id' and 'typeId' directly under 'type'
			let flatType: IDataObject = { id: '', typeId: 'type' };
			if (
				action.type &&
				typeof action.type === 'object' &&
				'typeReference' in (action.type as IDataObject) &&
				typeof (action.type as IDataObject).typeReference === 'object'
			) {
				const typeRef = (action.type as IDataObject).typeReference as IDataObject;
				flatType = {
					id: typeof typeRef.id === 'string' ? typeRef.id : '',
					typeId: typeof typeRef.typeId === 'string' ? typeRef.typeId : 'type',
				};
			}

			finalAction = {
				...action,
				fields: flatFields,
				type: flatType,
			};
		}

    if (action?.action === 'addAsset') {

      finalAction = {
        ...action,
        asset: {
          ...action.asset as IDataObject,
          name: localized.name
        }
      }
      delete finalAction?.name;

    }
    
    if (finalAction?.identifyBy) {
      delete finalAction?.identifyBy;
    }
    console.log("FINAL", finalAction)
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
