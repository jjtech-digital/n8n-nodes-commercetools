import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { preprocessLocalizedFields } from './common.utils';
import { transformFlatCategoryId, handleCategoryAction, handleChangeParent, handleSetTaxCategory } from './category.utils';
import { handleCartActions } from './cart.utils';
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
    
    // Apply cart-specific transformations
    finalAction = handleCartActions(finalAction);
    
    finalAction = handleSetDirectDiscounts(context, finalAction);
    finalAction = handleAddShippingMethod(context, finalAction);

    // Clean up identifyBy field if present
    if (finalAction?.identifyBy) {
      delete finalAction?.identifyBy;
    }

    builtActions.push(finalAction);
  }
  
  return builtActions;
};

const handleSetDirectDiscounts = (
  context: IExecuteFunctions,
  action: IDataObject,
): IDataObject => {
  if (action?.action !== 'setDirectDiscounts') {
    return action;
  }

  const rawDiscounts = action.discounts;

  if (rawDiscounts === undefined || rawDiscounts === null || rawDiscounts === '') {
    return { ...action, discounts: [] };
  }

  if (Array.isArray(rawDiscounts)) {
    return { ...action, discounts: rawDiscounts };
  }

  if (typeof rawDiscounts === 'string') {
    const trimmed = rawDiscounts.trim();
    if (!trimmed) {
      return { ...action, discounts: [] };
    }
    const normalized = trimmed.toLowerCase();
    if (normalized === 'relative') {
      return {
        ...action,
        discounts: [
          {
            value: { type: 'relative', permyriad: 1000 },
            target: { type: 'lineItems', predicate: '1=1' },
          },
        ],
      };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { ...action, discounts: parsed };
      }
      throw new Error('Discounts must be a JSON array');
    } catch {
      // Fallback to default relative discount for any non-JSON string input.
      return {
        ...action,
        discounts: [
          {
            value: { type: 'relative', permyriad: 1000 },
            target: { type: 'lineItems', predicate: '1=1' },
          },
        ],
      };
    }
  }

  if (typeof rawDiscounts === 'object') {
    if ('discount' in (rawDiscounts as IDataObject)) {
      const discountEntries = (rawDiscounts as IDataObject).discount as IDataObject[];
      if (Array.isArray(discountEntries)) {
        return { ...action, discounts: discountEntries };
      }
    }
  }

  throw new NodeOperationError(
    context.getNode(),
    'Discounts must be a JSON array of DirectDiscountDraft objects',
  );
};

const handleAddShippingMethod = (
  context: IExecuteFunctions,
  action: IDataObject,
): IDataObject => {
  if (action?.action !== 'addShippingMethod') {
    return action;
  }

  const shippingMethodId = typeof action.shippingMethodId === 'string'
    ? action.shippingMethodId.trim()
    : '';
  const shippingMethodKey = typeof action.shippingMethodKey === 'string'
    ? action.shippingMethodKey.trim()
    : '';

  const parseOptionalJson = (value: unknown, label: string): unknown => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new NodeOperationError(
          context.getNode(),
          `${label} must be valid JSON when provided as a string`,
        );
      }
    }
    if (typeof value === 'object') {
      return value;
    }
    throw new NodeOperationError(context.getNode(), `${label} must be a JSON object or array`);
  };

  const shippingAddress = parseOptionalJson(action.shippingAddress, 'Shipping Address');
  const shippingRateInput = parseOptionalJson(action.shippingRateInput, 'Shipping Rate Input');
  const externalTaxRate = parseOptionalJson(action.externalTaxRate, 'External Tax Rate');
  const deliveries = parseOptionalJson(action.deliveries, 'Deliveries');
  const custom = parseOptionalJson(action.custom, 'Custom Fields');

  const finalAction: IDataObject = {
    ...action,
    ...(shippingAddress !== undefined ? { shippingAddress } : {}),
    ...(shippingRateInput !== undefined ? { shippingRateInput } : {}),
    ...(externalTaxRate !== undefined ? { externalTaxRate } : {}),
    ...(deliveries !== undefined ? { deliveries } : {}),
    ...(custom !== undefined ? { custom } : {}),
  };

  if (!finalAction.shippingMethod) {
    if (shippingMethodId) {
      finalAction.shippingMethod = { id: shippingMethodId, typeId: 'shipping-method' };
    } else if (shippingMethodKey) {
      finalAction.shippingMethod = { key: shippingMethodKey, typeId: 'shipping-method' };
    } else {
      throw new NodeOperationError(
        context.getNode(),
        'Add Shipping Method requires a Shipping Method ID or Key',
      );
    }
  }

  delete (finalAction as IDataObject & { shippingMethodId?: unknown }).shippingMethodId;
  delete (finalAction as IDataObject & { shippingMethodKey?: unknown }).shippingMethodKey;

  return finalAction;
};
