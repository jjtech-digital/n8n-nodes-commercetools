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
];
export const categoryDraftFields: INodeProperties[] = [

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
		displayName: 'Actions (UI)',
		name: 'updateActions',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Action',
		typeOptions: {
			multipleValues: true,
		},
		description: 'Define multiple update actions to perform on the category',
		displayOptions: {
			show: {
				resource: ['category'],
				operation: ['update', 'updateByKey'],
			},
		},
		options: [
			{
				displayName: 'Action',
				name: 'action',
				values: [
					{
						displayName: 'Action Type',
						name: 'action',
						type: 'options',
						required: true,
						default: 'changeName',
						options: [
							{
								name: 'Add Asset',
								value: 'addAsset',
							},
							{
								name: 'Change Asset Name',
								value: 'changeAssetName',
							},
							{
								name: 'Change Asset Order',
								value: 'changeAssetOrder',
							},
							{
								name: 'Change Name',
								value: 'changeName',
							},
							{
								name: 'Change OrderHint',
								value: 'changeOrderHint',
							},
							{
								name: 'Change Parent',
								value: 'changeParent',
							},
							{
								name: 'Change Slug',
								value: 'changeSlug',
							},
							{
								name: 'Remove Asset',
								value: 'removeAsset',
							},
							{
								name: 'Set Asset Custom Field',
								value: 'setAssetCustomField',
							},
							{
								name: 'Set Asset Custom Type',
								value: 'setAssetCustomType',
							},
							{
								name: 'Set Asset Description',
								value: 'setAssetDescription',
							},
							{
								name: 'Set Asset Key',
								value: 'setAssetKey',
							},
							{
								name: 'Set Asset Sources',
								value: 'setAssetSources',
							},
							{
								name: 'Set Asset Tags',
								value: 'setAssetTags',
							},
							{
								name: 'Set Custom Field',
								value: 'setCustomField',
							},
							{
								name: 'Set Custom Type',
								value: 'setCustomType',
							},
							{
								name: 'Set Description',
								value: 'setDescription',
							},
							{
								name: 'Set External ID',
								value: 'setExternalId',
							},
							{
								name: 'Set Key',
								value: 'setKey',
							},
							{
								name: 'Set Meta Description',
								value: 'setMetaDescription',
							},
							{
								name: 'Set Meta Keywords',
								value: 'setMetaKeywords',
							},
							{
								name: 'Set Meta Title',
								value: 'setMetaTitle',
							},
						]
					},
					{
						displayName: 'Asset Description',
						name: 'description',
						type: 'string',
						default: '{"en": "Asset description"}',
						displayOptions: {
							show: {
								action: ['setAssetDescription'],
							},
						},
						description: 'Value to set. If empty, any existing value will be removed.',
					},
					{
						displayName: 'Asset ID',
						name: 'assetId',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								action: ['changeAssetName', 'setAssetCustomField', 'setAssetCustomType', 'setAssetDescription', 'setAssetKey', 'setAssetSources', 'setAssetTags', 'removeAsset'],
								assetIdentifierType: ['assetId'],
							},
						},
						description: 'The ID of the asset to update',
					},
					{
						displayName: 'Asset Identifier Type',
						name: 'assetIdentifierType',
						type: 'options',
						default: 'assetId',
						displayOptions: {
							show: {
								action: ['changeAssetName', 'setAssetCustomField', 'setAssetCustomType', 'setAssetDescription', 'setAssetKey', 'setAssetSources', 'setAssetTags', 'removeAsset'],
							},
						},
						options: [
							{
								name: 'Asset ID',
								value: 'assetId',
							},
							{
								name: 'Asset Key',
								value: 'assetKey',
							},
						],
						description: 'Choose whether to identify the asset by ID or Key',
					},
					{
						displayName: 'Asset Key',
						name: 'assetKey',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								action: ['changeAssetName', 'setAssetCustomField', 'setAssetCustomType', 'setAssetDescription', 'setAssetKey', 'setAssetSources', 'setAssetTags', 'removeAsset'],
								assetIdentifierType: ['assetKey'],
							},
						},
						description: 'The Key of the asset to update',
					},
					{
						displayName: 'Asset Name (Add)',
						name: 'name',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized asset names',
						displayOptions: {
							show: {
								action: ['addAsset'],
							},
						},
						options: [
							{
								displayName: 'Localized Name',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Name in this locale',
									},
								],
							},
						],
					},
					{
						displayName: 'Asset Name (Change)',
						name: 'name',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized asset names',
						displayOptions: {
							show: {
								action: ['changeAssetName'],
							},
						},
						options: [
							{
								displayName: 'Localized Name',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Name in this locale',
									},
								],
							},
						],
					},
					{
						displayName: 'Asset Order',
						name: 'assetOrder',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Asset ID',
						typeOptions: {
							multipleValues: true,
						},
						description: 'New order for assets. Must contain all asset IDs in the desired order.',
						displayOptions: {
							show: {
								action: ['changeAssetOrder'],
							},
						},
						options: [
							{
								displayName: 'Asset ID',
								name: 'assetId',
								values: [
									{
										displayName: 'ID',
										name: 'id',
										type: 'string',
										default: '',
										required: true,
										placeholder: '{{assetId}}',
										description: 'ID of the asset',
									},
								],
							},
						],
					},
					{
						displayName: 'Asset Sources',
						name: 'sources',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Source',
						typeOptions: {
							multipleValues: true,
						},
						description: 'Sources for the asset',
						displayOptions: {
							show: {
								action: ['addAsset'],
							},
						},
						options: [
							{
								displayName: 'Source',
								name: 'source',
								values: [
									{
										displayName: 'URI',
										name: 'uri',
										type: 'string',
										default: '',
										required: true,
										description: 'URI of the asset source',
									},
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										default: '',
										description: 'Optional key for the source',
									},
								],
							},
						],
					},
					{
						displayName: 'Asset Sources',
						name: 'sources',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Source',
						typeOptions: {
							multipleValues: true,
						},
						description: 'List of asset sources with URI and key',
						displayOptions: {
							show: {
								action: ['setAssetSources'],
							},
						},
						options: [
							{
								displayName: 'Source',
								name: 'source',
								values: [
									{
										displayName: 'URI',
										name: 'uri',
										type: 'string',
										default: '',
										required: true,
										placeholder: 'https://www.example.com/image.jpg',
									},
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										default: '',
										description: 'Optional key for the source',
									},
								],
							},
						],
					},
					{
						displayName: 'Asset Tags',
						name: 'tags',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Tag',
						typeOptions: {
							multipleValues: true,
						},
						description: 'Keywords for categorizing and organizing Assets',
						displayOptions: {
							show: {
								action: ['setAssetTags'],
							},
						},
						options: [
							{
								displayName: 'Tag',
								name: 'tag',
								values: [
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										required: true,
										description: 'Tag value',
									},
								],
							},
						],
					},
					{
						displayName: 'Custom Fields',
						name: 'fields',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Field',
						typeOptions: {
							multipleValues: true,
						},
						description: 'Sets the Custom Fields fields for the Asset',
						displayOptions: {
							show: {
								action: ['setAssetCustomType'],
							},
						},
						options: [
							{
								displayName: 'Field',
								name: 'field',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
										required: true,
										description: 'Name of the custom field',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Value to set for the custom field',
									},
								],
							},
						],
					},
					{
						displayName: 'Custom Type',
						name: 'type',
						type: 'fixedCollection',
						default: {},
						description: 'Defines the Type that extends the Asset with Custom Fields',
						displayOptions: {
							show: {
								action: ['setAssetCustomType'],
							},
						},
						options: [
							{
								displayName: 'Type Details',
								name: 'typeDetails',
								values: [
									{
										displayName: 'Type ID',
										name: 'typeId',
										type: 'hidden',
										default: 'type',
										description: 'Type identifier (always "type")',
									},
									{
										displayName: 'ID',
										name: 'id',
										type: 'string',
										default: '',
										required: true,
										placeholder: '',
										description: 'ID of the Type',
									},
								],
							},
						],
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized category descriptions',
						displayOptions: {
							show: {
								action: ['setDescription'],
							},
						},
						options: [
							{
								displayName: 'Localized Description',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Description in this locale',
									},
								],
							},
						],
					},
					{
						displayName: 'External ID',
						name: 'externalId',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: ['setExternalId'],
							},
						},
						description: 'Value to set. If empty, any existing value will be removed.',
					},
					{
						displayName: 'Fields',
						name: 'fields',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Field',
						typeOptions: {
							multipleValues: true,
						},
						description: 'Sets the Custom Fields fields for the Category',
						displayOptions: {
							show: {
								action: ['setCustomType'],
							},
						},
						options: [
							{
								displayName: 'Field',
								name: 'field',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
										required: true,
										description: 'Name of the custom field',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Value to set for the custom field',
									},
								],
							},
						],
					},
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: ['setKey', 'setAssetKey'],
							},
						},
						description: 'Value to set. If empty, any existing value will be removed.',
					},
					{
						displayName: 'Meta Description',
						name: 'metaDescription',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized category meta descriptions',
						displayOptions: {
							show: {
								action: ['setMetaDescription'],
							},
						},
						options: [
							{
								displayName: 'Localized Meta Description',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Meta description in this locale',
									},
								],
							},
						],
					},
					{
						displayName: 'Meta Keywords',
						name: 'metaKeywords',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized category meta keywords',
						displayOptions: {
							show: {
								action: ['setMetaKeywords'],
							},
						},
						options: [
							{
								displayName: 'Localized Meta Keywords',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Meta keywords in this locale (comma-separated)',
									},
								],
							},
						],
					},
					{
						displayName: 'Meta Title',
						name: 'metaTitle',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized category meta titles',
						displayOptions: {
							show: {
								action: ['setMetaTitle'],
							},
						},
						options: [
							{
								displayName: 'Localized Meta Title',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Meta title in this locale',
									},
								],
							},
						],
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized category names',
						displayOptions: {
							show: {
								action: ['changeName'],
							},
						},
						options: [
							{
								displayName: 'Localized Name',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										required: true,
										description: 'Category name in this locale',
									},
								],
							},
						],
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								action: ['setAssetCustomField'],
							},
						},
						description: 'Name of the Custom Field',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								action: ['setCustomField'],
							},
						},
						description: 'Name of the Custom Field',
					},
					{
						displayName: 'Order Hint',
						name: 'orderHint',
						type: 'string',
						default: '0.1',
						required: true,
						displayOptions: {
							show: {
								action: ['changeOrderHint'],
							},
						},
						description: 'New value to set. Must be a decimal value between 0 and 1.',
					},
					{
						displayName: 'Parent Category',
						name: 'parent',
						type: 'fixedCollection',
						default: {},
						description: 'Parent category reference',
						displayOptions: {
							show: {
								action: ['changeParent'],
							},
						},
						options: [
							{
								name: 'categoryDetails',
								displayName: 'Category Details',
								values: [
									{
										displayName: 'Type ID',
										name: 'typeId',
										type: 'hidden',
										default: 'category',
										description: 'Type identifier (always "category")',
									},
									{
										displayName: 'Category ID',
										name: 'id',
										type: 'string',
										default: '',
										required: true,
										placeholder: '',
										description: 'ID of the parent category',
									},
								],
							},                       
						],
					},
					{
						displayName: 'Position',
						name: 'position',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								action: ['addAsset'],
							},
						},
						description: 'Position in the array at which the Asset should be put. When specified, the value must be between 0 and the total number of Assets minus 1.',
					},
					{
						displayName: 'Slug',
						name: 'slug',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						description: 'Localized category slugs (must be unique across project)',
						displayOptions: {
							show: {
								action: ['changeSlug'],
							},
						},
						options: [
							{
								displayName: 'Localized Slug',
								name: 'localizedField',
								values: [
									{
										displayName: 'Locale',
										name: 'locale',
										type: 'string',
										default: 'en',
										description: 'Locale code (e.g., en, de, fr)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										required: true,
										placeholder: 'my-category',
										description: 'URL-friendly slug (letters, numbers, hyphens, underscores)',
									},
								],
							},
						],
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'fixedCollection',
						default: {},
						description: 'Defines the Type that extends the Category with Custom Fields',
						displayOptions: {
							show: {
								action: ['setCustomType'],
							},
						},
						options: [
							{
								displayName: 'Type Details',
								name: 'typeDetails',
								values: [
									{
										displayName: 'Type ID',
										name: 'typeId',
										type: 'hidden',
										default: 'type',
										description: 'Type identifier (always "type")',
									},
									{
										displayName: 'ID',
										name: 'id',
										type: 'string',
										default: '',
										required: true,
										placeholder: '',
										description: 'ID of the Type',
									},
								],
							},
						],
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: ['setAssetCustomField'],
							},
						},
						description: 'If value is absent or null, this field will be removed if it exists. Removing a field that does not exist returns an InvalidOperation error. If value is provided, it is set for the field defined by name.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: ['setCustomField'],
							},
						},
						description: 'If value is absent or null, this field will be removed if it exists. Removing a field that does not exist returns an InvalidOperation error. If value is provided, it is set for the field defined by name.',
					},
			],
			},
		],
	},
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