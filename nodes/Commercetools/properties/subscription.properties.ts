import { INodeProperties } from "n8n-workflow";

export const triggerProperties: INodeProperties[] = [
    {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Product',
                value: 'product',
                description: 'Subscribe to product-related events',
            },
        ],
        default: 'product',
        description: 'The CommerceTools resource type to monitor for events',
    },
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
                name: 'Product Updated',
                value: 'ProductUpdated',
                description: 'Triggered when a product is updated',
            },
        ],
        default: ['ProductCreated', 'ProductPublished'],
        description: 'Select which product events should trigger this workflow',
    },
];