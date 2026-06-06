# @textforge/pipeline modularization report

## Scope

- Refactored `packages/pipeline/src/index.js` into package-local internal modules.
- Refactored `packages/pipeline/src/index.ts` into a type/value facade backed by package-local declaration modules.
- Preserved the package root as the only public export-map entry.
- Did not change package manifests.

## Files created

- `packages/pipeline/src/capabilities.js`
- `packages/pipeline/src/capabilities.ts`
- `packages/pipeline/src/diagnostics.js`
- `packages/pipeline/src/kinds.js`
- `packages/pipeline/src/kinds.ts`
- `packages/pipeline/src/manifest.js`
- `packages/pipeline/src/manifest.ts`
- `packages/pipeline/src/registry.js`
- `packages/pipeline/src/registry.ts`
- `packages/pipeline/src/resources.js`
- `packages/pipeline/src/resources.ts`
- `packages/pipeline/src/runner.js`
- `packages/pipeline/src/runner.ts`
- `packages/pipeline/src/steps.js`
- `packages/pipeline/src/steps.ts`
- `packages/pipeline/src/types.ts`
- `packages/pipeline/src/values.js`
- `packages/pipeline/src/values.ts`

## Files modified

- `packages/pipeline/src/index.js`
- `packages/pipeline/src/index.ts`
- `roadmap/decisions/ADR-0002-attachments/pipeline.md`

## Files removed

None.

## Public export comparison

Before:

- `contributions`
- `createDocumentPipelineRunner`
- `createGeneratedResourceDescriptor`
- `createPipelineContributionManifest`
- `createPipelineOutputValue`
- `createPipelineRegistry`
- `createPipelineRegistryFromContributions`
- `createPipelineRunner`
- `createPipelineStep`
- `generatedResourceFormats`
- `pipelineCapabilities`
- `pipelineValueKinds`

After:

- `contributions`
- `createDocumentPipelineRunner`
- `createGeneratedResourceDescriptor`
- `createPipelineContributionManifest`
- `createPipelineOutputValue`
- `createPipelineRegistry`
- `createPipelineRegistryFromContributions`
- `createPipelineRunner`
- `createPipelineStep`
- `generatedResourceFormats`
- `pipelineCapabilities`
- `pipelineValueKinds`

Result: runtime public root export names are unchanged.

## Validation

- `corepack pnpm --filter @textforge/pipeline lint` passed.
- `corepack pnpm --filter @textforge/pipeline typecheck` passed.
- `corepack pnpm --filter @textforge/pipeline test` passed.
- `corepack pnpm --filter @textforge/pipeline build` passed.
- `node -e "import('./packages/pipeline/src/index.js').then(m=>console.log(Object.keys(m).sort().join('\n')))"` confirmed unchanged runtime export names.
- Extra declaration compile attempt `corepack pnpm exec tsc -p packages/pipeline/tsconfig.json --noEmit` could not run because `tsc` is not installed in the workspace.

## Deep-import search

- `rg "@textforge/pipeline/" -n apps packages docs roadmap --glob "!roadmap/archive/**" --glob "!roadmap/decisions/ADR-0002-attachments/pipeline.md"` found only `packages/pipeline/src/capabilities.js`, which is the owned capability ID constant.
- `rg "packages/pipeline/src|pipeline/src|@textforge/pipeline/src" -n apps packages docs roadmap --glob "!roadmap/archive/**" --glob "!roadmap/decisions/ADR-0002-attachments/pipeline.md"` found no matches.
- `rg "from .@textforge/pipeline/|import\\(.@textforge/pipeline/" -n apps packages docs roadmap --glob "!roadmap/archive/**" --glob "!roadmap/decisions/ADR-0002-attachments/pipeline.md"` found no matches.

## Residual risks

- Package-local `typecheck` is currently `node --check src/index.js`, and `tsc` is not installed, so TypeScript declarations were refactored by inspection rather than compiler validation.
- Internal module files are intentionally not added to the package export map; any future consumer deep-importing them would rely on unsupported paths.
