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
exports.deleteAWSInfrastructure = void 0;
exports.createRealAWSInfrastructure = createRealAWSInfrastructure;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_iam_1 = require("@aws-sdk/client-iam");
const client_sts_1 = require("@aws-sdk/client-sts");
const n8n_workflow_1 = require("n8n-workflow");
var awsDelete_utils_1 = require("./awsDelete.utils");
Object.defineProperty(exports, "deleteAWSInfrastructure", { enumerable: true, get: function () { return awsDelete_utils_1.deleteAWSInfrastructure; } });
const LAMBDA_HANDLER_PATH = path.resolve(__dirname, '../lambda/awsHandler.js');
function buildLambdaZip() {
    const lambdaCode = fs.readFileSync(LAMBDA_HANDLER_PATH, 'utf8');
    const zip = new adm_zip_1.default();
    zip.addFile('index.js', Buffer.from(lambdaCode, 'utf8'));
    return zip.toBuffer();
}
async function createLambdaWithRoleRetry(lambdaClient, params) {
    var _a;
    const MAX_ATTEMPTS = 8;
    let delay = 2000;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            return await lambdaClient.send(new client_lambda_1.CreateFunctionCommand(params));
        }
        catch (err) {
            const e = err;
            if (e.name === 'InvalidParameterValueException' &&
                ((_a = e.message) === null || _a === void 0 ? void 0 : _a.includes('cannot be assumed')) &&
                attempt < MAX_ATTEMPTS - 1) {
                await new Promise((r) => setTimeout(r, delay));
                delay = Math.min(Math.ceil(delay * 1.5), 10000);
                continue;
            }
            throw err;
        }
    }
    throw new Error('Lambda role propagation timed out');
}
async function createRealAWSInfrastructure(awsCredentials, eventType, webhookUrl, node) {
    var _a, _b;
    if (!eventType || typeof eventType !== 'string') {
        throw new Error('eventType must be a non-empty string');
    }
    const timestamp = Date.now();
    const eventSlug = eventType.toLowerCase().slice(0, 25);
    const queueName = `ct-${eventSlug}-events-${timestamp}`;
    const lambdaName = `ct-${eventSlug}-processor-${timestamp}`;
    const roleName = `ct-${eventSlug}-lambda-role-${timestamp}`;
    try {
        const clientConfig = {
            credentials: {
                accessKeyId: awsCredentials.awsAccessKeyId,
                secretAccessKey: awsCredentials.awsSecretAccessKey,
            },
            region: awsCredentials.awsRegion,
        };
        const sqs = new client_sqs_1.SQSClient(clientConfig);
        const lambda = new client_lambda_1.LambdaClient(clientConfig);
        const iam = new client_iam_1.IAMClient(clientConfig);
        const sts = new client_sts_1.STSClient(clientConfig);
        const identity = await sts.send(new client_sts_1.GetCallerIdentityCommand({}));
        const accountId = identity.Account;
        const queueResult = await sqs.send(new client_sqs_1.CreateQueueCommand({
            QueueName: queueName,
            Attributes: {
                VisibilityTimeout: '300',
                MessageRetentionPeriod: '1209600',
                ReceiveMessageWaitTimeSeconds: '20',
            },
        }));
        const queueUrl = queueResult.QueueUrl;
        if (!queueUrl)
            throw new Error('SQS createQueue returned no QueueUrl');
        const attrResult = await sqs.send(new client_sqs_1.GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['QueueArn'] }));
        const queueArn = (_a = attrResult.Attributes) === null || _a === void 0 ? void 0 : _a.QueueArn;
        if (!queueArn)
            throw new Error('SQS getQueueAttributes returned no QueueArn');
        const CT_AWS_ACCOUNT_ID = '362576667341';
        const ctServiceAccountArn = `arn:aws:iam::${CT_AWS_ACCOUNT_ID}:root`;
        await sqs.send(new client_sqs_1.SetQueueAttributesCommand({
            QueueUrl: queueUrl,
            Attributes: {
                Policy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ctServiceAccountArn },
                            Action: 'sqs:SendMessage',
                            Resource: queueArn,
                        },
                    ],
                }),
            },
        }));
        const roleResult = await iam.send(new client_iam_1.CreateRoleCommand({
            RoleName: roleName,
            AssumeRolePolicyDocument: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { Service: 'lambda.amazonaws.com' },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            Description: `IAM role for CommerceTools ${eventType} Lambda processor`,
        }));
        const roleArn = (_b = roleResult.Role) === null || _b === void 0 ? void 0 : _b.Arn;
        if (!roleArn)
            throw new Error('IAM createRole returned no role ARN');
        await iam.send(new client_iam_1.AttachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }));
        await iam.send(new client_iam_1.PutRolePolicyCommand({
            RoleName: roleName,
            PolicyName: `${roleName}-cloudwatch-policy`,
            PolicyDocument: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                        Resource: `arn:aws:logs:${awsCredentials.awsRegion}:${accountId}:log-group:/aws/lambda/${lambdaName}:*`,
                    },
                ],
            }),
        }));
        await iam.send(new client_iam_1.PutRolePolicyCommand({
            RoleName: roleName,
            PolicyName: `${roleName}-sqs-policy`,
            PolicyDocument: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'sqs:ReceiveMessage',
                            'sqs:DeleteMessage',
                            'sqs:GetQueueAttributes',
                            'sqs:ChangeMessageVisibility',
                        ],
                        Resource: queueArn,
                    },
                ],
            }),
        }));
        const zipBuffer = buildLambdaZip();
        const lambdaResult = await createLambdaWithRoleRetry(lambda, {
            FunctionName: lambdaName,
            Runtime: 'nodejs22.x',
            Role: roleArn,
            Handler: 'index.handler',
            Code: { ZipFile: zipBuffer },
            Description: `CommerceTools ${eventType} event processor`,
            Timeout: 300,
            Environment: {
                Variables: {
                    CTP_PROJECT_KEY: awsCredentials === null || awsCredentials === void 0 ? void 0 : awsCredentials.projectKey,
                    EVENT_TYPE: eventType,
                    QUEUE_NAME: queueName,
                    WEBHOOK_URL: webhookUrl || '',
                },
            },
        });
        await (0, client_lambda_1.waitUntilFunctionActive)({ client: lambda, maxWaitTime: 60, minDelay: 5 }, { FunctionName: lambdaName });
        const mappingResult = await lambda.send(new client_lambda_1.CreateEventSourceMappingCommand({
            EventSourceArn: queueArn,
            FunctionName: lambdaName,
            BatchSize: 10,
            MaximumBatchingWindowInSeconds: 5,
            Enabled: true,
        }));
        return {
            queueUrl,
            queueArn,
            queueName,
            lambdaFunctionName: lambdaName,
            lambdaFunctionArn: lambdaResult.FunctionArn,
            iamRoleArn: roleArn,
            iamRoleName: roleName,
            eventSourceMappingUuid: mappingResult.UUID,
            eventType,
            region: awsCredentials.awsRegion,
            accountId,
            webhookUrl,
            created: true,
            createdAt: new Date().toISOString(),
        };
    }
    catch (err) {
        const e = err;
        if (e.name === 'InvalidClientTokenId' || e.name === 'SignatureDoesNotMatch') {
            throw new n8n_workflow_1.NodeOperationError(node, 'AWS credentials are invalid. Check your AWS Access Key ID and Secret Access Key.');
        }
        if (e.name === 'AccessDeniedException' || e.name === 'UnauthorizedOperation') {
            throw new n8n_workflow_1.NodeOperationError(node, 'AWS permissions denied. Ensure credentials have SQS, Lambda, and IAM permissions.');
        }
        throw new n8n_workflow_1.NodeOperationError(node, `Failed to create AWS infrastructure: ${err.message}`);
    }
}
//# sourceMappingURL=awsInfra.utils.js.map