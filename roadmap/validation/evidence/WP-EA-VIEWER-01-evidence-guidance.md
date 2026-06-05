# WP-EA-VIEWER-01 Evidence Guidance

## Target

- ID: WP-EA-VIEWER-01
- Release: R-EA-VIEWER-MVP
- Type: Workpackage validation guidance
- Status: Prepared for implementation validation

## Evidence scope

Use this file to collect validation output for the exact EA Dashboard viewer MVP. The MVP is local-first: JSON is read from TextForge workspace resources, viewer state is driven by the local fixture model, and the default viewer must not call Axios, Django, Gemini, or other network endpoints.

## Focused command evidence

Run these focused checks from the repository root and paste command, date, commit, and result into the final evidence record.

| Evidence ID | Command | Covers |
|---|---|---|
| EV-CMD-001 | `corepack pnpm --filter @textforge/ea-viewer test` | EA fixture normalization, recognized/unrecognized JSON handling, surface registration, view state reducers, lifecycle units. |
| EV-CMD-002 | `corepack pnpm --filter @textforge/ea-viewer lint` | Package style and accidental dependency/import drift. |
| EV-CMD-003 | `corepack pnpm --filter @textforge/ea-viewer typecheck` | Public package contract and surface integration types. |
| EV-CMD-004 | `corepack pnpm --filter @textforge/ea-viewer build` | Bundle viability for the new package. |
| EV-CMD-005 | `corepack pnpm --filter @textforge/lua test` | Bundled Lua JSON-to-ITM / ITM-to-JSON translator coverage. |
| EV-CMD-006 | `corepack pnpm --filter @textforge/itm test` | Bundled EA Dashboard ITM profile parse/round-trip coverage. |
| EV-CMD-007 | `corepack pnpm --filter @textforge/textforge-web test` | Web shell regression coverage for contribution registration and workspace open flows. |
| EV-CMD-008 | `corepack pnpm --filter @textforge/textforge-web build` | Integrated production build. |

If `@textforge/ea-viewer` has not landed yet, record EV-CMD-001 through EV-CMD-004 as blocked by missing package rather than substituting broad monorepo checks.

## Browser smoke expectations

Use a clean browser profile or cleared IndexedDB so the smoke is not satisfied by stale workspace state.

1. Start the local app: `corepack pnpm --filter @textforge/textforge-web dev -- --port 4173`.
2. Open `http://127.0.0.1:4173/`.
3. Open or import `docs/examples/ea/ea-dashboard-sample.json` as a workspace resource.
4. Confirm TextForge selects the EA viewer surface for the recognized fixture instead of the generic text editor.
5. Confirm the architecture graph view renders nodes and relationships from local data.
6. Confirm React Flow and Dagre-backed graph views render without blank canvases or console exceptions.
7. Confirm SVG/detail views render from the same local model.
8. Move the timeline/year slider and verify the visible graph/detail state changes consistently.
9. Move the level-of-detail slider and verify the visible graph/detail state changes consistently.
10. Exercise viewpoint/filter controls, drill into a node, and confirm the selected-node detail panel remains usable.
11. Close the surface, reopen the same JSON resource, and confirm the viewer restores without stale selection or blank state.
12. Open an unrelated or invalid JSON file and confirm diagnostics or an explicit fallback is shown.

Capture at least one desktop screenshot for the recognized fixture, one screenshot after slider/filter interaction, and one screenshot for invalid JSON fallback.

## No-network checks

Record both static and browser-runtime evidence. Expected result is no network use by the default EA viewer beyond loading the local dev server assets.

| Evidence ID | Check | Expected result |
|---|---|---|
| EV-NET-001 | `rg -n "axios|fetch\\(|XMLHttpRequest|WebSocket|EventSource|navigator\\.sendBeacon|https?://|gemini|django" packages/ea-viewer apps/textforge-web/src` | No matches in EA viewer runtime code, or each match documented as unrelated/non-runtime. |
| EV-NET-002 | Browser DevTools Network tab during fixture open and slider/filter/drill-down smoke. | No requests to Django, Gemini, remote HTTP(S), WebSocket, EventSource, or telemetry endpoints. |
| EV-NET-003 | Browser console during smoke. | No failed remote requests, CORS errors, or errors mentioning Axios/Django/Gemini. |

When validating a production build, repeat EV-NET-002 against the preview or file-openable build and ignore only static assets loaded from the same local origin.

## Checklist mapping

| Criterion ID | Acceptance check | Primary evidence |
|---|---|---|
| AC-001 | `@textforge/ea-viewer` registers as a package contribution and surface. | EV-CMD-001, EV-CMD-003, browser smoke step 4. |
| AC-002 | Recognized EA dashboard JSON fixture exports open from workspace `.json` resources. | EV-CMD-001, browser smoke steps 3-4. |
| AC-003 | Full architecture export and diagrams-only export normalization paths are covered. | EV-CMD-001 with full and diagrams-only fixtures. |
| AC-004 | Bundled EA Dashboard ITM profile and Lua translators cover the same Django fixture model. | EV-CMD-005, EV-CMD-006. |
| AC-005 | React Flow and Dagre graph views render from local data. | Browser smoke steps 5-6, screenshots. |
| AC-006 | Custom SVG/detail views render from local data. | Browser smoke step 7, screenshots. |
| AC-007 | Timeline/year slider is present and changes the same data/view state as the source dashboard. | EV-CMD-001, browser smoke step 8. |
| AC-008 | Level-of-detail slider is present and changes the same data/view state as the source dashboard. | EV-CMD-001, browser smoke step 9. |
| AC-009 | Viewpoint/filter controls, drill-down selection, and selected-node detail panels remain usable. | EV-CMD-001, browser smoke step 10. |
| AC-010 | The default viewer makes no Axios, Django, Gemini, or other network calls. | EV-NET-001, EV-NET-002, EV-NET-003. |
| AC-011 | Invalid or unrelated JSON reports diagnostics or a clear fallback. | EV-CMD-001, browser smoke step 12. |
| AC-012 | Surface lifecycle works with open, close, and reopen flows. | EV-CMD-001, browser smoke step 11. |
| AC-013 | Build and focused tests pass for touched packages. | EV-CMD-001 through EV-CMD-008, scoped to touched packages. |

## Evidence record template

Create or update the final evidence record with this minimal structure:

| Evidence ID | Type | Location | Result | Notes |
|---|---|---|---|---|
| EV-CMD-001 | test output | paste command log or artifact path | Pass/Fail/Blocked | Include commit SHA and package version if available. |
| EV-SMOKE-001 | screenshot | `roadmap/validation/evidence/...` | Pass/Fail | Recognized fixture initial render. |
| EV-SMOKE-002 | screenshot | `roadmap/validation/evidence/...` | Pass/Fail | Slider/filter interaction. |
| EV-SMOKE-003 | screenshot | `roadmap/validation/evidence/...` | Pass/Fail | Invalid JSON fallback. |
| EV-NET-001 | static scan | paste command log or artifact path | Pass/Fail | Document intentional non-runtime matches. |
| EV-NET-002 | browser network log | screenshot/HAR/manual note | Pass/Fail | Must show no remote calls during viewer interactions. |

## Validation conclusion rules

- Pass: all AC rows have passing command and smoke/no-network evidence.
- Pass with limitations: only non-critical fixture breadth or screenshot coverage is missing, and no local-first/no-network requirement is weakened.
- Fail: recognized fixtures do not open in the EA viewer, graph/detail state is blank or stale, invalid JSON has no clear fallback, or any default viewer interaction calls remote services.
