# Scripts & Nodes Refactor Changelog

**Last updated:** 2026-04-09
**Scope:** `scripts/` and `nodes/Commercetools/` — two-pass refactor and bug-fix

---

## Pass 2 — 2026-04-09: `nodes/` refactor + remaining `scripts/` items

### New files created

| File | Purpose |
|---|---|
| `scripts/properties/imageAndQuery.ts` | `generateImageUploadFields` + `generateQueryParamProperties` (extracted from `generateProperties.ts`) |
| `nodes/Commercetools/lambda/awsHandler.js` | AWS Lambda SQS → webhook forwarder (was embedded string in `awsInfra.utils.ts`) |
| `nodes/Commercetools/lambda/gcpHandler.js` | GCP Cloud Function Pub/Sub → webhook forwarder (was embedded string in `gcpInfra.utils.ts`) |
| `nodes/Commercetools/utils/urlBuilder.utils.ts` | URL construction + path-param substitution (extracted from `Commercetools.node.ts`) |
| `nodes/Commercetools/utils/bodyBuilder.utils.ts` | Request body assembly for all operation types (extracted from `Commercetools.node.ts`) |
| `nodes/Commercetools/utils/imageUpload.utils.ts` | SSRF-guarded image download + CT binary POST (extracted from `Commercetools.node.ts`) |
| `nodes/Commercetools/utils/cloudVerification.utils.ts` | AWS + GCP infrastructure existence checks (extracted from `webhookMethods.utils.ts`) |
| `nodes/Commercetools/utils/awsDelete.utils.ts` | AWS infrastructure deletion (extracted from `awsInfra.utils.ts`) |
| `nodes/Commercetools/utils/gcpDelete.utils.ts` | GCP infrastructure deletion (extracted from `gcpInfra.utils.ts`) |

---

### Bug fixes — `nodes/`

#### `Commercetools.node.ts`

| ID | Fix |
|---|---|
| GEN-BUG-1 | `isMainUpdateOp` now imported from `scripts/operationUtils.ts` (single source of truth). Previously duplicated between generator and runtime with different guards, causing silent divergence. |
| NODE-BUG-1 | Create and misc-POST body builders no longer skip `val === 0`. Zero is a valid numeric value (`quantity=0`, `centAmount=0`). Only `null`, `undefined`, and `''` are skipped. |
| NODE-BUG-2 | `safeGet` re-throws any error that is not an n8n "parameter not found" error. Previously all exceptions were swallowed, masking runtime bugs. |
| NODE-BP-2 | `validateImageUrl` now also blocks IPv4-mapped IPv6 forms (e.g. `::ffff:127.0.0.1`) that bypassed the original private-address check. |
| BP-6 | Search body field prefix changed from `body__misc__` to `body__search__` in `bodyBuilder.utils.ts` (matches the generator fix in `bodyFields.ts`). |

#### `CommercetoolsTrigger.node.ts`

| ID | Fix |
|---|---|
| TRIGGER-BUG-1 | `JSON.parse(req.body)` is now wrapped in try/catch. A malformed webhook payload previously crashed the entire execution context; it now returns `noWebhookResponse` silently. |
| TRIGGER-READ-1 | Node description updated to mention GCP Pub/Sub + Cloud Functions alongside AWS. |

#### `subscription.utils.ts`

| ID | Fix |
|---|---|
| SUB-BUG-1 | `fetchSubscription` and `deleteSubscription` guard against an empty `subscriptionId` and throw a clear `NodeOperationError` instead of producing a malformed URL. |
| SUB-BUG-2 | `getBaseUrl` throws a `NodeOperationError` when the `region` credential is missing instead of silently defaulting to a hardcoded region string. |
| SUB-BP-1 | All error messages include the missing field name and a hint for how to fix it. |

#### `webhookMethods.utils.ts`

| ID | Fix |
|---|---|
| WEBHOOK-BUG-1 | `hasAWS`/`hasGCP` detection extracted into a single `detectCloudProvider` helper used by both `checkExists` and `create`. Previously duplicated and at risk of diverging. |
| WEBHOOK-BUG-2 | Silent `catch {}` blocks in `checkExists` and `delete` now call `console.warn` with the error message. Cloud cleanup failures are visible in server logs. |
| WEBHOOK-READ-1 | AWS/GCP verification logic moved to `cloudVerification.utils.ts`. `checkExists` is now under 150 lines and easy to follow. |
| WEBHOOK-READ-2 | All `@google-cloud/*` and `googleapis` imports removed from `webhookMethods.utils.ts`. They are now lazy-loaded inside `cloudVerification.utils.ts` only, so the heavy GCP SDK is not pulled into memory on every n8n startup. |

#### `awsInfra.utils.ts`

| ID | Fix |
|---|---|
| AWS-BUG-1 | `queueUrl` is validated after `createQueue` returns. Previously a non-null assertion `queueUrl!` could crash with an unhelpful error if AWS returned an empty result. |
| AWS-BUG-2 | Queue ARN is now fetched from `GetQueueAttributes` instead of being manually assembled. Manual construction produces wrong ARNs in GovCloud and China partition regions. |
| AWS-BUG-3 | SQS `SendMessage` policy `Principal` changed from `"*"` to the caller's account root ARN. An open `*` principal would allow any AWS entity to push messages to the queue. |
| AWS-BUG-4 | `NodeOperationError` now requires a real `INode` from the caller. The `node ?? ({} as INode)` fallback that produced misleading error displays in n8n has been removed. |
| AWS-BP-1 | Errors are logged with `console.error` before being re-thrown so the root-cause message appears in CI/CD logs alongside the n8n error notification. |
| AWS-READ-1 | Lambda source code moved from a template string in `awsInfra.utils.ts` to `lambda/awsHandler.js` and read from disk at deploy time. This makes the Lambda handler testable and lint-checkable in isolation. |

#### `gcpInfra.utils.ts`

| ID | Fix |
|---|---|
| GCP-BUG-1 | `gcpRegion` is validated before use. An empty/missing region now throws a descriptive `NodeOperationError` instead of producing silently invalid API path strings. |
| GCP-BUG-2 | `createGCPInfrastructure` stores `gcpRegion` in the returned `GCPResponse`. `deleteGCPInfrastructure` now reads the region from `infrastructure.region` (the creation-time value) instead of `credentials.gcpRegion` (which may have changed). |
| GCP-BUG-3 | `NodeOperationError` requires a real `INode`. The `node ?? ({} as INode)` fallback removed. |
| GCP-BP-1 | `enableRequiredApis` now calls `console.warn` when an individual API enable call fails instead of swallowing the error with `.catch(() => {})`. |
| GCP-READ-1 | Cloud Function source code moved from a template string to `lambda/gcpHandler.js`, read from disk. Pre-built zip is constructed at module load time. |

---

### Performance improvements (Pass 2 — `scripts/`)

| ID | Fix |
|---|---|
| PERF-4 | `generateAllNodeProperties` in `generateProperties.ts` now builds a `Map<folder, ParsedOperation[]>` index once and passes it to all 11 generator functions. Previously each function independently filtered the full operations array per folder — O(folders × operations × 11) passes. |
| PERF-5 | `findFolder` in `collection/findFolder.ts` uses a module-level cache keyed on the collection object reference. The full tree is only scanned once per unique collection input, then served from the map on subsequent calls. |

---

### Refactoring (Pass 2 — no behaviour change)

#### File splits — line-count constraint (≤ 300 lines per file)

| Original file | Lines | Split into |
|---|---|---|
| `Commercetools.node.ts` | 614 | `Commercetools.node.ts` (thin, ~170 lines) + `urlBuilder.utils.ts` + `bodyBuilder.utils.ts` + `imageUpload.utils.ts` |
| `awsInfra.utils.ts` | 469 | `awsInfra.utils.ts` (~290 lines) + `awsDelete.utils.ts` |
| `gcpInfra.utils.ts` | 476 | `gcpInfra.utils.ts` (~290 lines) + `gcpDelete.utils.ts` |
| `webhookMethods.utils.ts` | 307 | `webhookMethods.utils.ts` (~270 lines) + `cloudVerification.utils.ts` |

---

---

## Pass 1 — 2026-04-06: `scripts/` refactor

**Branch:** feat/Business-units
**Scope:** `scripts/` folder — initial modularisation and bug-fix pass

---

### New file structure (Pass 1)

```
scripts/
├── generate.ts                              Entry point (orchestrator)
├── generateCtpRegistry.ts                   SDK AST → event registry JSON
├── generateProperties.ts                    Thin master export (delegates to properties/)
├── generateSubscriptionProperties.ts        Registry JSON → subscription.properties.ts
├── parseCollection.ts                       Postman collection parser (thin)
├── operationUtils.ts                        isMainUpdateOp + isCreateOp (shared classifier)
│
├── collection/                              Low-level parser modules
│   ├── types.ts                             BodyField, ParsedOperation interfaces
│   ├── postmanTypes.ts                      PostmanItem, PostmanCollection interfaces
│   ├── helpers.ts                           slugify, formatLabel, isLocalizedObject
│   ├── fieldExtractors.ts                   extractFields, extractActionBodyFields
│   ├── findFolder.ts                        findFolder (module-level cache)
│   └── walkItems.ts                         walkItems (top-level function, not closure)
│
├── properties/                              n8n INodeProperties generators
│   ├── helpers.ts                           Constants + property builders
│   ├── resourceAndOperation.ts             Resource + Operation dropdowns + version field
│   ├── idFields.ts                          ID / Key / Container / secondary / associate fields
│   ├── versionAndActions.ts                Actions (JSON) + Actions (UI) fixedCollection
│   ├── bodyFields.ts                        Create / Misc-POST / Search body fields
│   └── imageAndQuery.ts                     Image upload fields + query-param filters
│
└── utils/
    ├── download.ts                          HTTPS downloader (redirect + error handling)
    └── patches.ts                           MANUAL_PATCHES + applyManualPatches (merge)
```

**Line-count constraint:** No file exceeds 300 lines.

---

### Bug fixes — `scripts/` (Pass 1)

#### `generate.ts`

| ID | Fix |
|---|---|
| BUG-1 | Replaced `require(COLLECTION_LOCAL_PATH)` with `JSON.parse(fs.readFileSync(...))` — Node's module cache returned stale data after a download update. |
| BUG-2 | Null-check for the `Location` header before following a redirect. |
| BUG-3 | `downloadFile` rejects before writing anything to disk when the response status is not 2xx. Prevents error HTML from overwriting `collection.json`. |
| BUG-4 | All `catch {}` blocks log `err` before `process.exit(1)`. |
| BUG-5 | `MAX_REDIRECTS = 5` guard added to `downloadFile`. |

#### `generateCtpRegistry.ts`

| ID | Fix |
|---|---|
| BUG-6 | Removed duplicate `if (EXCLUDED_MESSAGES.has(e.value))` line. |
| BUG-7 | `allResources` built once after parsing; passed as parameter to `inferResourceType`. |
| PERF-3 | `EXCLUDED_MESSAGES` moved to module level. |
| BP-4 | `parseFile` wraps `fs.readFileSync` in try/catch; unreadable files emit `console.warn`. |
| BP-5 | `walk` wraps `fs.readdirSync` in try/catch; missing SDK path produces clear error. |

#### `generateSubscriptionProperties.ts`

| ID | Fix |
|---|---|
| BUG-10 | Renamed `escape()` → `escapeSingleQuotes()` — was shadowing the deprecated global. |
| BUG-11 | Added `fs.existsSync(REGISTRY_PATH)` pre-check before `readFileSync`. |
| READ-9 | Generated file uses `import type { INodeProperties }`. |
| READ-10 | `formatDescription` output rewritten for natural English phrasing. |

#### `parseCollection.ts`

| ID | Fix |
|---|---|
| BUG-12 | `requiresVersion` regex tightened to `/"version"\s*:\s*\d+/` to avoid matching `versionNumber`. |
| BUG-13 | Sanitize regex anchored with trailing `[,}]` to prevent corrupting strings containing `{{var}}` as a non-value token. |
| BUG-14 | `walkItems` no longer OR-propagates `isActionSubFolder` to children: `childIsActionFolder` is computed fresh per child, not inherited from the parent. |
| READ-11 | All `any` types removed; Postman shapes typed via `collection/postmanTypes.ts`. |
| BP-8 | `walkItems` promoted from closure to top-level exported function (testable in isolation). |

#### `generateProperties.ts`

| ID | Fix |
|---|---|
| BUG-8 | `generateResourceProperty` defaults to `''` when `folders` is empty. |
| BUG-9 | `IMAGE_PARAM_DEFS` moved to module level in `imageAndQuery.ts`. |
| GEN-BUG-1 | `isMainUpdateOp` / `isCreateOp` shared via `scripts/operationUtils.ts`. |
| GEN-BUG-2 | `resolveDefault` checks `Array.isArray(field.example)` to emit `'[]'` vs `'{}'`. |
| GEN-BUG-3 | `isCreateOp` uses a single regex in `operationUtils.ts` shared with the runtime. |
| BP-6 | Search body fields use `body__search__` prefix to avoid collisions with `body__misc__`. |
| READ-5 | Nested ternary chains extracted to `resolveN8nType` and `resolveDefault` helpers. |
| READ-6 | Placeholder-to-label logic consolidated in `placeholderToLabel` helper. |
| READ-7 | Dead `Taxe: 'Tax'` entry removed from `SINGULAR_MAP`. |
| READ-8 | `REQUIRED_QUERY_PARAMS` moved to `properties/helpers.ts`. |

#### `utils/patches.ts`

| ID | Fix |
|---|---|
| BP-1 | `applyManualPatches` merges patch fields into the existing array instead of replacing it — partial Postman bodies now receive only the missing fields. |
| BP-2 | Each patch entry includes a `// Root cause:` comment explaining when it can be removed. |

---

### What was NOT changed (Pass 1)

- Public API signatures of `parseCollection`, `generateAllNodeProperties`, `generateCtpEventRegistry`, `generateSubscriptionProperties`.
- Generated output format (`properties.ts`, `operations.json`, `ctp-event-registry.json`, `subscription.properties.ts`).

---

## How to run

```bash
# Full pipeline (all three generation steps)
npm run generate

# Or directly
npx ts-node scripts/generate.ts

# Step 3 standalone (needs ctp-event-registry.json from step 2)
npx ts-node scripts/generateSubscriptionProperties.ts

# After generation, rebuild the node
npm run build
```
