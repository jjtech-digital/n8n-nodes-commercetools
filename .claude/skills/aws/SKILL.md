---
name: aws
description: Provisions and manages AWS SQS, Lambda, and IAM cloud infrastructure for commercetools event buffering in the n8n trigger node
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Aws Skill

Handles AWS infrastructure provisioning and teardown for the commercetools trigger node. When AWS credentials are present, the trigger node auto-provisions an SQS queue, a Lambda function, and an IAM role with least-privilege policies. The Lambda forwards SQS messages to the n8n webhook URL. All resources are torn down on workflow deactivation or config change.

## Quick Start

1. Set `awsAccessKeyId`, `awsSecretAccessKey`, and `awsRegion` in the commercetools credential UI
2. Create a trigger workflow and activate it — SQS + Lambda are provisioned automatically
3. Send a test event from commercetools and check CloudWatch logs to verify Lambda execution
4. Deactivate the workflow to tear down all AWS resources

## Key Concepts

- **Infrastructure module:** `nodes/Commercetools/utils/awsInfra.utils.ts` — all SQS, Lambda, and IAM provisioning logic lives here
- **Lifecycle owner:** `nodes/Commercetools/utils/webhookMethods.utils.ts` — calls `provisionAws` on `create` and `teardownAws` on `delete`
- **Config hash:** A hash of `{ events, hasAWS, hasGCP }` is stored in workflow static data; a mismatch triggers teardown + reprovision
- **SQS queue:** 14-day retention, long polling enabled, named deterministically from workflow/node IDs
- **Lambda function:** Node.js runtime, reads `WEBHOOK_URL` env var, POSTs each SQS message body to n8n
- **IAM role:** Created per-deployment with inline policies for SQS `ReceiveMessage`/`DeleteMessage` and CloudWatch Logs writes
- **Event source mapping:** Batch size 10, SQS → Lambda, created after both resources are ready

## Common Patterns

### Read the provisioning implementation
```bash
# View the full AWS infrastructure utility
cat nodes/Commercetools/utils/awsInfra.utils.ts
```

### Trace the activation flow
```bash
# Find where provisionAws is called
grep -n "provisionAws\|teardownAws\|awsInfra" nodes/Commercetools/utils/webhookMethods.utils.ts
```

### Check stored infrastructure state
```bash
# Find static data keys used for AWS resource IDs
grep -n "staticData\|queueUrl\|functionArn\|roleArn" nodes/Commercetools/utils/awsInfra.utils.ts
```

### Verify IAM policy scope
```bash
# Review what permissions the IAM role grants
grep -n "PolicyDocument\|Action\|Effect" nodes/Commercetools/utils/awsInfra.utils.ts
```

### Debug a provisioning failure
1. Check CloudWatch Logs for the Lambda function name (derived from workflow/node IDs)
2. Verify IAM credentials have permissions for: `sqs:*`, `lambda:*`, `iam:CreateRole`, `iam:AttachRolePolicy`, `logs:*`
3. Confirm the n8n webhook URL is publicly reachable before the Lambda tries to forward events
4. Re-activate the workflow to trigger a fresh provisioning cycle — teardown runs first if partial state exists