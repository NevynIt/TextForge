# WP-ITM-01 - ITM parser/model foundation

## Registry

- Workpackage ID: `WP-ITM-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-ITM`
- ADRs: `ADR-0001`

## Outcome

Public `@textforge/itm` wrapper now vendors the upstream ITM runtime, exposes parse/serialize/resolve/validate/project contracts plus selector/style/view/profile interfaces, standardizes resolver diagnostic categories, ships workspace include resolution, and integrates Markdown `itm`/`itm-pub` publication rendering with vendored BPMN/ArchiMate profile fixtures.

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

Use `validation/checklists/workpackages/WP-ITM-01-itm-parser-model-foundation.md` plus release-specific evidence.

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
- legacy source: Phase 6
