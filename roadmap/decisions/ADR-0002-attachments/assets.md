# @textforge/assets

## Selected package

`@textforge/assets`

## Files created

- `packages/assets/src/capabilities.js`
- `packages/assets/src/binding.js`
- `packages/assets/src/surfaces.js`
- `packages/assets/src/commands.js`
- `packages/assets/src/manifest.js`
- `packages/assets/src/types.ts`
- `packages/assets/src/binding.ts`
- `packages/assets/src/surfaces.ts`
- `packages/assets/src/manifest.ts`

## Files modified

- `packages/assets/src/index.js`
- `packages/assets/src/index.ts`

## Files removed

None.

## Before / after public export comparison

Before and after runtime exports are identical:

- `assetCapabilities`
- `assetCommandContributions`
- `assetSurfaceContributions`
- `contributions`
- `createAssetContributionManifest`
- `createAssetProvenanceLabel`
- `createAssetViewerSurface`
- `createAssetViewerSurfaceContribution`
- `createAssetViewerSurfaceModel`
- `createBinaryAssetViewerSurface`
- `createBlobUrlLedger`
- `createImageAssetViewerSurface`
- `createPdfAssetViewerSurface`
- `createSvgAssetViewerSurface`
- `createWorkspaceAssetBinding`
- `markAssetBindingReady`
- `markAssetBindingReleased`
- `markAssetBindingStale`
- `selectAssetViewerKind`

Type exports remain available from `src/index.ts` through the root declaration barrel.

## Import compatibility notes

- Package root `@textforge/assets` remains the public import path.
- No package manifest or export map changes were made.
- No external deep imports into `@textforge/assets/src` or `@textforge/assets/dist` were introduced.

## Commands run

- `corepack pnpm --filter @textforge/assets lint`
- `corepack pnpm --filter @textforge/assets typecheck`
- `corepack pnpm --filter @textforge/assets test`
- `corepack pnpm --filter @textforge/assets build`
- `node -e "import('./packages/assets/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- `rg "@textforge/assets/src/|@textforge/assets/dist/" apps packages --glob '!**/node_modules/**'`
- `rg "@textforge/assets" apps packages --glob '!**/node_modules/**'`

## Test/build results

All package-local lint, typecheck, test, and build commands passed.

## Remaining risks or manual checks

The split is internal and behavior-preserving. The remaining integration risk is limited to consumers of the package root, covered by final workspace verification.
