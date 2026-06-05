# WP-ITM-PUB-VISUAL-01 - Shared visual pipeline for itm-pub

## Registry

- Workpackage ID: `WP-ITM-PUB-VISUAL-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-MARKDOWN-ITM`
- ADRs: `ADR-0001`

## Outcome

Deferred from the minimal BPMN visual consumption chain. Markdown users author against normal ITM sources/views/viewpoints; each block internally resolves filtered model -> Visual ITM -> publication renderer.

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

Use `validation/checklists/workpackages/WP-ITM-PUB-VISUAL-01-shared-itm-pub-visual-pipeline.md` plus release-specific evidence.

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
- legacy source: V20 visual follow-on
