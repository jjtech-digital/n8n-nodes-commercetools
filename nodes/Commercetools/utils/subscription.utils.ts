/**
 * nodes/Commercetools/utils/subscription.utils.ts
 *
 * Subscription CRUD helpers and body builder for the commercetools
 * Trigger node.
 *
 * Bug fixes applied:
 *   SUB-BUG-1: fetchSubscription / deleteSubscription guard against an empty
 *              subscriptionId before making the API call.
 *   SUB-BUG-2: getBaseUrl throws a NodeOperationError when the region
 *              credential is missing instead of silently defaulting.
 *   SUB-BP-1:  Improved error messages include field names and context.
 *
 * Routing logic:
 *   Each event in subscriptionEvents contains:
 *     subscriptionType:
 *       'message' → CT messages[]
 *       'change'  → CT changes[]
 *   The generated registry is the single source of truth.
 */

import type { IDataObject, IHookFunctions, IWebhookFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { AWSResponse } from './awsInfra.utils';
import type { GCPResponse } from './gcpInfra.utils';
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
	const region = credentials.region as string;

	if (!projectKey) {
		throw new NodeOperationError(
			this.getNode(),
			'commercetools credential is missing "projectKey". Check your credential configuration.',
		);
	}

	// SUB-BUG-2: throw instead of silently defaulting to a hardcoded region
	if (!region) {
		throw new NodeOperationError(
			this.getNode(),
			'commercetools credential is missing "region". Select a region in your credential configuration.',
		);
	}

	return `https://api.${region}.commercetools.com/${projectKey}`;
}

// ─── Subscription CRUD helpers ────────────────────────────────────────────────

export async function fetchSubscription(
	this: IHookFunctions,
	baseUrl: string,
	subscriptionId: string,
) {
	// SUB-BUG-1: guard against empty subscriptionId
	if (!subscriptionId) {
		throw new NodeOperationError(
			this.getNode(),
			'Cannot fetch subscription: subscriptionId is empty.',
		);
	}
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
	// SUB-BUG-1: guard against empty subscriptionId
	if (!subscriptionId) {
		throw new NodeOperationError(
			this.getNode(),
			'Cannot delete subscription: subscriptionId is empty.',
		);
	}
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
		if (!event?.resourceTypeId) continue;

		const { resourceTypeId, subscriptionType } = event;

		if (subscriptionType === 'message') {
			const types = messageTypesByResource.get(resourceTypeId) ?? new Set<string>();
			types.add(value);
			messageTypesByResource.set(resourceTypeId, types);
		} else if (subscriptionType === 'change') {
			changeResourceIds.add(resourceTypeId);
		}
	}

	const messages: IDataObject[] = Array.from(messageTypesByResource.entries()).map(
		([resourceTypeId, types]) => ({ resourceTypeId, types: Array.from(types) }),
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

	const { messages, changes } = buildSubscriptionBody(events);

	// ── Destination ───────────────────────────────────────────────────────────
	let destination: IDataObject;

	if (useAWS && awsInfrastructure) {
		destination = {
			type: 'SQS',
			queueUrl: awsInfrastructure.queueUrl,
			region: awsInfrastructure.region,
			authenticationMode: 'IAM',
		};
	} else if (useGCP && gcpInfrastructure) {
		destination = {
			type: 'GoogleCloudPubSub',
			projectId: gcpInfrastructure.projectId,
			topic: gcpInfrastructure.topicName,
		};
	} else {
		destination = { type: 'HTTP', url: webhookUrl };
	}

	// ── Assemble body — empty arrays are never sent ───────────────────────────
	const body: IDataObject = { destination };
	if (messages.length > 0) body.messages = messages;
	if (changes.length > 0) body.changes = changes;

	if (!messages.length && !changes.length) {
		throw new NodeOperationError(
			this.getNode(),
			'No valid subscription events selected. Choose at least one event from the Events dropdown.',
		);
	}

	return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/subscriptions`,
		body,
	});
}
