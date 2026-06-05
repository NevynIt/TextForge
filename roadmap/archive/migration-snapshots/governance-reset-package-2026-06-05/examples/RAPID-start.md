> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# RAPID Log

This is the active append-only roadmap event log.

Current planning truth lives in `roadmap-state.yaml`.
Durable decisions live in `decisions/`.
Historical pre-cut entries are archived under `archive/rapid/`.

## Convention

New entries use:

- Module
- Workpackage
- Release
- Decision / Action / Progress / Issue / Risk

Phase terminology is historical only.

## Entries

| ID | Date | Type | Status | Module | Workpackage | Release | Entry | Links | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D-081 | 2026-06-05 | Decision | Accepted | MOD-ROADMAP | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Active roadmap governance is cut over to module/workpackage/release/ADR terminology. Historical phase terminology is archived only. | decisions/ADR-0001-roadmap-governance-reset.md | D-079, D-080 |
| A-034 | 2026-06-05 | Action | Done | MOD-ROADMAP | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Historical RAPID log archived and new active RAPID log started in the roadmap root, continuing identifier numbering from the previous log. | archive/rapid/RAPID-up-to-2026-06-05.md | — |
| P-102 | 2026-06-05 | Progress | Done | MOD-ROADMAP | WP-ROADMAP-CLEANUP | R-ROADMAP-RESET | Roadmap governance reset initiated with preserved RAPID identifier continuity. | RAPID.md | — |
