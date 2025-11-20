![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)


# n8n-nodes-commercetools

This repository provides a custom [n8n](https://n8n.io) node for integrating with [Commercetools](https://commercetools.com). It includes all required credentials, node definitions, and utilities to interact with the Commercetools API.


## Quick Start

**To start developing and testing the Commercetools node:**

```bash
npm install
npm run dev
```

This will start n8n with the Commercetools node loaded and hot reload enabled.






## Configuration Options

Below are the main configuration options and parameters available for the Commercetools node (resource: product):

### Common Parameters
- **resource**: Select 'product' to access product operations.
- **operation**: Choose the desired product operation (e.g., create, query, get, update, delete, etc.).
- **Credentials**: Select your configured Commercetools OAuth2 credentials.

### Operation-Specific Parameters

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
- **actionsUi**: UI-based update actions.
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
    "slug": { "en": "sample-product" },
    // ...other product fields
  },
  // ...more products
]
```

You can chain Commercetools node operations with other n8n nodes to build advanced workflows for product management, automation, and integration.

## Credential Setup

To use the Commercetools node, you must configure OAuth2 credentials for your Commercetools project in n8n. Follow these steps:

1. **Obtain Commercetools API credentials:**
  - Log in to your Commercetools Merchant Center.
  - Go to the API Clients section and create a new API client.
  - Note the following values:
    - `Client ID`
    - `Client Secret`
    - `Project Key`
    - `Scopes` (ensure you have the required scopes for product operations)
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
  - Save the credentials.

3. **Use credentials in your workflow:**
  - When adding the Commercetools node to your workflow, select the credentials you just created from the credentials dropdown.

Your Commercetools node is now authenticated and ready to use in n8n workflows.


## Features & Supported Operations

The Commercetools node for n8n enables you to interact with the Commercetools API for product management. The following operations are supported:

- **Create Product**  
  Create a new product in your Commercetools project.

- **Query Products**  
  Retrieve a list of products with support for pagination, sorting, filtering, and predicate variables.

- **Search Products**  
  Perform advanced product searches using the Commercetools search endpoint.

- **Get Product (by ID or Key)**  
  Retrieve detailed information for a specific product by its ID or key.

- **Update Product (by ID or Key)**  
  Update an existing product using one or more update actions.

- **Delete Product (by ID or Key)**  
  Delete a product from your project.

- **Query Product Selections (by ID or Key)**  
  Retrieve product selection assignments for a product.

- **Upload Product Image**  
  Upload an image to a product, either from binary data or an external URL.

### Check Product Existence

- **By ID:** Use the "HEAD" operation with a product ID to check if a product exists.
- **By Key:** Use the "HEAD by Key" operation with a product key.
- **By Query:** Use the "HEAD by Query" operation to check if any product matches a specific query.

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

Here are common errors and troubleshooting tips for the Commercetools node:

- **Authentication Errors:**
  - Ensure your OAuth2 credentials (Client ID, Client Secret, Project Key, Region, Scopes) are correct and have the required permissions.
  - If you see an authentication error, re-authorize or recreate your credentials in n8n.

- **Missing or Invalid Parameters:**
  - Double-check required fields for each operation (e.g., productDraft for create, productId/productKey for get/update/delete, version for update/delete).
  - The node will display a clear error if a required parameter is missing or invalid.

- **API Errors:**
  - Errors from the Commercetools API (e.g., 404 Not Found, 400 Bad Request) will be shown in the node output or n8n error panel.
  - Review the error message for details and check your input data.

- **Product Not Found:**
  - For get, update, delete, or existence checks, ensure the productId or productKey is correct and the product exists in your project.

- **Version Mismatch:**
  - For update and delete operations, the product version must match the current version in Commercetools. Retrieve the latest version before updating or deleting.

- **Binary Data Issues (Image Upload):**
  - Ensure the binary property name matches the uploaded file and the file is present in the workflow.

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


## License

[MIT](LICENSE.md)
