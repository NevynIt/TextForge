# TextForge Future Features

This roadmap intentionally lists deferred work and polish items only. Core workspace import/export, bundled resources, Lua automation, pipeline tracing, ZIP support, and the main viewer surfaces are already shipped and are not repeated here.

## Mindmap Node Dragging
Status: deferred.

Rationale: jsMind owns tree layout. Dragging nodes safely requires layout overrides, subtree movement, and a source write-back model.

Notes: Store node position relative to parent, move subtrees together, and consider future ITM attributes such as `{x: 32, y: -12}`.

## ITM Write-Back For Viewer Layout
Status: deferred.

Rationale: Viewers are projections; text remains the source of truth.

Notes: Prefer explicit source patches after previewing generated changes.

## Persistent Mindmap Edge Label Offsets
Status: partial.

Rationale: Label offsets are maintained during the current viewer session. Persisting them needs a model for viewer state storage.

## Stateful Lua Console Sessions
Status: deferred.

Rationale: V1 favors fresh Lua states for predictable isolation.

## User Lua Libraries With Dependency Declarations
Status: partial.

Rationale: Workspace `.lua` files can be required as local modules. Rich package metadata can come later.

## Markdown ITM Publication Profile
Status: planned.

Rationale: Markdown rendering is shipped, but the fuller `itm` and `itm-pub` authoring profile remains future work.

Notes: The shipped app already supports Markdown rendering with Mermaid, Graphviz, KaTeX, and artifact source bridges. The remaining work is model-cell authoring, publication blocks, dependency resolution, and persisted publication outputs.

## Workspace Identity Restore Hardening
Status: planned.

Rationale: Shapez-style badges are shipped, but restore and bulk-import collision coverage still needs stronger guarantees.

Notes: Focus on restore-from-storage, ZIP import, and multi-file import regressions.

## `external/ITM` Removal
Status: planned.

Rationale: The app now depends on `@textforge/itm`, but repository cleanup still needs to remove the remaining vendored coupling.

Notes: Remove the submodule, aliases, and lingering source-path assumptions after the package boundary is fully clean.

## Optional Compressed Example Packs
Status: deferred.

Rationale: Current docs/examples are small and work as lazy raw resources.
