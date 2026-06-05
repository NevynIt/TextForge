# Migration Cutover Checklist

| Step | Status | Evidence |
|---|---|---|
| Preflight source and package | Done | governance package, old roadmap, RAPID counters read |
| Freeze and archive | Done | `archive/migration-snapshots/roadmap-before-governance-reset-2026-06-05/`; `archive/rapid/RAPID-up-to-2026-06-05.md` |
| Install governance decision | Done | `decisions/ADR-0001-roadmap-governance-reset.md` |
| Create active RAPID | Done | `RAPID.md` |
| Create target skeleton | Done | modules, workpackages, releases, validation, views, archive folders |
| Build registry | Done | `roadmap-state.yaml` |
| Migrate module/WP/release content | Done | active Markdown pages generated from registry plus source traces |
| Generate views | Done | `views/` |
| Validate | Done | `validation/evidence/WP-ROADMAP-CLEANUP.md` |
| Finalize | Done | root README updated |
