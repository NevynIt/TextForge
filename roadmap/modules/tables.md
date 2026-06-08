# Tables

## Registry

- Module ID: `MOD-TABLES`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/tables.md`

## Purpose

Tables defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- tables, catalogues, and matrices
- CSV/TSV grid editing strategy
- diagnostics table presentation

### Does not own

- ITM semantic source of truth
- BPMN validation semantics
- ArchiMate profile rules

## Public Contracts

- table surface contract
- catalogue/matrix presentation contract

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-TABLES` | CSV/TSV grid editor and shared table contract | Registry-owned | Feature |
| `WP-TABLES-02` | Shared semantic table rendering and exports | Registry-owned | Feature follow-up |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0013` records the table surface, CSV/TSV grid, and semantic table follow-up decisions.
- `ADR-0014` updates the editable CSV/TSV grid choice to Glide-first with AG fallback while preserving the existing package boundary.
- `ADR-0015` proposes the Glide interaction activation tiers, renderer-neutral table mutation helpers, and table diagnostic/view-state contract boundaries.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/tables.md
- archive/registers/package-guides/ui.md
- archive/registers/package-guides/itm.md
