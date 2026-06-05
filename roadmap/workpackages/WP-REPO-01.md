# WP-REPO-01 - Repository reference and include resolver

## Registry

- Workpackage ID: `WP-REPO-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-REPOSITORY`
- ADRs: `ADR-0001`

## Outcome

Workspace-owned repository roots now resolve bundled/local paths, provider-URI hints, and explicit logical alias fixtures through the public ITM wrapper; URL-like values remain diagnostics-producing declarations in local mode and no arbitrary frontend fetch is performed.

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

Use `validation/checklists/workpackages/WP-REPO-01-repository-include-resolver.md` plus release-specific evidence.

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
- legacy source: Phase 6.1
