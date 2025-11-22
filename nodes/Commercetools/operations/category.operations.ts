import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { coerceActions, coerceJsonInput } from '../utils/product.utils';

type CategoryOperationArgs = {
	operation: string;
	itemIndex: number;
	baseUrl: string;
};

type CategoryParameterOptions = {
	allowSort?: boolean;
	allowWhere?: boolean;
};

const setCommaSeparatedParameter = (
	qs: IDataObject,
	additionalFields: IDataObject,
	fieldName: string,
	queryName = fieldName,
) => {
	const value = additionalFields[fieldName];

	if (value === undefined || value === null || value === '') {
		return;
	}

	const assign = (entries: string[]) => {
		if (entries.length === 0) return;
		if (entries.length === 1) {
			qs[queryName] = entries[0];
		} else {
			qs[queryName] = entries;
		}
	};

	if (Array.isArray(value)) {
		assign(
			value
				.map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
				.filter((entry) => entry.length > 0),
		);
		return;
	}

	if (typeof value === 'string') {
		assign(
			value
				.split(',')
				.map((segment) => segment.trim())
				.filter((segment) => segment.length > 0),
		);
		return;
	}

	qs[queryName] = value;
};

const appendCustomParameters = (qs: IDataObject, additionalFields: IDataObject) => {
	const customParameters =
		((additionalFields.customParameters as IDataObject)?.parameter ?? []) as IDataObject[];
	for (const customParameter of customParameters) {
		const key = (customParameter.key as string | undefined)?.trim();
		if (!key) continue;
		qs[key] = customParameter.value as string;
	}
};

const applyCategoryParameters = (
	qs: IDataObject,
	additionalFields: IDataObject = {},
	options: CategoryParameterOptions = {},
) => {
	setCommaSeparatedParameter(qs, additionalFields, 'expand');
	setCommaSeparatedParameter(qs, additionalFields, 'localeProjection');

	if (options.allowSort) {
		setCommaSeparatedParameter(qs, additionalFields, 'sort');
	}

	if (options.allowWhere) {
		const whereValue = additionalFields.where;
		if (Array.isArray(whereValue)) {
			const entries = whereValue
				.map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
				.filter((entry) => entry.length > 0);
			if (entries.length === 1) {
				qs.where = entries[0];
			} else if (entries.length > 1) {
				qs.where = entries;
			}
		} else if (typeof whereValue === 'string' && whereValue.trim().length > 0) {
			qs.where = whereValue;
		} else if (whereValue) {
			qs.where = whereValue;
		}
	}

	appendCustomParameters(qs, additionalFields);
};

export async function executeCategoryOperation(
	this: IExecuteFunctions,
	{ operation, itemIndex, baseUrl }: CategoryOperationArgs,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];

	if (operation === 'create') {
		const additionalFieldsCreate = this.getNodeParameter('categoryAdditionalFieldsCreate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCategoryParameters(qs, additionalFieldsCreate);

		const draftRaw = this.getNodeParameter('categoryDraft', itemIndex);
		const draft = coerceJsonInput(this, draftRaw, 'Category draft', itemIndex);

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url: `${baseUrl}/categories`,
			body: draft,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'get' || operation === 'getByKey') {
		const additionalFieldsGet = this.getNodeParameter('categoryAdditionalFieldsGet', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCategoryParameters(qs, additionalFieldsGet);

		const identifier =
			operation === 'get'
				? (this.getNodeParameter('categoryId', itemIndex) as string)
				: (this.getNodeParameter('categoryKey', itemIndex) as string);
		const url =
			operation === 'get'
				? `${baseUrl}/categories/${identifier}`
				: `${baseUrl}/categories/key=${encodeURIComponent(identifier)}`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'GET',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'query') {
		const returnAll = this.getNodeParameter('categoryReturnAll', itemIndex, false) as boolean;
		const limit = returnAll ? 500 : (this.getNodeParameter('categoryLimit', itemIndex, 50) as number);
		const offset = this.getNodeParameter('categoryOffset', itemIndex, 0) as number;
		const additionalFieldsQuery = this.getNodeParameter('categoryAdditionalFieldsQuery', itemIndex, {}) as IDataObject;

		const qs: IDataObject = { limit };

		if (offset) {
			qs.offset = offset;
		}

		applyCategoryParameters(qs, additionalFieldsQuery, {
			allowSort: true,
			allowWhere: true,
		});

		if (Object.prototype.hasOwnProperty.call(additionalFieldsQuery, 'withTotal')) {
			qs.withTotal = additionalFieldsQuery.withTotal as boolean;
		} else if (returnAll) {
			qs.withTotal = true;
		}

		const collected: IDataObject[] = [];
		let requestOffset = offset;
		let hasMore = true;

		do {
			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
				method: 'GET',
				url: `${baseUrl}/categories`,
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

	if (operation === 'update' || operation === 'updateByKey') {
		const additionalFieldsUpdate = this.getNodeParameter('categoryAdditionalFieldsUpdate', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCategoryParameters(qs, additionalFieldsUpdate);

		const version = this.getNodeParameter('version', itemIndex) as number;
		const rawActions = this.getNodeParameter('actions', itemIndex);
		const actions = coerceActions(this, rawActions, itemIndex);

		if (actions.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Provide at least one update action via Actions (JSON)',
				{ itemIndex },
			);
		}

		const body = {
			version,
			actions,
		};

		const identifierParam =
			operation === 'update'
				? (this.getNodeParameter('categoryId', itemIndex) as string)
				: (this.getNodeParameter('categoryKey', itemIndex) as string);
		const url =
			operation === 'update'
				? `${baseUrl}/categories/${identifierParam}`
				: `${baseUrl}/categories/key=${encodeURIComponent(identifierParam)}`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'POST',
			url,
			body,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	if (operation === 'delete' || operation === 'deleteByKey') {
		const additionalFieldsDelete = this.getNodeParameter('categoryAdditionalFieldsDelete', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {};
		applyCategoryParameters(qs, additionalFieldsDelete);

		const version = this.getNodeParameter('version', itemIndex) as number;
		qs.version = version;

		const identifierParam =
			operation === 'delete'
				? (this.getNodeParameter('categoryId', itemIndex) as string)
				: (this.getNodeParameter('categoryKey', itemIndex) as string);
		const url =
			operation === 'delete'
				? `${baseUrl}/categories/${identifierParam}`
				: `${baseUrl}/categories/key=${encodeURIComponent(identifierParam)}`;

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
			method: 'DELETE',
			url,
			qs,
		})) as IDataObject;

		results.push({ json: response });
		return results;
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unsupported operation for category resource: ${operation}`,
		{ itemIndex },
	);
}

