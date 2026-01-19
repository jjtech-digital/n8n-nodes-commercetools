import { INodeProperties } from "n8n-workflow";

export const triggerProperties: INodeProperties[] = [
    {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        noDataExpression: true,
        required: true,
        
        options: [
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
                name: 'Customer Address Custom Type Removed',
                value: 'CustomerAddressCustomTypeRemoved',
                description: 'Triggered when a custom type is removed from a customer address',
            },
            {
                name: 'Customer Address Custom Type Set',
                value: 'CustomerAddressCustomTypeSet',
                description: 'Triggered when a custom type is set for a customer address',
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
                name: 'Customer Company Name Set',
                value: 'CustomerCompanyNameSet',
                description: 'Triggered when a customer company name is set',
            },
            {
                name: 'Customer Created',
                value: 'CustomerCreated',
                description: 'Triggered when a new customer is created',
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
                name: 'Customer Custom Type Removed',
                value: 'CustomerCustomTypeRemoved',
                description: 'Triggered when a custom type is removed from a customer',
            },
            {
                name: 'Customer Custom Type Set',
                value: 'CustomerCustomTypeSet',
                description: 'Triggered when a custom type is set for a customer',
            },
            {
                name: 'Customer Date Of Birth Set',
                value: 'CustomerDateOfBirthSet',
                description: 'Triggered when a customer date of birth is set',
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
                name: 'Customer External ID Set',
                value: 'CustomerExternalIdSet',
                description: 'Triggered when a customer external ID is set',
            },
            {
                name: 'Customer First Name Set',
                value: 'CustomerFirstNameSet',
                description: 'Triggered when a customer first name is set',
            },
            {
                name: 'Customer Group Set',
                value: 'CustomerGroupSet',
                description: 'Triggered when a customer is assigned to a group',
            },
            {
                name: 'Customer Last Name Set',
                value: 'CustomerLastNameSet',
                description: 'Triggered when a customer last name is set',
            },
            {
                name: 'Customer Password Updated',
                value: 'CustomerPasswordUpdated',
                description: 'Triggered when a customer password is updated',
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
                name: 'Customer Stores Set',
                value: 'CustomerStoresSet',
                description: 'Triggered when customer stores are set',
            },
            {
                name: 'Customer Title Set',
                value: 'CustomerTitleSet',
                description: 'Triggered when a customer title is set',
            },
            {
                name: 'Product Added To Category',
                value: 'ProductAddedToCategory',
                description: 'Triggered when a product is added to a category',
            },
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
                name: 'Product Image Added',
                value: 'ProductImageAdded',
                description: 'Triggered when an image is added to a product',
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
                name: 'Product Price Custom Fields Removed',
                value: 'ProductPriceCustomFieldsRemoved',
                description: 'Triggered when product price custom fields are removed',
            },
            {
                name: 'Product Price Custom Fields Set',
                value: 'ProductPriceCustomFieldsSet',
                description: 'Triggered when product price custom fields are set',
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
                name: 'Product Published',
                value: 'ProductPublished',
                description: 'Triggered when a product is published',
            },
            {
                name: 'Product Removed From Category',
                value: 'ProductRemovedFromCategory',
                description: 'Triggered when a product is removed from a category',
            },
            {
                name: 'Product Reverted Staged Changes',
                value: 'ProductRevertedStagedChanges',
                description: 'Triggered when product staged changes are reverted',
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
                name: 'Product Unpublished',
                value: 'ProductUnpublished',
                description: 'Triggered when a product is unpublished',
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
            
        ],
        default: ['ProductPublished'],
        description: 'Select which product events should trigger this workflow',
    },
];