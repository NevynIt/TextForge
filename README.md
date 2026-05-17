# TextForge

TextForge is a local-first text workbench for editing, visualising, and transforming structured text.

## Version 1

The first implementation is a static Preact + CodeMirror workbench with:

- multi-document tabs;
- broad text languages for plain text, Markdown, ITT, JSON, XML, CSV, Mermaid, Graphviz DOT, JavaScript, and Python;
- a plain JavaScript-shaped plugin API;
- lazy local plugin/runtime loading;
- pipeline actions that connect contributions by ID;
- popup-hosted viewers, diagnostics, plugin manager, and pipeline traces;
- IndexedDB persistence with localStorage fallback;
- no app-code network APIs and an extension CSP with `connect-src 'none'`.

The packaged V1 viewers include rendered HTML, read-only syntax-highlighted source HTML, SVG, table, tree, jsMind mind-map, Cytoscape graph, and Sigma/Graphology graph popups.

V1 document badges use deterministic one-layer [shapez.io viewer](https://viewer.shapez.io/) shape codes instead of colour/letter counters. Shape strings follow the shapez viewer format: four quadrants, starting in the upper-right and moving clockwise; each quadrant is a shape letter plus a colour letter, with no layer separator for these single-layer badges.

Viewer-specific style support is documented in:

- `docs/itt-tree-style-support.md`
- `docs/itt-mindmap-style-support.md`
- `docs/itt-graph-style-support.md`

ITT `%style` directives support the selector forms from the ITT whitepaper (`*`, `&id`, `[type]`, `#tag`, `{key=value}`, `->`, `->[type]`, and `=>`) and may be written on one line or as multiline blocks. ITT `%include` directives are resolved only against files currently open in the editor.

## Development

```powershell
npm install
npm run dev
npm run check
```

`npm run build` creates a file-openable static build in `dist/`. Open `dist/index.html` directly with `file://` to run without a server. The browser extension manifest is copied to `dist/manifest.json`.

`npm run build:module` keeps the regular Vite module/chunk build available for debugging, but the default production build is the local-file build.
