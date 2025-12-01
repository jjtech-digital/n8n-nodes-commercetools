import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	applyCommonCustomerParameters,
	buildActionsFromUi,
	coerceJsonInput,
} from '../utils/customer.utils';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT_RETURN_ALL = 500;
const MIN_VERSION = 1;

/**
 * Extracts HTTP status code from Commercetools API error response
 * @param error - Error object from API response
 * @returns HTTP status code if available
 */
function getErrorStatusCode(error: IDataObject): number | undefined {
	return (
		(error.statusCode as number | undefined) ??
		((error.cause as IDataObject)?.statusCode as number | undefined) ??
		((error.response as IDataObject)?.statusCode as number | undefined)
	);
}


async function getActionsForUpdate(
	executeFunctions: IExecuteFunctions,
	itemIndex: number
): Promise<IDataObject[]> {
	const actionsUi = executeFunctions.getNodeParameter('actionsUi', itemIndex, {}) as IDataObject;
	const actions = buildActionsFromUi(executeFunctions, actionsUi, itemIndex);

	if (actions.length === 0) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'At least one action must be provided',
			{ itemIndex }
		);
	}

	return actions;
}


async function handleHeadOperation(
	executeFunctions: IExecuteFunctions,
	url: string
): Promise<{ exists: boolean }> {
	try {
		await executeFunctions.helpers.httpRequestWithAuthentication.call(
			executeFunctions,
			'commerceToolsOAuth2Api',
			{ method: 'HEAD', url }
		);
		return { exists: true };
	} catch (error) {
		const errorData = error as IDataObject;
		const statusCode = getErrorStatusCode(errorData);
		if (statusCode === 404 || errorData.httpCode === '404') {
			return { exists: false };
		}
		throw error;
	}
}

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
		const limit = returnAll ? MAX_LIMIT_RETURN_ALL : (this.getNodeParameter('limit', itemIndex, DEFAULT_LIMIT) as number);
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
		let hasMore;

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
		if (!storeKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Store Key cannot be empty', { itemIndex });
		}
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = returnAll ? MAX_LIMIT_RETURN_ALL : (this.getNodeParameter('limit', itemIndex, DEFAULT_LIMIT) as number);
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
		let hasMore;

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
		if (!customerId?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer ID cannot be empty', { itemIndex });
		}

		const result = await handleHeadOperation(
			this,
			`${baseUrl}/customers/${customerId}`
		);
		results.push({ json: result });
		return results;
	}


	if (operation === 'headByKey') {
		const customerKey = this.getNodeParameter('customerKey', itemIndex) as string;
		if (!customerKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer Key cannot be empty', { itemIndex });
		}

		const result = await handleHeadOperation(
			this,
			`${baseUrl}/customers/key=${encodeURIComponent(customerKey)}`
		);
		results.push({ json: result });
		return results;
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
			const statusCode = getErrorStatusCode(errorData);
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
			const statusCode = getErrorStatusCode(errorData);
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
			const statusCode = getErrorStatusCode(errorData);
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
			const statusCode = getErrorStatusCode(errorData);
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

		// Validate required fields for customer creation
		if (!draft.email || typeof draft.email !== 'string' || !draft.email.trim()) {
			throw new NodeOperationError(
				this.getNode(),
				'Email is required for customer creation. Please provide a valid email address in the customer draft.',
				{ itemIndex }
			);
		}

		try {
			const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'POST',
				url: `${baseUrl}/customers`,
				body: draft,
				qs,
			})) as IDataObject;

			results.push({ json: response });
			return results;
		} catch (error) {
			const statusCode = getErrorStatusCode(error as IDataObject);
			const errorMessage = (error as IDataObject).message as string || '';
			
			if (statusCode === 400) {
				// Email already exists error
				if (errorMessage.includes('email') && errorMessage.includes('exists')) {
					throw new NodeOperationError(
						this.getNode(),
						`A customer with this email address already exists. Please use a different email address or use the authenticate operation to sign in existing customers.`,
						{ itemIndex }
					);
				}
			}
			
			// LockedField error (simultaneous customer creation)
			if (statusCode === 409 && errorMessage.includes('LockedField')) {
				throw new NodeOperationError(
					this.getNode(),
					`Another customer with the same email is being created simultaneously. Please wait a moment and try again.`,
					{ itemIndex }
				);
			}
			
			throw error;
		}
	}

	if (operation === 'createInStore') {
		const storeKey = this.getNodeParameter('storeKey', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFieldsCreate', itemIndex, {}) as IDataObject;
		
		if (!storeKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Store Key cannot be empty', { itemIndex });
		}
		
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const draftRaw = this.getNodeParameter('customerDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Customer draft', itemIndex);

		// Validate required fields for customer creation
		if (!draft.email || typeof draft.email !== 'string' || !draft.email.trim()) {
			throw new NodeOperationError(
				this.getNode(),
				'Email is required for customer creation. Please provide a valid email address in the customer draft.',
				{ itemIndex }
			);
		}

		let response: IDataObject;
		try {
			response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'POST',
				url: `${baseUrl}/in-store/key=${encodeURIComponent(storeKey)}/customers`,
				body: draft,
				qs,
			})) as IDataObject;
		} catch (error) {
			const statusCode = getErrorStatusCode(error as IDataObject);
			const errorMessage = (error as IDataObject).message as string || '';
			
			if (statusCode === 400) {
				// Store not found error
				if (errorMessage.includes("referenced object of type 'store'")) {
					throw new NodeOperationError(
						this.getNode(),
						`Store with key '${storeKey}' was not found. Please check that the store exists in your Commercetools project or use a different store key.`,
						{ itemIndex }
					);
				}
				// Email already exists error
				if (errorMessage.includes('email') && errorMessage.includes('exists')) {
					throw new NodeOperationError(
						this.getNode(),
						`A customer with this email address already exists. Please use a different email address or use the authenticate operation to sign in existing customers.`,
						{ itemIndex }
					);
				}
				// Cart store mismatch error
				if (errorMessage.includes('cart') && errorMessage.includes('store')) {
					throw new NodeOperationError(
						this.getNode(),
						`The cart's store field must reference the same store (${storeKey}) specified in the path parameter.`,
						{ itemIndex }
					);
				}
				// Missing required fields
				if (errorMessage.includes('email') && errorMessage.includes('required')) {
					throw new NodeOperationError(
						this.getNode(),
						`Email is required for customer creation. Please provide a valid email address in the customer draft.`,
						{ itemIndex }
					);
				}
			}
			
			// LockedField error (simultaneous customer creation)
			if (statusCode === 409 && errorMessage.includes('LockedField')) {
				throw new NodeOperationError(
					this.getNode(),
					`Another customer with the same email is being created simultaneously. Please wait a moment and try again.`,
					{ itemIndex }
				);
			}
			
			throw error;
		}

		results.push({ json: response });
		return results;
	}

	
	if (operation === 'update') {
		const customerId = this.getNodeParameter('customerId', itemIndex) as string;
		const version = this.getNodeParameter('version', itemIndex) as number;
		const additionalFields = this.getNodeParameter('additionalFieldsUpdate', itemIndex, {}) as IDataObject;
		
		if (!customerId?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer ID cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
		
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const actions = await getActionsForUpdate(this, itemIndex);

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
		
		if (!customerKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer Key cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
		
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const actions = await getActionsForUpdate(this, itemIndex);

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
		
		if (!storeKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Store Key cannot be empty', { itemIndex });
		}
		if (!customerId?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer ID cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
		
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const actions = await getActionsForUpdate(this, itemIndex);

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
		
		if (!storeKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Store Key cannot be empty', { itemIndex });
		}
		if (!customerKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer Key cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
		
		const qs: IDataObject = {};
		applyCommonCustomerParameters(qs, additionalFields);

		const actions = await getActionsForUpdate(this, itemIndex);

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
		
		if (!customerId?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer ID cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
		if (!currentPassword?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Current Password cannot be empty', { itemIndex });
		}
		if (!newPassword?.trim()) {
			throw new NodeOperationError(this.getNode(), 'New Password cannot be empty', { itemIndex });
		}
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
		
		if (!customerId?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer ID cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
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
		
		if (!customerKey?.trim()) {
			throw new NodeOperationError(this.getNode(), 'Customer Key cannot be empty', { itemIndex });
		}
		if (version < MIN_VERSION) {
			throw new NodeOperationError(this.getNode(), `Version must be ${MIN_VERSION} or greater`, { itemIndex });
		}
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