# ArchiMate

## Registry

- Module ID: `MOD-ARCHIMATE`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/archimate.md`

## Purpose

ArchiMate defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- ArchiMate semantic profile
- ArchiMate validation
- ArchiMate visual investigation

### Does not own

- generic graph renderer packages
- BPMN semantics
- table infrastructure

## Public Contracts

- ArchiMate ITM profile
- exchange/import/export profile notes

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-ARCHIMATE-SEM` | ArchiMate semantic profile | Registry-owned | Domain profile |
| `WP-ARCHIMATE-VISUAL` | ArchiMate visual editing investigation | Registry-owned | Optional investigation |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/archimate.md
- archive/registers/specs/legacy-specs/architecture/textforge-rebuild-whitepaper.md
