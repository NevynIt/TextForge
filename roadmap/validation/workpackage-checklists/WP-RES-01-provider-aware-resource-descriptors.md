# WP-RES-01 Validation Checklist

## Scope

`WP-RES-01` validates the provider-aware resource descriptor foundation on top of the existing Phase 4.1 resource facts and the validated `WP-05A` through `WP-05D` contribution baseline. The slice must extend the canonical resource facts already used by the shell rather than introducing a parallel backend-only descriptor model.

## Required checks

- `@textforge/core` extends the canonical resource contracts with provider ID, revision, capability IDs, owner metadata, provenance, and diagnostics fields, and exposes shared helpers for provider-aware capability checks.
- `@textforge/workspace` carries those descriptor fields through normalized workspace entries, queries, and `workspaceEntryToResourceRef(...)` instead of maintaining a separate metadata side channel.
- The bundled document subtree is exposed as a read-only provider-backed resource set with bundled provenance and without reopening the retired text-versus-binary routing split.
- Workspace mutations are capability-gated: create-child, write/save, rename, move, delete, and copy behaviors honor the resource capability set rather than assuming every workspace entry is writable.
- The shell/editor layer respects provider-backed read-only state: bundled text resources open read-only, provider descriptors are visible in the inspector, and context actions hide or block invalid mutations.
- A bundled provider-backed resource can be copied into the writable local workspace, reopening the copied resource with writable local-provider metadata.
- The app build and repo-wide verification still pass after the descriptor changes.

## Validation evidence

- `corepack pnpm --filter @textforge/core test`
- `corepack pnpm --filter @textforge/core build`
- `corepack pnpm --filter @textforge/workspace test`
- `corepack pnpm --filter @textforge/workspace build`
- `corepack pnpm --filter @textforge/editors test`
- `corepack pnpm --filter @textforge/editors build`
- `corepack pnpm --filter @textforge/textforge-web test`
- `corepack pnpm --filter @textforge/textforge-web build`
- `corepack pnpm roadmap:dependency-map`
- `corepack pnpm verify`

## Manual UI validation

- Reset the browser-managed workspace so the seeded bundled docs baseline is visible.
- Open `/.textforge/resources/docs/architecture/capability-model.md` and confirm the source editor is read-only.
- Confirm the inspector shows a provider descriptor section with `bundled-docs` metadata.
- Use the workspace-item context menu action `Copy selected resource into workspace` on that bundled document.
- Confirm the copied resource opens from the writable workspace and is editable.

## Notes

- Manual in-app browser validation for this run confirmed the bundled read-only document behavior, the provider descriptor inspector view, and the copy-into-workspace flow on the rebuilt preview shell.
