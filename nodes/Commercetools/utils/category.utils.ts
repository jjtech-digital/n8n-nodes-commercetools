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
  if (!categoryInput) return undefined;

  // Handle string input (ID or Key)
  if (typeof categoryInput === 'string') {
    const trimmed = categoryInput.trim();
    return !trimmed ? undefined : {
      typeId: 'category',
      ...(isUuid(trimmed) ? { id: trimmed } : { key: trimmed })
    };
  }

  // Handle object input
  if (typeof categoryInput === 'object') {
    const obj = categoryInput as IDataObject;
    const ref = 'categoryReference' in obj ? obj.categoryReference as IDataObject : obj;
    return buildCategoryRefFromObject(ref);
  }

  return undefined;
};

/**
 * Builds category reference from object containing id or key
 */
const buildCategoryRefFromObject = (obj: IDataObject): IDataObject | undefined => {
  const typeId = typeof obj.typeId === 'string' ? obj.typeId : 'category';

  // Prefer id over key
  const id = String(obj.id ?? '').trim();
  if (id) return { id, typeId };

  const key = String(obj.key ?? '').trim();
  return key ? { key, typeId } : undefined;
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
  const categoryId = typeof actionObj.categoryId === 'string' ? actionObj.categoryId.trim() : '';
  if (categoryId) {
    return {
      ...actionObj,
      category: { typeId: 'category', id: categoryId }
    };
  }

  // Handle category.categoryReference array
  const categoryObj = actionObj.category as IDataObject;
  const categoryRef = categoryObj?.categoryReference as IDataObject[];
  const ref = Array.isArray(categoryRef) ? categoryRef[0] : undefined;
  
  if (ref?.typeId && (ref.id || ref.key)) {
    return {
      ...actionObj,
      category: {
        typeId: ref.typeId,
        ...(ref.id && { id: ref.id }),
        ...(ref.key && { key: ref.key })
      }
    };
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
  const processLocalizedField = (localizedArr: unknown[]): IDataObject => {
    const result: IDataObject = {};
    for (const loc of localizedArr) {
      if (!loc || typeof loc !== 'object') continue;
      
      const locale = (loc as IDataObject).locale;
      const value = (loc as IDataObject).value;
      const trimmedLocale = typeof locale === 'string' ? locale.trim() : '';
      
      if (trimmedLocale && value !== undefined && value !== null) {
        result[trimmedLocale] = value;
      }
    }
    return result;
  };

  function transform(value: IDataObject | IDataObject[]): IDataObject | IDataObject[] {
    if (Array.isArray(value)) {
      return value.map(entry => 
        entry && typeof entry === 'object' ? transform(entry) : entry
      ) as IDataObject | IDataObject[];
    }

    if (!value || typeof value !== 'object') return value;

    const newObj: IDataObject = {};
    for (const [key, currentValue] of Object.entries(value)) {
      const hasLocalizedField = currentValue && 
        typeof currentValue === 'object' && 
        'localizedField' in currentValue;
        
      if (hasLocalizedField) {
        const localizedArr = (currentValue as IDataObject).localizedField;
        newObj[key] = Array.isArray(localizedArr) 
          ? processLocalizedField(localizedArr)
          : currentValue;
      } else {
        newObj[key] = transform(currentValue as IDataObject | IDataObject[]);
      }
    }
    return newObj;
  }
  
  return transform(obj) as IDataObject;
}

/**
 * Processes asset description for setAssetDescription action
 */
const processAssetDescription = (action: IDataObject): IDataObject => {
  const rawDescription = action.description;
  
  if (typeof rawDescription === 'string') {
    const trimmed = rawDescription.trim();
    if (!trimmed) return action;
    
    try {
      const parsed = JSON.parse(trimmed);
      const description = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) 
        ? parsed 
        : { en: trimmed };
      return { ...action, description };
    } catch {
      return { ...action, description: { en: trimmed } };
    }
  }
  
  if (rawDescription && typeof rawDescription === 'object') {
    return { ...action, description: rawDescription };
  }
  
  return action;
};

/**
 * Processes asset sources for setAssetSources action
 */
const processAssetSources = (action: IDataObject): IDataObject => {
  const sources = action.sources;
  const flatSources = (sources && typeof sources === 'object' && 'source' in sources)
    ? sources.source as IDataObject[]
    : [];
  
  return { ...action, sources: flatSources };
};

/**
 * Processes asset for addAsset action
 */
const processAddAsset = (action: IDataObject, localized: IDataObject): IDataObject => {
  const assetDraft: IDataObject = {
    ...(action.asset as IDataObject || {}),
    name: localized.name,
  };

  const assetSourcesFromAsset = assetDraft.sources as IDataObject | IDataObject[] | undefined;
  const sourcesFromAction = (action.sources as IDataObject | undefined)?.source;
  const normalizedSources = Array.isArray(assetSourcesFromAsset)
    ? assetSourcesFromAsset
    : Array.isArray(sourcesFromAction)
      ? sourcesFromAction
      : undefined;

  if (normalizedSources?.length) {
    assetDraft.sources = normalizedSources;
  }

  const result = { ...action, asset: assetDraft };
  // Remove properties that should not be in the final result
  if ('name' in result) delete result.name;
  if ('sources' in result) delete result.sources;
  return result;
};

/**
 * Action processors map for different action types
 */
const ACTION_PROCESSORS = {
  setAssetDescription: (action: IDataObject) => processAssetDescription(action),
  setAssetSources: (action: IDataObject) => processAssetSources(action),
  addAsset: (action: IDataObject, localized: IDataObject) => processAddAsset(action, localized)
};

/**
 * Builds actions from UI specifically for category operations
 */
export const buildCategoryActionsFromUi = (
  context: IExecuteFunctions,
  actionsUi: IDataObject,
): IDataObject[] => {
  const rawActionEntries = actionsUi.action;
  const actionEntries = Array.isArray(rawActionEntries) 
    ? rawActionEntries as IDataObject[]
    : rawActionEntries ? [rawActionEntries as IDataObject] : [];

  return actionEntries.map(action => {
    const localized = preprocessLocalizedFields(action);
    let finalAction = transformCategoryActions(localized);
    
    const actionType = action?.action as string;
    
    // Handle specific action types
    if (actionType === 'setAssetDescription') {
      finalAction = ACTION_PROCESSORS.setAssetDescription(action);
    } else if (actionType === 'setAssetSources') {
      finalAction = ACTION_PROCESSORS.setAssetSources(action);
    } else if (actionType === 'addAsset') {
      finalAction = ACTION_PROCESSORS.addAsset(action, localized);
    }

    // Clean up identifyBy field if present
    if ('identifyBy' in finalAction) {
      delete finalAction.identifyBy;
    }

    return finalAction;
  });
};