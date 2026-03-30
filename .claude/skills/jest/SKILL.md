---
name: jest
description: Writes and runs unit and integration tests using Jest for the n8n-nodes-commercetools project
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Jest Skill

This skill writes and runs unit and integration tests for the n8n-nodes-commercetools codebase using Jest (via `@n8n/node-cli`). It covers node execution logic, subscription utilities, webhook lifecycle methods, AWS/GCP infrastructure provisioning, and event routing.

## Quick Start

```bash
# Run all tests
npm test

# Run a specific test file
npx jest tests/subscription.utils.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="buildSubscriptionBody"

# Run with coverage
npx jest --coverage
```

## Key Concepts

- **Test runner:** Jest, invoked via `@n8n/node-cli` (`npm test`)
- **Test files:** Named `*.test.ts` or `*.spec.ts`, placed in `tests/` or alongside source
- **Language:** TypeScript strict mode — all parameters and return types must be annotated
- **Mocking:** Mock external SDK calls (aws-sdk, googleapis, @google-cloud/pubsub) and n8n execution context (`IExecuteFunctions`, `IHookFunctions`) to keep tests self-contained
- **No implicit any:** Jest config inherits `tsconfig.json` strict settings

## Common Patterns

### Mock n8n execution context

```typescript
const mockExecuteFunctions = {
  getNodeParameter: jest.fn(),
  getCredentials: jest.fn().mockResolvedValue({
    projectKey: 'test-project',
    region: 'europe-west1.gcp',
    clientId: 'id',
    clientSecret: 'secret',
  }),
  getNode: jest.fn().mockReturnValue({ name: 'Commercetools' }),
  helpers: {
    httpRequestWithAuthentication: jest.fn(),
  },
} as unknown as IExecuteFunctions;
```

### Mock AWS SDK

```typescript
jest.mock('aws-sdk', () => ({
  SQS: jest.fn().mockImplementation(() => ({
    createQueue: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/test' }) }),
  })),
  Lambda: jest.fn().mockImplementation(() => ({
    createFunction: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
  })),
  IAM: jest.fn().mockImplementation(() => ({
    createRole: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Role: { Arn: 'arn:aws:iam::123:role/test' } }) }),
  })),
}));
```

### Test subscription body building

```typescript
import { buildSubscriptionBody } from '../nodes/Commercetools/utils/subscription.utils';

it('routes message events correctly', () => {
  const body = buildSubscriptionBody(['product.created', 'order.stateChanged'], 'https://n8n.example.com/webhook/abc');
  expect(body.messages).toContainEqual(expect.objectContaining({ resourceTypeId: 'product' }));
  expect(body.changes).not.toContainEqual(expect.objectContaining({ resourceTypeId: 'product' }));
  expect(body.destination.url).toBe('https://n8n.example.com/webhook/abc');
});
```

### Test operation execution

```typescript
import operationsMap from '../nodes/Commercetools/generated/operations.json';

it('resolves product create URL correctly', () => {
  const op = operationsMap['Product-Create'];
  expect(op.method).toBe('POST');
  expect(op.urlTemplate).toContain('{projectKey}');
});
```

### Assert error handling uses NodeOperationError

```typescript
import { NodeOperationError } from 'n8n-workflow';

it('throws NodeOperationError on missing productId', async () => {
  mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValue('');
  await expect(executeOperation(mockExecuteFunctions)).rejects.toThrow(NodeOperationError);
});
```