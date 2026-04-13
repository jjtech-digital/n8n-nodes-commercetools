![Banner](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-commercetools

A custom n8n community node for integrating with commercetools. Provides full API coverage for Products, Customers, Carts, Orders, and Business Units — plus a webhook trigger node with optional AWS SQS + Lambda or GCP Pub/Sub + Cloud Functions buffering for reliable event delivery.

Operations are **auto-generated** from the official commercetools Postman collection and kept in sync automatically via a daily GitHub Actions workflow.

---

## Table of Contents

- [Highlights](#highlights)
- [Quick Start](#quick-start)
- [Nodes](#nodes)
  - [commercetools (Action Node)](#commercetools-action-node)
  - [commercetools Trigger](#commercetools-trigger)
- [Credentials](#credentials)
- [Development & Scripts](#development--scripts)
- [Auto-Update Pipeline](#auto-update-pipeline)
- [Error Handling & Troubleshooting](#error-handling--troubleshooting)
- [Changelog](#changelog)
- [License](#license)

---

## Highlights

- Full CRUD coverage for Products, Customers, Carts, Orders, Business Units, Categories, Channels, Associate Roles, Inventory, Reviews, Shopping Lists, Types, Custom Objects, Payments, Payment Methods, Shipping Methods, Zones, Subscriptions, States, Quotes, Quote Requests, Staged Quotes, Messages, API Extensions, Approval Rules, Approval Flows, Associate Endpoints, Standalone Prices, Stores, Product Tailoring, Customer Groups, Product Selections, Cart Discounts, Discount Codes, Product Discounts, Product Types, Product Projections, Tax Categories, Attribute Groups, API Clients, Recurring Orders, Recurrence Policies, Discount Groups, and In-Store Endpoints
- Auto-generated operations from the official Postman collection — always in sync
- Product image upload: downloads from a URL, posts raw binary to commercetools
- Product, Order, and Business Unit search with structured query, sort, limit, and offset fields
- Update action UI builder — per-action typed field editors, no raw JSON required
- Native commercetools webhook subscriptions
- Optional AWS SQS + Lambda event buffering — fully auto-provisioned
- Optional GCP Pub/Sub + Cloud Functions event buffering — fully auto-provisioned
- All cloud infrastructure is automatically torn down on workflow deactivation

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Nodes

### commercetools (Action Node)

Select a **Resource** and **Operation** to interact with the commercetools API. All operations and their input fields are generated at build time from the official Postman collection.

#### Resources

| Resource          | Available Operations                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product**       | Create, Get by ID, Get by Key, Query, Update, Delete, Upload Image, Search, Query Product Selections by ID, Query Product Selections by Key, HEAD checks |
| **Customer**      | Create, Authenticate (global & in-store), Get by ID / Key / Email / Password Token, Query, Update, Delete, Password reset, Email verification, HEAD checks |
| **Cart**          | Create (regular & in-store), Get by ID / Customer ID, Query, Update, Delete, Replicate, Merge, HEAD checks |
| **Order**         | Create from Cart, Create from Quote, Import, Get by ID / Key / Order Number, Query, Search, Update, Delete, HEAD checks |
| **Business Unit** | Create, Get by ID, Get by Key, Query, Search, Update, Delete, HEAD checks |
| **Category**      | Create, Get by ID, Get by Key, Query, Update, Delete, Search, Get by Slug, HEAD checks |
| **Channel**       | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Associate Role**| Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Inventory**     | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Review**        | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Shopping List** | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Type**          | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Custom Object** | Create or Update, Get by Container/Key, Query, Delete, HEAD checks|
| **Payment**        | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Payment Method** | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Shipping Method** | Create, Get by ID, Get by Key, Query, Update, Delete, Get matching methods for Cart / Location / OrderEdit, HEAD checks |
| **Zone**            | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Subscription**    | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **State**           | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Quote**           | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Quote Request**   | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Staged Quote**    | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Message**         | Get by ID, Query, HEAD checks |
| **Extension**       | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Approval Rule**          | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Approval Flow**          | Get by ID, Query, Update, HEAD checks |
| **Associate Cart**         | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Associate Order**        | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Associate Quote**        | Get by ID, Get by Key, Query, Update, HEAD checks |
| **Associate Quote Request**| Create, Get by ID, Get by Key, Query, Update, HEAD checks |
| **Associate Shopping List**| Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Associate Business Unit**| Get by ID, Get by Key, Query, Update, HEAD checks |
| **Standalone Price**  | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Store**             | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Product Tailoring** | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Customer Group**    | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Product Selection** | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Cart Discount**     | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Discount Code**     | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Product Discount**          | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Product Type**              | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Product Projection**        | Get by ID, Get by Key, Query, HEAD checks |
| **Tax Category**              | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Attribute Group**           | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **API Client**                | Create, Get by ID, Query, Delete, HEAD checks |
| **Recurring Order**           | Create, Get by ID, Query, Update, Delete, HEAD checks |
| **Recurrence Policy**         | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Discount Group**            | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Store Business Unit**       | Get by ID, Get by Key, Query, Update, HEAD checks |
| **Store Cart Discount**       | Get by ID, Get by Key, Query, HEAD checks |
| **Store Cart**                | Create, Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Store Customer**            | Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Store Order**               | Create, Get by ID, Get by Key, Query, Update, HEAD checks |
| **Store Quote Request**       | Get by ID, Get by Key, Query, Update, HEAD checks |
| **Store Quote**               | Get by ID, Get by Key, Query, Update, HEAD checks |
| **Store Shopping List**       | Get by ID, Get by Key, Query, Update, Delete, HEAD checks |
| **Store Staged Quote**        | Get by ID, Get by Key, Query, Update, HEAD checks |
| **Store Product Projection**  | Get by ID, Get by Key, Query, HEAD checks |
| **Store Shipping Method**     | Get matching methods for Cart, HEAD checks |
| **Store Product Tailoring**   | Create, Get by Key, Update, Delete, Upload Image, HEAD checks |

#### How field generation works

Each operation type generates a different set of UI fields:

| Operation type           | Generated fields                                                       |
| ------------------------ | ---------------------------------------------------------------------- |
| **Create**               | Individual typed fields from the Postman request body                  |
| **Update**               | Version + Actions (JSON) override + Actions (UI) builder               |
| **Get / Query / HEAD**   | Resource ID or Key + optional Filters collection                       |
| **Delete**               | Resource ID + Version                                                  |
| **Search**               | `query.and` (JSON), `sort` (JSON), `limit` (number), `offset` (number) |
| **Upload Product image** | Image URL + `filename`, `variant`, `sku`, `staged` query params        |
| **Misc POST**            | Individual typed fields from the Postman request body                  |

#### Update actions

The update action builder exposes every action type as a labelled group with its own typed fields. For example, adding a `setName` action shows a localised JSON field for `name`; adding `addVariant` shows typed fields for `sku`, `prices`, and so on.

Alternatively, paste a raw JSON array directly into **Actions (JSON)** to bypass the UI builder. When **Actions (JSON)** is non-empty it takes precedence.

#### Search operations (Products, Orders & Business Units)

The commercetools Search API accepts a `SearchRequest` body. The node exposes these fields:

| Field       | Type       | Notes                                                    |
| ----------- | ---------- | -------------------------------------------------------- |
| Query › And | JSON array | Filter predicates. Leave empty to return all results.    |
| Sort        | JSON array | Sort descriptors.                                        |
| Limit       | number     | Max results per page.                                    |
| Offset      | number     | Pagination offset. `0` is sent explicitly (not skipped). |

> **Note:** Sending `query: { and: [] }` is rejected by commercetools with "exhausted input". Leaving Query › And empty omits the field entirely, which returns all results.

> **Note:** Business Unit Search requires the feature to be activated on your project. See [Troubleshooting](#error-handling--troubleshooting) for details.

#### Upload Product image

commercetools requires raw binary image bytes in the request body with `Content-Type: image/jpeg`, `image/png`, or `image/gif`. It does **not** accept a JSON body — sending one returns `"Unsupported Content-Type: application/json"`.

The node handles this transparently:

1. Downloads the image from the URL you provide using `helpers.request()`
2. Derives the `Content-Type` from the file extension (`.jpg`/`.jpeg` → `image/jpeg`, `.png` → `image/png`, `.gif` → `image/gif`, unknown → `image/jpeg`)
3. POSTs the raw buffer to commercetools with the correct `Content-Type`

| Field      | Type    | Notes                                                     |
| ---------- | ------- | --------------------------------------------------------- |
| Product ID | string  | Required                                                  |
| Image URL  | string  | Required — direct link to a JPEG, PNG, or GIF (max 10 MB) |
| Filename   | string  | Optional filename stored with the image                   |
| Variant ID | number  | `0` = Master Variant (default)                            |
| SKU        | string  | Alternative to Variant ID                                 |
| Staged     | boolean | `true` = staged data (default), `false` = current         |

---

### commercetools Trigger

Listens for real-time commercetools events via webhook subscription. On activation, the node registers a commercetools subscription pointing to the n8n webhook URL. On deactivation, the subscription and any provisioned cloud infrastructure are automatically deleted.

#### Setup

1. Add the **commercetools Trigger** node to your workflow
2. Select one or more event types from the **Events** dropdown
3. Configure commercetools credentials (and optionally AWS or GCP sub-fields)
4. Activate the workflow

#### Supported event types

**Product** — created, published, unpublished, deleted, variant added/deleted, price added/changed/removed, image added, added/removed from category, state transition, slug and custom field updates

**Customer** — created, deleted, email verified/changed, password updated, address updates, custom fields and types

**Order** — created, deleted, imported, state transitions, customer updates, shipping and billing updates, line item changes, payments and deliveries, discount code updates, custom fields

**Cart** — cart created (change notification)

**Business Unit** — created, deleted, address added/changed/removed, associate added/changed/removed, status changed, name changed, contact email updated, store assignments changed, custom fields and types

**Category** — created, slug changed

**Channel** — no message triggers (change subscriptions only)

**Associate Role** — created, deleted, name set, buyer assignable changed, permission added, permission removed, permissions set

**Inventory** — entry created, entry deleted, entry quantity set

**Reviews** — created, rating set, state transition

**Shopping List** — line item added, line item removed

**Types** — no message triggers

**Custom Objects** — no message triggers (CT does not emit subscription messages for custom objects)

**Payment** — created, transaction added, transaction state changed, interface interaction added, interface ID set, status interface code set, status state transition, payment added/removed, payment method info name/method/interface/token set, payment method info custom field updates.

**Shipping Methods** — no message triggers 

**Zones** — no message triggers (change subscriptions only)

**Subscriptions** — no message triggers (change subscriptions only)

**States** — change notifications only (CT does not support message subscriptions for states)

**Quote** — created, deleted, customer changed, seller comment set, state changed, state transition, valid to set

**Quote Request** — created, deleted, customer changed, state changed, state transition

**Staged Quote** — created, deleted, seller comment set, state changed, state transition, valid to set

**Messages** — no triggers (read-only resource)

**Extensions** — no message triggers (change subscriptions only)

**Approval Rule** — created, approvers set, description set, key set, mode changed, name set, predicate set, requesters set, status set

**Approval Flow** — created, approved, completed, rejected

**Standalone Price** — created, deleted, discounted price set/removed, external price set, price tiers set/added/removed, staged changes applied/removed, validity dates set, custom field updates

**Store** — created, deleted, name set, languages added/removed, countries added/removed, distribution channels added/removed, supply channels added/removed, product selections added/removed/updated, custom field updates

**Product Tailoring** — created, deleted, published, unpublished, name set, description set, slug set, images added/removed, assets added/removed/changed

**Customer Group** — created, custom field updates

**Product Selection** — created, deleted, product added/removed/excluded, variant selection/exclusion changed

**Cart Discounts** — no message triggers (change subscriptions only)

**Discount Codes** — no message triggers (change subscriptions only)

#### Subscription routing

Events are routed to the correct commercetools subscription arrays automatically using the generated event registry (produced by `generateCtpRegistry.ts` from the `@commercetools/platform-sdk` type declarations):

- `message` events → `messages[]` grouped by `resourceTypeId` with `types[]`
- `change` events → `changes[]` grouped by `resourceTypeId`

Empty arrays are never sent — commercetools rejects subscriptions that contain them.

#### Config change detection

A hash of `{ events, hasAWS, hasGCP }` is stored in workflow static data. When `checkExists` runs and detects a hash mismatch (events changed, credentials changed), it automatically tears down the old subscription and infrastructure before `create` rebuilds everything.

#### AWS SQS + Lambda (optional)

When `awsAccessKeyId` and `awsSecretAccessKey` are present in the credential, the node automatically provisions:

- SQS queue (14-day retention, long polling)
- Lambda function (Node.js 22.x) with `WEBHOOK_URL` env var
- IAM role with SQS receive/delete and CloudWatch Logs policies
- Event source mapping (SQS → Lambda, batch size 10)

The Lambda forwards each SQS message to the n8n webhook URL as a POST request. All resources are deleted when the trigger is deactivated or its configuration changes.

Uses **AWS SDK for JavaScript v3** (`@aws-sdk/client-sqs`, `@aws-sdk/client-lambda`, `@aws-sdk/client-iam`, `@aws-sdk/client-sts`, `@aws-sdk/client-cloudwatch-logs`).

**Requirements:**

- Publicly reachable n8n webhook URL
- AWS credentials with permissions for: SQS, Lambda, IAM, STS, CloudWatch Logs

> ⚠️ AWS costs may apply.

#### GCP Pub/Sub + Cloud Functions (optional)

When `serviceAccountJson` is present in the credential, the node automatically provisions:

- Pub/Sub topic with `roles/pubsub.publisher` granted to the commercetools service account
- Cloud Storage bucket for function source
- Cloud Function Gen2 (Node.js 20, Eventarc trigger, `RETRY_POLICY_RETRY`)
- All required GCP APIs are enabled automatically (`cloudfunctions`, `cloudbuild`, `artifactregistry`, `run`, `eventarc`)

**Event flow:**

```
commercetools → Pub/Sub topic → Cloud Function (Gen2) → n8n webhook
```

All resources are deleted when the trigger is deactivated or reconfigured.

**Requirements:**

- Billing-enabled GCP project
- Publicly reachable n8n webhook URL
- Service account with: Pub/Sub Admin, Cloud Functions Admin, Storage Admin, IAM Policy Editor, Service Usage Admin

> ⚠️ GCP costs may apply.

---

## Credentials

### commercetools OAuth2 (required for both nodes)

| Field              | Notes                                                                |
| ------------------ | -------------------------------------------------------------------- |
| Project Key        | From commercetools Merchant Center                                   |
| Region             | `australia-southeast1.gcp`, `europe-west1.gcp`, or `us-central1.gcp` |
| Client ID / Secret | OAuth2 client credentials from Merchant Center                       |
| Scopes             | e.g. `manage_project:{projectKey}`                                   |
| Event Provider     | `None`, `AWS EventBridge`, or `Google Cloud Pub/Sub`                 |

The OAuth2 token URL is built automatically from the selected region — no manual URL entry needed.

Selecting an **Event Provider** reveals the relevant sub-fields:

### AWS sub-fields

| Field                 | Notes                      |
| --------------------- | -------------------------- |
| AWS Client Access Key | IAM user access key ID     |
| AWS Client Secret     | IAM user secret access key |
| AWS Region            | e.g. `us-east-1`           |

### GCP sub-fields

| Field                | Notes                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| Service Account JSON | Paste the **entire** downloaded `.json` key file as-is                                 |
| GCP Region           | Deployment region for Pub/Sub and Cloud Functions (full list of GCP regions available) |

> **Important:** Use the **Service Account JSON** field — paste the complete downloaded key file. Do not split it into separate `clientEmail` / `privateKey` fields. n8n's encrypted credential storage mangles PEM line breaks in individual fields; the JSON field is treated as opaque text and preserves the key exactly.

---

## Development & Scripts

```bash
# Install dependencies
npm install

# Start n8n in dev mode with this node loaded
npm run dev

# Regenerate operations from the latest Postman collection + rebuild event registry
npm run generate

# Build (cross-platform — also copies lambda handlers to dist/ via scripts/copyLambda.js)
npm run build

# Build and watch
npm run build:watch

# Lint
npm run lint
npm run lint:fix

# Run tests
npm test
```

### Code generation pipeline

```
scripts/generate.ts                       (entry point: npm run generate)
│
├── parseCollection.ts                    (thin orchestrator)
│     ├── collection/postmanTypes.ts      PostmanItem, PostmanCollection interfaces
│     ├── collection/types.ts             BodyField, ParsedOperation interfaces
│     ├── collection/helpers.ts           slugify, formatLabel, isLocalizedObject
│     ├── collection/fieldExtractors.ts   extractFields, extractActionBodyFields
│     ├── collection/findFolder.ts        findFolder (module-level cache — PERF-5)
│     └── collection/walkItems.ts         walkItems (top-level exported function)
│     Downloads Postman collection.json → ParsedOperation[]
│     Detects per operation:
│       isSearch        POST .../search
│       isImageUpload   POST .../images
│       requiresId      URL contains {{...ID...}}
│       requiresKey     URL contains key={{...}}
│       keyPlaceholder  exact variable name from URL (e.g. product-key)
│       queryParams     all query params including disabled ones
│       bodyFields      extracted from Postman body.raw JSON
│       actionBodyFields fields from inside actions[0]
│
├── generateProperties.ts                 (thin orchestrator — PERF-4: Map index built once)
│     ├── properties/helpers.ts           Constants + shared property builders
│     ├── properties/resourceAndOperation.ts  Resource + Operation dropdowns
│     ├── properties/idFields.ts          ID / Key / Container / path param fields
│     ├── properties/versionAndActions.ts Actions (JSON) + Actions (UI) fixedCollection
│     ├── properties/bodyFields.ts        Create / Misc-POST / Search body fields
│     └── properties/imageAndQuery.ts     Image upload fields + query-param Filters
│     ParsedOperation[] → INodeProperties[]
│     Emits in order:
│       1.  Resource dropdown
│       2.  Operation dropdowns (one per resource folder)
│       3.  Resource ID / Key / custom path param fields
│       4.  Version field  (Update + Delete ops)
│       5.  Actions (JSON) field
│       6.  Actions (UI) fixedCollection  (one option group per action type)
│       7.  Create body fields
│       8.  Misc POST body fields  (excludes isSearch + isImageUpload)
│       9.  Search body fields     (query.and, sort, limit, offset)
│       10. Image upload fields    (imageUrl + variant/sku/staged/filename
│                                   sourced from op.queryParams)
│       11. Query param Filters collection  (GET / HEAD ops only)
│
├── → nodes/Commercetools/generated/properties.ts
├── → nodes/Commercetools/generated/operations.json
│
├── generateCtpRegistry.ts
│     Parses @commercetools/platform-sdk .d.ts via TypeScript compiler API
│     Extracts: *MessagePayload type literals,
│               MessageSubscriptionResourceTypeId values,
│               ChangeSubscriptionResourceTypeId values
│     Filters to allowedResources: [product, customer, cart, order, business-unit,
│       category, channel, associate-role, inventory-entry, review, shopping-list,
│       type, payment, quote, quote-request, staged-quote, approval-rule,
│       approval-flow, standalone-price, store, product-tailoring,
│       customer-group, product-selection]
│     → nodes/Commercetools/generated/ctp-event-registry.json
│
└── generateSubscriptionProperties.ts
      Reads ctp-event-registry.json
      → nodes/Commercetools/generated/subscription.properties.ts
          exports subscriptionEvents[]  (name, value, resourceTypeId,
                                         subscriptionType, description)
          exports triggerProperties[]   (the Events multiOptions field)
```

Generated files are committed to the repository. The built node works without running `generate` unless the Postman collection or SDK has changed.

### Node source layout

```
nodes/Commercetools/
├── Commercetools.node.ts           Thin action-node orchestrator (~175 lines)
├── CommercetoolsTrigger.node.ts    Webhook trigger — receives and routes events
├── generated/                      Auto-generated (do not edit manually)
│   ├── properties.ts
│   ├── operations.json
│   ├── ctp-event-registry.json
│   └── subscription.properties.ts
├── lambda/
│   ├── awsHandler.js               Lambda: SQS → n8n webhook forwarder
│   └── gcpHandler.js               Cloud Function: Pub/Sub → n8n webhook forwarder
└── utils/
    ├── urlBuilder.utils.ts         URL construction + path-param substitution
    ├── bodyBuilder.utils.ts        Request body assembly for all operation types
    ├── imageUpload.utils.ts        SSRF-guarded image download + CT binary POST
    ├── subscription.utils.ts       Subscription CRUD + body building + event routing
    ├── webhookMethods.utils.ts     Webhook lifecycle: checkExists / create / delete
    ├── cloudVerification.utils.ts  AWS + GCP infrastructure existence checks
    ├── awsInfra.utils.ts           AWS SQS / Lambda / IAM provisioning (SDK v3)
    ├── awsDelete.utils.ts          AWS infrastructure teardown (SDK v3)
    ├── gcpInfra.utils.ts           GCP Pub/Sub / Cloud Functions provisioning
    └── gcpDelete.utils.ts          GCP infrastructure teardown

scripts/
├── copyLambda.js                   Cross-platform postbuild: copies lambda/*.js → dist/
└── ...
```

---

## Auto-Update Pipeline

`.github/workflows/auto-update.yml` runs on three triggers:

- **Daily at 06:00 UTC** — checks if the Postman collection has changed
- **Push to `main`** — always regenerates and rebuilds
- **Manual dispatch** — via GitHub Actions UI

Steps: download latest collection → diff against committed version → if changed (or push/manual): `npm run generate` → `npm run build` → commit updated `collection.json`, generated files, and `dist/`.

New API endpoints and fields appear in the node automatically without manual development.

---

## Error Handling & Troubleshooting

| Problem                                                    | Solution                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Authentication errors                                      | Verify Client ID, Secret, and Scopes in Merchant Center; check that the token URL region matches your project |
| `version conflict` on update                               | Fetch the resource first to get the current version number                                                    |
| Unknown operation error at runtime                         | Run `npm run generate && npm run build` to sync `operations.json`                                             |
| Webhook not receiving events                               | Ensure n8n has a public URL; verify the subscription exists in Merchant Center → Subscriptions                |
| Image upload: `Unsupported Content-Type: application/json` | Ensure Image URL is a direct link to a JPEG, PNG, or GIF file, not an HTML page                               |
| Search: `exhausted input`                                  | Leave **Query › And** empty — sending `{ and: [] }` is rejected by commercetools                              |
| Business Unit Search: `Search Not Ready`                   | Business Unit Search must be activated on your project — call `PUT /{projectKey}/business-units/search/indexing-status` with `{ "activated": true }` then wait for indexing to complete |
| GCP: private key / PEM errors                              | Use the **Service Account JSON** field; paste the entire `.json` key file, not individual fields              |
| GCP: deploy timeout on first activation                    | GCP API enablement takes time on cold projects — retry after a minute                                         |
| GCP: `gcpRegion` missing error on activation               | Open the credential and select a GCP Region — the field is required for Cloud Functions deployment            |
| AWS: wrong queue ARN in GovCloud / China regions           | ARN is fetched from `GetQueueAttributes` (not constructed manually)                                           |
| AWS: `credentials are invalid` or `permissions denied`     | Verify the IAM user has SQS, Lambda, IAM, STS, and CloudWatch Logs permissions                               |
| Build: `The syntax of the command is incorrect` on Windows | Ensure you are on v1.0.15+ — the postbuild script is now cross-platform (`scripts/copyLambda.js`)            |
| Trigger: malformed webhook payload crashes execution        | Update to v1.0.14 — invalid JSON payloads are now silently dropped instead of crashing the context           |
| Subscription: `subscriptionId is empty` error              | The subscription ID was not persisted in static data — deactivate and reactivate the workflow                 |
| Update operation: zero value (`0`) silently dropped        | Update to v1.0.14 — `quantity: 0` and `centAmount: 0` are now sent correctly                                 |
| Node not visible in n8n                                    | Run `npm install` then `npm run dev`                                                                          |
| Trigger: `"A message with the name 'PaymentMethodCreated' is unknown for the TypeId 'payment'"` | CT Subscriptions API does not support `payment-method` as a resourceTypeId. Use CT API Extensions or a schedule-based polling trigger instead. |

---

## Changelog

| Version | Changes                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------|
| v1.0.16 | Readme Update                                                                                                   |  
| v1.0.15 | Migrated AWS infrastructure to SDK v3 (`@aws-sdk/client-*`); cross-platform postbuild script (`scripts/copyLambda.js`) fixes Windows build; lambda handlers now correctly copied to `dist/`; CI workflow adds test step and npm cache; ESLint allows `console.warn`/`console.error` for infrastructure logging |
| v1.0.14 | Added Product Discounts, Product Types, Product Projections, Tax Categories, Attribute Groups, API Clients, Recurring Orders, Recurrence Policies, Discount Groups, and In-Store Endpoints |
| v1.0.13 | Added Standalone Prices, Stores, Product Tailoring, Customer Groups, Product Selections, Cart Discounts, and Discount Codes |                              
---

## License

[MIT](LICENSE.md)