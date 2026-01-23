![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-commercetools

A custom n8n community node for integrating with Commercetools. Provides full support for products, categories, customers, and webhook triggers, with optional AWS SQS + Lambda buffering for reliable event delivery. Designed for production-grade automation, large catalogs, and event-driven workflows.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Webhook Triggers](#webhook-triggers)
- [AWS SQS + Lambda Integration](#aws-sqs--lambda-integration-optional)
- [Supported Operations](#supported-operations)
  - [Products](#products)
  - [Categories](#categories)
  - [Customers](#customers)
- [Examples](#examples)
- [Credentials Setup](#credentials)
- [Development & Scripts](#development--scripts)
- [Error Handling & Troubleshooting](#error-handling--troubleshooting)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

## Highlights

- Full Commercetools API coverage for products, categories, and customers
- Native webhook trigger for product and customer events
- Optional AWS SQS + Lambda pipeline (auto-provisioned) with CloudWatch logging
- Product `updateActions` UI builder (no JSON required); mix UI-built actions with raw JSON
- Image upload support (binary or external URL)
- Automatic cleanup of subscriptions and AWS resources on deactivation

## AWS Cost Notice

When AWS credentials are provided, this node creates AWS resources (SQS queue, Lambda function, IAM role/policy, CloudWatch logs). AWS costs may apply; monitor and manage these resources.

## Features

- **Core Integration**
  - Complete CRUD for products, categories, customers
  - Query, search, existence checks (HEAD)
  - OAuth2 authentication
- **Webhook Trigger**
  - Native Commercetools subscriptions
  - Buffered delivery via AWS SQS + Lambda
- **Update Builders (products & customers)**
  - Product `updateActions`: UI-based builder; supports variant targeting (variantId or sku), localized fields, prices/assets/images, search keywords, state transitions; mix UI-built actions with raw JSON
  - Customer actions builder: UI-based updates for customer profiles, addresses, and custom fields; combine with raw JSON actions when needed

## Quick Start

```bash
npm install
npm run dev
```

Starts n8n locally with this node loaded (hot reload). Access n8n at http://localhost:5678.

## Webhook Triggers

Use the Commercetools Trigger node to receive real-time events.

1. Add the node and select event types.
2. Choose Commercetools credentials (optional: add AWS credentials).
3. Activate the workflow. The node registers a Commercetools subscription to `.../webhook/<path>/commercetools-events` and, when AWS creds are set, auto-creates the SQS + Lambda buffer.

### Supported Event Types

- **Product Events**
  - Lifecycle: created, published, unpublished, deleted
  - Variants: variant added, variant deleted
  - Pricing: price added, changed, removed, discounts set
  - Media: image added
  - Categorization: added to category, removed from category
  - State & staging: state transition, revert staged changes
  - Metadata: slug changed, custom fields updated
- **Customer Events**
  - Lifecycle: created, deleted
  - Identity: email verified, email changed, password updated
  - Profile: name, company, title, DOB
  - Addresses: added, changed, removed, defaults set
  - Custom fields & custom types
- **Category Events**
  - Lifecycle: created
  - Metadata: slug changed
## AWS SQS + Lambda Integration (optional)

- Auto-creates SQS queue, Lambda function, IAM role/policy, and event source mapping.
- Lambda forwards events to the n8n webhook; identifiers are stored in workflow static data.
- Resources are deleted automatically on trigger removal or reconfiguration.
- Requirements: publicly reachable n8n webhook and AWS credentials with SQS/Lambda/IAM/Logs permissions.

## Supported Operations

- <a id="products"></a>**Product Operations:**
  - Create Product
  - Query Products
  - Search Products
  - Get Product (by ID or Key)
  - Update Product (ID or Key)
  - Delete Product (ID or Key)
  - Upload Product Image
  - Query Product Selections
  - HEAD checks (by ID, Key, Query)
- <a id="categories"></a>**Category Operations:**
  - Create Category
  - Query Categories
  - Get Category (ID or Key)
  - Update Category (ID or Key)
  - Delete Category (ID or Key)
  - HEAD checks
- <a id="customers"></a>**Customer Operations:**
  - Authenticate Customer (global & store)
  - Create / Update / Delete Customer
  - Password reset & email verification
  - Store-specific operations
  - Query & existence checks
  - Custom fields & address management

## Examples

**Create a Product (sample input)**
```json
{
  "name": { "en": "Sample Product" },
  "slug": { "en": "sample-product" },
  "productType": { "id": "your-product-type-id" },
  "masterVariant": {
    "sku": "SKU123",
    "prices": [
      { "value": { "currencyCode": "USD", "centAmount": 1000 } }
    ]
  }
}
```

**Query Products (sample output)**
```json
[
  { "id": "product-id-1", "name": { "en": "Sample Product" }, "slug": { "en": "sample-product" } }
]
```

**Create a Category**
```json
{ "name": { "en": "Sample Category" }, "slug": { "en": "sample-category" }, "orderHint": "0.1" }
```

## Credentials

| Commercetools OAuth2 (required) | Required | Description           |
| --------------------------------| -------- | --------------------- |
| Client ID                       | Yes      | API client ID         |
| Client Secret                   | Yes      | API client secret     |
| Project Key                     | Yes      | Commercetools project |
| Region                          | Yes      | API region            |
| Scopes                          | Yes      | Required permissions  |

| AWS (optional, for webhook buffering) | Required | Description            |
| ------------------------------------- | -------- | ---------------------- |
| AWS Access Key                        | Optional | Enables SQS/Lambda     |
| AWS Secret Key                        | Optional | Enables SQS/Lambda     |
| AWS Region                            | Optional | AWS resource region    |

## Development & Scripts

- `npm run dev` - start n8n with the node loaded (watch mode)
- `npm run build` - production build
- `npm run build:watch` - rebuild on changes
- `npm run lint` / `npm run lint:fix` - lint and auto-fix

## Error Handling & Troubleshooting

- Authentication errors: verify OAuth2 credentials and scopes.
- Version mismatch: fetch the latest version before updates/deletes.
- Not found: confirm the ID/key exists.
- Binary upload issues: ensure the binary property name matches the file.
- Node not visible: run `npm install` then `npm run dev`.

## Contributing

Contributions are welcome—open an issue or pull request.

## Changelog

See `CHANGELOG.md` 

Recent Highlights
- v0.1.24 - Category update actions addition.
- v0.1.23 - Category trigger events addition.
- v0.1.22 - Postman collection update.
- v0.1.21 - Hardened release tooling: refreshed changelog for v0.1.20 and stabilized auto-changelog version.



## License

[MIT](LICENSE.md)
