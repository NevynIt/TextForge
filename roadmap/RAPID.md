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
| P-105 | 2026-06-05 | Progress | Done | MOD-EA-VIEWER | WP-EA-VIEWER-01 | R-EA-VIEWER-MVP | Bundled the EA Dashboard ITM profile, representative fixture, and Lua JSON-to-ITM / ITM-to-JSON translators covering the same Django fixture architecture model. | docs/examples/ea/; packages/lua/test/index.test.js; packages/itm/test/index.test.js | |
| P-106 | 2026-06-06 | Progress | Done | MOD-SURFACES-UI | WP-LUA-POWER-SESSION | R-LOCAL-AUTHORING-MVP | Added an explicit startup recovery mode at `?recovery`, letting the shell reopen without restored files or reset the browser-managed workspace before normal hydration resumes. | apps/textforge-web/src/workbench.js; workpackages/WP-LUA-POWER-SESSION.md; releases/R-LOCAL-AUTHORING-MVP.md | |
| P-107 | 2026-06-06 | Progress | Done | MOD-WORKSPACE-RESOURCES | WP-RES-01 | R-LOCAL-AUTHORING-MVP | Corrected stale workspace tree folder counts by deriving item totals from the live merged snapshot instead of persisted `childIds`, covering bundled overlay folders such as `/.textforge/resources`. | packages/workspace/src/index.js; packages/workspace/test/index.test.js; workpackages/WP-RES-01.md; releases/R-LOCAL-AUTHORING-MVP.md | |
| P-108 | 2026-06-06 | Progress | Done | MOD-SURFACES-UI | WP-DIST-PWA | R-LOCAL-AUTHORING-MVP | Removed the multi-minute web dist bookkeeping tail by replacing the generated loader ES module syntax check with a single-pass scanner over comments, strings, and templates. | apps/textforge-web/scripts/check-dist.mjs | |
