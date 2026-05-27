# WP-ITM-VISUALS Validation Checklist

## Scope

`WP-ITM-VISUALS` validates the shared ITM visual-projection base on top of the validated `WP-ITM-01` parser/model wrapper and `WP-05C` contribution/pipeline execution path.

The delivered slice must expose stable projection data for tree, graph, mindmap, catalogue, matrix, and report fragments through the public `@textforge/itm` package API, keep those projections package-owned rather than app-shell-owned, and let Markdown `itm-pub` blocks render projection-aware publication output without bypassing the existing contribution or pipeline seams.

`WP-ITM-VISUALS` does not close BPMN-specific visual editing, ArchiMate-specific visual editing, or the later report-generation pipeline. Those remain `WP-BPMN-VISUAL`, `WP-ARCHIMATE-VISUAL`, and `WP-MD-REPORT`.

## Required checks

- `projectItmDocument(...)` returns explicit tree, graph, mindmap, catalogue, matrix, and report projections in addition to the baseline canonical graph selection output.
- Graph and mindmap adapters are available from the public package surface as Graphviz DOT and Mermaid mindmap source strings without introducing shell-private formatting rules.
- Tree, catalogue, matrix, and report projections stay renderable through package-owned HTML helpers so downstream packages can consume them without copying projection logic into the app shell.
- Markdown `itm-pub` blocks can request projection modes deterministically and continue to resolve the selected source model through the existing shared-state publication flow.
- Graph projections can reuse the active diagram pipeline when available and emit generated SVG/PNG workspace descriptors through the existing Markdown generated-resource flow.
- Bundled example content exists for manual or future shell validation of the projection modes.

## Validation evidence

- `corepack pnpm --filter @textforge/itm test`
- `corepack pnpm --filter @textforge/itm build`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter @textforge/textforge-web build`
- `corepack pnpm roadmap:dependency-map`
- `corepack pnpm verify`

## Notes

- The initial graph projection uses package-generated Graphviz source plus the existing diagram pipeline rather than introducing a new interactive graph runtime inside `@textforge/itm`.
- The initial mindmap projection exposes public Mermaid-mindmap source and package-owned HTML rendering so the phase delivers reusable projection contracts now without blocking on a dedicated viewer library decision.
- `WP-TABLES` still owns richer table UX. `WP-ITM-VISUALS` only needs to provide the model-side catalogue and matrix projection data plus basic publication rendering.
