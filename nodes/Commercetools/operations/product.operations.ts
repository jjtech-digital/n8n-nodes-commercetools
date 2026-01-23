import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	applyCommonParameters,
	coerceActions,
	coerceJsonInput,
} from '../utils/common.utils';
import { buildActionsFromUi } from '../utils/actionBuilder';

type ProductOperationArgs = {
	operation: string;
	itemIndex: number;
	baseUrl: string;
	items: INodeExecutionData[];
};

export async function executeProductOperation(
	this: IExecuteFunctions,
	{ operation, itemIndex, baseUrl, items }: ProductOperationArgs,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	if (operation === 'create') {
		const additionalFieldsCreate = this.getNodeParameter('additionalFieldsCreate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsCreate);

		const draftRaw = this.getNodeParameter('productDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Product draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/products`,
			body: draft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

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
				url: `${baseUrl}/products`,
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

	if (operation === 'search') {
		const additionalFieldsSearch = this.getNodeParameter('additionalFieldsSearch', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsSearch);

		if (additionalFieldsSearch.limit) {
			qs.limit = additionalFieldsSearch.limit;
		}
		if (additionalFieldsSearch.offset) {
			qs.offset = additionalFieldsSearch.offset;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsSearch, 'withTotal')) {
			qs.withTotal = additionalFieldsSearch.withTotal;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsSearch, 'markMatchingVariants')) {
			qs.markMatchingVariants = additionalFieldsSearch.markMatchingVariants;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsSearch, 'staged')) {
			qs.staged = additionalFieldsSearch.staged;
		}

		const bodyRaw = this.getNodeParameter('searchRequest', itemIndex);
		const body = coerceJsonInput(this, bodyRaw, 'Search request', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/products/search`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

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
				url: `${baseUrl}/products`,
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

	if (operation === 'head' || operation === 'headByKey') {
		const identifier =
			operation === 'head'
				? this.getNodeParameter('productId', itemIndex)
				: this.getNodeParameter('productKey', itemIndex);
		const url =
			operation === 'head'
				? `${baseUrl}/products/${identifier}`
				: `${baseUrl}/products/key=${encodeURIComponent(identifier as string)}`;

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

	if (operation === 'get' || operation === 'getByKey') {
		const additionalFieldsGet = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonParameters(qs, additionalFieldsGet);

		if (operation === 'get') {
			const productId = this.getNodeParameter('productId', itemIndex) as string;
			const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'GET',
				url: `${baseUrl}/products/${productId}`,
				qs,
			})) as IDataObject;

			results.push({ json: response });
			return results;
		}

		const productKey = this.getNodeParameter('productKey', itemIndex) as string;
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/products/key=${encodeURIComponent(productKey)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

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
		const actions = [...actionsFromJson, ...actionsFromUi];

		if (actions.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Provide at least one update action via Actions (JSON) or Actions (UI)',
				{ itemIndex },
			);
		}

		const body = {
			version,
			actions,
		};
		

		if (operation === 'update') {
			const productId = this.getNodeParameter('productId', itemIndex) as string;
			const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'POST',
				url: `${baseUrl}/products/${productId}`,
				body,
				qs,
			})) as IDataObject;

			results.push({ json: response });
			return results;
		}

		const productKey = this.getNodeParameter('productKey', itemIndex) as string;
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/products/key=${encodeURIComponent(productKey)}`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

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
				? `${baseUrl}/products/${this.getNodeParameter('productId', itemIndex) as string}`
				: `${baseUrl}/products/key=${encodeURIComponent(this.getNodeParameter('productKey', itemIndex) as string)}`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'querySelections' || operation === 'querySelectionsByKey') {
		const additionalFieldsSelections = this.getNodeParameter('additionalFieldsSelections', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		if (additionalFieldsSelections.expand) {
			qs.expand = additionalFieldsSelections.expand;
		}
		if (additionalFieldsSelections.limit) {
			qs.limit = additionalFieldsSelections.limit;
		}
		if (additionalFieldsSelections.offset) {
			qs.offset = additionalFieldsSelections.offset;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsSelections, 'withTotal')) {
			qs.withTotal = additionalFieldsSelections.withTotal as boolean;
		}

		const customParameters =
			((additionalFieldsSelections.customParameters as IDataObject)?.parameter ?? []) as IDataObject[];
		for (const customParameter of customParameters) {
			const key = customParameter.key as string;
			if (!key) continue;
			qs[key] = customParameter.value as string;
		}

		const url =
			operation === 'querySelections'
				? `${baseUrl}/products/${this.getNodeParameter('productId', itemIndex) as string}/product-selections`
				: `${baseUrl}/products/key=${encodeURIComponent(this.getNodeParameter('productKey', itemIndex) as string)}/product-selections`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'uploadImage') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
		const additionalFieldsUpload = this.getNodeParameter('additionalFieldsUpload', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};

		if (additionalFieldsUpload.variantId) {
			qs.variant = additionalFieldsUpload.variantId;
		}
		if (additionalFieldsUpload.sku) {
			qs.sku = additionalFieldsUpload.sku;
		}
		if (Object.prototype.hasOwnProperty.call(additionalFieldsUpload, 'staged')) {
			qs.staged = additionalFieldsUpload.staged;
		}
		if (additionalFieldsUpload.filename) {
			qs.filename = additionalFieldsUpload.filename;
		}
		if (additionalFieldsUpload.externalUrl) {
			qs.externalUrl = additionalFieldsUpload.externalUrl;
		}
		if (additionalFieldsUpload.label) {
			qs.label = additionalFieldsUpload.label;
		}

		const customParameters =
			((additionalFieldsUpload.customParameters as IDataObject)?.parameter ?? []) as IDataObject[];
		for (const customParameter of customParameters) {
			const key = customParameter.key as string;
			if (!key) continue;
			qs[key] = customParameter.value as string;
		}

		const item = items[itemIndex];
		const binaryData = item.binary?.[binaryPropertyName];

		if (!additionalFieldsUpload.externalUrl && !binaryData) {
			throw new NodeOperationError(
				this.getNode(),
				`Binary data property "${binaryPropertyName}" does not exist on item ${itemIndex}`,
				{ itemIndex },
			);
		}

		let body: IDataObject | undefined;
		if (!additionalFieldsUpload.externalUrl) {
			const binaryBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
			body = {
				formData: {
					file: {
						value: binaryBuffer,
						options: {
							filename:
								additionalFieldsUpload.filename ||
								binaryData?.fileName ||
								`${binaryPropertyName}.bin`,
							contentType: binaryData?.mimeType || 'application/octet-stream',
						},
					},
				},
			} as IDataObject;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/products/${this.getNodeParameter('productId', itemIndex) as string}/images`,
			qs,
			...(body ?? {}),
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, { itemIndex });
}
