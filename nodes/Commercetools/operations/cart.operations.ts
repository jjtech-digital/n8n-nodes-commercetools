import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	applyCommonParameters,
	coerceActions,
	coerceJsonInput,
} from '../utils/common.utils';
import { buildActionsFromUi } from '../utils/actionBuilder';

type CartOperationArgs = {
	operation: string;
	itemIndex: number;
	baseUrl: string;
	items: INodeExecutionData[];
};

export async function executeCartOperation(
	this: IExecuteFunctions,
	{ operation, itemIndex, baseUrl }: CartOperationArgs,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	// Get Cart operations
	if (operation === 'get' || operation === 'getByKey' || operation === 'getByCustomerId') {
		const additionalFieldsGet = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsGet);

		let url: string;
		if (operation === 'get') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			url = `${baseUrl}/carts/${cartId}`;
		} else if (operation === 'getByKey') {
			const cartKey = this.getNodeParameter('cartKey', itemIndex) as string;
			url = `${baseUrl}/carts/key=${encodeURIComponent(cartKey)}`;
		} else {
			const customerId = this.getNodeParameter('customerId', itemIndex) as string;
			url = `${baseUrl}/carts/customer-id=${encodeURIComponent(customerId)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Get Cart in Store operations
	if (operation === 'getInStore' || operation === 'getInStoreByKey' || operation === 'getInStoreByCustomerId') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsGet = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsGet);

		let url: string;
		if (operation === 'getInStore') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/${cartId}`;
		} else if (operation === 'getInStoreByKey') {
			const cartKey = this.getNodeParameter('cartKey', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/key=${encodeURIComponent(cartKey)}`;
		} else {
			const customerId = this.getNodeParameter('customerId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/customer-id=${encodeURIComponent(customerId)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Query Carts operations
	if (operation === 'query') {
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = returnAll ? 500 : (this.getNodeParameter('limit', itemIndex, 20) as number);
		const offset = this.getNodeParameter('offset', itemIndex, 0) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const qs: IDataObject = { limit };

		if (offset) {
			qs.offset = offset;
		}

		applyCommonParameters(qs, additionalFields, {
			allowSort: true,
			allowWhere: true,
			allowPredicateVariables: true,
		});

		if (Object.prototype.hasOwnProperty.call(additionalFields, 'withTotal')) {
			qs.withTotal = additionalFields.withTotal as boolean;
		}

		if (returnAll && qs.withTotal === undefined) {
			qs.withTotal = true;
		}

		const collected: IDataObject[] = [];
		let requestOffset = offset;
		let hasMore = true;

		do {
			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'GET',
				url: `${baseUrl}/carts`,
				qs: {
					...qs,
					offset: requestOffset,
				},
			});

			const resultsPage = (response.results ?? response) as IDataObject[];

			if (!Array.isArray(resultsPage)) {
				throw new NodeOperationError(this.getNode(), 'Unexpected response format from Commercetools API', {
					itemIndex,
				});
			}

			collected.push(...resultsPage);

			if (!returnAll) {
				hasMore = false;
			} else {
				const received = resultsPage.length;
				if (received === 0) {
					hasMore = false;
				} else {
					requestOffset += received;
					const total = response.total as number | undefined;
					hasMore = total !== undefined ? requestOffset < total : received === limit;
				}
			}
		} while (returnAll && hasMore);

		results.push(...this.helpers.returnJsonArray(collected));
		return results;
	}

	// Query Carts in Store
	if (operation === 'queryInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = returnAll ? 500 : (this.getNodeParameter('limit', itemIndex, 20) as number);
		const offset = this.getNodeParameter('offset', itemIndex, 0) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const qs: IDataObject = { limit };

		if (offset) {
			qs.offset = offset;
		}

		applyCommonParameters(qs, additionalFields, {
			allowSort: true,
			allowWhere: true,
			allowPredicateVariables: true,
		});

		if (Object.prototype.hasOwnProperty.call(additionalFields, 'withTotal')) {
			qs.withTotal = additionalFields.withTotal as boolean;
		}

		if (returnAll && qs.withTotal === undefined) {
			qs.withTotal = true;
		}

		const collected: IDataObject[] = [];
		let requestOffset = offset;
		let hasMore = true;

		do {
			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'GET',
				url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts`,
				qs: {
					...qs,
					offset: requestOffset,
				},
			});

			const resultsPage = (response.results ?? response) as IDataObject[];

			if (!Array.isArray(resultsPage)) {
				throw new NodeOperationError(this.getNode(), 'Unexpected response format from Commercetools API', {
					itemIndex,
				});
			}

			collected.push(...resultsPage);

			if (!returnAll) {
				hasMore = false;
			} else {
				const received = resultsPage.length;
				if (received === 0) {
					hasMore = false;
				} else {
					requestOffset += received;
					const total = response.total as number | undefined;
					hasMore = total !== undefined ? requestOffset < total : received === limit;
				}
			}
		} while (returnAll && hasMore);

		results.push(...this.helpers.returnJsonArray(collected));
		return results;
	}

	// Check if Cart exists operations
	if (operation === 'headByQuery') {
		const additionalFieldsHead = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsHead, {
			allowWhere: true,
			allowPredicateVariables: true,
			allowSort: true,
		});

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/carts`,
				qs,
			});
			results.push({ json: { exists: true } });
			return results;
		} catch (error) {
			const errorData = error as IDataObject;
			const statusCode =
				(errorData.statusCode as number | undefined) ??
				((errorData.cause as IDataObject)?.statusCode as number | undefined) ??
				((errorData.response as IDataObject)?.statusCode as number | undefined);
			if (statusCode === 404 || errorData.httpCode === '404') {
				results.push({ json: { exists: false } });
				return results;
			}
			throw error;
		}
	}

	if (operation === 'head' || operation === 'headByKey' || operation === 'headByCustomerId') {
		let url: string;
		if (operation === 'head') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			url = `${baseUrl}/carts/${cartId}`;
		} else if (operation === 'headByKey') {
			const cartKey = this.getNodeParameter('cartKey', itemIndex) as string;
			url = `${baseUrl}/carts/key=${encodeURIComponent(cartKey)}`;
		} else {
			const customerId = this.getNodeParameter('customerId', itemIndex) as string;
			url = `${baseUrl}/carts/customer-id=${encodeURIComponent(customerId)}`;
		}

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url,
			});
			results.push({ json: { exists: true } });
			return results;
		} catch (error) {
			const errorData = error as IDataObject;
			const statusCode =
				(errorData.statusCode as number | undefined) ??
				((errorData.cause as IDataObject)?.statusCode as number | undefined) ??
				((errorData.response as IDataObject)?.statusCode as number | undefined);
			if (statusCode === 404 || errorData.httpCode === '404') {
				results.push({ json: { exists: false } });
				return results;
			}
			throw error;
		}
	}

	// Check if Cart exists in Store operations
	if (operation === 'headInStore' || operation === 'headInStoreByKey' || operation === 'headInStoreByCustomerId' || operation === 'headInStoreByQuery') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;

		let url: string;
		const qs: IDataObject = {};
		
		if (operation === 'headInStore') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/${cartId}`;
		} else if (operation === 'headInStoreByKey') {
			const cartKey = this.getNodeParameter('cartKey', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/key=${encodeURIComponent(cartKey)}`;
		} else if (operation === 'headInStoreByCustomerId') {
			const customerId = this.getNodeParameter('customerId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/customer-id=${encodeURIComponent(customerId)}`;
		} else {
			// headInStoreByQuery
			const additionalFieldsHead = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
			applyCommonParameters(qs, additionalFieldsHead, {
				allowWhere: true,
				allowPredicateVariables: true,
				allowSort: true,
			});
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts`;
		}

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url,
				qs,
			});
			results.push({ json: { exists: true } });
			return results;
		} catch (error) {
			const errorData = error as IDataObject;
			const statusCode =
				(errorData.statusCode as number | undefined) ??
				((errorData.cause as IDataObject)?.statusCode as number | undefined) ??
				((errorData.response as IDataObject)?.statusCode as number | undefined);
			if (statusCode === 404 || errorData.httpCode === '404') {
				results.push({ json: { exists: false } });
				return results;
			}
			throw error;
		}
	}

	// Create Cart operations
	if (operation === 'create') {
		const additionalFieldsCreate = this.getNodeParameter('additionalFieldsCreate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsCreate);

		const draftRaw = this.getNodeParameter('cartDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Cart draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/carts`,
			body: draft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'createInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsCreate = this.getNodeParameter('additionalFieldsCreate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsCreate);

		const draftRaw = this.getNodeParameter('cartDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Cart draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts`,
			body: draft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Replicate Cart operations
	if (operation === 'replicate') {
		const cartId = this.getNodeParameter('cartId', itemIndex) as string;
		const additionalFieldsReplicate = this.getNodeParameter('additionalFieldsReplicate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsReplicate);

		const replicaCartDraftRaw = this.getNodeParameter('replicaCartDraft', itemIndex, {});
		const replicaCartDraft = coerceJsonInput(this, replicaCartDraftRaw, 'Replica cart draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/carts/replicate`,
			body: {
				reference: {
					typeId: 'cart',
					id: cartId,
				},
				...replicaCartDraft,
			},
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'replicateInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const cartId = this.getNodeParameter('cartId', itemIndex) as string;
		const additionalFieldsReplicate = this.getNodeParameter('additionalFieldsReplicate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsReplicate);

		const replicaCartDraftRaw = this.getNodeParameter('replicaCartDraft', itemIndex, {});
		const replicaCartDraft = coerceJsonInput(this, replicaCartDraftRaw, 'Replica cart draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/replicate`,
			body: {
				reference: {
					typeId: 'cart',
					id: cartId,
				},
				...replicaCartDraft,
			},
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Merge Cart operations
	if (operation === 'merge') {
		const cartId = this.getNodeParameter('cartId', itemIndex) as string;
		const additionalFieldsMerge = this.getNodeParameter('additionalFieldsMerge', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsMerge);

		const mergeCartDraftRaw = this.getNodeParameter('mergeCartDraft', itemIndex);
		const mergeCartDraft = coerceJsonInput(this, mergeCartDraftRaw, 'Merge cart draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/carts/${cartId}`,
			body: mergeCartDraft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'mergeInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const cartId = this.getNodeParameter('cartId', itemIndex) as string;
		const additionalFieldsMerge = this.getNodeParameter('additionalFieldsMerge', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsMerge);

		const mergeCartDraftRaw = this.getNodeParameter('mergeCartDraft', itemIndex);
		const mergeCartDraft = coerceJsonInput(this, mergeCartDraftRaw, 'Merge cart draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/${cartId}`,
			body: mergeCartDraft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Update Cart operations
	if (operation === 'update' || operation === 'updateByKey') {
		const additionalFieldsUpdate = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsUpdate);

		if (Object.prototype.hasOwnProperty.call(additionalFieldsUpdate, 'dataErasure')) {
			qs.dataErasure = additionalFieldsUpdate.dataErasure as boolean;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsUpdate, 'dryRun')) {
			qs.dryRun = additionalFieldsUpdate.dryRun as boolean;
		}

		const version = this.getNodeParameter('version', itemIndex) as number;
		const rawActions = this.getNodeParameter('actions', itemIndex);
		const actionsUi = this.getNodeParameter('updateActions', itemIndex, {}) as IDataObject;
		const actionsFromJson = coerceActions(this, rawActions, itemIndex);
		const actionsFromUi = buildActionsFromUi(this, actionsUi);
		if (actionsFromJson.length > 0 && actionsFromUi.length > 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Use only one input method for update actions: Actions (JSON) or Actions (UI)',
				{ itemIndex },
			);
		}
		const actions = [...actionsFromJson, ...actionsFromUi];

		if (actions.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Provide at least one update action via Actions (JSON) or Actions (UI)',
				{ itemIndex },
			);
		}

		let bodyString = '';
		try {
			bodyString = JSON.stringify({ version, actions });
		} catch {
			throw new NodeOperationError(this.getNode(), 'Update body is not valid JSON', { itemIndex });
		}

		let url: string;
		if (operation === 'update') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			url = `${baseUrl}/carts/${cartId}`;
		} else {
			const cartKey = this.getNodeParameter('cartKey', itemIndex) as string;
			url = `${baseUrl}/carts/key=${encodeURIComponent(cartKey)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body: bodyString,
			headers: {
				'Content-Type': 'application/json',
			},
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Update Cart in Store operations
	if (operation === 'updateInStore' || operation === 'updateInStoreByKey') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsUpdate = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsUpdate);

		if (Object.prototype.hasOwnProperty.call(additionalFieldsUpdate, 'dataErasure')) {
			qs.dataErasure = additionalFieldsUpdate.dataErasure as boolean;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsUpdate, 'dryRun')) {
			qs.dryRun = additionalFieldsUpdate.dryRun as boolean;
		}

		const version = this.getNodeParameter('version', itemIndex) as number;
		const rawActions = this.getNodeParameter('actions', itemIndex);
		const actionsUi = this.getNodeParameter('updateActions', itemIndex, {}) as IDataObject;
		const actionsFromJson = coerceActions(this, rawActions, itemIndex);
		const actionsFromUi = buildActionsFromUi(this, actionsUi);
		if (actionsFromJson.length > 0 && actionsFromUi.length > 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Use only one input method for update actions: Actions (JSON) or Actions (UI)',
				{ itemIndex },
			);
		}
		const actions = [...actionsFromJson, ...actionsFromUi];

		if (actions.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Provide at least one update action via Actions (JSON) or Actions (UI)',
				{ itemIndex },
			);
		}

		let bodyString = '';
		try {
			bodyString = JSON.stringify({ version, actions });
		} catch {
			throw new NodeOperationError(this.getNode(), 'Update body is not valid JSON', { itemIndex });
		}

		let url: string;
		if (operation === 'updateInStore') {
			const cartId = this.getNodeParameter('cartId', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/${cartId}`;
		} else {
			const cartKey = this.getNodeParameter('cartKey', itemIndex) as string;
			url = `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/key=${encodeURIComponent(cartKey)}`;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body: bodyString,
			headers: {
				'Content-Type': 'application/json',
			},
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Delete Cart operations
	if (operation === 'delete' || operation === 'deleteByKey') {
		const additionalFieldsDelete = this.getNodeParameter('additionalFieldsDelete', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsDelete);

		if (Object.prototype.hasOwnProperty.call(additionalFieldsDelete, 'dataErasure')) {
			qs.dataErasure = additionalFieldsDelete.dataErasure as boolean;
		}

		const version = this.getNodeParameter('version', itemIndex) as number;
		qs.version = version;

		const url =
			operation === 'delete'
				? `${baseUrl}/carts/${this.getNodeParameter('cartId', itemIndex) as string}`
				: `${baseUrl}/carts/key=${encodeURIComponent(this.getNodeParameter('cartKey', itemIndex) as string)}`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	// Delete Cart in Store operations
	if (operation === 'deleteInStore' || operation === 'deleteInStoreByKey') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFieldsDelete = this.getNodeParameter('additionalFieldsDelete', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsDelete);

		if (Object.prototype.hasOwnProperty.call(additionalFieldsDelete, 'dataErasure')) {
			qs.dataErasure = additionalFieldsDelete.dataErasure as boolean;
		}

		const version = this.getNodeParameter('version', itemIndex) as number;
		qs.version = version;

		const url =
			operation === 'deleteInStore'
				? `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/${this.getNodeParameter('cartId', itemIndex) as string}`
				: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/carts/key=${encodeURIComponent(this.getNodeParameter('cartKey', itemIndex) as string)}`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, { itemIndex });
}