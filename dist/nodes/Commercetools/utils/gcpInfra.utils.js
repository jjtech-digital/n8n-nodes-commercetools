"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGCPInfrastructure = void 0;
exports.parseCredentials = parseCredentials;
exports.buildAuthClient = buildAuthClient;
exports.createGCPInfrastructure = createGCPInfrastructure;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pubsub_1 = require("@google-cloud/pubsub");
const storage_1 = require("@google-cloud/storage");
const googleapis_1 = require("googleapis");
const adm_zip_1 = __importDefault(require("adm-zip"));
const n8n_workflow_1 = require("n8n-workflow");
var gcpDelete_utils_1 = require("./gcpDelete.utils");
Object.defineProperty(exports, "deleteGCPInfrastructure", { enumerable: true, get: function () { return gcpDelete_utils_1.deleteGCPInfrastructure; } });
function normalizePrivateKey(key) {
    return key
        .trim()
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}
function parseCredentials(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const jsonStr = (_b = (_a = raw.serviceAccountJson) !== null && _a !== void 0 ? _a : raw.serviceAccountKey) !== null && _b !== void 0 ? _b : '';
    if (jsonStr) {
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        }
        catch {
            throw new Error('GCP serviceAccountJson is not valid JSON — paste the entire key file as-is');
        }
        const projectId = (_d = (_c = parsed.project_id) !== null && _c !== void 0 ? _c : raw.gcpProjectId) !== null && _d !== void 0 ? _d : '';
        const clientEmail = (_e = parsed.client_email) !== null && _e !== void 0 ? _e : '';
        const privateKey = normalizePrivateKey((_f = parsed.private_key) !== null && _f !== void 0 ? _f : '');
        if (!projectId)
            throw new Error('GCP service account JSON missing project_id');
        if (!clientEmail)
            throw new Error('GCP service account JSON missing client_email');
        if (!privateKey)
            throw new Error('GCP service account JSON missing private_key');
        if (!privateKey.includes('-----BEGIN'))
            throw new Error('GCP private_key in JSON does not look like a valid PEM key');
        return { projectId, clientEmail, privateKey };
    }
    const projectId = (_g = raw.gcpProjectId) !== null && _g !== void 0 ? _g : '';
    const clientEmail = (_j = (_h = raw.clientEmail) !== null && _h !== void 0 ? _h : raw.client_email) !== null && _j !== void 0 ? _j : '';
    const privateKey = normalizePrivateKey((_l = (_k = raw.privateKey) !== null && _k !== void 0 ? _k : raw.private_key) !== null && _l !== void 0 ? _l : '');
    if (!projectId)
        throw new Error('GCP credential missing gcpProjectId');
    if (!clientEmail)
        throw new Error('GCP credential missing clientEmail');
    if (!privateKey || !privateKey.includes('-----BEGIN'))
        throw new Error('GCP privateKey does not look like a PEM key. Use the Service Account JSON field.');
    return { projectId, clientEmail, privateKey };
}
async function buildAuthClient(raw) {
    const creds = parseCredentials(raw);
    const jwtClient = new googleapis_1.google.auth.JWT({
        email: creds.clientEmail,
        key: creds.privateKey,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const tokenResponse = await jwtClient.authorize();
    if (!(tokenResponse === null || tokenResponse === void 0 ? void 0 : tokenResponse.access_token)) {
        throw new Error('GCP authentication failed: JWT authorize() returned no access_token.');
    }
    return { restAuth: jwtClient };
}
const GCP_HANDLER_PATH = path.resolve(__dirname, '../lambda/gcpHandler.js');
const PACKAGE_JSON = JSON.stringify({
    name: 'n8n-ct-webhook',
    version: '1.0.0',
    main: 'index.js',
    dependencies: { '@google-cloud/functions-framework': '^3.0.0' },
}, null, 2);
function buildFunctionZip() {
    const functionSource = fs.readFileSync(GCP_HANDLER_PATH, 'utf8');
    const zip = new adm_zip_1.default();
    zip.addFile('index.js', Buffer.from(functionSource, 'utf8'));
    zip.addFile('package.json', Buffer.from(PACKAGE_JSON, 'utf8'));
    return zip.toBuffer();
}
const PREBUILT_ZIP = buildFunctionZip();
const REQUIRED_APIS = [
    'cloudfunctions.googleapis.com',
    'cloudbuild.googleapis.com',
    'artifactregistry.googleapis.com',
    'run.googleapis.com',
    'eventarc.googleapis.com',
];
async function createGCPInfrastructure(gcpCredentials, webhookUrl, eventType, node) {
    const gcpRegion = gcpCredentials.gcpRegion;
    if (!gcpRegion) {
        throw new n8n_workflow_1.NodeOperationError(node, 'GCP credential is missing "gcpRegion". Select a deployment region.');
    }
    try {
        const creds = parseCredentials(gcpCredentials);
        const authPromise = buildAuthClient(gcpCredentials);
        const eventSlug = eventType.toLowerCase().slice(0, 30);
        const timestamp = Date.now();
        const topicName = `ct-${eventSlug}-${timestamp}`;
        const bucketName = `ct-${eventSlug}-bucket-${timestamp}`;
        const fnName = `ct-${eventSlug}-fn-${timestamp}`;
        const zipObject = `${fnName}.zip`;
        const url = new URL(webhookUrl);
        const { projectId, clientEmail, privateKey } = creds;
        const { restAuth } = await authPromise;
        const pubsub = new pubsub_1.PubSub({
            projectId,
            credentials: { client_email: clientEmail, private_key: privateKey },
        });
        const storage = new storage_1.Storage({
            projectId,
            credentials: { client_email: clientEmail, private_key: privateKey },
        });
        const pubsubApi = googleapis_1.google.pubsub({ version: 'v1', auth: restAuth });
        const bucket = storage.bucket(bucketName);
        await Promise.all([
            pubsub
                .topic(topicName)
                .get({ autoCreate: true })
                .then(() => pubsubApi.projects.topics.setIamPolicy({
                resource: `projects/${projectId}/topics/${topicName}`,
                requestBody: {
                    policy: {
                        bindings: [
                            {
                                role: 'roles/pubsub.publisher',
                                members: [
                                    'serviceAccount:subscriptions@commercetools-platform.iam.gserviceaccount.com',
                                ],
                            },
                        ],
                    },
                },
            })),
            bucket
                .create({ location: gcpRegion })
                .catch((err) => {
                if (err.code !== 409)
                    throw err;
            })
                .then(() => bucket
                .file(zipObject)
                .save(PREBUILT_ZIP, { contentType: 'application/zip', resumable: false })),
            enableRequiredApis(restAuth, projectId),
        ]);
        const cloudfunctions = googleapis_1.google.cloudfunctions({ version: 'v2', auth: restAuth });
        const parent = `projects/${projectId}/locations/${gcpRegion}`;
        const createOp = await cloudfunctions.projects.locations.functions.create({
            parent,
            functionId: fnName,
            requestBody: {
                name: `${parent}/functions/${fnName}`,
                buildConfig: {
                    runtime: 'nodejs20',
                    entryPoint: 'cloudFunctionCode',
                    source: { storageSource: { bucket: bucketName, object: zipObject } },
                },
                serviceConfig: {
                    timeoutSeconds: 300,
                    environmentVariables: { WEBHOOK_URL: url.toString() },
                },
                eventTrigger: {
                    triggerRegion: gcpRegion,
                    eventType: 'google.cloud.pubsub.topic.v1.messagePublished',
                    pubsubTopic: `projects/${projectId}/topics/${topicName}`,
                    retryPolicy: 'RETRY_POLICY_RETRY',
                },
            },
        });
        await pollUntilDone(() => cloudfunctions.projects.locations.operations.get({ name: createOp.data.name }), { initialDelayMs: 0, stepMs: 1000, maxDelayMs: 5000, backoffFactor: 1.5 });
        return { topicName, bucketName, projectId, functionName: fnName, region: gcpRegion };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new n8n_workflow_1.NodeOperationError(node, `Failed to create GCP infrastructure: ${msg}`);
    }
}
async function enableRequiredApis(auth, projectId) {
    const serviceusage = googleapis_1.google.serviceusage({ version: 'v1', auth });
    await Promise.all(REQUIRED_APIS.map(async (service) => {
        const name = `projects/${projectId}/services/${service}`;
        try {
            const { data } = await serviceusage.services.get({ name });
            if (data.state === 'ENABLED')
                return;
        }
        catch {
        }
        try {
            await serviceusage.services.enable({ name });
        }
        catch (err) {
            console.warn(`[CT GCP] Could not enable ${service}:`, err.message);
        }
    }));
}
async function pollUntilDone(getFn, opts) {
    var _a;
    const maxAttempts = (_a = opts.maxAttempts) !== null && _a !== void 0 ? _a : 120;
    let delay = opts.initialDelayMs;
    let attempts = 0;
    while (attempts < maxAttempts) {
        const [op] = await Promise.all([getFn(), new Promise((r) => setTimeout(r, delay))]);
        if (op.data.done) {
            if (op.data.error)
                throw new Error(`Deployment failed: ${JSON.stringify(op.data.error)}`);
            return;
        }
        attempts++;
        delay =
            delay === 0 ? opts.stepMs : Math.min(Math.ceil(delay * opts.backoffFactor), opts.maxDelayMs);
    }
    throw new Error(`Deployment timed out after ${maxAttempts} polling attempts`);
}
//# sourceMappingURL=gcpInfra.utils.js.map