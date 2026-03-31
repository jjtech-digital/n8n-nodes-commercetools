---
name: n8n
description: Develops custom n8n nodes with INodeType implementations for the n8n-nodes-commercetools package
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# N8n Skill

Assists with developing, debugging, and extending custom n8n community nodes in TypeScript. Specializes in `INodeType` implementations, credential definitions, webhook trigger nodes, auto-generated node properties from Postman collections, and cloud infrastructure provisioning (AWS SQS+Lambda, GCP Pub/Sub+Cloud Functions).

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start n8n dev server with hot reload
npm run generate     # Regenerate operations from Postman collection
npm run build        # Compile TypeScript to dist/
npm test             # Run Jest tests
npm run lint:fix     # Auto-fix ESLint issues
```

## Key Concepts

**Action node** (`Commercetools.node.ts`) — implements `INodeType`, maps user-selected Resource + Operation to an HTTP request using `operations.json` for URL templates and field definitions.

**Trigger node** (`CommercetoolsTrigger.node.ts`) — implements `INodeType` with webhook methods (`checkExists`, `create`, `delete`). Manages commercetools subscriptions and optional cloud infrastructure lifecycle.

**Code generation pipeline** — `scripts/generate.ts` orchestrates three generators:
- `parseCollection.ts` → `ParsedOperation[]` from the Postman collection
- `generateProperties.ts` → `nodes/Commercetools/generated/properties.ts` + `operations.json`
- `generateCtpRegistry.ts` + `generateSubscriptionProperties.ts` → `ctp-event-registry.json` + `subscription.properties.ts`

**Generated files** live in `nodes/Commercetools/generated/` and are committed — excluded from linting. Never edit them manually; run `npm run generate` instead.

**Credentials** (`CommerceToolsOAuth2Api.credentials.ts`) — OAuth2 with dynamic region-based token URLs; optional AWS and GCP sub-fields revealed by `Event Provider` selection.

**Config hash** — a hash of `{ events, hasAWS, hasGCP }` stored in workflow static data detects configuration drift and triggers automatic infrastructure teardown + rebuild.

## Common Patterns

**Add a field to an existing operation**
Check `operations.json` for the operation entry. If it originates from the Postman collection body, update the collection and re-run `npm run generate`. For hand-crafted fields, edit `generateProperties.ts` and regenerate.

**Throw a user-visible error**
```typescript
import { NodeOperationError } from 'n8n-workflow';
throw new NodeOperationError(this.getNode(), 'Descriptive message here');
```

**Read a node parameter safely**
```typescript
const resourceId = this.getNodeParameter('resourceId', i) as string;
```

**Access credentials in execute()**
```typescript
const credentials = await this.getCredentials('commerceToolsOAuth2Api');
```

**Add a new webhook event type**
Run `npm run generate` — events are auto-extracted from `@commercetools/platform-sdk` type declarations via `generateCtpRegistry.ts`. If the event exists in the SDK, it will appear in the Trigger node's Events dropdown automatically.

**Code style** — tabs (width 2), single quotes, trailing commas, 100-char line width, semicolons. Match n8n's internal conventions. All parameters and return types must be annotated (strict mode).

**File naming** — node files PascalCase (`*.node.ts`), utilities kebab-case (`*.utils.ts`), scripts camelCase, credential files PascalCase (`*.credentials.ts`).