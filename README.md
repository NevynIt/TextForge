# TextForge

TextForge is a local-first, text-first workbench for editing, visualizing, and transforming structured text. It is built for document-centric workflows where plain text stays primary and trees, graphs, rendered pages, BPMN diagrams, SVG artifacts, and transformed outputs remain derived, inspectable views.

The current implementation ships most of the Lua pivot described in the whitepaper: trusted internal TypeScript plugins still own parsing, rendering, and viewers, while user extensibility runs through a restricted Lua runtime with bundled libraries, pipeline bridges, and a local xterm.js console.

## Highlights

- multi-document CodeMirror workspace with tab reordering, inline rename, download, and deterministic Shapez-style document badges;
- broad language support for plain text, Markdown, ITM, Lua, JSON, XML, BPMN 2.0 XML, CSV/TSV, Mermaid, Graphviz DOT, JavaScript, and Python;
- local-only execution with no app-code network APIs and a browser-extension CSP that keeps `connect-src 'none'`;
- popup-hosted viewers with search, zoom, export, detach, follow-source refresh, and window layout controls, plus diagnostics, pipeline traces, Lua console, Lua script manager, plugin manager, and bundled resource browser;
- IndexedDB persistence with localStorage fallback for local workspace state.

## What You Can Do

### Explore Text Through Multiple Views

TextForge includes packaged viewers for:

- rendered Markdown HTML with syntax highlighting, Mermaid, Graphviz, and KaTeX;
- BPMN 2.0 diagrams rendered directly from `.bpmn` XML;
- SVG with infinite-canvas style panning, cursor-relative zooming, and fit controls;
- tree and mind map projections for ITM and other hierarchical data;
- Cytoscape graph views for rich graph interaction and relayout;
- Sigma/Graphology graph views with filtering and neighborhood focus controls;
- read-only syntax-highlighted source and table views.

Several viewers participate in source-aware navigation. You can keep the editor and a popup aligned, enable Follow source on viewer windows, and move back from visuals to code or text through mapped source ranges. Tree nodes can jump back to source with Ctrl-click, and tree cross-link badges can either select the linked node or jump to the exact source range.

Viewer popups also support search, window tiling/maximize controls, detached snapshot windows, and snapshot export. The pipeline trace popup can reopen serialized intermediate results as editable documents.

### Work Incrementally With Structured Text

Markdown, ITM, Mermaid, Graphviz, delimited text, JSON, XML, and BPMN all live in the same workbench. A typical workflow is:

1. edit the source text;
2. run a built-in action or viewer pipeline;
3. inspect the result in a popup;
4. search, filter, or navigate the visual view;
5. open the output or an intermediate trace step back into the editor.

This keeps text as the source of truth while still making large structures easier to read and explore.

### Automate Transformations With Lua

User extensibility is Lua, not uploaded JavaScript.

The current Lua feature set includes:

- restricted Fengari runtime with no browser globals, DOM, network, filesystem, or unrestricted JS interop;
- bundled modules such as `tf`, `tf.tree`, `tf.graph`, `tf.table`, `tf.stringx`, `tf.itm`, `tf.markdown`, `tf.pipeline`, `tf.actions`, and `tf.console`;
- built-in bridges for parsing ITM, Markdown, and CSV, emitting text/ITM/JSON/CSV, and calling named pipeline steps;
- automatic discovery of named Lua actions from open `.lua` documents;
- action registration into the same action/pipeline surface as built-in transforms;
- execution in a worker-backed sandbox with diagnostics routed back to the editor or selected source block, plus execution limits for time, instructions, output size, recursion depth, and model/table growth.

The Lua Console is an in-app command surface backed by xterm.js. It can run quick snippets, run the active Lua document, run only the selected Lua text, list registered actions, invoke built-in pipeline bridges, and open the previous result as a new document.

### Inspect Graphs Instead Of Guessing

Graph workflows are a strong part of the current app:

- ITM can be projected into tree, mind map, Cytoscape, and Sigma views;
- Sigma toolbars expose useful exploration controls such as filtering to search matches and focusing on neighbors;
- graph and viewer search helps narrow large structures before reading them in full;
- pipeline trace popups let you inspect intermediate graph, tree, text, HTML, or SVG values step by step.

## Other Supported Formats

TextForge also ships targeted workflows for non-ITM structured text:

- JSON and XML can be linted and projected into tree viewers;
- delimited text (`.csv`, `.tsv`, `.tab`) can be linted and opened in the table viewer;
- Mermaid and Graphviz DOT can render to SVG, with Graphviz DOT also supporting Cytoscape and Sigma graph viewers;
- BPMN 2.0 XML can open either in the embedded BPMN viewer or as generated SVG.

## ITM And Markdown Support

ITM `%style` directives support the selector forms from the whitepaper: `*`, `&id`, `[type]`, `#tag`, `{key=value}`, `->`, `->[type]`, and `=>`. Styles can be written on one line or as multiline blocks. `%include` is currently resolved by the parser library, with TextForge using the shared package-backed parse surface.

Markdown rendering overlaps intentionally with the strongest local-preview ideas from tools such as Markdown Viewer, but TextForge pushes them into a broader structured-text workbench. Markdown documents can contain diagrams, math, and code, then feed into the same popup, export, and source-aware workflow used by the other viewers.

Viewer-specific style references are bundled in the app:

- `docs/itm-tree-style-support.md`
- `docs/itm-mindmap-style-support.md`
- `docs/itm-graph-style-support.md`

## Bundled Resources

The Resource Browser ships with documentation and examples inside the app, including:

- the README;
- the executive summary;
- the user manual;
- the Lua scripting tutorial;
- plugin and format documentation;
- Graphviz, Mermaid, Markdown, Lua, and ITM examples.

Resources are grouped in the browser, can be previewed directly, copied, or opened as editable working copies. Markdown resources can also be sent straight to the HTML viewer from the browser.

## Development

```powershell
npm install
npm run dev
npm run check
```

`npm run build` creates a file-openable static build in `dist/`. Open `dist/index.html` directly with `file://` to run without a server. The browser extension manifest is copied to `dist/manifest.json`.

`npm run build:module` keeps the regular Vite module/chunk build available for debugging, while the default production build remains the local-file build.
