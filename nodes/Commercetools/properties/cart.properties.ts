import type { INodeProperties } from 'n8n-workflow';

export const cartOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Check if Cart Exists',
				value: 'head',
				action: 'Check if cart exists by ID',
				description: 'Check whether a cart exists by ID',
			},
			{
				name: 'Check if Cart Exists By Customer ID',
				value: 'headByCustomerId',
				action: 'Check if cart exists by customer ID',
				description: 'Check whether a cart exists using customer ID',
			},
			{
				name: 'Check if Cart Exists By Key',
				value: 'headByKey',
				action: 'Check if cart exists by key',
				description: 'Check whether a cart exists using its key',
			},
			{
				name: 'Check if Cart Exists By Query',
				value: 'headByQuery',
				action: 'Check if any cart matches the query',
				description: 'Send a HEAD request with query predicates to check for matches',
			},
			{
				name: 'Check if Cart Exists in Store',
				value: 'headInStore',
				action: 'Check if cart exists in store by ID',
				description: 'Check whether a cart exists by ID in a specific store',
			},
			{
				name: 'Check if Cart Exists in Store By Customer ID',
				value: 'headInStoreByCustomerId',
				action: 'Check if cart exists in store by customer ID',
				description: 'Check whether a cart exists by customer ID in a specific store',
			},
			{
				name: 'Check if Cart Exists in Store By Key',
				value: 'headInStoreByKey',
				action: 'Check if cart exists in store by key',
				description: 'Check whether a cart exists by key in a specific store',
			},
			{
				name: 'Check if Cart Exists in Store By Query',
				value: 'headInStoreByQuery',
				action: 'Check if any cart matches the query in store',
				description: 'Send a HEAD request with query predicates to check for matches in a specific store',
			},
			{
				name: 'Create Cart',
				value: 'create',
				action: 'Create cart',
				description: 'Create a new cart',
			},
			{
				name: 'Create Cart in Store',
				value: 'createInStore',
				action: 'Create cart in store',
				description: 'Create a new cart in a specific store',
			},
			{
				name: 'Delete Cart',
				value: 'delete',
				action: 'Delete cart by ID',
				description: 'Delete a cart by ID',
			},
			{
				name: 'Delete Cart By Key',
				value: 'deleteByKey',
				action: 'Delete cart by key',
				description: 'Delete a cart using its key',
			},
			{
				name: 'Delete Cart in Store',
				value: 'deleteInStore',
				action: 'Delete cart in store by ID',
				description: 'Delete a cart by ID in a specific store',
			},
			{
				name: 'Delete Cart in Store By Key',
				value: 'deleteInStoreByKey',
				action: 'Delete cart in store by key',
				description: 'Delete a cart by key in a specific store',
			},
			{
				name: 'Get Cart',
				value: 'get',
				action: 'Get cart by ID',
				description: 'Retrieve a cart by ID',
			},
			{
				name: 'Get Cart By Customer ID',
				value: 'getByCustomerId',
				action: 'Get cart by customer ID',
				description: 'Retrieve a cart using customer ID',
			},
			{
				name: 'Get Cart By Key',
				value: 'getByKey',
				action: 'Get cart by key',
				description: 'Retrieve a cart using its key',
			},
			{
				name: 'Get Cart in Store',
				value: 'getInStore',
				action: 'Get cart in store by ID',
				description: 'Retrieve a cart by ID in a specific store',
			},
			{
				name: 'Get Cart in Store By Customer ID',
				value: 'getInStoreByCustomerId',
				action: 'Get cart in store by customer ID',
				description: 'Retrieve a cart by customer ID in a specific store',
			},
			{
				name: 'Get Cart in Store By Key',
				value: 'getInStoreByKey',
				action: 'Get cart in store by key',
				description: 'Retrieve a cart by key in a specific store',
			},
			{
				name: 'Merge Cart',
				value: 'merge',
				action: 'Merge cart',
				description: 'Merge one cart into another',
			},
			{
				name: 'Merge Cart in Store',
				value: 'mergeInStore',
				action: 'Merge cart in store',
				description: 'Merge one cart into another in a specific store',
			},
			{
				name: 'Query Carts',
				value: 'query',
				action: 'Query carts',
				description: 'Retrieve carts using query parameters',
			},
			{
				name: 'Query Carts in Store',
				value: 'queryInStore',
				action: 'Query carts in store',
				description: 'Retrieve carts using query parameters in a specific store',
			},
			{
				name: 'Replicate Cart',
				value: 'replicate',
				action: 'Replicate cart',
				description: 'Create a replica of an existing cart',
			},
			{
				name: 'Replicate Cart in Store',
				value: 'replicateInStore',
				action: 'Replicate cart in store',
				description: 'Create a replica of an existing cart in a specific store',
			},
			{
				name: 'Update Cart',
				value: 'update',
				action: 'Update cart by ID',
				description: 'Perform update actions on a cart by ID',
			},
			{
				name: 'Update Cart By Key',
				value: 'updateByKey',
				action: 'Update cart by key',
				description: 'Perform update actions on a cart by key',
			},
			{
				name: 'Update Cart in Store',
				value: 'updateInStore',
				action: 'Update cart in store by ID',
				description: 'Perform update actions on a cart by ID in a specific store',
			},
			{
				name: 'Update Cart in Store By Key',
				value: 'updateInStoreByKey',
				action: 'Update cart in store by key',
				description: 'Perform update actions on a cart by key in a specific store',
			},
		],
		default: 'query',
		displayOptions: {
			show: {
				resource: ['cart'],
			},
		},
	}
];

export const cartIdentificationFields: INodeProperties[] = [
	{
		displayName: 'Cart ID',
		name: 'cartId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: [
					'get',
					'update',
					'delete',
					'head',
					'merge',
					'replicate',
					'getInStore',
					'updateInStore',
					'deleteInStore',
					'headInStore',
					'mergeInStore',
					'replicateInStore',
				],
			},
		},
		description: 'Unique ID of the cart to target',
	},
	{
		displayName: 'Cart Key',
		name: 'cartKey',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: [
					'getByKey',
					'updateByKey',
					'deleteByKey',
					'headByKey',
					'getInStoreByKey',
					'updateInStoreByKey',
					'deleteInStoreByKey',
					'headInStoreByKey',
				],
			},
		},
		description: 'Unique key of the cart to target',
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: [
					'getByCustomerId',
					'headByCustomerId',
					'getInStoreByCustomerId',
					'headInStoreByCustomerId',
				],
			},
		},
		description: 'Unique ID of the customer',
	},
	{
		displayName: 'Store Key',
		name: 'storeKey',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: [
					'createInStore',
					'getInStore',
					'getInStoreByKey',
					'getInStoreByCustomerId',
					'queryInStore',
					'headInStore',
					'headInStoreByKey',
					'headInStoreByCustomerId',
					'headInStoreByQuery',
					'updateInStore',
					'updateInStoreByKey',
					'deleteInStore',
					'deleteInStoreByKey',
					'mergeInStore',
					'replicateInStore',
				],
			},
		},
		description: 'Key of the store',
	},
];

export const cartDraftFields: INodeProperties[] = [
	{
		displayName: 'Cart Draft (JSON)',
		name: 'cartDraft',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['create', 'createInStore'],
			},
		},
		description: 'JSON representation of the cart draft to create, e.g. <code>{"currency":"USD","customerID":"customer-ID","lineItems":[{"productID":"product-ID","variant":{"ID":1},"quantity":1}]}</code>',
	},
	{
		displayName: 'Replica Cart Draft (JSON)',
		name: 'replicaCartDraft',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['replicate', 'replicateInStore'],
			},
		},
		description: 'JSON representation of the replica cart draft configuration',
	},
	{
		displayName: 'Merge Cart Draft (JSON)',
		name: 'mergeCartDraft',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['merge', 'mergeInStore'],
			},
		},
		description: 'JSON representation of the merge cart draft with source cart reference',
	},
];

export const cartAdditionalFields: INodeProperties[] = [
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['query', 'queryInStore', 'headByQuery', 'headInStoreByQuery'],
			},
		},
		options: [
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Number of results to skip',
			},
			{
				displayName: 'Predicate Variables (JSON)',
				name: 'predicateVariables',
				type: 'json',
				default: '{}',
				description: 'Variables for predicate placeholders in JSON format',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '',
				description: 'Sort the results. Supported fields depend on the endpoint. Pass multiple sort parameters by separating with comma',
			},
			{
				displayName: 'Where',
				name: 'where',
				type: 'string',
				default: '',
				description: 'Query predicates. See <a href="https://docs.commercetools.com/api/predicates/query" target="_blank">documentation</a>.',
			},
			{
				displayName: 'With Total',
				name: 'withTotal',
				type: 'boolean',
				default: true,
				description: 'Whether to include total count in the response',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsGet',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: [
					'get',
					'getByKey',
					'getByCustomerId',
					'getInStore',
					'getInStoreByKey',
					'getInStoreByCustomerId',
				],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsCreate',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['create', 'createInStore'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsUpdate',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Data Erasure',
				name: 'dataErasure',
				type: 'boolean',
				default: false,
				description: 'Whether to erase personal data',
			},
			{
				displayName: 'Dry Run',
				name: 'dryRun',
				type: 'boolean',
				default: false,
				description: 'Whether to perform a dry run without saving changes',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsDelete',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['delete', 'deleteByKey', 'deleteInStore', 'deleteInStoreByKey'],
			},
		},
		options: [
			{
				displayName: 'Data Erasure',
				name: 'dataErasure',
				type: 'boolean',
				default: false,
				description: 'Whether to erase personal data',
			},
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsReplicate',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['replicate', 'replicateInStore'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsMerge',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['merge', 'mergeInStore'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion. Pass multiple expansions by separating with comma.',
			},
			{
				displayName: 'Custom Parameters',
				name: 'customParameters',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				default: {},
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
								description: 'Custom parameter key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Custom parameter value',
							},
						],
					},
				],
			},
		],
	},
	// Common fields for all operations
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['query', 'queryInStore'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['query', 'queryInStore'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['query', 'queryInStore'],
			},
		},
		typeOptions: {
			minValue: 0,
		},
		default: 0,
		description: 'Number of results to skip',
	},
];