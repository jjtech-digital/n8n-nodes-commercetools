import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	applyCommonCustomerParameters,
	buildActionsFromUi,
	coerceJsonInput,
} from '../utils/customer.utils';

type CustomerOperationArgs = {
	operation: string;
	itemIndex: number;
	baseUrl: string;
	items: INodeExecutionData[];
};

export async function executeCustomerOperation(
	this: IExecuteFunctions,
	{ operation, itemIndex, baseUrl }: CustomerOperationArgs,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	
	if (operation === 'get') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/customers/${customerId}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'getByKey') {
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/customers/key=${encodeURIComponent(customerKey)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}


	if (operation === 'getInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/${customerId}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'getInStoreByKey') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/key=${encodeURIComponent(customerKey)}`,
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

		applyCommonCustomerParameters(qs, additionalFields, {
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
				url: `${baseUrl}/customers`,
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

		applyCommonCustomerParameters(qs, additionalFields, {
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
				url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers`,
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

	
	if (operation === 'head') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/customers/${customerId}`,
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


	if (operation === 'headByKey') {
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/customers/key=${encodeURIComponent(customerKey)}`,
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

	
	if (operation === 'headByQuery') {
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields, {
			allowWhere: true,
			allowPredicateVariables: true,
			allowSort: true,
		});

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/customers`,
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

	
	if (operation === 'headInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/${customerId}`,
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

	
	if (operation === 'headInStoreByKey') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/key=${encodeURIComponent(customerKey)}`,
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

	
	if (operation === 'headInStoreByQuery') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields, {
			allowWhere: true,
			allowPredicateVariables: true,
			allowSort: true,
		});

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'HEAD',
				url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers`,
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

	
	if (operation === 'create') {
		const additionalFields = this.getNodeParameter('additionalFieldsCreate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const draftRaw = this.getNodeParameter('customerDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Customer draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers`,
			body: draft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'createInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsCreate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const draftRaw = this.getNodeParameter('customerDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Customer draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers`,
			body: draft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'update') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		
		const actionsUi = this.getNodeParameter('actionsUi', itemIndex, {}) as IDataObject;
		const actionsRaw = this.getNodeParameter('actions', itemIndex, '') as string;
		
		let actions: IDataObject[] = [];

		
		if (actionsUi && Object.keys(actionsUi).length > 0) {
			actions = buildActionsFromUi(this, actionsUi, itemIndex);
		} 
		
		else if (actionsRaw && actionsRaw.trim()) {
			const parsedActions = coerceJsonInput(this, actionsRaw, 'Actions', itemIndex);
			if (!Array.isArray(parsedActions)) {
				throw new NodeOperationError(
					this.getNode(),
					'Actions must be an array of update actions',
					{ itemIndex },
				);
			}
			actions = parsedActions as IDataObject[];
		} else {
			throw new NodeOperationError(
				this.getNode(),
				'Either Actions (UI) or Actions (JSON) must be provided',
				{ itemIndex },
			);
		}

		const body = {
			version,
			actions,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/${customerId}`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'updateByKey') {
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		
		const actionsUi = this.getNodeParameter('actionsUi', itemIndex, {}) as IDataObject;
		const actionsRaw = this.getNodeParameter('actions', itemIndex, '') as string;
		
		let actions: IDataObject[] = [];

		
		if (actionsUi && Object.keys(actionsUi).length > 0) {
			actions = buildActionsFromUi(this, actionsUi, itemIndex);
		} 
		
		else if (actionsRaw && actionsRaw.trim()) {
			const parsedActions = coerceJsonInput(this, actionsRaw, 'Actions', itemIndex);
			if (!Array.isArray(parsedActions)) {
				throw new NodeOperationError(
					this.getNode(),
					'Actions must be an array of update actions',
					{ itemIndex },
				);
			}
			actions = parsedActions as IDataObject[];
		} else {
			throw new NodeOperationError(
				this.getNode(),
				'Either Actions (UI) or Actions (JSON) must be provided',
				{ itemIndex },
			);
		}

		const body = {
			version,
			actions,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/key=${encodeURIComponent(customerKey)}`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'updateInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		
		const actionsUi = this.getNodeParameter('actionsUi', itemIndex, {}) as IDataObject;
		const actionsRaw = this.getNodeParameter('actions', itemIndex, '') as string;
		
		let actions: IDataObject[] = [];

	
		if (actionsUi && Object.keys(actionsUi).length > 0) {
			actions = buildActionsFromUi(this, actionsUi, itemIndex);
		} 
		
		else if (actionsRaw && actionsRaw.trim()) {
			const parsedActions = coerceJsonInput(this, actionsRaw, 'Actions', itemIndex);
			if (!Array.isArray(parsedActions)) {
				throw new NodeOperationError(
					this.getNode(),
					'Actions must be an array of update actions',
					{ itemIndex },
				);
			}
			actions = parsedActions as IDataObject[];
		} else {
			throw new NodeOperationError(
				this.getNode(),
				'Either Actions (UI) or Actions (JSON) must be provided',
				{ itemIndex },
			);
		}

		if (actions.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Actions must be an array of update actions',
				{ itemIndex },
			);
		}

		const body = {
			version,
			actions,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/${customerId}`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}


	if (operation === 'updateInStoreByKey') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		
		const actionsUi = this.getNodeParameter('actionsUi', itemIndex, {}) as IDataObject;
		const actionsRaw = this.getNodeParameter('actions', itemIndex, '') as string;
		
		let actions: IDataObject[] = [];

		
		if (actionsUi && Object.keys(actionsUi).length > 0) {
			actions = buildActionsFromUi(this, actionsUi, itemIndex);
		} 
		
		else if (actionsRaw && actionsRaw.trim()) {
			const parsedActions = coerceJsonInput(this, actionsRaw, 'Actions', itemIndex);
			if (!Array.isArray(parsedActions)) {
				throw new NodeOperationError(
					this.getNode(),
					'Actions must be an array of update actions',
					{ itemIndex },
				);
			}
			actions = parsedActions as IDataObject[];
		} else {
			throw new NodeOperationError(
				this.getNode(),
				'Either Actions (UI) or Actions (JSON) must be provided',
				{ itemIndex },
			);
		}

		if (actions.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Actions must be an array of update actions',
				{ itemIndex },
			);
		}

		const body = {
			version,
			actions,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/key=${encodeURIComponent(customerKey)}`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}


	if (operation === 'changePassword') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const currentPassword = this.getNodeParameter('currentPassword', itemIndex) as string;
		const newPassword = this.getNodeParameter('newPassword', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body = {
			version,
			currentPassword,
			newPassword,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/${customerId}/password`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'changePasswordInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const currentPassword = this.getNodeParameter('currentPassword', itemIndex) as string;
		const newPassword = this.getNodeParameter('newPassword', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body = {
			version,
			currentPassword,
			newPassword,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/${customerId}/password`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'authenticate') {
		const email = this.getNodeParameter('email', itemIndex) as string;
		const password = this.getNodeParameter('password', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body: IDataObject = {
			email,
			password,
		};

		if (additionalFields.anonymousCartId) {
			body.anonymousCartId = additionalFields.anonymousCartId as string;
		}

		if (additionalFields.anonymousCartSignInMode) {
			body.anonymousCartSignInMode = additionalFields.anonymousCartSignInMode as string;
		}

		if (additionalFields.anonymousId) {
			body.anonymousId = additionalFields.anonymousId as string;
		}

		if (additionalFields.updateProductData !== undefined) {
			body.updateProductData = additionalFields.updateProductData as boolean;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/login`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'authenticateInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const email = this.getNodeParameter('email', itemIndex) as string;
		const password = this.getNodeParameter('password', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body: IDataObject = {
			email,
			password,
		};

		if (additionalFields.anonymousCartId) {
			body.anonymousCartId = additionalFields.anonymousCartId as string;
		}

		if (additionalFields.anonymousCartSignInMode) {
			body.anonymousCartSignInMode = additionalFields.anonymousCartSignInMode as string;
		}

		if (additionalFields.anonymousId) {
			body.anonymousId = additionalFields.anonymousId as string;
		}

		if (additionalFields.updateProductData !== undefined) {
			body.updateProductData = additionalFields.updateProductData as boolean;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/login`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'createPasswordResetToken') {
		const email = this.getNodeParameter('email', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const body: IDataObject = {
			email,
		};

		if (additionalFields.ttlMinutes) {
			body.ttlMinutes = additionalFields.ttlMinutes as number;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/password-token`,
			body,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'getByPasswordToken') {
		const passwordToken = this.getNodeParameter('passwordToken', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/customers/password-token=${encodeURIComponent(passwordToken)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'resetPassword') {
		const tokenValue = this.getNodeParameter('tokenValue', itemIndex) as string;
		const newPassword = this.getNodeParameter('newPassword', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body = {
			tokenValue,
			newPassword,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/password/reset`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'createPasswordResetTokenInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const email = this.getNodeParameter('email', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const body: IDataObject = {
			email,
		};

		if (additionalFields.ttlMinutes) {
			body.ttlMinutes = additionalFields.ttlMinutes as number;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/password-token`,
			body,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'getInStoreByPasswordToken') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const passwordToken = this.getNodeParameter('passwordToken', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/password-token=${encodeURIComponent(passwordToken)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}


	if (operation === 'resetPasswordInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const tokenValue = this.getNodeParameter('tokenValue', itemIndex) as string;
		const newPassword = this.getNodeParameter('newPassword', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body = {
			tokenValue,
			newPassword,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/password/reset`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'createEmailToken') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const body: IDataObject = {
			id: customerId,
			version,
		};

		if (additionalFields.ttlMinutes) {
			body.ttlMinutes = additionalFields.ttlMinutes as number;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/email-token`,
			body,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'getByEmailToken') {
		const emailToken = this.getNodeParameter('emailToken', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/customers/email-token=${encodeURIComponent(emailToken)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'verifyEmail') {
		const tokenValue = this.getNodeParameter('tokenValue', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body = {
			tokenValue,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/customers/email/confirm`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'createEmailTokenInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const body: IDataObject = {
			id: customerId,
			version,
		};

		if (additionalFields.ttlMinutes) {
			body.ttlMinutes = additionalFields.ttlMinutes as number;
		}

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/email-token`,
			body,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'getInStoreByEmailToken') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const emailToken = this.getNodeParameter('emailToken', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/email-token=${encodeURIComponent(emailToken)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'verifyEmailInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const tokenValue = this.getNodeParameter('tokenValue', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const body = {
			tokenValue,
		};

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/email/confirm`,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'delete') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = { version };
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url: `${baseUrl}/customers/${customerId}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}


	if (operation === 'deleteByKey') {
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = { version };
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url: `${baseUrl}/customers/key=${encodeURIComponent(customerKey)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'deleteInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = { version };
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/${customerId}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'deleteInStoreByKey') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = { version };
		applyCommonCustomerParameters(qs, additionalFields);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers/key=${encodeURIComponent(customerKey)}`,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, { itemIndex });
}