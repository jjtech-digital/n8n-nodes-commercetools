---
name: node
description: Manages Node.js runtime environment and dependencies for n8n-nodes-commercetools
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Node Skill

Manages the Node.js 22.x runtime environment, npm dependencies, and package configuration for the n8n-nodes-commercetools project. Handles installation, version verification, dependency auditing, and package.json maintenance in a TypeScript-strict n8n community node context.

## Quick Start

```bash
# Verify Node.js version (requires 22.x+)
node --version

# Install all dependencies
npm install

# Check for outdated packages
npm outdated

# Audit for vulnerabilities
npm audit

# Update a specific package
npm update <package-name>
```

## Key Concepts

- **Runtime requirement:** Node.js 22.x or higher — enforced by n8n's custom node infrastructure
- **Package manager:** npm (no yarn/pnpm — scripts assume npm)
- **Peer dependency:** `n8n-workflow` is a peer dep; the version installed in the host n8n instance takes precedence
- **Production deps:** `aws-sdk`, `@google-cloud/pubsub`, `@google-cloud/storage`, `googleapis`, `@commercetools/platform-sdk`, `adm-zip` — all bundled into `dist/`
- **Dev deps:** `@n8n/node-cli` drives build, lint, test, and release; `ts-node` runs generation scripts
- **Published files:** only `dist/` and `package.json` are included in the npm package (`"files"` field)

## Common Patterns

### Check runtime compatibility
```bash
node --version   # must be >= 22.x
npm --version
```

### Add a new dependency
```bash
npm install <package> --save
# or for dev-only tooling:
npm install <package> --save-dev
```

### Sync after pulling changes
```bash
npm install       # installs/updates per package-lock.json
npm run build     # recompile dist/
```

### Investigate a dependency issue
```bash
npm ls <package-name>        # show installed version tree
npm audit fix                # auto-fix non-breaking vulnerabilities
npm dedupe                   # flatten duplicate packages
```

### Verify published package contents
```bash
npm pack --dry-run           # list files that would be published
```

### Run the full update pipeline
```bash
npm run generate             # regenerate from Postman collection
npm run build                # compile TypeScript → dist/
```