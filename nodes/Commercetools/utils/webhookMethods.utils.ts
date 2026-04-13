/**
 * nodes/Commercetools/utils/webhookMethods.utils.ts
 *
 * Lifecycle methods for the CommercetoolsTrigger node webhook:
 *   checkExists — detect config changes; verify cloud resources still exist
 *   create      — provision cloud infra + register CT subscription
 *   delete      — tear down cloud infra + remove CT subscription
 *
 * Bug fixes applied:
 *   WEBHOOK-BUG-1: `hasAWS` / `hasGCP` detection extracted into
 *                   `detectCloudProvider` — was duplicated across checkExists
 *                   and create, risking divergence.
 *   WEBHOOK-BUG-2: silent catch blocks now call `console.warn` with the
 *                   error message so cloud cleanup failures are visible in
 *                   n8n server logs without crashing the workflow.
 *   WEBHOOK-READ-1: verification sub-functions moved to cloudVerification.utils.ts.
 *   WEBHOOK-READ-2: heavy GCP SDK imports removed from this file; they are
 *                   lazy-loaded inside cloudVerification.utils.ts only.
 */

import type { IDataObject, IHookFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	createSubscription,
	deleteSubscription,
	fetchSubscription,
	getBaseUrl,
} from './subscription.utils';
import { createRealAWSInfrastructure, deleteAWSInfrastructure } from './awsInfra.utils';
import type { AWSResponse } from './awsInfra.utils';
import { createGCPInfrastructure, deleteGCPInfrastructure } from './gcpInfra.utils';
import type { GCPResponse } from './gcpInfra.utils';
import { verifyAWSInfrastructure, verifyGCPInfrastructure } from './cloudVerification.utils';
import type { StaticSubscriptionData } from '../CommercetoolsTrigger.node';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateConfigHash(
	events: string[],
	hasAWS: boolean,
	hasGCP: boolean,
	region?: string,
	projectKey?: string,
): string {
	return JSON.stringify({ events: [...events].sort(), hasAWS, hasGCP, region, projectKey });
}

/** Clear all stored webhook state to avoid leaving orphaned references. */
function clearWebhookData(webhookData: StaticSubscriptionData): void {
	delete webhookData.subscriptionId;
	delete webhookData.awsInfrastructure;
	delete webhookData.gcpInfrastructure;
	delete webhookData.configHash;
	delete webhookData.events;
	delete webhookData.lastVerifiedAt;
}

/**
 * WEBHOOK-BUG-1: single authoritative place to detect which cloud provider
 * is active. Previously duplicated in checkExists and create.
 */
function detectCloudProvider(credentials: Record<string, string>): {
	hasAWS: boolean;
	hasGCP: boolean;
} {
	return {
		hasAWS: !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey),
		hasGCP: !!credentials.serviceAccountJson,
	};
}

// ─── Trigger methods ──────────────────────────────────────────────────────────

export const triggerMethods = {
	default: {
		// ── checkExists ──────────────────────────────────────────────────────
		checkExists: async function (this: IHookFunctions): Promise<boolean> {
			const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
			const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as Record<
				string,
				string
			>;
			const eventsRaw = this.getNodeParameter('events') as string[] | string;
			const currentEvents = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
			const { hasAWS, hasGCP } = detectCloudProvider(credentials);

			const currentHash = generateConfigHash(
				currentEvents,
				hasAWS,
				hasGCP,
				credentials.region,
				credentials.projectKey,
			);

			if (!webhookData.subscriptionId) return false;

			// Config changed — tear down existing infrastructure, let create() rebuild
			if (webhookData.configHash !== currentHash) {
				await tearDownExisting(this, webhookData, credentials);
				clearWebhookData(webhookData);
				return false;
			}

			// Config unchanged — use lastVerifiedAt cache to skip frequent re-checks
			const VERIFY_INTERVAL_MS = 5 * 60 * 1000;
			if (
				webhookData.lastVerifiedAt &&
				Date.now() - webhookData.lastVerifiedAt < VERIFY_INTERVAL_MS
			) {
				return true;
			}

			// Verify subscription + cloud resources still exist
			try {
				const baseUrl = await getBaseUrl.call(this);
				await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId);

				if (webhookData.awsInfrastructure) {
					const ok = await verifyAWSInfrastructure(
						credentials,
						webhookData.awsInfrastructure as AWSResponse,
					);
					if (!ok) {
						clearWebhookData(webhookData);
						return false;
					}
				} else if (webhookData.gcpInfrastructure) {
					const ok = await verifyGCPInfrastructure(
						credentials,
						webhookData.gcpInfrastructure as GCPResponse,
					);
					if (!ok) {
						clearWebhookData(webhookData);
						return false;
					}
				}

				webhookData.lastVerifiedAt = Date.now();
				return true;
			} catch {
				clearWebhookData(webhookData);
				return false;
			}
		},

		// ── create ───────────────────────────────────────────────────────────
		create: async function (this: IHookFunctions): Promise<boolean> {
			const eventsRaw = this.getNodeParameter('events') as string[] | string;
			const events = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
			if (!events.length) {
				throw new NodeOperationError(this.getNode(), 'At least one event must be selected');
			}

			const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as Record<
				string,
				string
			>;
			const { hasAWS, hasGCP } = detectCloudProvider(credentials);
			const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
			const baseUrl = await getBaseUrl.call(this);
			const webhookUrl = this.getNodeWebhookUrl('default');
			if (!webhookUrl) {
				throw new NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
			}

			let useAWS = false;
			let useGCP = false;
			let awsInfrastructure: AWSResponse | undefined;
			let gcpInfrastructure: GCPResponse | undefined;

			if (hasAWS) {
				awsInfrastructure = await createRealAWSInfrastructure(credentials, events[0], webhookUrl);
				webhookData.awsInfrastructure = awsInfrastructure;
				useAWS = true;
			} else if (hasGCP) {
				gcpInfrastructure = await createGCPInfrastructure(credentials, webhookUrl, events[0]);
				webhookData.gcpInfrastructure = gcpInfrastructure;
				useGCP = true;
			}

			const response = (await createSubscription.call(this, {
				baseUrl,
				webhookUrl,
				awsInfrastructure,
				gcpInfrastructure,
				events,
				useAWS,
				useGCP,
			})) as IDataObject;

			const subscriptionId = response.id as string | undefined;
			if (!subscriptionId) {
				throw new NodeOperationError(
					this.getNode(),
					'commercetools did not return a subscription ID — check the project credentials and event selection.',
				);
			}

			webhookData.subscriptionId = subscriptionId;
			webhookData.events = events;
			webhookData.configHash = generateConfigHash(
				events,
				hasAWS,
				hasGCP,
				credentials.region,
				credentials.projectKey,
			);
			return true;
		},

		// ── delete ───────────────────────────────────────────────────────────
		delete: async function (this: IHookFunctions): Promise<boolean> {
			const webhookData = this.getWorkflowStaticData('node') as StaticSubscriptionData;
			const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as Record<
				string,
				string
			>;

			if (webhookData.subscriptionId) {
				try {
					const baseUrl = await getBaseUrl.call(this);
					const subscription = (await fetchSubscription.call(
						this,
						baseUrl,
						webhookData.subscriptionId,
					)) as IDataObject;
					const version = subscription.version as number | undefined;
					if (typeof version !== 'number') {
						throw new Error('Failed to resolve subscription version');
					}
					await deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
				} catch (err) {
					// WEBHOOK-BUG-2: warn instead of silently swallowing
					console.warn('[CT Trigger] Could not delete subscription:', (err as Error).message);
				}
			}

			if (webhookData.awsInfrastructure) {
				try {
					await deleteAWSInfrastructure(credentials, webhookData.awsInfrastructure as AWSResponse);
				} catch (err) {
					console.warn('[CT Trigger] Could not delete AWS infrastructure:', (err as Error).message);
				}
			} else if (webhookData.gcpInfrastructure) {
				try {
					await deleteGCPInfrastructure(credentials, webhookData.gcpInfrastructure as GCPResponse);
				} catch (err) {
					console.warn('[CT Trigger] Could not delete GCP infrastructure:', (err as Error).message);
				}
			}

			clearWebhookData(webhookData);
			return true;
		},
	},
};

// ─── Internal: tear down existing infra on config change ─────────────────────

async function tearDownExisting(
	ctx: IHookFunctions,
	webhookData: StaticSubscriptionData,
	credentials: Record<string, string>,
): Promise<void> {
	if (webhookData.subscriptionId) {
		try {
			const baseUrl = await getBaseUrl.call(ctx);
			const subscription = (await fetchSubscription.call(
				ctx,
				baseUrl,
				webhookData.subscriptionId,
			)) as IDataObject;
			await deleteSubscription.call(
				ctx,
				baseUrl,
				webhookData.subscriptionId,
				subscription.version as number,
			);
		} catch (err) {
			console.warn('[CT Trigger] Could not remove old subscription:', (err as Error).message);
		}
	}

	if (webhookData.awsInfrastructure) {
		try {
			await deleteAWSInfrastructure(credentials, webhookData.awsInfrastructure as AWSResponse);
		} catch (err) {
			console.warn('[CT Trigger] Could not remove old AWS infra:', (err as Error).message);
		}
	} else if (webhookData.gcpInfrastructure) {
		try {
			await deleteGCPInfrastructure(credentials, webhookData.gcpInfrastructure as GCPResponse);
		} catch (err) {
			console.warn('[CT Trigger] Could not remove old GCP infra:', (err as Error).message);
		}
	}
}
