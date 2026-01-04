import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { triggerProperties } from './properties/subscription.properties';
import { triggerMethods } from './utils/webhookMethods.utils';
import { AWSResponse } from './utils/awsInfra.utils';

export type StaticSubscriptionData = IDataObject & {
	subscriptionId?: string;
	awsInfrastructure?: AWSResponse;
	configHash?: string;
	events?: string[];
};

export class CommercetoolsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Commercetools Trigger',
		name: 'commercetoolsTrigger',
		icon: 'file:Commercetools.svg',
		group: ['trigger'],
		version: 1,
		description: 'Subscribe to Commercetools product events. Automatically creates AWS SQS + Lambda when AWS credentials are provided.',
		defaults: {
			name: 'Commercetools Trigger',
		},
		codex: {
			categories: ['Commercetools', 'Integration', 'Product'],
			subcategories: {
				Commercetools: ['Product'],
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
				path: 'commercetools-product-events',
			},
		],
		usableAsTool: true,
		properties: triggerProperties,
	};

	webhookMethods = triggerMethods;

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		this.getWorkflowStaticData('node') as StaticSubscriptionData;
		const req = this.getRequestObject();
		const body = req.body as IDataObject | IDataObject[];


		// Process the data from Lambda or direct CommerceTools webhook
		// The body will contain the processed product event from Lambda
		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}