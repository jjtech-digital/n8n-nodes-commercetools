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
  function transform(value: any): any {
    if (Array.isArray(value)) {
      return value.map((entry) => (entry && typeof entry === 'object' ? transform(entry) : entry));
    }

    if (value && typeof value === 'object') {
      const newObj: IDataObject = {};
      for (const key of Object.keys(value)) {
        const currentValue = value[key];

        if (currentValue && typeof currentValue === 'object' && 'localizedField' in currentValue) {

          const localizedArr = currentValue.localizedField;
          if (Array.isArray(localizedArr)) {
            newObj[key] = {};
            for (const loc of localizedArr) {
              if (loc && typeof loc === 'object') {
                const locale = typeof loc.locale === 'string' ? loc.locale.trim() : '';
                const val = loc.value;
                if (locale && val !== undefined && val !== null) {
                  (newObj[key] as IDataObject)[locale] = val;
                }
              }
            }
          } else {
            newObj[key] = currentValue;
          }
        } else {
          newObj[key] = transform(currentValue);
        }
      }
      return newObj;
    }

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
    throw new Error(`Failed to parse value as ${type}: ${(error as Error)?.message || String(error)}`);
  }
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
  const attributesActions = ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'];
  for (const action of actionEntries) {
    const localized = preprocessLocalizedFields(action);
    let finalAction = transformFlatCategoryId(localized);
    // setting attribute to any type like attribute can be number, string and boolean
    if (attributesActions.includes(action?.action as string)) {
      const attributeValue = parseAttributeValue(action?.value as string, action?.valueType as string);
      finalAction = {
        ...action,
        value: attributeValue
      }
      delete finalAction?.valueType;
    }

    // Map the fixedCollection price format to the API draft for supported actions
    if (['setPrices', 'addVariant'].includes((action?.action as string) ?? '')) {
      const pricesData = (((finalAction?.prices as IDataObject) ?? {})?.price ?? []) as IDataObject[];
      const modifiedPrices = pricesData
        .filter((price) => price?.currencyCode)
        .map((price) => {
          const value: IDataObject = {
            currencyCode: price.currencyCode as string,
            centAmount: price.centAmount as number,
          };
          const formattedPrice: IDataObject = { value };
          if (price.country) {
            formattedPrice.country = price.country;
          }
          return formattedPrice;
        });

      if (modifiedPrices.length) {
        finalAction = {
          ...finalAction,
          prices: modifiedPrices,
        };
      } else {
        delete finalAction.prices;
      }
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
      const categoryDetails = (action?.category as IDataObject)?.categoryDetails;
      if (categoryDetails) {
        finalAction = {
          ...action,
          category: categoryDetails,
        };
      } else {
        finalAction = { ...action };
      }
    }

    if (action?.action === 'setTaxCategory') {
      const taxCategoryDetails = (action?.taxCategory as IDataObject)?.taxCategoryDetails;
      finalAction = {
        ...action,
        ...(taxCategoryDetails ? { taxCategory: taxCategoryDetails } : {}),
      };
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

    if (action?.action === 'setSearchKeywords') {
      const keys = Object.keys(finalAction.searchKeywords as IDataObject);
      const searchKeywordsObj: IDataObject = {};
      for (const key of keys) {
        searchKeywordsObj[key] = ((finalAction.searchKeywords as IDataObject)[key] as IDataObject)?.keyword as IDataObject[];
        const processedTokenizer = (searchKeywordsObj[key] as IDataObject[]).map((keywordObj: IDataObject) => {
          const suggestTokenizer = (keywordObj?.suggestTokenizer as IDataObject)?.tokenizer as string[];
          return {
            ...keywordObj,
            suggestTokenizer: suggestTokenizer
          }
        });
        searchKeywordsObj[key] = processedTokenizer;
      }

      finalAction = {
        ...finalAction,
        searchKeywords: searchKeywordsObj
      }
    }
    if (action?.action === 'addVariant') {
      delete finalAction.attributes;
      delete finalAction.images;
      delete finalAction.assets;

      const attributesInput = (((localized.attributes as IDataObject) ?? {})?.attribute ?? []) as IDataObject[];
      const formattedAttributes = attributesInput
        .filter((attribute) => attribute?.name && attribute?.value !== undefined && attribute?.value !== '')
        .map((attribute) => ({
          name: attribute.name as string,
          value: parseAttributeValue(attribute.value as string, (attribute.valueType as string) ?? 'string'),
        }));
      if (formattedAttributes.length) {
        finalAction.attributes = formattedAttributes;
      }

      const imagesInput = (((localized.images as IDataObject) ?? {})?.image ?? []) as IDataObject[];
      const formattedImages = imagesInput
        .filter((image) => typeof image?.url === 'string' && (image.url as string).trim() !== '')
        .map((image) => {
          const imageDraft: IDataObject = {
            url: image.url,
          };
          if (image.label) {
            imageDraft.label = image.label;
          }
          const dimensions = ((image.dimensions as IDataObject)?.size ?? {}) as IDataObject;
          const dimensionPayload: IDataObject = {};
          if (dimensions.w !== undefined && dimensions.w !== null) {
            dimensionPayload.w = dimensions.w;
          }
          if (dimensions.h !== undefined && dimensions.h !== null) {
            dimensionPayload.h = dimensions.h;
          }
          if (Object.keys(dimensionPayload).length) {
            imageDraft.dimensions = dimensionPayload;
          }
          return imageDraft;
        });
      if (formattedImages.length) {
        finalAction.images = formattedImages;
      }

      const assetsInput = (((localized.assets as IDataObject) ?? {})?.asset ?? []) as IDataObject[];
      const formattedAssets = assetsInput
        .map((asset) => {
          const assetDraft: IDataObject = {};
          if (asset.key) {
            assetDraft.key = asset.key;
          }
          if (asset.name) {
            assetDraft.name = asset.name as IDataObject;
          }
          const sources = (((asset.sources as IDataObject) ?? {})?.source ?? []) as IDataObject[];
          const formattedSources = sources
            .filter((source) => typeof source?.uri === 'string' && (source.uri as string).trim() !== '')
            .map((source) => {
              const sourceDraft: IDataObject = {
                uri: source.uri,
              };
              if (source.key) {
                sourceDraft.key = source.key;
              }
              if (source.contentType) {
                sourceDraft.contentType = source.contentType;
              }
              const sourceDimensions = ((source.dimensions as IDataObject)?.size ?? {}) as IDataObject;
              const sourceDimensionPayload: IDataObject = {};
              if (sourceDimensions.w !== undefined && sourceDimensions.w !== null) {
                sourceDimensionPayload.w = sourceDimensions.w;
              }
              if (sourceDimensions.h !== undefined && sourceDimensions.h !== null) {
                sourceDimensionPayload.h = sourceDimensions.h;
              }
              if (Object.keys(sourceDimensionPayload).length) {
                sourceDraft.dimensions = sourceDimensionPayload;
              }
              return sourceDraft;
            });
          if (formattedSources.length) {
            assetDraft.sources = formattedSources;
          }
          return assetDraft;
        })
        .filter((asset) => Object.keys(asset).length);

      if (formattedAssets.length) {
        finalAction.assets = formattedAssets;
      }
    }


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
