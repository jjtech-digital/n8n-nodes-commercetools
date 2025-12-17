import type { INodeProperties, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { productAdditionalFields, productDraftFields, productIdentificationFields, productOperations } from '../properties/product.properties';
import { categoryAdditionalFields, categoryBaseFields, categoryOperations } from '../properties/category.properties';
import { customerAdditionalFields, customerDraftFields, customerIdentificationFields, customerOperations } from '../properties/customer.properties';

const resourceField: INodeProperties = {
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
};

const sharedProductCategoryFields: INodeProperties[] = [
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
	}
];

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
		resourceField,
		...productOperations,
		...categoryOperations,
		...customerOperations,
		...productIdentificationFields,
		...categoryBaseFields,
		...productDraftFields,
		...sharedProductCategoryFields,
		...productAdditionalFields,
		...categoryAdditionalFields,
		...customerIdentificationFields,
		...customerDraftFields,
		...customerAdditionalFields,
	],
};
