# Repository

## Registry

- Module ID: `MOD-REPOSITORY`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/repository.md`

## Purpose

Repository defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- logical repository declarations
- provider-backed include resolution
- repository diagnostics

### Does not own

- arbitrary frontend fetch
- backend-only repository adapters
- ITM directive semantics beyond resolution input

## Public Contracts

- repository declaration
- include resolver
- resolution diagnostics

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-REPO-01` | Repository reference and include resolver | Registry-owned | Core/domain bridge |

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
- archive/registers/package-guides/itm.md
- archive/registers/package-guides/markdown.md
- archive/grilling/legacy-grilling/backend-grilling.md
