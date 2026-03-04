![Banner](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-commercetools

A custom n8n community node for integrating with commercetools. Provides full API coverage for Products, Customers, Carts, and Orders — plus a webhook trigger node with optional AWS SQS + Lambda or GCP Pub/Sub + Cloud Functions buffering for reliable event delivery.

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

- Full CRUD coverage for Products, Customers, Carts, and Orders
- Auto-generated operations from the official Postman collection — always in sync
- Product image upload: downloads from a URL, posts raw binary to commercetools
- Product and Order search with structured query, sort, limit, and offset fields
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

| Resource | Available Operations |
|---|---|
| **Product** | Create, Get by ID, Get by Key, Query, Update, Delete, Upload Image, Search, Query Product Selections by ID, Query Product Selections by Key, HEAD checks |
| **Customer** | Create, Authenticate (global & in-store), Get by ID / Key / Email / Password Token, Query, Update, Delete, Password reset, Email verification, HEAD checks |
| **Cart** | Create (regular & in-store), Get by ID / Customer ID, Query, Update, Delete, Replicate, Merge, HEAD checks |
| **Order** | Create from Cart, Create from Quote, Import, Get by ID / Key / Order Number, Query, Search, Update, Delete, HEAD checks |

#### How field generation works

Each operation type generates a different set of UI fields:

| Operation type | Generated fields |
|---|---|
| **Create** | Individual typed fields from the Postman request body |
| **Update** | Version + Actions (JSON) override + Actions (UI) builder |
| **Get / Query / HEAD** | Resource ID or Key + optional Filters collection |
| **Delete** | Resource ID + Version |
| **Search** | `query.and` (JSON), `sort` (JSON), `limit` (number), `offset` (number) |
| **Upload Product image** | Image URL + `filename`, `variant`, `sku`, `staged` query params |
| **Misc POST** | Individual typed fields from the Postman request body |

#### Update actions

The update action builder exposes every action type as a labelled group with its own typed fields. For example, adding a `setName` action shows a localised JSON field for `name`; adding `addVariant` shows typed fields for `sku`, `prices`, and so on.

Alternatively, paste a raw JSON array directly into **Actions (JSON)** to bypass the UI builder. When **Actions (JSON)** is non-empty it takes precedence.

#### Search operations (Products & Orders)

The commercetools Search API accepts a `SearchRequest` body. The node exposes these fields:

| Field | Type | Notes |
|---|---|---|
| Query › And | JSON array | Filter predicates. Leave empty to return all results. |
| Sort | JSON array | Sort descriptors. |
| Limit | number | Max results per page. |
| Offset | number | Pagination offset. `0` is sent explicitly (not skipped). |

> **Note:** Sending `query: { and: [] }` is rejected by commercetools with "exhausted input". Leaving Query › And empty omits the field entirely, which returns all results.

#### Upload Product image

commercetools requires raw binary image bytes in the request body with `Content-Type: image/jpeg`, `image/png`, or `image/gif`. It does **not** accept a JSON body — sending one returns `"Unsupported Content-Type: application/json"`.

The node handles this transparently:

1. Downloads the image from the URL you provide using `helpers.request()`
2. Derives the `Content-Type` from the file extension (`.jpg`/`.jpeg` → `image/jpeg`, `.png` → `image/png`, `.gif` → `image/gif`, unknown → `image/jpeg`)
3. POSTs the raw buffer to commercetools with the correct `Content-Type`

| Field | Type | Notes |
|---|---|---|
| Product ID | string | Required |
| Image URL | string | Required — direct link to a JPEG, PNG, or GIF (max 10 MB) |
| Filename | string | Optional filename stored with the image |
| Variant ID | number | `0` = Master Variant (default) |
| SKU | string | Alternative to Variant ID |
| Staged | boolean | `true` = staged data (default), `false` = current |

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

**Category** — created, slug changed

**Order** — created, deleted, imported, state transitions, customer updates, shipping and billing updates, line item changes, payments and deliveries, discount code updates, custom fields

**Cart** — cart created (change notification)

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
- Lambda function (Node.js) with `WEBHOOK_URL` env var
- IAM role with SQS receive/delete and CloudWatch Logs policies
- Event source mapping (SQS → Lambda, batch size 10)

The Lambda forwards each SQS message to the n8n webhook URL as a POST request. All resources are deleted when the trigger is deactivated or its configuration changes.

**Requirements:**
- Publicly reachable n8n webhook URL
- AWS credentials with permissions for: SQS, Lambda, IAM, CloudWatch Logs

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

| Field | Notes |
|---|---|
| Project Key | From commercetools Merchant Center |
| Region | `australia-southeast1.gcp`, `europe-west1.gcp`, or `us-central1.gcp` |
| Client ID / Secret | OAuth2 client credentials from Merchant Center |
| Scopes | e.g. `manage_project:{projectKey}` |
| Event Provider | `None`, `AWS EventBridge`, or `Google Cloud Pub/Sub` |

The OAuth2 token URL is built automatically from the selected region — no manual URL entry needed.

Selecting an **Event Provider** reveals the relevant sub-fields:

### AWS sub-fields

| Field | Notes |
|---|---|
| AWS Client Access Key | IAM user access key ID |
| AWS Client Secret | IAM user secret access key |
| AWS Region | e.g. `us-east-1` |

### GCP sub-fields

| Field | Notes |
|---|---|
| Service Account JSON | Paste the **entire** downloaded `.json` key file as-is |
| GCP Region | Deployment region for Pub/Sub and Cloud Functions (full list of GCP regions available) |

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

# Build
npm run build

# Build and watch
npm run build:watch

# Lint
npm run lint
npm run lint:fix
```

### Code generation pipeline

```
scripts/generate.ts                       (entry point: npm run generate)
│
├── parseCollection.ts
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
├── generateProperties.ts
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
│     Filters to allowedResources: [product, customer, cart, order]
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

| Problem | Solution |
|---|---|
| Authentication errors | Verify Client ID, Secret, and Scopes in Merchant Center; check that the token URL region matches your project |
| `version conflict` on update | Fetch the resource first to get the current version number |
| Unknown operation error at runtime | Run `npm run generate && npm run build` to sync `operations.json` |
| Webhook not receiving events | Ensure n8n has a public URL; verify the subscription exists in Merchant Center → Subscriptions |
| Image upload: `Unsupported Content-Type: application/json` | Ensure Image URL is a direct link to a JPEG, PNG, or GIF file, not an HTML page |
| Search: `exhausted input` | Leave **Query › And** empty — sending `{ and: [] }` is rejected by commercetools |
| GCP: private key / PEM errors | Use the **Service Account JSON** field; paste the entire `.json` key file, not individual fields |
| GCP: deploy timeout on first activation | GCP API enablement takes time on cold projects — retry after a minute |
| Node not visible in n8n | Run `npm install` then `npm run dev` |

---

## Changelog

| Version | Changes |
|---|---|
| latest | Image upload binary pipeline, Search Products/Orders structured fields, `isSearch`/`isImageUpload` detection in `parseCollection`, `generateImageUploadFields` and `generateSearchBodyFields` in `generateProperties` |
| v0.1.33 | GCP Pub/Sub + Cloud Functions event source |
| v0.1.32 | Cart update actions and lint fixes |
| v0.1.31 | Standardised capitalisation |
| v0.1.30 | All commercetools regions |

---

## License

[MIT](LICENSE.md)