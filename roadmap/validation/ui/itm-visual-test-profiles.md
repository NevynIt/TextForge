# ITM Visual Test Profiles

Use these focused shell URLs after `corepack pnpm --filter @textforge/textforge-web preview` to exercise one renderer at a time.

## Standalone ITM surfaces

- `http://127.0.0.1:4173/?testProfile=itm-tree`
  Expected marker: `data-itm-projection="tree"` and `Capability roadmap`.
- `http://127.0.0.1:4173/?testProfile=itm-graph`
  Expected marker: `data-itm-projection="graph"` and `Connections`.
- `http://127.0.0.1:4173/?testProfile=itm-mindmap`
  Expected marker: `data-itm-projection="mindmap"` and `Capability roadmap`.
- `http://127.0.0.1:4173/?testProfile=itm-catalogue`
  Expected marker: `data-itm-projection="catalogue"` and `Entities`.
- `http://127.0.0.1:4173/?testProfile=itm-matrix`
  Expected marker: `data-itm-projection="matrix"` and `Source \ Target`.
- `http://127.0.0.1:4173/?testProfile=itm-report`
  Expected marker: `data-itm-projection="report"` and `Relation types`.

## Markdown preview profiles

- `http://127.0.0.1:4173/?testProfile=markdown-phase4`
  Expected marker: TF-MD preview with Mermaid and Graphviz output from the existing Phase 4 sample.
- `http://127.0.0.1:4173/?testProfile=itm-markdown-tree`
  Expected marker: `Tree smoke publication`.
- `http://127.0.0.1:4173/?testProfile=itm-markdown-graph`
  Expected marker: `Graph smoke publication`.
- `http://127.0.0.1:4173/?testProfile=itm-markdown-mindmap`
  Expected marker: `Mindmap smoke publication`.
- `http://127.0.0.1:4173/?testProfile=itm-markdown-report`
  Expected markers: `Catalogue smoke publication`, `Matrix smoke publication`, and `Report smoke publication`.

## Evidence produced by this pass

- `packages/itm/test/index.test.js` now mounts each package-owned ITM projection surface directly against `docs/examples/itm/test-profiles/itm-surface-smoke.itm`.
- `packages/markdown/test/index.test.js` now renders the focused Markdown smoke profiles incrementally, including the Graphviz-backed publication path.
- `apps/textforge-web/src/workbench.js` now supports `?testProfile=...` bootstrapping and defaults the sample document to the lighter Phase 4 Markdown fixture instead of the 33-diagram capability whitepaper.
