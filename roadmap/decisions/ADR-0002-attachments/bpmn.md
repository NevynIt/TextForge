# @textforge/bpmn Modularization Report

## Selected Package

`@textforge/bpmn`

## Current Responsibilities And Split

The package root owned BPMN capability IDs, semantic MVP fixtures, Diagram Interchange parsing/application, BPMN XML viewer model creation, browser viewer runtime mounting, semantic validation, surface contribution metadata, and the contribution manifest. The refactor keeps `src/index.js` and `src/index.ts` as explicit public facades and moves implementation into package-internal modules by those responsibilities.

## Files Created

- `packages/bpmn/src/diagram-interchange.js`
- `packages/bpmn/src/diagram-interchange.ts`
- `packages/bpmn/src/fixtures.js`
- `packages/bpmn/src/fixtures.ts`
- `packages/bpmn/src/ids.js`
- `packages/bpmn/src/ids.ts`
- `packages/bpmn/src/manifest.js`
- `packages/bpmn/src/manifest.ts`
- `packages/bpmn/src/semantic.js`
- `packages/bpmn/src/semantic.ts`
- `packages/bpmn/src/shared.js`
- `packages/bpmn/src/surface.js`
- `packages/bpmn/src/surface.ts`
- `packages/bpmn/src/types.ts`
- `packages/bpmn/src/viewer-model.js`
- `packages/bpmn/src/viewer-model.ts`
- `packages/bpmn/src/viewer-runtime.js`
- `packages/bpmn/src/viewer-runtime.ts`

## Files Modified

- `packages/bpmn/src/index.js`
- `packages/bpmn/src/index.ts`

## Files Removed

None.

## Before Public Runtime Exports

- `applyBpmnDiagramInterchangeToXml`
- `bpmnCapabilityIds`
- `bpmnDiCapabilityId`
- `bpmnItmDocumentPredicate`
- `bpmnRulesCapabilityId`
- `bpmnSemanticCapabilityId`
- `bpmnSemanticFixtureTexts`
- `bpmnSemanticProfileText`
- `bpmnViewerCapabilityId`
- `bpmnViewerSurfaceContribution`
- `bpmnViewerSurfaceDocumentPredicate`
- `bpmnViewerSurfaceId`
- `bpmnXmlCapabilityId`
- `bpmnXmlDocumentPredicate`
- `bundledBpmnReferenceAssets`
- `collectBpmnMvpScopeDiagnostics`
- `contributions`
- `createBpmnContributionManifest`
- `createBpmnViewerModelFromItmSource`
- `createBpmnViewerModelFromXml`
- `extractBpmnDiagramInterchangeView`
- `importBpmnSemanticXmlResult`
- `loadBpmnSemanticFixture`
- `loadBpmnSemanticProfile`
- `renderBpmnPublicationSvg`
- `validateBpmnDiagramInterchangeView`
- `validateBpmnSemanticDocument`

## After Public Runtime Exports

The runtime export list is identical: 27 exports before and 27 exports after, with no missing or added export names.

## Public Type Facade Exports

The `src/index.ts` facade exports the same 34 public type/declaration names before and after, with no additions or removals.

## Import Compatibility Notes

The package manifest and export map were not changed. No new public subpaths were introduced. Consumers continue importing from `@textforge/bpmn`; the only root import found in app/package code is `apps/textforge-web/src/workbench.js`. Deep-import scans for `@textforge/bpmn/src/` and `@textforge/bpmn/dist/` found no matches.

## Commands Run

- `Get-ChildItem packages\bpmn\src -Filter *.js | ForEach-Object { node --check $_.FullName }`
- `corepack pnpm --filter @textforge/bpmn lint`
- `corepack pnpm --filter @textforge/bpmn typecheck`
- `corepack pnpm --filter @textforge/bpmn test`
- `corepack pnpm --filter @textforge/bpmn build`
- `node -e "import('./packages/bpmn/src/index.js').then(m => console.log(Object.keys(m).sort().join('\\n')))"`
- Runtime export comparison against `git show HEAD:packages/bpmn/src/index.js`
- Type facade export comparison against `git show HEAD:packages/bpmn/src/index.ts`
- `rg "@textforge/bpmn/src/|@textforge/bpmn/dist/" apps packages --glob '!**/node_modules/**'`
- `rg "from '@textforge/bpmn'|from \"@textforge/bpmn\"" apps packages --glob '!**/node_modules/**'`

## Test And Build Results

All package lint, typecheck, test, and build commands passed. The package test suite passed 11 tests. An additional syntax pass over every split JavaScript module passed.

## Remaining Risks Or Manual Checks

The package `lint`, `typecheck`, and `build` scripts only check `src/index.js`, so the report records the additional all-module `node --check` pass used to cover the new internal modules. Full repository validation remains required after `core` and roadmap closeout.
