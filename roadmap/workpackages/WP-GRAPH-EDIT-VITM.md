# WP-GRAPH-EDIT-VITM - Visual ITM edit/write-back foundation

## Registry

- Workpackage ID: `WP-GRAPH-EDIT-VITM`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-VISUAL-ITM-RENDERERS`
- ADRs: `ADR-0001`, `ADR-0012`

## Outcome

Later visual editing/write-back foundation. Renderer interactions normalize to Visual ITM edit operations; upstream handlers decide view deltas, source ITM patches, standalone Visual ITM save-as, or lossy export.

## Scope

The executable scope is the registry entry plus any validation checklist linked from `roadmap-state.yaml`. This page explains the workpackage without duplicating current status or dependency truth.

## Non-goals

- Reopening frozen validated baseline work for unrelated new scope.
- Moving status or dependency authority out of `roadmap-state.yaml`.

## Package Impact

Package impact is inherited from the module boundary and historical source traces. Implementation changes must name affected packages in future evidence entries.

## Interfaces / Contracts Changed

See the module page and validation checklist linked from the registry.

## Validation Criteria

Use `validation/checklists/workpackages/WP-GRAPH-EDIT-VITM-visual-itm-edit-writeback.md` plus release-specific evidence.

## Evidence Required

- Focused tests or checks for touched packages.
- Updated validation evidence under `validation/evidence/` when implementation state changes.
- RAPID event entry for material decisions, progress, issues, or risks.

## Open Decisions

- How later semantic edit/write-back affordances consume the React Flow + Dagre renderer boundary proposed by `ADR-0012`.

## Archive Trace

- archive/registers/legacy-workpackages/workpackage-register.md
- archive/registers/legacy-workpackages/implementation-status.md
- archive/migration-snapshots/roadmap-before-governance-reset-2026-06-05/workpackages/
- legacy source: V19 reframing
