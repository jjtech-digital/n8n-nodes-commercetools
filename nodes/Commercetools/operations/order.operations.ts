import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	applyCommonParameters,
	coerceActions,
} from '../utils/common.utils';
import { transformOrderDraft, formatOrderResponse, validateOrderImportDraft } from '../utils/order.utils';

type OrderOperationArgs = {
	operation: string;
	itemIndex: number;
	baseUrl: string;
	items: INodeExecutionData[];
};

export async function executeOrderOperation(
	this: IExecuteFunctions,
	{ operation, itemIndex, baseUrl }: OrderOperationArgs,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	// Get Order operations
	if (operation === 'get' || operation === 'getByOrderNumber') {
		const additionalFieldsGet = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsGet);

		let url: string;
		if (operation === 'get') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/orders/${orderId}`;
		} else {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: formatOrderResponse(response) });
		return results;
	}

	// Get Order in Store operations
	if (operation === 'getInStore' || operation === 'getInStoreByOrderNumber') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsGet = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsGet);

		let url: string;
		if (operation === 'getInStore') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/${orderId}`;
		} else {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: formatOrderResponse(response) });
		return results;
	}

	// Query Orders operations
	if (operation === 'query') {
		const additionalFieldsQuery = this.getNodeParameter('additionalFieldsQuery', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsQuery);

		const url = `${baseUrl}/orders`;
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		// Format each order in the results
		if (response.results && Array.isArray(response.results)) {
			response.results = (response.results as IDataObject[]).map((order) => formatOrderResponse(order));
		}

		results.push({ json: response });
		return results;
	}

	// Query Orders in Store
	if (operation === 'queryInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsQuery = this.getNodeParameter('additionalFieldsQuery', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsQuery);

		const url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders`;
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		// Format each order in the results
		if (response.results && Array.isArray(response.results)) {
			response.results = (response.results as IDataObject[]).map((order) => formatOrderResponse(order));
		}

		results.push({ json: response });
		return results;
	}

	// Check if Order exists operations
	if (operation === 'head' || operation === 'headByOrderNumber' || operation === 'headByQuery') {
		const additionalFieldsHead = this.getNodeParameter('additionalFieldsHead', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsHead);

		let url: string;
		if (operation === 'head') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/orders/${orderId}`;
		} else if (operation === 'headByOrderNumber') {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		} else {
			url = `${baseUrl}/orders`;
		}

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url,
				qs,
			});
			results.push({ json: { exists: true } });
		} catch (error: unknown) {
			if ((error as { httpCode?: string }).httpCode === '404') {
				results.push({ json: { exists: false } });
			} else {
				throw new NodeOperationError(this.getNode(), `Error checking order existence: ${(error as Error).message}`, {
					itemIndex,
				});
			}
		}
		return results;
	}

	// Check if Order exists in Store operations
	if (operation === 'headInStore' || operation === 'headInStoreByOrderNumber' || operation === 'headInStoreByQuery') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsHead = this.getNodeParameter('additionalFieldsHead', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsHead);

		let url: string;
		if (operation === 'headInStore') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/${orderId}`;
		} else if (operation === 'headInStoreByOrderNumber') {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		} else {
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders`;
		}

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url,
				qs,
			});
			results.push({ json: { exists: true } });
		} catch (error: unknown) {
			if ((error as { httpCode?: string }).httpCode === '404') {
				results.push({ json: { exists: false } });
			} else {
				throw new NodeOperationError(this.getNode(), `Error checking order existence: ${(error as Error).message}`, {
					itemIndex,
				});
			}
		}
		return results;
	}

	// Create Order operations
	if (operation === 'createFromCart' || operation === 'createFromQuote' || operation === 'createByImport') {
		let body: IDataObject = {};

		if (operation === 'createFromCart') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			const version = this.getNodeParameter('version', itemIndex) as number;
			const orderDraft = this.getNodeParameter('orderDraft', itemIndex, {}) as IDataObject;
			body = {
				id: cartId,
				version,
				...transformOrderDraft(orderDraft),
			};
		} else if (operation === 'createFromQuote') {
			const quoteId = this.getNodeParameter('quoteId', itemIndex) as string;
			const version = this.getNodeParameter('version', itemIndex) as number;
			const orderDraft = this.getNodeParameter('orderDraft', itemIndex, {}) as IDataObject;
			body = {
				id: quoteId,
				version,
				...transformOrderDraft(orderDraft),
			};
		} else {
			// createByImport - use JSON input directly
			const orderImportDraftJson = this.getNodeParameter('orderImportDraft', itemIndex) as string;
			try {
				body = typeof orderImportDraftJson === 'string' ? JSON.parse(orderImportDraftJson) : orderImportDraftJson;
				// Validate the import draft structure
				validateOrderImportDraft(body);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), `Invalid JSON in Order Import Draft: ${(error as Error).message}`, {
					itemIndex,
				});
			}
		}

		const url = operation === 'createByImport' ? `${baseUrl}/orders/import` : `${baseUrl}/orders`;
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body,
		})) as IDataObject;

		results.push({ json: formatOrderResponse(response) });
		return results;
	}

	// Create Order in Store operations
	if (operation === 'createInStoreFromCart' || operation === 'createInStoreFromQuote') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const orderDraft = this.getNodeParameter('orderDraft', itemIndex, {}) as IDataObject;
		let body: IDataObject = {};

		if (operation === 'createInStoreFromCart') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			const version = this.getNodeParameter('version', itemIndex) as number;
			body = {
				id: cartId,
				version,
				...transformOrderDraft(orderDraft),
			};
		} else {
			const quoteId = this.getNodeParameter('quoteId', itemIndex) as string;
			const version = this.getNodeParameter('version', itemIndex) as number;
			body = {
				id: quoteId,
				version,
				...transformOrderDraft(orderDraft),
			};
		}

		const url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders`;
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body,
		})) as IDataObject;

		results.push({ json: formatOrderResponse(response) });
		return results;
	}

	// Update Order operations
	if (operation === 'update' || operation === 'updateByOrderNumber') {
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFieldsUpdate = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;

		let actions: IDataObject[] = [];
		if (additionalFieldsUpdate.actions) {
			actions = coerceActions(this, additionalFieldsUpdate.actions, itemIndex);
		}

		const body: IDataObject = {
			version,
			actions,
		};

		let url: string;
		if (operation === 'update') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/orders/${orderId}`;
		} else {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Update Order in Store operations
	if (operation === 'updateInStore' || operation === 'updateInStoreByOrderNumber') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFieldsUpdate = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;

		let actions: IDataObject[] = [];
		if (additionalFieldsUpdate.actions) {
			actions = coerceActions(this, additionalFieldsUpdate.actions, itemIndex);
		}

		const body: IDataObject = {
			version,
			actions,
		};

		let url: string;
		if (operation === 'updateInStore') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/${orderId}`;
		} else {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Delete Order operations
	if (operation === 'delete' || operation === 'deleteByOrderNumber') {
		const version = this.getNodeParameter('version', itemIndex) as number;
		const qs: IDataObject = { version };

		let url: string;
		if (operation === 'delete') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/orders/${orderId}`;
		} else {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Delete Order in Store operations
	if (operation === 'deleteInStore' || operation === 'deleteInStoreByOrderNumber') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const qs: IDataObject = { version };

		let url: string;
		if (operation === 'deleteInStore') {
			const orderId = this.getNodeParameter('orderId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/${orderId}`;
		} else {
			const orderNumber = this.getNodeParameter('orderNumber', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/orders/order-number=${encodeURIComponent(orderNumber)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
		itemIndex,
	});
}