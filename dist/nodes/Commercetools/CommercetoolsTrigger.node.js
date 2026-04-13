"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommercetoolsTrigger = void 0;
const crypto_1 = require("crypto");
const n8n_workflow_1 = require("n8n-workflow");
const subscription_properties_1 = require("./generated/subscription.properties");
const webhookMethods_utils_1 = require("./utils/webhookMethods.utils");
class CommercetoolsTrigger {
    constructor() {
        this.description = {
            usableAsTool: true,
            displayName: 'commercetools Trigger',
            name: 'commercetoolsTrigger',
            icon: 'file:Commercetools.svg',
            group: ['trigger'],
            version: 1,
            description: 'Listen for commercetools events. Automatically provisions AWS SQS + Lambda or GCP Pub/Sub + Cloud Functions when the respective credentials are provided.',
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
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
            properties: [...subscription_properties_1.triggerProperties],
        };
        this.webhookMethods = webhookMethods_utils_1.triggerMethods;
    }
    async webhook() {
        var _a;
        const req = this.getRequestObject();
        const credentials = await this.getCredentials('commerceToolsOAuth2Api');
        const secret = credentials.webhookSecret;
        if (secret) {
            const incoming = (_a = req.headers['x-webhook-secret']) !== null && _a !== void 0 ? _a : '';
            const expected = Buffer.from(secret, 'utf8');
            const received = Buffer.from(incoming, 'utf8');
            if (expected.length !== received.length || !(0, crypto_1.timingSafeEqual)(expected, received)) {
                return { noWebhookResponse: true };
            }
        }
        let processedBody;
        try {
            processedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }
        catch {
            return { noWebhookResponse: true };
        }
        return {
            workflowData: [this.helpers.returnJsonArray(processedBody)],
        };
    }
}
exports.CommercetoolsTrigger = CommercetoolsTrigger;
//# sourceMappingURL=CommercetoolsTrigger.node.js.map