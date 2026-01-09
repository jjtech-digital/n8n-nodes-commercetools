![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)


# n8n-nodes-commercetools

This repository provides a custom [n8n](https://n8n.io) node for integrating with [Commercetools](https://commercetools.com). It includes all required credentials, node definitions, utilities to interact with the Commercetools API, and optional **AWS SQS integration with Lambda processing**.

## Features

- **Complete Commercetools Integration**: Full support for products, categories, and customers
- **Webhook Product Trigger**: Native trigger for product events; delivers directly to n8n or, when AWS credentials are provided, through an auto-created SQS + Lambda pipeline
- **AWS SQS + Lambda (optional)**: Auto-provisions SQS, Lambda, and IAM via the AWS SDK when AWS credentials are present in the node credentials
- **Event Types**: Product Event Triggers
                    product created,product published,product unpublished,product deleted,
                    product added to category,product removed from category,
                    product image added,product slug changed,product state transition,product reverted staged changes,
                    product variant added,product variant deleted,
                    product price added,product price changed,product price removed,product prices set,product price mode set,product price key set,product price discounts set,product price external discount set,
                    product price custom field added,product price custom field changed,product price custom field removed,
                    product price custom fields set,product price custom fields removed.
                  Customer Event Triggers
                    customer created, customer deleted, customer email verified,
                    customer email changed, customer password updated,
                    customer first name set, customer last name set, customer company name set,
                    customer title set, customer date of birth set, customer stores set,
                    customer group set, customer address added, customer address changed, customer address removed,
                    customer billing address added, customer billing address removed,
                    customer shipping address added, customer shipping address removed,
                    customer default billing address set, customer default shipping address set,
                    customer custom type set, customer custom type removed,
                    customer custom field added, customer custom field changed, customer custom field removed,
                    customer address custom type set, customer address custom type removed,
                    customer address custom field added, customer address custom field changed, customer address custom field removed
           
- **Monitoring**: CloudWatch logging from the generated Lambda function


## Quick Start

**To start developing and testing the Commercetools node:**

```bash
npm install
npm run dev
```

This will start n8n with the Commercetools node loaded and hot reload enabled.

## Webhook Trigger

Use the Commercetools Trigger node to receive events directly in n8n.

1. Add the **Commercetools Trigger** node.
2. Select the event you want to subscribe to.
3. Choose your **Commercetools OAuth2** credentials. To send events through SQS + Lambda, also fill in **AWS Access Key**, **AWS Secret Access Key**, and **AWS Region** in the same credential.
4. Activate your workflow. The node registers a CommerceTools subscription pointing at your n8n webhook URL (`.../webhook/<path>/commercetools-events`). With AWS credentials, it also creates the SQS queue, Lambda function, IAM role, and event source mapping, then forwards messages to n8n.
5. Deactivate or update the trigger to clean up and recreate subscriptions or AWS resources when the configuration changes.

## AWS SQS + Lambda Integration (optional)

When AWS credentials are present in the Commercetools credentials, the trigger:

- Creates an SQS queue, Lambda function, IAM role, and event source mapping for the selected product events.
- Configures the Lambda with your n8n webhook URL so messages are forwarded into the workflow.
- Stores identifiers in workflow static data and deletes the resources when the trigger is removed or reconfigured.

Notes:
- Resource names are generated per activation and include the event type.
- Ensure the n8n webhook endpoint is reachable from AWS.


## Configuration Options

Below are the main configuration options and parameters available for the Commercetools node (resource: product or category):

### Common Parameters
- **resource**: Select 'product' or 'category' to access respective operations.
- **operation**: Choose the desired operation (e.g., create, query, get, update, delete, etc.).
- **Credentials**: Select your configured Commercetools OAuth2 credentials.

### Product Operation-Specific Parameters

#### Create Product
- **productDraft**: JSON object with product details (name, slug, productType, masterVariant, etc.).
- **additionalFieldsCreate**: Optional fields for additional product properties.

#### Query Products
- **returnAll**: Boolean to return all products (up to 500 per request).
- **limit**: Number of products to return per request.
- **offset**: Pagination offset.
- **additionalFields**: Optional filters, sorting, and predicate variables.

#### Search Products
- **searchRequest**: JSON object for advanced search queries.
- **additionalFieldsSearch**: Optional search parameters (limit, offset, staged, etc.).

#### Get Product / Get By Key
- **productId** or **productKey**: ID or key of the product to retrieve.
- **additionalFieldsGet**: Optional fields for expanded data.

#### Update Product / Update By Key
- **productId** or **productKey**: ID or key of the product to update.
- **version**: Product version (required for updates).
- **actions**: Array of update actions (JSON).
- **updateActions**: UI builder that lets you stack multiple product update actions without hand-writing JSON. These can be combined with the `actions` array if you need to mix UI-built and raw payloads.
- **additionalFieldsUpdate**: Optional fields (dataErasure, dryRun, etc.).

#### Delete Product / Delete By Key
- **productId** or **productKey**: ID or key of the product to delete.
- **version**: Product version (required for deletion).
- **additionalFieldsDelete**: Optional fields (dataErasure, etc.).

#### Query Product Selections
- **productId** or **productKey**: ID or key of the product.
- **additionalFieldsSelections**: Optional fields (expand, limit, offset, withTotal, customParameters).

#### Upload Product Image
- **productId**: ID of the product to upload the image to.
- **binaryPropertyName**: Name of the binary property containing the image.
- **additionalFieldsUpload**: Optional fields (variantId, sku, staged, filename, externalUrl, label, customParameters).


### Customer Operation-Specific Parameters

#### Authenticate Customer

- **email**: Customer's email.
- **password**: Customer password.

#### Authenticate Customer in Store

- **storeKey**: Key of the store.
- **email**: Customer email.
- **password**: Customer password.


#### Change Customer Password

- **customerId**: ID of the customer.
- **version**: Customer version.
- **passwordToken**: PasswordToken to authenticate.
- **newPassword**: New password.

#### Change Customer Password in Store

- **storeKey**: Store key.
- **customerId**: ID of the customer.
- **version**: Customer version.
- **passwordToken**: PasswordToken to authenticate.
- **newPassword**: New password.

#### Check if Customer Exists

- **customerId**: Customer ID.

#### Check if Customer Exists by Key

- **customerKey**: Customer key.

#### Check if Any Customer Matches the Query

- **where**: Predicate expression.
- **additionalFieldsCheckQuery**: Optional parameters (store projection, expand).

#### Check if Customer Exists in Store

- **storeKey**: Store key.
- **customerId**: Customer ID.

#### Check if Customer Exists in Store by Key

- **storeKey**: Store key.
- **customerKey**: Customer key.

#### Check if Any Customer Matches the Query in Store

- **storeKey**: Store key.
- **where**: Predicate filter.
- **additionalFieldsCheckQueryStore**: Optional parameters.

#### Create Customer

- **customerDraft**: Customer JSON object (email, firstName, lastName, password, custom, etc.).
- **additionalFieldsCreate**: Optional fields (expand, localeProjection, etc.).

#### Create Email Verification Token

- **id**: Customer ID.
- **version**: Customer version.

#### Create Email Verification Token in Store

- **storeKey**: Store key.
- **id**: Customer ID.
- **version**: Customer version.
- **ttlMinutes**: Optional.

#### Create Customer in Store

- **storeKey**: Store key.
- **customerDraft**: Customer draft JSON.
- **additionalFieldsCreateStore**: Optional fields.


#### Create Password Reset Token

- **email**: Customer email.

#### Create Password Reset Token in Store

- **storeKey**: Store key.
- **email**: Customer email.


#### Delete Customer

- **customerId**: ID of the customer.
- **version**: Version of the customer.

#### Delete Customer by Key

- **customerKey**: Key of the customer.
- **version**: Version.
- **additionalFieldsDeleteKey**: Optional.

#### Delete Customer in Store

- **storeKey**: Store key.
- **customerId**: Customer ID.
- **version**: Version.

#### Delete Customer in Store by Key

- **storeKey**: Store key.
- **customerKey**: Customer key.
- **version**: Version.

#### Get Customer

- **customerId**: Customer ID.
- **additionalFieldsGet**: Optional fields (expand, localeProjection).

#### Get Customer By Email Token

- **emailToken**: Token value.
- **additionalFieldsGetToken**: Optional.

#### Get Customer By Key

- **customerKey**: Customer key.
- **additionalFieldsGetKey**: Optional.

#### Get Customer By Password Token

- **passwordToken**: Token value.
- **additionalFieldsGetPassToken**: Optional.

#### Get Customer in Store

- **storeKey**: Store key.
- **customerId**: Customer ID.
- **additionalFieldsGetStore**: Optional.

#### Get Customer in Store by Email Token

- **storeKey**: Store key.
- **emailToken**: Token value.
- **additionalFieldsGetStoreEmailToken**: Optional.

#### Get Customer in Store by Key

- **storeKey**: Store key.
- **customerKey**: Customer key.
- **additionalFieldsGetStoreKey**: Optional.

#### Get Customer in Store by Password Token

- **storeKey**: Store key.
- **passwordToken**: Token value.
- **additionalFieldsGetStorePassToken**: Optional.

#### Query Customers

- **where**: Predicate expression.
- **limit**: Number of results.
- **offset**: Offset for pagination.
- **sort**: Sorting expressions.
- **additionalFieldsQuery**: Optional fields.

#### Query Customers in Store

- **storeKey**: Store key.
- **where**: Predicate expression.
- **limit**: Number of results.
- **offset**: Pagination offset.
- **sort**: Sorting expression.
- **additionalFieldsQueryStore**: Optional.


#### Reset Customer Password

- **tokenValue**: Password reset token.
- **newPassword**: New password.
- **additionalFieldsResetPwd**: Optional.

#### Reset Customer Password in Store

- **storeKey**: Store key.
- **tokenValue**: Token.
- **newPassword**: New password.
- **additionalFieldsResetPwdStore**: Optional.


#### Update Customer

- **customerId**: Customer ID.
- **version**: Customer version.
- **actions**: Array of update actions.
- **additionalFieldsUpdate**: Optional (expand).

#### Update Customer by Key

- **customerKey**: Customer key.
- **version**: Version.
- **actions**: Update actions array.
- **additionalFieldsUpdateKey**: Optional.

#### Update Customer in Store

- **storeKey**: Store key.
- **customerId**: Customer ID.
- **version**: Version.
- **actions**: Update actions array.
- **additionalFieldsUpdateStore**: Optional.

#### Update Customer in Store by Key

- **storeKey**: Store key.
- **customerKey**: Customer key.
- **version**: Version.
- **actions**: Update actions.
- **additionalFieldsUpdateStoreKey**: Optional.

#### Verify Customer Email

- **tokenValue**: Email verification token.
- **additionalFieldsVerify**: Optional.

#### Verify Customer Email in Store

- **storeKey**: Store key.
- **tokenValue**: Verification token.
- **additionalFieldsVerifyStore**: Optional.

### Category Operation-Specific Parameters

#### Create Category
- **categoryDraft**: JSON object with category details (name, slug, parent, orderHint, etc.).
- **additionalFieldsCreate**: Optional fields for additional category properties.

#### Query Categories
- **returnAll**: Boolean to return all categories (up to 500 per request).
- **limit**: Number of categories to return per request.
- **offset**: Pagination offset.
- **additionalFields**: Optional filters, sorting, and predicate variables.

#### Get Category / Get By Key
- **categoryId** or **categoryKey**: ID or key of the category to retrieve.
- **additionalFieldsGet**: Optional fields for expanded data.

#### Update Category / Update By Key
- **categoryId** or **categoryKey**: ID or key of the category to update.
- **version**: Category version (required for updates).
- **actions**: Array of update actions (JSON). (Categories currently require JSON actions only.)
- **additionalFieldsUpdate**: Optional fields (dataErasure, dryRun, etc.).

#### Delete Category / Delete By Key
- **categoryId** or **categoryKey**: ID or key of the category to delete.
- **version**: Category version (required for deletion).
- **additionalFieldsDelete**: Optional fields (dataErasure, etc.).

Refer to the node UI in n8n for detailed descriptions and validation for each parameter.

Below is a sample workflow using the Commercetools node in n8n to create and query a product.

### Example: Create a Product

1. Add the **Commercetools** node to your workflow.
2. Select the **Create Product** operation.
3. Fill in the required product draft fields (e.g., name, slug, product type, etc.).
4. Select your configured Commercetools credentials.
5. Run the workflow to create a new product in your Commercetools project.

**Sample Input (Product Draft):**
```json
{
  "name": { "en": "Sample Product" },
  "slug": { "en": "sample-product" },
  "productType": { "id": "your-product-type-id" },
  "masterVariant": {
    "sku": "SKU123",
    "prices": [ { "value": { "currencyCode": "USD", "centAmount": 1000 } } ]
  }
}
```


### Example: Query Products

1. Add the **Commercetools** node to your workflow.
2. Select the **Query Products** operation.
3. Optionally set filters, sorting, and pagination parameters.
4. Select your configured Commercetools credentials.
5. Run the workflow to retrieve products from your Commercetools project.

**Sample Output:**
```json
[
  {
    "id": "product-id-1",
    "name": { "en": "Sample Product" },
    "slug": { "en": "sample-product" }
    // ...other product fields
  }
  // ...more products
]
```

### Using updateActions (Product Updates)

The `updateActions` fixed collection lets you compose Commercetools product update commands directly in the node UI, with helper inputs for localized data, prices, assets, and variant targeting. Highlights:
- Choose whether each variant is addressed by `variantId` or `sku`, and mix multiple variant-specific actions in a single request.
- Localized name/slug/meta helpers automatically map locale/value pairs to the format the Commercetools API expects.
- Attribute editors support string/number/boolean parsing so you don't need to pre-format JSON.
- Asset, price, image, and search keyword builders flatten nested fixed collections (sources, dimensions, tokenizers, etc.) into valid drafts.

Supported product update actions:
- Add Asset
- Add External Image
- Add Price
- Add Product Variant
- Add To Category
- Change Asset Name
- Change Asset Order
- Change Master Variant
- Change Name
- Change Price
- Change Slug
- Move Image To Position
- Publish
- Remove Asset
- Remove From Category
- Remove Image
- Remove Price
- Remove Variant
- Revert Staged Changes
- Revert Staged Variant Changes
- Set Asset Custom Field
- Set Asset Custom Type
- Set Asset Description
- Set Asset Key
- Set Asset Sources
- Set Asset Tags
- Set Attribute
- Set Attribute In All Variants
- Set Category Order Hint
- Set Description
- Set Image Label
- Set Key
- Set Meta Description
- Set Meta Keywords
- Set Meta Title
- Set Price Custom Field
- Set Price Key
- Set Price Mode
- Set Prices
- Set Product Attribute
- Set Product Price Custom Type
- Set Product Variant Key
- Set Search Keywords
- Set SKU
- Set Tax Category
- Transition State
- Unpublish

Need a field that isn't exposed yet? Add it via the `actions` JSON array - the node merges both sources in request order.

> **Transition State note:** the builder enforces that either a state ID or a state key is set per the [Commercetools Transition State action](https://docs.commercetools.com/api/projects/products#transition-state).

### Example: Create a Category

1. Add the **Commercetools** node to your workflow.
2. Select the **Create Category** operation.
3. Fill in the required category draft fields (e.g., name, slug, parent, orderHint, etc.).
4. Select your configured Commercetools credentials.
5. Run the workflow to create a new category in your Commercetools project.

**Sample Input (Category Draft):**
```json
{
  "name": { "en": "Sample Category" },
  "slug": { "en": "sample-category" },
  "orderHint": "0.1"
}
```

### Example: Query Categories

1. Add the **Commercetools** node to your workflow.
2. Select the **Query Categories** operation.
3. Optionally set filters, sorting, and pagination parameters.
4. Select your configured Commercetools credentials.
5. Run the workflow to retrieve categories from your Commercetools project.

**Sample Output:**
```json
[
  {
    "id": "category-id-1",
    "name": { "en": "Sample Category" },
    "slug": { "en": "sample-category" }
    // ...other category fields
  }
  // ...more categories
]
```

You can chain Commercetools node operations with other n8n nodes to build advanced workflows for product and category management, automation, and integration.


## Credential Setup

To use the Commercetools node for both product and category operations, you must configure OAuth2 credentials for your Commercetools project in n8n. Follow these steps:

1. **Obtain Commercetools API credentials:**
   - Log in to your Commercetools Merchant Center.
   - Go to the API Clients section and create a new API client.
   - Note the following values:
     - `Client ID`
     - `Client Secret`
     - `Project Key`
     - `Scopes` (ensure you have the required scopes for product and category operations)
     - `Region` (e.g., `australia-southeast1.gcp`)

2. **Add credentials in n8n:**
   - In n8n, go to **Credentials** > **Create New**.
   - Search for and select **Commercetools OAuth2 API**.
   - Fill in the required fields:
     - **Client ID**
     - **Client Secret**
     - **Project Key**
     - **Region**
     - **Scopes**
     - **AWS Client ID**
     - **AWS Client Secret**
   - The AWS fields map to your access key pair and are required for webhook/SQS delivery paths.
   - Save the credentials.

3. **Use credentials in your workflow:**
   - When adding the Commercetools node to your workflow, select the credentials you just created from the credentials dropdown.

Your Commercetools node is now authenticated and ready to use for both product and category operations in n8n workflows.


## Features & Supported Operations

The Commercetools node for n8n enables you to interact with the Commercetools API for product and category management. The following operations are supported:

### Product Operations
- **Create Product**  
  Create a new product in your Commercetools project.

- **Query Products**  
  Retrieve a list of products with support for pagination, sorting, filtering, and predicate variables.

- **Search Products**  
  Perform advanced product searches using the Commercetools search endpoint.

- **Get Product (by ID or Key)**  
  Retrieve detailed information for a specific product by its ID or key.

- **Update Product (by ID or Key)**  
  Update an existing product using one or more update actions. The `updateActions` UI builder now mirrors Commercetools' product update catalog, including localized content helpers, price/asset editors, search keyword builders, and state transitions.

- **Delete Product (by ID or Key)**  
  Delete a product from your project.

- **Query Product Selections (by ID or Key)**  
  Retrieve product selection assignments for a product.

- **Upload Product Image**  
  Upload an image to a product, either from binary data or an external URL.

### Category Operations
- **Create Category**  
  Create a new category in your Commercetools project.

- **Query Categories**  
  Retrieve a list of categories with support for pagination, sorting, and filtering.

- **Get Category (by ID or Key)**  
  Retrieve detailed information for a specific category by its ID or key.

- **Update Category (by ID or Key)**  
  Update an existing category using one or more update actions. (Categories currently require JSON-based `actions`.)

- **Delete Category (by ID or Key)**  
  Delete a category from your project.

### Check Product & Category Existence
- **By ID:** Use the "HEAD" operation with a product or category ID to check if it exists.
- **By Key:** Use the "HEAD by Key" operation with a product or category key.
- **By Query:** Use the "HEAD by Query" operation to check if any product or category matches a specific query.

Each operation supports additional parameters for fine-tuned control, such as staged changes, data erasure, dry run, and more.

## What's Included

- **Commercetools Node**: Located in `nodes/Commercetools/`, this node provides operations for interacting with the Commercetools API, including product management and authentication via OAuth2.
- **Credentials**: OAuth2 credentials for Commercetools in `credentials/CommerceToolsOAuth2Api.credentials.ts`.
- **Utilities and Descriptions**: Helper functions and operation definitions for Commercetools API requests.



## Prerequisites

- **[Node.js](https://nodejs.org/)** (v22 or higher) and npm
- **[git](https://git-scm.com/downloads)**


## Usage

1. **Install dependencies**
  ```bash
  npm install
  ```
2. **Start development server**
  ```bash
  npm run dev
  ```
  This will build the node and launch n8n locally with hot reload enabled. Access n8n at [http://localhost:5678](http://localhost:5678).
3. **Configure Commercetools credentials**
  - Go to n8n's credentials section and add your Commercetools OAuth2 credentials.
4. **Use the Commercetools node in your workflow**
  - Add the Commercetools node to your workflow and select the desired operation (e.g., product management).
  - For product updates, use the `updateActions` builder to stack multiple actions (or combine with `actions` JSON for edge cases).
5. **Lint and build**
  - Lint: `npm run lint`
  - Auto-fix: `npm run lint:fix`
  - Build: `npm run build`
6. **Publish**
  - When ready, publish your package to npm:
    ```bash
    npm publish
    ```


## Available Scripts

| Script                | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `npm run dev`         | Start n8n with the Commercetools node and watch for changes      |
| `npm run build`       | Compile TypeScript to JavaScript for production                  |
| `npm run build:watch` | Build in watch mode (auto-rebuild on changes)                    |
| `npm run lint`        | Check your code for errors and style issues                      |
| `npm run lint:fix`    | Automatically fix linting issues when possible                   |
| `npm run release`     | Create a new release                                             |




## Error Handling & Troubleshooting

Here are common errors and troubleshooting tips for the Commercetools node (products and categories):

- **Authentication Errors:**
  - Ensure your OAuth2 credentials (Client ID, Client Secret, Project Key, Region, Scopes) are correct and have the required permissions.
  - If you see an authentication error, re-authorize or recreate your credentials in n8n.

- **Missing or Invalid Parameters:**
  - Double-check required fields for each operation:
    - For products: productDraft, productId/productKey, version, etc.
    - For categories: categoryDraft, categoryId/categoryKey, version, etc.
  - The node will display a clear error if a required parameter is missing or invalid.

- **API Errors:**
  - Errors from the Commercetools API (e.g., 404 Not Found, 400 Bad Request) will be shown in the node output or n8n error panel.
  - Review the error message for details and check your input data.

- **Not Found (Product/Category):**
  - For get, update, delete, or existence checks, ensure the productId/productKey or categoryId/categoryKey is correct and the item exists in your project.

- **Version Mismatch:**
  - For update and delete operations, the version must match the current version in Commercetools. Retrieve the latest version before updating or deleting (applies to both products and categories).

- **Binary Data Issues (Image Upload):**
  - Ensure the binary property name matches the uploaded file and the file is present in the workflow (product image upload only).

- **General Node Issues:**
  - If the node does not appear in n8n, ensure dependencies are installed, the node is registered in `package.json`, and the dev server is running.
  - Check the n8n console and logs for error details.

For linting or TypeScript errors, use the provided scripts or consult the [n8n node development guidelines](https://docs.n8n.io/integrations/creating-nodes/).


## Resources

- **[n8n Node Documentation](https://docs.n8n.io/integrations/creating-nodes/)**
- **[n8n Community Forum](https://community.n8n.io/)**
- **[@n8n/node-cli Documentation](https://www.npmjs.com/package/@n8n/node-cli)**


## Contributing

Contributions and suggestions for improving the Commercetools node are welcome. Please open an issue or submit a pull request.



## Changelog

See `CHANGELOG.md` for the full history. Highlights:

- **v0.1.17**: Added customer event triggers, refreshed the Commercetools trigger, and refactored the Lambda handler.
- **v0.1.16**: Clarified AWS SQS/Lambda webhook delivery setup in the README.
- **v0.1.15**: Updated AWS trigger infrastructure and test payloads.
- **v0.1.14**: Added product trigger event coverage and consolidated trigger/actions.

## License

[MIT](LICENSE.md)
