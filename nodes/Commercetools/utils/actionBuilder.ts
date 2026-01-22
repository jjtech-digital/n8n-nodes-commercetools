import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { preprocessLocalizedFields } from './common.utils';
import { transformFlatCategoryId, handleCategoryAction, handleChangeParent, handleSetTaxCategory } from './category.utils';
import {
  handleAttributeActions,
  handlePriceActions,
  handleAddExternalImage,
  handleProductPriceCustomType,
  handleSetSearchKeywords,
  handleAddVariant,
  handleSetAssetSources,
  handleSetAssetDescription,
  handleChangeAssetOrder,
  handleSetAssetCustomType,
  handleSetCustomType,
  handleAddAsset
} from './product.utils';

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

  for (const action of actionEntries) {
    // First preprocess localized fields
    const localized = preprocessLocalizedFields(action);
    
    // Apply category transformations
    let finalAction = transformFlatCategoryId(localized);
    
    // Apply all product-specific transformations
    finalAction = handleAttributeActions(finalAction);
    finalAction = handlePriceActions(finalAction);
    finalAction = handleAddExternalImage(finalAction);
    finalAction = handleProductPriceCustomType(finalAction);
    finalAction = handleSetSearchKeywords(finalAction);
    finalAction = handleAddVariant(finalAction, localized);
    finalAction = handleSetAssetSources(finalAction);
    finalAction = handleSetAssetDescription(finalAction);
    finalAction = handleChangeAssetOrder(context, finalAction);
    finalAction = handleSetAssetCustomType(finalAction);
    finalAction = handleSetCustomType(finalAction);
    finalAction = handleAddAsset(finalAction, localized);
    
    // Apply all category-specific transformations
    finalAction = handleCategoryAction(finalAction);
    finalAction = handleChangeParent(finalAction);
    finalAction = handleSetTaxCategory(finalAction);

    // Clean up identifyBy field if present
    if (finalAction?.identifyBy) {
      delete finalAction?.identifyBy;
    }

    builtActions.push(finalAction);
  }
  
  return builtActions;
};