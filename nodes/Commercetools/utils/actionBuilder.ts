import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { preprocessLocalizedFields } from './common.utils';
import {
	transformFlatCategoryId,
	handleCategoryAction,
	handleChangeParent,
	handleSetTaxCategory,
} from './category.utils';
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
	handleAddAsset,
} from './product.utils';

// Helper functions to reduce repetitive code
const parseNumericValue = (value: unknown): number | undefined => {
	if (typeof value === 'number') return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
};

const cleanupFields = (obj: IDataObject, fieldsToDelete: string[]) => {
	const cleaned = { ...obj };
	fieldsToDelete.forEach((field) => delete (cleaned as Record<string, unknown>)[field]);
	return cleaned;
};

const validateRequiredFields = (
	context: IExecuteFunctions,
	fields: Record<string, unknown>,
	message: string,
) => {
	if (Object.entries(fields).some(([, value]) => value === undefined || value === '')) {
		throw new NodeOperationError(context.getNode(), message);
	}
};

const safeJsonParseArrayOnly = (value: string): unknown[] | null => {
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

const createRelativeDiscount = (permyriad: number, predicate: string) => [
	{
		value: { type: 'relative', permyriad },
		target: { type: 'lineItems', predicate },
	},
];

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

const handleSetDirectDiscounts = (context: IExecuteFunctions, action: IDataObject): IDataObject => {
	if (action?.action !== 'setDirectDiscounts') return action;

	const targetPredicate =
		(typeof action.discountPredicate === 'string' ? action.discountPredicate.trim() : '') || '';
	const resolvedPermyriad = parseNumericValue(action.discountPermyriad);
	const baseAction = cleanupFields(action, ['discountPredicate', 'discountPermyriad']);

	const { discounts: rawDiscounts } = action;

	// Handle empty or null discounts
	if (!rawDiscounts || rawDiscounts === '') {
		return { ...baseAction, discounts: [] };
	}

	// Handle array discounts
	if (Array.isArray(rawDiscounts)) {
		return { ...baseAction, discounts: rawDiscounts };
	}

	// Handle string discounts
	if (typeof rawDiscounts === 'string') {
		const trimmed = rawDiscounts.trim();
		if (!trimmed) return { ...baseAction, discounts: [] };

		// Handle 'relative' keyword
		if (trimmed.toLowerCase() === 'relative') {
			validateRequiredFields(
				context,
				{ targetPredicate, resolvedPermyriad },
				'Discount Predicate and Discount Permyriad are required when Discounts is "relative".',
			);
			return {
				...baseAction,
				discounts: createRelativeDiscount(resolvedPermyriad!, targetPredicate),
			};
		}

		// Try to parse as JSON array
		const parsed = safeJsonParseArrayOnly(trimmed);
		if (parsed) {
			return { ...baseAction, discounts: parsed };
		}

		// Fallback to relative discount
		validateRequiredFields(
			context,
			{ targetPredicate, resolvedPermyriad },
			'Discount Predicate and Discount Permyriad are required when Discounts is not valid JSON.',
		);
		return {
			...baseAction,
			discounts: createRelativeDiscount(resolvedPermyriad!, targetPredicate),
		};
	}

	// Handle object discounts
	if (typeof rawDiscounts === 'object' && 'discount' in rawDiscounts) {
		const discountEntries = (rawDiscounts as IDataObject).discount;
		if (Array.isArray(discountEntries)) {
			return { ...baseAction, discounts: discountEntries };
		}
	}

	throw new NodeOperationError(
		context.getNode(),
		'Discounts must be a JSON array of DirectDiscountDraft objects',
	);
};

const safeParseJson = (value: unknown, label = 'field'): unknown => {
	if (!value || value === '') return undefined;

	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) return undefined;

		try {
			return JSON.parse(trimmed);
		} catch {
			throw new Error(`${label} must be valid JSON when provided as a string`);
		}
	}

	return typeof value === 'object' ? value : undefined;
};

const handleAddShippingMethod = (context: IExecuteFunctions, action: IDataObject): IDataObject => {
	if (action?.action !== 'addShippingMethod') return action;

	const shippingMethodId =
		(typeof action.shippingMethodId === 'string' ? action.shippingMethodId.trim() : '') || '';
	const shippingMethodKey =
		(typeof action.shippingMethodKey === 'string' ? action.shippingMethodKey.trim() : '') || '';

	try {
		const optionalFields = {
			shippingAddress: safeParseJson(action.shippingAddress, 'Shipping Address'),
			shippingRateInput: safeParseJson(action.shippingRateInput, 'Shipping Rate Input'),
			externalTaxRate: safeParseJson(action.externalTaxRate, 'External Tax Rate'),
			deliveries: safeParseJson(action.deliveries, 'Deliveries'),
			custom: safeParseJson(action.custom, 'Custom Fields'),
		};

		const finalAction = {
			...action,
			...Object.fromEntries(
				Object.entries(optionalFields).filter(([, value]) => value !== undefined),
			),
		} as IDataObject;

		// Set shipping method reference
		if (!finalAction.shippingMethod) {
			if (!shippingMethodId && !shippingMethodKey) {
				throw new NodeOperationError(
					context.getNode(),
					'Add Shipping Method requires a Shipping Method ID or Key',
				);
			}
			finalAction.shippingMethod = {
				typeId: 'shipping-method',
				...(shippingMethodId ? { id: shippingMethodId } : { key: shippingMethodKey }),
			};
		}

		return cleanupFields(finalAction, [
			'shippingMethodId',
			'shippingMethodKey',
			'shippingMethodSelection',
		]);
	} catch (error) {
		throw new NodeOperationError(context.getNode(), (error as Error).message);
	}
};
