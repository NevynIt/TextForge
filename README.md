# TextForge

TextForge is a local-first text workbench for editing, visualising, and transforming structured text.

## Version 1

The first implementation is a static Preact + CodeMirror workbench with:

- multi-document tabs;
- broad text languages for plain text, Markdown, ITT, JSON, XML, CSV/TSV, Mermaid, and Graphviz DOT;
- a plain JavaScript-shaped plugin API;
- lazy local plugin/runtime loading;
- pipeline actions that connect contributions by ID;
- popup-hosted viewers, diagnostics, plugin manager, and pipeline traces;
- IndexedDB persistence with localStorage fallback;
- no app-code network APIs and an extension CSP with `connect-src 'none'`.

## Development

```powershell
npm install
npm run dev
npm run check
```

`npm run build` creates a file-openable static build in `dist/` with relative asset paths. The browser extension manifest is copied to `dist/manifest.json`.
