# TextForge

TextForge is a local-first, text-first workbench for editing, visualizing, and transforming structured text inside an application-private workspace. Plain text stays primary while trees, graphs, rendered pages, BPMN diagrams, SVG artifacts, and generated outputs remain derived, inspectable views.

The current implementation ships the workspace architecture from the whitepaper together with the Lua pivot: trusted internal TypeScript plugins still own parsing, rendering, and viewers, while user extensibility runs through a restricted Lua runtime with bundled libraries, pipeline bridges, and a local xterm.js console.

## Highlights

- IndexedDB-backed virtual workspace with folders, files, read-only bundled resources, open-file tabs, and deterministic Shapez-style badges.
- ZIP import into the selected folder plus ZIP export for a selected subtree or the whole workspace.
- Broad language support for plain text, Markdown, ITM, Lua, JSON, XML, BPMN 2.0 XML, CSV/TSV, Mermaid, Graphviz DOT, JavaScript, and Python.
- Popup-hosted viewers with search, zoom, export, detach, follow-source refresh, and window layout controls, plus diagnostics, pipeline traces, Lua console, Lua script manager, and plugin manager.
- Local-only execution with no app-code network APIs and a browser-extension CSP that keeps `connect-src 'none'`.

## Workspace Model

TextForge owns a private project tree inside IndexedDB.

- Import one or more files into the selected workspace folder.
- Import a ZIP archive into the selected workspace folder.
- Export the active file, a selected folder subtree, or the whole workspace root.
- Browse bundled docs and examples under `/.textforge/resources`.
- Keep files in the workspace without opening them in editor tabs.
- Open editable text files in CodeMirror or view them directly through their default pipeline.
- Store generated outputs under `/generated/...` instead of treating them as temporary tabs.

The workspace boundary is strict: files cross the local filesystem boundary only through explicit import and export actions. TextForge does not map live local folders and does not use the File System Access API.

## Viewers And Pipelines

TextForge includes packaged viewers for:

- rendered Markdown HTML with syntax highlighting, Mermaid, Graphviz, and KaTeX;
- BPMN 2.0 diagrams rendered directly from `.bpmn` XML;
- SVG with panning, zooming, and fit controls;
- tree and mind map projections for ITM and other hierarchical data;
- Cytoscape graph views for rich graph interaction and relayout;
- Sigma/Graphology graph views with filtering and neighborhood focus controls;
- read-only syntax-highlighted source and table views.

Several viewers participate in source-aware navigation. You can keep the editor and a popup aligned, enable Follow source on viewer windows, and move back from visuals to code through mapped source ranges.

Transformer and Lua outputs now become generated workspace files. Text outputs open as editor tabs, while visual outputs are stored in the workspace and opened in a viewer.

## Lua Automation

User extensibility is Lua, not uploaded JavaScript.

The Lua feature set includes:

- restricted Fengari runtime with no browser globals, DOM, network, filesystem, or unrestricted JS interop;
- bundled modules such as `tf`, `tf.tree`, `tf.graph`, `tf.table`, `tf.stringx`, `tf.itm`, `tf.markdown`, `tf.pipeline`, `tf.actions`, and `tf.console`;
- built-in bridges for parsing ITM, Markdown, and CSV, emitting text/ITM/JSON/CSV, inspecting the current pipeline catalog, and calling Lua-defined or selectively wired pipeline steps;
- automatic discovery of named Lua actions only from `/.textforge/automation/lua/**/*.lua`;
- workspace-local `require()` resolution for Lua libraries under the active script folder, `/lua`, `/lib`, and `/.textforge/automation/lua`;
- execution in a worker-backed sandbox with diagnostics routed back to the editor or selected source block, plus execution limits for time, instructions, output size, recursion depth, and model/table growth.

Ordinary `.lua` files stay inert by default. A Lua file anywhere in the workspace can still be run manually when open. Promotion into the automation root is explicit.

The Lua Console can run quick snippets, run the active Lua document, run selected Lua text, inspect the active pipeline catalog, list registered Lua actions, inspect a read-only registry snapshot through the power-session host objects, and store the previous result as a generated workspace file.

## Bundled Resources

Bundled documentation and examples ship inside the workspace tree under `/.textforge/resources`, including:

- the README;
- the executive summary;
- the user manual;
- the Lua scripting tutorial;
- plugin and format documentation;
- Graphviz, Mermaid, Markdown, Lua, and ITM examples.

Resources are read-only, can be viewed directly, exported, or copied into editable workspace folders.

The bundled resources are organised under `/.textforge/resources/docs` and `/.textforge/resources/examples`, so the in-app workspace tree is the canonical place to discover current guides and sample files.

## Current State

The shipped app currently centers on a workspace-first flow:

- create, import, rename, organise, and export files from the private workspace tree;
- open text files in CodeMirror while leaving other files available for direct viewer actions from the explorer;
- store pipeline and Lua results as generated workspace files under `/generated/...`;
- browse packaged documentation and examples in the same tree as normal workspace content;
- use viewer popups for search, zoom, export, follow-source refresh, and detached snapshots.

Historical whitepapers in this repository still describe earlier stages of the architecture. When they refer to open-document mode, a separate resource browser, or temporary popup outputs, read those as the current private workspace model, the `/.textforge/resources` folder, and generated workspace files plus popup viewers.

## Development

```powershell
npm install
npm run dev
npm run check
```

`npm run build` creates a file-openable static build in `dist/`. Open `dist/index.html` directly with `file://` to run without a server. The browser extension manifest is copied to `dist/manifest.json`.

`npm run build:module` keeps the regular Vite module/chunk build available for debugging, while the default production build remains the local-file build.
