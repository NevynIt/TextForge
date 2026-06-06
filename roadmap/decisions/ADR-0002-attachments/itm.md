# ADR-0002 Attachment - @textforge/itm

## Selected Package

- Package: `@textforge/itm`
- Package root: `packages/itm`
- Scope: refactor package root implementation modules only, preserving the root export map and existing `./node` secondary export.

## Files Created

- `packages/itm/src/internal.js`
- `packages/itm/src/internal.ts`
- `packages/itm/src/upstream-adapter.js`
- `packages/itm/src/upstream-adapter.ts`
- `packages/itm/src/resolver.js`
- `packages/itm/src/resolver.ts`
- `packages/itm/src/loader.js`
- `packages/itm/src/loader.ts`
- `packages/itm/src/validation.js`
- `packages/itm/src/validation.ts`
- `packages/itm/src/projections.js`
- `packages/itm/src/projections.ts`
- `packages/itm/src/visual-targets.js`
- `packages/itm/src/visual-targets.ts`
- `packages/itm/src/diagram-sources.js`
- `packages/itm/src/diagram-sources.ts`
- `packages/itm/src/publication.js`
- `packages/itm/src/publication.ts`
- `packages/itm/src/editor.js`
- `packages/itm/src/editor.ts`
- `packages/itm/src/fences.js`
- `packages/itm/src/fences.ts`
- `packages/itm/src/manifest.js`
- `packages/itm/src/manifest.ts`

## Files Modified

- `packages/itm/src/index.js`
- `packages/itm/src/index.ts`
- `packages/itm/src/node.js`
- `packages/itm/src/node.ts`
- `roadmap/decisions/ADR-0002-attachments/itm.md`

## Files Removed

- None.

## Manifest and Export Map

- `packages/itm/package.json` was inspected and not modified.
- Root export remains `"."` with `types: "./src/index.ts"` and `default: "./src/index.js"`.
- Secondary export remains `"./node"` with `types: "./src/node.ts"` and `default: "./src/node.js"`.

## Before Exports

Before refactor, `src/index.js` directly exported all upstream runtime symbols from `./upstream/index.js` plus the TextForge wrapper symbols below:

- `itmCapabilities`
- `itmResolverDiagnosticCodes`
- `createItmResolverDiagnostic`
- `createWorkspaceItmIncludeProvider`
- `createWorkspaceItmResolver`
- `loadItmDocument`
- `validateItmDocument`
- `itmProjectionKinds`
- `projectItmDocument`
- `listItmVisualTargets`
- `resolveItmVisualTarget`
- `createItmGraphvizDiagramSource`
- `createItmMermaidMindmapSource`
- `renderItmPublicationHtml`
- `createItmCodeMirrorLanguageExtension`
- `itmMarkdownFenceHandlerContributions`
- `createItmContributionManifest`
- `contributions`

Before refactor, `src/node.js` exported all upstream node symbols from `./upstream/node.js` plus:

- `createWorkspaceItmIncludeProvider`
- `createWorkspaceItmResolver`

## After Exports

After refactor, `src/index.js` is an explicit public facade over package-local responsibility modules:

- `upstream-adapter`: upstream ITM runtime exports.
- `resolver`: resolver diagnostics and workspace include provider helpers.
- `loader`: `loadItmDocument`.
- `validation`: `validateItmDocument`.
- `projections`: projection kinds and projection model generation.
- `visual-targets`: visual target listing and resolution.
- `diagram-sources`: Graphviz and Mermaid source adapters.
- `publication`: publication HTML rendering.
- `editor`: CodeMirror language extension.
- `fences`: Markdown fence handler contributions.
- `manifest`: capabilities, manifest factory, and `contributions`.

Runtime export comparison result:

```text
root before count: 72
root after count: 72
missing exports: []
added exports: []
```

The checked wrapper export names are all present after refactor:

```text
itmCapabilities
itmResolverDiagnosticCodes
createItmResolverDiagnostic
createWorkspaceItmIncludeProvider
createWorkspaceItmResolver
loadItmDocument
validateItmDocument
itmProjectionKinds
projectItmDocument
listItmVisualTargets
resolveItmVisualTarget
createItmGraphvizDiagramSource
createItmMermaidMindmapSource
renderItmPublicationHtml
createItmCodeMirrorLanguageExtension
itmMarkdownFenceHandlerContributions
createItmContributionManifest
contributions
```

After refactor, `src/node.js` remains an explicit public facade over `./upstream/node.js` plus resolver helpers from `./resolver.js`.

Runtime `./node` export comparison result:

```text
expected node count: 58
actual node count: 58
missing exports: []
added exports: []
```

## Import Compatibility Scan

Root import scan command:

```text
rg "from '@textforge/itm'" -n apps packages --glob "!**/node_modules/**"
```

Live root import users found:

- `apps/textforge-web/src/workbench.js`
- `packages/bpmn/src/index.js`
- `packages/bpmn/src/index.ts`
- `packages/bpmn/test/index.test.js`
- `packages/editors/src/language-modes.js`
- `packages/markdown/test/index.test.js`
- `packages/renderer-cytoscape/src/resolver.js`
- `packages/renderer-jsmind/src/execution.js`
- `packages/renderer-sigma/src/surface-model.js`

Secondary entry scan command:

```text
rg "@textforge/itm/node" -n apps packages roadmap --glob "!**/node_modules/**"
```

Result:

- No live app/package imports of `@textforge/itm/node`.
- Hits are ADR/report text documenting that the existing secondary entrypoint must be preserved.

Deep import scan command:

```text
rg "@textforge/itm/(src|upstream|internal|resolver|loader|validation|projections|visual-targets|diagram-sources|publication|editor|fences|manifest)" -n apps packages --glob "!**/node_modules/**"
```

Result:

- No consumer deep imports.
- One internal package string constant matched in `packages/itm/src/internal.js`; it is not an import specifier.

## Commands Run

```text
git status --short
Get-ChildItem -Path packages\itm -Recurse -File | Select-Object -ExpandProperty FullName
rg "@textforge/itm" -n apps packages tests examples roadmap
Get-Content -Raw packages\itm\src\index.js
Get-Content -Raw packages\itm\src\index.ts
Get-Content -Raw packages\itm\src\node.js
Get-Content -Raw packages\itm\src\node.ts
Get-Content -Raw packages\itm\package.json
Get-Content -Raw packages\itm\scripts\check.mjs
rg "^(export|async function|function|const) " packages\itm\src\index.js
rg "^export" packages\itm\src\index.ts packages\itm\src\node.ts packages\itm\src\node.js
rg "@textforge/itm/node|@textforge/itm/src|@textforge/itm/upstream|@textforge/itm/" -n apps packages roadmap --glob "!**/node_modules/**"
node --check packages\itm\src\index.js
node --check packages\itm\src\node.js
node --input-type=module <root export comparison script>
node --input-type=module <node export comparison script>
corepack pnpm --filter @textforge/itm lint
corepack pnpm --filter @textforge/itm typecheck
corepack pnpm --filter @textforge/itm test
corepack pnpm --filter @textforge/itm build
rg "from '@textforge/itm'" -n apps packages --glob "!**/node_modules/**"
rg "from \"@textforge/itm\"" -n apps packages --glob "!**/node_modules/**"
rg "@textforge/itm/node" -n apps packages --glob "!**/node_modules/**"
rg "@textforge/itm/(src|upstream|internal|resolver|loader|validation|projections|visual-targets|diagram-sources|publication|editor|fences|manifest)" -n apps packages --glob "!**/node_modules/**"
```

## Validation Results

- `node --check packages\itm\src\index.js`: passed.
- `node --check packages\itm\src\node.js`: passed.
- Root runtime export comparison: passed, 72 before and 72 after, no missing or added exports.
- `./node` runtime export comparison: passed, 58 expected and 58 actual, no missing or added exports.
- `corepack pnpm --filter @textforge/itm lint`: passed.
- `corepack pnpm --filter @textforge/itm typecheck`: passed.
- `corepack pnpm --filter @textforge/itm test`: passed, 26 tests passed.
- `corepack pnpm --filter @textforge/itm build`: passed.
- Deep-import grep: no consumer deep imports found.

## Risks and Notes

- The package manifest export map was intentionally not changed, so newly created internal responsibility modules are package-local implementation seams rather than supported public subpath imports.
- The moved `internal.*` modules retain shared private implementation helpers because resolver, validation, projection, publication, and manifest behavior currently share cross-cutting helper logic. The root public surface is now split into named responsibility modules without changing those shared runtime paths.
- Type files use `.js` specifiers consistently with the existing package ESM style.
- Unrelated pre-existing `packages/ea-viewer/**` worktree changes were observed and were not touched.
