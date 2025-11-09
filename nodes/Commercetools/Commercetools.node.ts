import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Commercetools implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Commercetools',
		name: 'Commercetools',
		icon: 'file:Commercetools_Logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with the Commercetools Products API',
		defaults: {
			name: 'Commercetools',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'commerceToolsOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Product',
						value: 'product',
					},
				],
				default: 'product',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Query',
						value: 'query',
						action: 'Query products',
						description: 'Retrieve products using the Composable Commerce Products endpoint',
					},
				],
				default: 'query',
				displayOptions: {
					show: {
						resource: ['product'],
					},
				},
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['query'],
					},
				},
				description: 'Whether to request all products by auto-paginating',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				default: 20,
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['query'],
						returnAll: [false],
					},
				},
				description: 'Maximum number of products to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 0,
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['query'],
					},
				},
				description: 'Number of products to skip before collecting results',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						displayName: 'Expand',
						name: 'expand',
						type: 'string',
						default: [],
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Expand',
						},
						description: 'Controls expansion of reference-type fields',
					},
					{
						displayName: 'Sort',
						name: 'sort',
						type: 'string',
						default: [],
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Sort',
						},
						description: 'Sort expressions, e.g. createdAt desc',
					},
					{
						displayName: 'Where',
						name: 'where',
						type: 'string',
						default: [],
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Predicate',
						},
						description: 'Predicate expressions that filter the products',
					},
					{
						displayName: 'With Total',
						name: 'withTotal',
						type: 'boolean',
						default: true,
						description: 'Whether the response should include the total number of matching products',
					},
					{
						displayName: 'Staged',
						name: 'staged',
						type: 'boolean',
						default: false,
						description: 'Whether to use the staged data when filtering results',
					},
					{
						displayName: 'Price Currency',
						name: 'priceCurrency',
						type: 'string',
						default: '',
						description: 'ISO currency code for price selection, e.g. AUD',
					},
					{
						displayName: 'Price Country',
						name: 'priceCountry',
						type: 'string',
						default: '',
						description: 'Country code used when selecting prices',
					},
					{
						displayName: 'Price Customer Group ID',
						name: 'priceCustomerGroup',
						type: 'string',
						default: '',
						description: 'ID of the customer group to use for price selection',
					},
					{
						displayName: 'Price Channel ID',
						name: 'priceChannel',
						type: 'string',
						default: '',
						description: 'Channel ID used for price selection',
					},
					{
						displayName: 'Locale Projection',
						name: 'localeProjection',
						type: 'string',
						default: [],
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Locale',
						},
						description: 'Restrict the locales returned by the API',
					},
					{
						displayName: 'Store Projection',
						name: 'storeProjection',
						type: 'string',
						default: [],
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Store Key',
						},
						description: 'Restrict to products belonging to the provided store keys',
					},
					{
						displayName: 'Predicate Variables',
						name: 'predicateVariables',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Variable',
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'variable',
								displayName: 'Variable',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
										description: 'Variable name without the var. prefix',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Value assigned to the predicate variable',
									},
								],
							},
						],
					},
					{
						displayName: 'Custom Query Parameters',
						name: 'customParameters',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Parameter',
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'parameter',
								displayName: 'Parameter',
								values: [
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
								],
							},
						],
					},
				],
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['query'],
					},
				},
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource !== 'product' || operation !== 'query') {
					throw new NodeOperationError(this.getNode(), 'Unsupported operation', {
						itemIndex,
					});
				}

				const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;
				const projectKey = credentials.projectKey as string;
				const region = (credentials.region as string) || 'australia-southeast1.gcp';

				if (!projectKey) {
					throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials', {
						itemIndex,
					});
				}

				const baseUrl = `https://api.${region}.commercetools.com/${projectKey}`;

				const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
				const limit = returnAll ? 500 : (this.getNodeParameter('limit', itemIndex, 20) as number);
				const offset = this.getNodeParameter('offset', itemIndex, 0) as number;
				const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

				const qs: IDataObject = { limit };

				if (offset) {
					qs.offset = offset;
				}

				const setArrayField = (fieldName: string, queryName: string) => {
					const value = additionalFields[fieldName];
					if (Array.isArray(value) && value.length) {
						qs[queryName] = value;
					}
				};

				const setValueField = (fieldName: string, queryName: string) => {
					const value = additionalFields[fieldName];
					if (value !== undefined && value !== null && value !== '') {
						qs[queryName] = value;
					}
				};

				setArrayField('expand', 'expand');
				setArrayField('sort', 'sort');
				setArrayField('where', 'where');
				setArrayField('localeProjection', 'localeProjection');
				setArrayField('storeProjection', 'storeProjection');

				if (Object.prototype.hasOwnProperty.call(additionalFields, 'withTotal')) {
					qs.withTotal = additionalFields.withTotal as boolean;
				}
				if (Object.prototype.hasOwnProperty.call(additionalFields, 'staged')) {
					qs.staged = additionalFields.staged as boolean;
				}

				setValueField('priceCurrency', 'priceCurrency');
				setValueField('priceCountry', 'priceCountry');
				setValueField('priceCustomerGroup', 'priceCustomerGroup');
				setValueField('priceChannel', 'priceChannel');

				const predicateVariables = ((additionalFields.predicateVariables as IDataObject)?.variable ?? []) as IDataObject[];
				for (const predicateVariable of predicateVariables) {
					const name = predicateVariable.name as string;
					if (!name) continue;
					qs[`var.${name}`] = predicateVariable.value as string;
				}

				const customParameters = ((additionalFields.customParameters as IDataObject)?.parameter ?? []) as IDataObject[];
				for (const customParameter of customParameters) {
					const key = customParameter.key as string;
					if (!key) continue;
					qs[key] = customParameter.value as string;
				}

				if (returnAll && qs.withTotal === undefined) {
					qs.withTotal = true;
				}

				const collected: IDataObject[] = [];
				let requestOffset = offset;
				let hasMore = true;

				do {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'commerceToolsOAuth2Api',
						{
							method: 'GET',
							url: `${baseUrl}/products`,
							qs: {
								...qs,
								offset: requestOffset,
							},
						},
					);

					const results = (response.results ?? response) as IDataObject[];

					if (!Array.isArray(results)) {
						throw new NodeOperationError(this.getNode(), 'Unexpected response format from Commercetools API', {
							itemIndex,
						});
					}

					collected.push(...results);

					if (!returnAll) {
						hasMore = false;
					} else {
						const received = results.length;
						if (received === 0) {
							hasMore = false;
						} else {
							requestOffset += received;
							const total = response.total as number | undefined;
							hasMore = total !== undefined ? requestOffset < total : received === limit;
						}
					}
				} while (returnAll && hasMore);

				returnData.push(...this.helpers.returnJsonArray(collected));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							itemIndex,
						},
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}

}
