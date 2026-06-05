# WP-BPMN-DI-01 - BPMN Diagram Interchange read-only fidelity

## Registry

- Workpackage ID: `WP-BPMN-DI-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-BPMN`
- ADRs: `ADR-0001`

## Outcome

Implemented as the explicit read-only bridge for BPMN DI bounds, routes, and label geometry, with extraction/validation/application helpers that feed later BPMN visual-target consumption without becoming generic normalized delta persistence or editing.

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

Use `validation/checklists/workpackages/WP-BPMN-DI-01-bpmn-di-read-only-fidelity.md` plus release-specific evidence.

## Evidence Required

- Focused tests or checks for touched packages.
- Updated validation evidence under `validation/evidence/` when implementation state changes.
- RAPID event entry for material decisions, progress, issues, or risks.

## Open Decisions

- No additional ADR extracted during this governance reset unless future implementation uncovers a durable decision.

## Archive Trace

- archive/registers/legacy-workpackages/workpackage-register.md
- archive/registers/legacy-workpackages/implementation-status.md
- archive/migration-snapshots/roadmap-before-governance-reset-2026-06-05/workpackages/
- legacy source: BPMN DI bridge
