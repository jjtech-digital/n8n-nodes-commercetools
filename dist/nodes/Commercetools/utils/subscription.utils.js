"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseUrl = getBaseUrl;
exports.fetchSubscription = fetchSubscription;
exports.deleteSubscription = deleteSubscription;
exports.createSubscription = createSubscription;
const n8n_workflow_1 = require("n8n-workflow");
const subscription_properties_1 = require("../generated/subscription.properties");
const EVENT_MAP = new Map();
for (const e of subscription_properties_1.subscriptionEvents) {
    EVENT_MAP.set(e.value, e);
}
async function getBaseUrl() {
    const credentials = (await this.getCredentials('commerceToolsOAuth2Api'));
    const projectKey = credentials.projectKey;
    const region = credentials.region;
    if (!projectKey) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'commercetools credential is missing "projectKey". Check your credential configuration.');
    }
    if (!region) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'commercetools credential is missing "region". Select a region in your credential configuration.');
    }
    return `https://api.${region}.commercetools.com/${projectKey}`;
}
async function fetchSubscription(baseUrl, subscriptionId) {
    if (!subscriptionId) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Cannot fetch subscription: subscriptionId is empty.');
    }
    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'GET',
        url: `${baseUrl}/subscriptions/${subscriptionId}`,
    });
}
async function deleteSubscription(baseUrl, subscriptionId, version) {
    if (!subscriptionId) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Cannot delete subscription: subscriptionId is empty.');
    }
    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'DELETE',
        url: `${baseUrl}/subscriptions/${subscriptionId}`,
        qs: { version },
    });
}
function buildSubscriptionBody(selectedValues) {
    var _a;
    const messageTypesByResource = new Map();
    const changeResourceIds = new Set();
    for (const value of selectedValues) {
        const event = EVENT_MAP.get(value);
        if (!(event === null || event === void 0 ? void 0 : event.resourceTypeId))
            continue;
        const { resourceTypeId, subscriptionType } = event;
        if (subscriptionType === 'message') {
            const types = (_a = messageTypesByResource.get(resourceTypeId)) !== null && _a !== void 0 ? _a : new Set();
            types.add(value);
            messageTypesByResource.set(resourceTypeId, types);
        }
        else if (subscriptionType === 'change') {
            changeResourceIds.add(resourceTypeId);
        }
    }
    const messages = Array.from(messageTypesByResource.entries()).map(([resourceTypeId, types]) => ({ resourceTypeId, types: Array.from(types) }));
    const changes = Array.from(changeResourceIds).map((resourceTypeId) => ({
        resourceTypeId,
    }));
    return { messages, changes };
}
async function createSubscription(params) {
    const { baseUrl, webhookUrl, awsInfrastructure, gcpInfrastructure, events, useAWS, useGCP } = params;
    const { messages, changes } = buildSubscriptionBody(events);
    let destination;
    if (useAWS && awsInfrastructure) {
        destination = {
            type: 'SQS',
            queueUrl: awsInfrastructure.queueUrl,
            region: awsInfrastructure.region,
            authenticationMode: 'IAM',
        };
    }
    else if (useGCP && gcpInfrastructure) {
        destination = {
            type: 'GoogleCloudPubSub',
            projectId: gcpInfrastructure.projectId,
            topic: gcpInfrastructure.topicName,
        };
    }
    else {
        destination = { type: 'HTTP', url: webhookUrl };
    }
    const body = { destination };
    if (messages.length > 0)
        body.messages = messages;
    if (changes.length > 0)
        body.changes = changes;
    if (!messages.length && !changes.length) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No valid subscription events selected. Choose at least one event from the Events dropdown.');
    }
    return this.helpers.httpRequestWithAuthentication.call(this, 'commerceToolsOAuth2Api', {
        method: 'POST',
        url: `${baseUrl}/subscriptions`,
        body,
    });
}
//# sourceMappingURL=subscription.utils.js.map