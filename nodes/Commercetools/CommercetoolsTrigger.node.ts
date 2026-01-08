import type {
	IDataObject,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { triggerProperties } from './properties/subscription.properties';
import { customerTriggerProperties } from './properties/customer.triggers.properties';
import { triggerMethods } from './utils/webhookMethods.utils';
import { AWSResponse } from './utils/awsInfra.utils';

export type StaticSubscriptionData = IDataObject & {
	subscriptionId?: string;
	awsInfrastructure?: AWSResponse;
	configHash?: string;
	events?: string[];
};

const resourceField: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Customer',
			value: 'customer',
			description: 'Subscribe to customer-related events',
		},
		{
			name: 'Product',
			value: 'product',
			description: 'Subscribe to product-related events',
		},
	],
	default: 'customer',
	description: 'The CommerceTools resource type to monitor for events',
};

export class CommercetoolsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Commercetools Trigger',
		name: 'commercetoolsTrigger',
		icon: 'file:Commercetools.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listen for CommerceTools events (customer and product events). Automatically creates AWS SQS + Lambda when AWS credentials are provided.',
		defaults: {
			name: 'Commercetools Trigger',
		},
		codex: {
			categories: ['Commercetools', 'Integration', 'Customer', 'Product'],
			subcategories: {
				Commercetools: ['Customer', 'Product'],
			},
			alias: ['commercetools', 'Commercetools'],
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'commerceToolsOAuth2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'commercetools-events',
				ndvHideUrl: false,
			},
		],
		usableAsTool: true,
		properties: [
			resourceField,
			...customerTriggerProperties,
			...triggerProperties
		],
	};

	webhookMethods = triggerMethods;

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();

		let processedBody: IDataObject;
		try {
			// Handle different body formats
			if (typeof req.body === 'string') {
				processedBody = JSON.parse(req.body);
			} else if (typeof req.body === 'object' && req.body !== null) {
				processedBody = req.body;
			} else {
				processedBody = req.body;
			}

			// Return the processed data
			return {
				workflowData: [this.helpers.returnJsonArray(processedBody)],
			};

		} catch {
			// Return raw body as fallback
			return {
				workflowData: [this.helpers.returnJsonArray(req.body as IDataObject)],
			};
		}
	}
}