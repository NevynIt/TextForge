# WP-BPMN-VISUAL-C - BPMN modeler/edit/write-back

## Registry

- Workpackage ID: `WP-BPMN-VISUAL-C`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-BPMN`
- ADRs: `ADR-0001`

## Outcome

**Deferred.** Covers BPMN modeler behavior, patch preview, apply/discard, BPMN XML write-back, and possible ITM/View delta write-back. Must not block visual consumption.

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

Use `validation/checklists/workpackages/WP-BPMN-VISUAL-C-bpmn-modeler-edit-writeback.md` plus release-specific evidence.

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
- legacy source: V20 BPMN split
