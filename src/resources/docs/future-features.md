# TextForge Future Features

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

## Optional Compressed Example Packs
Status: deferred.

Rationale: Current docs/examples are small and work as lazy raw resources.
