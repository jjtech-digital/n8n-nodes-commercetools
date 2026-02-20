import type { INodeProperties } from 'n8n-workflow';

export const orderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Check if Order Exists',
				value: 'head',
				action: 'Check if order exists by ID',
				description: 'Check whether an order exists by ID',
			},
			{
				name: 'Check if Order Exists By Order Number',
				value: 'headByOrderNumber',
				action: 'Check if order exists by order number',
				description: 'Check whether an order exists using order number',
			},
			{
				name: 'Check if Order Exists By Query',
				value: 'headByQuery',
				action: 'Check if any order matches the query',
				description: 'Send a HEAD request with query predicates to check for matches',
			},
			{
				name: 'Check if Order Exists in Store',
				value: 'headInStore',
				action: 'Check if order exists in store by ID',
				description: 'Check whether an order exists by ID in a specific store',
			},
			{
				name: 'Check if Order Exists in Store By Order Number',
				value: 'headInStoreByOrderNumber',
				action: 'Check if order exists in store by order number',
				description: 'Check whether an order exists by order number in a specific store',
			},
			{
				name: 'Check if Order Exists in Store By Query',
				value: 'headInStoreByQuery',
				action: 'Check if any order matches the query in store',
				description: 'Send a HEAD request with query predicates to check for matches in a specific store',
			},
			{
				name: 'Create Order by Import',
				value: 'createByImport',
				action: 'Create order by import',
				description: 'Import an order directly',
			},
			{
				name: 'Create Order From Cart',
				value: 'createFromCart',
				action: 'Create order from cart',
				description: 'Create an order from a cart',
			},
			{
				name: 'Create Order From Quote',
				value: 'createFromQuote',
				action: 'Create order from quote',
				description: 'Create an order from a quote',
			},
			{
				name: 'Create Order in Store From Cart',
				value: 'createInStoreFromCart',
				action: 'Create order in store from cart',
				description: 'Create an order from a cart in a specific store',
			},
			{
				name: 'Create Order in Store From Quote',
				value: 'createInStoreFromQuote',
				action: 'Create order in store from quote',
				description: 'Create an order from a quote in a specific store',
			},
			{
				name: 'Delete Order',
				value: 'delete',
				action: 'Delete order by ID',
				description: 'Delete an order by ID',
			},
			{
				name: 'Delete Order By Order Number',
				value: 'deleteByOrderNumber',
				action: 'Delete order by order number',
				description: 'Delete an order by order number',
			},
			{
				name: 'Delete Order in Store',
				value: 'deleteInStore',
				action: 'Delete order in store by ID',
				description: 'Delete an order by ID in a specific store',
			},
			{
				name: 'Delete Order in Store By Order Number',
				value: 'deleteInStoreByOrderNumber',
				action: 'Delete order in store by order number',
				description: 'Delete an order by order number in a specific store',
			},
			{
				name: 'Get Order',
				value: 'get',
				action: 'Get order by ID',
				description: 'Retrieve an order by ID',
			},
			{
				name: 'Get Order By Order Number',
				value: 'getByOrderNumber',
				action: 'Get order by order number',
				description: 'Retrieve an order by order number',
			},
			{
				name: 'Get Order in Store',
				value: 'getInStore',
				action: 'Get order in store by ID',
				description: 'Retrieve an order by ID in a specific store',
			},
			{
				name: 'Get Order in Store By Order Number',
				value: 'getInStoreByOrderNumber',
				action: 'Get order in store by order number',
				description: 'Retrieve an order by order number in a specific store',
			},
			{
				name: 'Query Orders',
				value: 'query',
				action: 'Query orders',
				description: 'Query orders with optional filters',
			},
			{
				name: 'Query Orders in Store',
				value: 'queryInStore',
				action: 'Query orders in store',
				description: 'Query orders in a specific store with optional filters',
			},
			{
				name: 'Update Order',
				value: 'update',
				action: 'Update order by ID',
				description: 'Update an order by ID',
			},
			{
				name: 'Update Order By Order Number',
				value: 'updateByOrderNumber',
				action: 'Update order by order number',
				description: 'Update an order by order number',
			},
			{
				name: 'Update Order in Store',
				value: 'updateInStore',
				action: 'Update order in store by ID',
				description: 'Update an order by ID in a specific store',
			},
			{
				name: 'Update Order in Store By Order Number',
				value: 'updateInStoreByOrderNumber',
				action: 'Update order in store by order number',
				description: 'Update an order by order number in a specific store',
			},
		],
		default: 'get',
		displayOptions: {
			show: {
				resource: ['order'],
			},
		},
	},
];

export const orderIdentificationFields: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '',
		description: 'The ID of the order',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'get',
					'head',
					'update',
					'delete',
					'getInStore',
					'headInStore',
					'updateInStore',
					'deleteInStore',
				],
			},
		},
	},
	{
		displayName: 'Order Number',
		name: 'orderNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'getByOrderNumber',
					'headByOrderNumber',
					'updateByOrderNumber',
					'deleteByOrderNumber',
					'getInStoreByOrderNumber',
					'headInStoreByOrderNumber',
					'updateInStoreByOrderNumber',
					'deleteInStoreByOrderNumber',
				],
			},
		},
	},
	{
		displayName: 'Store Key',
		name: 'storeKey',
		type: 'string',
		required: true,
		default: '',
		placeholder: '',
		description: 'The key of the store',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'getInStore',
					'getInStoreByOrderNumber',
					'headInStore',
					'headInStoreByOrderNumber',
					'headInStoreByQuery',
					'queryInStore',
					'createInStoreFromCart',
					'createInStoreFromQuote',
					'updateInStore',
					'updateInStoreByOrderNumber',
					'deleteInStore',
					'deleteInStoreByOrderNumber',
				],
			},
		},
	},
	{
		displayName: 'Cart ID',
		name: 'cartId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '',
		description: 'The ID of the cart to create order from',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['createFromCart', 'createInStoreFromCart'],
			},
		},
	},
	{
		displayName: 'Quote ID',
		name: 'quoteId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '',
		description: 'The ID of the quote to create order from',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['createFromQuote', 'createInStoreFromQuote'],
			},
		},
	},
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		description: 'The version of the resource being modified',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'update',
					'updateByOrderNumber',
					'updateInStore',
					'updateInStoreByOrderNumber',
					'delete',
					'deleteByOrderNumber',
					'deleteInStore',
					'deleteInStoreByOrderNumber',
					'createFromCart',
					'createFromQuote',
					'createInStoreFromCart',
					'createInStoreFromQuote',
				],
			},
		},
	},
];

export const orderDraftFields: INodeProperties[] = [
	{
		displayName: 'Order Import Draft (JSON)',
		name: 'orderImportDraft',
		type: 'json',
		default: '{}',
		description: 'Complete order import draft as JSON. See <a href="https://docs.commercetools.com/api/projects/orders#orderimportdraft" target="_blank">OrderImportDraft documentation</a> for structure.',
		placeholder: `{ }`,
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['createByImport'],
			},
		},
	},
	{
		displayName: 'Order Draft',
		name: 'orderDraft',
		placeholder: 'Add Order Draft',
		type: 'fixedCollection',
		default: {},
		description: 'Order draft fields for creation',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'createFromCart',
					'createFromQuote',
					'createInStoreFromCart',
					'createInStoreFromQuote',
				],
			},
		},
		options: [
			{
				name: 'orderDraftFields',
				displayName: 'Order Draft Fields',
				values: [
					{
						displayName: 'Anonymous ID',
						name: 'anonymousId',
						type: 'string',
						default: '',
						description: 'Identifies orders and carts that belong to an anonymous session',
					},
					{
						displayName: 'Billing Address',
						name: 'billingAddress',
						type: 'json',
						default: 'undefined',
						description: 'The billing address for the order',
					},
					{
						displayName: 'Business Unit',
						name: 'businessUnit',
						type: 'json',
						default: 'undefined',
						description: 'The business unit this order belongs to',
					},
					{
						displayName: 'Custom',
						name: 'custom',
						type: 'json',
						default: 'undefined',
						description: 'Custom fields for the order',
					},
					{
						displayName: 'Customer Email',
						name: 'customerEmail',
						type: 'string',
						default: '',
						description: 'Email address of the customer',
					},
					{
						displayName: 'Customer Group',
						name: 'customerGroup',
						type: 'json',
						default: 'undefined',
						description: 'Set when the customer is set and the customer is a member of a customer group',
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'ID of the customer that this order belongs to',
					},
					{
						displayName: 'Inventory Mode',
						name: 'inventoryMode',
						type: 'options',
						options: [
							{ name: 'None', value: 'None' },
							{ name: 'Track Only', value: 'TrackOnly' },
							{ name: 'Reserve on Stock', value: 'ReserveOnStock' },
						],
						default: 'None',
						description: 'Inventory mode for the order',
					},
					{
						displayName: 'Item Shipping Addresses',
						name: 'itemShippingAddresses',
						type: 'json',
						default: [],
						description: 'The item shipping addresses for the order',
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						description: 'String that uniquely identifies the order locale',
					},
					{
						displayName: 'Order Number',
						name: 'orderNumber',
						type: 'string',
						default: '',
						description: 'User-specific unique identifier for the order',
					},
					{
						displayName: 'Origin',
						name: 'origin',
						type: 'options',
						options: [
							{ name: 'Customer', value: 'Customer' },
							{ name: 'Merchant', value: 'Merchant' },
							{ name: 'Quote', value: 'Quote' },
						],
						default: 'Customer',
						description: 'Origin of the order',
					},
					{
						displayName: 'Payment Info',
						name: 'paymentInfo',
						type: 'json',
						default: 'undefined',
						description: 'The payment information for the order',
					},
					{
						displayName: 'Purchase Order Number',
						name: 'purchaseOrderNumber',
						type: 'string',
						default: '',
						description: 'The Purchase Order Number is typically set by the buyer on a B2B order',
					},
					{
						displayName: 'Shipping Address',
						name: 'shippingAddress',
						type: 'json',
						default: 'undefined',
						description: 'The shipping address for the order',
					},
					{
						displayName: 'Shipping Info',
						name: 'shippingInfo',
						type: 'json',
						default: 'undefined',
						description: 'Set when the shipping method is set',
					},
					{
						displayName: 'Store',
						name: 'store',
						type: 'json',
						default: 'undefined',
						description: 'The store this order belongs to',
					},
					{
						displayName: 'Tax Calculation Mode',
						name: 'taxCalculationMode',
						type: 'options',
						options: [
							{ name: 'Line Item Level', value: 'LineItemLevel' },
							{ name: 'Unit Price Level', value: 'UnitPriceLevel' },
						],
						default: 'LineItemLevel',
						description: 'Tax calculation mode for the order',
					},
					{
						displayName: 'Tax Mode',
						name: 'taxMode',
						type: 'options',
						options: [
							{ name: 'Platform', value: 'Platform' },
							{ name: 'External', value: 'External' },
							{ name: 'External Amount', value: 'ExternalAmount' },
							{ name: 'Disabled', value: 'Disabled' },
						],
						default: 'Platform',
						description: 'Tax mode for the order',
					},
					{
						displayName: 'Tax Rounding Mode',
						name: 'taxRoundingMode',
						type: 'options',
						options: [
							{ name: 'Half Even', value: 'HalfEven' },
							{ name: 'Half Up', value: 'HalfUp' },
							{ name: 'Half Down', value: 'HalfDown' },
						],
						default: 'HalfEven',
						description: 'Tax rounding mode for the order',
					},
				],
			},
		],
	},
];

export const orderAdditionalFields: INodeProperties[] = [
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsGet',
		type: 'collection',
		placeholder: 'Add Additional Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['get', 'getByOrderNumber', 'getInStore', 'getInStoreByOrderNumber'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion for the request',
			},
			{
				displayName: 'Locale Projection',
				name: 'localeProjection',
				type: 'string',
				default: '',
				description: 'String that uniquely identifies the locale',
			},
			{
				displayName: 'Price Channel',
				name: 'priceChannel',
				type: 'string',
				default: '',
				description: 'ID of the channel',
			},
			{
				displayName: 'Price Country',
				name: 'priceCountry',
				type: 'string',
				default: '',
				description: 'A two-digit country code as per ISO 3166-1 alpha-2',
			},
			{
				displayName: 'Price Customer Group',
				name: 'priceCustomerGroup',
				type: 'string',
				default: '',
				description: 'ID of the customer group',
			},
			{
				displayName: 'Projection',
				name: 'priceCurrency',
				type: 'string',
				default: '',
				description: 'The currency code compliant to ISO 4217',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsQuery',
		type: 'collection',
		placeholder: 'Add Additional Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['query', 'queryInStore'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion for the request',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 500 },
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Locale Projection',
				name: 'localeProjection',
				type: 'string',
				default: '',
				description: 'String that uniquely identifies the locale',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Number of results to skip',
			},
			{
				displayName: 'Price Channel',
				name: 'priceChannel',
				type: 'string',
				default: '',
				description: 'ID of the channel',
			},
			{
				displayName: 'Price Country',
				name: 'priceCountry',
				type: 'string',
				default: '',
				description: 'A two-digit country code as per ISO 3166-1 alpha-2',
			},
			{
				displayName: 'Price Customer Group',
				name: 'priceCustomerGroup',
				type: 'string',
				default: '',
				description: 'ID of the customer group',
			},
			{
				displayName: 'Projection',
				name: 'priceCurrency',
				type: 'string',
				default: '',
				description: 'The currency code compliant to ISO 4217',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '',
				description: 'Sort the results by the given field',
			},
			{
				displayName: 'Where',
				name: 'where',
				type: 'string',
				default: '',
				description: 'Query predicate to filter the results',
			},
			{
				displayName: 'With Total',
				name: 'withTotal',
				type: 'boolean',
				default: true,
				description: 'Whether to include the total count of matching results',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsHead',
		type: 'collection',
		placeholder: 'Add Additional Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'head',
					'headByOrderNumber',
					'headByQuery',
					'headInStore',
					'headInStoreByOrderNumber',
					'headInStoreByQuery',
				],
			},
		},
		options: [
			{
				displayName: 'Where',
				name: 'where',
				type: 'string',
				default: '',
				description: 'Query predicate to filter the results',
				displayOptions: {
					show: {
						'/operation': ['headByQuery', 'headInStoreByQuery'],
					},
				},
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFieldsUpdate',
		type: 'collection',
		placeholder: 'Add Additional Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'update',
					'updateByOrderNumber',
					'updateInStore',
					'updateInStoreByOrderNumber',
				],
			},
		},
		options: [
			{
				displayName: 'Actions (JSON)',
				name: 'actions',
				type: 'json',
				default: '[]',
				description: 'Update actions as JSON array',
				placeholder: '',
			},
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'string',
				default: '',
				description: 'Reference expansion for the request',
			},
		],
	},
];

export const orderUpdateActions: INodeProperties[] = [
	{
		displayName: 'Actions (UI)',
		name: 'updateActions',
		placeholder: 'Add Action',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		description: 'Update actions for the order',
		default: {},
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'update',
					'updateByOrderNumber',
					'updateInStore',
					'updateInStoreByOrderNumber',
				],
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
						default: 'setOrderNumber',
						options: [
							{
								name: 'Add Delivery',
								value: 'addDelivery',
							},
							{
								name: 'Add Item Shipping Address',
								value: 'addItemShippingAddress',
							},
							{
								name: 'Add Payment',
								value: 'addPayment',
							},
							{
                                name: 'Change Payment State',
                                value: 'changePaymentState',
                            },
							{
								name: 'Remove Delivery',
								value: 'removeDelivery',
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
                               name: 'Set Billing Address',
                               value: 'setBillingAddress',
                            },
							{
								name: 'Set Business Unit',
								value: 'setBusinessUnit',
							},
							{
								name: 'Set Customer Email',
								value: 'setCustomerEmail',
							},
							{
								name: 'Set Customer ID',
								value: 'setCustomerId',
							},
							{
								name: 'Set Order Number',
								value: 'setOrderNumber',
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
								name: 'Update Item Shipping Address',
								value: 'updateItemShippingAddress',
							},
						],
					},
					
					{
                      displayName: 'Additional Address Info',
                      name: 'billingAddress_additionalAddressInfo',
                      type: 'string',
                      default: '',
                      description: 'Additional address information',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
					
                    {
                      displayName: 'Additional Street Info',
                      name: 'billingAddress_additionalStreetInfo',
                      type: 'string',
                      default: '',
                      description: 'Additional street information (e.g. "Backhouse")',
                      displayOptions: { 
						  show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
					{
						displayName: 'Address Key',
						name: 'addressKey',
                        type: 'string',
                        required: true,
                        default: '',
                        description: 'The key of the address to remove from itemShippingAddresses',
                        displayOptions: {
                             show: {
                                action: ['removeItemShippingAddress'],
                            },
                        },
                    },
                    {
                      displayName: 'Apartment',
                      name: 'billingAddress_apartment',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
					
                    {
                      displayName: 'Building',
                      name: 'billingAddress_building',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							  action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
					
					{
						displayName: 'Business Unit ID',
						name: 'businessUnitId',
						type: 'string',
						default: '',
						description: 'ID of the Business Unit to assign to the Order',
						displayOptions: {
							show: {
								action: ['setBusinessUnit'],
								businessUnitIdentifyBy: ['id'],
							},
						},
					},
					{
						displayName: 'Business Unit Key',
						name: 'businessUnitKey',
						type: 'string',
						default: '',
						description: 'Key of the Business Unit to assign to the Order',
						displayOptions: {
							show: {
								action: ['setBusinessUnit'],
								businessUnitIdentifyBy: ['key'],
							},
						},
					},
					{
                        displayName: 'City',
                        name: 'billingAddress_city',
                        type: 'string',
                        default: '',
                        displayOptions: { 
							show: { 
								action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                        displayName: 'Company',
                        name: 'billingAddress_company',
                        type: 'string',
                        default: '',
                        displayOptions: { 
							show: { 
								action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                        displayName: 'Country',
                        name: 'billingAddress_country',
                        type: 'string',
                        default: '',
                        description: 'Two-letter ISO 3166-1 alpha-2 country code (e.g. "DE", "US")',
                        displayOptions: { 
							show: { 
								action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
					{
						displayName: 'Customer Email',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: 'name@email.com',
						description: 'Value to set. If empty, any existing value is removed.',
						displayOptions: {
							show: {
								action: ['setCustomerEmail'],
							},
						},
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'ID of an existing Customer. If empty, any existing value is removed.',
						displayOptions: {
							show: {
								action: ['setCustomerId'],
							},
						},
					},
					{
						displayName: 'Delivery ID',
						name: 'deliveryId',
						type: 'string',
						default: '',
						description: 'ID of the Delivery to remove',
						displayOptions: {
							show: {
								action: ['removeDelivery'],
								deliveryIdentifyBy: ['id'],
							},
						},
					},
					{
						displayName: 'Delivery Items',
						name: 'deliveryItems',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						placeholder: 'Add Item',
						displayOptions: {
							show: {
								action: ['addDelivery'],
							},
						},
						options: [
							{
								displayName: 'Item',
								name: 'item',
								values: [
									{
										displayName: 'Line Item ID',
										name: 'lineItemId',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Quantity',
										name: 'quantity',
										type: 'number',
										default: 1,
									},
								],
							},
						],
						description: 'Line items to include in the Delivery',
					},
					{
						displayName: 'Delivery Key',
						name: 'deliveryKey',
						type: 'string',
						default: '',
						description: 'Key of the Delivery to remove',
						displayOptions: {
							show: {
								action: ['removeDelivery'],
								deliveryIdentifyBy: ['key'],
							},
						},
					},
					{
						displayName: 'Delivery Parcels',
						name: 'deliveryParcels',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						placeholder: 'Add Parcel',
						displayOptions: {
							show: {
								action: ['addDelivery'],
							},
						},
						options: [
							{
								displayName: 'Parcel',
								name: 'parcel',
								values: [
									{
										displayName: 'Carrier',
										name: 'carrier',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Height In Millimeter',
										name: 'heightInMillimeter',
										type: 'number',
										default: 0,
									},
									{
										displayName: 'Is Return',
										name: 'isReturn',
										type: 'boolean',
										default: false,
									},
									{
										displayName: 'Provider',
										name: 'provider',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Provider Transaction',
										name: 'providerTransaction',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Tracking ID',
										name: 'trackingId',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Width In Millimeter',
										name: 'widthInMillimeter',
										type: 'number',
										default: 0,
									},
								],
							},
						],
						description: 'Parcels for the Delivery',
					},
					{
                      displayName: 'Department',
                      name: 'billingAddress_department',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
                    {
                      displayName: 'Email',
                      name: 'billingAddress_email',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
                    {
                      displayName: 'External ID',
                      name: 'billingAddress_externalId',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
                    {
                      displayName: 'Fax',
                      name: 'billingAddress_fax',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
                    {
                      displayName: 'First Name',
                      name: 'billingAddress_firstName',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
					{
						displayName: 'Identify Business Unit By',
						name: 'businessUnitIdentifyBy',
						type: 'options',
						options: [
							{
								name: 'Key',
								value: 'key',
							},
							{
								name: 'ID',
								value: 'id',
							},
						],
						default: 'key',
						description: 'Whether to identify the Business Unit by key or ID',
						displayOptions: {
							show: {
								action: ['setBusinessUnit'],
							},
						},
					},
					{
						displayName: 'Identify Delivery By',
						name: 'deliveryIdentifyBy',
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
						description: 'Whether to identify the Delivery by ID or key',
						displayOptions: {
							show: {
								action: ['removeDelivery'],
							},
						},
					},
					{
						displayName: 'Identify Payment By',
						name: 'paymentIdentifyBy',
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
						description: 'Whether to identify the Payment by ID or key',
						displayOptions: {
							show: {
								action: ['addPayment','removePayment'],
							},
						},
					},
					{
                      displayName: 'Key',
                      name: 'billingAddress_key',
                      type: 'string',
                      default: '',
                      description: 'User-defined unique identifier for the address',
                      displayOptions: { 
						    show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						   } 
					    },
                    },
                    {
                      displayName: 'Last Name',
                      name: 'billingAddress_lastName',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                      displayName: 'Mobile',
                      name: 'billingAddress_mobile',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
					{
						displayName: 'Order Number',
						name: 'orderNumber',
						type: 'string',
						default: '',
						description: 'Value to set. Must be unique across a Project. Once set, the value cannot be changed.',
						displayOptions: {
							show: {
								action: ['setOrderNumber'],
							},
						},
					},
                    {
						displayName: 'Payment ID',
						name: 'paymentId',
						type: 'string',
						default: '',
						description: 'ID of the Payment to add to the Order. Must not be assigned to another Order or active Cart.',
						displayOptions: {
							show: {
								action: ['addPayment','removePayment'],
								paymentIdentifyBy: ['id'],
							},
						},
					},
					{
						displayName: 'Payment Key',
						name: 'paymentKey',
						type: 'string',
						default: '',
						description: 'Key of the Payment to add to the Order. Must not be assigned to another Order or active Cart.',
						displayOptions: {
							show: {
								action: ['addPayment','removePayment'],
								paymentIdentifyBy: ['key'],
							},
						},
					},
					{
                      displayName: 'Payment State',
                      name: 'paymentState',
                      type: 'options',
                      required: true,
                      options: [
                            {
                              name: 'Balance Due',
                              value: 'BalanceDue',
                              description: 'Payment balance is due for the Order',
                            },
                            {
                             name: 'Credit Owed',
                             value: 'CreditOwed',
                             description: 'Payment for the Order is made on a credit basis',
                            },
                            {
                             name: 'Failed',
                             value: 'Failed',
                             description: 'Payment for the Order has failed',
                            },
                            {
                             name: 'Paid',
                             value: 'Paid',
                             description: 'The Order is paid for',
                            },
                            {
                             name: 'Pending',
                             value: 'Pending',
                             description: 'Payment for the Order is pending',
                            },
                        ],
                        default: 'Pending',
                        description: 'New payment status of the Order',
                        displayOptions: {
                            show: {
                               action: ['changePaymentState'],
                            },
                        },
                    },
                    {
                      displayName: 'Phone',
                      name: 'billingAddress_phone',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						    show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
                    {
                      displayName: 'PO Box',
                      name: 'billingAddress_pOBox',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						    show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
                    {
                      displayName: 'Postal Code',
                      name: 'billingAddress_postalCode',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						    show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
						    } 
					    },
                    },
					{
						displayName: 'Purchase Order Number',
						name: 'purchaseOrderNumber',
						type: 'string',
						default: '',
						description: 'Value to set. If empty, any existing value is removed.',
						displayOptions: {
							show: {
								action: ['setPurchaseOrderNumber'],
							},
						},
					},
					{
                      displayName: 'Region',
                      name: 'billingAddress_region',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                      displayName: 'Salutation',
                      name: 'billingAddress_salutation',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                      displayName: 'State',
                      name: 'billingAddress_state',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                      displayName: 'Street Name',
                      name: 'billingAddress_streetName',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                      displayName: 'Street Number',
                      name: 'billingAddress_streetNumber',
                      type: 'string',
                      default: '',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
                    {
                      displayName: 'Title',
                      name: 'billingAddress_title',
                      type: 'string',
                      default: '',
                      description: 'Title of the contact (e.g. "Mr.", "Ms.")',
                      displayOptions: { 
						   show: { 
							 action: ['setBillingAddress','setShippingAddress','addItemShippingAddress','updateItemShippingAddress','addDelivery'] 
							} 
						},
                    },
	
				],
			},
		],
	},
];
