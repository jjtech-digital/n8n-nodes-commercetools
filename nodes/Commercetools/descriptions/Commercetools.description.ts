import type { INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

const nodeGroup: Pick<INodeTypeDescription, 'group'> = {
	group: ['transform'],
};

export const commercetoolsDescription: INodeTypeDescription = {
	displayName: 'Commercetools',
	name: 'Commercetools',
	icon: 'file:Commercetools.svg',
	...nodeGroup,
	version: 1,
	description: 'Interact with the Commercetools Products and Categories API',
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
				{
					name: 'Category',
					value: 'category',
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
					name: 'Create',
					value: 'create',
					action: 'Create product',
					description: 'Create a product draft',
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
					name: 'Query',
					value: 'query',
					action: 'Query products',
					description: 'Retrieve products using the Composable Commerce Products endpoint',
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
					resource: ['product', 'category'],
					operation: ['update', 'updateByKey', 'delete', 'deleteByKey'],
				},
			},
			description: 'Current version of the resource to ensure optimistic concurrency control',
		},
		{
			displayName: 'Actions (JSON)',
			name: 'actions',
			type: 'json',
			default: '[]',
			description: 'Update actions to apply to the resource',
			displayOptions: {
				show: {
					resource: ['product', 'category'],
					operation: ['update', 'updateByKey'],
				},
			},
		},
		{
			displayName: 'Actions (UI)',
			name: 'updateActions',
			type: 'fixedCollection',
			default: {},
			placeholder: 'Add Action',
			typeOptions: {
				multipleValues: true,
			},
			description: 'Define multiple update actions to perform on the product',
			displayOptions: {
				show: {
					resource: ['product'],
					operation: ['update', 'updateByKey'],
				},
			},
			options: [
				{
					displayName: 'Action',
					name: 'action',
					values: [
						// Action Type Selector
						{
							displayName: 'Action Type',
							name: 'action',
							type: 'options',
							required: true,
							default: 'publish',
							// description: 'Select the type of action to perform',
							options: [
								{
									name: 'Add Asset',
									value: 'addAsset',
								},
								{
									name: 'Add External Image',
									value: 'addExternalImage',
								},
								{
									name: 'Add Price',
									value: 'addPrice',
								},
								{
									name: 'Add Product Variant',
									value: 'addVariant',
								},
								{
									name: 'Add To Category',
									value: 'addToCategory',
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
									name: 'Change Master Variant',
									value: 'changeMasterVariant',
								},
								{
									name: 'Change Name',
									value: 'changeName',
								},
								{
									name: 'Change Price',
									value: 'changePrice',
								},
								{
									name: 'Change Slug',
									value: 'changeSlug',
								},
								{
									name: 'Move Image To Position',
									value: 'moveImageToPosition',
								},
								{
									name: 'Publish',
									value: 'publish',
								},
								{
									name: 'Remove Asset',
									value: 'removeAsset',
								},
								{
									name: 'Remove From Category',
									value: 'removeFromCategory',
								},
								{
									name: 'Remove Image',
									value: 'removeImage',
								},
								{
									name: 'Remove Price',
									value: 'removePrice',
								},
								{
									name: 'Remove Variant',
									value: 'removeVariant',
								},
								{
									name: 'Revert Staged Changes',
									value: 'revertStagedChanges',
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
									name: 'Set Attribute',
									value: 'setAttribute',
								},
								{
									name: 'Set Attribute In All Variants',
									value: 'setAttributeInAllVariants',
								},
								{
									name: 'Set Category Order Hint',
									value: 'setCategoryOrderHint',
								},
								{
									name: 'Set Description',
									value: 'setDescription',
								},
								{
									name: 'Set Image Label',
									value: 'setImageLabel',
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
								{
									name: 'Set Price Custom Field',
									value: 'setPriceCustomField',
								},
								{
									name: 'Set Price Custom Type',
									value: 'setPriceCustomType',
								},
								{
									name: 'Set Price Key',
									value: 'setPriceKey',
								},
								{
									name: 'Set Price Mode',
									value: 'setPriceMode',
								},
								{
									name: 'Set Prices',
									value: 'setPrices',
								},
								{
									name: 'Set Product Attribute',
									value: 'setProductAttribute',
								},
								{
									name: 'Set Product Price Custom Type',
									value: 'setProductPriceCustomType',
								},
								{
									name: 'Set Product Variant Key',
									value: 'setProductVariantKey',
								},
								{
									name: 'Set Search Keywords',
									value: 'setSearchKeywords',
								},
								{
									name: 'Set SKU',
									value: 'setSku',
								},
								{
									name: 'Set Tax Category',
									value: 'setTaxCategory',
								},
								{
									name: 'Transition State',
									value: 'transitionState',
								},
								{
									name: 'Unpublish',
									value: 'unpublish',
								},
							],
						},

						// ==================== ASSET ID FIELD ====================
						{
							displayName: 'Asset ID',
							name: 'assetId',
							type: 'string',
							default: '',
							required: true,
							description: 'ID of the asset',
							displayOptions: {
								show: {
									action: [
										'changeAssetName',
										'changeAssetOrder',
										'removeAsset',
										'removeImage',
										'moveImageToPosition',
										'setAssetCustomField',
										'setAssetCustomType',
										'setAssetDescription',
										'setAssetKey',
										'setAssetSources',
										'setAssetTags',
										'setImageLabel',
									],
								},
							},
						},

						// ==================== ADD ASSET ====================
						{
							displayName: 'Asset Name',
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
							displayName: 'Asset Sources',
							name: 'asset',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Sources for the asset',
							displayOptions: {
								show: {
									action: ['addAsset', 'setAssetSources'],
								},
							},
							options: [
								{
									displayName: 'Source',
									name: 'sources',
									values: [
										{
											displayName: 'URI',
											name: 'uri',
											type: 'string',
											default: '',
											required: true,
											description: 'URI of the asset',
										},
										{
											displayName: 'Key',
											name: 'key',
											type: 'string',
											default: '',
											description: 'Optional key for the source',
										},
										{
											displayName: 'Content Type',
											name: 'contentType',
											type: 'string',
											default: '',
											description: 'MIME type (e.g., image/jpeg)',
										},
										{
											displayName: 'Dimensions',
											name: 'dimensions',
											type: 'fixedCollection',
											default: {},
											description: 'Image dimensions',
											options: [
												{
													displayName: 'Size',
													name: 'size',
													values: [
														{
															displayName: 'Width',
															name: 'w',
															type: 'number',
															default: 0,
														},
														{
															displayName: 'Height',
															name: 'h',
															type: 'number',
															default: 0,
														},
													],
												},
											],
										},
									],
								},
							],
						},

						// ==================== ATTRIBUTES ====================
						{
							displayName: 'Attribute Name',
							name: 'name',
							type: 'string',
							default: '',
							required: true,
							description: 'Name of the attribute',
							displayOptions: {
								show: {
									action: ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'],
								},
							},
						},
						{
							displayName: 'Attribute Value',
							name: 'value',
							type: 'string',
							default: '',
							description: 'Value of the attribute',
							typeOptions: {
								alwaysOpenEditWindow: true,
							},
							displayOptions: {
								show: {
									action: ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'],
								},
							},
						},
						{
							displayName: 'Attribute Value Type',
							name: 'valueType',
							type: 'options',
							options: [
								{
									name: 'String',
									value: 'string',
								},
								{
									name: 'Number',
									value: 'number',
								},
								{
									name: 'Boolean',
									value: 'boolean',
								}
							],
							default: 'string',
							description: 'The type of value you are entering',
							displayOptions: {
								show: {
									action: ['setAttribute', 'setAttributeInAllVariants', 'setProductAttribute'],
								},
							},
						},
						// ==================== CATEGORY ID ====================
						{
							displayName: 'Category ID',
							name: 'categoryId',
							type: 'string',
							default: '',
							required: true,
							description: 'ID of the category',
							displayOptions: {
								show: {
									action: ['addToCategory', 'removeFromCategory', 'setCategoryOrderHint'],
								},
							},
						},


						{
							displayName: 'Custom Fields',
							name: 'fields',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Custom field values',
							displayOptions: {
								show: {
									action: ['setAssetCustomType', 'setPriceCustomType'],
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

						// ==================== CUSTOM TYPE ====================
						{
							displayName: 'Custom Type',
							name: 'type',
							type: 'fixedCollection',
							default: {},
							description: 'Custom type reference',
							displayOptions: {
								show: {
									action: ['setAssetCustomType', 'setPriceCustomType'],
								},
							},
							options: [
								{
									displayName: 'Type Reference',
									name: 'typeReference',
									values: [
										{
											displayName: 'Type ID',
											name: 'typeId',
											type: 'options',
											default: 'type',
											options: [
												{
													name: 'Type',
													value: 'type',
												},
											],
										},
										{
											displayName: 'ID',
											name: 'id',
											type: 'string',
											default: '',
											description: 'ID of the custom type',
										},
										{
											displayName: 'Key',
											name: 'key',
											type: 'string',
											default: '',
											description: 'Key of the custom type',
										},
									],
								},
							],
						},

						// ==================== CUSTOM FIELD ====================
						{
							displayName: 'Field Name',
							name: 'fieldName',
							type: 'string',
							default: '',
							description: 'Name of the custom field',
							displayOptions: {
								show: {
									action: ['setAssetCustomField', 'setPriceCustomField'],
								},
							},
						},
						{
							displayName: 'Field Value',
							name: 'fieldValue',
							type: 'string',
							default: '',
							description: 'Value of the custom field',
							displayOptions: {
								show: {
									action: ['setAssetCustomField', 'setPriceCustomField'],
								},
							},
						},

						{
							displayName: 'Force',
							name: 'force',
							type: 'boolean',
							default: false,
							// description: 'Force transition even if not valid',
							displayOptions: {
								show: {
									action: ['transitionState'],
								},
							},
						},

						// ==================== EXTERNAL IMAGE ====================
						{
							displayName: 'Image',
							name: 'image',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Image Details',
							description: 'External image details',
							displayOptions: {
								show: {
									action: ['addExternalImage'],
								},
							},
							options: [
								{
									name: 'imageDetails',
									displayName: 'Image Details',
									values: [
										{
											displayName: 'URL',
											name: 'url',
											type: 'string',
											default: '',
											required: true,
											placeholder: '//myimage.jpg',
											description: 'URL of the external image',
										},
										{
											displayName: 'Label',
											name: 'label',
											type: 'string',
											default: '',
											placeholder: 'myImage',
											description: 'Image label (optional)',
										},
										{
											displayName: 'Dimensions',
											name: 'dimensions',
											type: 'fixedCollection',
											default: {},
											placeholder: 'Add Dimensions',
											description: 'Image dimensions (optional)',
											options: [
												{
													name: 'size',
													displayName: 'Size',
													values: [
														{
															displayName: 'Width',
															name: 'w',
															type: 'number',
															default: 0,
															placeholder: '1400',
															description: 'Image width in pixels',
														},
														{
															displayName: 'Height',
															name: 'h',
															type: 'number',
															default: 0,
															placeholder: '1400',
															description: 'Image height in pixels',
														},
													],
												},
											],
										},
									],
								},
							],
						},

						// ==================== KEY ====================
						{
							displayName: 'Key',
							name: 'key',
							type: 'string',
							default: '',
							description: 'Unique key',
							displayOptions: {
								show: {
									action: ['setKey', 'setAssetKey', 'setPriceKey', 'setProductVariantKey', 'addVariant'],
								},
							},
						},
						
						// ==================== DESCRIPTION ====================
						{
							displayName: 'Localized Descriptions',
							name: 'description',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							// description: 'Localized descriptions',
							displayOptions: {
								show: {
									action: ['setDescription', 'setAssetDescription'],
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

						// ==================== CHANGE NAME ====================
						{
							displayName: 'Localized Names',
							name: 'name',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Localized product names',
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
											description: 'Name in this locale',
										},
									],
								},
							],
						},

						// ==================== CHANGE SLUG ====================
						{
							displayName: 'Localized Slugs',
							name: 'slug',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Localized product slugs',
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
											description: 'Slug in this locale',
										},
									],
								},
							],
						},

						// ==================== META FIELDS ====================
						{
							displayName: 'Meta Description',
							name: 'metaDescription',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Localized meta descriptions',
							displayOptions: {
								show: {
									action: ['setMetaDescription'],
								},
							},
							options: [
								{
									displayName: 'Localized Value',
									name: 'localizedField',
									values: [
										{
											displayName: 'Locale',
											name: 'locale',
											type: 'string',
											default: 'en',
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
							displayName: 'Meta Keywords',
							name: 'metaKeywords',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Localized meta keywords',
							displayOptions: {
								show: {
									action: ['setMetaKeywords'],
								},
							},
							options: [
								{
									displayName: 'Localized Value',
									name: 'localizedField',
									values: [
										{
											displayName: 'Locale',
											name: 'locale',
											type: 'string',
											default: 'en',
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
							displayName: 'Meta Title',
							name: 'metaTitle',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Localized meta titles',
							displayOptions: {
								show: {
									action: ['setMetaTitle'],
								},
							},
							options: [
								{
									displayName: 'Localized Value',
									name: 'localizedField',
									values: [
										{
											displayName: 'Locale',
											name: 'locale',
											type: 'string',
											default: 'en',
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
							displayName: 'Order Hint',
							name: 'orderHint',
							type: 'string',
							default: '',
							description: 'Order hint value',
							displayOptions: {
								show: {
									action: ['setCategoryOrderHint'],
								},
							},
						},

						// ==================== POSITION ====================
						{
							displayName: 'Position',
							name: 'position',
							type: 'number',
							default: 0,
							description: 'New position (0-based index)',
							displayOptions: {
								show: {
									action: ['changeAssetOrder', 'moveImageToPosition'],
								},
							},
						},

						// ==================== CHANGE PRICE ====================
						{
							displayName: 'Price ID',
							name: 'priceId',
							type: 'string',
							default: '',
							required: true,
							description: 'The ID of the price to change',
							displayOptions: {
								show: {
									action: ['changePrice', 'removePrice', 'setPriceCustomField', 'setPriceCustomType', 'setPriceKey', 'setProductPriceCustomType'],
								},
							},
						},

						// ==================== PRICE MODE ====================
						{
							displayName: 'Price Mode',
							name: 'priceMode',
							type: 'options',
							default: 'Platform',
							// description: 'Price mode',
							displayOptions: {
								show: {
									action: ['setPriceMode'],
								},
							},
							options: [
								{
									name: 'Platform',
									value: 'Platform',
								},
								{
									name: 'Embedded',
									value: 'Embedded',
								},
							],
						},
						{
							displayName: 'Price Value',
							name: 'price',
							type: 'fixedCollection',
							default: {},
							description: 'New price value',
							displayOptions: {
								show: {
									action: ['changePrice', "addPrice"],
								},
							},
							options: [
								{
									displayName: 'Value',
									name: 'value',
									values: [
										{
											displayName: 'Currency Code',
											name: 'currencyCode',
											type: 'string',
											default: 'EUR',
											description: 'Currency code (e.g., EUR, USD)',
										},
										{
											displayName: 'Cent Amount',
											name: 'centAmount',
											type: 'number',
											default: 0,
											description: 'Price in cents (e.g., 4000 = 40.00)',
										},
										{
											displayName: 'Country',
											name: 'country',
											type: 'string',
											default: '',
											description: 'Optional country code',

										},
									],
								},
							],
						},

						// ==================== SET PRICES ====================
						{
							displayName: 'Prices',
							name: 'prices',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'List of prices',
							displayOptions: {
								show: {
									action: ['setPrices'],
								},
							},
							options: [
								{
									displayName: 'Price',
									name: 'price',
									values: [
										{
											displayName: 'Currency',
											name: 'currencyCode',
											type: 'string',
											default: 'EUR',
										},
										{
											displayName: 'Cent Amount',
											name: 'centAmount',
											type: 'number',
											default: 0,
										},
										{
											displayName: 'Country',
											name: 'country',
											type: 'string',
											default: '',
										},
									],
								},
							],
						},

						// ==================== SEARCH KEYWORDS ====================
						{
							displayName: 'Search Keywords',
							name: 'searchKeywords',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Localized search keywords',
							displayOptions: {
								show: {
									action: ['setSearchKeywords'],
								},
							},
							options: [
								{
									displayName: 'Localized Keywords',
									name: 'localizedField',
									values: [
										{
											displayName: 'Locale',
											name: 'locale',
											type: 'string',
											default: 'en',
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

						// ==================== SKU ====================
						{
							displayName: 'SKU',
							name: 'sku',
							type: 'string',
							default: '',
							description: 'Stock Keeping Unit',
							displayOptions: {
								show: {
									action: ['setSku'],
								},
							},
						},

						{
							displayName: 'Staged',
							name: 'staged',
							type: 'boolean',
							default: true,
							description: 'Whether to apply changes to staged version',
							displayOptions: {
								show: {
									action: ['changePrice', 'changeName', 'changeSlug', 'setDescription', 'setAttribute', 'setProductPriceCustomType'],
								},
							},
						},

						// ==================== STATE TRANSITION ====================
						{
							displayName: 'State',
							name: 'state',
							type: 'fixedCollection',
							default: {},
							description: 'State reference',
							displayOptions: {
								show: {
									action: ['transitionState'],
								},
							},
							options: [
								{
									displayName: 'Reference',
									name: 'reference',
									values: [
										{
											displayName: 'Type ID',
											name: 'typeId',
											type: 'options',
											default: 'state',
											options: [
												{
													name: 'State',
													value: 'state',
												},
											],
										},
										{
											displayName: 'ID',
											name: 'id',
											type: 'string',
											default: '',
											description: 'ID of the target state',
										},
									],
								},
							],
						},

						// ==================== TAGS ====================
						{
							displayName: 'Tags',
							name: 'tags',
							type: 'string',
							default: '',
							description: 'Comma-separated tags',
							displayOptions: {
								show: {
									action: ['setAssetTags'],
								},
							},
						},

						// ==================== TAX CATEGORY ====================
						{
							displayName: 'Tax Category',
							name: 'taxCategory',
							type: 'fixedCollection',
							default: {},
							description: 'Tax category reference',
							displayOptions: {
								show: {
									action: ['setTaxCategory'],
								},
							},
							options: [
								{
									displayName: 'Reference',
									name: 'reference',
									values: [
										{
											displayName: 'Type ID',
											name: 'typeId',
											type: 'options',
											default: 'tax-category',
											options: [
												{
													name: 'Tax Category',
													value: 'tax-category',
												},
											],
										},
										{
											displayName: 'ID',
											name: 'id',
											type: 'string',
											default: '',
											description: 'ID of the tax category',
										},
									],
								},
							],
						},
						{
							displayName: 'Variant Attributes',
							name: 'attributes',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
							description: 'Attributes for the variant',
							displayOptions: {
								show: {
									action: [],
								},
							},
							options: [
								{
									displayName: 'Attribute',
									name: 'attribute',
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

						// ==================== ADD PRICE ====================
						{
							displayName: 'Update Variant By',
							name: 'identifyBy',
							type: 'options',
							options: [
								{
									name: 'Variant ID',
									value: 'variantId',
								},
								{
									name: 'SKU',
									value: 'sku',
								},
							],
							default: 'variantId',
							description: 'Choose how to identify the variant',
							displayOptions: {
								show: {
									action: ['addPrice', 'changeMasterVariant', 'removeVariant', 'setSku', 'setAttribute', 'addAsset', 'setPrices', 'setProductVariantKey', 'addExternalImage'],
								},
								
							},
						},
						{
							displayName: 'Variant ID',
							name: 'variantId',
							type: 'number',
							default: 1,
							description: 'ID of the variant',
							displayOptions: {
								show: {
									action: ['addPrice', 'changeMasterVariant', 'removeVariant', 'setSku', 'setAttribute', 'addAsset', 'setPrices', 'setProductVariantKey', 'addExternalImage'],
									identifyBy: ['variantId'],
								},
							},
						},
						{
							displayName: 'SKU',
							name: 'sku',
							type: 'string',
							default: '',
							description: 'SKU of the variant',
							displayOptions: {
								show: {
									action: ['addPrice', 'changeMasterVariant', 'removeVariant', 'setSku', 'setAttribute', 'addAsset', 'setPrices', 'setProductVariantKey', 'addExternalImage'],
									identifyBy: ['sku'],
								},
							},
						},

						// ==================== ADD VARIANT ====================
						{
							displayName: 'Variant SKU',
							name: 'sku',
							type: 'string',
							default: '',
							description: 'SKU for the new variant',
							displayOptions: {
								show: {
									action: ['addVariant'],
								},
							},
						},

						// ==================== Set Product Price Custom Type ====================
						{
							displayName: 'Type',
							name: 'type',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Type Details',
							description: 'Custom type identifier',
							displayOptions: {
								show: {
									action: ['setProductPriceCustomType'],
								},
							},
							options: [
								{
									name: 'typeDetails',
									displayName: 'Type Details',
									values: [
										{
											displayName: 'Identify Type By',
											name: 'identifyBy',
											type: 'options',
											options: [
												{
													name: 'ID',
													value: 'id',
												},
												{
													name: 'Key',
													value: 'key',
												},
											],
											default: 'id',
											description: 'Choose how to identify the type',
										},
										{
											displayName: 'ID',
											name: 'id',
											type: 'string',
											default: '',
											placeholder: '{{type-id}}',
											description: 'ID of the custom type',
											displayOptions: {
												show: {
													identifyBy: ['id'],
												},
											},
										},
										{
											displayName: 'Key',
											name: 'key',
											type: 'string',
											default: '',
											placeholder: 'my-custom-type',
											description: 'Key of the custom type',
											displayOptions: {
												show: {
													identifyBy: ['key'],
												},
											},
										},
									],
								},
							],
						},
						{
							displayName: 'Custom Fields',
							name: 'fields',
							type: 'fixedCollection',
							typeOptions: {
								multipleValues: true,
							},
							default: {},
							placeholder: 'Add Field',
							description: 'Custom fields for the type',
							displayOptions: {
								show: {
									action: ['setProductPriceCustomType'],
								},
							},
							options: [
								{
									name: 'fieldValues',
									displayName: 'Field',
									values: [
										{
											displayName: 'Field Name',
											name: 'name',
											type: 'string',
											default: '',
											placeholder: 'exampleStringField',
											description: 'Name of the custom field',
										},
										{
											displayName: 'Field Value Type',
											name: 'valueType',
											type: 'options',
											options: [
												{
													name: 'String',
													value: 'string',
												},
												{
													name: 'Number',
													value: 'number',
												},
												{
													name: 'Boolean',
													value: 'boolean',
												},
											],
											default: 'string',
											description: 'Type of the field value',
										},
										{
											displayName: 'Field Value',
											name: 'value',
											type: 'string',
											default: '',
											placeholder: 'TextString',
											description: 'Value of the custom field',
											typeOptions: {
												alwaysOpenEditWindow: true,
											},
										},
									],
								},
							],
						},
					],
				},
			],
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
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
					description:
						'Sorting expression for query results, e.g. <code>createdAt desc</code>',
				},
				{
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to retrieve the staged projection',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
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
					description:
						'Whether the query should calculate the total number of matching products',
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
					description: 'Whether to retrieve the staged projection',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
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
					displayName: 'Staged',
					name: 'staged',
					type: 'boolean',
					default: false,
					description: 'Whether to retrieve the staged projection',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
				},
				{
					displayName: 'With Total',
					name: 'withTotal',
					type: 'boolean',
					default: true,
					description: 'Whether the search should calculate the total number of matching products',
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
					default: true,
					description: 'Whether to create the product in the staged state',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
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
					description: 'Whether to simulate the update without persisting changes',
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
					description: 'Whether the update should affect the staged product data',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
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
					description: 'Whether to inspect the staged projection',
				},
				{
					displayName: 'Store Projection',
					name: 'storeProjection',
					type: 'string',
					default: '',
					description: 'Store in which the results are projected',
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
					displayName: 'External URL',
					name: 'externalUrl',
					type: 'string',
					default: '',
					description: 'If set, treats the image as an external URL instead of uploading binary content',
				},
				{
					displayName: 'Filename',
					name: 'filename',
					type: 'string',
					default: '',
					description: 'Filename to store with the uploaded image',
				},
				{
					displayName: 'Label',
					name: 'label',
					type: 'string',
					default: '',
					description: 'Localized label for the image, e.g. <code>{"en":"Front"}</code>',
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
					displayName: 'Variant ID',
					name: 'variantId',
					type: 'number',
					typeOptions: {
						minValue: 0,
					},
					default: 0,
					description: 'Variant ID the image belongs to',
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
		},
	],
};
