# TextForge Roadmap

This roadmap is governed by `roadmap-state.yaml`.

Use the active folders as follows:

| Folder/file | Purpose |
|---|---|
| `roadmap-state.yaml` | Authoritative registry for IDs, status, dependencies, module/WP/release/ADR links, and archive traces. |
| `modules/` | Stable module explanations and ownership boundaries. |
| `workpackages/` | Executable workpackage pages that explain registry entries. |
| `releases/` | Delivery cuts through the workpackage dependency graph. |
| `decisions/` | ADRs for durable decisions. |
| `RAPID.md` | Append-only event log for risks, actions, progress, issues, and decisions. |
| `views/` | Generated views derived from `roadmap-state.yaml`. |
| `validation/` | Evidence and checklists. |
| `archive/` | Non-authoritative historical material preserved for traceability. |

## Authority Rules

- Update `roadmap-state.yaml` first for IDs, status, dependencies, and registry relationships.
- Keep Markdown pages explanatory; do not make them a second status tracker.
- Record durable decisions as ADRs.
- Record events only in `RAPID.md`.
- Keep historical material in `archive/` and link it through `archive_trace`.
- Regenerate `views/` after changing `roadmap-state.yaml`.

## Current Entry Points

- Registry: `roadmap-state.yaml`
- Current/next view: `views/current-next.md`
- Status dashboard: `views/status-dashboard.md`
- Module matrix: `views/module-matrix.md`
- Governance decision: `decisions/ADR-0001-roadmap-governance-reset.md`
- Migration evidence: `validation/evidence/WP-ROADMAP-CLEANUP.md`
