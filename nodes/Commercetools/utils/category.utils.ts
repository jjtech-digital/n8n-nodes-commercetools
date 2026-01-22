import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

/**
 * Checks if a string is a valid UUID
 */
const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * Builds a category reference object from various input formats
 */
export const buildCategoryReference = (categoryInput: unknown): IDataObject | undefined => {
  if (!categoryInput) {
    return undefined;
  }

  // Handle string input (ID or Key)
  if (typeof categoryInput === 'string') {
    const trimmed = categoryInput.trim();
    if (!trimmed) return undefined;

    return isUuid(trimmed)
      ? { id: trimmed, typeId: 'category' }
      : { key: trimmed, typeId: 'category' };
  }

  // Handle object with categoryReference
  if (
    typeof categoryInput === 'object' &&
    'categoryReference' in (categoryInput as IDataObject)
  ) {
    const ref = (categoryInput as IDataObject).categoryReference as IDataObject;
    return buildCategoryRefFromObject(ref);
  }

  // Handle direct object with id or key
  if (typeof categoryInput === 'object') {
    return buildCategoryRefFromObject(categoryInput as IDataObject);
  }

  return undefined;
};

/**
 * Builds category reference from object containing id or key
 */
const buildCategoryRefFromObject = (obj: IDataObject): IDataObject | undefined => {
  const typeId = typeof obj.typeId === 'string' ? obj.typeId : 'category';

  // Prefer id over key
  if ('id' in obj) {
    const id = String(obj.id ?? '').trim();
    return id ? { id, typeId } : undefined;
  }

  if ('key' in obj) {
    const key = String(obj.key ?? '').trim();
    return key ? { key, typeId } : undefined;
  }

  return undefined;
};

/**
 * Transforms flat categoryId to nested category object for add/remove actions
 */
export const transformCategoryForAddRemove = (actionObj: IDataObject): IDataObject => {
  const action = actionObj.action as string;
  
  if (!['addToCategory', 'removeFromCategory'].includes(action)) {
    return actionObj;
  }

  // Handle flat categoryId field
  if (typeof actionObj.categoryId === 'string' && actionObj.categoryId.trim()) {
    return {
      ...actionObj,
      category: {
        typeId: 'category',
        id: actionObj.categoryId,
      },
    };
  }

  // Handle category.categoryReference array
  if (actionObj.category && typeof actionObj.category === 'object') {
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
};

/**
 * Processes category details from nested structure
 */
export const processCategoryDetails = (actionObj: IDataObject): IDataObject => {
  const action = actionObj.action as string;

  if (!['addToCategory', 'removeFromCategory'].includes(action)) {
    return actionObj;
  }

  const categoryDetails = (actionObj.category as IDataObject)?.categoryDetails;
  
  if (categoryDetails) {
    return {
      ...actionObj,
      category: categoryDetails,
    };
  }

  return actionObj;
};

/**
 * Processes parent category for changeParent action
 */
export const processParentCategory = (actionObj: IDataObject): IDataObject => {
  if (actionObj.action !== 'changeParent') {
    return actionObj;
  }

  const parentDetails = (actionObj.parent as IDataObject)?.categoryDetails;
  
  return {
    ...actionObj,
    ...(parentDetails ? { parent: parentDetails } : {}),
  };
};

/**
 * Main category transformer - handles all category-related transformations
 */
export const transformCategoryActions = (actionObj: IDataObject): IDataObject => {
  let transformed = transformCategoryForAddRemove(actionObj);
  transformed = processCategoryDetails(transformed);
  transformed = processParentCategory(transformed);
  
  return transformed;
};

/**
 * Recursively transforms any property named 'name', 'description', 'slug', etc. containing a localizedField array into a locale-keyed object.
 */
function preprocessLocalizedFields(obj: IDataObject): IDataObject {
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

/**
 * Builds actions from UI specifically for category operations
 */
export const buildCategoryActionsFromUi = (
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

  for (const action of actionEntries) {
    const localized = preprocessLocalizedFields(action);
    let finalAction = transformCategoryActions(localized);

    // Handle asset-related actions for categories
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

    if (action?.action === 'setAssetSources') {
      const flatSources = (action.sources && typeof action.sources === 'object' && 'source' in action.sources)
        ? (action.sources.source as IDataObject[])
        : [];

      finalAction = {
        ...action,
        sources: flatSources
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

    // Clean up identifyBy field if present
    if (finalAction?.identifyBy) {
      delete finalAction?.identifyBy;
    }

    builtActions.push(finalAction);
  }

  return builtActions;
};