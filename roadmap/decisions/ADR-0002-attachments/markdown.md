# @textforge/markdown

## Package

`@textforge/markdown`

## Files created

- `packages/markdown/src/api.ts`
- `packages/markdown/src/contributions.js`
- `packages/markdown/src/fences.js`
- `packages/markdown/src/html.js`
- `packages/markdown/src/preview.js`
- `packages/markdown/src/processor.js`
- `packages/markdown/src/render.js`
- `packages/markdown/src/snippets.js`
- `packages/markdown/src/support.js`
- `packages/markdown/src/tfmd.js`
- `packages/markdown/src/types.ts`
- `roadmap/decisions/ADR-0002-attachments/markdown.md`

## Files modified

- `packages/markdown/src/index.js`
- `packages/markdown/src/index.ts`

## Files removed

None.

## Public export comparison

Before and after root runtime exports match exactly:

- `contributions`
- `createMarkdownContributionManifest`
- `createMarkdownPreviewModel`
- `createMarkdownPreviewSurface`
- `createMarkdownSnippet`
- `createPrintOptimizedHtmlDocument`
- `markdownCapabilities`
- `markdownCommandContributions`
- `markdownDocumentPredicate`
- `markdownFenceHandlerContributions`
- `markdownPreviewSurfaceContribution`
- `parseMarkdownCapabilityRequirements`
- `renderMarkdownDocument`
- `tfmdFenceAliases`

The `src/index.ts` declaration facade preserves the pre-refactor type-level export list. `markdownCapabilities` and `markdownFenceHandlerContributions` remain runtime exports from `src/index.js`, matching the pre-refactor JavaScript contract, but are intentionally not added to the public declaration facade because they were not declared there before this split.

## Import compatibility notes

No package manifest changes were made. `src/index.js` and `src/index.ts` remain the root public facades. The new package-local modules are internal implementation modules and no export subpaths were added.

Deep-import search command returned no matches:

`rg "@textforge/markdown/|packages/markdown/src/|packages\\markdown\\src\\|\\.\\./\\.\\./markdown/src|\\.\\./markdown/src" -g "*.js" -g "*.ts" -g "*.mjs" -g "*.md"`

## Commands run

- `node --check packages/markdown/src/index.js`
- `node -e "import('./packages/markdown/src/index.js').then(m=>console.log(Object.keys(m).sort().join('\\n')))"`
- `corepack pnpm --filter @textforge/markdown lint`
- `corepack pnpm --filter @textforge/markdown typecheck`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter @textforge/markdown build`
- `rg "@textforge/markdown/|packages/markdown/src/|packages\\markdown\\src\\|\\.\\./\\.\\./markdown/src|\\.\\./markdown/src" -g "*.js" -g "*.ts" -g "*.mjs" -g "*.md"`

## Test/build results

- Lint: passed.
- Typecheck: passed.
- Test: passed, 12 tests.
- Build: passed.
- Deep-import search: passed, no matches.

## Remaining risks or manual checks

- The package scripts validate JavaScript syntax and behavior but do not run a TypeScript compiler over declaration files. An optional `corepack pnpm exec tsc -p packages/markdown/tsconfig.json` check was attempted and could not run because `tsc` is not installed in the workspace.
- The runtime has intentional package-local circular references between contribution metadata and preview/fence helpers through ESM live bindings. Package tests exercise those paths successfully.
