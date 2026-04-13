"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGCPInfrastructure = deleteGCPInfrastructure;
const n8n_workflow_1 = require("n8n-workflow");
const pubsub_1 = require("@google-cloud/pubsub");
const storage_1 = require("@google-cloud/storage");
const googleapis_1 = require("googleapis");
const gcpInfra_utils_1 = require("./gcpInfra.utils");
async function deleteGCPInfrastructure(gcpCredentials, infrastructure, node) {
    var _a;
    try {
        const creds = (0, gcpInfra_utils_1.parseCredentials)(gcpCredentials);
        const { restAuth } = await (0, gcpInfra_utils_1.buildAuthClient)(gcpCredentials);
        const { clientEmail, privateKey } = creds;
        const cloudfunctions = googleapis_1.google.cloudfunctions({ version: 'v2', auth: restAuth });
        const pubsub = new pubsub_1.PubSub({
            projectId: infrastructure.projectId,
            credentials: { client_email: clientEmail, private_key: privateKey },
        });
        const storage = new storage_1.Storage({
            projectId: infrastructure.projectId,
            credentials: { client_email: clientEmail, private_key: privateKey },
        });
        const region = (_a = infrastructure.region) !== null && _a !== void 0 ? _a : gcpCredentials.gcpRegion;
        const results = await Promise.allSettled([
            cloudfunctions.projects.locations.functions
                .delete({
                name: `projects/${infrastructure.projectId}/locations/${region}/functions/${infrastructure.functionName}`,
            })
                .catch((err) => {
                const code = err.code;
                if (code !== 5 && code !== 404)
                    throw err;
            }),
            pubsub
                .topic(infrastructure.topicName)
                .delete()
                .catch((err) => {
                const code = err.code;
                if (code !== 5 && code !== 404)
                    throw err;
            }),
            (async () => {
                const bucket = storage.bucket(infrastructure.bucketName);
                await bucket.deleteFiles({ force: true });
                await bucket.delete();
            })().catch((err) => {
                const code = err.code;
                if (code !== 5 && code !== 404)
                    throw err;
            }),
        ]);
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length) {
            const msgs = failed.map((f) => { var _a, _b; return (_b = (_a = f.reason) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : String(f.reason); }).join('; ');
            throw new Error(msgs);
        }
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new n8n_workflow_1.NodeOperationError(node !== null && node !== void 0 ? node : {}, `Failed to delete GCP infrastructure: ${msg}. You may need to manually clean up in GCP Console.`);
    }
}
//# sourceMappingURL=gcpDelete.utils.js.map