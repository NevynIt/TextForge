# WP-EA-VIEWER-01 - Exact EA Dashboard Viewer Surface Checklist

## Scope

Embedded TextForge surface port of the EA Dashboard React viewer for local JSON architecture fixtures.

## Acceptance checks

- `@textforge/ea-viewer` registers as a package contribution and surface.
- Recognized EA dashboard JSON fixture exports open from workspace `.json` resources.
- Full architecture export and diagrams-only export normalization paths are covered.
- React Flow and Dagre graph views render from local data.
- Custom SVG/detail views render from local data.
- Timeline/year slider is present and changes the same data/view state as the source dashboard.
- Level-of-detail slider is present and changes the same data/view state as the source dashboard.
- Viewpoint/filter controls, drill-down selection, and selected-node detail panels remain usable.
- The default viewer makes no Axios, Django, Gemini, or other network calls.
- Invalid or unrelated JSON reports diagnostics or a clear fallback.
- Surface lifecycle works with open, close, and reopen flows.
- Build and focused tests pass for touched packages.

## Validation evidence

- Pending implementation evidence.
