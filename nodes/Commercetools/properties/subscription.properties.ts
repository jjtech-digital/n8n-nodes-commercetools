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
                name: 'Product Slug Changed',
                value: 'ProductSlugChanged',
                description: 'Triggered when a product slug is updated',
            },
            {
                name: 'Product Unpublished',
                value: 'ProductUnpublished',
                description: 'Triggered when a product is unpublished',
            },
        ],
        default: ['ProductPublished'],
        description: 'Select which product events should trigger this workflow',
    },
];