import { IDataObject, IHookFunctions, NodeOperationError } from 'n8n-workflow';
import {
	createSubscription,
	deleteSubscription,
	fetchSubscription,
	getBaseUrl,
} from './subscription.utils';
import AWS from 'aws-sdk';
import {
	AWSResponse,
	createRealAWSInfrastructure,
	deleteAWSInfrastructure,
} from './awsInfra.utils';
import { StaticSubscriptionData } from '../CommercetoolsTrigger.node';
import {
	buildAuthClient,
	createGCPInfrastructure,
	deleteGCPInfrastructure,
	GCPResponse,
} from './gcpInfra.utils';
import { PubSub } from '@google-cloud/pubsub';
import { Storage, StorageOptions } from '@google-cloud/storage';
import { google } from 'googleapis';
// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateConfigHash(events: string[], hasAWS: boolean, hasGCP: boolean): string {
	return JSON.stringify({ events: [...events].sort(), hasAWS, hasGCP });
}
/** Clear all stored webhook state in one place to avoid missed deletes. */
function clearWebhookData(webhookData: StaticSubscriptionData): void {
	delete webhookData.subscriptionId;
	delete webhookData.awsInfrastructure;
	delete webhookData.gcpInfrastructure;
	delete webhookData.configHash;
	delete webhookData.events;
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
			const hasAWS = !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey);
			const hasGCP = !!credentials.gcpProjectId;
			const currentHash = generateConfigHash(currentEvents, hasAWS, hasGCP);
			// No subscription stored yet
			if (!webhookData.subscriptionId) return false;
			// Config changed — delete old infrastructure then let create() rebuild
			if (webhookData.configHash !== currentHash) {
				try {
					const baseUrl = await getBaseUrl.call(this);
					const subscription = (await fetchSubscription.call(
						this,
						baseUrl,
						webhookData.subscriptionId,
					)) as IDataObject;
					await deleteSubscription.call(
						this,
						baseUrl,
						webhookData.subscriptionId,
						subscription.version as number,
					);
				} catch {
					/* best-effort */
				}
				if (webhookData.awsInfrastructure) {
					try {
						await deleteAWSInfrastructure(credentials, webhookData.awsInfrastructure);
					} catch {
						/* best-effort */
					}
				} else if (webhookData.gcpInfrastructure) {
					try {
						await deleteGCPInfrastructure(
							credentials,
							webhookData.gcpInfrastructure as GCPResponse,
						);
					} catch {
						/* best-effort */
					}
				}
				clearWebhookData(webhookData);
				return false;
			}
			// Config unchanged — verify everything still exists in the cloud
			try {
				const baseUrl = await getBaseUrl.call(this);
				await fetchSubscription.call(this, baseUrl, webhookData.subscriptionId);
				if (webhookData.awsInfrastructure) {
					// ── Verify AWS ────────────────────────────────────────────
					try {
						AWS.config.update({
							accessKeyId: credentials.awsAccessKeyId,
							secretAccessKey: credentials.awsSecretAccessKey,
							region: (webhookData.awsInfrastructure as AWSResponse).region || 'us-east-1',
						});
						const lambda = new AWS.Lambda();
						const sqs = new AWS.SQS();
						await lambda
							.getFunctionConfiguration({
								FunctionName: (webhookData.awsInfrastructure as AWSResponse)
									.lambdaFunctionName as string,
							})
							.promise();
						await sqs
							.getQueueAttributes({
								QueueUrl: (webhookData.awsInfrastructure as AWSResponse).queueUrl as string,
								AttributeNames: ['ApproximateNumberOfMessages'],
							})
							.promise();
					} catch {
						clearWebhookData(webhookData);
						return false;
					}
				} else if (webhookData.gcpInfrastructure) {
					// ── Verify GCP — use authClient, never bare google.auth.getClient() ──
					try {
						const { grpcAuth, restAuth } = await buildAuthClient(credentials);
						const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
						const infra = webhookData.gcpInfrastructure as GCPResponse;
						const fnFullName = `projects/${infra.projectId}/locations/${credentials.gcpRegion}/functions/${infra.functionName}`;
						try {
							await cloudfunctions.projects.locations.functions.get({ name: fnFullName });
						} catch (err) {
							if (err.code === 5) {
								clearWebhookData(webhookData);
								return false;
							}
							throw err;
						}
						const pubsub = new PubSub({ projectId: infra.projectId, authClient: grpcAuth });
						const [topicExists] = await pubsub.topic(infra.topicName).exists();
						if (!topicExists) {
							clearWebhookData(webhookData);
							return false;
						}
						const storage = new Storage({
							projectId: infra.projectId,
							authClient: grpcAuth,
						} as unknown as StorageOptions);
						const [bucketExists] = await storage.bucket(infra.bucketName).exists();
						if (!bucketExists) {
							clearWebhookData(webhookData);
							return false;
						}
					} catch {
						clearWebhookData(webhookData);
						return false;
					}
				}
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
			const hasAWS = !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey);
			const hasGCP = !!(
				credentials.gcpProjectId &&
				credentials.privateKey &&
				credentials.clientEmail
			);
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
					'Commercetools did not return a subscription identifier',
				);
			}
			webhookData.subscriptionId = subscriptionId;
			webhookData.events = events;
			webhookData.configHash = generateConfigHash(events, hasAWS, hasGCP);
			// Optional: smoke-test Lambda
			if (useAWS && awsInfrastructure) {
				try {
					AWS.config.update({
						accessKeyId: credentials.awsAccessKeyId,
						secretAccessKey: credentials.awsSecretAccessKey,
						region: awsInfrastructure.region,
					});	
				} catch {
					/* best-effort */
				}
			}
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
						throw new NodeOperationError(this.getNode(), 'Failed to resolve subscription version');
					}
					await deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
				} catch {
					/* best-effort */
				}
			}
			if (webhookData.awsInfrastructure) {
				try {
					await deleteAWSInfrastructure(credentials, webhookData.awsInfrastructure);
				} catch {
					/* best-effort */
				}
			} else if (webhookData.gcpInfrastructure) {
				try {
					await deleteGCPInfrastructure(credentials, webhookData.gcpInfrastructure as GCPResponse);
				} catch {
					/* best-effort */
				}
			}
			clearWebhookData(webhookData);
			return true;
		},
	},
};
