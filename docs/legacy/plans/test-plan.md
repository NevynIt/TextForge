# TextForge Manual Test Plan

## Environment
- Browser:
- Build type:
- Date:
- Tester:

## Smoke Tests
- Open the app from `dist/index.html` using `file://`.
- Confirm the workspace tree shows `/docs`, `/examples`, `/.textforge/resources`, and `/.textforge/automation/lua`.
- Create a file, edit text, rename it, switch language, download it, and close its tab without deleting the file.
- Import multiple local files into `/docs` and confirm tab ordering, drag/drop reordering, and stable Shapez badges.
- Import a ZIP archive into `/examples` and confirm folders/files are created under the selected folder.
- Export a selected folder and the whole workspace as ZIP files.
- Open a viewer popup and confirm search, export, detach, Follow source, and window layout controls are present.

## Markdown Tests
- Headings render and fold/unfold correctly.
- Mermaid fenced blocks render locally.
- Graphviz fenced blocks render locally.
- KaTeX inline and block math render locally.
- Code blocks are syntax-highlighted.
- Embedded diagram toolbar copy/download/pop-out/reset controls work.

## ITM Tests
- Full ITM example parses.
- Tree, mindmap, Cytoscape, and Sigma viewers open.
- Multiline `%style` and `%include` work.
- `%include` resolves against workspace-relative paths, not only open tabs.
- Unknown multiline directives are ignored.
- ITM editor highlighting and folding remain usable.
- ITM tree and graph editor skeleton actions open placeholder editor surfaces rather than failing.

## Structured Data Tests
- JSON diagnostics and tree viewer work.
- XML diagnostics and tree viewer work.
- Delimited text table viewer works for `.csv` and `.tsv` content.
- BPMN XML opens in both BPMN and SVG viewers.

## Lua Tests
- Lua syntax highlighting works.
- Lua Console opens and runs a quick command.
- Active Lua document execution works.
- A Lua file outside `/.textforge/automation/lua/` is not auto-loaded.
- Promoting a Lua file into `/.textforge/automation/lua/` makes it discoverable.
- Saved Lua action appears in the action dropdown after promotion.
- Lua `require()` resolves a helper in the same folder, `/lib`, or the automation root.
- Lua action can call `tf.pipeline.run("itm-to-graph", input)`.
- Lua action can parse CSV and emit CSV.
- Lua cannot require `js`, `socket`, `io`, or run `os.execute`.
- Infinite loop times out without blocking the UI.

## Viewer Tests
- SVG viewer pans and zooms around the cursor.
- Cytoscape and Sigma selection remains visible.
- Mindmap cross-links draw to node borders.
- Mindmap cross-link labels can be dragged.
- Bundled resources under `/.textforge/resources` can be viewed directly and copied as editable files.
- Selecting an unsupported binary file shows metadata plus export, not a text editor.
- Pipeline or Lua-generated outputs appear under `/generated/...`.

## Security / Local-Only Checks
- Disconnect the network after loading; app workflows still work.
- Browser DevTools Network panel shows no required remote requests.
- `npm run test`, `npm run build`, `npm run verify:file`, and `npm run verify:security` pass.
