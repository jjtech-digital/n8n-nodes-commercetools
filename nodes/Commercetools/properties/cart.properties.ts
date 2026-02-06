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
	}
];

export const cartUpdateFields: INodeProperties[] = [
	{
		displayName: 'Actions (UI)',
		name: 'updateActions',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Action',
		typeOptions: {
			multipleValues: true,
		},
		description: 'Define multiple update actions to perform on the cart',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
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
							required:	true,
						default: 'setKey',
						options: [
							{
								name: 'Add Custom Line Item',
								value: 'addCustomLineItem',	
							},
							{
								name: 'Add Custom ShippingMethod',
								value: 'addCustomShippingMethod',
							},
							{
								name: 'Add DiscountCode',
								value: 'addDiscountCode',
							},
							{
								name: 'Add ItemShippingAddress',
								value: 'addItemShippingAddress',
							},
							{
								name: 'Add Payment',
								value: 'addPayment',	
							},
							{
								name: 'Add Shipping Method',
								value: 'addShippingMethod',
							},
							{
								name: 'Add Shopping List',
								value: 'addShoppingList',
							},
							{
								name: 'Apply DeltaToCustomLineItemShippingDetailsTargets',
								value: 'applyDeltaToCustomLineItemShippingDetailsTargets',
							},
							{
								name: 'Apply DeltaToLineItemShippingDetailsTargets',
								value: 'applyDeltaToLineItemShippingDetailsTargets',
							},
							{
								name: 'Change Custom Line Item Money',
								value: 'changeCustomLineItemMoney',
							},
							{
								name: 'Change Custom Line Item Price Mode',
								value: 'changeCustomLineItemPriceMode',
							},
							{
								name: 'Change Custom Line Item Quantity',
								value: 'changeCustomLineItemQuantity',
							},
							{
								name: 'Change LineItem Quantity',
								value: 'changeLineItemQuantity',
							},
							{
								name: 'Change Price Rounding Mode',
								value: 'changePriceRoundingMode',	
							},
							{
								name: 'Change Tax Calculation Mode',
								value: 'changeTaxCalculationMode',
							},
							{
								name: 'Change Tax Mode',
								value: 'changeTaxMode',
							},
							{
								name: 'Change Tax Rounding Mode',
								value: 'changeTaxRoundingMode',
							},
							{
								name: 'Freeze Cart',
								value: 'freezeCart',
							},
							{
								name: 'Lock Cart',
								value: 'lockCart',
							},
							{
								name: 'Recalculate',
								value: 'recalculate',
							},
							{
								name: 'Remove Custom Line Item',
								value: 'removeCustomLineItem',
							},
							{
								name: 'Remove DiscountCode',
								value: 'removeDiscountCode',
							},
							{
								name: 'Remove Item Shipping Address',
								value: 'removeItemShippingAddress',
							},
							{
								name: 'Remove Payment',
								value: 'removePayment',
							},
							{
								name: 'Remove ShippingMethod',
								value: 'removeShippingMethod',
							},
							{
								name: 'Set Anonymous ID',
								value: 'setAnonymousId',
							},
							{
								name: 'Set Billing Address',
								value: 'setBillingAddress',
							},
							{
								name: 'Set Billing Address CustomField',
								value: 'setBillingAddressCustomField',
							},
							{
								name: 'Set Billing Address CustomType',
								value: 'setBillingAddressCustomType',
							},
							{
								name: 'Set Business Unit',
								value: 'setBusinessUnit',	
							},
							{
								name: 'Set Cart Total Tax',
								value: 'setCartTotalTax',
							},
							{
								name: 'Set Country',
								value: 'setCountry',
							},
							{
								name: 'Set Custom Line Item CustomField',
								value: 'setCustomLineItemCustomField',
							},
							{
								name: 'Set Custom Line Item CustomType',
								value: 'setCustomLineItemCustomType',
							},
							{
								name: 'Set Custom Line Item RecurrenceInfo',
								value: 'setCustomLineItemRecurrenceInfo',
							},
							{
								name: 'Set Custom Line Item ShippingDetails',
								value: 'setCustomLineItemShippingDetails',
							},
							{
								name: 'Set Custom Line Item TaxAmount',
								value: 'setCustomLineItemTaxAmount',
							},
							{
								name: 'Set Custom Line Item TaxRate',
								value: 'setCustomLineItemTaxRate',
							},
							{
								name: 'Set Custom ShippingMethod',
								value: 'setCustomShippingMethod',
							},
							
							{
								name: 'Set Custom Type',
								value: 'setCustomType',
							},
							{
								name: 'Set Customer Email',
								value: 'setCustomerEmail',
							},
							{
								name: 'Set Customer Group',
								value: 'setCustomerGroup',
							},
							{
								name: 'Set Customer ID',
								value: 'setCustomerId',
							},
							{
								name: 'Set CustomField',
								value: 'setCustomField',
							},
							{
								name: 'Set DeleteDaysAfterLastModification',
								value: 'setDeleteDaysAfterLastModification',
							},
							{
								name: 'Set DirectDiscounts',
								value: 'setDirectDiscounts',
							},
							{
								name: 'Set ItemShipping Address CustomField',
								value: 'setItemShippingAddressCustomField',
							},
							{
								name: 'Set ItemShipping Address CustomType',
								value: 'setItemShippingAddressCustomType',
							},
							{
								name: 'Set Key',
								value: 'setKey',
							},
							{
								name: 'Set LineItem CustomField',
								value: 'setLineItemCustomField',
							},
							
							{
								name: 'Set LineItem CustomType',
								value: 'setLineItemCustomType',
							},
							
							{
								name: 'Set LineItem DistributionChannel',
								value: 'setLineItemDistributionChannel',
							},
							{
								name: 'Set LineItem InventoryMode',
								value: 'setLineItemInventoryMode',
							},
							{
								name: 'Set LineItem Price',
								value: 'setLineItemPrice',
							},
							{
								name: 'Set LineItem RecurrenceInfo',
								value: 'setLineItemRecurrenceInfo',
							},
							
							{
								name: 'Set LineItem ShippingDetails',
								value: 'setLineItemShippingDetails',
							},
							{
								name: 'Set LineItem SupplyChannel',
								value: 'setLineItemSupplyChannel',
							},
							{
								name: 'Set LineItem TaxAmount',
								value: 'setLineItemTaxAmount',
							},
							
							{
								name: 'Set LineItem TaxRate',
								value: 'setLineItemTaxRate',
							},
							{
								name: 'Set LineItem TotalPrice',
								value: 'setLineItemTotalPrice',
							},
							{
								name: 'Set Locale',
								value: 'setLocale',
							},
							{
								name: 'Set Purchase Order Number',
								value: 'setPurchaseOrderNumber',
								
							},
							{
								name: 'Set Shipping Address',
								value: 'setShippingAddress',
							},
							{
								name: 'Set Shipping Address CustomField',
								value: 'setShippingAddressCustomField',
							},
							{
								name: 'Set Shipping Address CustomType',
								value: 'setShippingAddressCustomType',
							},
							{
								name: 'Set Shipping CustomField',
								value: 'setShippingCustomField',
							},
							{
								name: 'Set Shipping CustomType',
								value: 'setShippingCustomType',
							},
							{
								name: 'Set ShippingMethod',
								value: 'setShippingMethod',
							},
							{
								name: 'Set ShippingMethod TaxAmount',
								value: 'setShippingMethodTaxAmount',
							},
							{
								name: 'Set ShippingMethod TaxRate',
								value: 'setShippingMethodTaxRate',
							},
							{
								name: 'Set ShippingRateInput',
								value: 'setShippingRateInput',
							},
							{
								name: 'Unfreeze Cart',
								value: 'unfreezeCart',
							},
							{
								name: 'Unlock Cart',
								value: 'unlockCart',
							},
							{
								name: 'Update ItemShippingAddress',
								value: 'updateItemShippingAddress',
							},
						]
					},
					{
						displayName: 'Additional Address Info',
						name: 'additionalAddressInfo',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Additional address information',
					},
					{
						displayName: 'Additional Street Info',
						name: 'additionalStreetInfo',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Additional street information',
					},
					{
						displayName: 'Address Custom Type ID',
						name: 'addressCustomTypeId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: [
									'setBillingAddressCustomType',
									'setShippingAddressCustomType',
									'setItemShippingAddressCustomType',
								],
								addressCustomTypeSelection: ['id'],
							},
						},
						description: 'ID of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Address Custom Type Key',
						name: 'addressCustomTypeKey',
						type: 'string',
						default: '',
						placeholder: 'type-key',
						displayOptions: {
							show: {
								action: [
									'setBillingAddressCustomType',
									'setShippingAddressCustomType',
									'setItemShippingAddressCustomType',
								],
								addressCustomTypeSelection: ['key'],
							},
						},
						description: 'Key of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Address Custom Type Selection',
						name: 'addressCustomTypeSelection',
						type: 'options',
						default: 'id',
						options: [
							{
								name: 'By ID',
								value: 'id',
							},
							{
								name: 'By Key',
								value: 'key',
							},
						],
						displayOptions: {
							show: {
								action: [
									'setBillingAddressCustomType',
									'setShippingAddressCustomType',
									'setItemShippingAddressCustomType',
								],
							},
						},
						description: 'Choose whether to identify the Type by ID or Key',
					},
					{
						displayName: 'Address Key',
						name: 'addressKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: [
									'removeItemShippingAddress',
									'setItemShippingAddressCustomType',
									'setItemShippingAddressCustomField',
								],
							},
						},
						description: 'Key of the Address to remove from itemShippingAddresses',
					},
					{
						displayName: 'Anonymous ID',
						name: 'anonymousId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setAnonymousId'],
							},
						},
						description: 'Value to set. If empty, any existing value is removed.',
					},
					{
						displayName: 'Apartment',
						name: 'apartment',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Apartment, suite, unit, etc',
					},
					{
						displayName: 'Building',
						name: 'building',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Building name or number',
					},
					{
						displayName: 'Business Unit',
						name: 'businessUnit',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBusinessUnit'],
							},
						},
						options: [
							{
								displayName: 'Business Unit Reference',
								name: 'businessUnitReference',
									values:	[
											{
												displayName: 'Key',
												name: 'key',
												type: 'string',
												default: '',
												placeholder: '',
												description: 'Key of the business unit',
											},
											{
												displayName: 'Type ID',
												name: 'typeId',
												type: 'options',
												options: [
													{
														name: 'Business Unit',
														value: 'business-unit',
													},
													],
												default: 'business-unit',
												description: 'Type of the reference',
											},
									]
							},
					],
						description: 'New Business Unit to assign to the Cart',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'City name',
					},
					
					{
						displayName: 'Code',
						name: 'code',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addDiscountCode', 'removeDiscountCode'],
							},
						},
						description: 'Code of a DiscountCode',
					},
					{
						displayName: 'Company',
						name: 'company',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Company name',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress','setCountry'],
							},
						},
						description: 'Country code (e.g., DE, US, GB)',
					},
					
					{
						displayName: 'Custom Field Name',
						name: 'customFieldName',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomField'],
							},
						},
						description: 'Name of the Custom Field',
					},
					{
						displayName: 'Custom Field Name',
						name: 'customFieldName',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: [
									'setLineItemCustomField',
									'setCustomLineItemCustomField',
									'setBillingAddressCustomField',
									'setShippingAddressCustomField',
									'setShippingCustomField',
									'setItemShippingAddressCustomField',
								],
							},
						},
						description: 'Name of the Custom Field to set',
						required: true,
					},
					{
						displayName: 'Custom Field Value',
						name: 'customFieldValue',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomField'],
							},
						},
						description: 'If value is absent or null, this field will be removed if it exists. Removing a field that does not exist returns an InvalidOperation error. If value is provided, it is set for the field defined by name.',
					},
					{
						displayName: 'Custom Field Value',
						name: 'customFieldValue',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: [
									'setLineItemCustomField',
									'setCustomLineItemCustomField',
									'setBillingAddressCustomField',
									'setShippingAddressCustomField',
									'setShippingCustomField',
									'setItemShippingAddressCustomField',
								],
							},
						},
						description: 'Value to set for the Custom Field. If null or absent, this field will be removed if it exists.',
					},
					{
						displayName: 'Custom Fields',
						name: 'customFields',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: [
									'setLineItemCustomType',
									'setCustomLineItemCustomType',
									'setBillingAddressCustomType',
									'setShippingAddressCustomType',
									'setItemShippingAddressCustomType',
									'setShippingCustomType',
								],
							},
						},
						description: 'Custom Fields as JSON object. Sets the Custom Fields for the LineItem.',
					},
					{
						displayName: 'Custom Fields',
						name: 'custom',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'CustomFieldsDraft as JSON string',
					},
					{
						displayName: 'Custom Fields',
						name: 'customFieldsCustomShipping',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod', 'setCustomShippingMethod'],
							},
						},
						description: 'Custom Fields for the custom Shipping Method as JSON string',
					},
					{
						displayName: 'Custom Line Item Custom Type ID',
						name: 'customLineItemCustomTypeId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomLineItemCustomType'],
								customLineItemCustomTypeSelection: ['id'],
							},
						},
						description: 'ID of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Custom Line Item Custom Type Key',
						name: 'customLineItemCustomTypeKey',
						type: 'string',
						default: '',
						placeholder: 'type-key',
						displayOptions: {
							show: {
								action: ['setCustomLineItemCustomType'],
								customLineItemCustomTypeSelection: ['key'],
							},
						},
						description: 'Key of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Custom Line Item Custom Type Selection',
						name: 'customLineItemCustomTypeSelection',
						type: 'options',
						default: 'id',
						options: [
							{
								name: 'By ID',
								value: 'id',
							},
							{
								name: 'By Key',
								value: 'key',
							},
						],
						displayOptions: {
							show: {
								action: ['setCustomLineItemCustomType'],
							},
						},
						description: 'Choose whether to identify the Type by ID or Key',
					},
					{
						displayName: 'Custom Line Item ID',
						name: 'removeCustomLineItemId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['removeCustomLineItem'],
								removeCustomLineItemSelection: ['id'],
							},
						},
						description: 'ID of the CustomLineItem to update. Either customLineItemId or customLineItemKey is required.',
					},
					{
					displayName: 'Custom Line Item ID',
					name: 'customLineItemId',
					type: 'string',
					default: '',
					description: 'ID of the CustomLineItem to update. Either customLineItemId or customLineItemKey is required.',
					displayOptions: {
						show: {
							action: [
								'applyDeltaToCustomLineItemShippingDetailsTargets',
								'changeCustomLineItemQuantity',
								'changeCustomLineItemMoney',
								'changeCustomLineItemPriceMode',
								'setCustomLineItemCustomField',
								'setCustomLineItemCustomType',
								'setCustomLineItemRecurrenceInfo',
								'setCustomLineItemTaxAmount',
								'setCustomLineItemTaxRate',
								'setCustomLineItemShippingDetails',
							],
							customLineItemSelection: ['id'],
						},
					},
				},
					{
						displayName: 'Custom Line Item Key',
						name: 'removeCustomLineItemKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['removeCustomLineItem'],
								removeCustomLineItemSelection: ['key'],
							},
						},
						description: 'Key of the CustomLineItem to update. Either customLineItemId or customLineItemKey is required.',
					},
					{
					displayName: 'Custom Line Item Key',
					name: 'customLineItemKey',
					type: 'string',
					default: '',
					description: 'Key of the CustomLineItem to update. Either customLineItemId or customLineItemKey is required.',
					displayOptions: {
						show: {
							action: [
								'applyDeltaToCustomLineItemShippingDetailsTargets',
								'changeCustomLineItemQuantity',
								'changeCustomLineItemMoney',
								'changeCustomLineItemPriceMode',
								'setCustomLineItemCustomField',
								'setCustomLineItemCustomType',
								'setCustomLineItemRecurrenceInfo',
								'setCustomLineItemTaxAmount',
								'setCustomLineItemTaxRate',
								'setCustomLineItemShippingDetails',
							],
							customLineItemSelection: ['key'],
						},
					},
				},
				
				{
					displayName: 'Custom Line Item Price Mode',
					name: 'customLineItemPriceMode',
					type: 'options',
					default: 'Standard',
					options: [
						{
							name: 'Standard',
							value: 'Standard',
						},
						{
							name: 'External',
							value: 'External',
						},
					],
					displayOptions: {
						show: {
							action: ['changeCustomLineItemPriceMode'],
						},
					},
					description: 'New value to set. Must not be empty.',
				},
					{
						displayName: 'Custom Line Item Selection',
						name: 'removeCustomLineItemSelection',
						type: 'options',
						default: 'id',
						options: [
							{
								name: 'By ID',
								value: 'id',
							},
							{
								name: 'By Key',
								value: 'key',
							},
						],
						displayOptions: {
							show: {
								action: ['removeCustomLineItem'],
							},
						},
						description: 'Choose whether to identify the Custom Line Item by ID or Key',
					},
					
				
				{
					displayName: 'Custom Line Item Selection',
					name: 'customLineItemSelection',
					type: 'options',
					default: 'id',
					options: [
						{
							name: 'By ID',
							value: 'id',
						},
						{
							name: 'By Key',
							value: 'key',
						},
					],
					displayOptions: {
						show: {
							action: [
								'applyDeltaToCustomLineItemShippingDetailsTargets',
								'changeCustomLineItemQuantity',
								'changeCustomLineItemMoney',
								'changeCustomLineItemPriceMode',
								'setCustomLineItemCustomField',
								'setCustomLineItemCustomType',
								'setCustomLineItemRecurrenceInfo',
								'setCustomLineItemTaxAmount',
								'setCustomLineItemTaxRate',
								'setCustomLineItemShippingDetails',
							],
						},
					},
					description: 'Choose whether to identify the Custom Line Item by ID or Key',
				},
				
					{
						displayName: 'Custom Type Fields',
						name: 'customTypeFields',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomType'],
							},
						},
						description: 'Sets the Custom Fields fields for the Cart as JSON string',
					},
					{
						displayName: 'Custom Type ID',
						name: 'customTypeId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: [
									'setLineItemCustomType',
									'setCustomLineItemCustomType',
								],
								lineItemCustomTypeSelection: ['id'],
							},
						},
						description: 'ID of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Custom Type Key',
						name: 'customTypeKey',
						type: 'string',
						default: '',
						placeholder: 'type-key',
						displayOptions: {
							show: {
								action: [
									'setLineItemCustomType',
									'setCustomLineItemCustomType',
								],
								lineItemCustomTypeSelection: ['key'],
							},
						},
						description: 'Key of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					
					
					{
						displayName: 'Custom Type Reference',
						name: 'customTypeReference',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomType'],
							},
						},
						options: [
							{
								displayName: 'Type Reference',
								name: 'typeReference',
								values: [
									{
										displayName: 'ID',
										name: 'id',
										type: 'string',
										default: '',
										placeholder: '',
										description: 'ID of the type',
									},
									{
										displayName: 'Type ID',
										name: 'typeId',
										type: 'options',
										options: [
											{
												name: 'Type',
												value: 'type',
											},
										],
										default: 'type',
										description: 'Type of the reference',
									},
								],
							},
						],
						description: 'Defines the Type that extends the Cart with Custom Fields. If absent, any existing Type and Custom Fields are removed from the Cart.',
					},
					{
						displayName: 'Customer Group',
						name: 'customerGroup',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomerGroup'],
							},
						},
						options: [
							{
								displayName: 'Customer Group Reference',
								name: 'customerGroupReference',
									values:	[
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												placeholder: '',
												description: 'ID of the customer group',
											},
											{
												displayName: 'Type ID',
												name: 'typeId',
												type: 'options',
												options: [
													{
														name: 'Customer Group',
														value: 'customer-group',
													},
													],
												default: 'customer-group',
												description: 'Type of the reference',
											},
									]
							},
					],
						description: 'Customer Group to set. If empty, any existing value is removed.',
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomerId'],
							},
						},
						description: 'ID of an existing Customer. If the Customer is assigned to a CustomerGroup, this update action also sets the value for the customerGroup field. If empty, the update action removes the value for both customerId and customerGroup.',
					},
					
					{
						displayName: 'Deliveries',
						name: 'deliveries',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'Array of DeliveryDraft as JSON string',
					},
					{
						displayName: 'Deliveries',
						name: 'deliveriesCustomShipping',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod'],
							},
						},
						description: 'Array of DeliveryDraft - Deliveries to be shipped with the custom Shipping Method as JSON string',
					},
					{
						displayName: 'Department',
						name: 'department',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						
					},              
					{
						displayName: 'Discount Code',
						name: 'discountCode',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addDiscountCode', 'removeDiscountCode'],
							},
						},
						options: [
							{
								displayName: 'DiscountCode Reference',
								name: 'discountCodeReference',
									values:	[
											{
												displayName: 'Type ID',
												name: 'typeId',
												type: 'options',
												options: [
													{
														name: 'Discount Code',
														value: 'discount-code',
													},
													],
												default: 'discount-code',
												description: 'Type of the reference',
											},
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												placeholder: '',
												description: 'ID of the discount code',
											},
									]
							},
					],
						description: 'Discount Code to remove from the Cart',
					},
					{
						displayName: 'Discounts',
						name: 'discounts',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setDirectDiscounts'],
							},
						},
						description: 'Array of DirectDiscountDraft. If set, all existing Direct Discounts are replaced. The discounts apply in the order they are added to the list. If empty, all existing Direct Discounts are removed and all affected prices on the Cart or Order are recalculated.',
					},
					{
		             displayName: 'Distribution Channel ID',
		             name: 'distributionChannelId',
		             type: 'string',
		             default: '',
		             placeholder: '',
		             displayOptions: {
			              show: {
				            action: ['setLineItemDistributionChannel'],
			          },
		            },
		            description: 'ID of the Channel. If present, a Reference to the Channel is set for the LineItem specified by lineItemId.',
	                },
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCustomerEmail'],
							},
						},
						description: 'Value to set. If empty, any existing value is removed.',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Email address for this address',
					},

					{
						displayName: 'External ID',
						name: 'externalId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'External ID for the address',
					},
					{
		            displayName: 'External Price',
		            name: 'externalPrice',
		            type: 'fixedCollection',
		            default: {},
		            typeOptions: {
			        multipleValues: false,
		            },
		               displayOptions: {
			               show: {
				            action: ['setLineItemPrice'],
			        },
		          },
		                 options: [
			                {
				            displayName: 'Money',
				            name: 'money',
				            values: [
					        {
						    displayName: 'Currency Code',
						    name: 'currencyCode',
						    type: 'string',
						    default: 'EUR',
						    placeholder: 'EUR',
					        },
					        {
						    displayName: 'Cent Amount',
						    name: 'centAmount',
						    type: 'number',
						    default: 4000,
						    description: 'Amount in cents',
					    },
				    ],
			    },
		   ],
		            description: 'Value to set. If externalPrice is not given and the priceMode is ExternalPrice, the external price is unset and the priceMode is set to Platform.',
	                },
					{
		            displayName: 'External Price',
		            name: 'externalPrice',
		            type: 'fixedCollection',
		            default: {},
		            typeOptions: {
			        multipleValues: false,
		            },
		              displayOptions: {
			           show: {
				         action: ['changeLineItemQuantity'],
			        },
		        },
		         options: [
			           {
				            displayName: 'Money',
				            name: 'money',
				            values: [
					        {
						       displayName: 'Currency Code',
						       name: 'currencyCode',
						       type: 'string',
						       default: 'USD',
						       placeholder: 'USD',
					        },
					        {
					        	displayName: 'Cent Amount',
						        name: 'centAmount',
						        type: 'number',
						        default: 0,
						        description: 'Amount in cents',
					        },
				        ],
			        },
		        ],
		             description: 'Required when the Line Item uses ExternalPrice LineItemPriceMode',
		        },
		        {
		        displayName: 'External Tax Amount',
		        name: 'externalTaxAmount',
		        type: 'fixedCollection',
		        default: {},
		        typeOptions: {
			    multipleValues: false,
		        },
		          displayOptions: {
			          show: {
				         action: [
					        'setLineItemTaxAmount',
					        'setCustomLineItemTaxAmount',
					        'setShippingMethodTaxAmount',
				        ],
			        },
		        },
		            options: [
			           {
				           displayName: 'Tax Amount',
				           name: 'taxAmount',
				           values: [
					         {
						       displayName: 'Total Gross',
						       name: 'totalGross',
						       type: 'fixedCollection',
						       default: {},
						       options: [
							       {
								    displayName: 'Money',
								    name: 'money',
								    values: [
									      {
										   displayName: 'Currency Code',
										   name: 'currencyCode',
										   type: 'string',
										   default: 'EUR',
									    },
									    {
										   displayName: 'Cent Amount',
										   name: 'centAmount',
										   type: 'number',
										   default: 100,
									    },
								    ],
							    },
						    ],
					    },
					   {
						     displayName: 'Tax Rate',
						     name: 'taxRate',
						     type: 'fixedCollection',
						     default: {},
						     options: [
							    {
								   displayName: 'Tax Rate',
								   name: 'taxRate',
								   values: [
									    {
										    displayName: 'Name',
										    name: 'name',
										    type: 'string',
										    default: 'myTaxRate',
										    description: 'Name of the tax rate',
									    },
									    {
										   displayName: 'Amount',
										   name: 'amount',
										   type: 'number',
										   default: 0.19,
										    typeOptions: {
											  numberPrecision: 4,
											  minValue: 0,
											  maxValue: 1,
										    },
										     description: 'Tax rate as decimal (e.g., 0.19 for 19%)',
									    },
									    {
										    displayName: 'Country',
										    name: 'country',
										    type: 'string',
										    default: 'DE',
										    placeholder: 'DE',
									    },
								    ],
							    },
						    ],
					    },
				    ],
			    },
		    ],
		            description: 'Value to set. If empty, any existing value is removed.',
	                },
					{
						displayName: 'External Tax Portions',
						name: 'externalTaxPortions',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCartTotalTax'],
							},
						},
						description: 'Array of TaxPortionDraft. Set if the externalTotalGross price is a sum of portions with different tax rates.',
					},
					{
		            displayName: 'External Tax Rate',
		            name: 'externalTaxRate',
		            type: 'fixedCollection',
		            default: {},
		            typeOptions: {
			         multipleValues: false,
		            },
		             displayOptions: {
			        show: {
				       action: [
					     'setLineItemTaxRate',
					     'setCustomLineItemTaxRate',
					     'setShippingMethodTaxRate',
				        ],
			        },
		        },
		        options: [
			          {
				      displayName: 'Tax Rate',
				      name: 'taxRate',
				      values: [
					       {
						    displayName: 'Name',
						    name: 'name',
						    type: 'string',
						    default: '',
						    placeholder: 'myTaxRate',
						    description: 'Name of the tax rate',
					       },
					       {
						     displayName: 'Amount',
						     name: 'amount',
						     type: 'number',
						     default: 0.19,
						     typeOptions: {
							   numberPrecision: 4,
							    minValue: 0,
							    maxValue: 1,
						    },
						    description: 'Tax rate as decimal (e.g., 0.19 for 19%)',
					       },
					       {
						    displayName: 'Country',
						    name: 'country',
						    type: 'string',
						    default: 'DE',
						    placeholder: 'DE',
						    description: 'Country code for the tax rate',
					       },
					       {
						    displayName: 'State',
						    name: 'state',
						    type: 'string',
						    default: '',
						    placeholder: 'California',
						    description: 'State for the tax rate (optional)',
					       },
				        ],
			        },
		        ],
		         description: 'Value to set. If empty, any existing value is removed.',
	               },
					{
						displayName: 'External Tax Rate',
						name: 'customLineItemExternalTaxRate',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: false,
						},
						displayOptions: {
							show: {
								action: ['setCustomLineItemTaxRate'],
							},
						},
						options: [
							{
								displayName: 'Tax Rate',
								name: 'externalTaxRate',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
										placeholder: 'myTaxRate',
										description: 'Name of the tax rate',
									},
									{
										displayName: 'Amount',
										name: 'amount',
										type: 'number',
										default: 0.19,
										typeOptions: {
											numberPrecision: 4,
											minValue: 0,
											maxValue: 1,
										},
										description: 'Tax rate as decimal (e.g., 0.19 for 19%)',
									},
									{
										displayName: 'Country',
										name: 'country',
										type: 'string',
										default: 'DE',
										placeholder: 'DE',
										description: 'Country code for the tax rate',
									},
								],
							},
						],
						description: 'Value to set. If empty, any existing value is removed.',
					},
					{
						displayName: 'External Tax Rate',
						name: 'externalTaxRateCustomShipping',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod', 'setCustomShippingMethod'],
							},
						},
						description: 'External Tax Rate Draft for shipping expense taxation when Cart has External TaxMode as JSON string',
					},
					{
						displayName: 'External Tax Rate',
						name: 'externalTaxRate',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'ExternalTaxRateDraft as JSON string',
					},
					{
						displayName: 'External Total Gross',
						name: 'externalTotalGross',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setCartTotalTax'],
							},
						},
						options: [
							{
								displayName: 'Money',
								name: 'money',
									values:	[
											{
												displayName: 'Currency Code',
												name: 'currencyCode',
												type: 'string',
												default: '',
												placeholder: '',
											},
											{
												displayName: 'Cent Amount',
												name: 'centAmount',
												type: 'number',
												default: 0,
												placeholder: '',
												description: 'Money amount in cents',
											},
									]
							},
					],
						description: 'The total gross amount of the Cart, including tax',
					},
					
					{
		            displayName: 'External Total Price',
		            name: 'externalTotalPrice',
		            type: 'fixedCollection',
		            default: {},
		            typeOptions: {
			         multipleValues: false,
		           },
		            displayOptions: {
			       show: {
				      action: ['changeLineItemQuantity'],
			        },
		          },
		             options: [
		        	{
			        	displayName: 'External Total Price',
				        name: 'totalPrice',
				        values: [
					     {
						displayName: 'Price',
						name: 'price',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Money',
								name: 'money',
								values: [
									{
										displayName: 'Currency Code',
										name: 'currencyCode',
										type: 'string',
										default: 'USD',
									},
									{
										displayName: 'Cent Amount',
										name: 'centAmount',
										type: 'number',
										default: 0,
									},
								],
							},
						],
					},
					{
						displayName: 'Total Price',
						name: 'totalPrice',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Money',
								name: 'money',
								values: [
									{
										displayName: 'Currency Code',
										name: 'currencyCode',
										type: 'string',
										default: 'USD',
									},
									{
										displayName: 'Cent Amount',
										name: 'centAmount',
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
		description: 'Sets the LineItem price and totalPrice to the given value when changing the quantity',
	},
	{
		displayName: 'External Total Price',
		name: 'externalTotalPrice',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		displayOptions: {
			show: {
				action: ['setLineItemTotalPrice'],
			},
		},
		options: [
			{
				displayName: 'External Total Price',
				name: 'totalPrice',
				values: [
					{
						displayName: 'Price',
						name: 'price',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Money',
								name: 'money',
								values: [
									{
										displayName: 'Currency Code',
										name: 'currencyCode',
										type: 'string',
										default: 'EUR',
									},
									{
										displayName: 'Cent Amount',
										name: 'centAmount',
										type: 'number',
										default: 4200,
									},
								],
							},
						],
					},
					{
						displayName: 'Total Price',
						name: 'totalPrice',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Money',
								name: 'money',
								values: [
									{
										displayName: 'Currency Code',
										name: 'currencyCode',
										type: 'string',
										default: 'EUR',
									},
									{
										displayName: 'Cent Amount',
										name: 'centAmount',
										type: 'number',
										default: 4200,
									},
								],
							},
						],
					},
				],
			},
		],
		description: 'Value to set. If externalTotalPrice is not given and the priceMode is ExternalTotal, the external price is unset and the priceMode is set to Platform.',
	},
					{
						displayName: 'Fax',
						name: 'fax',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Fax number',
					},
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						
					},
					{
						displayName: 'Freeze Strategy',
						name: 'strategy',
						type: 'options',
						default: 'SoftFreeze',
						displayOptions: {
							show: {
								action: ['freezeCart'],
							},
						},
						options: [
							{
								name: 'SoftFreeze',
								value: 'SoftFreeze',
							},
							{
								name: 'HardFreeze',
								value: 'HardFreeze',
							},
						],
						description: 'Strategy that determines the freezing behavior',
					},
					{
						displayName: 'Inventory Mode',
						name: 'inventoryMode',
						type: 'options',
						default: 'None',
						options: [
							{
								name: 'None',
								value: 'None',
							},
							{
								name: 'TrackOnly',
								value: 'TrackOnly',
							},
							{
								name: 'ReserveOnOrder',
								value: 'ReserveOnOrder',
							},
						],
						displayOptions: {
							show: {
								action: ['setLineItemInventoryMode'],
							},
						},
						description: 'Inventory mode specific to the Line Item only. Set only if the inventory mode should be different from the inventoryMode specified on the Cart.',
					},
					{
						displayName: 'Key',
						name: 'addressKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Key for the address',
					},
					{
						displayName: 'Key',
						name: 'customLineItemKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['removeCustomLineItem'],
							},
						},
						description: 'User-defined unique identifier of the Custom Line Item',
					},
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setKey'],
							},
						},
						description: 'Value to set. If empty, any existing key will be removed.',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						
					},
					{
						displayName: 'Line Item Custom Type Selection',
						name: 'lineItemCustomTypeSelection',
						type: 'options',
						default: 'id',
						options: [
							{
								name: 'By ID',
								value: 'id',
							},
							{
								name: 'By Key',
								value: 'key',
							},
						],
						displayOptions: {
							show: {
								action: ['setLineItemCustomType', 'setCustomLineItemCustomType'],
							},
						},
						description: 'Choose whether to identify the Type by ID or Key',
					},
				{
		             displayName: 'Line Item ID',
		             name: 'lineItemId',
		             type: 'string',
		             default: '',
		             description: 'ID of the LineItem - Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		             displayOptions: {
			             show: {
				          action: ['changeLineItemQuantity','setLineItemDistributionChannel','setLineItemTotalPrice','setLineItemPrice','setLineItemTaxAmount','setLineItemTaxRate','setLineItemShippingDetails', 'applyDeltaToLineItemShippingDetailsTargets','setLineItemSupplyChannel','setLineItemInventoryMode','setLineItemCustomField','setLineItemCustomType','setLineItemRecurrenceInfo','removeLineItem'],
						  lineItemSelection: ['id'],
			            },
		            },
	                },
				   {
				  displayName: 'Line Item Key',
				  name: 'lineItemKey',
				  type: 'string',
				  default: '',
				  description: 'Key of the LineItem',
				  displayOptions: {
					  show: {
						action: ['changeLineItemQuantity','setLineItemTaxAmount','setLineItemPrice','setLineItemDistributionChannel','setLineItemTotalPrice','setLineItemTaxRate','setLineItemSupplyChannel','setLineItemShippingDetails','applyDeltaToLineItemShippingDetailsTargets','setLineItemRecurrenceInfo','setLineItemCustomField','setLineItemCustomType','setLineItemInventoryMode','removeLineItem'],
						lineItemSelection: ['key'],
					},
			   },
					},
				{
					displayName: 'Line Item Selection',
					name: 'lineItemSelection',
					type: 'options',
					default: 'id',
					options: [
						{
							name: 'By ID',
							value: 'id',
						},
						{
							name: 'By Key',
							value: 'key',
						},
					],
					displayOptions: {
						show: {
							action: ['changeLineItemQuantity','setLineItemDistributionChannel','setLineItemTotalPrice','setLineItemPrice','setLineItemTaxAmount','setLineItemTaxRate','setLineItemShippingDetails', 'applyDeltaToLineItemShippingDetailsTargets','setLineItemSupplyChannel','setLineItemInventoryMode','setLineItemCustomField','setLineItemCustomType','setLineItemRecurrenceInfo'],
						},
					},
				},
					
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						placeholder: 'de-DE',
						displayOptions: {
							show: {
								action: ['setLocale'],
							},
						},
						description: 'Value to set. Must be one of the Project\'s languages. If empty, any existing value will be removed.',
					},
					
					{
						displayName: 'Mobile',
						name: 'mobile',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Mobile phone number',
					},
					{
						displayName: 'Money',
						name: 'customLineItemMoney',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						required: true,
						displayOptions: {
							show: {
								action: ['addCustomLineItem', 'changeCustomLineItemMoney'],
							},
						},
						options: [
							{
								displayName: 'Money',
								name: 'money',
									values:	[
											{
												displayName: 'Currency Code',
												name: 'currencyCode',
												type: 'string',
												default: 'EUR',
												placeholder: '',
											},
											{
												displayName: 'Cent Amount',
												name: 'centAmount',
												type: 'number',
												default: 4200,
												placeholder: '',
												description: 'Money amount in cents',
											},
									]
							},
					],
						description: 'Money value of the Custom Line Item. The value can be negative.',
					},
					{
						displayName: 'Name',
						name: 'customLineItemName',
						type: 'string',
						default: '',
						placeholder: '',
						required: true,
						displayOptions: {
							show: {
								action: ['addCustomLineItem'],
							},
						},
						description: 'Name of the Custom Line Item as LocalizedString',
					},
					{
						displayName: 'P.O. Box',
						name: 'pOBox',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Post office box',
					},
					{
						displayName: 'Payment',
						name: 'payment',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addPayment'],
							},
						},
						options: [
							{
								displayName: 'Payment Reference',
								name: 'paymentReference',
									values:	[
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												placeholder: '',
												description: 'ID of the payment',
											},
											{
												displayName: 'Type ID',
												name: 'typeId',
												type: 'options',
												options: [
													{
														name: 'Payment',
														value: 'payment',
													},
													],
												default: 'payment',
												description: 'Type of the reference',
											},
									]
							},
					],
						description: 'Payment to add to the Cart. Must not be assigned to another Order or active Cart already.',
					},
					{
						displayName: 'Payment',
						name: 'removePayment',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['removePayment'],
							},
						},
						options: [
							{
								displayName: 'Payment Reference',
								name: 'paymentReference',
									values:	[
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												placeholder: '',
												description: 'ID of the payment',
											},
											{
												displayName: 'Type ID',
												name: 'typeId',
												type: 'options',
												options: [
													{
														name: 'Payment',
														value: 'payment',
													},
													],
												default: 'payment',
												description: 'Type of the reference',
											},
									]
							},
					],
						description: 'Payment to remove from the Cart',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Phone number',
					},
					{
						displayName: 'Postal Code',
						name: 'postalCode',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						
					},
					{
						displayName: 'Price Rounding Mode',
						name: 'priceRoundingMode',
						type: 'options',
						displayOptions: {
							show: {
								action: ['changePriceRoundingMode'],
							},
						},
						options: [
							{
								name: 'Half Down',
								value: 'HalfDown',
							},
							{
								name: 'Half Even',
								value: 'HalfEven',
							},
							{
								name: 'Half Up',
								value: 'HalfUp',
							},
					],
						default: 'HalfEven',
						description: 'New value to set',
					},
					{
						displayName: 'Purchase Order Number',
						name: 'purchaseOrderNumber',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setPurchaseOrderNumber'],
							},
						},
						description: 'Value to set. If empty, any existing value is removed.',
					},
					{
						displayName: 'Quantity',
						name: 'customLineItemQuantity',
						type: 'number',
						default: 1,
						displayOptions: {
							show: {
								action: ['addCustomLineItem', 'changeCustomLineItemQuantity'],
							},
						},
						description: 'Number of Custom Line Items to add or set. If 0, the Custom Line Item is removed from the Cart.',
					},
					{
		             displayName: 'Quantity',
		             name: 'quantity',
		             type: 'number',
		             default: 1,
		             typeOptions: {
			           minValue: 0,
		            },
		               displayOptions: {
			               show: {
				             action: ['changeLineItemQuantity'],
			                },
		            },
		              description: 'New value to set. If 0, the Line Item is removed from the Cart.',
	                },
	                 {
						displayName: 'Recurrence Info',
						name: 'recurrenceInfo',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: ['setLineItemRecurrenceInfo', 'setCustomLineItemRecurrenceInfo'],
							},
						},
						description: 'LineItemRecurrenceInfoDraft as JSON. Value to set. If empty, any existing value will be removed.',
					},
					{
						displayName: 'Region',
						name: 'region',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						
					},
					{
						displayName: 'Salutation',
						name: 'salutation',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						
					},
					{
						displayName: 'Set Delete Days After Last Modification',
						name: 'Set deleteDaysAfterLastModification',
						type: 'number',
						default: 90,
						displayOptions: {
							show: {
								action: ['setDeleteDaysAfterLastModification'],
							},
						},
						typeOptions: {
							minValue: 1,
							maxValue: 365250,
						},
						description: 'Value to set. If not provided, the default value for this field configured in Project settings is assigned.',
					},
					{
						displayName: 'Shipping Address',
						name: 'shippingAddress',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'BaseAddress as JSON string',
					},
					{
						displayName: 'Shipping Address',
						name: 'shippingAddressCustom',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod'],
							},
						},
						description: 'BaseAddress that determines shipping rate and Tax Rate of associated Line Items as JSON string',
					},
					{
						displayName: 'Shipping Custom Type ID',
						name: 'shippingCustomTypeId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setShippingCustomType'],
								shippingCustomTypeSelection: ['id'],
							},
						},
						description: 'ID of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Shipping Custom Type Key',
						name: 'shippingCustomTypeKey',
						type: 'string',
						default: '',
						placeholder: 'type-key',
						displayOptions: {
							show: {
								action: ['setShippingCustomType'],
								shippingCustomTypeSelection: ['key'],
							},
						},
						description: 'Key of the Type. Either Custom Type ID or Custom Type Key is required.',
					},
					{
						displayName: 'Shipping Custom Type Selection',
						name: 'shippingCustomTypeSelection',
						type: 'options',
						default: 'id',
						options: [
							{
								name: 'By ID',
								value: 'id',
							},
							{
								name: 'By Key',
								value: 'key',
							},
						],
						displayOptions: {
							show: {
								action: ['setShippingCustomType'],
							},
						},
						description: 'Choose whether to identify the Type by ID or Key',
					},
					
					
					{
						displayName: 'Shipping Details',
						name: 'shippingDetails',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								action: ['setLineItemShippingDetails', 'setCustomLineItemShippingDetails'],
							},
						},
						description: 'ItemShippingDetailsDraft as JSON. Value to set. If empty, the existing value is removed.',
					},
					{
						displayName: 'Shipping Key',
						name: 'shippingKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'User-defined identifier for the Shipping that must be unique across the Cart',
					},
					{
						displayName: 'Shipping Key',
						name: 'shippingKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['removeShippingMethod'],
							},
						},
						description: 'User-defined unique identifier of the Shipping Method to remove from the Cart',
					},
	                {
		            displayName: 'Shipping Key',
		            name: 'shippingKey',
		            type: 'string',
		            default: '',
		            placeholder: '',
		              displayOptions: {
			               show: {
				             action: [
					           'setLineItemTaxRate',
					           'setShippingMethodTaxRate',
					           'setShippingCustomType',
					           'setShippingCustomField',
				            ],
			            },
		            },
		              description: 'Key of the ShippingMethod used for this Line Item. This is required for Carts with Multiple ShippingMode.',
	                },
	                {
		            displayName: 'Shipping Key',
		            name: 'shippingKey',
		            type: 'string',
		            default: '',
		            placeholder: '',
		               displayOptions: {
			                 show: {
				                action: ['setLineItemTaxAmount', 'setCustomLineItemTaxAmount', 'setShippingMethodTaxAmount'],
			                },
		                },
		                   description: 'Key of the ShippingMethod used for this Line Item. This is required for Carts with Multiple ShippingMode.',
	                    },
					    {
						displayName: 'Shipping Key Custom',
						name: 'shippingKeyCustom',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod'],
							},
						},
						description: 'User-defined identifier for the custom Shipping Method that must be unique across the Cart',
					},
					{
						displayName: 'Shipping Method',
						name: 'shippingMethod',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setShippingMethod'],
							},
						},
						options: [
							{
								displayName: 'Shipping Method Reference',
								name: 'shippingMethodReference',
								values: [
									{
										displayName: 'ID',
										name: 'id',
										type: 'string',
										default: '',
										placeholder: '',
										description: 'ID of the shipping method',
									},
									{
										displayName: 'Type ID',
										name: 'typeId',
										type: 'options',
										options: [
											{
												name: 'Shipping Method',
												value: 'shipping-method',
											},
										],
										default: 'shipping-method',
										description: 'Type of the reference',
									},
								],
							},
						],
						description: 'Reference to the Shipping Method to set for the Cart',
					},
					{
						displayName: 'Shipping Method ID',
						name: 'shippingMethodId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
								shippingMethodSelection: ['id'],
							},
						},
						description: 'ID of the Shipping Method to add',
					},
					{
						displayName: 'Shipping Method Key',
						name: 'shippingMethodKey',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
								shippingMethodSelection: ['key'],
							},
						},
						description: 'Key of the Shipping Method to add (alternative to ID)',
					},
					{
						displayName: 'Shipping Method Name Custom',
						name: 'shippingMethodNameCustom',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod', 'setCustomShippingMethod'],
							},
						},
						description: 'Name of the custom Shipping Method',
					},
					{
						displayName: 'Shipping Method Selection',
						name: 'shippingMethodSelection',
						type: 'options',
						default: 'id',
						options: [
							{
								name: 'By ID',
								value: 'id',
							},
							{
								name: 'By Key',
								value: 'key',
							},
						],
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'Choose whether to identify the Shipping Method by ID or Key',
					},
					{
						displayName: 'Shipping Rate Custom',
						name: 'shippingRateCustom',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod', 'setCustomShippingMethod'],
							},
						},
						description: 'ShippingRateDraft that determines the shipping price as JSON string',
					},
					{
						displayName: 'Shipping Rate Input',
						name: 'shippingRateInput',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setShippingRateInput'],
							},
						},
						description: 'ShippingRateInputDraft as JSON string. Data type depends on shippingRateInputType.type configured in Project: CartClassification = ClassificationShippingRateInputDraft, CartScore = ScoreShippingRateInputDraft, CartValue = cannot be set.',
					},
					{
						displayName: 'Shipping Rate Input',
						name: 'shippingRateInput',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShippingMethod'],
							},
						},
						description: 'ShippingRateInputDraft as JSON string',
					},
					{
						displayName: 'Shipping Rate Input Custom',
						name: 'shippingRateInputCustom',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod'],
							},
						},
						description: 'ShippingRateInputDraft used to select a ShippingRatePriceTier as JSON string',
					},
					
					{
						displayName: 'Shopping List',
						name: 'shoppingList',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addShoppingList'],
							},
						},
						options: [
							{
								displayName: 'Shopping List Reference',
								name: 'shoppingListReference',
									values:	[
											{
												displayName: 'ID',
												name: 'id',
												type: 'string',
												default: '',
												placeholder: '',
												description: 'ID of the shopping list',
											},
											{
												displayName: 'Type ID',
												name: 'typeId',
												type: 'options',
												options: [
													{
														name: 'Shopping List',
														value: 'shopping-list',
													},
													],
												default: 'shopping-list',
												description: 'Type of the reference',
											},
									]
							},
					],
						description: 'Shopping List that contains the Line Items to be added',
					},
					{
						displayName: 'Slug',
						name: 'customLineItemSlug',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomLineItem'],
							},
						},
						description: 'User-defined identifier used in a deep-link URL for the Custom Line Item',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'State or province',
					},
					{
						displayName: 'Street Name',
						name: 'streetName',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
					},
					{
						displayName: 'Street Number',
						name: 'streetNumber',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress', 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
					},
					{
						displayName: 'Supply Channel ID',
						name: 'supplyChannelId',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setLineItemSupplyChannel'],
							},
						},
						description: 'ID of the Channel. If present, a Reference to the Channel is set for the LineItem specified by lineItemId. If not present, the current Channel is removed from the LineItem.',
					},
					{
						displayName: 'Targets Delta',
						name: 'targetsDelta',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['applyDeltaToLineItemShippingDetailsTargets', 'applyDeltaToCustomLineItemShippingDetailsTargets'],
							},
						},
						description: 'JSON string of ItemShippingTarget objects. Using positive or negative quantities increases or decreases the number of items shipped to an address.',
					},
					{
						displayName: 'Tax Calculation Mode',
						name: 'taxCalculationMode',
						type: 'options',
						displayOptions: {
							show: {
								action: ['changeTaxCalculationMode'],
							},
						},
						options: [
							{
								name: 'Line Item Level',
								value: 'LineItemLevel',
							},
							{
								name: 'Unit Price Level',
								value: 'UnitPriceLevel',
							},
					],
						default: 'LineItemLevel',
						description: 'New value to set',
					},
					{
						displayName: 'Tax Category',
						name: 'taxCategory',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomLineItem'],
							},
						},
						description: 'ID of the tax category for the Custom Line Item',
					},
					{
						displayName: 'Tax Category Custom',
						name: 'taxCategoryCustomShipping',
						type: 'fixedCollection',
						default: {},
						placeholder: '',
						displayOptions: {
							show: {
								action: ['addCustomShippingMethod', 'setCustomShippingMethod'],
							},
						},
						options: [
							{
								displayName: 'Tax Category Reference',
								name: 'taxCategoryReference',
								values: [
									{
										displayName: 'ID',
										name: 'id',
										type: 'string',
										default: '',
										placeholder: '',
										description: 'ID of the tax category',
									},
									{
										displayName: 'Type ID',
										name: 'typeId',
										type: 'options',
										options: [
											{
												name: 'Tax Category',
												value: 'tax-category',
											},
										],
										default: 'tax-category',
										description: 'Type of the reference',
									},
								],
							},
						],
						description: 'Tax Category used to determine shipping Tax Rate when Cart has Platform TaxMode',
					},
					{
						displayName: 'Tax Mode',
						name: 'taxMode',
						type: 'options',
						displayOptions: {
							show: {
								action: ['changeTaxMode'],
							},
						},
						options: [
							{
								name: 'Platform',
								value: 'Platform',
							},
							{
								name: 'External',
								value: 'External',
							},
							{
								name: 'External Amount',
								value: 'ExternalAmount',
							},
							{
								name: 'Disabled',
								value: 'Disabled',
							},
					],
						default: 'Platform',
						description: 'The new TaxMode',
					},
					{
						displayName: 'Tax Rounding Mode',
						name: 'taxRoundingMode',
						type: 'options',
						displayOptions: {
							show: {
								action: ['changeTaxRoundingMode'],
							},
						},
						options: [
							{
								name: 'Half Down',
								value: 'HalfDown',
							},
							{
								name: 'Half Even',
								value: 'HalfEven',
							},
							{
								name: 'Half Up',
								value: 'HalfUp',
							},
					],
						default: 'HalfEven',
						description: 'New value to set',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						placeholder: '',
						displayOptions: {
							show: {
								action: ['setBillingAddress', 'setShippingAddress'	, 'updateItemShippingAddress','addItemShippingAddress'],
							},
						},
						description: 'Address title',
					},
					{
						displayName: 'Update Product Data',
						name: 'updateProductData',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								action: ['recalculate'],
							},
						},
						description: 'Whether to update the Product data (such as name, variant, productType, and Product Attributes) of the Line Items. If false, only the Prices and TaxRates of the Line Items will be updated.',
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

export const cartUpdateActions: INodeProperties[] = [
	{
		displayName: 'Update Action',
		name: 'updateAction',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Add Custom Line Item',
				value: 'addCustomLineItem',
				description: 'Add a Custom Line Item to the Cart',
			},
			{
				name: 'Add Shopping List',
				value: 'addShoppingList',
				description: 'Adds all LineItems of a ShoppingList to the Cart',
			},
			{
				name: 'Change Price Rounding Mode',
				value: 'changePriceRoundingMode',
				description: 'Change the price rounding mode',
			},
			{
				name: 'Change Tax Mode',
				value: 'changeTaxMode',
				description: 'Change the TaxMode of the Cart',
			},
			{
				name: 'Change Tax Rounding Mode',
				value: 'changeTaxRoundingMode',
				description: 'Change the tax rounding mode',
			},
			{
				name: 'Remove Custom Line Item',
				value: 'removeCustomLineItem',
				description: 'Remove a Custom Line Item from the Cart',
			},
			{
				name: 'Set Anonymous ID',
				value: 'setAnonymousId',
				description: 'Set the anonymous ID for the cart',
			},
			{
				name: 'Set Business Unit',
				value: 'setBusinessUnit',
				description: 'Updates the Business Unit on the Cart',
			},
			{
				name: 'Set Cart Total Tax',
				value: 'setCartTotalTax',
				description: 'Set the total tax amount for the Cart',
			},
			{
				name: 'Set Customer Email',
				value: 'setCustomerEmail',
				description: 'Set the customer email for the cart',
			},
			{
				name: 'Set Customer Group',
				value: 'setCustomerGroup',
				description: 'Set the customer group for the cart',
			},
			{
				name: 'Set Customer ID',
				value: 'setCustomerId',
				description: 'Set the customer ID for the cart',
			},
			{
				name: 'Set Key',
				value: 'setKey',
				description: 'Set a key for the cart',
			},
			{
				name: 'Set Purchase Order Number',
				value: 'setPurchaseOrderNumber',
				description: 'Updates the purchase order number field',
			},
		],
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
			},
		},
		default: 'setKey',
	},
	// Add Custom Line Item action fields
	{
		displayName: 'Key',
		name: 'customLineItemKey',
		type: 'string',
		default: '',
		placeholder: 'customLineItemKey',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addCustomLineItem'],
			},
		},
		typeOptions: {
			minLength: 2,
			maxLength: 256,
		},
		description: 'User-defined unique identifier of the Custom Line Item',
	},
	{
		displayName: 'Money',
		name: 'customLineItemMoney',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Money',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addCustomLineItem'],
			},
		},
		options: [
			{
				displayName: 'Money',
				name: 'money',
				values: [
					{
						displayName: 'Currency Code',
						name: 'currencyCode',
						type: 'string',
						default: 'EUR',
						placeholder: '',
					},
					{
						displayName: 'Cent Amount',
						name: 'centAmount',
						type: 'number',
						default: 4200,
						placeholder: '',
						description: 'Money amount in cents',
					},
				],
			},
		],
		description: 'Money value of the Custom Line Item. The value can be negative.',
	},
	{
		displayName: 'Name',
		name: 'customLineItemName',
		type: 'string',
		default: '',
		placeholder: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addCustomLineItem'],
			},
		},
		description: 'Name of the Custom Line Item as LocalizedString',
	},
	{
		displayName: 'Quantity',
		name: 'customLineItemQuantity',
		type: 'number',
		default: 1,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addCustomLineItem'],
			},
		},
		description: 'Number of Custom Line Items to add to the Cart',
	},
	{
		displayName: 'Slug',
		name: 'customLineItemSlug',
		type: 'string',
		default: '',
		placeholder: 'mySlug',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addCustomLineItem'],
			},
		},
		description: 'User-defined identifier used in a deep-link URL for the Custom Line Item',
	},
	
	// Add Shopping List action fields
	{
		displayName: 'Shopping List',
		name: 'shoppingList',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Shopping List Reference',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addShoppingList'],
			},
		},
		options: [
			{
				displayName: 'Shopping List Reference',
				name: 'shoppingListReference',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						placeholder: '{{shopping-list-ID}}',
						description: 'ID of the shopping list',
					},
					{
						displayName: 'Type ID',
						name: 'typeId',
						type: 'options',
						options: [
							{
								name: 'Shopping List',
								value: 'shopping-list',
							},
						],
						default: 'shopping-list',
						description: 'Type of the reference',
					},
				],
			},
		],
		description: 'Shopping List that contains the Line Items to be added',
	},
	{
		displayName: 'Distribution Channel',
		name: 'distributionChannel',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Distribution Channel Reference',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addShoppingList'],
			},
		},
		options: [
			{
				displayName: 'Channel Reference',
				name: 'channelReference',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						placeholder: '{{channel-ID}}',
						description: 'ID of the channel',
					},
					{
						displayName: 'Type ID',
						name: 'typeId',
						type: 'options',
						options: [
							{
								name: 'Channel',
								value: 'channel',
							},
						],
						default: 'channel',
						description: 'Type of the reference',
					},
				],
			},
		],
		description: 'Distribution Channel to set for all LineItems that are added to the Cart',
	},
	{
		displayName: 'Supply Channel',
		name: 'supplyChannel',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Supply Channel Reference',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['addShoppingList'],
			},
		},
		options: [
			{
				displayName: 'Channel Reference',
				name: 'channelReference',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						placeholder: '{{channel-ID}}',
						description: 'ID of the channel',
					},
					{
						displayName: 'Type ID',
						name: 'typeId',
						type: 'options',
						options: [
							{
								name: 'Channel',
								value: 'channel',
							},
						],
						default: 'channel',
						description: 'Type of the reference',
					},
				],
			},
		],
		description: 'Supply Channel to set for all LineItems that are added to the Cart',
	},
	// Change Price Rounding Mode action fields
	{
		displayName: 'Price Rounding Mode',
		name: 'priceRoundingMode',
		type: 'options',
		options: [
			{
				name: 'Half Down',
				value: 'HalfDown',
			},
			{
				name: 'Half Even',
				value: 'HalfEven',
			},
			{
				name: 'Half Up',
				value: 'HalfUp',
			},
		],
		default: 'HalfEven',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['changePriceRoundingMode'],
			},
		},
		description: 'New value to set',
	},
	// Change Tax Mode action fields
	{
		displayName: 'Tax Mode',
		name: 'taxMode',
		type: 'options',
		options: [
			{
				name: 'Platform',
				value: 'Platform',
			},
			{
				name: 'External',
				value: 'External',
			},
			{
				name: 'External Amount',
				value: 'ExternalAmount',
			},
			{
				name: 'Disabled',
				value: 'Disabled',
			},
		],
		default: 'Platform',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['changeTaxMode'],
			},
		},
		description: 'The new TaxMode',
	},
	// Change Tax Rounding Mode action fields
	{
		displayName: 'Tax Rounding Mode',
		name: 'taxRoundingMode',
		type: 'options',
		options: [
			{
				name: 'Half Down',
				value: 'HalfDown',
			},
			{
				name: 'Half Even',
				value: 'HalfEven',
			},
			{
				name: 'Half Up',
				value: 'HalfUp',
			},
		],
		default: 'HalfEven',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['changeTaxRoundingMode'],
			},
		},
		description: 'New value to set',
	},
	// Remove Custom Line Item action fields
	{
		displayName: 'Custom Line Item ID',
		name: 'removeCustomLineItemId',
		type: 'string',
		default: '',
		placeholder: '{{customLineItemId}}',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['removeCustomLineItem'],
				removeCustomLineItemSelection: ['id'],
			},
		},
		description: 'ID of the CustomLineItem to update. Either customLineItemId or customLineItemKey is required.',
	},
	{
		displayName: 'Custom Line Item Key',
		name: 'removeCustomLineItemKey',
		type: 'string',
		default: '',
		placeholder: 'customLineItemKey',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['removeCustomLineItem'],
				removeCustomLineItemSelection: ['key'],
			},
		},
		description: 'Key of the CustomLineItem to update. Either customLineItemId or customLineItemKey is required.',
	},
	{
		displayName: 'Custom Line Item Selection',
		name: 'removeCustomLineItemSelection',
		type: 'options',
		default: 'id',
		options: [
			{
				name: 'By ID',
				value: 'id',
			},
			{
				name: 'By Key',
				value: 'key',
			},
		],
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['removeCustomLineItem'],
			},
		},
		description: 'Choose whether to identify the Custom Line Item by ID or Key',
	},
	// Set Cart Total Tax action fields
	{
		displayName: 'External Total Gross',
		name: 'externalTotalGross',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Money',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setCartTotalTax'],
			},
		},
		options: [
			{
				displayName: 'Money',
				name: 'money',
				values: [
					{
						displayName: 'Currency Code',
						name: 'currencyCode',
						type: 'string',
						default: 'EUR',
						placeholder: 'EUR',
					},
					{
						displayName: 'Cent Amount',
						name: 'centAmount',
						type: 'number',
						default: 10000,
						placeholder: '10000',
						description: 'Money amount in cents',
					},
				],
			},
		],
		description: 'The total gross amount of the Cart, including tax',
	},
	{
		displayName: 'External Tax Portions',
		name: 'externalTaxPortions',
		type: 'string',
		default: '',
		placeholder: '',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setCartTotalTax'],
			},
		},
		description: 'Array of TaxPortionDraft. Set if the externalTotalGross price is a sum of portions with different tax rates.',
	},
	// Set Anonymous ID action fields
	{
		displayName: 'Anonymous ID',
		name: 'anonymousId',
		type: 'string',
		default: '',
		placeholder: '',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setAnonymousId'],
			},
		},
		description: 'Value to set. If empty, any existing value is removed.',
	},
	// Set Business Unit action fields
	{
		displayName: 'Business Unit',
		name: 'businessUnit',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Business Unit Reference',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setBusinessUnit'],
			},
		},
		options: [
			{
				displayName: 'Business Unit Reference',
				name: 'businessUnitReference',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: '{{business-unit-key}}',
						description: 'Key of the business unit',
					},
					{
						displayName: 'Type ID',
						name: 'typeId',
						type: 'options',
						options: [
							{
								name: 'Business Unit',
								value: 'business-unit',
							},
						],
						default: 'business-unit',
						description: 'Type of the reference',
					},
				],
			},
		],
		description: 'New Business Unit to assign to the Cart, which must have access to the Store that is set on the Cart',
	},
	// Set Customer Email action fields
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'email@example.com',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setCustomerEmail'],
			},
		},
		description: 'Value to set. If empty, any existing value is removed.',
	},
	// Set Customer Group action fields
	{
		displayName: 'Customer Group',
		name: 'customerGroup',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: false,
		},
		placeholder: 'Add Customer Group Reference',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setCustomerGroup'],
			},
		},
		options: [
			{
				displayName: 'Customer Group Reference',
				name: 'customerGroupReference',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						placeholder: '{{customer-group-ID}}',
						description: 'ID of the customer group',
					},
					{
						displayName: 'Type ID',
						name: 'typeId',
						type: 'options',
						options: [
							{
								name: 'Customer Group',
								value: 'customer-group',
							},
						],
						default: 'customer-group',
						description: 'Type of the reference',
					},
				],
			},
		],
		description: 'Value to set. If empty, any existing value is removed.',
	},
	// Set Customer ID action fields
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		placeholder: '{{customer-ID}}',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setCustomerId'],
			},
		},
		description: 'ID of an existing Customer. If the Customer is assigned to a CustomerGroup, this update action also sets the value for the customerGroup field. If empty, the update action removes the value for both customerId and customerGroup.',
	},
	// Set Key action fields
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		placeholder: 'myNewKey',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setKey'],
			},
		},
		typeOptions: {
			minLength: 2,
			maxLength: 256,
		},
		description: 'Value to set. If empty, any existing key will be removed.',
	},
	// Set Purchase Order Number action fields
	{
		displayName: 'Purchase Order Number',
		name: 'purchaseOrderNumber',
		type: 'string',
		default: '',
		placeholder: 'purchaseOrderNumberString',
		displayOptions: {
			show: {
				resource: ['cart'],
				operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
				updateAction: ['setPurchaseOrderNumber'],
			},
		},
		description: 'Value to set. If empty, any existing value is removed.',
	},
	
];
