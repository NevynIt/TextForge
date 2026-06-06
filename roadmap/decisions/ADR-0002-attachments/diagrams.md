# @textforge/diagrams

## Selected package

`@textforge/diagrams`

## Files created

- `packages/diagrams/src/capabilities.js`
- `packages/diagrams/src/capabilities.ts`
- `packages/diagrams/src/renderers.js`
- `packages/diagrams/src/renderers.ts`
- `packages/diagrams/src/pipelines.js`
- `packages/diagrams/src/pipelines.ts`
- `packages/diagrams/src/generated-resources.js`
- `packages/diagrams/src/generated-resources.ts`
- `packages/diagrams/src/fence-handlers.js`
- `packages/diagrams/src/fence-handlers.ts`
- `packages/diagrams/src/manifest.js`
- `packages/diagrams/src/manifest.ts`
- `packages/diagrams/src/types.ts`

## Files modified

- `packages/diagrams/src/index.js`
- `packages/diagrams/src/index.ts`

## Files removed

None.

## Before / after public export comparison

Before and after runtime exports are identical:

- `contributions`
- `createDiagramContributionManifest`
- `createDiagramFenceHandlers`
- `createDiagramGeneratedResources`
- `createGeneratedDiagramPath`
- `createGraphvizFenceHandler`
- `createMermaidFenceHandler`
- `diagramCapabilities`
- `diagramFenceHandlerContributions`
- `diagramPipelineContributions`
- `rasterizeSvgToPngBytes`
- `renderGraphvizToSvg`
- `renderMermaidToSvg`

Type exports remain available from `src/index.ts` through the declaration barrel.

## Import compatibility notes

- Package root `@textforge/diagrams` remains the public import path.
- No package manifest or export map changes were made.
- No external deep imports into `@textforge/diagrams/src` or `@textforge/diagrams/dist` were introduced.

## Commands run

- `corepack pnpm --filter @textforge/diagrams lint`
- `corepack pnpm --filter @textforge/diagrams typecheck`
- `corepack pnpm --filter @textforge/diagrams test`
- `corepack pnpm --filter @textforge/diagrams build`
- `node -e "import('./packages/diagrams/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- `rg "@textforge/diagrams/src/|@textforge/diagrams/dist/" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local lint, typecheck, test, and build commands passed.

## Remaining risks or manual checks

Mermaid rendering still requires a browser document; package tests preserve the existing Node-side failure expectation. Final app validation should cover browser-rendered diagram paths.
