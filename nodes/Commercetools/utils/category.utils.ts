import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { preprocessLocalizedFields } from './common.utils';

/**
 * Transforms categoryId and categoryReference fields to nested category object for specific actions
 */
export function transformFlatCategoryId(actionObj: IDataObject): IDataObject {
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

/**
 * Handle addToCategory and removeFromCategory actions
 */
export function handleCategoryAction(action: IDataObject): IDataObject {
  if (action?.action === 'addToCategory' || action?.action === 'removeFromCategory') {
    const categoryDetails = (action?.category as IDataObject)?.categoryDetails;
    if (categoryDetails) {
      return {
        ...action,
        category: categoryDetails,
      };
    }
  }
  return action;
}

/**
 * Handle changeParent action for categories
 */
export function handleChangeParent(action: IDataObject): IDataObject {
  if (action?.action === 'changeParent') {
    const parentDetails = (action?.parent as IDataObject)?.categoryDetails;
    return {
      ...action,
      ...(parentDetails ? { parent: parentDetails } : {}),
    };
  }
  return action;
}

/**
 * Handle setTaxCategory action
 */
export function handleSetTaxCategory(action: IDataObject): IDataObject {
  if (action?.action === 'setTaxCategory') {
    const taxCategoryDetails = (action?.taxCategory as IDataObject)?.taxCategoryDetails;
    return {
      ...action,
      ...(taxCategoryDetails ? { taxCategory: taxCategoryDetails } : {}),
    };
  }
  return action;
}

/**
 * Build category actions from UI configuration
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
    // First preprocess localized fields
    const localized = preprocessLocalizedFields(action);
    
    // Apply category-specific transformations
    let finalAction = transformFlatCategoryId(localized);
    finalAction = handleCategoryAction(finalAction);
    finalAction = handleChangeParent(finalAction);
    finalAction = handleSetTaxCategory(finalAction);

    // Clean up identifyBy field if present
    if (finalAction?.identifyBy) {
      delete finalAction.identifyBy;
    }

    builtActions.push(finalAction);
  }
  
  return builtActions;
};