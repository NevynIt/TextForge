# Visual ITM Package Refactor

Date: 2026-06-06

## Scope

Refactored `@textforge/visual-itm` internals only. The package manifest and public root barrel contract remain unchanged.

## Public Export Comparison

Runtime value exports before:

- `createVisualItmDiagnostic`
- `createVisualItmDocument`
- `createVisualItmEdge`
- `createVisualItmNode`
- `createVisualItmProvenance`
- `isVisualItmDocument`
- `validateVisualItmDocument`
- `visualItmDerivedTargetKinds`
- `visualItmDiagnosticSeverities`
- `visualItmFormatId`
- `visualItmOriginModes`
- `visualItmProvenanceKinds`
- `visualItmRendererSources`
- `visualItmV1Fixtures`

Runtime value exports after:

- `createVisualItmDiagnostic`
- `createVisualItmDocument`
- `createVisualItmEdge`
- `createVisualItmNode`
- `createVisualItmProvenance`
- `isVisualItmDocument`
- `validateVisualItmDocument`
- `visualItmDerivedTargetKinds`
- `visualItmDiagnosticSeverities`
- `visualItmFormatId`
- `visualItmOriginModes`
- `visualItmProvenanceKinds`
- `visualItmRendererSources`
- `visualItmV1Fixtures`

Type-only exports before:

- `VisualItmDerivedTargetKind`
- `VisualItmDiagnostic`
- `VisualItmDiagnosticSeverity`
- `VisualItmDocument`
- `VisualItmEdge`
- `VisualItmNode`
- `VisualItmOriginMode`
- `VisualItmProvenance`
- `VisualItmProvenanceKind`
- `VisualItmRendererSource`
- `VisualItmSourceRange`
- `VisualItmSourceRangePosition`

Type-only exports after:

- `VisualItmDerivedTargetKind`
- `VisualItmDiagnostic`
- `VisualItmDiagnosticSeverity`
- `VisualItmDocument`
- `VisualItmEdge`
- `VisualItmNode`
- `VisualItmOriginMode`
- `VisualItmProvenance`
- `VisualItmProvenanceKind`
- `VisualItmRendererSource`
- `VisualItmSourceRange`
- `VisualItmSourceRangePosition`

Result: no public root export name changes.

## Internal Module Split

- `src/constants.js` and `src/constants.ts`: Visual ITM constants.
- `src/clone.js`: internal clone helpers.
- `src/normalize.js`: internal normalization helpers.
- `src/factories.js` and `src/factories.ts`: document, node, edge, diagnostic, and provenance factories.
- `src/validation.js` and `src/validation.ts`: document guard and validator.
- `src/fixtures.js` and `src/fixtures.ts`: v1 fixture documents.
- `src/types.ts`: TypeScript-only public type contracts.
- `src/index.js` and `src/index.ts`: root barrels preserving the public surface.

## Validation

- `corepack pnpm --filter @textforge/visual-itm lint`: passed.
- `corepack pnpm --filter @textforge/visual-itm typecheck`: passed.
- `corepack pnpm --filter @textforge/visual-itm test`: passed.
- `corepack pnpm --filter @textforge/visual-itm build`: passed.
- `rg "@textforge/visual-itm/|packages/visual-itm/src/|visual-itm/src/" -n .`: no deep-import matches.

Supplemental `corepack pnpm exec tsc -p packages/visual-itm/tsconfig.json --noEmit` was attempted, but `tsc` is not installed/exposed in this workspace. No dependency or manifest changes were made.
