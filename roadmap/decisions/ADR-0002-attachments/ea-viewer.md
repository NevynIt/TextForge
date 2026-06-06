# ADR-0002 EA Viewer Attachment

## Selected Package

- `@textforge/ea-viewer`

## Scope

- Refactored only `packages/ea-viewer/**`.
- Added this report at `roadmap/decisions/ADR-0002-attachments/ea-viewer.md`.
- No package manifest changes.
- No new public package subpaths; `package.json` still exports only `"."`.
- No commits created.

## Files Created

- `packages/ea-viewer/src/dom-rendering.js`
- `packages/ea-viewer/src/fixture.js`
- `packages/ea-viewer/src/fixture.ts`
- `packages/ea-viewer/src/graph.js`
- `packages/ea-viewer/src/graph.ts`
- `packages/ea-viewer/src/ids.js`
- `packages/ea-viewer/src/ids.ts`
- `packages/ea-viewer/src/manifest.js`
- `packages/ea-viewer/src/manifest.ts`
- `packages/ea-viewer/src/viewer-surface.js`
- `packages/ea-viewer/src/viewer-surface.ts`

## Files Modified

- `packages/ea-viewer/scripts/check.mjs`
- `packages/ea-viewer/src/index.js`
- `packages/ea-viewer/src/index.ts`

## Files Removed

- None.

## Module Split

- `ids`: package capability/surface IDs and JSON document predicate.
- `fixture`: Django fixture recognition, normalization, model relationship resolution, and viewer model creation.
- `dom-rendering`: fallback HTML escaping/rendering and CSP-nonced package style injection.
- `graph`: Dagre engine verification, graph layout, EA graph construction, and graph helper functions used by the viewer.
- `viewer-surface`: React viewer components, runtime mounting, and the surface contribution object.
- `manifest`: contribution manifest factory and default `contributions`.

## Before Public Runtime Exports

- `buildGlobalGraph`
- `contributions`
- `createDagreLayoutEngine`
- `createEaViewerContributionManifest`
- `createEaViewerModel`
- `eaDashboardJsonDocumentPredicate`
- `eaViewerCapabilityId`
- `eaViewerSurfaceContribution`
- `eaViewerSurfaceId`
- `isEaDashboardFixture`
- `normalizeEaDashboardFixture`
- `verifyDagreLayoutEngine`

## After Public Runtime Exports

- Same as before. Verified with dynamic import of `packages/ea-viewer/src/index.js`.

## Public Type Exports Preserved

- `EaDashboardEntity`
- `EaDashboardFixtureRecord`
- `EaDashboardModel`
- `EaDashboardNormalizeResult`

## Public Type Facade Notes

- The root TypeScript facade continues to expose the previous public types and declared runtime values.
- `createEaViewerContributionManifest` remains a runtime export from `src/index.js`, matching the pre-refactor JavaScript contract, but is intentionally not added to `src/index.ts` because it was not declared there before this split.

## Import Compatibility

- Existing root imports remain compatible through explicit facades in `packages/ea-viewer/src/index.js` and `packages/ea-viewer/src/index.ts`.
- Root import scan found package-level `@textforge/ea-viewer` usage in `apps/textforge-web` and package-local tests/scripts.
- Deep-import pattern scans for `from '@textforge/ea-viewer/`, `from "@textforge/ea-viewer/`, `import('@textforge/ea-viewer/`, and `import("@textforge/ea-viewer/` across `apps` and `packages` returned no matches.
- Broad `@textforge/ea-viewer/` scan returns only ID string literals such as `@textforge/ea-viewer/dashboard`, not import paths.
- `tests` and `examples` directories were not present in this workspace.

## Commands Run

- `git status --short`
- `Get-ChildItem -Path packages/ea-viewer -Force`
- `Get-ChildItem -Path packages/ea-viewer/src -Force`
- `Get-Content -Path packages/ea-viewer/src/index.js`
- `Get-Content -Path packages/ea-viewer/src/index.ts`
- `Get-Content -Path packages/ea-viewer/package.json`
- `Get-Content -Path roadmap/decisions/ADR-0002-package-root-modularization.md`
- `rg -n "^export " packages/ea-viewer/src/index.js packages/ea-viewer/src/index.ts`
- `rg -n "^(function|const|class) |^export (function|const|class)|^export default" packages/ea-viewer/src/index.js`
- `rg -n "@textforge/ea-viewer" apps packages tests examples`
- `rg -n "@textforge/ea-viewer" apps packages`
- `rg -n "@textforge/ea-viewer/" apps packages`
- `rg -n "from '@textforge/ea-viewer/" apps packages`
- `rg -n 'from "@textforge/ea-viewer/' apps packages`
- `rg -n "import\\('@textforge/ea-viewer/" apps packages`
- `rg -n 'import\\("@textforge/ea-viewer/' apps packages`
- `Get-ChildItem packages/ea-viewer/src -Filter *.js | ForEach-Object { node --check $_.FullName }`
- `node -e "import('./packages/ea-viewer/src/index.js').then((m)=>console.log(Object.keys(m).sort().join('\\n')))"`
- `npm run lint --workspace @textforge/ea-viewer`
- `npm run typecheck --workspace @textforge/ea-viewer`
- `npm run test --workspace @textforge/ea-viewer`
- `npm run build --workspace @textforge/ea-viewer`
- `corepack pnpm --filter @textforge/ea-viewer lint`
- `corepack pnpm --filter @textforge/ea-viewer typecheck`
- `corepack pnpm --filter @textforge/ea-viewer test`
- `corepack pnpm --filter @textforge/ea-viewer build`
- `rg "@textforge/ea-viewer/src/|@textforge/ea-viewer/dist/" apps packages --glob '!**/node_modules/**'`
- `rg "from '@textforge/ea-viewer'|from \"@textforge/ea-viewer\"" apps packages --glob '!**/node_modules/**'`
- `git status --short -- packages/ea-viewer roadmap/decisions/ADR-0002-attachments/ea-viewer.md`
- `git diff --name-status -- packages/ea-viewer roadmap/decisions/ADR-0002-attachments/ea-viewer.md`

## Results

- JavaScript syntax check for every `packages/ea-viewer/src/*.js` file passed.
- Runtime dynamic import of the root facade passed and returned the preserved export names.
- `npm run lint --workspace @textforge/ea-viewer`: passed.
- `npm run typecheck --workspace @textforge/ea-viewer`: passed.
- `npm run test --workspace @textforge/ea-viewer`: passed, 12 tests passed.
- `npm run build --workspace @textforge/ea-viewer`: passed.
- `corepack pnpm --filter @textforge/ea-viewer lint`: passed.
- `corepack pnpm --filter @textforge/ea-viewer typecheck`: passed.
- `corepack pnpm --filter @textforge/ea-viewer test`: passed, 12 tests passed.
- `corepack pnpm --filter @textforge/ea-viewer build`: passed.
- Deep-import grep: no `@textforge/ea-viewer/` import paths found.
- Intermediate `npm run test --workspace @textforge/ea-viewer` failed once after the initial split because `securityLevel` was still fixture-local while graph rendering used it; moving the helper into `graph.js` fixed the failure.

## Risks

- The package `typecheck` and `build` scripts are `node --check src/index.js`, so they validate JavaScript syntax but not TypeScript declaration graph semantics.
- Internal module filenames now exist under `src`; the package export map continues to expose only the root package entrypoint.
- The package-local lint script now scans all split `src/*.js` files for existing source-policy assertions that previously only needed to inspect monolithic `src/index.js`.
