import { timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { triggerProperties } from './generated/subscription.properties';
import { triggerMethods } from './utils/webhookMethods.utils';
import { AWSResponse } from './utils/awsInfra.utils';
import { GCPResponse } from './utils/gcpInfra.utils';

export type StaticSubscriptionData = IDataObject & {
	subscriptionId?: string;
	awsInfrastructure?: AWSResponse;
	gcpInfrastructure?: GCPResponse;
	configHash?: string;
	events?: string[];
	lastVerifiedAt?: number;
};

export class CommercetoolsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'commercetools Trigger',
		name: 'commercetoolsTrigger',
		icon: 'file:Commercetools.svg',
		group: ['trigger'],
		version: 1,
		description:
			'Listen for commercetools events (customer and product events). Automatically creates AWS SQS + Lambda when AWS credentials are provided.',
		defaults: {
			name: 'commercetools Trigger',
		},
		codex: {
			categories: ['commercetools', 'Integration', 'Customer', 'Product'],
			subcategories: {
				commercetools: ['Customer', 'Product'],
			},
			alias: ['commercetools'],
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
		properties: [...triggerProperties],
	};

	webhookMethods = triggerMethods;

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();

		// Validate webhook secret if configured
		const credentials = await this.getCredentials('commerceToolsOAuth2Api');
		const secret = credentials.webhookSecret as string | undefined;
		if (secret) {
			const incoming = (req.headers['x-webhook-secret'] as string) ?? '';
			const expected = Buffer.from(secret, 'utf8');
			const received = Buffer.from(incoming, 'utf8');
			if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
				return { noWebhookResponse: true };
			}
		}

		const processedBody: IDataObject =
			typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

		return {
			workflowData: [this.helpers.returnJsonArray(processedBody)],
		};
	}
}
