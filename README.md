![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-commercetools

A custom n8n community node for integrating with Commercetools. Provides full support for products, categories, customers, orders, carts, and webhook triggers — with optional AWS or GCP buffering for reliable event delivery.

Designed for production-grade automation, large catalogs, and event-driven workflows.
---

## Table of Contents

- [Highlights](#highlights)
- [Features](#features)
- [Quick Start](#quick-start)
- [Webhook Triggers](#webhook-triggers)
- [AWS SQS + Lambda Integration (optional)](#aws-sqs--lambda-integration-optional)
- [GCP Pub/Sub + Cloud Functions Integration (optional)](#gcp-pubsub--cloud-functions-integration-optional)
- [Supported Operations](#supported-operations)
- [Examples](#examples)
- [Credentials](#credentials)
- [Development & Scripts](#development--scripts)
- [Error Handling & Troubleshooting](#error-handling--troubleshooting)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)
---

## Highlights

- Full API coverage for Products, Categories, Customers, Carts, and Orders
- Native Commercetools webhook subscriptions
- Optional AWS SQS + Lambda buffering
- Optional GCP Pub/Sub + Cloud Functions buffering
- Automatic infrastructure provisioning & cleanup
- Product & Customer updateAction UI builders
- Production-ready architecture for high-volume event workflows

---

## Features

### Core Integration

- Complete CRUD operations
- Query and search support
- HEAD existence checks
- OAuth2 authentication
- JSON-based update actions

### Webhook Trigger

- Native Commercetools subscriptions
- Event buffering via:
  - AWS SQS + Lambda
  - GCP Pub/Sub + Cloud Functions

---

## Quick Start

```bash
npm install
npm run dev
```
---

## Webhook Triggers

Use the **Commercetools Trigger** node to receive real-time events.

1. Add the node
2. Select event types
3. Provide Commercetools credentials
4. (Optional) Add AWS or GCP credentials
5. Activate workflow

The node automatically registers a Commercetools subscription.

---

## Supported Event Types

### Product Events

* created, published, unpublished, deleted
* variant added/deleted
* price added/changed/removed
* image added
* added/removed from category
* state transition
* slug & custom field updates

### Customer Events

* created, deleted
* email verified/changed
* password updated
* address updates
* custom fields and types

### Category Events

* created
* slug changed

### Order Events

* created, deleted, imported
* state transitions
* customer updates
* shipping & billing updates
* line item changes
* payments and deliveries
* discount code updates
* custom fields

### Cart Events

* cart created (change notification)

---

## AWS SQS + Lambda Integration (optional)

Automatically provisions:

* SQS queue
* Lambda function
* IAM role & policies
* Event source mapping
* CloudWatch logging

Lambda forwards events to the n8n webhook.

Resources are automatically deleted when the trigger is removed or reconfigured.

### Requirements

* Publicly reachable n8n webhook
* AWS credentials with permissions for:

  * SQS
  * Lambda
  * IAM
  * CloudWatch Logs

⚠ AWS costs may apply.

---

## GCP Pub/Sub + Cloud Functions Integration (optional)

Automatically provisions:

* Pub/Sub topic
* Cloud Storage bucket
* Cloud Function (Gen2)
* Event trigger (Pub/Sub → Function)

### Flow

1. Commercetools publishes event → Pub/Sub
2. Pub/Sub triggers Cloud Function
3. Cloud Function forwards event → n8n webhook
4. n8n workflow processes event

### Features

* Dynamic Cloud Function deployment via code
* Automatic API enablement
* OAuth-based authentication
* Automatic cleanup on trigger removal
* Retry-enabled event delivery

### Requirements

* Billing-enabled GCP project
* Publicly reachable n8n webhook
* Service account with permissions:

  * Pub/Sub Admin
  * Cloud Functions Admin
  * Storage Admin
  * IAM Policy Editor
  * Service Usage Admin

### Recommended Credential Setup

Paste the **entire downloaded service account JSON** into a single credential field:

```
serviceAccountJson
```

This avoids private key formatting issues caused by encrypted credential fields.

⚠ GCP costs may apply.

---

## Supported Operations

### Products

* Create Product
* Query/Search Products
* Get Product (ID or Key)
* Update Product
* Delete Product
* Upload Image
* Product Selections
* HEAD checks

### Categories

* Create / Query / Update / Delete
* Get by ID or Key
* HEAD checks

### Customers

* Authenticate (global & store)
* Create / Update / Delete
* Password reset & verification
* Address management
* Custom fields

### Carts

* Create (regular & in-store)
* Query / Get / Update / Delete
* Replicate & Merge
* Existence checks
* JSON update actions

### Orders

* Create from Cart or Quote
* Import Orders
* Query Orders
* Update/Delete Orders
* Existence checks

---

## Examples

### Create Product

```json
{
  "name": { "en": "Sample Product" },
  "slug": { "en": "sample-product" },
  "productType": { "id": "product-type-id" },
  "masterVariant": {
    "sku": "SKU123",
    "prices": [
      { "value": { "currencyCode": "USD", "centAmount": 1000 } }
    ]
  }
}
```

### Create Cart

```json
{
  "currency": "USD",
  "customerId": "customer-ID",
  "lineItems": [
    {
      "productId": "product-ID",
      "variant": { "id": 1 },
      "quantity": 2
    }
  ]
}
```

---

## Credentials

### Commercetools OAuth2 (Required)

| Field         | Required |
| ------------- | -------- |
| Client ID     | Yes      |
| Client Secret | Yes      |
| Project Key   | Yes      |
| Region        | Yes      |
| Scopes        | Yes      |

---

### Event Provider (Optional)

| Field          | Description |
| -------------- | ----------- |
| Event Provider | AWS or GCP  |

---

### AWS (Optional)

| Field          | Description        |
| -------------- | ------------------ |
| AWS Access Key | Enables SQS/Lambda |
| AWS Secret Key | Enables SQS/Lambda |
| AWS Region     | Resource region    |

---

### GCP (Optional)

| Field              | Description                           |
| ------------------ | ------------------------------------- |
| GCP Client Email   | Email from service account JSON       |
| GCP Private Key    | private Key from service account JSON |
| GCP Region         | Deployment region                     |
| GCP Project ID     | Target project                        |

---

## Development & Scripts

```bash
npm run dev
npm run build
npm run build:watch
npm run lint
npm run lint:fix
```

---

## Error Handling & Troubleshooting

* Authentication errors → verify OAuth2 credentials and scopes
* Webhook unreachable → ensure public endpoint
* Version conflicts → fetch latest version before update
* Node not visible → run `npm install` then `npm run dev`

---

## Contributing

Contributions are welcome. Open an issue or pull request.

---

## Changelog

Recent Highlights:
* v0.1.33 — Adding GCP event source
* v0.1.32 — Cart update actions & lint styling
* v0.1.31 — Standardized capitalization
* v0.1.30 — All Commercetools regions included

---

## License

[MIT](LICENSE.md)
