---
name: typescript
description: Enforces TypeScript strict mode and type safety across the n8n-nodes-commercetools codebase
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Typescript Skill

This skill enforces TypeScript strict mode conventions and type safety throughout the n8n-nodes-commercetools project. It audits, fixes, and guides correct typing for node implementations, utility modules, credential definitions, and code generation scripts — ensuring compatibility with the n8n framework's type contracts.

## Quick Start

```bash
# Type-check without emitting output
npx tsc --noEmit

# Lint (includes type-aware rules)
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Full build (catches all type errors)
npm run build
```

## Key Concepts

- **Strict mode is always on** — `tsconfig.json` has `"strict": true`. No implicit `any`, no unchecked nulls, no loose parameter types.
- **n8n type contracts** — Node classes must implement `INodeType`; execution contexts use `IExecuteFunctions`, `IWebhookFunctions`, `ITriggerFunctions`. Always import these from `n8n-workflow`.
- **Type imports** — Use `import type { ... }` for types that are not needed at runtime. This keeps generated JS clean.
- **Naming conventions** — Interfaces/types use PascalCase; n8n framework types use `I` prefix (e.g., `INodeProperties`, `IDataObject`). Project-local types follow the same `I`-prefix pattern (e.g., `StaticSubscriptionData`).
- **Generated files are excluded** — `nodes/Commercetools/generated/` is excluded from linting. Do not add type annotations or refactor generated code by hand.
- **`unknown` over `any`** — When a type cannot be inferred, prefer `unknown` with an explicit narrowing check over `any`.

## Common Patterns

### Annotate all function parameters and return types

```typescript
// Correct
function buildSubscriptionBody(events: string[], webhookUrl: string): SubscriptionBody {
  ...
}

// Wrong — implicit any on parameter
function buildSubscriptionBody(events, webhookUrl) { ... }
```

### Narrow nullable values before use

```typescript
const subscriptionId = staticData.subscriptionId;
if (!subscriptionId) {
  throw new NodeOperationError(this.getNode(), 'Subscription ID not found in static data');
}
// subscriptionId is now string, not string | undefined
```

### Use `IDataObject` for dynamic API payloads

```typescript
import type { IDataObject } from 'n8n-workflow';

const body: IDataObject = {};
if (version !== undefined) body['version'] = version;
if (actions.length) body['actions'] = actions;
```

### Credential access with explicit typing

```typescript
const credentials = await this.getCredentials('commerceToolsOAuth2Api');
const projectKey = credentials['projectKey'] as string;
const region = credentials['region'] as string;
```

### Boolean variable naming

```typescript
const isSearch = operation.endsWith('search');
const hasAWS = Boolean(credentials['awsAccessKeyId']);
const requiresId = urlTemplate.includes('{{ID}}');
```

### Constants in SCREAMING_SNAKE_CASE

```typescript
const MAX_RETRIES = 3;
const EVENT_MAP: Record<string, string[]> = { ... };
```

### Import order

```typescript
// 1. External packages
import type { INodeType, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// 2. Internal generated/absolute imports
import operationsMap from './generated/operations.json';

// 3. Relative imports
import { buildSubscriptionBody } from '../utils/subscription.utils';

// 4. Type-only imports last
import type { StaticSubscriptionData } from '../CommercetoolsTrigger.node';
```