# ITM Visual Renderer Equivalence Assessment

Date: 2026-05-27

## Purpose

This paper compares:

- the current rewrite baseline on `rewrite/v2-monorepo`
- the older implementation on `main`

for the ITM visual renderers based on:

- Cytoscape
- Sigma + Graphology
- jsMind

It records what exists in each branch, what is missing today, and what would be required to reach at least equivalent functionality in the new architecture.

## Executive summary

The current baseline is not functionally equivalent to the old implementation.

The current branch does have legitimate `@textforge/itm` value in:

- tree projection data
- catalogue projection data
- matrix projection data
- report projection data
- Graphviz source generation
- Mermaid mindmap source generation
- Markdown publication support

But the current branch does not have equivalent graph or mindmap viewers.

The main branch implemented real interactive graph and mindmap runtimes:

- `src/components/viewers.tsx`
- `src/plugins/viewerCore.ts`
- `src/plugins/manifest.ts`
- `src/core/viewPipelineRouter.ts`
- `src/viewers/itm/itmViewModel.ts`

By contrast, the rewrite branch currently implements graph and mindmap mostly as static publication output:

- `packages/itm/src/index.js`
- `packages/diagrams/package.json`
- `packages/itm/package.json`

The result is a semantic mismatch:

- the current `graph` view is not a graph runtime; it is an HTML report over nodes and edges
- the current `mindmap` view is not a jsMind-style mindmap runtime; it is a styled tree publication

So the gap is not cosmetic. It is architectural and functional.

## What the old `main` branch implemented

### Dependency baseline

The old app-level package installed the expected viewer runtimes directly in `main:package.json`:

- `cytoscape`
- `graphology`
- `graphology-layout`
- `graphology-layout-forceatlas2`
- `graphology-layout-noverlap`
- `graphology-metrics`
- `jsmind`
- `sigma`

Those dependencies were not aspirational. They were actually used by the viewer code.

### Pipeline and viewer registration

The old branch treated the visual renderers as real pipeline/viewer endpoints.

From `main:src/core/viewPipelineRouter.ts`:

- `text.itm` preferred pipelines included `view-itm-tree`, `view-itm-mindmap`, `view-itm-cytoscape`, `view-itm-sigma`, and `view-itm-inspector`
- `text.graphviz-dot` preferred pipelines included `view-dot-cytoscape` and `view-dot-sigma`

From `main:src/plugins/manifest.ts`:

- `view-itm-cytoscape` ran `itm-parse -> itm-cytoscape-viewer`
- `view-itm-sigma` ran `itm-parse -> itm-sigma-viewer`
- `view-itm-mindmap` ran `itm-parse -> itm-mindmap-viewer`
- `view-dot-cytoscape` ran `graphviz-dot-to-graph -> cytoscape-graph-viewer`
- `view-dot-sigma` ran `graphviz-dot-to-graph -> sigma-graph-viewer`

This matters because the old system did not reduce visual engines to exported static artifacts. It opened them as first-class interactive viewers.

### ITM graph model adaptation

`main:src/viewers/itm/itmViewModel.ts` built a real graph view model from resolved ITM content.

It preserved:

- entity IDs
- labels
- types
- tags/classes
- descriptions/details
- source ranges
- style attributes
- containment edges
- explicit relationship edges
- relationship style/attribute data
- per-node metadata such as depth and rank

This gave the renderers enough structured data to do more than draw a picture. They could inspect, select, search, style, and route back to source.

### jsMind mindmap renderer

`main:src/components/viewers.tsx` used `jsMind` as an actual runtime, not as a format export.

Implemented behavior included:

- true mindmap layout via `jsMind`
- zoom
- pan
- fit
- center
- fold all
- unfold all
- initial expansion modes such as collapsed and depth-2
- search match navigation
- active-match centering
- ctrl/cmd-click source navigation
- source-selection sync from the editor into the mindmap
- node scaling
- theme selection
- background presets
- overlay rendering for cross-links, arrows, and optional edge labels

This is qualitatively different from a nested HTML list.

### Cytoscape graph renderer

`main:src/components/viewers.tsx` dynamically imported `cytoscape` and mounted a real graph canvas.

Implemented behavior included:

- actual graph layout, not list rendering
- layouts including breadth-first, circle, concentric, grid, random, and cose
- rerun-layout toolbar action
- zoom and pan
- selectable nodes and edges
- inspector details for selected items
- node and edge style mapping from ITM attributes
- label toggles
- edge-label toggles
- arrow toggles
- search highlighting
- active-match centering
- source-range navigation with ctrl/cmd-click
- source-selection sync from the editor into the graph
- static fallback only when the runtime failed

This was an interactive graph viewer.

### Sigma + Graphology graph renderer

`main:src/components/viewers.tsx` also implemented a separate Sigma runtime backed by Graphology.

Implemented behavior included:

- real graph rendering through Sigma
- Graphology graph creation from ITM data
- layouts including ForceAtlas2, Noverlap, Circular, and Random
- layout iteration control
- node dragging
- search highlighting
- filter-to-matches mode
- focus-neighbors mode
- size metrics including degree and pagerank
- label-density and label-mode behavior
- performance modes such as readable vs dense
- source-range navigation and source-selection sync
- node/edge inspector state
- edge arrows and labels

This was not redundant with Cytoscape. It delivered a different performance and interaction profile for denser graphs.

## What the current rewrite baseline implements

### Dependency baseline

The rewrite branch does not currently install the old graph and mindmap runtimes in the relevant packages.

`packages/diagrams/package.json` currently depends on:

- `@viz-js/viz`
- `mermaid`

and does not depend on:

- `cytoscape`
- `graphology`
- `sigma`
- `jsmind`

`packages/itm/package.json` also does not carry those dependencies.

So the expected interactive runtimes are not present in the rewrite baseline.

### Current projection model

The current branch extends `projectItmDocument(...)` in `packages/itm/src/index.js` with:

- `tree`
- `graph`
- `mindmap`
- `catalogue`
- `matrix`
- `report`

This is useful, especially for catalogue, matrix, and report generation.

It also exports:

- `createItmGraphvizDiagramSource(...)`
- `createItmMermaidMindmapSource(...)`

Those are adapters to text formats. They are not runtime viewers.

### Current graph rendering

The current `renderGraphProjection(...)` in `packages/itm/src/index.js` renders:

- a grid of node cards
- a list of relationships

That is a publication/report surface, not a graph surface.

Even when Markdown `itm-pub` uses the diagram pipeline, the result is:

- Graphviz SVG generation
- optional PNG generation

That gives a static diagram artifact, not a Cytoscape or Sigma interaction model.

### Current mindmap rendering

The current `renderMindmapProjection(...)` in `packages/itm/src/index.js` renders:

- a root card
- nested branch lists

That is a tree-like publication with mindmap-themed styling.

It is not equivalent to jsMind behavior because it does not provide:

- actual mindmap layout engine behavior
- folding runtime
- viewport pan/zoom
- fit/center actions
- search-state navigation
- source-selection sync
- cross-link overlays

### Current `.itm` surfaces

The current rewrite branch now has package-owned `.itm` surfaces in `packages/itm/src/index.js`:

- `@textforge/itm/tree`
- `@textforge/itm/graph`
- `@textforge/itm/mindmap`
- `@textforge/itm/catalogue`
- `@textforge/itm/matrix`
- `@textforge/itm/report`

However, these surfaces are currently thin wrappers around `parseDocument(...)`, `projectItmDocument(...)`, and `renderProjectedModel(...)`.

That means:

- tree is still a static package-owned publication
- graph is still a static report-like publication
- mindmap is still a static tree-like publication
- catalogue, matrix, and report are static publications, which is appropriate

These surfaces improve test isolation, but they do not provide old-renderer equivalence.

### Current workbench integration

The current app shell in `apps/textforge-web/src/workbench.js` can now bootstrap focused test profiles and open those surfaces.

That is useful for validation discipline.

But the shell still does not host:

- Cytoscape runtime surfaces
- Sigma runtime surfaces
- jsMind runtime surfaces
- graph toolbar behavior equivalent to the old app
- graph/mindmap source-selection sync behavior equivalent to the old app

## Functional gap analysis

### Catalogue, matrix, report

Current state:

- meaningful and defensible
- package-owned output is appropriate
- this work belongs naturally in `@textforge/itm`

Gap to old branch:

- not the main problem
- these outputs are new-value projections rather than regressions

Assessment:

- keep

### Tree

Current state:

- valid as a package-owned publication and projection

Gap to old branch:

- less interactive than old tree/mindmap viewers
- weaker source-selection behavior in the visual surface layer

Assessment:

- acceptable as a baseline projection
- not equivalent to the old richer visual runtime

### Mindmap

Current state:

- projection exists
- Mermaid mindmap source export exists
- HTML publication exists

Missing versus old jsMind renderer:

- real mindmap runtime
- fold/unfold behavior
- zoom/pan/fit/center
- search navigation
- source-range navigation
- source-selection sync
- cross-link overlay rendering
- theme/runtime controls

Assessment:

- current implementation is not a mindmap renderer
- it is a publication flavor over tree-shaped data

### Graph

Current state:

- projection exists
- Graphviz source export exists
- Graphviz SVG artifact generation exists
- HTML publication exists

Missing versus old Cytoscape/Sigma renderers:

- interactive graph canvas
- multiple layout engines
- node dragging
- focus-neighbors behavior
- filter-to-matches behavior
- performance modes
- sizing metrics
- selection-driven inspector behavior
- source-range navigation
- source-selection sync
- runtime label density control
- runtime edge rendering control

Assessment:

- current implementation is not a graph viewer
- it is either a static SVG artifact or a report over graph data

## Architectural mismatch

The old branch was app-centric. The rewrite branch is package-centric.

So equivalent functionality should not be recreated by copying old `viewers.tsx` logic into `@textforge/itm`.

The correct package split for parity is roughly:

- `@textforge/itm`
  Purpose: parse, resolve, validate, project, and adapt ITM model data
- `@textforge/diagrams`
  Purpose: own Cytoscape, Sigma/Graphology, jsMind, Graphviz, Mermaid, and related runtime viewer adapters
- `@textforge/surfaces`
  Purpose: register and route surface contracts
- `apps/textforge-web`
  Purpose: host the surfaces and wire shell controls, selection, inspector, and search state

The current rewrite branch conflates publication output with runtime visualization for graph and mindmap.

That is the main design error.

## What is required for at least equivalent functionality

### 1. Restore the renderer dependencies

At minimum the new baseline needs the same runtime family that the old branch actually used:

- `cytoscape`
- `graphology`
- `graphology-layout`
- `graphology-layout-forceatlas2`
- `graphology-layout-noverlap`
- `graphology-metrics`
- `sigma`
- `jsmind`

These should most likely live under `@textforge/diagrams`, not `@textforge/itm`.

### 2. Define stable intermediate models

The rewrite branch needs public intermediate contracts equivalent in spirit to the old app’s internal models:

- ITM -> graph view model
- ITM -> jsMind-compatible mindmap model
- graph model -> Cytoscape elements
- graph model -> Graphology graph

Those adapters must preserve:

- source ranges
- styles
- tags/classes
- node and edge metadata
- containment and explicit relationships
- details/description text

`@textforge/itm` should own the ITM-side projection/adaptation contracts.

### 3. Reintroduce true renderer surfaces

The rewrite branch needs real surfaces, not only publication HTML:

- `@textforge/diagrams/itm-cytoscape`
- `@textforge/diagrams/itm-sigma`
- `@textforge/diagrams/itm-jsmind`

Or equivalent names under the new contribution model.

These surfaces should open against:

- `.itm` resources
- graph intermediate values
- possibly generated model resources later

### 4. Port the old interaction model

At least equivalent functionality means restoring these behavior classes:

- zoom and pan
- rerun layout
- fit/center
- fold/unfold for mindmaps
- search highlighting
- match navigation
- selection inspector
- ctrl/cmd-click jump-to-source
- source-selection sync from editor to viewer
- source-derived highlighting in the viewer

Without these, the new baseline may have valid generated diagrams, but it still does not have equivalent renderers.

### 5. Port the graph controls

Equivalent graph surfaces need at least:

- layout selection
- show labels
- show edge labels
- show arrows
- filter to matches
- focus neighbors
- node-size control
- edge-width control
- performance-mode control
- label-mode control
- layout-iteration control where applicable

The old Cytoscape and Sigma surfaces did not expose identical controls, but both were genuinely controllable runtimes.

### 6. Port the mindmap-specific features

Equivalent jsMind functionality needs:

- full or side layout mode
- initial expansion depth behavior
- theme selection
- background selection
- node scale control
- fit and center actions
- fold all and unfold all actions
- cross-link arrows
- optional cross-link labels

### 7. Reintroduce proper shell wiring

The new surface host must support the same integration class the old popup viewer host provided:

- toolbar actions
- inspector state
- viewer settings persistence per session
- search-state reporting
- source-selection handoff from editor
- open-with selection across multiple visual engines

The current static `.itm` surfaces do not satisfy this.

### 8. Test the real runtimes

Equivalent functionality cannot be validated only with static HTML assertions.

The new baseline needs tests at three levels:

- adapter tests
  Verify ITM -> graph/mindmap model conversion and style/source-range preservation.
- runtime mount tests
  Verify Cytoscape, Sigma, and jsMind surfaces mount and expose basic behavior.
- browser smoke tests
  Verify search, selection, source navigation, zoom, and layout/fold actions in the real shell.

The current focused test profiles are useful, but they are only a scaffolding layer until the real runtimes exist.

## Recommended implementation shape

### Keep in `@textforge/itm`

- parse/resolve/validate logic
- projection data
- catalogue/matrix/report rendering
- graph and mindmap intermediate adapters
- Graphviz and Mermaid source export helpers

### Move or add in `@textforge/diagrams`

- Cytoscape runtime viewer
- Sigma/Graphology runtime viewer
- jsMind runtime viewer
- graph control definitions
- graph and mindmap surface implementations

### Keep in the shell only

- session-level search state
- surface toolbar dispatch
- open-with routing
- source-selection propagation between editor and viewer surfaces

## Minimum parity sequence

If the goal is “at least equivalent functionality,” the shortest honest path is:

1. Reintroduce `cytoscape`, `sigma`, `graphology`, and `jsmind` in the new package layout.
2. Build `@textforge/itm` adapters that preserve source-range and style metadata.
3. Implement Cytoscape surface first.
   Reason: it covers the clearest graph-view regression with less complexity than Sigma.
4. Implement jsMind surface second.
   Reason: the current mindmap output is the most obviously non-equivalent.
5. Implement Sigma/Graphology surface third.
   Reason: it is the richest and most specialized graph runtime, especially for denser graphs.
6. Keep catalogue, matrix, and report where they are.
   Reason: they are legitimate package-owned publication outputs and should not block renderer parity.

## Final assessment

The rewrite branch currently has:

- good projection work for catalogue, matrix, and report
- acceptable package-level projection data contracts
- useful static export adapters for Graphviz and Mermaid

But it does not currently have renderer equivalence with the old branch for Cytoscape, Sigma/Graphology, or jsMind.

The old branch had real interactive runtimes with real viewer behavior.

The rewrite branch currently has:

- static HTML graph publication
- static HTML mindmap publication
- static SVG generation for graph output

That is materially less capable.

So the correct conclusion is:

- the current graph and mindmap work should not be considered equivalent replacements
- catalogue, matrix, and report should be retained
- graph and mindmap parity requires reinstating the actual viewer runtimes and porting the interaction model into the new package/surface architecture
