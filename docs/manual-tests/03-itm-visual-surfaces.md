# 03 ITM Visual Surfaces

## Release Smoke: ITM Surface Routing

What to test:

- `.itm` resources open through package-owned visual surfaces;
- source editor remains available;
- visual target routing works for raw models and declared views.

How:

1. Open `http://127.0.0.1:4173/?testProfile=itm-tree`.
2. Open the same resource with `Text editor`.
3. Run `Open visuals...`.
4. Select one or more available visual targets.
5. Open each target in the main area or popup area.

Expected:

- ITM tree surface renders a hierarchy with labels from the model;
- text source remains accessible and canonical;
- visual target picker groups raw model targets, views, and viewpoints where available;
- disabled targets include a diagnostic explanation;
- opening several targets creates separate tabs with useful titles.

## Tree, Graph, Mindmap, Catalogue, Matrix, And Report

What to test:

- each projection surface mounts and presents the same source model in a different shape.

How:

1. Open each URL:

```text
/?testProfile=itm-tree
/?testProfile=itm-graph
/?testProfile=itm-mindmap
/?testProfile=itm-catalogue
/?testProfile=itm-matrix
/?testProfile=itm-report
```

2. For each surface, inspect the first viewport and scroll if content exceeds the viewport.
3. Open the inspector.

Expected:

- tree shows parent/child structure;
- graph/network view shows nodes and relationships;
- mindmap shows a topic-oriented layout;
- catalogue lists entities in a scan-friendly way;
- matrix shows relationship or classification structure when present;
- report shows a readable model summary;
- inspector identifies the active resource and surface;
- empty sections are represented clearly, not as app failures.

## Embedded ITM In Markdown

What to test:

- Markdown files with embedded ITM blocks render ITM publications and projections.

How:

1. Open each URL:

```text
/?testProfile=itm-markdown-tree
/?testProfile=itm-markdown-graph
/?testProfile=itm-markdown-mindmap
/?testProfile=itm-markdown-report
```

2. Wait for Markdown preview completion.
3. Inspect generated ITM sections and diagnostics.

Expected:

- embedded ITM blocks are parsed;
- requested ITM projections render inside the Markdown preview;
- errors in one embedded model do not break the whole Markdown document;
- inspector generated-diagram or diagnostics counts are consistent with visible content.

## ITM Parser Diagnostics

What to test:

- malformed ITM reports diagnostics without breaking other surfaces.

How:

1. Create `/docs/bad-model.itm`.
2. Enter an intentionally problematic model, such as duplicate ids without an explicit overlay or a missing relationship target.
3. Open `ITM tree`, `ITM report`, and `Text editor`.
4. Inspect diagnostics.

Expected:

- source editor opens regardless of model validity;
- visual surfaces report parse or validation diagnostics;
- diagnostics identify the problem clearly enough for a user to correct it;
- no surface remains permanently stuck in a loading state.

## Visual Renderer Smoke

What to test:

- renderer-backed visual surfaces mount without blank canvases or broken controls.

How:

1. Open an ITM graph target that uses the Cytoscape-backed projection.
2. Open a target or fixture that uses the Sigma-backed renderer if available in the surface list.
3. Open a mindmap target that uses the jsMind-backed renderer if available.
4. Pan, zoom, select, or scroll using whatever controls the surface exposes.

Expected:

- canvases or SVG roots are nonblank;
- labels are readable;
- interaction does not move the whole app unexpectedly;
- resizing the main panel causes the renderer to fit the new viewport;
- renderer diagnostics are visible if the selected model cannot be projected.

## Viewpoint And View Target Resolution

What to test:

- `%viewpoint` and `%view` declarations resolve to the intended target and show useful errors when incomplete.

How:

1. Open a bundled ITM file with declared views or viewpoints.
2. Run `Open visuals...`.
3. Compare target labels and descriptions with the source declarations.
4. Open a valid view target.
5. Create a copy with a broken viewpoint reference and open visuals again.

Expected:

- valid target labels identify the view or viewpoint name;
- renderer-specific targets show the renderer they will use;
- missing viewpoint, missing renderer, or missing source-file cases are disabled or diagnostic-bearing;
- a broken target does not prevent valid targets in the same file from opening.

