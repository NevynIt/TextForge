# @textforge/renderer-cytoscape

## Selected package

`@textforge/renderer-cytoscape`

## Files created

- `packages/renderer-cytoscape/src/constants.js`
- `packages/renderer-cytoscape/src/predicate.js`
- `packages/renderer-cytoscape/src/predicate.ts`
- `packages/renderer-cytoscape/src/model.js`
- `packages/renderer-cytoscape/src/model.ts`
- `packages/renderer-cytoscape/src/types.ts`
- `packages/renderer-cytoscape/src/html.js`
- `packages/renderer-cytoscape/src/runtime-style.js`
- `packages/renderer-cytoscape/src/runtime-dom.js`
- `packages/renderer-cytoscape/src/resolver.js`
- `packages/renderer-cytoscape/src/contribution.js`
- `packages/renderer-cytoscape/src/contribution.ts`

## Files modified

- `packages/renderer-cytoscape/src/index.js`
- `packages/renderer-cytoscape/src/index.ts`

## Files removed

None.

## Before / after public export comparison

Before and after runtime exports are identical:

- `contributions`
- `createCytoscapeElements`
- `createCytoscapeSurfaceModel`
- `createRendererCytoscapeContributionManifest`
- `cytoscapeItmDocumentPredicate`
- `cytoscapeSurfaceContribution`
- `findCytoscapeMatches`

Type exports remain available from `src/index.ts` through the declaration barrel.

## Import compatibility notes

- Package root `@textforge/renderer-cytoscape` remains the public import path.
- No package manifest or export map changes were made.
- No external deep imports into `@textforge/renderer-cytoscape/src` or `@textforge/renderer-cytoscape/dist` were introduced.

## Commands run

- `corepack pnpm --filter @textforge/renderer-cytoscape lint`
- `corepack pnpm --filter @textforge/renderer-cytoscape typecheck`
- `corepack pnpm --filter @textforge/renderer-cytoscape test`
- `corepack pnpm --filter @textforge/renderer-cytoscape build`
- `node -e "import('./packages/renderer-cytoscape/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- `rg "@textforge/renderer-cytoscape/src/|@textforge/renderer-cytoscape/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local lint, typecheck, test, and build commands passed.

## Remaining risks or manual checks

Runtime browser mounting was not visually exercised in this package-local pass. Final app validation should cover renderer integration.
