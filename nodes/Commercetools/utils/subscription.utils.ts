/**
 * Routing logic:
 *   Each event in subscriptionEvents contains:
 *
 *     subscriptionType:
 *       'message' → CT messages[]
 *       'change'  → CT changes[]
 *
 *   The generated registry is the single source of truth.
 *   No prefixes, heuristics, or string parsing are used.
 */

import { IDataObject, IHookFunctions, IWebhookFunctions, NodeOperationError } from 'n8n-workflow';
import { AWSResponse } from './awsInfra.utils';
import { GCPResponse } from './gcpInfra.utils';
import { subscriptionEvents } from '../generated/subscription.properties';
import type { SubscriptionEvent } from '../generated/subscription.properties';

// ─── Event lookup map (value → event entry) ───────────────────────────────────
// Built once at module load from the generated event list.

const EVENT_MAP = new Map<string, SubscriptionEvent>();

for (const e of subscriptionEvents) {
	EVENT_MAP.set(e.value, e);
}
// ─── Base URL helper ──────────────────────────────────────────────────────────

export async function getBaseUrl(this: IHookFunctions | IWebhookFunctions): Promise<string> {
	const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;
	const projectKey = credentials.projectKey as string;
	const region = (credentials.region as string) || 'australia-southeast1.gcp';

	if (!projectKey) {
		throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials');
	}

	return `https://api.${region}.commercetools.com/${projectKey}`;
}

// ─── Subscription CRUD helpers ────────────────────────────────────────────────

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
		qs: { version },
	});
}

// ─── Subscription body builder ────────────────────────────────────────────────

interface SubscriptionBody {
	messages: IDataObject[];
	changes: IDataObject[];
}

function buildSubscriptionBody(selectedValues: string[]): SubscriptionBody {
	const messageTypesByResource = new Map<string, Set<string>>();
	const changeResourceIds = new Set<string>();

	for (const value of selectedValues) {
		const event = EVENT_MAP.get(value);

		if (!event) {
			continue;
		}

		const { resourceTypeId, subscriptionType } = event;

		if (!resourceTypeId) {
			continue;
		}

		switch (subscriptionType) {
			case 'message': {
				const types = messageTypesByResource.get(resourceTypeId) ?? new Set<string>();
				types.add(value); // ✅ dedupe automatically
				messageTypesByResource.set(resourceTypeId, types);
				break;
			}
			case 'change': {
				changeResourceIds.add(resourceTypeId);
				break;
			}
		}
	}

	const messages: IDataObject[] = Array.from(messageTypesByResource.entries()).map(
		([resourceTypeId, types]) => ({
			resourceTypeId,
			types: Array.from(types),
		}),
	);

	const changes: IDataObject[] = Array.from(changeResourceIds).map((resourceTypeId) => ({
		resourceTypeId,
	}));

	return { messages, changes };
}
// ─── Public: create subscription ─────────────────────────────────────────────

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
): Promise<unknown> {
	const { baseUrl, webhookUrl, awsInfrastructure, gcpInfrastructure, events, useAWS, useGCP } =
		params;

	// Build all three CT subscription arrays from the selected event values.
	// This replaces the old per-resource manual filtering — all routing is
	// driven by the subscriptionType field on each generated event entry.
	const { messages, changes } = buildSubscriptionBody(events);

	// ── Destination ───────────────────────────────────────────────────────────

	let destination: IDataObject;

	if (useAWS && awsInfrastructure) {
		destination = {
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
	} else if (useGCP && gcpInfrastructure) {
		destination = {
			type: 'GoogleCloudPubSub',
			projectId: gcpInfrastructure.projectId,
			topic: gcpInfrastructure.topicName,
		};
	} else {
		destination = {
			type: 'HTTP',
			url: webhookUrl,
		};
	}

	// ── Assemble body ─────────────────────────────────────────────────────────
	// Only include non-empty arrays — CT rejects empty messages/changes/events.

	const body: IDataObject = { destination };

	if (messages.length > 0) body.messages = messages;
	if (changes.length > 0) body.changes = changes;

	if (!messages.length && !changes.length) {
		throw new NodeOperationError(this.getNode(), 'No valid subscription events selected.');
	}

	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/subscriptions`,
		body,
	});
}
