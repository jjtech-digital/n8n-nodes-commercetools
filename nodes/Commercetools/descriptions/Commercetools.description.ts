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
		description: 'Interact with the Commercetools Products, Categories, and Customers API',
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
				{
					name: 'Customer',
					value: 'customer',
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
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			options: [
				{
					name: 'Authenticate (Sign In)',
					value: 'authenticate',
					action: 'Authenticate customer',
					description: 'Sign in a customer with email and password',
				},
				{
					name: 'Authenticate in Store',
					value: 'authenticateInStore',
					action: 'Authenticate customer in store',
					description: 'Sign in a customer with email and password in a specific store',
				},
				{
					name: 'Change Password',
					value: 'changePassword',
					action: 'Change customer password',
					description: 'Change password of a customer',
				},
				{
					name: 'Change Password in Store',
					value: 'changePasswordInStore',
					action: 'Change customer password in store',
					description: 'Change password of a customer in a specific store',
				},
				{
					name: 'Check Existence',
					value: 'head',
					action: 'Check if customer exists',
					description: 'Check whether a customer exists by ID',
				},
				{
					name: 'Check Existence By Key',
					value: 'headByKey',
					action: 'Check if customer exists by key',
					description: 'Check whether a customer exists using its key',
				},
				{
					name: 'Check Existence By Query',
					value: 'headByQuery',
					action: 'Check if any customer matches the query',
					description: 'Send a HEAD request with query predicates to check for matches',
				},
				{
					name: 'Check Existence in Store',
					value: 'headInStore',
					action: 'Check if customer exists in store',
					description: 'Check whether a customer exists by ID in a specific store',
				},
				{
					name: 'Check Existence in Store By Key',
					value: 'headInStoreByKey',
					action: 'Check if customer exists in store by key',
					description: 'Check whether a customer exists by key in a specific store',
				},
				{
					name: 'Check Existence in Store By Query',
					value: 'headInStoreByQuery',
					action: 'Check if any customer matches the query in store',
					description: 'Send a HEAD request with query predicates in a specific store',
				},
				{
					name: 'Create (Sign Up)',
					value: 'create',
					action: 'Create customer',
					description: 'Create a new customer (sign up)',
				},
				{
					name: 'Create Email Token',
					value: 'createEmailToken',
					action: 'Create email verification token',
					description: 'Create an email verification token for a customer',
				},
				{
					name: 'Create Email Token in Store',
					value: 'createEmailTokenInStore',
					action: 'Create email verification token in store',
					description: 'Create an email verification token for a customer in a specific store',
				},
				{
					name: 'Create in Store (Sign Up)',
					value: 'createInStore',
					action: 'Create customer in store',
					description: 'Create a new customer in a specific store',
				},
				{
					name: 'Create Password Reset Token',
					value: 'createPasswordResetToken',
					action: 'Create password reset token',
					description: 'Create a password reset token for a customer',
				},
				{
					name: 'Create Password Reset Token in Store',
					value: 'createPasswordResetTokenInStore',
					action: 'Create password reset token in store',
					description: 'Create a password reset token for a customer in a specific store',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete customer',
					description: 'Delete a customer by ID',
				},
				{
					name: 'Delete By Key',
					value: 'deleteByKey',
					action: 'Delete customer by key',
					description: 'Delete a customer using its key',
				},
				{
					name: 'Delete in Store',
					value: 'deleteInStore',
					action: 'Delete customer in store',
					description: 'Delete a customer by ID in a specific store',
				},
				{
					name: 'Delete in Store By Key',
					value: 'deleteInStoreByKey',
					action: 'Delete customer in store by key',
					description: 'Delete a customer by key in a specific store',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get customer',
					description: 'Retrieve a customer by ID',
				},
				{
					name: 'Get By Email Token',
					value: 'getByEmailToken',
					action: 'Get customer by email token',
					description: 'Retrieve a customer using an email verification token',
				},
				{
					name: 'Get By Key',
					value: 'getByKey',
					action: 'Get customer by key',
					description: 'Retrieve a customer using its key',
				},
				{
					name: 'Get By Password Token',
					value: 'getByPasswordToken',
					action: 'Get customer by password token',
					description: 'Retrieve a customer using a password reset token',
				},
				{
					name: 'Get in Store',
					value: 'getInStore',
					action: 'Get customer in store',
					description: 'Retrieve a customer by ID in a specific store',
				},
				{
					name: 'Get in Store By Email Token',
					value: 'getInStoreByEmailToken',
					action: 'Get customer in store by email token',
					description: 'Retrieve a customer by email token in a specific store',
				},
				{
					name: 'Get in Store By Key',
					value: 'getInStoreByKey',
					action: 'Get customer in store by key',
					description: 'Retrieve a customer by key in a specific store',
				},
				{
					name: 'Get in Store By Password Token',
					value: 'getInStoreByPasswordToken',
					action: 'Get customer in store by password token',
					description: 'Retrieve a customer by password token in a specific store',
				},
				{
					name: 'Query',
					value: 'query',
					action: 'Query customers',
					description: 'List customers using query parameters',
				},
				{
					name: 'Query in Store',
					value: 'queryInStore',
					action: 'Query customers in store',
					description: 'List customers in a specific store using query parameters',
				},
				{
					name: 'Reset Password',
					value: 'resetPassword',
					action: 'Reset customer password',
					description: 'Reset password of a customer using a reset token',
				},
				{
					name: 'Reset Password in Store',
					value: 'resetPasswordInStore',
					action: 'Reset customer password in store',
					description: 'Reset password of a customer in a specific store using a reset token',
				},
				{
					name: 'Update',
					value: 'update',
					action: 'Update customer',
					description: 'Perform update actions on a customer by ID',
				},
				{
					name: 'Update By Key',
					value: 'updateByKey',
					action: 'Update customer by key',
					description: 'Perform update actions on a customer by key',
				},
				{
					name: 'Update in Store',
					value: 'updateInStore',
					action: 'Update customer in store',
					description: 'Perform update actions on a customer by ID in a specific store',
				},
				{
					name: 'Update in Store By Key',
					value: 'updateInStoreByKey',
					action: 'Update customer in store by key',
					description: 'Perform update actions on a customer by key in a specific store',
				},
				{
					name: 'Verify Email',
					value: 'verifyEmail',
					action: 'Verify customer email',
					description: 'Verify email address of a customer using a verification token',
				},
				{
					name: 'Verify Email in Store',
					value: 'verifyEmailInStore',
					action: 'Verify customer email in store',
					description: 'Verify email address of a customer in a specific store',
				},
			],
			default: 'query',
			displayOptions: {
				show: {
					resource: ['customer'],
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
									name: 'Revert Staged Variant Changes',
									value: 'revertStagedVariantChanges',
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
									value: 'setProductPriceCustomField',
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
										'removeAsset',
										'setAssetCustomField',
										'setAssetCustomType',
										'setAssetDescription',
										'setAssetKey',
										'setAssetSources',
										'setAssetTags',
									],
								},
							},
						},

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
									action: ['changeAssetName', 'addAsset'],
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
							type: 'string',
							default: [],
							typeOptions: {
								multipleValues: true,
							},
							description: 'List of asset IDs in order',
							displayOptions: {
								show: {
									action: ['changeAssetOrder'],
								},
							},
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
									action: ['addAsset'],
								},
							},
							options: [
								{
									displayName: 'Sources',
									name: 'sources',
									values: [
										{
											displayName: 'URI',
											name: 'uri',
											type: 'string',
											default: '',
											required: true,
											description: 'URI of the asset source',
										},
									],
								},
							],
						},

						{
							displayName: "Asset Sources",
							name: "sources",
							type: "fixedCollection",
							placeholder: "Add source",
							default: [],
							typeOptions: {
								multipleValues: true,
							},
							description: "List of asset sources with URI and key",
							displayOptions: {
								show: {
									action: ["setAssetSources"],
								},
							},
							options: [
								{
									displayName: "Source",
									name: "source",
									values: [
										{
											displayName: "URI",
											name: "uri",
											type: "string",
											default: "",
											placeholder: "https://www.commercetools.de/ct-logo.svg",
										},

									],
								},
							],
						},

						{
							displayName: 'Assets',
							name: 'assets',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Asset',
							typeOptions: {
								multipleValues: true,
							},
							description: 'Assets attached to the variant',
							displayOptions: {
								show: {
									action: ['addVariant'],
								},
							},
							options: [
								{
									displayName: 'Asset',
									name: 'asset',
									values: [
										{
											displayName: 'Key',
											name: 'key',
											type: 'string',
											default: '',
											description: 'Optional unique key for the asset',
										},
										{
											displayName: 'Name',
											name: 'name',
											type: 'fixedCollection',
											default: {},
											typeOptions: {
												multipleValues: true,
											},
											description: 'Localized asset name',
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
											displayName: 'Sources',
											name: 'sources',
											type: 'fixedCollection',
											default: {},
											typeOptions: {
												multipleValues: true,
											},
											description: 'Sources that describe the asset content',
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
														},
														{
															displayName: 'Key',
															name: 'key',
															type: 'string',
															default: '',
														},
														{
															displayName: 'Content Type',
															name: 'contentType',
															type: 'string',
															default: '',
														},
														{
															displayName: 'Dimensions',
															name: 'dimensions',
															type: 'fixedCollection',
															default: {},
															placeholder: 'Add Dimensions',
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
									],
								},
							],
						},

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

						{
							displayName: 'Attributes',
							name: 'attributes',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Attribute',
							typeOptions: {
								multipleValues: true,
							},
							description: 'Attributes to set on the variant',
							displayOptions: {
								show: {
									action: ['addVariant'],
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
											required: true,
										},
										{
											displayName: 'Value',
											name: 'value',
											type: 'string',
											default: '',
											description: 'Value assigned to this attribute',
											typeOptions: {
												alwaysOpenEditWindow: true,
											},
										},
										{
											displayName: 'Value Type',
											name: 'valueType',
											type: 'options',
											default: 'string',
											description: 'Choose how the value should be interpreted',
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
										},
									],
								},
							],
						},

						{
							displayName: 'Category',
							name: 'category',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Category',
							description: 'Category reference',
							displayOptions: {
								show: {
									action: ['addToCategory', 'removeFromCategory'],
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
											placeholder: '{{category-ID}}',
											description: 'ID of the category',
										},
									],
								},
							],
						},

						{
							displayName: 'Category',
							name: 'taxCategory',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Category',
							description: 'Category reference',
							displayOptions: {
								show: {
									action: ['setTaxCategory'],
								},
							},
							options: [
								{
									name: 'taxCategoryDetails',
									displayName: 'Tax Category Details',
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
											placeholder: '{{category-ID}}',
											description: 'ID of the category',
										},
									],
								},
							],
						},

						{
							displayName: 'Category ID',
							name: 'categoryId',
							type: 'string',
							default: '',
							required: true,
							description: 'ID of the category',
							displayOptions: {
								show: {
									action: ['setCategoryOrderHint'],
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
									action: ['setAssetCustomType', 'setProductPriceCustomType'],
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

						{
							displayName: 'Custom Type',
							name: 'type',
							type: 'fixedCollection',
							default: {},
							description: 'Custom type reference',
							displayOptions: {
								show: {
									action: ['setAssetCustomType', 'setProductPriceCustomType'],
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
									],
								},
							],
						},

						{
							displayName: 'Discounted Price',
							name: 'discounted',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Discounted Price',
							description: 'Discounted price details',
							displayOptions: {
								show: {
									action: ['setDiscountedPrice'],
								},
							},
							options: [
								{
									name: 'value',
									displayName: 'Price Value',
									values: [
										{
											displayName: 'Currency Code',
											name: 'currencyCode',
											type: 'string',
											default: 'USD',
											required: true,
											placeholder: 'EUR',
											description: 'Currency code (e.g., USD, EUR, GBP)',
										},
										{
											displayName: 'Amount in Cents',
											name: 'centAmount',
											type: 'number',
											default: 0,
											required: true,
											placeholder: '4000',
											description: 'Discounted price amount in cents (e.g., 4000 = €40.00)',
										},
									],
								},
								{
									name: 'discount',
									displayName: 'Discount Reference',
									values: [
										{
											displayName: 'Type ID',
											name: 'typeId',
											type: 'hidden',
											default: 'product-discount',
											description: 'Type identifier (always "product-discount")',
										},
										{
											displayName: 'Product Discount ID',
											name: 'id',
											type: 'string',
											default: '',
											required: true,
											placeholder: '{{product-discount-ID}}',
											description: 'ID of the product discount',
										},
									],
								},
							],
						},

						{
							displayName: 'Field Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Name of the custom field',
							displayOptions: {
								show: {
									action: ['setAssetCustomField', 'setProductPriceCustomField'],
								},
							},
						},

						{
							displayName: 'Field Value',
							name: 'value',
							type: 'string',
							default: '',
							description: 'Value of the custom field',
							displayOptions: {
								show: {
									action: ['setAssetCustomField', 'setProductPriceCustomField'],
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

						{
							displayName: 'Image URL',
							name: 'imageUrl',
							type: 'string',
							default: '',
							placeholder: '//image.png',
							required: true,
							displayOptions: {
								show: {
									action: ['setImageLabel', 'moveImageToPosition', 'removeImage',],
								},
							},
						},

						{
							displayName: 'Images',
							name: 'images',
							type: 'fixedCollection',
							default: {},
							placeholder: 'Add Image',
							typeOptions: {
								multipleValues: true,
							},
							description: 'Images associated with the new variant',
							displayOptions: {
								show: {
									action: ['addVariant'],
								},
							},
							options: [
								{
									displayName: 'Image',
									name: 'image',
									values: [
										{
											displayName: 'URL',
											name: 'url',
											type: 'string',
											default: '',
											required: true,
											placeholder: 'https://example.com/image.jpg',
										},
										{
											displayName: 'Label',
											name: 'label',
											type: 'string',
											default: '',
											description: 'Optional label for the image',
										},
										{
											displayName: 'Dimensions',
											name: 'dimensions',
											type: 'fixedCollection',
											default: {},
											placeholder: 'Add Dimensions',
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

						{
							displayName: 'Label',
							name: 'label',
							type: 'string',
							default: '',
							placeholder: 'labelString',
							required: true,
							displayOptions: {
								show: {
									action: ['setImageLabel'],
								},
							},
						},

						{
							displayName: 'Localized Descriptions',
							name: 'description',
							type: 'fixedCollection',
							default: {},
							typeOptions: {
								multipleValues: true,
							},
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
									action: ['setCategoryOrderHint', 'addToCategory'],
								},
							},
						},

						{
							displayName: 'Position',
							name: 'position',
							type: 'number',
							default: 0,
							description: 'New position (0-based index)',
							displayOptions: {
								show: {
									action: ['moveImageToPosition'],
								},
							},
						},

						{
							displayName: 'Price ID',
							name: 'priceId',
							type: 'string',
							default: '',
							required: true,
							description: 'The ID of the price to change',
							displayOptions: {
								show: {
									action: ['changePrice', 'removePrice', 'setProductPriceCustomField', 'setPriceKey', 'setProductPriceCustomType', 'setDiscountedPrice'],
								},
							},
						},

						{
							displayName: 'Price Mode',
							name: 'priceMode',
							type: 'options',
							default: 'Platform',
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
									action: ['setPrices', 'addVariant'],
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

						{
							displayName: "Scope",
							name: "scope",
							type: "options",
							default: "All",
							description: "Scope for publish action: 'All' or specific sections like 'Prices'",
							options: [
								{
									name: "All",
									value: "All"
								},
								{
									name: "Assets",
									value: "Assets"
								},
								{
									name: "Attributes",
									value: "Attributes"
								},
								{
									name: "Categories",
									value: "Categories"
								},
								{
									name: "Inventory",
									value: "Inventory"
								},
								{
									name: "Messages",
									value: "Messages"
								},
								{
									name: "Prices",
									value: "Prices"
								},
								{
									name: "TaxCategory",
									value: "TaxCategory"
								}
							],
							displayOptions: {
								show: {
									action: [
										"publish"
									]
								}
							},
							typeOptions: {
								validateInput: "={{ $json.scope === 'All' || ['Prices','Assets','Attributes','Categories','Inventory','Messages','TaxCategory'].includes($json.scope) }}"
							}
						},

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
											displayName: 'Keywords',
											name: 'value',
											type: 'fixedCollection',
											typeOptions: {
												multipleValues: true,
											},
											default: {},
											options: [
												{
													displayName: 'Keyword',
													name: 'keyword',
													values: [
														{
															displayName: 'Text',
															name: 'text',
															type: 'string',
															default: '',
														},
														{
															displayName: 'Suggest Tokenizer',
															name: 'suggestTokenizer',
															type: 'fixedCollection',
															typeOptions: {
																multipleValues: false,
															},
															default: {},
															options: [
																{
																	displayName: 'Tokenizer',
																	name: 'tokenizer',
																	values: [
																		{
																			displayName: 'Type',
																			name: 'type',
																			type: 'options',
																			options: [
																				{ name: 'Whitespace', value: 'whitespace' },
																				{ name: 'Custom', value: 'custom' },
																			],
																			default: 'whitespace',
																		},
																		{
																			displayName: 'Inputs',
																			name: 'inputs',
																			type: 'string',
																			typeOptions: {
																				multipleValues: true,
																			},
																			default: [],
																			displayOptions: {
																				show: {
																					type: ['custom'],
																				},
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
									],
								},
							],
						},

						{
							displayName: 'SKU',
							name: 'sku',
							type: 'string',
							default: '',
							description: 'SKU of the variant',
							displayOptions: {
								show: {
									action: ['addPrice', 'changeMasterVariant', 'removeVariant', 'setSku', 'setAttribute', 'addAsset', 'setPrices', 'setProductVariantKey', 'addExternalImage', 'setImageLabel', 'changeAssetName', 'setAssetDescription', 'setAssetCustomField', 'changeAssetOrder', 'setAssetTags', 'setAssetSources', 'setAssetCustomType'],
									identifyBy: ['sku'],
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
									action: ['changePrice', 'changeName', 'changeSlug', 'setDescription', 'setAttribute', 'addVariant', "setImageLabel"],
								},
							},
						},

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

						{
							displayName: 'Tags',
							name: 'tags',
							type: 'string',
							default: [],
							typeOptions: {
								multipleValues: true,
							},
							description: 'List of tags for the asset',
							displayOptions: {
								show: {
									action: ['setAssetTags'],
								},
							},
						},


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
									action: ['addPrice', 'changeMasterVariant', 'removeVariant', 'setSku', 'setAttribute', 'addAsset', 'setPrices', 'setProductVariantKey', 'addExternalImage', 'setImageLabel', 'moveImageToPosition', 'removeImage', 'removeAsset', 'setAssetKey', 'setAssetCustomField', 'changeAssetName', 'setAssetDescription', 'changeAssetOrder', 'setAssetTags', 'setAssetSources', 'setAssetCustomType', 'revertStagedVariantChanges'],
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
									action: ['addPrice', 'changeMasterVariant', 'removeVariant', 'setSku', 'setAttribute', 'addAsset', 'setPrices', 'setProductVariantKey', 'addExternalImage', 'setImageLabel', 'moveImageToPosition', 'removeImage', 'removeAsset', 'setAssetKey', 'setAssetCustomField', 'changeAssetName', 'setAssetDescription', 'changeAssetOrder', 'setAssetTags', 'setAssetSources', 'setAssetCustomType', 'revertStagedVariantChanges'],
									identifyBy: ['variantId'],
								},
							},
						},
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
		
		{
			displayName: 'Customer ID',
			name: 'customerId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['get', 'update', 'delete', 'head', 'changePassword', 'changePasswordInStore', 'getInStore', 'updateInStore', 'deleteInStore', 'headInStore', 'createEmailToken'],
				},
			},
			description: 'The unique ID of the customer',
		},
		{
			displayName: 'Customer Key',
			name: 'customerKey',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['getByKey', 'updateByKey', 'deleteByKey', 'headByKey', 'getInStoreByKey', 'updateInStoreByKey', 'deleteInStoreByKey', 'headInStoreByKey'],
				},
			},
			description: 'The unique key of the customer',
		},
		{
			displayName: 'Store Key',
			name: 'storeKey',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['authenticateInStore', 'changePasswordInStore', 'createInStore', 'getInStore', 'getInStoreByKey', 'getInStoreByEmailToken', 'getInStoreByPasswordToken', 'updateInStore', 'updateInStoreByKey', 'deleteInStore', 'deleteInStoreByKey', 'headInStore', 'headInStoreByKey', 'headInStoreByQuery', 'queryInStore', 'resetPasswordInStore', 'createPasswordResetTokenInStore', 'createEmailTokenInStore', 'verifyEmailInStore'],
				},
			},
			description: 'The key of the store',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'name@email.com',
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['authenticate', 'authenticateInStore', 'createPasswordResetToken', 'createPasswordResetTokenInStore'],
				},
			},
			description: 'The email address of the customer',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['authenticate', 'authenticateInStore'],
				},
			},
			description: 'The password of the customer',
		},
		{
			displayName: 'Current Password',
			name: 'currentPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['changePassword', 'changePasswordInStore'],
				},
			},
			description: 'The current password of the customer',
		},
		{
			displayName: 'New Password',
			name: 'newPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['changePassword', 'changePasswordInStore', 'resetPassword', 'resetPasswordInStore'],
				},
			},
			description: 'The new password for the customer',
		},
		{
			displayName: 'Password Token',
			name: 'passwordToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['getByPasswordToken', 'getInStoreByPasswordToken'],
				},
			},
			description: 'The password reset token',
		},
		{
			displayName: 'Email Token',
			name: 'emailToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['getByEmailToken', 'getInStoreByEmailToken'],
				},
			},
			description: 'The email verification token',
		},
		{
			displayName: 'Token Value',
			name: 'tokenValue',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['resetPassword', 'resetPasswordInStore', 'verifyEmail', 'verifyEmailInStore'],
				},
			},
			description: 'The token value for password reset or email verification',
		},
		{
			displayName: 'Version',
			name: 'version',
			type: 'number',
			default: 1,
			required: true,
			typeOptions: {
				minValue: 1,
			},
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey', 'delete', 'deleteByKey', 'deleteInStore', 'deleteInStoreByKey', 'changePassword', 'changePasswordInStore', 'createEmailToken', 'createEmailTokenInStore'],
				},
			},
			description: 'Current version of the customer for optimistic locking',
		},
		{
			displayName: 'TTL Minutes',
			name: 'ttlMinutes',
			type: 'number',
			default: 4320,
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['createEmailToken', 'createEmailTokenInStore'],
				},
			},
			description: 'Validity period of the generated token in minutes (default: 4320 = 3 days)',
		},
		{
			displayName: 'Customer Draft (JSON)',
			name: 'customerDraft',
			type: 'json',
			default: '{}',
			required: true,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['create', 'createInStore'],
				},
			},
			description: 'JSON representation of the customer draft to create, e.g. <code>{"email":"user@example.com","password":"secret","firstName":"John","lastName":"Doe"}</code>',
		},

		{
			displayName: 'Actions (JSON)',
			name: 'actions',
			type: 'json',
			default: '[]',
			description: 'Update actions to apply to the resource',
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['update', 'updateByKey'],
				},
			},
		},
		{
			displayName: 'Actions (UI)',
			name: 'customerActionsUi',
			type: 'fixedCollection',
			default: {},
			placeholder: 'Add Action',
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				},
			},
			typeOptions: {
				multipleValues: true,
			},
			description: 'Update actions to perform on the customer',
			options: [
				{
					displayName: 'Action',
					name: 'action',
					values: [
						{
							displayName: 'Action Type',
							name: 'actionType',
							type: 'options',
							options: [
								{
									name: 'Add Address',
									value: 'addAddress',
								},
								{
									name: 'Add Billing Address ID',
									value: 'addBillingAddressId',
								},
								{
									name: 'Add CustomerGroupAssignment',
									value: 'addCustomerGroupAssignment',
								},
								{
									name: 'Add Shipping Address ID',
									value: 'addShippingAddressId',
								},
								{
									name: 'Add Store',
									value: 'addStore',
								},
								{
									name: 'Change Address',
									value: 'changeAddress',
								},
								{
									name: 'Change Email',
									value: 'changeEmail',
								},
								{
									name: 'Remove Address',
									value: 'removeAddress',
								},
								{
									name: 'Remove Billing Address ID',
									value: 'removeBillingAddressId',
								},
								{
									name: 'Remove CustomerGroupAssignment',
									value: 'removeCustomerGroupAssignment',
								},
								{
									name: 'Remove Shipping Address ID',
									value: 'removeShippingAddressId',
								},
								{
									name: 'Remove Store',
									value: 'removeStore',
								},
								{
									name: 'Set Authentication Mode',
									value: 'setAuthenticationMode',
								},
								{
									name: 'Set Company Name',
									value: 'setCompanyName',
								},
								{
									name: 'Set Custom Field',
									value: 'setCustomField',
								},
								{
									name: 'Set Custom Field in Address',
									value: 'setCustomFieldInAddress',
								},
								{
									name: 'Set Custom Type',
									value: 'setCustomType',
								},
								{
									name: 'Set Custom Type in Address',
									value: 'setCustomTypeInAddress',
								},
								{
									name: 'Set Customer Group',
									value: 'setCustomerGroup',
								},
								{
									name: 'Set Customer Number',
									value: 'setCustomerNumber',
								},
								{
									name: 'Set CustomerGroupAssignments',
									value: 'setCustomerGroupAssignments',
								},
								{
									name: 'Set Date of Birth',
									value: 'setDateOfBirth',
								},
								{
									name: 'Set Default Billing Address',
									value: 'setDefaultBillingAddress',
								},
								{
									name: 'Set Default Shipping Address',
									value: 'setDefaultShippingAddress',
								},
								{
									name: 'Set External ID',
									value: 'setExternalId',
								},
								{
									name: 'Set First Name',
									value: 'setFirstName',
								},
								{
									name: 'Set Last Name',
									value: 'setLastName',
								},
								{
									name: 'Set Locale',
									value: 'setLocale',
								},
								{
									name: 'Set Middle Name',
									value: 'setMiddleName',
								},
								{
									name: 'Set Salutation',
									value: 'setSalutation',
								},
								{
									name: 'Set Stores',
									value: 'setStores',
								},
								{
									name: 'Set Title',
									value: 'setTitle',
								},
								{
									name: 'Set Vat ID',
									value: 'setVatId',
								},
							],
							default: 'changeEmail',
						},
						{
							displayName: 'Additional Address Info',
							name: 'additionalAddressInfo',
							type: 'string',
							default: '',
							description: 'Additional address information',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Additional Street Info',
							name: 'additionalStreetInfo',
							type: 'string',
							default: '',
							description: 'Additional street information',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Address Email',
							name: 'addressEmail',
							type: 'string',
							default: '',
							description: 'Email address for this address (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Address ID',
							name: 'addressId',
							type: 'string',
							default: '',
							description: 'ID of the address',
							displayOptions: {
								show: {
									actionType: ['addBillingAddressId', 'addShippingAddressId', 'removeBillingAddressId', 'removeShippingAddressId', 'removeAddress', 'changeAddress', 'changeAddressId', 'setDefaultBillingAddress', 'setDefaultShippingAddress', 'setAddressCustomField', 'setAddressCustomType', 'setCustomFieldInAddress', 'setCustomTypeInAddress'],
									addressReferenceType: ['id'],
								},
							},
						},
						{
							displayName: 'Address Key',
							name: 'addressKey',
							type: 'string',
							default: '',
							description: 'Key of the address',
							displayOptions: {
								show: {
									actionType: ['addBillingAddressId', 'addShippingAddressId', 'removeBillingAddressId', 'removeShippingAddressId', 'removeAddress', 'changeAddress', 'changeAddressId', 'setDefaultBillingAddress', 'setDefaultShippingAddress', 'setAddressCustomField', 'setAddressCustomType', 'setCustomFieldInAddress', 'setCustomTypeInAddress'],
									addressReferenceType: ['key'],
								},
							},
						},
						{
							displayName: 'Address Reference Type',
							name: 'addressReferenceType',
							type: 'options',
							options: [
								{
									name: 'ID',
									value: 'id',
									description: 'Reference address by ID',
								},
								{
									name: 'Key',
									value: 'key',
									description: 'Reference address by key',
								},
						],
							default: 'id',
							description: 'Whether to reference the address by ID or key',
							displayOptions: {
								show: {
									actionType: ['addBillingAddressId', 'addShippingAddressId', 'removeBillingAddressId', 'removeShippingAddressId', 'removeAddress', 'changeAddress', 'changeAddressId', 'setDefaultBillingAddress', 'setDefaultShippingAddress', 'setAddressCustomField', 'setAddressCustomType', 'setCustomFieldInAddress', 'setCustomTypeInAddress'],
								},
							},
						},
						{
							displayName: 'Apartment',
							name: 'apartment',
							type: 'string',
							default: '',
							description: 'Apartment, suite, unit, etc (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Authentication Mode',
							name: 'authMode',
							type: 'options',
							options: [
								{
									name: 'Password',
									value: 'Password',
								},
								{
									name: 'External Auth',
									value: 'ExternalAuth',
								},
						],
							default: 'Password',
							description: 'Authentication mode for the customer',
							displayOptions: {
								show: {
									actionType: ['setAuthenticationMode'],
								},
							},
						},
						{
							displayName: 'Building',
							name: 'building',
							type: 'string',
							default: '',
							description: 'Building name or number (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'City',
							name: 'city',
							type: 'string',
							default: '',
							description: 'City name',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Company Name',
							name: 'companyName',
							type: 'string',
							default: '',
							description: 'Company name for the customer',
							displayOptions: {
								show: {
									actionType: ['setCompanyName'],
								},
							},
						},
						{
							displayName: 'Country',
							name: 'country',
							type: 'string',
							required: true,
							default: '',
							description: 'Country code (e.g., DE, US, GB) - Required',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Customer Group ID',
							name: 'customerGroupId',
							type: 'string',
							default: '',
							description: 'ID of the customer group',
							displayOptions: {
								show: {
									actionType: ['addCustomerGroupAssignment', 'removeCustomerGroupAssignment', 'setCustomerGroup'],
									customerGroupReferenceType: ['id'],
								},
							},
						},
						{
							displayName: 'Customer Group IDs',
							name: 'customerGroupIds',
							type: 'string',
							default: '',
							description: 'Comma-separated list of customer group IDs',
							displayOptions: {
								show: {
									actionType: ['setCustomerGroupAssignments', 'addToCustomerGroup', 'removeFromCustomerGroup'],
									customerGroupReferenceType: ['id'],
								},
							},
						},
						{
							displayName: 'Customer Group Key',
							name: 'customerGroupKey',
							type: 'string',
							default: '',
							description: 'Key of the customer group',
							displayOptions: {
								show: {
									actionType: ['addCustomerGroupAssignment', 'removeCustomerGroupAssignment', 'setCustomerGroup'],
									customerGroupReferenceType: ['key'],
								},
							},
						},
						{
							displayName: 'Customer Group Keys',
							name: 'customerGroupKeys',
							type: 'string',
							default: '',
							description: 'Comma-separated list of customer group keys',
							displayOptions: {
								show: {
									actionType: ['setCustomerGroupAssignments', 'addToCustomerGroup', 'removeFromCustomerGroup'],
									customerGroupReferenceType: ['key'],
								},
							},
						},
						{
							displayName: 'Customer Group Reference Type',
							name: 'customerGroupReferenceType',
							type: 'options',
							options: [
								{
									name: 'ID',
									value: 'id',
									description: 'Reference customer group by ID',
								},
								{
									name: 'Key',
									value: 'key',
									description: 'Reference customer group by key',
								},
						],
							default: 'id',
							description: 'Whether to reference the customer group by ID or key',
							displayOptions: {
								show: {
									actionType: ['addCustomerGroupAssignment', 'removeCustomerGroupAssignment', 'setCustomerGroup', 'setCustomerGroupAssignments', 'addToCustomerGroup', 'removeFromCustomerGroup'],
								},
							},
						},
						{
							displayName: 'Customer Number',
							name: 'customerNumber',
							type: 'string',
							default: '',
							description: 'Customer number for identification',
							displayOptions: {
								show: {
									actionType: ['setCustomerNumber'],
								},
							},
						},
						{
							displayName: 'Date of Birth',
							name: 'dateOfBirth',
							type: 'dateTime',
							default: '',
							description: 'Customer date of birth',
							displayOptions: {
								show: {
									actionType: ['setDateOfBirth'],
								},
							},
						},
						{
							displayName: 'Department',
							name: 'department',
							type: 'string',
							default: '',
							description: 'Department within building (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Email',
							name: 'email',
							type: 'string',
							default: '',
							placeholder: 'name@email.com',
							description: 'New email address',
							displayOptions: {
								show: {
									actionType: ['changeEmail'],
								},
							},
						},
						{
							displayName: 'External ID',
							name: 'externalId',
							type: 'string',
							default: '',
							description: 'External ID for the customer',
							displayOptions: {
								show: {
									actionType: ['setExternalId'],
								},
							},
						},
						{
							displayName: 'Fax',
							name: 'fax',
							type: 'string',
							default: '',
							description: 'Fax number (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Field Name',
							name: 'name',
							type: 'string',
							required: true,
							default: '',
							description: 'Name of the Custom Field',
							displayOptions: {
								show: {
									actionType: ['setCustomField', 'setCustomFieldInAddress'],
								},
							},
						},
						{
							displayName: 'Field Value',
							name: 'value',
							type: 'string',
							default: '',
							description: 'Value for the custom field (text, number, boolean, etc.)',
							displayOptions: {
								show: {
									actionType: ['setCustomField', 'setAddressCustomField'],
								},
							},
						},
						{
							displayName: 'Fields',
							name: 'fields',
							type: 'fixedCollection',
							default: {},
							description: 'Custom field values',
							typeOptions: {
								multipleValues: true,
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
											description: 'The name of the custom field',
										},
										{
											displayName: 'Value',
											name: 'value',
											type: 'string',
											default: '',
											description: 'The value of the custom field',
										},
									],
								},
							],
							displayOptions: {
								show: {
									actionType: ['setCustomType', 'setCustomTypeInAddress'],
								},
							},
						},
						{
							displayName: 'First Name',
							name: 'firstName',
							type: 'string',
							default: '',
							description: 'First name for the customer',
							displayOptions: {
								show: {
									actionType: ['setFirstName'],
								},
							},
						},
						{
							displayName: 'Key',
							name: 'key',
							type: 'string',
							default: '',
							description: 'Address key for identification (optional but recommended)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Last Name',
							name: 'lastName',
							type: 'string',
							default: '',
							description: 'Last name for the customer',
							displayOptions: {
								show: {
									actionType: ['setLastName'],
								},
							},
						},
						{
							displayName: 'Locale',
							name: 'locale',
							type: 'string',
							default: '',
							description: 'Locale for the customer (e.g., \'en-US\')',
							displayOptions: {
								show: {
									actionType: ['setLocale'],
								},
							},
						},
						{
							displayName: 'Middle Name',
							name: 'middleName',
							type: 'string',
							default: '',
							description: 'Middle name of the customer',
							displayOptions: {
								show: {
									actionType: ['setMiddleName'],
								},
							},
						},
						{
							displayName: 'Mobile',
							name: 'mobile',
							type: 'string',
							default: '',
							description: 'Mobile phone number (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'P.O. Box',
							name: 'pOBox',
							type: 'string',
							default: '',
							description: 'Post office box (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Password',
							name: 'password',
							type: 'string',
							typeOptions: { password: true },
							default: '',
							description: 'Password (required when setting to Password mode)',
							displayOptions: {
								show: {
									actionType: ['setAuthenticationMode'],
									authMode: ['Password'],
								},
							},
						},
						{
							displayName: 'Phone',
							name: 'phone',
							type: 'string',
							default: '',
							description: 'Phone number (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Postal Code',
							name: 'postalCode',
							type: 'string',
							default: '',
							description: 'Postal/ZIP code',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Salutation',
							name: 'salutation',
							type: 'string',
							default: '',
							description: 'Customer salutation (e.g., Mr., Mrs., Dr.)',
							displayOptions: {
								show: {
									actionType: ['setSalutation'],
								},
							},
						},
						{
							displayName: 'State',
							name: 'state',
							type: 'string',
							default: '',
							description: 'State or region (optional)',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Store ID',
							name: 'storeId',
							type: 'string',
							default: '',
							description: 'ID of the store',
							displayOptions: {
								show: {
									actionType: ['addStore', 'removeStore'],
									storeReferenceType: ['id'],
								},
							},
						},
						{
							displayName: 'Store IDs',
							name: 'storeIds',
							type: 'string',
							displayOptions: {
								show: {
									actionType: ['setStores'],
									storeReferenceType: ['id'],
								},
							},
							default: '',
							description: 'Comma-separated list of store IDs',
						},
						{
							displayName: 'Store Key',
							name: 'storeKey',
							type: 'string',
							default: '',
							description: 'Key of the store',
							displayOptions: {
								show: {
									actionType: ['addStore', 'removeStore'],
									storeReferenceType: ['key'],
								},
							},
						},
						{
							displayName: 'Store Keys',
							name: 'storeKeys',
							type: 'string',
							displayOptions: {
								show: {
									actionType: ['setStores'],
									storeReferenceType: ['key'],
								},
							},
							default: '',
							description: 'Comma-separated list of store keys',
						},
						{
							displayName: 'Store Reference Type',
							name: 'storeReferenceType',
							type: 'options',
							options: [
								{
									name: 'ID',
									value: 'id',
									description: 'Reference store by ID',
								},
								{
									name: 'Key',
									value: 'key',
									description: 'Reference store by key',
								},
						],
							default: 'id',
							description: 'Whether to reference the store by ID or key',
							displayOptions: {
								show: {
									actionType: ['addStore', 'removeStore', 'setStores'],
								},
							},
						},
						{
							displayName: 'Street Name',
							name: 'streetName',
							type: 'string',
							default: '',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Street Number',
							name: 'streetNumber',
							type: 'string',
							default: '',
							displayOptions: {
								show: {
									actionType: ['addAddress', 'changeAddress'],
								},
							},
						},
						{
							displayName: 'Title',
							name: 'title',
							type: 'string',
							default: '',
							description: 'Customer title (e.g., Mr., Mrs., Dr.)',
							displayOptions: {
								show: {
									actionType: ['setTitle'],
								},
							},
						},
						{
							displayName: 'Type ID',
							name: 'typeId',
							type: 'string',
							default: '',
							description: 'ID of the custom type',
							displayOptions: {
								show: {
									actionType: ['setCustomType', 'setCustomTypeInAddress'],
									typeReferenceType: ['id'],
								},
							},
						},
						{
							displayName: 'Type Key',
							name: 'typeKey',
							type: 'string',
							default: '',
							description: 'Key of the custom type',
							displayOptions: {
								show: {
									actionType: ['setCustomType', 'setCustomTypeInAddress'],
									typeReferenceType: ['key'],
								},
							},
						},
						{
							displayName: 'Type Reference Type',
							name: 'typeReferenceType',
							type: 'options',
							options: [
								{
									name: 'ID',
									value: 'id',
									description: 'Reference type by ID',
								},
								{
									name: 'Key',
									value: 'key',
									description: 'Reference type by key',
								},
						],
							default: 'key',
							description: 'Whether to reference the custom type by ID or key',
							displayOptions: {
								show: {
									actionType: ['setCustomType', 'setCustomTypeInAddress'],
								},
							},
						},
						{
							displayName: 'VAT ID',
							name: 'vatId',
							type: 'string',
							default: '',
							description: 'VAT ID for the customer',
							displayOptions: {
								show: {
									actionType: ['setVatId'],
								},
							},
						},
				],
				},
			],
		},








		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['query', 'queryInStore'],
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
					resource: ['customer'],
					operation: ['query', 'queryInStore'],
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
					resource: ['customer'],
					operation: ['query', 'queryInStore'],
				},
			},
			description: 'Number of customers to skip before returning results',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			default: {},
			placeholder: 'Add Field',
			options: [
				{
					displayName: 'Anonymous Cart ID',
					name: 'anonymousCartId',
					type: 'string',
					default: '',
					description: 'The ID of the anonymous cart to merge with the customer cart',
				},
				{
					displayName: 'Anonymous Cart Sign In Mode',
					name: 'anonymousCartSignInMode',
					type: 'options',
					options: [
						{
							name: 'Merge With Existing Customer Cart',
							value: 'MergeWithExistingCustomerCart',
						},
						{
							name: 'Use As New Active Customer Cart',
							value: 'UseAsNewActiveCustomerCart',
						},
					],
					default: 'MergeWithExistingCustomerCart',
					description: 'How to handle the anonymous cart when signing in',
				},
				{
					displayName: 'Anonymous ID',
					name: 'anonymousId',
					type: 'string',
					default: '',
					description: 'The ID of the anonymous session',
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
				{
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
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
					displayName: 'Sort',
					name: 'sort',
					type: 'string',
					default: '',
					description: 'Sort customers by specific fields',
				},
				{
					displayName: 'TTL Minutes',
					name: 'ttlMinutes',
					type: 'number',
					default: 10080,
					description: 'Time to live for tokens in minutes (default: 7 days)',
				},
				{
					displayName: 'Update Product Data',
					name: 'updateProductData',
					type: 'boolean',
					default: false,
					description: 'Whether to update product data in the cart',
				},
				{
					displayName: 'Where',
					name: 'where',
					type: 'string',
					default: '',
					description: 'Query predicate to filter customers',
				},
				{
					displayName: 'With Total',
					name: 'withTotal',
					type: 'boolean',
					default: false,
					description: 'Whether to include total count in the response',
				},
			],
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['authenticate', 'authenticateInStore', 'query', 'queryInStore', 'headByQuery', 'headInStoreByQuery', 'createPasswordResetToken', 'createPasswordResetTokenInStore', 'createEmailToken', 'createEmailTokenInStore'],
				},
			},
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
					resource: ['customer'],
					operation: ['get', 'getByKey', 'getByEmailToken', 'getByPasswordToken', 'getInStore', 'getInStoreByKey', 'getInStoreByEmailToken', 'getInStoreByPasswordToken'],
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
			],
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['create', 'createInStore'],
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
					displayName: 'Expand',
					name: 'expand',
					type: 'string',
					default: '',
					description: 'Include additional resources by reference expansion',
				},
			],
			displayOptions: {
				show: {
					resource: ['customer'],
					operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				},
			},
		},
	],
};