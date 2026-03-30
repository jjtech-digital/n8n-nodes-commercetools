# Prettier Formatting Workflows

## When to use
Follow these workflows after editing source files, before opening a PR, or when the CI formatting check fails.

## Workflows

### After editing a utility or node file
```bash
npx prettier --write nodes/Commercetools/utils/subscription.utils.ts
npm run lint
```
Format the changed file first, then run lint to catch any remaining ESLint issues.

### Before opening a pull request
```bash
npm run lint:fix
```
Runs the full lint + Prettier pass across all source files. Commit the result. This is the single command that satisfies CI.

### When CI reports a formatting failure
```bash
# Identify the offending file from CI output, then:
npx prettier --check nodes/Commercetools/Commercetools.node.ts

# Fix it:
npx prettier --write nodes/Commercetools/Commercetools.node.ts
```
Check before write confirms the file is actually wrong. Write applies the fix. Re-run `npm run lint` to verify.

## Pitfalls

- **Don't run `npx prettier --write "**/*.ts"`** without exclusions — it will reformat `generated/` files, creating noisy diffs that conflict with the next `npm run generate` run.
- `npm run lint` (without `fix`) is read-only and will not auto-correct formatting — use `lint:fix` when you want changes written.