import { INodeProperties } from "n8n-workflow";

export const triggerProperties: INodeProperties[] = [
    {
        displayName: 'Events',
        name: 'productEvents',
        type: 'multiOptions',
        noDataExpression: true,
        required: true,
        displayOptions: {
            show: {
                resource: ['product'],
            },
        },
        options: [
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