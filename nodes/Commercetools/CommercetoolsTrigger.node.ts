import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes,NodeOperationError } from 'n8n-workflow';

type StaticSubscriptionData = IDataObject & {
	subscriptionId?: string;
};

async function getBaseUrl(this: IHookFunctions | IWebhookFunctions): Promise<string> {
	const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;

	const projectKey = credentials.projectKey as string;
	const region = (credentials.region as string) || 'australia-southeast1.gcp';

	if (!projectKey) {
		throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials');
	}

	return `https://api.${region}.commercetools.com/${projectKey}`;
}

async function fetchSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string) {
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'GET',
		url: `${baseUrl}/subscriptions/${subscriptionId}`,
	});
}

async function deleteSubscription(this: IHookFunctions, baseUrl: string, subscriptionId: string, version: number) {
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'DELETE',
		url: `${baseUrl}/subscriptions/${subscriptionId}`,
		qs: {
			version,
		},
	});
}

async function createSubscription(
	this: IHookFunctions,
	params: {
		baseUrl: string;
		webhookUrl: string;
		events: string[];
	},
) {
	const { baseUrl, webhookUrl, events } = params;

	const body: IDataObject = {
		destination: {
			type: 'HTTP',
			url: webhookUrl,
		},
		messages: [
			{
				resourceTypeId: 'product',
				types: events,
			},
		],
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/subscriptions`,
		body,
	});
}

export class CommercetoolsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Commercetools Trigger',
		name: 'commercetoolsTrigger',
		icon: 'file:Commercetools.svg',
		group: ['trigger'],
		version: 1,
		description: 'Subscribe to Commercetools product events',
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
		properties: [
			{
				displayName: 'Product Events',
				name: 'productEvents',
				type: 'multiOptions',
				noDataExpression: true,
				required: true,
				options: [
					{
						name: 'Product Created',
						value: 'ProductCreated',
					},
					{
						name: 'Product Published',
						value: 'ProductPublished',
					},
					{
						name: 'Product Deleted',
						value: 'ProductDeleted',
					},
				],
				default: ['ProductCreated'],
				description: 'Product lifecycle events that will fire the trigger',
			},
		],
	};

	webhookMethods = {
		default: {
			checkExists: async function (this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
				if (!webhookData.subscriptionId) {
					return false;
				}

				try {
					const baseUrl = await getBaseUrl.call(this);
					await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId);
					return true;
				} catch {
					delete webhookData.subscriptionId;
					return false;
				}
			},
			create: async function (this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) {
					throw new NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
				}

				const eventsRaw = this.getNodeParameter('productEvents', 0) as string[] | string;
				const events = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
				if (!events.length) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one product event must be selected to create the subscription',
					);
				}

				const baseUrl = await getBaseUrl.call(this);
				const response = (await createSubscription.call(this, {
					baseUrl,
					webhookUrl,
					events,
				})) as IDataObject;

				const subscriptionId = response.id as string | undefined;
				if (!subscriptionId) {
					throw new NodeOperationError(
						this.getNode(),
						'Commercetools did not return a subscription identifier',
					);
				}

				const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
				webhookData.subscriptionId = subscriptionId;
				return true;
			},
			delete: async function (this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
				if (!webhookData.subscriptionId) {
					return true;
				}

				try {
					const baseUrl = await getBaseUrl.call(this);
					const subscription = (await fetchSubscription.call(
						this,
						baseUrl,
						webhookData.subscriptionId,
					)) as IDataObject;
					const version = subscription.version as number | undefined;
					if (typeof version !== 'number') {
						throw new NodeOperationError(this.getNode(), 'Failed to resolve subscription version');
					}
					await deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
				} catch (error) {
					const errorData = error as IDataObject;
					const statusCode =
						(errorData.statusCode as number | undefined) ??
						((errorData.cause as IDataObject)?.statusCode as number | undefined);
					if (statusCode !== 404) {
						throw error;
					}
				}

				delete webhookData.subscriptionId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const returnData: IDataObject[] = [
			{
				body: bodyData as IDataObject,
				headers: this.getHeaderData(),
				query: this.getQueryData(),
				requestPath: this.getRequestObject().path,
			},
		];

		return {
			workflowData: [this.helpers.returnJsonArray(returnData)],
		};
	}
}
