import type { INodeProperties } from 'n8n-workflow';

export const categoryOperations: INodeProperties[] = [
	{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create category',
						description: 'Create a new category draft',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete category',
						description: 'Delete a category by ID',
					},
					{
						name: 'Delete By Key',
						value: 'deleteByKey',
						action: 'Delete category by key',
						description: 'Delete a category using its unique key',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get category',
						description: 'Retrieve a category by ID',
					},
					{
						name: 'Get By Key',
						value: 'getByKey',
						action: 'Get category by key',
						description: 'Retrieve a category using its key',
					},
					{
						name: 'Query',
						value: 'query',
						action: 'Query categories',
						description: 'List categories using the Composable Commerce Categories endpoint',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update category',
						description: 'Perform update actions on a category by ID',
					},
					{
						name: 'Update By Key',
						value: 'updateByKey',
						action: 'Update category by key',
						description: 'Perform update actions on a category by key',
					},
				],
				default: 'query',
				displayOptions: {
					show: {
						resource: ['category'],
					},
				},
			}
];

export const categoryBaseFields: INodeProperties[] = [
	{
				displayName: 'Category ID',
				name: 'categoryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'Unique ID of the category to target',
			},
	{
				displayName: 'Category Key',
				name: 'categoryKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['getByKey', 'updateByKey', 'deleteByKey'],
					},
				},
				description: 'Unique key of the category to target',
			},
	{
				displayName: 'Category Draft (JSON)',
				name: 'categoryDraft',
				type: 'json',
				default: '{}',
				required: true,
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['create'],
					},
				},
				description:
					'JSON representation of the category draft to create, e.g. <code>{"name":{"en":"Accessories"},"slug":{"en":"accessories"}}</code>',
			}
];

export const categoryAdditionalFields: INodeProperties[] = [
	{
				displayName: 'Additional Fields',
				name: 'categoryAdditionalFieldsQuery',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				options: [
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
						displayName: 'Sort',
						name: 'sort',
						type: 'string',
						default: '',
						description: 'Sorting expression for query results, e.g. <code>createdAt desc</code>',
					},
					{
						displayName: 'Where',
						name: 'where',
						type: 'string',
						default: '',
						description: 'Query predicate to filter categories',
					},
					{
						displayName: 'With Total',
						name: 'withTotal',
						type: 'boolean',
						default: true,
						description: 'Whether the query should calculate the total number of matching categories',
					},
				],
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['query'],
					},
				},
			},
	{
				displayName: 'Return All',
				name: 'categoryReturnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['query'],
					},
				},
				description: 'Whether to return all results or only up to a given limit',
			},
	{
				displayName: 'Limit',
				name: 'categoryLimit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['query'],
						categoryReturnAll: [false],
					},
				},
				description: 'Max number of results to return',
			},
	{
				displayName: 'Offset',
				name: 'categoryOffset',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
				},
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['query'],
					},
				},
				description: 'Number of categories to skip before returning results',
			},
	{
				displayName: 'Additional Fields',
				name: 'categoryAdditionalFieldsGet',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				options: [
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
				],
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['get', 'getByKey'],
					},
				},
			},
	{
				displayName: 'Additional Fields',
				name: 'categoryAdditionalFieldsCreate',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				options: [
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
				],
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['create'],
					},
				},
			},
	{
				displayName: 'Additional Fields',
				name: 'categoryAdditionalFieldsUpdate',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				options: [
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
				],
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['update', 'updateByKey'],
					},
				},
			},
	{
				displayName: 'Additional Fields',
				name: 'categoryAdditionalFieldsDelete',
				type: 'collection',
				default: {},
				placeholder: 'Add Field',
				options: [
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
				],
				displayOptions: {
					show: {
						resource: ['category'],
						operation: ['delete', 'deleteByKey'],
					},
				},
			}
];
