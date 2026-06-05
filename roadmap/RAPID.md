# RAPID Log

This is the active append-only roadmap event log.

Current planning truth lives in `roadmap-state.yaml`.
Durable decisions live in `decisions/`.
Historical pre-cut entries are archived under `archive/rapid/`.

## Convention

New entries use module, workpackage, release, decision/action/progress/issue/risk references.
Historical phase terminology remains in archive traces and historical notes only.

## Entries

| ID | Date | Type | Status | Module | Workpackage | Release | Entry | Links | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D-081 | 2026-06-05 | Decision | Accepted | MOD-ROADMAP-GOVERNANCE | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Active roadmap governance is cut over to module/workpackage/release/ADR terminology. Historical phase terminology is archived only. | decisions/ADR-0001-roadmap-governance-reset.md | D-079, D-080 |
| A-034 | 2026-06-05 | Action | Done | MOD-ROADMAP-GOVERNANCE | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Historical RAPID log archived and new active RAPID log started in the roadmap root, continuing identifier numbering from the previous log. | archive/rapid/RAPID-up-to-2026-06-05.md | |
| P-102 | 2026-06-05 | Progress | Done | MOD-ROADMAP-GOVERNANCE | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Roadmap governance reset initiated with preserved RAPID identifier continuity and migration snapshot. | RAPID.md; archive/migration-snapshots/roadmap-before-governance-reset-2026-06-05/ | |
| P-103 | 2026-06-05 | Progress | Done | MOD-ROADMAP-GOVERNANCE | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Roadmap governance reset completed with active state registry, module/workpackage/release pages, generated views, archived legacy material, and validation evidence. | roadmap-state.yaml; views/; validation/evidence/WP-ROADMAP-CLEANUP.md | |
| P-104 | 2026-06-05 | Progress | Done | MOD-EA-VIEWER | WP-EA-VIEWER-01 | R-EA-VIEWER-MVP | Exact EA Dashboard viewer port added as a ready next implementation slice, preserving timeline and level-of-detail sliders in a local TextForge surface over workspace JSON fixtures. | roadmap-state.yaml; modules/enterprise-architecture-viewer.md; workpackages/WP-EA-VIEWER-01.md; releases/R-EA-VIEWER-MVP.md | |
