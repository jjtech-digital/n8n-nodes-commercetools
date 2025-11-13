import type { INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export const commercetoolsDescription: INodeTypeDescription = {
	displayName: 'Commercetools',
	name: 'Commercetools',
	icon: {
		light: 'file:Commercetools_Logo.svg',
		dark: 'file:Commercetools_Logo.svg',
	},
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
			noDataExpression: true,
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
			noDataExpression: true,
			options: [
				{
					name: 'Create',
					value: 'create',
					action: 'Create product',
					description: 'Create a product draft',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get product',
					description: 'Retrieve a product by ID',
				},
				{
					name: 'Get By Key',
					value: 'getByKey',
					action: 'Get product by key',
					description: 'Retrieve a product using its key',
				},
				{
					name: 'Check Existence',
					value: 'head',
					action: 'Check if product exists',
					description: 'Check whether a product exists by ID',
				},
				{
					name: 'Check Existence By Key',
					value: 'headByKey',
					action: 'Check if product exists by key',
					description: 'Check whether a product exists using its key',
				},
				{
					name: 'Check Existence By Query',
					value: 'headByQuery',
					action: 'Check if any product matches the query',
					description: 'Send a HEAD request with query predicates to check for matches',
				},
				{
					name: 'Query',
					value: 'query',
					action: 'Query products',
					description: 'Retrieve products using the Composable Commerce Products endpoint',
				},
				{
					name: 'Search',
					value: 'search',
					action: 'Search products',
					description: 'Full-text product search using the product search endpoint',
				},
				{
					name: 'Update',
					value: 'update',
					action: 'Update product',
					description: 'Perform update actions on a product by ID',
				},
				{
					name: 'Update By Key',
					value: 'updateByKey',
					action: 'Update product by key',
					description: 'Perform update actions on a product by key',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete product',
					description: 'Delete a product by ID',
				},
				{
					name: 'Delete By Key',
					value: 'deleteByKey',
					action: 'Delete product by key',
					description: 'Delete a product using its key',
				},
				{
					name: 'Query Product Selections',
					value: 'querySelections',
					action: 'Query product selections by product ID',
					description: 'List product selections assigned to a product by ID',
				},
				{
					name: 'Query Product Selections By Key',
					value: 'querySelectionsByKey',
					action: 'Query product selections by product key',
					description: 'List product selections assigned to a product by key',
				},
				{
					name: 'Upload Image',
					value: 'uploadImage',
					action: 'Upload product image',
					description: 'Upload an image to a product variant',
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
			displayName: 'Product ID',
			name: 'productId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['get', 'update', 'delete', 'head', 'querySelections', 'uploadImage'],
				},
			},
			description: 'Unique ID of the product to target',
		},
		{
			displayName: 'Product Key',
			name: 'productKey',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['getByKey', 'updateByKey', 'deleteByKey', 'headByKey', 'querySelectionsByKey'],
				},
			},
			description: 'Unique key of the product to target',
		},
		{
			displayName: 'Product Draft (JSON)',
			name: 'productDraft',
			type: 'json',
			default: '{}',
			required: true,
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['create'],
				},
			},
			description: 'JSON representation of the product draft to create, e.g. <code>{"productType":{"typeId":"product-type","ID":"..."},"name":{"en":"Product"},"slug":{"en":"product"}}</code>',
		},
		{
			displayName: 'Version',
			name: 'version',
			type: 'number',
			typeOptions: {
				minValue: 0,
			},
			default: 0,
			required: true,
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['update', 'updateByKey', 'delete', 'deleteByKey'],
				},
			},
			description: 'Current version of the product to ensure optimistic concurrency control',
		},
		{
			displayName: 'Actions (JSON)',
			name: 'actions',
			type: 'json',
			default: '[]',
			description: 'Update actions to apply to the product',
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['update', 'updateByKey'],
				},
			},
		},
		{
			displayName: 'Actions (UI)',
			name: 'actionsUi',
			type: 'fixedCollection',
			default: {},
			placeholder: 'Add Action',
			typeOptions: {
				multipleValues: true,
			},
			description: 'Update actions built via UI for ease of use',
			options: [
				{
					displayName: 'Action',
					name: 'action',
					values: [
						{
							displayName: 'Change Product Name',
							name: 'changeProductName',
							type: 'collection',
							default: {},
							placeholder: 'Add Change Name Action',
							options: [
								{
									displayName: 'Localized Names',
									name: 'localizedNames',
									type: 'fixedCollection',
									default: {},
									typeOptions: {
										multipleValues: true,
									},
									options: [
										{
											name: 'value',
											displayName: 'Value',
											values: [
												{
													displayName: 'Locale',
													name: 'locale',
													type: 'string',
													default: '',
													description: 'Locale identifier, e.g. "en-US"',
												},
												{
													displayName: 'Name',
													name: 'value',
													type: 'string',
													default: '',
													description: 'Localized product name for the locale',
												},
											],
										},
									],
								},
								{
									displayName: 'Apply to Staged Version',
									name: 'staged',
									type: 'boolean',
									default: false,
									description: 'Whether the name change should apply to the staged product data',
								},
							],
						},
						{
							displayName: 'Set Product Key',
							name: 'setProductKey',
							type: 'collection',
							default: {},
							placeholder: 'Add Set Product Key Action',
							options: [
								{
									displayName: 'New Key',
									name: 'key',
									type: 'string',
									default: '',
									description: 'New product key to set',
								},
								{
									displayName: 'Remove Key',
									name: 'removeKey',
									type: 'boolean',
									default: false,
									description: 'Whether to remove the product key instead of setting a new one',
								},
							],
						},
					],
				},
			],
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['update', 'updateByKey'],
				},
			},
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
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Sort',
					name: 'sort',
					type: 'string',
					default: '',
					description: 'Sorting expression for query results, e.g. <code>createdAt desc</code>',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to retrieve the staged projection',
				},
				{
					displayName: 'Where',
					name: 'where',
					type: 'string',
					default: '',
					description: 'Query predicates to filter results',
				},
				{
					displayName: 'With Total',
					name: 'withTotal',
					type: 'boolean',
					default: true,
					description: 'Whether the query should calculate the total number of matching products',
				},
				{
					displayName: 'Predicate Variables',
					name: 'predicateVariables',
					type: 'fixedCollection',
					default: {},
					placeholder: 'Add Predicate Variable',
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
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: {
				minValue: 1,
				maxValue: 500,
			},
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['query'],
					returnAll: [false],
				},
			},
			description: 'Max number of results to return',
		},
		{
			displayName: 'Offset',
			name: 'offset',
			type: 'number',
			default: 0,
			typeOptions: {
				minValue: 0,
			},
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['query'],
				},
			},
			description: 'Number of products to skip before returning results',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsGet',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to retrieve the staged projection',
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
					operation: ['get', 'getByKey'],
				},
			},
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsSearch',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Mark Matching Variants',
					name: 'markMatchingVariants',
					type: 'boolean',
					default: false,
					description: 'Whether to mark matching variants in search results',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to retrieve the staged projection',
				},
				{
					displayName: 'With Total',
					name: 'withTotal',
					type: 'boolean',
					default: true,
					description: 'Whether the search should calculate the total number of matching products',
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
					operation: ['search'],
				},
			},
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsCreate',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: true,
					description: 'Whether to create the product in the staged state',
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
					operation: ['create'],
				},
			},
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsUpdate',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Data Erasure',
					name: 'dataErasure',
					type: 'boolean',
					default: false,
					description: 'Whether to irreversibly delete personal data',
				},
				{
					displayName: 'Dry Run',
					name: 'dryRun',
					type: 'boolean',
					default: false,
					description: 'Simulate the update without persisting changes',
				},
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether the update should affect the staged product data',
				},
				{
					displayName: 'Predicate Variables',
					name: 'predicateVariables',
					type: 'fixedCollection',
					default: {},
					placeholder: 'Add Predicate Variable',
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
					operation: ['update', 'updateByKey'],
				},
			},
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsDelete',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Data Erasure',
					name: 'dataErasure',
					type: 'boolean',
					default: false,
					description: 'Whether to irreversibly delete personal data',
				},
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to delete the staged projection',
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
					operation: ['delete', 'deleteByKey'],
				},
			},
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsHead',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Locale Projection',
					name: 'localeProjection',
					type: 'string',
					default: '',
					description: 'Select locales for returned localized fields',
				},
				{
					displayName: 'Price Channel',
					name: 'priceChannel',
					type: 'string',
					default: '',
					description: 'Channel to select prices for',
				},
				{
					displayName: 'Price Country',
					name: 'priceCountry',
					type: 'string',
					default: '',
					description: 'Country to select prices for',
				},
				{
					displayName: 'Price Currency',
					name: 'priceCurrency',
					type: 'string',
					default: '',
					description: 'Currency code for price selection',
				},
				{
					displayName: 'Price Customer Group',
					name: 'priceCustomerGroup',
					type: 'string',
					default: '',
					description: 'Customer group to select prices for',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to inspect the staged projection',
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
					operation: ['head', 'headByKey'],
				},
			},
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsSelections',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'number',
					default: 50,
					typeOptions: {
						minValue: 1,
						maxValue: 500,
					},
					description: 'Max number of results to return',
				},
				{
					displayName: 'Offset',
					name: 'offset',
					type: 'number',
					default: 0,
					typeOptions: {
						minValue: 0,
					},
					description: 'Number of product selections to skip before returning results',
				},
				{
					displayName: 'With Total',
					name: 'withTotal',
					type: 'boolean',
					default: true,
					description: 'Whether the query should calculate the total number of matching product selections',
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
					operation: ['querySelections', 'querySelectionsByKey'],
				},
			},
		},
		{
			displayName: 'Search Request (JSON)',
			name: 'searchRequest',
			type: 'json',
			default: '{}',
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['search'],
				},
			},
			description: 'Search request body for the Product Search endpoint',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsUpload',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Filename',
					name: 'filename',
					type: 'string',
					default: '',
					description: 'Filename to store with the uploaded image',
				},
				{
					displayName: 'Variant ID',
					name: 'variantId',
					type: 'number',
					typeOptions: {
						minValue: 0,
					},
					default: 0,
					description: 'Variant ID the image belongs to',
				},
				{
					displayName: 'SKU',
					name: 'sku',
					type: 'string',
					default: '',
					description: 'SKU the image belongs to',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: true,
					description: 'Whether to add the image to the staged version',
				},
				{
					displayName: 'External URL',
					name: 'externalUrl',
					type: 'string',
					default: '',
					description: 'If set, treats the image as an external URL instead of uploading binary content',
				},
				{
					displayName: 'Label',
					name: 'label',
					type: 'string',
					default: '',
					description: 'Localized label for the image, e.g. <code>{"en":"Front"}</code>',
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
					operation: ['uploadImage'],
				},
			},
		},
		{
			displayName: 'Binary Property',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			required: true,
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['uploadImage'],
				},
			},
			description: 'Name of the binary property in the incoming item that contains the image',
		},
	],
};
