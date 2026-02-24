import { IDataObject, IHookFunctions, IWebhookFunctions, NodeOperationError } from 'n8n-workflow';
import { AWSResponse } from './awsInfra.utils';
import {
	customerEvents,
	orderEvents,
	productEvents,
	categoryEvents,
	cartEvents,
} from '../properties/subscription.properties';
import { GCPResponse } from './gcpInfra.utils';

export async function getBaseUrl(this: IHookFunctions | IWebhookFunctions): Promise<string> {
	const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;

	const projectKey = credentials.projectKey as string;
	const region = (credentials.region as string) || 'australia-southeast1.gcp';

	if (!projectKey) {
		throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials');
	}

	return `https://api.${region}.commercetools.com/${projectKey}`;
}

export async function fetchSubscription(
	this: IHookFunctions,
	baseUrl: string,
	subscriptionId: string,
) {
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'GET',
		url: `${baseUrl}/subscriptions/${subscriptionId}`,
	});
}

export async function deleteSubscription(
	this: IHookFunctions,
	baseUrl: string,
	subscriptionId: string,
	version: number,
) {
	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'DELETE',
		url: `${baseUrl}/subscriptions/${subscriptionId}`,
		qs: {
			version,
		},
	});
}

export async function createSubscription(
	this: IHookFunctions,
	params: {
		baseUrl: string;
		webhookUrl?: string;
		awsInfrastructure?: AWSResponse;
		gcpInfrastructure?: GCPResponse;
		events: string[];
		useAWS: boolean;
		useGCP: boolean;
	},
) {
	const { baseUrl, webhookUrl, awsInfrastructure, gcpInfrastructure, events, useAWS, useGCP } =
		params;

	// Separate events by resource type using dynamic filtering
	const selectedProductEvents = events.filter((event) =>
		productEvents.find((x: { value: string }) => x.value === event),
	);

	const selectedCustomerEvents = events.filter((event) =>
		customerEvents.find((x: { value: string }) => x.value === event),
	);

	const selectedCategoryEvents = events.filter((event) =>
		categoryEvents.find((x: { value: string }) => x.value === event),
	);

	const selectedOrderEvents = events.filter((event) =>
		orderEvents.find((x: { value: string }) => x.value === event),
	);
	const selectedCartEvents = events.filter((event) =>
		cartEvents.find((x: { value: string }) => x.value === event),
	);

	// Create messages array for each resource type that has events
	const messages: IDataObject[] = [];
	const changes: IDataObject[] = [];

	if (selectedProductEvents.length > 0) {
		messages.push({
			resourceTypeId: 'product',
			types: selectedProductEvents,
		});
	}

	if (selectedCustomerEvents.length > 0) {
		messages.push({
			resourceTypeId: 'customer',
			types: selectedCustomerEvents,
		});
	}

	if (selectedCategoryEvents.length > 0) {
		messages.push({
			resourceTypeId: 'category',
			types: selectedCategoryEvents,
		});
	}

	if (selectedOrderEvents.length > 0) {
		messages.push({
			resourceTypeId: 'order',
			types: selectedOrderEvents,
		});
	}

	if (selectedCartEvents.length > 0) {
		// changes[] entries never take a types array — CT API rejects it
		changes.push({
			resourceTypeId: 'cart',
		});
	}

	// Ensure we have at least one message
	if (messages.length === 0 && changes.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No valid events selected');
	}

	let body: IDataObject;
	if (useAWS && awsInfrastructure) {
		const destination: IDataObject = {
			type: 'SQS',
			queueUrl: awsInfrastructure.queueUrl,
			region: awsInfrastructure.region,
		};

		if (awsInfrastructure.accessKeyId && awsInfrastructure.secretAccessKey) {
			destination.authenticationMode = 'Credentials';
			destination.accessKey = awsInfrastructure.accessKeyId;
			destination.accessSecret = awsInfrastructure.secretAccessKey;
		} else {
			destination.authenticationMode = 'IAM';
		}

		body = { destination };
	} else if (useGCP && gcpInfrastructure) {
		body = {
			destination: {
				type: 'GoogleCloudPubSub',
				projectId: gcpInfrastructure.projectId, // ← separate field
				topic: gcpInfrastructure.topicName, // ← bare name only, not full path
			},
		};
	} else {
		body = {
			destination: {
				type: 'HTTP',
				url: webhookUrl,
			},
		};
	}
	if (messages.length > 0) {
		body.messages = messages;
	}
	if (changes.length > 0) {
		body.changes = changes;
	}

	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/subscriptions`,
		body,
	});
}
