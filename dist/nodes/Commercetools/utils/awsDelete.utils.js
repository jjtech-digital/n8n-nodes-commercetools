"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAWSInfrastructure = deleteAWSInfrastructure;
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_iam_1 = require("@aws-sdk/client-iam");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const n8n_workflow_1 = require("n8n-workflow");
async function deleteAWSInfrastructure(awsCredentials, infrastructure, node) {
    try {
        const clientConfig = {
            credentials: {
                accessKeyId: awsCredentials.awsAccessKeyId,
                secretAccessKey: awsCredentials.awsSecretAccessKey,
            },
            region: infrastructure.region,
        };
        const lambda = new client_lambda_1.LambdaClient(clientConfig);
        const sqs = new client_sqs_1.SQSClient(clientConfig);
        const iam = new client_iam_1.IAMClient(clientConfig);
        if (infrastructure.eventSourceMappingUuid) {
            try {
                await lambda.send(new client_lambda_1.DeleteEventSourceMappingCommand({ UUID: infrastructure.eventSourceMappingUuid }));
            }
            catch (err) {
                console.warn('[CT AWS] Could not delete event source mapping:', err.message);
            }
        }
        if (infrastructure.lambdaFunctionName) {
            try {
                await lambda.send(new client_lambda_1.DeleteFunctionCommand({ FunctionName: infrastructure.lambdaFunctionName }));
            }
            catch (err) {
                console.warn('[CT AWS] Could not delete Lambda function:', err.message);
            }
        }
        if (infrastructure.queueUrl) {
            try {
                await sqs.send(new client_sqs_1.DeleteQueueCommand({ QueueUrl: infrastructure.queueUrl }));
            }
            catch (err) {
                console.warn('[CT AWS] Could not delete SQS queue:', err.message);
            }
        }
        if (infrastructure.iamRoleName) {
            await deleteIamRole(iam, infrastructure, clientConfig);
        }
    }
    catch (err) {
        throw new n8n_workflow_1.NodeOperationError(node !== null && node !== void 0 ? node : {}, `Failed to delete AWS infrastructure: ${err.message}. ` +
            `You may need to manually clean up resources in the AWS Console.`);
    }
}
async function deleteIamRole(iam, infrastructure, clientConfig) {
    const roleName = infrastructure.iamRoleName;
    for (const suffix of ['-cloudwatch-policy', '-sqs-policy']) {
        try {
            await iam.send(new client_iam_1.DeleteRolePolicyCommand({ RoleName: roleName, PolicyName: `${roleName}${suffix}` }));
        }
        catch (err) {
            console.warn(`[CT AWS] Could not delete inline policy ${suffix}:`, err.message);
        }
    }
    if (infrastructure.lambdaFunctionName) {
        const cwl = new client_cloudwatch_logs_1.CloudWatchLogsClient(clientConfig);
        try {
            await cwl.send(new client_cloudwatch_logs_1.DeleteLogGroupCommand({
                logGroupName: `/aws/lambda/${infrastructure.lambdaFunctionName}`,
            }));
        }
        catch (err) {
            console.warn('[CT AWS] Could not delete CloudWatch log group:', err.message);
        }
    }
    try {
        await iam.send(new client_iam_1.DetachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }));
    }
    catch (err) {
        console.warn('[CT AWS] Could not detach managed policy:', err.message);
    }
    try {
        await iam.send(new client_iam_1.DeleteRoleCommand({ RoleName: roleName }));
    }
    catch (err) {
        console.warn('[CT AWS] Could not delete IAM role:', err.message);
    }
}
//# sourceMappingURL=awsDelete.utils.js.map