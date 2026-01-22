import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { transformCategoryActions } from './category.utils';

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
		} else if (typeof value === 'string' && value.trim()) {
			
			const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
			if (arrayValue.length) {
				qs[queryName] = arrayValue;
			}
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
	function transform(value: IDataObject | IDataObject[]): IDataObject | IDataObject[] {
    if (Array.isArray(value)) {
		return value.map((entry) => (entry && typeof entry === 'object' ? transform(entry) : entry)) as IDataObject | IDataObject[];
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
			newObj[key] = transform(currentValue as IDataObject | IDataObject[]);
        }
      }
      return newObj;
    }

    return value;
  }
  return transform(obj) as IDataObject;
}


// Helper function to parse value based on type
function parseAttributeValue(value: string, type: string): string | number | boolean  {
  try {
    switch (type) {
      case 'string':
        return value;

      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Cannot convert "${value}" to number`);
        }
        return num;
      }

      case 'boolean': {
        const lowerValue = value.trim().toLowerCase();
        if (lowerValue === 'true' || lowerValue === '1') return true;
        if (lowerValue === 'false' || lowerValue === '0') return false;
        throw new Error(`Cannot convert "${value}" to boolean. Use: true, false, 1, or 0`);
      }

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
): IDataObject[] => {
  const builtActions: IDataObject[] = [];
  const rawActionEntries = actionsUi.action;
  let actionEntries: IDataObject[] = [];

  if (Array.isArray(rawActionEntries)) {
    actionEntries = rawActionEntries as IDataObject[];
  } else if (rawActionEntries) {
    actionEntries = [rawActionEntries as IDataObject];
  }
  const buildCustomTypeFields = (fieldsInput: unknown): IDataObject => {
    const flatFields: IDataObject = {};

    if (!fieldsInput) {
      return flatFields;
    }

    if (typeof fieldsInput === 'string') {
      const trimmed = fieldsInput.trim();
      if (!trimmed) {
        return flatFields;
      }
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as IDataObject;
        }
      } catch {
        // fall through to error below
      }
      throw new NodeOperationError(
        context.getNode(),
        'Fields must be a valid JSON object',
      );
    }

    if (
      typeof fieldsInput === 'object' &&
      'name' in (fieldsInput as IDataObject) &&
      'value' in (fieldsInput as IDataObject)
    ) {
      const fieldName = (fieldsInput as IDataObject).name as string;
      const fieldValue = (fieldsInput as IDataObject).value;
      if (fieldName) {
        flatFields[fieldName] = fieldValue;
      }
      return flatFields;
    }

    if (
      typeof fieldsInput === 'object' &&
      'field' in (fieldsInput as IDataObject) &&
      Array.isArray((fieldsInput as IDataObject).field)
    ) {
      const fieldArray = (fieldsInput as IDataObject).field as IDataObject[];
      for (const fieldItem of fieldArray) {
        if (fieldItem && typeof fieldItem === 'object' && 'name' in fieldItem && 'value' in fieldItem) {
          const fieldName = fieldItem.name as string;
          const fieldValue = fieldItem.value;
          if (fieldName) {
            flatFields[fieldName] = fieldValue;
          }
        }
      }
    }

    return flatFields;
  };

  const isUuid = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const buildCustomTypeRef = (typeInput: unknown): IDataObject | undefined => {
    if (!typeInput) {
      return undefined;
    }

    if (typeof typeInput === 'string') {
      const trimmed = typeInput.trim();
      if (!trimmed) {
        return undefined;
      }
      if (isUuid(trimmed)) {
        return { id: trimmed, typeId: 'type' };
      }
      return { key: trimmed, typeId: 'type' };
    }

    if (
      typeof typeInput === 'object' &&
      'typeReference' in (typeInput as IDataObject) &&
      typeof (typeInput as IDataObject).typeReference === 'object'
    ) {
      const typeRef = (typeInput as IDataObject).typeReference as IDataObject;
      const id = typeof typeRef.id === 'string' ? typeRef.id : '';
      if (!id) {
        return undefined;
      }
      return {
        id,
        typeId: typeof typeRef.typeId === 'string' ? typeRef.typeId : 'type',
      };
    }

    if (typeof typeInput === 'object' && 'id' in (typeInput as IDataObject)) {
      const id = String((typeInput as IDataObject).id ?? '').trim();
      if (!id) {
        return undefined;
      }
      const typeId = typeof (typeInput as IDataObject).typeId === 'string'
        ? (typeInput as IDataObject).typeId
        : 'type';
      return { id, typeId };
    }

    if (typeof typeInput === 'object' && 'key' in (typeInput as IDataObject)) {
      const key = String((typeInput as IDataObject).key ?? '').trim();
      if (!key) {
        return undefined;
      }
      const typeId = typeof (typeInput as IDataObject).typeId === 'string'
        ? (typeInput as IDataObject).typeId
        : 'type';
      return { key, typeId };
    }

    return undefined;
  };
  const attributesActions = ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'];
  for (const action of actionEntries) {
    const localized = preprocessLocalizedFields(action);
    let finalAction = transformCategoryActions(localized);
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

    if (action?.action === 'setAssetTags') {
      const rawTags = (action.tags && typeof action.tags === 'object' && 'tag' in action.tags)
        ? (action.tags as IDataObject).tag
        : action.tags;
      const tagEntries = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];
      const tags = tagEntries
        .map((tag: unknown) => {
          if (tag && typeof tag === 'object' && 'value' in (tag as IDataObject)) {
            return String((tag as IDataObject).value ?? '').trim();
          }
          return String(tag ?? '').trim();
        })
        .filter((tag) => tag.length > 0);

      finalAction = {
        ...action,
        ...(tags.length ? { tags } : {}),
      };
    }

    if (action?.action === 'setAssetDescription') {
      const rawDescription = action.description;
      let description: IDataObject | undefined;

      if (typeof rawDescription === 'string') {
        const trimmed = rawDescription.trim();
        if (trimmed) {
          try {
            const parsed: unknown = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              description = parsed as IDataObject;
            } else {
              description = { en: trimmed };
            }
          } catch {
            description = { en: trimmed };
          }
        }
      } else if (rawDescription && typeof rawDescription === 'object') {
        description = rawDescription as IDataObject;
      }

      finalAction = {
        ...action,
        ...(description ? { description } : {}),
      };
    }

    if (action?.action === 'changeAssetOrder') {
      const rawOrder: unknown = action.assetOrder;
      const secondaryOrder = typeof action.assetOrderSecond === 'string' ? action.assetOrderSecond.trim() : '';
      let assetOrder: string[] = [];

      if (Array.isArray(rawOrder)) {
        assetOrder = rawOrder.map((entry: unknown) => String(entry)).filter((entry) => entry);
      } else if (rawOrder && typeof rawOrder === 'object') {
        if ('item' in rawOrder && Array.isArray((rawOrder as IDataObject).item)) {
          const itemArray = (rawOrder as IDataObject).item;
          if (Array.isArray(itemArray)) {
            assetOrder = itemArray
              .map((entry: unknown) => {
                if (entry && typeof entry === 'object' && 'value' in (entry as IDataObject)) {
                  return String((entry as IDataObject).value);
                }
                return String(entry);
              })
              .map((entry: string) => entry.trim())
              .filter((entry: unknown) => entry);
          }
        } else if ('value' in rawOrder) {
          const value = (rawOrder as IDataObject).value;
          if (value !== undefined && value !== null && value !== '') {
            assetOrder = [String(value)];
          }
        }
      } else if (typeof rawOrder === 'string') {
        const trimmed = rawOrder.trim();
        if (trimmed) {
          try {
            const parsed: unknown = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              assetOrder = parsed.map((entry: unknown) => String(entry)).filter((entry) => entry);
            } else {
              assetOrder = trimmed
                .split(',')
                .map((entry) => entry.trim())
                .filter((entry) => entry);
            }
          } catch {
            assetOrder = trimmed
              .split(',')
              .map((entry) => entry.trim())
              .filter((entry) => entry);
          }
        }
      } else if (rawOrder !== undefined && rawOrder !== null) {
        assetOrder = [String(rawOrder)];
      }

      if (secondaryOrder && !assetOrder.includes(secondaryOrder)) {
        assetOrder.push(secondaryOrder);
      }

      if (!assetOrder.length) {
        throw new NodeOperationError(
          context.getNode(),
          'Change Asset Order requires at least one asset ID in Asset Order',
        );
      }

      finalAction = {
        ...action,
        assetOrder,
      };
      delete finalAction.assetId;
      delete finalAction.assetKey;
      delete finalAction.assetIdentifierType;
      delete finalAction.assetOrderSecond;
    }

    if (action?.action === 'setAssetCustomType') {
      const flatFields = buildCustomTypeFields(action.fields);
      const flatType = buildCustomTypeRef(action.type);
      finalAction = {
        ...action,
        ...(Object.keys(flatFields).length ? { fields: flatFields } : {}),
        ...(flatType ? { type: flatType } : {}),
      };
    }

    if (action?.action === 'setCustomType') {
      const flatFields = buildCustomTypeFields(action.fields);
      const flatType = buildCustomTypeRef(action.type);
      finalAction = {
        ...action,
        ...(Object.keys(flatFields).length ? { fields: flatFields } : {}),
        ...(flatType ? { type: flatType } : {}),
      };
    }

    if (action?.action === 'setCustomField' || action?.action === 'setAssetCustomField') {
      const rawValue = action.value;
      let parsedValue = rawValue;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if (trimmed) {
          try {
            parsedValue = JSON.parse(trimmed);
          } catch {
            parsedValue = rawValue;
          }
        }
      }
      finalAction = {
        ...action,
        ...(parsedValue !== undefined ? { value: parsedValue } : {}),
      };
    }

    if (action?.action === 'addAsset') {
      const assetDraft: IDataObject = {
        ...(action.asset as IDataObject),
        name: localized.name,
      };

      const assetSourcesFromAsset = (assetDraft.sources as IDataObject | IDataObject[] | undefined) ?? undefined;
      const sourcesFromAction = (action.sources as IDataObject | undefined)?.source;
      const normalizedSources = Array.isArray(assetSourcesFromAsset)
        ? assetSourcesFromAsset
        : Array.isArray(sourcesFromAction)
          ? sourcesFromAction
          : undefined;

      if (normalizedSources?.length) {
        assetDraft.sources = normalizedSources;
      }

      finalAction = {
        ...action,
        asset: assetDraft,
      };
      delete finalAction?.name;
      delete finalAction?.sources;

    }

    if (finalAction?.identifyBy) {
      delete finalAction?.identifyBy;
    }
    if (finalAction?.assetIdentifierType) {
      delete finalAction?.assetIdentifierType;
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
