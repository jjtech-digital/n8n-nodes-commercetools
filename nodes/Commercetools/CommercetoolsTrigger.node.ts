/**
 * CommercetoolsTrigger.node.ts
 *
 * Webhook trigger node that listens for real-time commercetools events.
 *
 * On workflow activation the node registers a commercetools subscription
 * pointing at the n8n webhook URL and optionally provisions cloud
 * infrastructure (AWS SQS + Lambda or GCP Pub/Sub + Cloud Functions).
 * All provisioned resources are automatically deleted on deactivation.
 *
 * Bug fixes applied:
 *   TRIGGER-BUG-1: req.body JSON.parse is now wrapped in try/catch — a
 *                  malformed payload previously crashed the entire workflow
 *                  execution. Invalid payloads now return noWebhookResponse.
 *   TRIGGER-READ-1: description updated to mention GCP Pub/Sub support.
 */

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
import type { AWSResponse } from './utils/awsInfra.utils';
import type { GCPResponse } from './utils/gcpInfra.utils';

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
		usableAsTool: true,
		displayName: 'commercetools Trigger',
		name: 'commercetoolsTrigger',
		icon: 'file:Commercetools.svg',
		group: ['trigger'],
		version: 1,
		// TRIGGER-READ-1: mention GCP alongside AWS
		description:
			'Listen for commercetools events. Automatically provisions AWS SQS + Lambda or GCP Pub/Sub + Cloud Functions when the respective credentials are provided.',
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

		// ── Validate webhook secret (if configured) ───────────────────────────
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

		// TRIGGER-BUG-1: wrap JSON.parse in try/catch so malformed payloads
		// don't crash the execution — return noWebhookResponse instead.
		let processedBody: IDataObject;
		try {
			processedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
		} catch {
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(processedBody)],
		};
	}
}
