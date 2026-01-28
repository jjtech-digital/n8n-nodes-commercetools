import { INodeProperties } from "n8n-workflow";

// Customer Events
export const customerEvents = [
    {
        name: 'Customer Created',
        value: 'CustomerCreated',
        description: 'Triggered when a new customer is created',
    },
    {
        name: 'Customer Deleted',
        value: 'CustomerDeleted',
        description: 'Triggered when a customer is deleted',
    },
    {
        name: 'Customer Email Changed',
        value: 'CustomerEmailChanged',
        description: 'Triggered when a customer email is changed',
    },
    {
        name: 'Customer Email Verified',
        value: 'CustomerEmailVerified',
        description: 'Triggered when a customer email is verified',
    },
    {
        name: 'Customer First Name Set',
        value: 'CustomerFirstNameSet',
        description: 'Triggered when a customer first name is set',
    },
    {
        name: 'Customer Last Name Set',
        value: 'CustomerLastNameSet',
        description: 'Triggered when a customer last name is set',
    },
    {
        name: 'Customer Company Name Set',
        value: 'CustomerCompanyNameSet',
        description: 'Triggered when a customer company name is set',
    },
    {
        name: 'Customer Title Set',
        value: 'CustomerTitleSet',
        description: 'Triggered when a customer title is set',
    },
    {
        name: 'Customer Date Of Birth Set',
        value: 'CustomerDateOfBirthSet',
        description: 'Triggered when a customer date of birth is set',
    },
    {
        name: 'Customer Password Updated',
        value: 'CustomerPasswordUpdated',
        description: 'Triggered when a customer password is updated',
    },
    {
        name: 'Customer External ID Set',
        value: 'CustomerExternalIdSet',
        description: 'Triggered when a customer external ID is set',
    },
    {
        name: 'Customer Group Set',
        value: 'CustomerGroupSet',
        description: 'Triggered when a customer is assigned to a group',
    },
    {
        name: 'Customer Stores Set',
        value: 'CustomerStoresSet',
        description: 'Triggered when customer stores are set',
    },
    {
        name: 'Customer Address Added',
        value: 'CustomerAddressAdded',
        description: 'Triggered when a new address is added to a customer',
    },
    {
        name: 'Customer Address Changed',
        value: 'CustomerAddressChanged',
        description: 'Triggered when a customer address is changed',
    },
    {
        name: 'Customer Address Removed',
        value: 'CustomerAddressRemoved',
        description: 'Triggered when a customer address is removed',
    },
    {
        name: 'Customer Billing Address Added',
        value: 'CustomerBillingAddressAdded',
        description: 'Triggered when a billing address is added to a customer',
    },
    {
        name: 'Customer Billing Address Removed',
        value: 'CustomerBillingAddressRemoved',
        description: 'Triggered when a billing address is removed from a customer',
    },
    {
        name: 'Customer Shipping Address Added',
        value: 'CustomerShippingAddressAdded',
        description: 'Triggered when a shipping address is added to a customer',
    },
    {
        name: 'Customer Shipping Address Removed',
        value: 'CustomerShippingAddressRemoved',
        description: 'Triggered when a shipping address is removed from a customer',
    },
    {
        name: 'Customer Default Billing Address Set',
        value: 'CustomerDefaultBillingAddressSet',
        description: 'Triggered when a default billing address is set for a customer',
    },
    {
        name: 'Customer Default Shipping Address Set',
        value: 'CustomerDefaultShippingAddressSet',
        description: 'Triggered when a default shipping address is set for a customer',
    },
    {
        name: 'Customer Custom Field Added',
        value: 'CustomerCustomFieldAdded',
        description: 'Triggered when a custom field is added to a customer',
    },
    {
        name: 'Customer Custom Field Changed',
        value: 'CustomerCustomFieldChanged',
        description: 'Triggered when a customer custom field is changed',
    },
    {
        name: 'Customer Custom Field Removed',
        value: 'CustomerCustomFieldRemoved',
        description: 'Triggered when a customer custom field is removed',
    },
    {
        name: 'Customer Custom Type Set',
        value: 'CustomerCustomTypeSet',
        description: 'Triggered when a custom type is set for a customer',
    },
    {
        name: 'Customer Custom Type Removed',
        value: 'CustomerCustomTypeRemoved',
        description: 'Triggered when a custom type is removed from a customer',
    },
    {
        name: 'Customer Address Custom Field Added',
        value: 'CustomerAddressCustomFieldAdded',
        description: 'Triggered when a custom field is added to a customer address',
    },
    {
        name: 'Customer Address Custom Field Changed',
        value: 'CustomerAddressCustomFieldChanged',
        description: 'Triggered when a customer address custom field is changed',
    },
    {
        name: 'Customer Address Custom Field Removed',
        value: 'CustomerAddressCustomFieldRemoved',
        description: 'Triggered when a customer address custom field is removed',
    },
    {
        name: 'Customer Address Custom Type Set',
        value: 'CustomerAddressCustomTypeSet',
        description: 'Triggered when a custom type is set for a customer address',
    },
    {
        name: 'Customer Address Custom Type Removed',
        value: 'CustomerAddressCustomTypeRemoved',
        description: 'Triggered when a custom type is removed from a customer address',
    },
];

// Product Events
export const productEvents = [
    {
        name: 'Product Created',
        value: 'ProductCreated',
        description: 'Triggered when a new product is created',
    },
    {
        name: 'Product Deleted',
        value: 'ProductDeleted',
        description: 'Triggered when a product is deleted',
    },
    {
        name: 'Product Published',
        value: 'ProductPublished',
        description: 'Triggered when a product is published',
    },
    {
        name: 'Product Unpublished',
        value: 'ProductUnpublished',
        description: 'Triggered when a product is unpublished',
    },
    {
        name: 'Product Slug Changed',
        value: 'ProductSlugChanged',
        description: 'Triggered when a product slug is updated',
    },
    {
        name: 'Product State Transition',
        value: 'ProductStateTransition',
        description: 'Triggered when a product state transitions',
    },
    {
        name: 'Product Reverted Staged Changes',
        value: 'ProductRevertedStagedChanges',
        description: 'Triggered when product staged changes are reverted',
    },
    {
        name: 'Product Image Added',
        value: 'ProductImageAdded',
        description: 'Triggered when an image is added to a product',
    },
    {
        name: 'Product Added To Category',
        value: 'ProductAddedToCategory',
        description: 'Triggered when a product is added to a category',
    },
    {
        name: 'Product Removed From Category',
        value: 'ProductRemovedFromCategory',
        description: 'Triggered when a product is removed from a category',
    },
    {
        name: 'Product Variant Added',
        value: 'ProductVariantAdded',
        description: 'Triggered when a product variant is added',
    },
    {
        name: 'Product Variant Deleted',
        value: 'ProductVariantDeleted',
        description: 'Triggered when a product variant is deleted',
    },
    {
        name: 'Product Price Added',
        value: 'ProductPriceAdded',
        description: 'Triggered when a product price is added',
    },
    {
        name: 'Product Price Changed',
        value: 'ProductPriceChanged',
        description: 'Triggered when a product price is changed',
    },
    {
        name: 'Product Price Removed',
        value: 'ProductPriceRemoved',
        description: 'Triggered when a product price is removed',
    },
    {
        name: 'Product Prices Set',
        value: 'ProductPricesSet',
        description: 'Triggered when product prices are set',
    },
    {
        name: 'Product Price Key Set',
        value: 'ProductPriceKeySet',
        description: 'Triggered when a product price key is set',
    },
    {
        name: 'Product Price Mode Set',
        value: 'ProductPriceModeSet',
        description: 'Triggered when product price mode is set',
    },
    {
        name: 'Product Price Discounts Set',
        value: 'ProductPriceDiscountsSet',
        description: 'Triggered when product price discounts are set',
    },
    {
        name: 'Product Price External Discount Set',
        value: 'ProductPriceExternalDiscountSet',
        description: 'Triggered when product price external discount is set',
    },
    {
        name: 'Product Price Custom Field Added',
        value: 'ProductPriceCustomFieldAdded',
        description: 'Triggered when a custom field is added to product price',
    },
    {
        name: 'Product Price Custom Field Changed',
        value: 'ProductPriceCustomFieldChanged',
        description: 'Triggered when a product price custom field is changed',
    },
    {
        name: 'Product Price Custom Field Removed',
        value: 'ProductPriceCustomFieldRemoved',
        description: 'Triggered when a product price custom field is removed',
    },
    {
        name: 'Product Price Custom Fields Set',
        value: 'ProductPriceCustomFieldsSet',
        description: 'Triggered when product price custom fields are set',
    },
    {
        name: 'Product Price Custom Fields Removed',
        value: 'ProductPriceCustomFieldsRemoved',
        description: 'Triggered when product price custom fields are removed',
    },
];

// Order Events
export const orderEvents = [
    {
        name: 'Order Created',
        value: 'OrderCreated',
        description: 'Triggered when a new order is created',
    },
    {
        name: 'Order Deleted',
        value: 'OrderDeleted',
        description: 'Triggered when an order is deleted',
    },
    {
        name: 'Order Imported',
        value: 'OrderImported',
        description: 'Triggered when an order is imported',
    },
    {
        name: 'Order Created From Recurring Order',
        value: 'OrderCreatedFromRecurringOrder',
        description: 'Triggered when an order is created from a recurring order',
    },
    {
        name: 'Order State Changed',
        value: 'OrderStateChanged',
        description: 'Triggered when an order state is changed',
    },
    {
        name: 'Order State Transition',
        value: 'OrderStateTransition',
        description: 'Triggered when an order state transitions',
    },
    {
        name: 'Order Edit Applied',
        value: 'OrderEditApplied',
        description: 'Triggered when an order edit is applied',
    },
    {
        name: 'Order Customer Set',
        value: 'OrderCustomerSet',
        description: 'Triggered when an order customer is set',
    },
    {
        name: 'Order Customer Email Set',
        value: 'OrderCustomerEmailSet',
        description: 'Triggered when an order customer email is set',
    },
    {
        name: 'Order Customer Group Set',
        value: 'OrderCustomerGroupSet',
        description: 'Triggered when an order customer group is set',
    },
    {
        name: 'Order Billing Address Set',
        value: 'OrderBillingAddressSet',
        description: 'Triggered when an order billing address is set',
    },
    {
        name: 'Order Shipping Address Set',
        value: 'OrderShippingAddressSet',
        description: 'Triggered when an order shipping address is set',
    },
    {
        name: 'Order Line Item Added',
        value: 'OrderLineItemAdded',
        description: 'Triggered when a line item is added to an order',
    },
    {
        name: 'Order Line Item Removed',
        value: 'OrderLineItemRemoved',
        description: 'Triggered when a line item is removed from an order',
    },
    {
        name: 'Order Line Item Discount Set',
        value: 'OrderLineItemDiscountSet',
        description: 'Triggered when a discount is set on a line item',
    },
    {
        name: 'Order Line Item Distribution Channel Set',
        value: 'OrderLineItemDistributionChannelSet',
        description: 'Triggered when a distribution channel is set on a line item',
    },
    {
        name: 'Line Item State Transition',
        value: 'LineItemStateTransition',
        description: 'Triggered when a line item state transitions',
    },
    {
        name: 'Order Custom Line Item Added',
        value: 'OrderCustomLineItemAdded',
        description: 'Triggered when a custom line item is added to an order',
    },
    {
        name: 'Order Custom Line Item Removed',
        value: 'OrderCustomLineItemRemoved',
        description: 'Triggered when a custom line item is removed from an order',
    },
    {
        name: 'Order Custom Line Item Quantity Changed',
        value: 'OrderCustomLineItemQuantityChanged',
        description: 'Triggered when a custom line item quantity is changed',
    },
    {
        name: 'Order Custom Line Item Discount Set',
        value: 'OrderCustomLineItemDiscountSet',
        description: 'Triggered when a discount is set on a custom line item',
    },
    {
        name: 'Custom Line Item State Transition',
        value: 'CustomLineItemStateTransition',
        description: 'Triggered when a custom line item state transitions',
    },
    {
        name: 'Order Discount Code Added',
        value: 'OrderDiscountCodeAdded',
        description: 'Triggered when a discount code is added to an order',
    },
    {
        name: 'Order Discount Code Removed',
        value: 'OrderDiscountCodeRemoved',
        description: 'Triggered when a discount code is removed from an order',
    },
    {
        name: 'Order Discount Code State Set',
        value: 'OrderDiscountCodeStateSet',
        description: 'Triggered when a discount code state is set on an order',
    },
    {
        name: 'Order Payment Added',
        value: 'OrderPaymentAdded',
        description: 'Triggered when a payment is added to an order',
    },
    {
        name: 'Order Payment Removed',
        value: 'OrderPaymentRemoved',
        description: 'Triggered when a payment is removed from an order',
    },
    {
        name: 'Order Payment State Changed',
        value: 'OrderPaymentStateChanged',
        description: 'Triggered when an order payment state is changed',
    },
    {
        name: 'Order Shipping Info Set',
        value: 'OrderShippingInfoSet',
        description: 'Triggered when order shipping info is set',
    },
    {
        name: 'Order Shipping Rate Input Set',
        value: 'OrderShippingRateInputSet',
        description: 'Triggered when an order shipping rate input is set',
    },
    {
        name: 'Order Shipment State Changed',
        value: 'OrderShipmentStateChanged',
        description: 'Triggered when an order shipment state is changed',
    },
    {
        name: 'Order Return Shipment State Changed',
        value: 'OrderReturnShipmentStateChanged',
        description: 'Triggered when an order return shipment state is changed',
    },
    {
        name: 'Order Custom Field Added',
        value: 'OrderCustomFieldAdded',
        description: 'Triggered when a custom field is added to an order',
    },
    {
        name: 'Order Custom Field Changed',
        value: 'OrderCustomFieldChanged',
        description: 'Triggered when an order custom field is changed',
    },
    {
        name: 'Order Custom Field Removed',
        value: 'OrderCustomFieldRemoved',
        description: 'Triggered when an order custom field is removed',
    },
    {
        name: 'Order Custom Type Set',
        value: 'OrderCustomTypeSet',
        description: 'Triggered when a custom type is set for an order',
    },
    {
        name: 'Order Custom Type Removed',
        value: 'OrderCustomTypeRemoved',
        description: 'Triggered when a custom type is removed from an order',
    },
    {
        name: 'Order Business Unit Set',
        value: 'OrderBusinessUnitSet',
        description: 'Triggered when an order business unit is set',
    },
    {
        name: 'Order Store Set',
        value: 'OrderStoreSet',
        description: 'Triggered when an order store is set',
    },
    {
        name: 'Purchase Order Number Set',
        value: 'PurchaseOrderNumberSet',
        description: 'Triggered when a purchase order number is set',
    },
];

// Other Events (Category, Delivery, Parcel, Return Info)
export const otherEvents = [
    {
        name: 'Category Created',
        value: 'CategoryCreated',
        description: 'Triggered when a new category is created',
    },
    {
        name: 'Category Slug Changed',
        value: 'CategorySlugChanged',
        description: 'Triggered when a category slug is changed',
    },
    {
        name: 'Delivery Added',
        value: 'DeliveryAdded',
        description: 'Triggered when a delivery is added',
    },
    {
        name: 'Delivery Removed',
        value: 'DeliveryRemoved',
        description: 'Triggered when a delivery is removed',
    },
    {
        name: 'Delivery Address Set',
        value: 'DeliveryAddressSet',
        description: 'Triggered when a delivery address is set',
    },
    {
        name: 'Delivery Items Updated',
        value: 'DeliveryItemsUpdated',
        description: 'Triggered when delivery items are updated',
    },
    {
        name: 'Delivery Custom Field Added',
        value: 'DeliveryCustomFieldAdded',
        description: 'Triggered when a custom field is added to a delivery',
    },
    {
        name: 'Delivery Custom Field Changed',
        value: 'DeliveryCustomFieldChanged',
        description: 'Triggered when a delivery custom field is changed',
    },
    {
        name: 'Delivery Custom Field Removed',
        value: 'DeliveryCustomFieldRemoved',
        description: 'Triggered when a delivery custom field is removed',
    },
    {
        name: 'Delivery Custom Type Set',
        value: 'DeliveryCustomTypeSet',
        description: 'Triggered when a custom type is set for a delivery',
    },
    {
        name: 'Delivery Custom Type Removed',
        value: 'DeliveryCustomTypeRemoved',
        description: 'Triggered when a custom type is removed from a delivery',
    },
    {
        name: 'Parcel Added To Delivery',
        value: 'ParcelAddedToDelivery',
        description: 'Triggered when a parcel is added to a delivery',
    },
    {
        name: 'Parcel Removed From Delivery',
        value: 'ParcelRemovedFromDelivery',
        description: 'Triggered when a parcel is removed from a delivery',
    },
    {
        name: 'Parcel Items Updated',
        value: 'ParcelItemsUpdated',
        description: 'Triggered when parcel items are updated',
    },
    {
        name: 'Parcel Measurements Updated',
        value: 'ParcelMeasurementsUpdated',
        description: 'Triggered when parcel measurements are updated',
    },
    {
        name: 'Parcel Tracking Data Updated',
        value: 'ParcelTrackingDataUpdated',
        description: 'Triggered when parcel tracking data is updated',
    },
    {
        name: 'Return Info Added',
        value: 'ReturnInfoAdded',
        description: 'Triggered when return info is added',
    },
    {
        name: 'Return Info Set',
        value: 'ReturnInfoSet',
        description: 'Triggered when return info is set',
    },
];

// Main Trigger Properties
export const triggerProperties: INodeProperties[] = [
    {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        noDataExpression: true,
        required: true,
        
        options: [
            ...orderEvents,
            ...customerEvents,
            ...productEvents,
            ...otherEvents,
        ],
        default: ['ProductPublished'],
        description: 'Select which events should trigger this workflow',
    },
];