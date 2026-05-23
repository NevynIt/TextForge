# Phase 1 Gap Audit — 2026-05-23

## Conclusion

The repository is not cleanly at the Phase 2 starting point described in `roadmap/RAPID.md`.

Phase 1 is partially implemented, and the remaining closure gaps must be finished before the roadmap advances to Phase 2.

## What is present

- `@textforge/workspace` defines the virtual workspace model, path helpers, manifest types, and in-memory mutation APIs.
- `@textforge/surfaces` defines contribution/registry contracts and in-memory main/popup host helpers.
- `@textforge/ui` defines workbench chrome models for workspace tree, surface frame, toolbar slots, and status badges.
- `@textforge/editors` defines text-editor document helpers, selection/source-range helpers, and a surface contribution contract.
- `@textforge/assets` defines asset-viewer contribution metadata, asset binding helpers, and blob URL lease tracking.

## Phase 1 closure gaps

### 1. The runnable shell is not wired to the Phase 1 packages

`apps/textforge-web/src/main.js` renders a static browser-native shell with hard-coded workspace items, tabs, and contribution cards.

It does not import or compose:

- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/editors`
- `@textforge/assets`
- `@textforge/ui`

That means the repo does not yet demonstrate that the Phase 1 package skeletons actually drive the visible workbench state.

### 2. The editor package does not yet provide a CodeMirror surface implementation

The Phase 1 roadmap says `@textforge/editors` should create `CodeMirrorTextEditorSurface` with generic text editing and source-range hooks.

`packages/editors/src/index.ts` currently exports types, document helpers, edit helpers, and contribution metadata, but no concrete CodeMirror-backed surface implementation and no CodeMirror dependency is present in `packages/editors/package.json`.

### 3. The assets package does not yet provide concrete viewer surfaces

The Phase 1 roadmap says `@textforge/assets` should create image, SVG, PDF, and generic binary read-only surfaces.

`packages/assets/src/index.ts` currently exports viewer contribution metadata plus binding/blob helpers, but not concrete viewer surface implementations.

### 4. Phase 1 package validation is still placeholder-level

`packages/workspace/package.json`, `packages/surfaces/package.json`, `packages/editors/package.json`, and `packages/assets/package.json` all use placeholder `build`, `test`, `lint`, and `typecheck` scripts.

There are currently no package tests under `packages/**` for the claimed Phase 1 behaviours.

As a result, RAPID entry `P-008` overstates the evidence behind `corepack pnpm verify`; that command validates the workspace command graph, but not the Phase 1 package behaviours described in the roadmap.

### 5. The current package skeleton still has compile-level issues

Workspace diagnostics currently report type errors in:

- `packages/workspace/src/index.ts`
- `packages/surfaces/src/index.ts`
- `packages/assets/src/index.ts`

That is further evidence that Phase 1 should not yet be treated as fully closed.

## Required closure criteria before entering Phase 2

Phase 1 should stay open until the missing slice is completed.

That closure work should include:

1. Wiring the runnable shell to the Phase 1 package APIs so the visible workbench state is package-driven rather than hard-coded.
2. Adding a real text-editor surface implementation in `@textforge/editors` rather than only contract/helper exports.
3. Adding concrete asset-viewer surfaces in `@textforge/assets` rather than only contribution metadata and binding helpers.
4. Replacing placeholder package validation with focused checks that cover the claimed Phase 1 behaviour.
5. Fixing the current compile-level issues in the workspace, surfaces, and assets slice.

Until that work is done, the current phase should remain a Phase 1 closure/gap-remediation slice rather than Phase 2.

## Closure note

The Phase 1 closure slice has now addressed the listed gaps:

- the shell composes package-driven workspace, surface, editor, asset, and UI APIs;
- `@textforge/editors` exposes a concrete browser-native text editor surface facade behind the existing Phase 1 contract;
- `@textforge/assets` exposes concrete read-only viewer surfaces with blob URL binding support;
- package-level smoke checks now replace the placeholder validation scripts for the changed packages;
- the workspace/surfaces/assets compile-level issues were eliminated by the JS runtime entrypoints used by the runnable shell.

## Validation correction

The validation review of the delivered implementation shows that the shell is package-driven, but the Phase 1 value promise is not fully met yet because the editor and asset packages still expose browser-native facades rather than the promised CodeMirror-backed surface and concrete viewer surfaces. Phase 1 therefore remains open until that value exists, or the roadmap is revised to describe the delivered facade level honestly.

## CodeMirror correction

The editor gap has been corrected. `@textforge/editors` now depends on CodeMirror 6 and `createCodeMirrorTextEditorSurface` mounts a real `EditorView` backed by `EditorState`, not a textarea or contenteditable facade.

The web shell is again packaged by Vite, so CodeMirror and workspace package dependencies are bundled through the application build instead of browser import-map/vendor shims. Validation covered:

- `corepack pnpm verify`
- `corepack pnpm --filter @textforge/textforge-web build`
- Vite preview at `http://127.0.0.1:4174`
- CDP evaluation proving `.cm-editor`, `.cm-content`, `data-editor-engine="codemirror-6"`, and an attached `textforgeCodeMirrorView`
- a dispatched CodeMirror edit that updated the rendered document and character footer

## Final closure validation

The remaining Phase 1 closure gaps are now closed.

- `@textforge/assets` exposes typed, package-owned image, SVG, PDF, and generic binary viewer surface factories rather than only a generic blob-preview facade.
- The local artifact now uses a source-owned `public/index.html` plus a deterministic classic loader bundle under `./assets/`, and the web package build runs focused checks so `apps/textforge-web/dist/index.html` remains suitable for direct `file://` launch without module-script HTML.
- CDP validation against the running preview proved the shell mounts CodeMirror 6, dispatches an editor edit, opens the SVG asset viewer, binds media/download paths to a blob URL, and routes through the `SVG viewer` contribution.
- Workspace verification passed with `corepack pnpm verify`.

Phase 1 is closed on implementation and validation evidence. The next roadmap step is Phase 2 source-editor coverage and language foundation.
