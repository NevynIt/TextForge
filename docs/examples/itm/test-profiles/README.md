# ITM Test Profiles

These fixtures are intentionally small. They exist to let the shell and package tests exercise one renderer or projection mode at a time instead of routing every check through the large bundled whitepaper.

Recommended shell URLs after `corepack pnpm --filter @textforge/textforge-web preview`:

- `http://127.0.0.1:4173/?testProfile=markdown-phase4`
- `http://127.0.0.1:4173/?testProfile=itm-tree`
- `http://127.0.0.1:4173/?testProfile=itm-graph`
- `http://127.0.0.1:4173/?testProfile=itm-mindmap`
- `http://127.0.0.1:4173/?testProfile=itm-catalogue`
- `http://127.0.0.1:4173/?testProfile=itm-matrix`
- `http://127.0.0.1:4173/?testProfile=itm-report`
- `http://127.0.0.1:4173/?testProfile=itm-markdown-tree`
- `http://127.0.0.1:4173/?testProfile=itm-markdown-graph`
- `http://127.0.0.1:4173/?testProfile=itm-markdown-mindmap`
- `http://127.0.0.1:4173/?testProfile=itm-markdown-report`

Fixtures:

- `itm-surface-smoke.itm` is the shared `.itm` model for the package-owned ITM projection surfaces.
- `itm-markdown-tree.md` checks the Markdown preview path with a single tree publication block.
- `itm-markdown-graph.md` checks the Markdown preview path with a single graph publication block and Graphviz export.
- `itm-markdown-mindmap.md` checks the Markdown preview path with a single mindmap publication block.
- `itm-markdown-report.md` checks catalogue, matrix, and report publication output in one narrow document.
