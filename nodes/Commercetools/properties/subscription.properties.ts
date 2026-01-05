import { INodeProperties } from "n8n-workflow";

export const triggerProperties: INodeProperties[] = [
    {
        displayName: 'Product Events',
        name: 'productEvents',
        type: 'multiOptions',
        noDataExpression: true,
        required: true,
        options: [
            {
                name: 'Product Published',
                value: 'ProductPublished',
            },
            {
                name: 'Product Created',
                value: 'ProductCreated',
            },
            {
                name: 'Product Deleted',
                value: 'ProductDeleted',
            },
        ],
        default: ['ProductPublished'],
        description: 'Product lifecycle events that will trigger this webhook',
    },
];