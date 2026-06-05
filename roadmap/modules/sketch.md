# Sketch

## Registry

- Module ID: `MOD-SKETCH`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/sketch.md`

## Purpose

Sketch defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- sketch resources
- annotation resource model
- PDF annotation follow-on

### Does not own

- knowledge workspace canvas
- Markdown publication semantics
- PDF export generation

## Public Contracts

- sketch resource format
- annotation delta resources

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-SKETCH` | Sketch and annotation resources | Registry-owned | Optional feature |
| `WP-PDF-ANNOTATE` | PDF annotation | Registry-owned | Optional feature |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/assets.md
- archive/registers/package-guides/markdown.md
- archive/registers/specs/legacy-specs/architecture/textforge-rebuild-whitepaper.md
