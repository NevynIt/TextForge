# Still to do

This file replaces the earlier quick recap and consolidates the remaining work implied by the root planning documents as of 2026-05-22.

Several of those documents describe earlier architecture stages. Read them using these current terms:

- "open documents" means workspace files plus whichever files currently have open editor tabs.
- "resource browser" means the read-only `/.textforge/resources` folder in the workspace tree.
- "uploaded plugins" or "custom JavaScript plugins" means Lua-based user automation unless the document is explicitly talking about trusted internal packaged plugins.
- "temporary popup outputs" or "new result documents" should usually now be interpreted as generated workspace files under `/generated/...` plus popup viewers.
- Work that belongs in the standalone `@textforge/itm` package is only included here when TextForge still has matching repository work to do.

## Completed objectives that should not stay in the backlog

These objectives are already implemented in this repo and should only remain in the whitepapers as historical context:

- Application-private workspace architecture, workspace explorer, import/export, ZIP import/export, and the distinction between opening a file for editing versus viewing it directly.
- Bundled resources as the read-only `/.textforge/resources` workspace folder instead of a separate resource browser.
- Lua Console built on xterm.js.
- Pipeline conflict detection, user-selectable pipeline enable/disable, and plugin diagnostics.
- ITM folding in CodeMirror, including fold-all and unfold-all controls.
- `verify:browser-no-network` in the default `npm run check` path.
- Initial renderer registry split for viewer rendering.
- `@textforge/itm` as the active dependency for ITM parsing.

## Required changes still remaining

### 1. Remove the remaining `external/ITM` coupling

Source documents:
`textforge_update_implementation_guide.md`, `itm_library_update_implementation_guide_revised.md`

Required changes:

- Remove `.gitmodules` and stop carrying `external/ITM` as a submodule/vendor copy.
- Remove the remaining build and type-system aliases that still point at `external/ITM` in `tsconfig.json`, `vite.config.ts`, `vite.file.config.ts`, and `vitest.config.ts`.
- Make the app build purely against the published `@textforge/itm` package, not the checked-out submodule sources.
- Regenerate any build outputs that still embed `external/ITM` source paths in maps or metadata.
- Add a regression check or repo search expectation so `external/ITM` stops reappearing outside historical docs.

### 2. Finish the ITM single-object-model migration inside TextForge

Source documents:
`textforge_itm_single_object_model_whitepaper.md`, `textforge_update_implementation_guide.md`

Required changes:

- Make `model.itm` with `ItmDocument` and `ResolvedItmDocument` the canonical structural pipeline value across the app.
- Migrate remaining viewer, projection, and Lua bridge code away from `TreeNode`, `GraphNode`, `GraphEdge`, and `GraphModel` as reusable domain-level DTOs, and remove `TreeNode`/`GraphModel` from public pipeline contracts entirely.
- Preserve ITM metadata, multiline directives, relationship attributes, views, viewpoints, and provenance through viewer projections instead of flattening them early.
- Remove now-redundant intermediate transformers and helpers once the last consumers of `model.tree` and `model.graph` are gone.
- Add regression tests proving that richer ITM features survive parsing, projection, and viewer rendering.

### 3. Implement the ITM-aware Markdown profile

Source documents:
`itm_markdown_integration_implementation_guidance.md`, `itm_markdown_integration_user_guide (1).md`

Required changes:

- Parse fenced `itm` model cells and `itm-pub` publication blocks from Markdown instead of treating Markdown as headings plus generic rendered HTML only.
- Support named local model cells, one optional default model cell, and `md:` local source resolution.
- Evaluate model-cell dependencies by explicit imports rather than document order.
- Reject duplicate Markdown cell names with diagnostics.
- Enforce the rule that `itm-pub` blocks are for publication logic, not canonical entity or relationship declarations.
- Decide and document whether local package/profile cells are in scope for the first shipped pass.
- Render `%render` and `%inject` results into the Markdown publication flow while keeping the file valid ordinary Markdown for non-ITM-aware tools, and support writing persisted generated workspace files as well as in-app viewer/publication output.
- Add examples, tests, and bundled documentation showing the supported profile.

### 4. Complete source-aware navigation for Markdown embedded artifacts

Source documents:
`textforge_lua_pivot_whitepaper.md`, `itm_markdown_integration_implementation_guidance.md`, existing backlog notes

Required changes:

- Add source-range mapping from rendered Markdown artifacts back to the originating fenced code blocks or generated publication blocks.
- Cover Mermaid, Graphviz, and any ITM-publication-generated diagram/table outputs in the Markdown viewer.
- Keep source/view synchronization behavior consistent with the existing tree, mind map, and graph viewers.
- Add tests for embedded artifact selection, follow-source refresh, and popup-open workflows.

### 5. Close the remaining Lua runtime and security gaps

Source documents:
`textforge_lua_pivot_whitepaper.md`, existing backlog notes

Required changes:

- Extend Lua sandbox tests to explicitly cover blocked access to `WebSocket`, `importScripts`, `Function`, `eval`, `require "io"`, `os.execute(...)`, and similar forbidden escape hatches.
- Remove any remaining product/documentation assumptions that a dedicated saved snippets/action registry exists beyond workspace files under `/.textforge/automation/lua`.
- Improve or replace the current `file://` in-process fallback so Lua remains worker-isolated there when possible, or document the exact limitation if it cannot be removed.
- Add a dedicated bundled Lua Console quick-start/tutorial document instead of relying only on broader Lua docs.

### 6. Harden workspace identity restore and batch import behavior

Source documents:
existing backlog notes, workspace and badge-related goals from older planning docs

Required changes:

- Repair duplicate Shapez badge identities during workspace restore and bulk import, not only during fresh single-file creation.
- Add regression tests for restore-from-storage, ZIP import, and multi-file import scenarios that could collide on badge identity.
- Verify that badge identity stays stable and unique across rename, restore, import, and popup/view traces.

### 7. Expand ITM multiline-directive and viewer-facing coverage

Source documents:
`textforge_itm_single_object_model_whitepaper.md`, existing backlog notes

Required changes:

- Add end-to-end tests that exercise multiline directives and other richer ITM constructs through viewer and pipeline surfaces, not just parser-level acceptance.
- Confirm that these constructs remain visible or at least non-destructively preserved in viewer projections, serialization, and Lua round-trips.
- Surface useful diagnostics when a viewer cannot faithfully represent a construct yet.

### 8. Finish the remaining UX polish called out by the whitepapers

Source documents:
existing backlog notes, `Initial plan.md`, `textforge_lua_pivot_whitepaper.md`

Required changes:

- Add the delayed close behavior for hover-driven window layout or popup menus instead of immediate close on `onMouseLeave`.
- Refine the Markdown artifact toolbar so it is less text-heavy and easier to scan.
- Add focused browser smoke coverage for SVG infinite-canvas behavior, including standalone SVG and Markdown popup/viewer flows.

### 9. Complete the maintainability work that the update guide still expects

Source documents:
`textforge_update_implementation_guide.md`, `Initial plan.md`

Required changes:

- Break up `src/app/App.tsx` before adding more major behavior such as write-back or visual editing.
- Continue extracting viewer, popup, workspace-action, and command-routing logic into smaller modules or hooks where the remaining control flow is still concentrated.
- Review bundled docs that still describe the app in older open-document terms and update them to the shipped workspace model.

### 10. Prepare the TextForge side of ITM include/effective-document integration

Source documents:
`itm_library_update_implementation_guide_revised.md`, `textforge_update_implementation_guide.md`, `textforge_workspace_feature_implementation_whitepaper_v4.md`

Required changes:

- Once `@textforge/itm` exposes the final include/effective-document APIs, switch TextForge to those APIs instead of relying on thinner local assumptions.
- Provide workspace-aware source resolution into the ITM library so includes resolve against workspace paths and bundled resources where policy allows.
- Surface include-related diagnostics cleanly in editor diagnostics and viewer flows.
- Add tests for missing includes, circular includes, relative workspace includes, and resource-folder includes where allowed.

## Suggested implementation order

1. Remove `external/ITM` coupling so the repository is building against the real package boundary.
2. Finish the ITM object-model migration so later Markdown and Lua work is built on the correct canonical model.
3. Implement the ITM-aware Markdown profile and embedded artifact source bridge together.
4. Close the remaining Lua/security, identity-restore, and viewer-polish gaps.
5. Finish the maintainability cleanup before adding larger authoring or write-back features.
