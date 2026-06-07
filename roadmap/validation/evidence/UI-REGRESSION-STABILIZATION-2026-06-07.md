# Evidence - UI Regression Stabilization 2026-06-07

## Target

- ID: `I-010` / `A-037`
- Type: Cross-workpackage corrective validation
- Status: Automated validation passed; manual UI verification required

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Markdown generated diagram export no longer crashes on filename sanitization | Source fix + web tests/build | Pass | `apps/textforge-web/src/workbench/controller/index.js`; `corepack pnpm --filter ./apps/textforge-web test` |
| AC-002 | Markdown print HTML includes rendered diagram markup instead of raw Mermaid fences | Package regression test | Pass | `packages/markdown/test/index.test.js`; `corepack pnpm --filter @textforge/markdown test` |
| AC-003 | ITM Markdown mindmap/report profiles render `itm-pub` output through the workbench registry | Web integration test | Pass | `apps/textforge-web/test/markdownWorkbenchIntegration.test.js` |
| AC-004 | Lua console transcript/history is selectable and has non-clipping row metrics | Source inspection + focused tests | Pass with manual UI follow-up | `apps/textforge-web/src/styles.css`; `packages/lua/src/runtime.js`; `corepack pnpm --filter @textforge/lua test` |
| AC-005 | BPMN viewer no longer fails on missing runtime helper symbol | Package regression test | Pass | `packages/bpmn/test/index.test.js`; `corepack pnpm --filter @textforge/bpmn test` |
| AC-006 | EA dashboard capability map differs from network topology and React Flow positions survive control changes | Graph tests + source inspection | Pass with manual UI follow-up | `packages/ea-viewer/test/index.test.js`; `packages/ea-viewer/src/viewer-surface.js` |
| AC-007 | EA Dashboard ITM profile activates translator and graph provider capabilities | Web integration test | Pass | `apps/textforge-web/test/eaWorkbenchIntegration.test.js` |
| AC-008 | Large retail ITM graph rendering is guarded instead of running during startup | ITM surface test | Pass with manual UI follow-up | `packages/itm/test/index.test.js` |
| AC-009 | SVG assets open in the SVG viewer, incomplete Markdown diagram print exports are blocked with diagnostics, and Mermaid generated SVGs contain visible payload rather than empty wrappers | Asset/diagram tests + web tests/build | Pass with manual UI follow-up | `packages/assets/test/index.test.js`; `packages/diagrams/test/index.test.js`; `apps/textforge-web/src/workbench/controller/index.js`; `corepack pnpm --filter ./apps/textforge-web build` |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | `corepack pnpm --filter @textforge/markdown test` | 12 passing tests. |
| EV-002 | test output | `corepack pnpm --filter @textforge/bpmn test` | 12 passing tests. |
| EV-003 | test output | `corepack pnpm --filter @textforge/lua test` | 19 passing tests; existing Fengari circular dependency warning observed. |
| EV-004 | test output | `corepack pnpm --filter @textforge/ea-viewer test` | 13 passing tests. |
| EV-005 | test output | `corepack pnpm --filter @textforge/itm test` | 34 passing tests. |
| EV-006 | test output | `corepack pnpm --filter ./apps/textforge-web test` | 13 passing tests; existing Fengari warning observed. |
| EV-007 | build output | `corepack pnpm --filter ./apps/textforge-web build` | Build passed; existing browser externalization/import-meta warnings observed. |
| EV-008 | roadmap check | `node roadmap/scripts/generate-views.mjs --check`; `corepack pnpm roadmap:dependency-map:publish:check` | Both passed. |
| EV-009 | follow-up test output | `corepack pnpm --filter @textforge/lua test`; `corepack pnpm --filter @textforge/itm test`; `corepack pnpm --filter @textforge/renderer-jsmind test`; `corepack pnpm --filter @textforge/textforge-web test` | Follow-up regressions covered: selectable owned Lua transcript, jsMind-backed Markdown mindmap publication marker, nonblocking large ITM guard. |
| EV-010 | follow-up build output | `corepack pnpm --filter @textforge/lua build`; `corepack pnpm --filter @textforge/itm build`; `corepack pnpm --filter @textforge/renderer-jsmind build`; `corepack pnpm --filter @textforge/textforge-web build` | Touched package builds passed. Web build passed with the existing `@viz-js/viz` import-meta warning only. |
| EV-011 | second follow-up test output | `corepack pnpm --filter @textforge/diagrams test`; `corepack pnpm --filter @textforge/renderer-jsmind test`; `corepack pnpm --filter @textforge/renderer-cytoscape test`; `corepack pnpm --filter @textforge/renderer-sigma test`; `corepack pnpm --filter @textforge/textforge-web test` | Covered resilient SVG-to-PNG export, passive embedded jsMind render mounting, and large visual-runtime source guards. |
| EV-012 | second follow-up build output | `corepack pnpm --filter @textforge/diagrams build`; `corepack pnpm --filter @textforge/renderer-jsmind build`; `corepack pnpm --filter @textforge/renderer-cytoscape build`; `corepack pnpm --filter @textforge/renderer-sigma build`; `corepack pnpm --filter @textforge/textforge-web build` | Touched package builds passed. Web build passed with existing upstream browser externalization/import-meta warnings. |
| EV-013 | third follow-up test/build output | `corepack pnpm --filter @textforge/assets test`; `corepack pnpm --filter ./apps/textforge-web test`; `corepack pnpm --filter @textforge/assets build`; `corepack pnpm --filter ./apps/textforge-web build` | Covered default SVG viewer safety for generated SVGs and a Markdown print-export guard that blocks incomplete diagram HTML instead of silently downloading it. Web build passed with existing upstream browser externalization/import-meta warnings. |
| EV-014 | fourth follow-up test/build output | `corepack pnpm --filter @textforge/diagrams test`; `corepack pnpm --filter @textforge/assets test`; `corepack pnpm --filter @textforge/diagrams build`; `corepack pnpm --filter @textforge/assets build`; `corepack pnpm --filter ./apps/textforge-web test`; `corepack pnpm --filter ./apps/textforge-web build` | Removed the generated/large SVG preview pause workaround and fixed Mermaid generated SVGs by preventing render-id collisions with existing preview SVGs. Empty stylesheet-only Mermaid SVGs are now rejected. Web build passed with existing upstream browser externalization/import-meta warnings. |

## Follow-up correction

Manual retest found four residual issues after the initial stabilization pass:

- Markdown generated diagram export still froze while producing PNG assets.
- `?testProfile=itm-markdown-mindmap` rendered the static placeholder mindmap instead of the jsMind-backed runtime.
- Lua history remained unselectable because xterm still owned the transcript rows.
- The retail ITM large-graph guard exposed a blocking "Continue rendering" action and unclear "Keep queued" wording.

Corrections made in the follow-up pass:

- Generated diagram export now renders SVGs first, then rasterizes PNGs in a Blob-backed Web Worker when supported, with a yielding main-thread fallback.
- ITM mindmap publication emits a Visual ITM/jsMind hydration island and the web Markdown preview mounts it with the shared `@textforge/renderer-jsmind` runtime.
- Lua console no longer depends on xterm; the prompt and transcript are TextForge-owned DOM controls, with a selectable `<pre>` transcript and explicit regression coverage.
- Large retail ITM graph surfaces no longer expose the known blocking continue action; the guard stays responsive and uses a clear `Cancel rendering` action until graph resolution can be moved wholesale off-thread.

Second residual retest found generated diagram PNG rasterization could still fail the command, embedded jsMind needed to be a passive rendered diagram rather than a full runtime surface, and opening large retail ITM visual-runtime viewpoints could still start synchronous renderer resolution. Corrections made:

- SVG-to-PNG rasterization now uses Blob URLs and per-diagram error handling; SVG export completes even when a PNG cannot be decoded.
- Markdown `itm-pub` mindmap hydration now uses a passive embedded jsMind render without toolbar/sidebar runtime controls.
- Cytoscape, Sigma, and jsMind visual-runtime resolvers pause large ITM sources before synchronous graph resolution and display a background-worker-required warning instead of freezing the UI.

Third residual retest found print HTML could still be downloaded with no rendered Mermaid artifact and generated SVG assets could freeze the viewer on open. Corrections made:

- SVG resources now prefer the read-only SVG viewer surface over the editor by default.
- Markdown print HTML export now refuses to download when Mermaid/Graphviz fences are present but the rendered print document has no SVG artifact, or when fence diagnostics identify a diagram render failure.

Fourth residual retest showed the generated Mermaid SVGs themselves were empty wrappers, so pausing SVG preview was the wrong mitigation and has been removed. Corrections made:

- Generated SVG resources render directly in the SVG viewer again.
- Mermaid render calls now use unique per-call DOM ids so Mermaid's body-wide `#id` lookup cannot draw into an existing preview SVG while serializing an empty temporary export SVG.
- Mermaid rendering now uses a real-sized offscreen host and rejects stylesheet-only SVG wrappers with no visible payload.

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|
| UI-REG-001 | Medium | Manual verification pending | Repository guidance forbids headless browser UI checks; user should run the manual UI checks listed below. |

## Manual UI Verification Requested

- Export Markdown print HTML with Mermaid and confirm the diagram appears.
- Run generated diagram export and confirm SVG/PNG assets are created.
- Open `?testProfile=itm-markdown-mindmap` and confirm the passive jsMind-rendered mindmap shows connector lines; open `?testProfile=itm-markdown-report` and confirm report publication output.
- Select/copy Lua history text and confirm row spacing is not clipped.
- Open `Training By Design.bpmn`.
- Test EA dashboard view switching, node dragging plus slider/checkbox changes, and the retail ITM profile visual-runtime guard.

## Validation conclusion

Pass with manual UI verification pending.
