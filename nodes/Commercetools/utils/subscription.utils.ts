/**
 * subscription.utils.ts
 *
 * Utilities for managing commercetools subscriptions as n8n triggers.
 *
 * Routing logic:
 *   Each event value in subscriptionEvents has an explicit `subscriptionType`:
 *     'message' → CT messages[] array  (MessageSubscription)
 *     'change'  → CT changes[] array   (ChangeSubscription — no types, whole resource)
 *     'event'   → CT events[] array    (EventSubscription)
 *
 *   Special value prefixes:
 *     'change:{resourceTypeId}'  → synthetic key for change-only resources
 *     'message:{resourceTypeId}' → catch-all: subscribe to ALL messages for resource (omit types[])
 *     anything else              → literal CT message or event type string
 *
 *   This module reads subscriptionType directly from the event registry —
 *   no manual prefix tables or guesswork.
 */

import { IDataObject, IHookFunctions, IWebhookFunctions, NodeOperationError } from 'n8n-workflow';
import { AWSResponse } from './awsInfra.utils';
import { GCPResponse } from './gcpInfra.utils';
import {
	subscriptionEvents,
	MESSAGE_SUBSCRIPTION_RESOURCES,
	CHANGE_SUBSCRIPTION_RESOURCES,
	EVENT_SUBSCRIPTION_RESOURCES,
} from './generated/subscription.properties';
import type { SubscriptionEvent } from './generated/subscription.properties';

// ─── Event lookup map (value → event entry) ───────────────────────────────────
// Built once at module load from the generated event list.

const EVENT_MAP = new Map<string, SubscriptionEvent>(subscriptionEvents.map((e) => [e.value, e]));

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
	events: IDataObject[];
}

/**
 * Convert selected event values into CT SubscriptionDraft arrays.
 *
 * CT API shapes:
 *   messages: [{ resourceTypeId: 'product', types: ['ProductPublished', ...] }]
 *   changes:  [{ resourceTypeId: 'cart' }]   ← NO types array, ever
 *   events:   [{ resourceTypeId: 'checkout', types: ['CheckoutPaymentAuthorized', ...] }]
 */
function buildSubscriptionBody(selectedValues: string[]): SubscriptionBody {
	// Per-resource buckets for message type strings
	const messageTypesByResource = new Map<string, string[]>();
	// Resources where the user selected the catch-all "all messages" option
	const messageAllResources = new Set<string>();
	// Per-resource buckets for event type strings
	const eventTypesByResource = new Map<string, string[]>();
	// Change-only resourceTypeIds
	const changeResourceIds = new Set<string>();

	for (const value of selectedValues) {
		const event = EVENT_MAP.get(value);
		if (!event) {
			console.warn(`[CT Trigger] Unknown event value "${value}" — skipping`);
			continue;
		}

		switch (event.subscriptionType) {
			case 'message':
				if (value.startsWith('message:')) {
					// Catch-all: subscribe to ALL messages for this resource (no types[] filter)
					messageAllResources.add(event.resourceTypeId);
				} else {
					const types = messageTypesByResource.get(event.resourceTypeId) ?? [];
					types.push(value);
					messageTypesByResource.set(event.resourceTypeId, types);
				}
				break;

			case 'change':
				changeResourceIds.add(event.resourceTypeId);
				break;

			case 'event':
				const etypes = eventTypesByResource.get(event.resourceTypeId) ?? [];
				etypes.push(value);
				eventTypesByResource.set(event.resourceTypeId, etypes);
				break;
		}
	}

	// ── Build messages[] ──────────────────────────────────────────────────────

	const messages: IDataObject[] = [];

	// Resources with specific types selected
	for (const [resourceTypeId, types] of messageTypesByResource.entries()) {
		if (!MESSAGE_SUBSCRIPTION_RESOURCES.has(resourceTypeId)) {
			console.warn(
				`[CT Trigger] "${resourceTypeId}" not in MessageSubscriptionResourceTypeId — skipping`,
			);
			continue;
		}
		if (messageAllResources.has(resourceTypeId)) {
			// Catch-all also selected for this resource: omit types[] (receives everything)
			messages.push({ resourceTypeId });
		} else {
			messages.push({ resourceTypeId, types });
		}
	}

	// Resources where only the catch-all was selected (not already added above)
	for (const resourceTypeId of messageAllResources) {
		if (messageTypesByResource.has(resourceTypeId)) continue;
		if (!MESSAGE_SUBSCRIPTION_RESOURCES.has(resourceTypeId)) {
			console.warn(
				`[CT Trigger] "${resourceTypeId}" not in MessageSubscriptionResourceTypeId — skipping`,
			);
			continue;
		}
		messages.push({ resourceTypeId }); // no types = CT sends all message types
	}

	// ── Build changes[] ───────────────────────────────────────────────────────
	// CT ChangeSubscription has NO types array — it's whole-resource only

	const changes: IDataObject[] = [];

	for (const resourceTypeId of changeResourceIds) {
		if (!CHANGE_SUBSCRIPTION_RESOURCES.has(resourceTypeId)) {
			console.warn(
				`[CT Trigger] "${resourceTypeId}" not in ChangeSubscriptionResourceTypeId — skipping`,
			);
			continue;
		}
		changes.push({ resourceTypeId });
	}

	// ── Build events[] ────────────────────────────────────────────────────────

	const events: IDataObject[] = [];

	for (const [resourceTypeId, types] of eventTypesByResource.entries()) {
		if (!EVENT_SUBSCRIPTION_RESOURCES.has(resourceTypeId)) {
			console.warn(
				`[CT Trigger] "${resourceTypeId}" not in EventSubscriptionResourceTypeId — skipping`,
			);
			continue;
		}
		events.push({ resourceTypeId, types });
	}

	return { messages, changes, events };
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
	const { messages, changes, events: eventsList } = buildSubscriptionBody(events);

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
	if (eventsList.length > 0) body.events = eventsList;

	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/subscriptions`,
		body,
	});
}
