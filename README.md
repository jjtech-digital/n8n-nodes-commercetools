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



## Features & Supported Operations

The Commercetools node for n8n enables you to interact with the Commercetools API for product management. The following operations are supported:

- **Create Product**  
  Create a new product in your Commercetools project.

- **Query Products**  
  Retrieve a list of products with support for pagination, sorting, filtering, and predicate variables.

- **Search Products**  
  Perform advanced product searches using the Commercetools search endpoint.

- **Check Product Existence (HEAD by Query, ID, or Key)**  
  Check if a product exists by query, product ID, or product key.

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


## Troubleshooting

- If the Commercetools node does not appear in n8n:
  1. Ensure dependencies are installed (`npm install`).
  2. Confirm the node is registered in `package.json` under `n8n.nodes`.
  3. Restart the dev server (`npm run dev`).
  4. Check the console for errors.

- For linting or TypeScript errors, use the provided scripts or consult the [n8n node development guidelines](https://docs.n8n.io/integrations/creating-nodes/).


## Resources

- **[n8n Node Documentation](https://docs.n8n.io/integrations/creating-nodes/)**
- **[n8n Community Forum](https://community.n8n.io/)**
- **[@n8n/node-cli Documentation](https://www.npmjs.com/package/@n8n/node-cli)**


## Contributing

Contributions and suggestions for improving the Commercetools node are welcome. Please open an issue or submit a pull request.


## License

[MIT](LICENSE.md)
