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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAWSInfrastructure = verifyAWSInfrastructure;
exports.verifyGCPInfrastructure = verifyGCPInfrastructure;
const gcpInfra_utils_1 = require("./gcpInfra.utils");
async function verifyAWSInfrastructure(credentials, infra) {
    var _a;
    const { LambdaClient, GetFunctionConfigurationCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-lambda')));
    const { SQSClient, GetQueueAttributesCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-sqs')));
    const clientConfig = {
        credentials: {
            accessKeyId: credentials.awsAccessKeyId,
            secretAccessKey: credentials.awsSecretAccessKey,
        },
        region: (_a = infra.region) !== null && _a !== void 0 ? _a : 'us-east-1',
    };
    try {
        const lambda = new LambdaClient(clientConfig);
        const sqs = new SQSClient(clientConfig);
        await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: infra.lambdaFunctionName }));
        await sqs.send(new GetQueueAttributesCommand({
            QueueUrl: infra.queueUrl,
            AttributeNames: ['ApproximateNumberOfMessages'],
        }));
        return true;
    }
    catch {
        return false;
    }
}
async function verifyGCPInfrastructure(credentials, infra) {
    const { PubSub } = await Promise.resolve().then(() => __importStar(require('@google-cloud/pubsub')));
    const { Storage } = await Promise.resolve().then(() => __importStar(require('@google-cloud/storage')));
    const { google } = await Promise.resolve().then(() => __importStar(require('googleapis')));
    try {
        const creds = (0, gcpInfra_utils_1.parseCredentials)(credentials);
        const { restAuth } = await (0, gcpInfra_utils_1.buildAuthClient)(credentials);
        const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
        const fnFullName = `projects/${infra.projectId}/locations/${credentials.gcpRegion}/functions/${infra.functionName}`;
        try {
            await cloudfunctions.projects.locations.functions.get({ name: fnFullName });
        }
        catch (err) {
            const code = err.code;
            if (code === 5 || code === 404)
                return false;
            throw err;
        }
        const pubsub = new PubSub({
            projectId: infra.projectId,
            credentials: { client_email: creds.clientEmail, private_key: creds.privateKey },
        });
        const [topicExists] = await pubsub.topic(infra.topicName).exists();
        if (!topicExists)
            return false;
        const storage = new Storage({
            projectId: infra.projectId,
            credentials: { client_email: creds.clientEmail, private_key: creds.privateKey },
        });
        const [bucketExists] = await storage.bucket(infra.bucketName).exists();
        return bucketExists;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=cloudVerification.utils.js.map