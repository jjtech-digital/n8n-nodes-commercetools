"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerMethods = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const subscription_utils_1 = require("./subscription.utils");
const awsInfra_utils_1 = require("./awsInfra.utils");
const gcpInfra_utils_1 = require("./gcpInfra.utils");
const cloudVerification_utils_1 = require("./cloudVerification.utils");
function generateConfigHash(events, hasAWS, hasGCP, region, projectKey) {
    return JSON.stringify({ events: [...events].sort(), hasAWS, hasGCP, region, projectKey });
}
function clearWebhookData(webhookData) {
    delete webhookData.subscriptionId;
    delete webhookData.awsInfrastructure;
    delete webhookData.gcpInfrastructure;
    delete webhookData.configHash;
    delete webhookData.events;
    delete webhookData.lastVerifiedAt;
}
function detectCloudProvider(credentials) {
    return {
        hasAWS: !!(credentials.awsAccessKeyId && credentials.awsSecretAccessKey),
        hasGCP: !!credentials.serviceAccountJson,
    };
}
exports.triggerMethods = {
    default: {
        checkExists: async function () {
            const webhookData = this.getWorkflowStaticData('node');
            const credentials = (await this.getCredentials('commerceToolsOAuth2Api'));
            const eventsRaw = this.getNodeParameter('events');
            const currentEvents = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
            const { hasAWS, hasGCP } = detectCloudProvider(credentials);
            const currentHash = generateConfigHash(currentEvents, hasAWS, hasGCP, credentials.region, credentials.projectKey);
            if (!webhookData.subscriptionId)
                return false;
            if (webhookData.configHash !== currentHash) {
                await tearDownExisting(this, webhookData, credentials);
                clearWebhookData(webhookData);
                return false;
            }
            const VERIFY_INTERVAL_MS = 5 * 60 * 1000;
            if (webhookData.lastVerifiedAt &&
                Date.now() - webhookData.lastVerifiedAt < VERIFY_INTERVAL_MS) {
                return true;
            }
            try {
                const baseUrl = await subscription_utils_1.getBaseUrl.call(this);
                await subscription_utils_1.fetchSubscription.call(this, baseUrl, webhookData.subscriptionId);
                if (webhookData.awsInfrastructure) {
                    const ok = await (0, cloudVerification_utils_1.verifyAWSInfrastructure)(credentials, webhookData.awsInfrastructure);
                    if (!ok) {
                        clearWebhookData(webhookData);
                        return false;
                    }
                }
                else if (webhookData.gcpInfrastructure) {
                    const ok = await (0, cloudVerification_utils_1.verifyGCPInfrastructure)(credentials, webhookData.gcpInfrastructure);
                    if (!ok) {
                        clearWebhookData(webhookData);
                        return false;
                    }
                }
                webhookData.lastVerifiedAt = Date.now();
                return true;
            }
            catch {
                clearWebhookData(webhookData);
                return false;
            }
        },
        create: async function () {
            const eventsRaw = this.getNodeParameter('events');
            const events = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
            if (!events.length) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'At least one event must be selected');
            }
            const credentials = (await this.getCredentials('commerceToolsOAuth2Api'));
            const { hasAWS, hasGCP } = detectCloudProvider(credentials);
            const webhookData = this.getWorkflowStaticData('node');
            const baseUrl = await subscription_utils_1.getBaseUrl.call(this);
            const webhookUrl = this.getNodeWebhookUrl('default');
            if (!webhookUrl) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Failed to determine the webhook URL');
            }
            let useAWS = false;
            let useGCP = false;
            let awsInfrastructure;
            let gcpInfrastructure;
            if (hasAWS) {
                awsInfrastructure = await (0, awsInfra_utils_1.createRealAWSInfrastructure)(credentials, events[0], webhookUrl);
                webhookData.awsInfrastructure = awsInfrastructure;
                useAWS = true;
            }
            else if (hasGCP) {
                gcpInfrastructure = await (0, gcpInfra_utils_1.createGCPInfrastructure)(credentials, webhookUrl, events[0]);
                webhookData.gcpInfrastructure = gcpInfrastructure;
                useGCP = true;
            }
            const response = (await subscription_utils_1.createSubscription.call(this, {
                baseUrl,
                webhookUrl,
                awsInfrastructure,
                gcpInfrastructure,
                events,
                useAWS,
                useGCP,
            }));
            const subscriptionId = response.id;
            if (!subscriptionId) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'commercetools did not return a subscription ID — check the project credentials and event selection.');
            }
            webhookData.subscriptionId = subscriptionId;
            webhookData.events = events;
            webhookData.configHash = generateConfigHash(events, hasAWS, hasGCP, credentials.region, credentials.projectKey);
            return true;
        },
        delete: async function () {
            const webhookData = this.getWorkflowStaticData('node');
            const credentials = (await this.getCredentials('commerceToolsOAuth2Api'));
            if (webhookData.subscriptionId) {
                try {
                    const baseUrl = await subscription_utils_1.getBaseUrl.call(this);
                    const subscription = (await subscription_utils_1.fetchSubscription.call(this, baseUrl, webhookData.subscriptionId));
                    const version = subscription.version;
                    if (typeof version !== 'number') {
                        throw new Error('Failed to resolve subscription version');
                    }
                    await subscription_utils_1.deleteSubscription.call(this, baseUrl, webhookData.subscriptionId, version);
                }
                catch (err) {
                    console.warn('[CT Trigger] Could not delete subscription:', err.message);
                }
            }
            if (webhookData.awsInfrastructure) {
                try {
                    await (0, awsInfra_utils_1.deleteAWSInfrastructure)(credentials, webhookData.awsInfrastructure);
                }
                catch (err) {
                    console.warn('[CT Trigger] Could not delete AWS infrastructure:', err.message);
                }
            }
            else if (webhookData.gcpInfrastructure) {
                try {
                    await (0, gcpInfra_utils_1.deleteGCPInfrastructure)(credentials, webhookData.gcpInfrastructure);
                }
                catch (err) {
                    console.warn('[CT Trigger] Could not delete GCP infrastructure:', err.message);
                }
            }
            clearWebhookData(webhookData);
            return true;
        },
    },
};
async function tearDownExisting(ctx, webhookData, credentials) {
    if (webhookData.subscriptionId) {
        try {
            const baseUrl = await subscription_utils_1.getBaseUrl.call(ctx);
            const subscription = (await subscription_utils_1.fetchSubscription.call(ctx, baseUrl, webhookData.subscriptionId));
            await subscription_utils_1.deleteSubscription.call(ctx, baseUrl, webhookData.subscriptionId, subscription.version);
        }
        catch (err) {
            console.warn('[CT Trigger] Could not remove old subscription:', err.message);
        }
    }
    if (webhookData.awsInfrastructure) {
        try {
            await (0, awsInfra_utils_1.deleteAWSInfrastructure)(credentials, webhookData.awsInfrastructure);
        }
        catch (err) {
            console.warn('[CT Trigger] Could not remove old AWS infra:', err.message);
        }
    }
    else if (webhookData.gcpInfrastructure) {
        try {
            await (0, gcpInfra_utils_1.deleteGCPInfrastructure)(credentials, webhookData.gcpInfrastructure);
        }
        catch (err) {
            console.warn('[CT Trigger] Could not remove old GCP infra:', err.message);
        }
    }
}
//# sourceMappingURL=webhookMethods.utils.js.map