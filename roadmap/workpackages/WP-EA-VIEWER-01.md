# WP-EA-VIEWER-01 - Exact EA dashboard viewer surface

## Registry

- Workpackage ID: `WP-EA-VIEWER-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-EA-VIEWER`
- ADRs: `ADR-0001`, `ADR-0012`

## Outcome

TextForge gains an embedded `@textforge/ea-viewer` surface that is an exact local port of the EA Dashboard React viewer for workspace JSON architecture files. The first slice preserves the original viewer's timeline slider and level-of-detail slider, including the graph/detail behavior those controls drive.

## Scope

- Create `packages/ea-viewer` as a TextForge package contribution.
- Register an EA dashboard viewer surface from `apps/textforge-web` with only the required manifest/open-with wiring.
- Port the relevant React components from `C:/Stuff/ea-dashboard/frontend/src/pages` into a single embedded surface with internal navigation instead of React Router routes.
- Keep React Flow and Dagre for the global, business, system, and AI-response graph layouts where the source viewer uses them.
- Keep the custom SVG/detail views for datacenter, rack/server, project, capabilities, process, and related architecture detail views.
- Normalize Django fixture array JSON from the full and diagrams-only exports into the local viewer state.
- Bundle an EA Dashboard ITM profile plus Lua JSON-to-ITM and ITM-to-JSON translators that preserve the same fixture model for semantic round-trip evidence.
- Preserve timeline/year slider behavior, level-of-detail slider behavior, viewpoint filters, impact trace state, selected-node panels, and drill-down flows.
- Render from `sourceText`, `resource`, and workspace resource metadata; no default network calls.
- Use package-scoped CSS/assets that do not depend on remote fonts or backend-hosted static files.

## Non-goals

- Django backend API, Axios data loading, auth, import/restore, or backup upload flows.
- Gemini chat or AI analysis calls.
- Write-back, edit mode, model mutation, or workspace persistence.
- ArchiMate semantic mapping or Visual ITM translation.
- Replacing the exact React Flow/Dagre behavior with a generic graph renderer in this slice.

## Package Impact

- New package: `packages/ea-viewer` / `@textforge/ea-viewer`.
- Expected third-party runtime dependencies: `@xyflow/react` and `dagre`, versioned for the TextForge React/Vite build.
- App touchpoint: `apps/textforge-web` package manifest registration only.
- Bundled examples/evidence: local EA JSON fixture, ITM profile, and Lua translators under `docs/examples/ea/`.

## Interfaces / Contracts Changed

- Add a surface contribution that can open `.json` resources recognized as EA dashboard fixture exports.
- Add a local fixture normalization API inside `@textforge/ea-viewer`.
- Keep JSON as the general TextForge language; do not introduce a special JSON language ID for this profile.
- Preserve TextForge's local/offline CSP by avoiding default `connect-src` requirements.

## Validation Criteria

Use `validation/checklists/workpackages/WP-EA-VIEWER-01-exact-ea-dashboard-viewer-surface.md` plus release-specific evidence.

## Evidence Required

- Focused parser/normalizer tests for full and diagrams-only fixture exports.
- Focused ITM profile and Lua translator round-trip tests for the bundled EA example fixture.
- Surface mount smoke test covering open, close, and reopen of a recognized JSON resource.
- Browser screenshot or equivalent UI verification showing graph rendering plus working timeline and detail-level sliders.
- Build verification for touched packages and `apps/textforge-web`.
- RAPID event entry when implementation moves from ready to in-progress or implemented.

## Open Decisions

- Confirm the final package name during implementation if `@textforge/ea-viewer` conflicts with existing naming conventions.
- Decide whether to include a tiny fixture in-repo or keep large EA exports only as external validation references.
- Keep `ADR-0012` generic graph extraction separate from the exact EA Dashboard port behavior in this workpackage.

## Archive Trace

- external reference: C:/Stuff/ea-dashboard/frontend/src/App.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/GlobalDashboard.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/BusinessDashboard.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/SystemView.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/DataCenterView.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/ProcessMapView.jsx
- external reference: C:/Stuff/ea-dashboard/frontend/src/pages/SettingsView.jsx
- external reference: C:/Stuff/ea-dashboard/data_export/ea_architecture_backup_2026-06-05.json
- external reference: C:/Stuff/ea-dashboard/data_export/ea_diagrams_backup_2026-06-05.json
