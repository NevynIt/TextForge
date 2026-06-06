# @textforge/renderer-jsmind

## Selected package

`@textforge/renderer-jsmind`

## Files created

- `packages/renderer-jsmind/src/constants.js`
- `packages/renderer-jsmind/src/predicate.js`
- `packages/renderer-jsmind/src/predicate.ts`
- `packages/renderer-jsmind/src/model.js`
- `packages/renderer-jsmind/src/model.ts`
- `packages/renderer-jsmind/src/html.js`
- `packages/renderer-jsmind/src/execution.js`
- `packages/renderer-jsmind/src/runtime-dom.js`
- `packages/renderer-jsmind/src/runtime-hierarchy.js`
- `packages/renderer-jsmind/src/runtime-mount.js`
- `packages/renderer-jsmind/src/contribution.js`
- `packages/renderer-jsmind/src/contribution.ts`

## Files modified

- `packages/renderer-jsmind/src/index.js`
- `packages/renderer-jsmind/src/index.ts`

## Files removed

None.

## Before / after public export comparison

Before and after runtime exports are identical:

- `contributions`
- `createJsMindNodeArray`
- `createJsMindSurfaceModel`
- `createRendererJsMindContributionManifest`
- `findJsMindMatches`
- `jsmindItmDocumentPredicate`
- `jsmindSurfaceContribution`

Type exports remain available from `src/index.ts` through the declaration barrel.

## Import compatibility notes

- Package root `@textforge/renderer-jsmind` remains the public import path.
- No package manifest or export map changes were made.
- No external deep imports into `@textforge/renderer-jsmind/src` or `@textforge/renderer-jsmind/dist` were introduced.

## Commands run

- `corepack pnpm --filter @textforge/renderer-jsmind lint`
- `corepack pnpm --filter @textforge/renderer-jsmind typecheck`
- `corepack pnpm --filter @textforge/renderer-jsmind test`
- `corepack pnpm --filter @textforge/renderer-jsmind build`
- `node -e "import('./packages/renderer-jsmind/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- `rg "@textforge/renderer-jsmind/src/|@textforge/renderer-jsmind/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local lint, typecheck, test, and build commands passed.

## Remaining risks or manual checks

Runtime browser mounting was not visually exercised in this package-local pass. Final app validation should cover renderer integration.
