# Workspace resources

## Registry

- Module ID: `MOD-WORKSPACE-RESOURCES`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/workspace-resources.md`

## Purpose

Workspace resources defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- workspace resource facts
- provider-aware descriptors
- local resource revisions and changesets
- workspace import/export boundaries

### Does not own

- semantic ITM parsing
- backend persistence implementation
- visual renderer mounting

## Public Contracts

- resource descriptors
- provider descriptors
- revision and changeset contracts

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-RES-01` | Provider-aware resource descriptors | Registry-owned | Core foundation |
| `WP-RES-TYPE-OVERRIDE` | Workspace resource type overrides | Registry-owned | Workspace authoring UX |
| `WP-RES-02` | Revisions, dirty state, and conflict diagnostics | Registry-owned | Core foundation |
| `WP-RES-03` | Multi-resource changesets and provider allowlists | Registry-owned | Core foundation |
| `WP-SERVICES-LOCAL` | Local service-folder convention | Registry-owned | Core/service seam |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/workspace.md
- archive/registers/package-guides/assets.md
- archive/registers/package-guides/editors.md
- archive/registers/specs/legacy-specs/architecture/backend-optional-architecture.md
