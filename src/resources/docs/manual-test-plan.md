# TextForge Manual Test Plan

## Environment
- Browser:
- Build type:
- Date:
- Tester:

## Smoke Tests
- Open the app from `dist/index.html` using `file://`.
- Create a document, edit text, rename it, switch language, download it, close it.
- Open multiple local files and confirm tab ordering, drag/drop reordering, and stable Shapez badges.

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
- Unknown multiline directives are ignored.
- ITM editor highlighting and folding remain usable.

## Lua Tests
- Lua syntax highlighting works.
- Lua Console opens and runs a quick command.
- Active Lua document execution works.
- Saved Lua action appears in the action dropdown.
- Lua action can call `tf.pipeline.run("itm-to-graph", input)`.
- Lua cannot require `js`, `socket`, `io`, or run `os.execute`.
- Infinite loop times out without blocking the UI.

## Viewer Tests
- SVG viewer pans and zooms around the cursor.
- Cytoscape and Sigma selection remains visible.
- Mindmap cross-links draw to node borders.
- Mindmap cross-link labels can be dragged.
- Resource Browser previews bundled resources, copies text, and opens examples as editable copies.

## Security / Local-Only Checks
- Disconnect the network after loading; app workflows still work.
- Browser DevTools Network panel shows no required remote requests.
- `npm run test`, `npm run build`, `npm run verify:file`, and `npm run verify:security` pass.
