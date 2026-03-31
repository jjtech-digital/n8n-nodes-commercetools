---
name: prettier
description: Applies consistent code formatting with tabs and single quotes across the n8n-nodes-commercetools codebase using Prettier 3.8
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Prettier Skill

Formats TypeScript source files in this project using Prettier 3.8 with the project's `.prettierrc.js` config: tabs (width 2), single quotes, trailing commas everywhere, semicolons, 100-character line width, and LF line endings. Generated files in `nodes/Commercetools/generated/` are excluded from formatting.

## Quick Start

```bash
# Format all files (via lint:fix which includes prettier)
npm run lint:fix

# Check formatting without writing
npx prettier --check "**/*.ts" --ignore-path .gitignore

# Format a specific file
npx prettier --write nodes/Commercetools/Commercetools.node.ts
```

## Key Concepts

- **Config file:** `.prettierrc.js` — single source of truth for all formatting rules
- **Tab indentation:** This project uses tabs, not spaces — matches n8n's internal code style
- **Single quotes:** All strings use `'single'` not `"double"`
- **Trailing commas:** Objects, arrays, function params all get trailing commas (`"all"`)
- **Line width:** 100 characters (wider than typical 80 to accommodate n8n's verbose type signatures)
- **Generated files:** `nodes/Commercetools/generated/*.ts` are auto-generated and should not be manually formatted or linted
- **ESLint integration:** `eslint-plugin-prettier` runs Prettier as an ESLint rule — `npm run lint:fix` covers both

## Common Patterns

**Format all source TypeScript (excluding generated):**
```bash
npx prettier --write "credentials/**/*.ts" "nodes/Commercetools/*.ts" "nodes/Commercetools/utils/**/*.ts" "scripts/**/*.ts"
```

**Check if a file is already formatted:**
```bash
npx prettier --check nodes/Commercetools/utils/subscription.utils.ts
```

**Format after editing a utility file:**
```bash
npx prettier --write nodes/Commercetools/utils/awsInfra.utils.ts
```

**Run full lint + format fix pipeline:**
```bash
npm run lint:fix
```

**Verify `.prettierrc.js` config is respected:**
```bash
npx prettier --config .prettierrc.js --check "**/*.ts"
```