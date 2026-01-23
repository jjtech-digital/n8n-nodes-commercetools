import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildCustomTypeFields, buildCustomTypeRef } from './common.utils';

// Re-export for backward compatibility
export { coerceActions, coerceJsonInput } from './common.utils';

/**
 * Helper function to parse value based on type
 */
export function parseAttributeValue(value: string, type: string): string | number | boolean {
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

/**
 * Handle setAttribute, setAttributeInAllVariants, setProductAttribute actions
 */
export function handleAttributeActions(action: IDataObject): IDataObject {
  const attributesActions = ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'];
  
  if (attributesActions.includes(action?.action as string)) {
    const valueType = (action as IDataObject & { valueType?: string })?.valueType ?? 'string';
    const attributeValue = parseAttributeValue(action?.value as string, valueType);
    const finalAction = {
      ...action,
      value: attributeValue
    };
    delete (finalAction as IDataObject & { valueType?: string })?.valueType;
    return finalAction;
  }
  return action;
}

/**
 * Handle setPrices and addVariant price formatting
 */
export function handlePriceActions(action: IDataObject): IDataObject {
  if (['setPrices', 'addVariant'].includes((action?.action as string) ?? '')) {
    const pricesData = (((action?.prices as IDataObject) ?? {})?.price ?? []) as IDataObject[];
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
      return {
        ...action,
        prices: modifiedPrices,
      };
    } else {
      const finalAction = { ...action };
      delete finalAction.prices;
      return finalAction;
    }
  }
  return action;
}

/**
 * Handle addExternalImage action
 */
export function handleAddExternalImage(action: IDataObject): IDataObject {
  if (action?.action === 'addExternalImage') {
    const imageDetails = (action?.image as IDataObject)?.imageDetails as IDataObject;
    const sizeData = (imageDetails?.dimensions as IDataObject)?.size as IDataObject;
    const dimensions = {
      h: sizeData?.h as number || null,
      w: sizeData?.w as number || null
    };
    return {
      ...action,
      image: {
        url: imageDetails?.url,
        label: imageDetails?.label,
        dimensions: dimensions
      }
    };
  }
  return action;
}

/**
 * Handle setProductPriceCustomType action
 */
export function handleProductPriceCustomType(action: IDataObject): IDataObject {
  if (action?.action === 'setProductPriceCustomType') {
    const flatFields: IDataObject = {};

    if (action.fields) {
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
      } else if (
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

    return {
      ...action,
      fields: flatFields,
      type: flatType,
    };
  }
  return action;
}

/**
 * Handle setSearchKeywords action
 */
export function handleSetSearchKeywords(action: IDataObject): IDataObject {
  if (action?.action === 'setSearchKeywords') {
    const keys = Object.keys(action.searchKeywords as IDataObject);
    const searchKeywordsObj: IDataObject = {};
    for (const key of keys) {
      searchKeywordsObj[key] = ((action.searchKeywords as IDataObject)[key] as IDataObject)?.keyword as IDataObject[];
      const processedTokenizer = (searchKeywordsObj[key] as IDataObject[]).map((keywordObj: IDataObject) => {
        const suggestTokenizer = (keywordObj?.suggestTokenizer as IDataObject)?.tokenizer as string[];
        return {
          ...keywordObj,
          suggestTokenizer: suggestTokenizer
        };
      });
      searchKeywordsObj[key] = processedTokenizer;
    }

    return {
      ...action,
      searchKeywords: searchKeywordsObj
    };
  }
  return action;
}

/**
 * Handle addVariant action with attributes, images, and assets
 */
export function handleAddVariant(action: IDataObject, localized: IDataObject): IDataObject {
  if (action?.action === 'addVariant') {
    const finalAction = { ...action };
    delete finalAction.attributes;
    delete finalAction.images;
    delete finalAction.assets;

    const attributesInput = (((localized.attributes as IDataObject) ?? {})?.attribute ?? []) as IDataObject[];
    const formattedAttributes = attributesInput
      .filter((attribute) => attribute?.name && attribute?.value !== undefined && attribute?.value !== '')
      .map((attribute) => {
        const attributeWithValueType = attribute as IDataObject & { valueType?: string };
        return {
          name: attribute.name as string,
          value: parseAttributeValue(attribute.value as string, attributeWithValueType?.valueType ?? 'string'),
        };
      });
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

    return finalAction;
  }
  return action;
}

/**
 * Handle setAssetSources action
 */
export function handleSetAssetSources(action: IDataObject): IDataObject {
  if (action?.action === 'setAssetSources') {
    const flatSources = (action.sources && typeof action.sources === 'object' && 'source' in action.sources)
      ? (action.sources.source as IDataObject[])
      : [];

    return {
      ...action,
      sources: flatSources
    };
  }
  return action;
}

/**
 * Handle setAssetDescription action
 */
export function handleSetAssetDescription(action: IDataObject): IDataObject {
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

    return {
      ...action,
      ...(description ? { description } : {}),
    };
  }
  return action;
}

/**
 * Handle changeAssetOrder action
 */
export function handleChangeAssetOrder(context: IExecuteFunctions, action: IDataObject): IDataObject {
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

    const finalAction: IDataObject = {
      ...action,
      assetOrder,
    };
    delete (finalAction as IDataObject & { assetId?: unknown }).assetId;
    delete (finalAction as IDataObject & { assetKey?: unknown }).assetKey;
    delete (finalAction as IDataObject & { assetIdentifierType?: unknown }).assetIdentifierType;
    delete (finalAction as IDataObject & { assetOrderSecond?: unknown }).assetOrderSecond;
    return finalAction;
  }
  return action;
}

/**
 * Handle setAssetCustomType action
 */
export function handleSetAssetCustomType(action: IDataObject): IDataObject {
  if (action?.action === 'setAssetCustomType') {
    const flatFields = buildCustomTypeFields(action.fields);
    const flatType = buildCustomTypeRef(action.type);
    return {
      ...action,
      ...(Object.keys(flatFields).length ? { fields: flatFields } : {}),
      ...(flatType ? { type: flatType } : {}),
    };
  }
  return action;
}

/**
 * Handle setCustomType action
 */
export function handleSetCustomType(action: IDataObject): IDataObject {
  if (action?.action === 'setCustomType') {
    const flatFields = buildCustomTypeFields(action.fields);
    const flatType = buildCustomTypeRef(action.type);
    return {
      ...action,
      ...(Object.keys(flatFields).length ? { fields: flatFields } : {}),
      ...(flatType ? { type: flatType } : {}),
    };
  }
  return action;
}

/**
 * Handle addAsset action
 */
export function handleAddAsset(action: IDataObject, localized: IDataObject): IDataObject {
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

    const finalAction: IDataObject = {
      ...action,
      asset: assetDraft,
    };
    delete (finalAction as IDataObject & { name?: unknown })?.name;
    delete (finalAction as IDataObject & { sources?: unknown })?.sources;
    return finalAction;
  }
  return action;
}