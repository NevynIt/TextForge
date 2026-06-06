# @textforge/renderer-sigma

## Selected package

`@textforge/renderer-sigma`

## Files created

- `packages/renderer-sigma/src/constants.js`
- `packages/renderer-sigma/src/predicate.js`
- `packages/renderer-sigma/src/predicate.ts`
- `packages/renderer-sigma/src/html.js`
- `packages/renderer-sigma/src/graph-descriptor.js`
- `packages/renderer-sigma/src/graph-descriptor.ts`
- `packages/renderer-sigma/src/style.js`
- `packages/renderer-sigma/src/diagnostics.js`
- `packages/renderer-sigma/src/surface-model.js`
- `packages/renderer-sigma/src/surface-model.ts`
- `packages/renderer-sigma/src/runtime-graphology.js`
- `packages/renderer-sigma/src/runtime.js`
- `packages/renderer-sigma/src/contribution.js`
- `packages/renderer-sigma/src/contribution.ts`
- `packages/renderer-sigma/src/types.ts`

## Files modified

- `packages/renderer-sigma/src/index.js`
- `packages/renderer-sigma/src/index.ts`

## Files removed

None.

## Before / after public export comparison

Before and after runtime exports are identical:

- `contributions`
- `createRendererSigmaContributionManifest`
- `createSigmaGraphDescriptor`
- `createSigmaSurfaceModel`
- `findSigmaMatches`
- `sigmaItmDocumentPredicate`
- `sigmaSurfaceContribution`

Type exports remain available from `src/index.ts` through the declaration barrel.

## Import compatibility notes

- Package root `@textforge/renderer-sigma` remains the public import path.
- No package manifest or export map changes were made.
- No external deep imports into `@textforge/renderer-sigma/src` or `@textforge/renderer-sigma/dist` were introduced.

## Commands run

- `corepack pnpm --filter @textforge/renderer-sigma lint`
- `corepack pnpm --filter @textforge/renderer-sigma typecheck`
- `corepack pnpm --filter @textforge/renderer-sigma test`
- `corepack pnpm --filter @textforge/renderer-sigma build`
- `node -e "import('./packages/renderer-sigma/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- `rg "@textforge/renderer-sigma/src/|@textforge/renderer-sigma/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local lint, typecheck, test, and build commands passed.

## Remaining risks or manual checks

Runtime browser mounting was not visually exercised in this package-local pass. Final app validation should cover renderer integration.
