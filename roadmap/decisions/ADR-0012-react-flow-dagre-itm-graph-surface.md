# ADR-0012 - React Flow Dagre surface for ITM graphs

## Status

Proposed. Incorporated into the roadmap as candidate scope under `MOD-VISUAL-ITM-RENDERERS`, `WP-ITM-REACT-FLOW-DAGRE-01`, `R-VISUAL-MODELING-MVP`, and `A-040`.

## Date

2026-06-07

## Context

TextForge already separates canonical ITM semantics from generated visual outputs. ITM viewpoints define reusable projection pipelines, and ITM views store a concrete viewpoint instance with parameters, visual deltas, hidden elements, moved nodes, and renderer-specific options. This is the right abstraction for a reusable interactive graph surface rather than a separate dashboard-only configuration model.

Roadmap V20 also contains a dedicated Enterprise Architecture Viewer module whose first slice ports the existing EA Dashboard viewer. That module explicitly owns React Flow and Dagre graph runtime integration, plus timeline, detail-level, viewpoint, and filter controls. The EA Dashboard therefore provides a useful reference implementation, but its controls should not remain trapped in an EA-specific fixture viewer.

The ITM roadmap now includes parameterized ITM reports and dashboards (`ADR-0009`) and the interactive ITM exploration workbench (`ADR-0010`). A React Flow + Dagre graph surface should sit between those decisions:

- more interactive and controllable than static Mermaid/DOT/SVG projections;
- less domain-specific than the EA Dashboard exact port;
- reusable by ITM profiles, viewpoints, views, Markdown reports, and exploration sessions;
- compatible with the existing package-owned surface model.

The specific design goal is to make the good interaction pattern from the EA Dashboard - checkboxes, sliders, detail-level controls, timeline filters, and viewpoint switching - available as a generic ITM graph surface. Those controls should be declared by ITM profiles/viewpoints/views and bound to selectors, parameters, edge inclusion rules, style rules, layout settings, or pipeline options.

## Decision

Introduce a generic React Flow + Dagre based ITM graph surface as candidate workpackage `WP-ITM-REACT-FLOW-DAGRE-01`.

The new surface will render an effective ITM graph model using:

- React Flow for interactive node/edge display, pan/zoom, selection, minimap, controls, and future edit affordances;
- Dagre for deterministic directed graph layout;
- the existing ITM selector, style, viewpoint, view, parameter, and diagnostic contracts;
- local-only runtime dependencies compatible with TextForge CSP and package contribution rules.

The surface is not the canonical model. ITM remains the source of truth. React Flow nodes/edges are a renderer-specific view model generated from the effective ITM model and the selected `%view`.

## Roadmap mapping

Authoritative IDs and status live in `roadmap-state.yaml`.

- Module: `MOD-VISUAL-ITM-RENDERERS`
- Candidate release: `R-VISUAL-MODELING-MVP`
- Candidate workpackage: `WP-ITM-REACT-FLOW-DAGRE-01`
- Related modules: `MOD-ITM`, `MOD-SURFACES-UI`, `MOD-EA-VIEWER`
- Related workpackages: `WP-ITM-05`, `WP-ITM-EXPLORATION-01`, `WP-EA-VIEWER-01`, `WP-VITM-VDELTA-01`, `WP-GRAPH-EDIT-VITM`
- Roadmap incorporation event: `A-040`

`WP-EA-VIEWER-01` is a reference implementation source, not a blocking dependency. The candidate workpackage depends on the Visual ITM contract/resolver work and `WP-ITM-05` because this ADR reuses the parameter/control type direction for declarative viewpoint and view controls.

### Surface identity

Recommended contribution identity:

```text
@textforge/itm-reactflow-dagre
surface: itm.graph.reactflow.dagre
renderer: itm.renderer.reactflow-dagre
layout: itm.layout.dagre
```

The surface should be available through ordinary TextForge open-with behavior for compatible ITM graph visual targets.

### Relationship to EA Dashboard

The EA Dashboard port remains its own module and should stay an exact port first.

This ADR extracts the reusable interaction pattern, not the EA domain model:

| EA Dashboard concept | Generic ITM graph equivalent |
|---|---|
| viewpoint selector | `%view` / `%viewpoint` picker |
| level-of-detail slider | numeric or enum control bound to selector/style/layout options |
| timeline slider | date/number/enum control bound to node/edge attributes |
| checkboxes | boolean controls bound to selectors, edge types, tags, or style overlays |
| domain pages | profile-defined views over an ITM graph |
| architecture fixture JSON | effective ITM graph model |

### Viewpoint-level controls

Add an optional `controls` section to `%viewpoint`. A viewpoint declares available controls, their type, default, UI hints, and how they affect the projection.

Example:

```itm
%viewpoint itm::dagre_dependency_graph
{
  title: Dependency graph
  renderer: itm.graph.reactflow.dagre
  pipeline:
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
    - transform: graph.model
    - layout: dagre
    - render: reactflow

  controls:
    showHierarchy:
      type: boolean
      label: Show containment
      default: true
      affects:
        includeEdgesWhenTrue: "=>"

    showDependencies:
      type: boolean
      label: Show dependencies
      default: true
      affects:
        includeEdgesWhenTrue: "@depends_on:*"

    maxDepth:
      type: integer
      label: Depth
      default: 4
      min: 1
      max: 8
      step: 1
      affects:
        filter: "{depth <= ${value}}"

    detailLevel:
      type: enum
      label: Detail
      default: normal
      values:
        - compact
        - normal
        - full
      affects:
        rendererOption: nodeDetailLevel

    status:
      type: enum
      label: Status
      default: all
      values:
        - all
        - active
        - draft
        - closed
      affects:
        filterUnlessAll: "{status=${value}}"
}
```

### View-level control values

A `%view` may set control values for a specific instance. These values are view state, not semantic model facts.

```itm
%view current_dependency_graph
{
  viewpoint: itm::dagre_dependency_graph
  title: Current dependency graph
  controls:
    showHierarchy: true
    showDependencies: true
    maxDepth: 5
    detailLevel: normal
    status: active
  deltas:
    pinned:
      - node: payment_service
        x: 420
        y: 180
    hidden:
      - node: experimental_component
}
```

This mirrors existing `%view` responsibility for parameters, hidden elements, moved nodes, style overrides, and renderer-specific options.

### Control type contract

The v1 control type contract should reuse the `ADR-0009` parameter type contract where possible:

| Type | UI control | Purpose |
|---|---|---|
| `boolean` | checkbox | toggle node/edge families, overlays, labels, diagnostics, or hierarchy |
| `integer` | slider or numeric input | depth, rank distance, node spacing, timeline index, limit |
| `number` | slider or numeric input | zoom-dependent thresholds, weights, confidence, opacity |
| `enum` | dropdown, segmented control, radio group | detail mode, layout direction, status, layer, grouping mode |
| `selector` | selector field / picker | advanced filtering |
| `id` | id picker | focus node, root node, neighborhood center |
| `typeRef` | type picker | node type filtering |
| `relationshipTypeRef` | relationship type picker | edge family filtering |
| `date` | date slider/date picker | temporal graph filtering |
| `dateRange` | range slider/date range picker | timeline window filtering |

The first implementation should only require `boolean`, `integer`, `number`, `enum`, `selector`, `id`, and `relationshipTypeRef`. `date` and `dateRange` may be added when timeline metadata is normalized.

### Control binding model

A control does not execute arbitrary code. It is declarative and may affect only approved projection locations:

- selector filters;
- edge inclusion/exclusion selectors;
- style overlay selectors;
- renderer options;
- layout options;
- grouping/collapsing options;
- diagnostics visibility;
- focus/neighborhood expansion.

Unsupported bindings produce diagnostics and are ignored in tolerant mode.

Recommended binding keys:

```yaml
affects:
  filter: "[Component] AND NOT #draft"
  filterWhenTrue: "NOT #archived"
  includeEdges: "@depends_on:*"
  includeEdgesWhenTrue: "=>"
  excludeEdgesWhenFalse: "@experimental:*"
  styleWhenTrue:
    selector: "#critical"
    style:
      stroke-width: 3
  rendererOption: nodeDetailLevel
  layoutOption: rankdir
  focus: "${value}"
```

For v1, implement a small subset:

- `filter`
- `filterWhenTrue`
- `includeEdgesWhenTrue`
- `excludeEdgesWhenFalse`
- `rendererOption`
- `layoutOption`
- `focus`

### Dagre layout options

The surface should expose safe Dagre options through viewpoint defaults and view/control overrides:

```itm
%viewpoint itm::dagre_dependency_graph
{
  renderer: itm.graph.reactflow.dagre
  layout:
    engine: dagre
    rankdir: LR
    nodesep: 60
    ranksep: 120
    marginx: 40
    marginy: 40
}
```

Initial required layout options:

- `rankdir`: `TB`, `BT`, `LR`, `RL`;
- `nodesep`;
- `ranksep`;
- `marginx`;
- `marginy`.

Manual node movement should be captured as `%view` deltas, not as semantic ITM attributes. Future write-back may capture pinned positions, but semantic edits are out of scope for v1.

### Graph model input

The renderer consumes a normalized graph projection:

```ts
interface ItmGraphProjection {
  nodes: ItmGraphNode[];
  edges: ItmGraphEdge[];
  diagnostics: Diagnostic[];
  styles: ResolvedStyleSet;
  view: ResolvedItmView;
  controls: ResolvedControlModel;
}
```

React Flow-specific node and edge objects are derived inside the renderer package. They must not leak back as canonical ITM model objects.

### Styling

The renderer should consume resolved ITM styles first and direct visual attributes second.

It should support a minimal common style subset already used by the graph/mindmap renderers:

- node fill/background/color;
- node border/stroke;
- node size;
- edge/link color;
- edge/link width;
- basic shape mapping where React Flow node components support it.

Any unsupported style should produce an informational diagnostic rather than blocking rendering.

### Interaction scope for v1

V1 is interactive but read-only for semantic content:

- pan/zoom;
- fit view;
- select node/edge;
- inspect details;
- toggle controls;
- apply sliders/dropdowns;
- collapse/expand where supported by view deltas;
- focus on a selected node neighborhood;
- regenerate Dagre layout;
- optionally capture moved/pinned node positions as view deltas.

V1 does not create, rename, delete, or retype ITM nodes. It does not add semantic relationships. Those belong to later visual edit/write-back work.

### Diagnostics

The feature adds diagnostics for:

- unknown renderer id;
- missing React Flow Dagre capability;
- invalid control type;
- invalid control value;
- unsupported control binding;
- selector parse failure in a control binding;
- edge selector parse failure;
- unsupported Dagre option;
- view control value not declared by the viewpoint;
- style property unsupported by this renderer;
- layout failure;
- pinned/moved delta referencing a missing node.

Diagnostics should be visible both in the surface and in the existing diagnostics table.

## Consequences

### Positive

- The EA Dashboard interaction style becomes reusable across ITM profiles.
- ITM graph exploration gets a modern interactive surface without forcing every profile to build a custom dashboard.
- Checkboxes and sliders become declarative model/viewpoint/view configuration rather than hard-coded React state.
- The design aligns with parameterized ITM execution and the exploration workbench.
- React Flow provides a stronger base for future visual editing than static SVG renderers.
- Dagre gives deterministic layouts suitable for architecture, dependency, and process-like graphs.

### Negative / trade-offs

- React Flow adds another graph runtime alongside Cytoscape, Sigma, jsMind, Mermaid, and Graphviz.
- Dagre is good for directed layered graphs but not ideal for dense network analysis.
- Control bindings can become a second mini-language if not kept declarative and limited.
- Viewpoint authors need good diagnostics when controls do not match available model attributes.
- Visual state persistence must be carefully separated from semantic ITM write-back.

### Follow-up required

Roadmap incorporation follow-up is complete for candidate status:

- `ADR-0012` is registered in `roadmap-state.yaml`.
- `WP-ITM-REACT-FLOW-DAGRE-01` is registered under `MOD-VISUAL-ITM-RENDERERS`.
- `R-VISUAL-MODELING-MVP` includes the candidate workpackage.
- Relevant module, workpackage, validation checklist, generated view, dependency map, and RAPID artifacts are updated by `A-040`.

Open follow-up before implementation:

- Accept, revise, or reject this ADR before implementation starts.
- Define the `ResolvedControlModel` contract in the ITM/viewpoint package.
- Extend the ITM parser/model to preserve `controls` blocks on `%viewpoint` and `%view`.
- Add validation for control declarations, control values, and supported bindings.
- Implement the renderer package `@textforge/itm-reactflow-dagre`.
- Choose the browser-compatible Dagre import strategy. The current EA viewer avoids the browser-hostile Dagre CommonJS entry and uses `dagre-d3-es` internals.
- Add a sample ITM profile/viewpoint showing dependency, hierarchy, status, depth, and detail-level controls.
- Add manual and automated tests for control resolution, filtering, layout determinism, style mapping, diagnostics, and view-delta application.

## Scope

This decision applies to:

- Module: `MOD-VISUAL-ITM-RENDERERS`
- Related modules: `MOD-ITM`, `MOD-SURFACES-UI`, `MOD-EA-VIEWER`
- Candidate workpackage: `WP-ITM-REACT-FLOW-DAGRE-01`
- Related workpackages: `WP-ITM-05`, `WP-ITM-EXPLORATION-01`, `WP-EA-VIEWER-01`, `WP-VITM-VDELTA-01`, `WP-GRAPH-EDIT-VITM`
- Package: `@textforge/itm-reactflow-dagre`
- Surface contribution: `itm.graph.reactflow.dagre`

This ADR introduces a candidate reusable graph surface. It does not replace the EA Dashboard exact port, Cytoscape/Sigma/jsMind renderers, or future visual edit/write-back workpackages.

## References

- React Flow documentation: `https://reactflow.dev/`
- React Flow v12 migration and package rename to `@xyflow/react`: `https://reactflow.dev/learn/troubleshooting/migrate-to-v12`
- React Flow Dagre layout example: `https://reactflow.dev/examples/layout/dagre`
- Dagre project: `https://github.com/dagrejs/dagre`
- Current TextForge EA viewer package dependencies: `packages/ea-viewer/package.json`

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
