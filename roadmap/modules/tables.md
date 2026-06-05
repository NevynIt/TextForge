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
| `WP-TABLES` | Tables, catalogues, and matrices | Registry-owned | Feature |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/tables.md
- archive/registers/package-guides/ui.md
- archive/registers/package-guides/itm.md
