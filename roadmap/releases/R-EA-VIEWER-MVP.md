# R-EA-VIEWER-MVP - Enterprise architecture viewer MVP

## Outcome

Exact local TextForge surface port of the EA Dashboard viewer over workspace JSON architecture fixtures.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-EA-VIEWER-01` | Exact EA dashboard viewer surface | Registry-owned | no |

## Excluded / Deferred

Anything not listed in the registry under this release is excluded until `roadmap-state.yaml` is updated.

## Dependency Gates

Dependency gates are resolved from `roadmap-state.yaml` and visualized in `views/dependency-map-full.md`.

## Acceptance Criteria

- TextForge can open a recognized EA dashboard JSON fixture in the embedded viewer surface.
- Timeline/year slider and level-of-detail slider behavior match the source dashboard semantics.
- React Flow/Dagre views and custom SVG/detail views render without backend calls.
- Invalid or unrelated JSON produces diagnostics or a clear fallback instead of a blank surface.

## Validation Evidence Required

- Workpackage checklist evidence for `WP-EA-VIEWER-01`.
- Release cut evidence file if the release moves beyond candidate/defined state.

## Risks

| Risk | Mitigation |
|---|---|
| Exact-port drift | Keep source-file archive traces in the workpackage and compare behavior against the EA Dashboard pages before validation. |
| CSP regression | Require no default network calls and verify against the TextForge local/offline CSP. |
| Large fixture performance | Test both full and diagrams-only exports, then capture parse/render timing evidence if needed. |

## Release Notes Draft

Adds a local enterprise architecture dashboard viewer surface for JSON fixture exports, preserving the original graph/detail navigation and the timeline/detail-level controls.

## Open Decisions

- See `decisions/` and `RAPID.md`.
