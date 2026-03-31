# n8n-nodes-commercetools

A custom n8n community node that provides full API coverage for commercetools through auto-generated operations. This node transforms the official commercetools Postman collection into a native n8n integration with webhook support, cloud event buffering (AWS SQS+Lambda or GCP Pub/Sub+Cloud Functions), and sophisticated subscription management.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js | 22.x | n8n requires Node.js for custom nodes |
| Framework | n8n | 1.x | Workflow automation and node infrastructure |
| Language | TypeScript | 5.9 | Strict mode enabled for type safety |
| Build | n8n-node-cli | 0.17 | Official n8n node build tooling |
| Cloud SDK (AWS) | aws-sdk | 2.x | SQS, Lambda, IAM provisioning |
| Cloud SDK (GCP) | googleapis, @google-cloud/pubsub | 171.x / 5.x | Pub/Sub, Cloud Functions provisioning |
| Testing | Jest | via @n8n/node-cli | Unit and integration test runner |
| Linting | ESLint | 9.x | Code quality (extends @n8n/node-cli config) |
| Formatting | Prettier | 3.8 | Code formatting (tabs, single quotes, 100 char width) |

## Quick Start

```bash
# Prerequisites
# - Node.js 22.x or higher
# - npm (comes with Node.js)

# Installation
git clone https://github.com/jjtech-digital/n8n-nodes-commercetools.git
cd n8n-nodes-commercetools
npm install

# Development (watch mode with n8n integration)
npm run dev

# Generate operations from latest Postman collection
npm run generate

# Build
npm run build

# Run tests
npm test

# Lint and format
npm run lint
npm run lint:fix
```

## Project Structure

```
n8n-nodes-commercetools/
├── credentials/
│   └── CommerceToolsOAuth2Api.credentials.ts     # OAuth2 credential definition
├── nodes/
│   └── Commercetools/
│       ├── Commercetools.node.ts                 # Action node implementation
│       ├── CommercetoolsTrigger.node.ts          # Webhook trigger implementation
│       ├── generated/
│       │   ├── properties.ts                      # Auto-generated node properties
│       │   ├── operations.json                    # Auto-generated operation map
│       │   ├── ctp-event-registry.json           # Event routing registry
│       │   └── subscription.properties.ts         # Event subscription config
│       └── utils/
│           ├── subscription.utils.ts             # Subscription CRUD + body building
│           ├── webhookMethods.utils.ts           # Webhook lifecycle methods
│           ├── awsInfra.utils.ts                 # AWS SQS/Lambda provisioning
│           └── gcpInfra.utils.ts                 # GCP Pub/Sub provisioning
├── scripts/
│   ├── generate.ts                               # Main generation pipeline entry
│   ├── parseCollection.ts                        # Parse Postman collection
│   ├── generateProperties.ts                     # Convert to n8n INodeProperties
│   ├── generateCtpRegistry.ts                    # Extract events from SDK types
│   └── generateSubscriptionProperties.ts         # Build event subscription config
├── icons/
│   └── Commercetools.svg                         # Node icon asset
├── package.json                                  # Dependencies and scripts
├── tsconfig.json                                 # TypeScript strict mode config
├── .prettierrc.js                                # Formatting config
├── eslint.config.mjs                             # Linting rules (ESM format)
├── .github/workflows/
│   ├── auto-update.yml                           # Daily collection sync + publish
│   ├── build.yml                                 # Build workflow
│   └── ci.yml                                    # CI checks
├── collection.json                               # Latest commercetools Postman collection
├── CHANGELOG.md                                  # Version history
├── README.md                                     # User-facing documentation
└── BUSINESS_FLOW.md                              # Detailed operation/event docs

Generated files (dist/) are built output, not source.
```

## Architecture Overview

### Operation Execution Flow

The action node transforms user-selected resources and operations into HTTP requests to the commercetools API:

```
User Selects (Resource + Operation)
         ↓
Execute Context with Credentials
         ↓
Operation Definition Lookup (operations.json)
         ↓
Build URL (substitute placeholders, handle ID/Key variants)
         ↓
Extract Request Body Fields
         ↓
Authenticate & Send HTTP Request
         ↓
Handle Response / Errors
```

### Webhook & Subscription Management

The trigger node creates commercetools webhook subscriptions on activation and auto-provisions cloud infrastructure if AWS/GCP credentials are provided:

```
Workflow Activation
         ↓
Detect Existing Subscription (checkExists)
         ↓
Config Hash Mismatch? Tear Down Old Infrastructure
         ↓
Build Subscription Body (route events per registry)
         ↓
Create Subscription on commercetools
         ↓
Provision Cloud Infrastructure (if credentials provided)
         │
         ├─→ AWS: SQS queue → Lambda function → Webhook URL
         │
         └─→ GCP: Pub/Sub topic → Cloud Functions → Webhook URL
         ↓
Store Subscription ID + Infrastructure in Static Data
         ↓
Webhook Ready to Receive Events
```

### Code Generation Pipeline

Operations and events are auto-generated from official sources and committed to the repo:

```
scripts/generate.ts (entry)
        │
        ├── parseCollection.ts
        │     Download Postman collection.json
        │     Detect: isSearch, isImageUpload, requiresId, requiresKey, queryParams
        │     Extract: bodyFields, actionBodyFields
        │     → ParsedOperation[]
        │
        ├── generateProperties.ts
        │     ParsedOperation[] → INodeProperties[]
        │     Emit: resource dropdown, operation dropdowns, ID/key fields,
        │           version field, actions JSON/UI builder, body fields, filters
        │     → nodes/Commercetools/generated/properties.ts
        │
        ├── generateCtpRegistry.ts
        │     Parse @commercetools/platform-sdk .d.ts via TypeScript compiler
        │     Extract: MessagePayload types, ResourceTypeIds
        │     Filter to allowedResources: [product, customer, cart, ...]
        │     → nodes/Commercetools/generated/ctp-event-registry.json
        │
        └── generateSubscriptionProperties.ts
              Read ctp-event-registry.json
              → nodes/Commercetools/generated/subscription.properties.ts
                (exports subscriptionEvents[], triggerProperties[])
```

### Key Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **Commercetools Node** | nodes/Commercetools/Commercetools.node.ts | Main action node — maps resources/operations to HTTP requests |
| **CommercetoolsTrigger** | nodes/Commercetools/CommercetoolsTrigger.node.ts | Webhook trigger — receives and routes commercetools events |
| **Subscription Utils** | nodes/Commercetools/utils/subscription.utils.ts | Build subscription bodies, fetch/delete subscriptions, event routing |
| **Webhook Methods** | nodes/Commercetools/utils/webhookMethods.utils.ts | Lifecycle methods: checkExists, create, delete, update |
| **AWS Infrastructure** | nodes/Commercetools/utils/awsInfra.utils.ts | Provision SQS queue, Lambda function, event source mapping |
| **GCP Infrastructure** | nodes/Commercetools/utils/gcpInfra.utils.ts | Provision Pub/Sub topic, Cloud Function, enable APIs |
| **Credentials** | credentials/CommerceToolsOAuth2Api.credentials.ts | OAuth2 credential type with dynamic region-based token URLs |
| **Properties Gen** | scripts/generateProperties.ts | Convert Postman operations to n8n node properties |
| **Collection Parser** | scripts/parseCollection.ts | Parse Postman collection into operation metadata |

## Development Guidelines

### File Naming

- **Node files:** PascalCase (e.g., `Commercetools.node.ts`, `CommercetoolsTrigger.node.ts`)
- **Credential files:** PascalCase (e.g., `CommerceToolsOAuth2Api.credentials.ts`)
- **Utility files:** kebab-case with `.utils.ts` suffix (e.g., `subscription.utils.ts`, `awsInfra.utils.ts`)
- **Script files:** camelCase (e.g., `parseCollection.ts`, `generateProperties.ts`)
- **Generated files:** committed to `nodes/Commercetools/generated/` — these are excluded from linting

### Code Naming

- **Functions:** camelCase with verb prefix (e.g., `executeOperation()`, `getBaseUrl()`, `buildSubscriptionBody()`)
- **Classes:** PascalCase (e.g., `Commercetools`, `CommercetoolsTrigger`)
- **Interfaces/Types:** PascalCase with `I` prefix for n8n types (e.g., `INodeType`, `IExecuteFunctions`, `StaticSubscriptionData`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `EVENT_MAP`, `MAX_RETRIES`)
- **Boolean variables:** is/has/should prefix (e.g., `isSearch`, `requiresId`, `hasAWS`)
- **Private fields:** `_prefixed` or `#private` (follow n8n conventions)

### Import Order

```typescript
// 1. External packages (n8n, cloud SDKs)
import type { INodeType, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { SQS, Lambda, IAM } from 'aws-sdk';

// 2. Internal absolute imports (if path aliases are configured)
import { generatedProperties } from './generated/properties';
import operationsMap from './generated/operations.json';

// 3. Relative imports
import { getBaseUrl, buildSubscriptionBody } from '../utils/subscription.utils';

// 4. Type imports (with type keyword)
import type { ParsedOperation } from '../../scripts/parseCollection';
import type { StaticSubscriptionData } from '../CommercetoolsTrigger.node';
```

### TypeScript Standards

- **Strict mode:** Enabled (`"strict": true` in tsconfig.json)
- **No implicit any:** All parameters and return types must be annotated
- **Null checks:** All nullable values must be explicitly handled
- **Unused variables:** Not allowed — use _ prefix or remove
- **Target:** ES2019 (compatible with Node 12+, used in n8n cloud environments)

### Code Style (Prettier)

- **Tabs:** Enabled (tab width 2)
- **Single quotes:** Yes (`'string'` not `"string"`)
- **Trailing commas:** All (`{ a, b, }` in objects/arrays)
- **Semicolons:** Yes
- **Arrow function parens:** Always (`(x) => x` not `x => x`)
- **Line width:** 100 characters
- **End of line:** LF (Unix line endings)

### Error Handling

- Use n8n's `NodeOperationError` for user-facing errors (will show in UI)
- Use n8n's `NodeApiError` for API-related errors
- Always include context: `throw new NodeOperationError(this.getNode(), 'message')`
- For async operations, let errors propagate unless handling specifically (try-catch is sparse)
- For batch operations, use `continueOnFail()` context to determine behavior

### Secrets & Credentials

- Never log credentials (access keys, tokens, secrets)
- Use `getCredentials()` from execution context to retrieve safely
- Credentials are automatically encrypted/decrypted by n8n
- AWS/GCP credentials are optional for event buffering but required for infrastructure provisioning
- The Service Account JSON field for GCP must contain the complete JSON, not split fields

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start n8n development server with this node loaded (hot reload) |
| `npm run generate` | Regenerate operations from latest Postman collection + event registry |
| `npm run build` | Compile TypeScript to dist/, create production-ready node |
| `npm run build:watch` | Watch mode: rebuild on source changes |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm test` | Run test suite (Jest, via @n8n/node-cli) |
| `npm run release` | Prepare release (requires git tags + changelog entry) |

## Environment Variables

No environment variables required for development. The node runs within the n8n runtime and reads all configuration from the n8n UI (credentials, node parameters, workflow context).

For deployment:
- Ensure your n8n instance can reach `api.{region}.commercetools.com` (outbound HTTPS)
- For webhook triggers with AWS/GCP provisioning, credentials must have appropriate permissions (see README)

## Testing

Tests are managed by `@n8n/node-cli` and follow n8n conventions:

- **Test location:** Typically in `tests/` or `src/` alongside source files
- **Test naming:** `*.test.ts` or `*.spec.ts`
- **Framework:** Jest
- **Run:** `npm test`

Key test scenarios to cover:
- Operation execution with different resource/operation combinations
- Error handling (auth failures, API errors, validation errors)
- Webhook signature validation (if applicable)
- AWS/GCP infrastructure provisioning and teardown
- Event routing (message vs change subscriptions)
- Update action builder (JSON vs UI modes)

## Deployment

This is a published n8n community node. Installation in n8n:

```bash
# In your n8n instance
npm install n8n-nodes-commercetools
```

Or clone directly for development:

```bash
# In your n8n custom node directory
git clone https://github.com/jjtech-digital/n8n-nodes-commercetools.git
cd n8n-nodes-commercetools
npm install
npm run build
```

The `dist/` folder contains compiled JavaScript — this is what n8n loads.

## Auto-Update Pipeline

`.github/workflows/auto-update.yml` keeps operations in sync with the official commercetools Postman collection:

- **Trigger 1:** Daily at 06:00 UTC
- **Trigger 2:** Every push to main
- **Trigger 3:** Manual dispatch via GitHub UI

**Process:**
1. Download latest collection from commercetools repo
2. Check if collection.json differs
3. If changed (or triggered manually/by push): `npm run generate` → `npm run build`
4. Auto-commit updated collection.json, properties.ts, operations.json, dist/
5. Auto-publish to npm (if configured)

New API endpoints appear in the node automatically — **zero manual development needed**.

## Key Architectural Decisions

| Decision | Why |
|----------|-----|
| **Auto-generated from Postman** | Single source of truth, always in sync, zero manual endpoint maintenance |
| **Separate generated/ folder** | Excluded from linting, clearly marks auto-generated code, easy to regenerate |
| **AWS/GCP optional** | Supports three deployment patterns: direct webhooks, SQS buffering, Pub/Sub buffering |
| **Config hash in static data** | Detects config changes → auto-tears down old infrastructure before rebuilding |
| **Event registry from SDK types** | Extracts MessagePayload types from @commercetools/platform-sdk, guaranteed accuracy |
| **TypeScript strict mode** | Catches type errors early, easier to maintain complex credential/infrastructure code |
| **Tabs + single quotes** | Match n8n's internal code style (not conventional, but consistent with ecosystem) |

## Common Tasks

### Add a new resource operation

1. Ensure the operation exists in the commercetools Postman collection
2. Run `npm run generate` — the operation will be auto-detected and added
3. Run `npm run build`
4. Push to main → auto-update workflow publishes the change

### Debug an operation

1. Check `nodes/Commercetools/generated/operations.json` — search for the operation name
2. Verify the operation definition: `urlTemplate`, `method`, `bodyFields`, `queryParams`
3. Use `npm run dev` to load the node in n8n, test in workflow
4. Check browser console for errors; check n8n logs for execution details

### Add webhook support for a new event type

1. Verify the event is listed in commercetools API docs
2. Run `npm run generate` — if the event is in the Postman collection, it will be auto-extracted
3. The event will appear in the Trigger node's **Events** dropdown
4. Push to main → auto-update workflow publishes

### Test AWS SQS provisioning locally

1. Set AWS credentials in the credential UI
2. Create a trigger workflow with AWS events selected
3. Activate the workflow — CloudFormation will provision SQS + Lambda
4. Send a test event from commercetools
5. Check CloudWatch logs to see Lambda execution

## Additional Resources

- **Official Docs:** @README.md (user guide), @BUSINESS_FLOW.md (operation details)
- **commercetools API:** https://docs.commercetools.com/api
- **n8n Node Development:** https://docs.n8n.io/integrations/creating-nodes/
- **Postman Collection:** https://github.com/commercetools/commercetools-postman-collection
- **GitHub Repository:** https://github.com/jjtech-digital/n8n-nodes-commercetools


## Skill Usage Guide

When working on tasks involving these technologies, invoke the corresponding skill:

| Skill | Invoke When |
|-------|-------------|
| node | Manages Node.js runtime environment and dependencies |
| jest | Writes and runs unit and integration tests |
| aws | Provisions AWS SQS, Lambda, and IAM cloud infrastructure |
| typescript | Enforces TypeScript strict mode and type safety |
| n8n | Develops custom n8n nodes with INodeType implementations |
| prettier | Applies consistent code formatting with tabs and quotes |
