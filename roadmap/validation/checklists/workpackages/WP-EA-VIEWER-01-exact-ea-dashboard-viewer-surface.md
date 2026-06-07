# WP-EA-VIEWER-01 - Exact EA Dashboard Viewer Surface Checklist

## Scope

Embedded TextForge surface port of the EA Dashboard React viewer for local JSON architecture fixtures.

## Acceptance checks

- `@textforge/ea-viewer` registers as a package contribution and surface.
- Recognized EA dashboard JSON fixture exports open from workspace `.json` resources.
- Full architecture export and diagrams-only export normalization paths are covered.
- Bundled EA Dashboard ITM profile and Lua JSON-to-ITM / ITM-to-JSON translators cover the same Django fixture model.
- React Flow and Dagre graph views render from local data.
- Custom SVG/detail views render from local data.
- Timeline/year slider is present and changes the same data/view state as the source dashboard.
- Level-of-detail slider is present and changes the same data/view state as the source dashboard.
- Viewpoint/filter controls, drill-down selection, and selected-node detail panels remain usable.
- React Flow node positions adjusted by the user survive slider and checkbox changes.
- Network topology and business capability map views use distinct graph builders/content.
- EA Dashboard ITM examples activate the required EAD translator, relationship identity, graph model, Dagre, and graph viewer capabilities without capability-missing diagnostics.
- Large retail ITM profiles estimate/render expensive graph work without freezing startup and expose progress plus cancel/continue controls.
- The default viewer makes no Axios, Django, Gemini, or other network calls.
- Invalid or unrelated JSON reports diagnostics or a clear fallback.
- Surface lifecycle works with open, close, and reopen flows.
- Build and focused tests pass for touched packages.

## Validation evidence

- Bundled profile/translators: `docs/examples/ea/ea-dashboard-profile.itm`, `docs/examples/ea/ea-dashboard-json-to-itm.lua`, `docs/examples/ea/ea-dashboard-itm-to-json.lua`.
- Representative fixture: `docs/examples/ea/ea-dashboard-sample.json`.
- Focused checks: `corepack pnpm --filter @textforge/lua test`, `corepack pnpm --filter @textforge/itm test`.
- Evidence guidance and checklist mapping: `roadmap/validation/evidence/WP-EA-VIEWER-01-evidence-guidance.md`.
