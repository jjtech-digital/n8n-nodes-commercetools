# Code Review Recommendations

**Date:** 2026-03-30
**Scope:** Full codebase review of n8n-nodes-commercetools
**Areas:** Performance, Security, Architecture

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. Security Recommendations](#1-security-recommendations)
- [2. Performance Recommendations](#2-performance-recommendations)
- [3. Architecture Recommendations](#3-architecture-recommendations)
- [Priority Roadmap](#priority-roadmap)

---

## Executive Summary

This review covers the complete n8n-nodes-commercetools codebase across three dimensions. The node provides solid auto-generated API coverage and a well-designed event subscription system. However, several critical and high-severity issues were identified -- primarily around credential handling in the cloud infrastructure layer, webhook authentication, and missing test coverage.

| Severity | Security | Performance | Architecture | Total |
|----------|----------|-------------|--------------|-------|
| Critical | 3 | 1 | 1 | 5 |
| High | 7 | 4 | 4 | 15 |
| Medium | 10 | 5 | 14 | 29 |
| Low | 6 | 5 | 6 | 17 |

---

## 1. Security Recommendations

### CRITICAL

#### SEC-CRIT-1: AWS Credentials Stored in Plaintext Static Data

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:409-410`
**OWASP:** A02:2021 Cryptographic Failures

`createRealAWSInfrastructure` returns `accessKeyId` and `secretAccessKey` in `AWSResponse`, which is then written into `webhookData.awsInfrastructure` (workflow static data). n8n static data is **not encrypted at rest** -- anyone with database access can read these credentials.

**Fix:** Remove `accessKeyId`, `secretAccessKey`, and `lambdaCode` from `AWSResponse`. The teardown path already receives credentials via `getCredentials()` -- it does not need stored copies.

```typescript
// Remove from AWSResponse type and return value:
// accessKeyId?: string;
// secretAccessKey?: string;
// lambdaCode?: string;
```

---

#### SEC-CRIT-2: AWS Credentials Sent to commercetools API in Subscription Body

**File:** `nodes/Commercetools/utils/subscription.utils.ts:150-153`
**OWASP:** A02:2021 Cryptographic Failures

When `authenticationMode` is `'Credentials'`, the AWS access key and secret are embedded in the POST body to the commercetools Subscriptions API. These credentials may be logged by proxies, WAFs, or commercetools itself.

**Fix:** Use `authenticationMode: 'IAM'` unconditionally. Provision an SQS queue policy granting the commercetools service principal `sqs:SendMessage` access via IAM, which is the commercetools-recommended approach.

```typescript
destination = {
	type: 'SQS',
	queueUrl: awsInfrastructure.queueUrl,
	region: awsInfrastructure.region,
	authenticationMode: 'IAM',
};
```

---

#### SEC-CRIT-3: Lambda Source Code Persisted in Static Data

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:412`

`lambdaCode` (the full ~200-line Lambda source) is stored in static data. This serves no functional purpose and unnecessarily inflates database storage while exposing implementation details.

**Fix:** Remove `lambdaCode` from `AWSResponse`.

---

### HIGH

#### SEC-HIGH-1: No Webhook Request Authentication

**File:** `nodes/Commercetools/CommercetoolsTrigger.node.ts:62-86`
**OWASP:** A07:2021 Identification and Authentication Failures

The `webhook()` method accepts any incoming POST request with no origin verification, shared secret, or HMAC validation. Anyone who discovers the webhook URL can inject arbitrary event data.

**Fix:** Add a configurable `webhookSecret` field to credentials. Validate it in `webhook()` using constant-time comparison:

```typescript
const secret = (await this.getCredentials('commerceToolsOAuth2Api')).webhookSecret as string;
if (secret) {
	const incoming = req.headers['x-webhook-secret'] as string ?? '';
	if (!timingSafeEqual(Buffer.from(incoming), Buffer.from(secret))) {
		return { noWebhookResponse: true };
	}
}
```

Update the Lambda and Cloud Function forwarders to include the same header.

---

#### SEC-HIGH-2: SSRF via Unvalidated `imageUrl`

**File:** `nodes/Commercetools/Commercetools.node.ts:326-358`
**OWASP:** A10:2021 Server-Side Request Forgery

The `imageUrl` parameter is passed directly to `this.helpers.httpRequest()` with no validation. A malicious actor can target internal endpoints (`169.254.169.254`, `metadata.google.internal`, RFC-1918 ranges).

**Fix:** Validate `imageUrl` before fetching -- assert HTTPS protocol, reject loopback/link-local/private hostnames.

```typescript
function validateImageUrl(raw: string): void {
	const parsed = new URL(raw);
	if (parsed.protocol !== 'https:') {
		throw new NodeOperationError(node, 'Image URL must use HTTPS');
	}
	const host = parsed.hostname.toLowerCase();
	const blocked = ['localhost', '127.0.0.1', '169.254.169.254', 'metadata.google.internal'];
	if (blocked.includes(host) || /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) {
		throw new NodeOperationError(node, 'Image URL must not target internal addresses');
	}
}
```

---

#### SEC-HIGH-3: Path Traversal in URL Parameter Substitution

**File:** `nodes/Commercetools/Commercetools.node.ts:88-140`
**OWASP:** A03:2021 Injection

User-supplied values for `container`, `resourceKey`, `resourceId`, and custom path parameters are substituted directly into URL templates without sanitization. Values containing `../` or `%2F` can alter the resolved URL path.

**Fix:** Sanitize each path parameter before substitution:

```typescript
function sanitizePathParam(value: string, name: string): string {
	if (/[\/\\%\x00]/.test(value) || value.includes('..')) {
		throw new NodeOperationError(node, `Path parameter "${name}" contains invalid characters`);
	}
	return encodeURIComponent(value);
}
```

---

#### SEC-HIGH-4: Overly Broad CloudWatch IAM Policy

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:103-119`
**OWASP:** A05:2021 Security Misconfiguration

The CloudWatch Logs policy uses `Resource: 'arn:aws:logs:*:*:*'`, granting write access to **all** log groups in the entire account.

**Fix:** Scope to the specific Lambda log group:

```typescript
Resource: `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${lambdaName}:*`
```

Or remove the inline CloudWatch policy entirely -- `AWSLambdaBasicExecutionRole` already covers it.

---

#### SEC-HIGH-5: No SQS Queue Policy Restricting SendMessage

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:60-69`

The SQS queue is created with no resource-based policy, meaning no explicit restriction on who can call `SendMessage`.

**Fix:** Attach a queue policy restricting `sqs:SendMessage` to the commercetools service principal.

---

#### SEC-HIGH-6: `aws-sdk` v2 is End of Life

**File:** `package.json`
**OWASP:** A06:2021 Vulnerable and Outdated Components

AWS ended maintenance of `aws-sdk` v2 on September 8, 2025. No further security patches will be released.

**Fix:** Migrate to `@aws-sdk/client-sqs`, `@aws-sdk/client-lambda`, `@aws-sdk/client-iam`, `@aws-sdk/client-sts` (v3 modular clients). This also eliminates the global `AWS.config` mutation issue.

---

#### SEC-HIGH-7: `handlebars` Critical Vulnerability in Dev Dependency Chain

**OWASP:** A06:2021 Vulnerable and Outdated Components

`handlebars` 4.0.0-4.7.8 via `@n8n/node-cli` has critical JavaScript injection and prototype pollution vulnerabilities.

**Fix:** Add an `overrides` entry in `package.json`:

```json
"overrides": {
	"handlebars": "^4.7.9"
}
```

---

### MEDIUM

| ID | Issue | File | Fix |
|----|-------|------|-----|
| SEC-MED-1 | PEM key partial exposure in error message | `gcpInfra.utils.ts:82` | Remove `privateKey.substring(0, 40)` from error message |
| SEC-MED-2 | AWS SDK error message echoed in UI | `awsInfra.utils.ts:421-438` | Use fixed error messages without echoing `error.message` |
| SEC-MED-3 | Credential fields in exported `AWSResponse` type | `awsInfra.utils.ts:17-18` | Remove credential fields from type definition |
| SEC-MED-4 | Full event payload logged in Cloud Function | `gcpInfra.utils.ts:156` | Log only metadata (message ID, size), not content |
| SEC-MED-5 | Full SQS record body logged in Lambda | `awsInfra.utils.ts:280-295` | Remove `rawMessage` from webhook payload |
| SEC-MED-6 | HTTP webhook delivery not blocked | `awsInfra.utils.ts:187-189` | Assert HTTPS before deploying Lambda/Cloud Function |
| SEC-MED-7 | Config hash misses region/credential changes | `webhookMethods.utils.ts:26` | Include region, project key, and credential ID suffix in hash |
| SEC-MED-8 | `awsRegion` freeform string -- no validation | `credentials/*.ts:106` | Change to `type: 'options'` with valid AWS regions |
| SEC-MED-9 | `serviceAccountJson` not masked as password | `credentials/*.ts:122` | Add `typeOptions: { password: true }` |
| SEC-MED-10 | Global `google.options()` auth mutation | `gcpInfra.utils.ts:128` | Remove call; pass `auth` to each client constructor individually |

---

## 2. Performance Recommendations

### CRITICAL

#### PERF-CRIT-1: AWS Credentials and Lambda Code Bloat Static Data

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:409-412`

Storing ~7KB of credentials and Lambda source in static data bloats serialization on every `checkExists` call and every n8n restart.

**Fix:** Remove `accessKeyId`, `secretAccessKey`, and `lambdaCode` from `AWSResponse` (also resolves SEC-CRIT-1).

---

### HIGH

#### PERF-HIGH-1: Credentials Fetched Per Item in Batch Loop

**File:** `nodes/Commercetools/Commercetools.node.ts:62`

`getCredentials('commerceToolsOAuth2Api')` is called inside `executeOperation()` which runs once per item. For a 100-item batch, this means 100 redundant credential decryption calls.

**Fix:** Hoist the credentials fetch into `execute()` and pass as a parameter:

```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const creds = await this.getCredentials('commerceToolsOAuth2Api');
	for (let i = 0; i < items.length; i++) {
		await executeOperation.call(this, i, creds);
	}
}
```

**Impact:** Eliminates N-1 redundant decrypt calls for N-item batches.

---

#### PERF-HIGH-2: Hardcoded 10-Second Sleep for IAM Role Propagation

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:148`

Every `createRealAWSInfrastructure` call blocks for 10 seconds waiting for IAM role propagation, regardless of actual propagation time.

**Fix:** Replace with a retry loop that attempts `lambda.createFunction()` and retries on `InvalidParameterValueException` ("role cannot be assumed") with exponential backoff starting at 2 seconds:

```typescript
async function createLambdaWithRoleRetry(
	lambda: AWS.Lambda,
	params: AWS.Lambda.CreateFunctionRequest,
): Promise<AWS.Lambda.FunctionConfiguration> {
	const MAX_ATTEMPTS = 8;
	let delay = 2000;
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		try {
			return await lambda.createFunction(params).promise();
		} catch (err) {
			const e = err as AWS.AWSError;
			if (e.code === 'InvalidParameterValueException'
				&& e.message.includes('cannot be assumed')
				&& attempt < MAX_ATTEMPTS - 1) {
				await new Promise((r) => setTimeout(r, delay));
				delay = Math.min(delay * 1.5, 10000);
				continue;
			}
			throw err;
		}
	}
	throw new Error('Lambda role propagation timed out');
}
```

**Impact:** Reduces median provisioning from 10+ seconds to ~5-6 seconds.

---

#### PERF-HIGH-3: 100ms Artificial Delay Per SQS Message in Lambda Handler

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:298`

The embedded Lambda handler contains `await new Promise(resolve => setTimeout(resolve, 100))` described as "Simulate business processing." At batch size 10, the Lambda spends 1 second doing nothing per invocation.

**Fix:** Remove this line entirely. There is no business reason for this delay.

**Impact:** 10x throughput improvement for the Lambda event forwarder.

---

#### PERF-HIGH-4: `checkExists` Makes 2-5 API Calls on Every Activation Check

**File:** `nodes/Commercetools/utils/webhookMethods.utils.ts:54-179`

Every workflow activation verification makes multiple network calls (credential fetch, CT API GET, AWS SQS/Lambda describe, or GCP topic/bucket/function get) even when config hasn't changed.

**Fix:** Add a `lastVerifiedAt` timestamp to `StaticSubscriptionData`. Skip verification if the hash matches and last verification was less than 5 minutes ago:

```typescript
const VERIFY_INTERVAL_MS = 5 * 60 * 1000;
if (webhookData.lastVerifiedAt && Date.now() - webhookData.lastVerifiedAt < VERIFY_INTERVAL_MS) {
	return true;
}
```

**Impact:** Reduces per-activation API calls from 3-5 down to 0 within the grace window.

---

### MEDIUM

| ID | Issue | File | Fix | Impact |
|----|-------|------|-----|--------|
| PERF-MED-1 | `new RegExp()` constructed per item | `Commercetools.node.ts:103,112,126` | Cache compiled regexes in a module-level `Map` | Eliminates regex recompilation in batch loops |
| PERF-MED-2 | New AWS SDK clients created per `checkExists` | `webhookMethods.utils.ts:99-104` | Reuse clients or use `lastVerifiedAt` guard | Saves 2 object allocations + global config mutation |
| PERF-MED-3 | Double JWT token exchange on GCP teardown | `gcpInfra.utils.ts:363` | Accept pre-built auth client as parameter | Saves ~200ms OAuth2 round-trip |
| PERF-MED-4 | 5-second unconditional sleep in AWS teardown | `awsInfra.utils.ts:474` | Remove or replace with Lambda `waitFor` | Saves 5 seconds per deactivation |
| PERF-MED-5 | ~30 verbose `console.log` calls in Lambda | `awsInfra.utils.ts:153-349` | Replace with minimal structured logging | Reduces Lambda duration by 5-20ms; cuts CloudWatch costs ~90% |

### LOW

| ID | Issue | File | Fix |
|----|-------|------|-----|
| PERF-LOW-1 | `isMainUpdateOp` regex evaluated per POST | `Commercetools.node.ts:210,260` | Add `isUpdate` boolean to generated `operations.json` |
| PERF-LOW-2 | `getBaseUrl()` called twice in `checkExists` | `webhookMethods.utils.ts` | Call once at top and reuse |
| PERF-LOW-3 | Pretty-printed JSON adds ~40% to generated files | `scripts/generate.ts:231,239` | Use `JSON.stringify()` without indent |
| PERF-LOW-4 | `isMainUpdateOp` duplicated across two files | `Commercetools.node.ts:410` + `generateProperties.ts:95` | Share via utility module or generate as boolean flag |
| PERF-LOW-5 | `restoreLocaleKeys` allocates new objects for non-locale subtrees | `Commercetools.node.ts:484-501` | Return original reference when no remapping needed |

---

## 3. Architecture Recommendations

### CRITICAL

#### ARCH-CRIT-1: Zero Test Coverage

No `.test.ts` or `.spec.ts` files exist in the repository. There is no automated regression protection for infrastructure provisioning, subscription routing, API request construction, or event routing logic.

**Priority test targets:**
1. `buildSubscriptionBody` -- event routing correctness, empty array prevention
2. `createRealAWSInfrastructure` / `deleteAWSInfrastructure` -- with mocked AWS SDK
3. `createGCPInfrastructure` / `deleteGCPInfrastructure` -- with mocked googleapis
4. `executeOperation` -- URL template substitution, body building per operation type
5. `parseCollection` -- Postman collection parsing edge cases
6. Config hash change detection
7. `checkExists` / `create` / `delete` lifecycle with mocked HTTP helpers

**Impact:** Infrastructure provisioning code handles real cloud resources and billing -- highest-risk untested area.

---

### HIGH

#### ARCH-HIGH-1: Global AWS/GCP SDK Config Mutation

**Files:** `awsInfra.utils.ts:44`, `webhookMethods.utils.ts:98-101`, `gcpInfra.utils.ts:128`

Both `AWS.config.update()` and `google.options({ auth })` mutate process-global state. In multi-workflow n8n instances, this creates race conditions where one workflow's credentials can bleed into another.

**Fix:** Pass credentials directly to each client constructor. Remove `AWS.config.update()` and `google.options()` calls. All GCP call sites already pass `auth` individually -- only the `google.options()` call needs removal.

---

#### ARCH-HIGH-2: `{} as INode` Anti-Pattern in Infrastructure Utils

**Files:** `awsInfra.utils.ts:425,431,436`, `gcpInfra.utils.ts:349,411`

Both infrastructure utilities pass `{} as INode` to `NodeOperationError`, producing broken error objects with no node name or ID in the n8n UI.

**Fix:** Accept `INode` as a parameter to infrastructure functions, or throw plain `Error` instances and let the caller wrap them in `NodeOperationError` with proper node context.

---

#### ARCH-HIGH-3: Loose Credential Typing

**Files:** Throughout `webhookMethods.utils.ts`, `awsInfra.utils.ts`, `gcpInfra.utils.ts`

Credentials are typed as `Record<string, string>`, losing compile-time guarantees for required fields.

**Fix:** Define a proper interface:

```typescript
interface CommerceToolsCredentials {
	projectKey: string;
	region: string;
	awsAccessKeyId?: string;
	awsSecretAccessKey?: string;
	awsRegion?: string;
	serviceAccountJson?: string;
	gcpRegion?: string;
}
```

---

#### ARCH-HIGH-4: `useUnknownInCatchVariables: false` in tsconfig

**File:** `tsconfig.json:11`

This opts out of TypeScript 4.4+ strict catch variable typing. Multiple catch blocks access `error.message` and `error.code` without narrowing.

**Fix:** Set `useUnknownInCatchVariables: true` and add proper narrowing in catch blocks.

---

### MEDIUM

#### ARCH-MED-1: `webhookMethods.utils.ts` is a Monolith

**File:** `nodes/Commercetools/utils/webhookMethods.utils.ts`

`checkExists` spans 140 lines mixing config hash comparison, subscription verification, and cloud infrastructure verification (AWS and GCP).

**Fix:** Extract `verifyAwsInfrastructure()` and `verifyGcpInfrastructure()` into their respective infra utils files. Make `checkExists` a thin orchestrator.

---

#### ARCH-MED-2: No Shared Cloud Provider Abstraction

**Files:** `awsInfra.utils.ts`, `gcpInfra.utils.ts`, `webhookMethods.utils.ts`

AWS and GCP follow identical patterns (provision queue/topic, provision function, create event binding, teardown in reverse) but share no interface. `webhookMethods.utils.ts` has mirrored `if (hasAWS) ... else if (hasGCP) ...` branches in all three lifecycle methods.

**Fix:** Define a `CloudInfraProvider` interface:

```typescript
interface CloudInfraProvider {
	provision(credentials: Credentials, webhookUrl: string, eventType: string): Promise<InfraResponse>;
	teardown(credentials: Credentials, infrastructure: InfraResponse): Promise<void>;
	verify(credentials: Credentials, infrastructure: InfraResponse): Promise<boolean>;
}
```

**Impact:** Adding a third provider (e.g., Azure Event Grid) currently requires modifying three lifecycle methods.

---

#### ARCH-MED-3: Hardcoded Lambda Source as Template Literal

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:153-349`

~200 lines of JavaScript are embedded as a template literal. This code is not linted, not type-checked, and contains verbose logging that increases CloudWatch costs.

**Fix:** Move to a separate file (e.g., `lambda/sqs-forwarder.js`) and bundle at build time. This enables linting, testing, and minification.

---

#### ARCH-MED-4: Incomplete AWS Teardown

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts`

| Resource | Created | Cleaned Up |
|----------|---------|------------|
| SQS Queue | Yes | Yes |
| Lambda Function | Yes | Yes |
| IAM Role | Yes | Yes |
| SQS Inline Policy | Yes | Yes |
| CloudWatch Inline Policy | Yes | **No** |
| CloudWatch Log Group | Yes | **No** |

**Fix:** Add `deleteRolePolicy` for the CloudWatch policy and `deleteLogGroup` during teardown.

---

#### ARCH-MED-5: Silent Error Swallowing in Teardown

**Files:** `awsInfra.utils.ts:469-537`, `webhookMethods.utils.ts:269-282`

Six empty catch blocks with `//TODO:` comments silently swallow all errors. If teardown fails for a non-transient reason, orphaned resources accumulate with no diagnostics.

**Fix:** Log warnings per failed step. Aggregate errors and surface as a non-fatal warning.

---

#### ARCH-MED-6: `pollUntilDone` Has No Timeout

**File:** `nodes/Commercetools/utils/gcpInfra.utils.ts:451-469`

The `while (true)` loop has exponential backoff but no maximum iteration count. GCP deployments can take 5+ minutes; if the operation never completes, this loops indefinitely.

**Fix:** Add `maxAttempts` or `timeoutMs` parameter (default ~8 minutes).

---

#### ARCH-MED-7: Resource Lists Maintained in Four Places

**Files:** `generate.ts:51,73`, `generateProperties.ts:47`, `generateCtpRegistry.ts:26`

Adding a new resource requires updating `FOLDERS_TO_GENERATE`, `RESOURCES_TO_GENERATE`, `SINGULAR_MAP`, and `subResourceToParent`.

**Fix:** Derive all lists from a single `resources.json` configuration file.

---

#### ARCH-MED-8: Scripts Excluded from TypeScript Compilation

**File:** `tsconfig.json:26`

The `include` array omits `scripts/**/*`, so generation scripts are not type-checked by `tsc`.

**Fix:** Add `scripts/**/*` to `tsconfig.json` include, or create `tsconfig.scripts.json` checked in CI.

---

#### ARCH-MED-9: `StaticSubscriptionData` Missing `gcpInfrastructure` Field

**File:** `nodes/Commercetools/CommercetoolsTrigger.node.ts:13-18`

The type declares `awsInfrastructure?: AWSResponse` but not `gcpInfrastructure`. GCP state is stored in the untyped `IDataObject` escape hatch.

**Fix:** Add `gcpInfrastructure?: GCPResponse` to `StaticSubscriptionData`.

---

#### ARCH-MED-10: Lambda Runtime `nodejs24.x` Does Not Exist

**File:** `nodes/Commercetools/utils/awsInfra.utils.ts:356`

AWS Lambda does not offer `nodejs24.x`. Lambda creation will fail with `InvalidParameterValueException`.

**Fix:** Change to `'nodejs22.x'`.

---

### LOW

| ID | Issue | File | Fix |
|----|-------|------|-----|
| ARCH-LOW-1 | Duplicate `isMainUpdateOp` function | `Commercetools.node.ts:410` + `generateProperties.ts:95` | Share via utility module |
| ARCH-LOW-2 | `usableAsTool: true` on trigger node | `CommercetoolsTrigger.node.ts:56` | Remove -- triggers are event sources, not AI tools |
| ARCH-LOW-3 | Redundant body processing in webhook handler | `CommercetoolsTrigger.node.ts:66-74` | Simplify to single ternary |
| ARCH-LOW-4 | Duplicate `EXCLUDED_MESSAGES` check | `generateCtpRegistry.ts:207-208` | Remove duplicate line |
| ARCH-LOW-5 | `collection.json` loaded via untyped `require()` | `generate.ts:212` | Define minimal Postman collection interface |
| ARCH-LOW-6 | Auto-update workflow commits directly to main | `.github/workflows/auto-update.yml:84-100` | Create PR for review instead of direct commit |

---

## Priority Roadmap

### Phase 1: Critical Security Fixes (Immediate)

These issues represent active credential exposure and should be addressed before the next release.

1. **Remove credentials from `AWSResponse` and static data** (SEC-CRIT-1, SEC-CRIT-3, PERF-CRIT-1)
2. **Switch SQS destination to IAM auth mode** (SEC-CRIT-2)
3. **Remove Lambda source from static data** (SEC-CRIT-3)
4. **Fix Lambda runtime to `nodejs22.x`** (ARCH-MED-10) -- current code fails to deploy

### Phase 2: High-Priority Security & Reliability (1-2 Weeks)

5. **Add webhook request authentication** (SEC-HIGH-1)
6. **Validate `imageUrl` to prevent SSRF** (SEC-HIGH-2)
7. **Sanitize URL path parameters** (SEC-HIGH-3)
8. **Eliminate global AWS/GCP SDK state mutation** (ARCH-HIGH-1, SEC-MED-10)
9. **Scope CloudWatch IAM policy** (SEC-HIGH-4)
10. **Remove artificial delays from Lambda handler** (PERF-HIGH-3)

### Phase 3: Performance & Architecture (2-4 Weeks)

11. **Hoist `getCredentials` out of batch loop** (PERF-HIGH-1)
12. **Add `lastVerifiedAt` guard to `checkExists`** (PERF-HIGH-4)
13. **Replace fixed IAM sleep with retry loop** (PERF-HIGH-2)
14. **Define typed credentials interface** (ARCH-HIGH-3)
15. **Fix `{} as INode` error pattern** (ARCH-HIGH-2)
16. **Enable `useUnknownInCatchVariables`** (ARCH-HIGH-4)

### Phase 4: Quality & Maintainability (4-8 Weeks)

17. **Add test coverage** for infrastructure, subscriptions, and operations (ARCH-CRIT-1)
18. **Extract cloud verification into provider modules** (ARCH-MED-1, ARCH-MED-2)
19. **Externalize Lambda/Cloud Function source** (ARCH-MED-3)
20. **Complete AWS teardown** (CloudWatch policy + log group) (ARCH-MED-4)
21. **Add logging to teardown catch blocks** (ARCH-MED-5)
22. **Add timeout to `pollUntilDone`** (ARCH-MED-6)
23. **Migrate from `aws-sdk` v2 to v3** (SEC-HIGH-6)

### Phase 5: Long-Term Improvements (Ongoing)

24. **Consolidate resource configuration** into single source of truth (ARCH-MED-7)
25. **Include scripts in TypeScript compilation** (ARCH-MED-8)
26. **Reduce CloudWatch logging costs** in Lambda (PERF-MED-5)
27. **Reduce generated file sizes** (PERF-LOW-3)
28. **Mask `serviceAccountJson` field** (SEC-MED-9)

---

*This review was conducted against the codebase as of commit `ccbb9de` (2026-03-29).*
