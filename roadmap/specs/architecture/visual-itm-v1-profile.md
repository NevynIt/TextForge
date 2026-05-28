# Visual ITM Profile v1

## Latest status

`WP-VITM-01` now has a concrete v1 profile draft for implementation.

This document defines the minimum Visual ITM contract to use for the V19a runtime recovery chain before any renderer package is implemented.

## Purpose

Visual ITM is the renderer-facing visual interchange/profile for TextForge.

It exists so TextForge can:

- resolve `%view`, `%viewpoint`, or explicit raw-model visual targets once;
- produce one constrained visual document shape;
- hand that shape to Cytoscape, jsMind, Sigma, Mermaid, Graphviz, BPMN, or later translators without making renderer packages parse arbitrary ITM text;
- keep runtime surfaces and `itm-pub` blocks aligned on the same target-resolution and provenance rules.

## Package boundary

Visual ITM v1 should live in a dedicated package:

- `@textforge/visual-itm`

That package owns:

- the v1 document and item types;
- profile validation helpers;
- shared provenance and diagnostic conventions;
- example documents and fixture definitions;
- generic translation helpers that do not belong to a specific renderer runtime.

It does not own:

- ITM parsing, `%view`, `%viewpoint`, `%require`, `%package`, or repository resolution;
- runtime renderer surface mounting;
- visual editing or write-back;
- BPMN-specific semantics.

`@textforge/itm` remains authoritative for source ITM parsing, resolving, semantics, and target extraction. Renderer packages consume validated Visual ITM output.

## Design constraints

Visual ITM v1 is intentionally minimal.

It must cover only what the first runtime recovery and dashboard slices need:

- nodes;
- edges;
- hierarchy/containment;
- labels;
- types/classes/tags;
- styles;
- source provenance;
- view/viewpoint provenance;
- layout hints;
- renderer metadata;
- diagnostics.

It must not absorb early scope for:

- visual editing operations;
- creating or persisting new view deltas;
- consuming declared view-delta behavior in the first recovery slice;
- bidirectional live source-to-visual selection mirroring;
- BPMN-specific semantics;
- advanced Sigma-only metrics;
- automated loss-profile machinery.

Declared view-delta consumption and live bidirectional sync belong in later dedicated workpackages: `WP-VITM-VDELTA-01` and `WP-VITM-LIVE-SYNC-01`.

## Renderer conventions

Visual ITM uses the same renderer syntax family as the native ITM `render:` step.

Rules:

1. If Visual ITM is derived from ITM, the source target's existing `render:` step remains the source of truth. Visual ITM carries derived renderer metadata as a resolved snapshot for downstream consumers.
2. If Visual ITM exists on its own or is manually authored, there is no upstream authoritative source. In that case, the renderer metadata carried by the Visual ITM document is the local truth for that resource.
3. Visual ITM must not invent a second competing renderer declaration model for derived ITM targets.

All renderers share one contribution/registry model. A renderer may be used by interactive surfaces, `itm-pub` dashboards, exports, or any combination of those, depending on the capabilities it declares.

## v1 document shape

The v1 profile should be represented as one document object containing items plus shared metadata.

Illustrative shape:

```ts
type VisualItmV1Document = {
  format: "textforge.visual-itm/v1";
  origin: {
    mode: "derived-itm" | "standalone" | "translated";
    sourceResource?: string;
    sourceHash?: string;
    derivedTarget?: {
      kind: "raw-model" | "viewpoint" | "view";
      id?: string;
      viewpointId?: string;
    };
  };
  renderer?: {
    value?: string;
    source: "derived" | "local";
    hints?: Record<string, string | number | boolean>;
  };
  diagnostics?: VisualItmV1Diagnostic[];
  nodes: VisualItmV1Node[];
  edges: VisualItmV1Edge[];
};

type VisualItmV1Node = {
  id: string;
  label?: string;
  kind?: string;
  classes?: string[];
  tags?: string[];
  parentId?: string;
  style?: Record<string, string | number | boolean>;
  layout?: Record<string, string | number | boolean>;
  provenance?: VisualItmV1Provenance[];
};

type VisualItmV1Edge = {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  kind?: string;
  classes?: string[];
  tags?: string[];
  style?: Record<string, string | number | boolean>;
  layout?: Record<string, string | number | boolean>;
  provenance?: VisualItmV1Provenance[];
};

type VisualItmV1Provenance = {
  sourceKind: "model-item" | "viewpoint" | "view" | "translated";
  sourceId?: string;
  sourcePath?: string;
  sourceRange?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
};

type VisualItmV1Diagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  subjectId?: string;
  provenance?: VisualItmV1Provenance[];
};
```

This is a contract shape, not an instruction to front-load heavy schema enforcement.

## Required semantics

### Nodes

Nodes are the primary visual entities.

They must support:

- stable IDs within the Visual ITM document;
- an optional label;
- optional type/kind metadata;
- optional classes/tags;
- optional parent relationship for hierarchy or containment;
- optional style and layout hints;
- provenance back to source items.

### Edges

Edges connect nodes.

They must support:

- stable IDs;
- source and target node IDs;
- optional label;
- optional type/kind metadata;
- optional classes/tags;
- optional style and layout hints;
- provenance back to source items.

### Hierarchy and containment

Hierarchy is represented minimally through `parentId` on nodes.

This supports:

- tree and mindmap structures;
- nested groups or containers when a renderer supports them;
- later extensions without forcing a separate v1 container grammar.

### Style and layout hints

Style and layout remain hints, not guaranteed renderer behavior.

Common keys may include values such as:

- `shape`
- `fill`
- `stroke`
- `lineStyle`
- `direction`
- `rank`
- `order`
- `x`
- `y`

Renderer-specific keys must be optional and namespaced, for example:

- `cytoscape.curveStyle`
- `jsmind.side`
- `sigma.nodeSize`
- `mermaid.direction`

### Provenance

Every renderer-facing item that participates in search, diagnostics, or source navigation must carry enough provenance to map back to the originating source target or translated input.

Minimum provenance expectations:

- a stable source item ID when one exists;
- source kind (`model-item`, `viewpoint`, `view`, or `translated`);
- source path/resource when available;
- source range when available.

### Diagnostics

Visual ITM may carry diagnostics produced during target resolution or translation.

Examples:

- missing declared renderer;
- unsupported renderer capability;
- unresolved source target reference;
- lossy translator warning;
- filtered-out reference that leaves an orphan edge.

## Shared renderer registry model

Visual ITM v1 assumes one shared renderer registry/contribution model.

The registry does not split renderers into separate runtime-only or publication-only families.

Instead, each renderer declares the capabilities it supports, such as:

- interactive navigation;
- visual-to-source selection/navigation;
- dashboard output;
- export;
- delta capture;
- standalone preview.

This allows Mermaid, Graphviz, Cytoscape, jsMind, Sigma, and later BPMN-oriented renderers to remain peers while still advertising different concrete behavior.

## Minimum parity expectations supported by the profile

Visual ITM v1 must support the first runtime parity slice well enough that each renderer can at minimum:

- render the resolved target;
- preserve stable provenance IDs for visual items;
- support visual-to-source navigation or reveal behavior;
- expose diagnostics tied to source/backtrace information.

Live source-to-visual selection mirroring is explicitly later work.

## Example A — derived graph target

```json
{
  "format": "textforge.visual-itm/v1",
  "origin": {
    "mode": "derived-itm",
    "sourceResource": "/docs/examples/itm/party.itm",
    "derivedTarget": {
      "kind": "view",
      "id": "party-graph",
      "viewpointId": "graph-default"
    }
  },
  "renderer": {
    "value": "cytoscape",
    "source": "derived",
    "hints": {
      "cytoscape.layout": "cose"
    }
  },
  "nodes": [
    {
      "id": "guest.alice",
      "label": "Alice",
      "kind": "actor",
      "classes": ["guest"],
      "provenance": [
        {
          "sourceKind": "model-item",
          "sourceId": "guest.alice",
          "sourcePath": "/docs/examples/itm/party.itm"
        }
      ]
    },
    {
      "id": "item.cake",
      "label": "Cake",
      "kind": "thing",
      "classes": ["supply"],
      "provenance": [
        {
          "sourceKind": "model-item",
          "sourceId": "item.cake",
          "sourcePath": "/docs/examples/itm/party.itm"
        }
      ]
    }
  ],
  "edges": [
    {
      "id": "brings.alice.cake",
      "sourceId": "guest.alice",
      "targetId": "item.cake",
      "label": "brings",
      "kind": "relation",
      "provenance": [
        {
          "sourceKind": "model-item",
          "sourceId": "brings.alice.cake",
          "sourcePath": "/docs/examples/itm/party.itm"
        }
      ]
    }
  ]
}
```

## Example B — standalone mindmap target

```json
{
  "format": "textforge.visual-itm/v1",
  "origin": {
    "mode": "standalone",
    "sourceResource": "/workspace/visuals/party-plan.visual-itm.json"
  },
  "renderer": {
    "value": "jsmind",
    "source": "local",
    "hints": {
      "jsmind.layout": "side"
    }
  },
  "nodes": [
    {
      "id": "root",
      "label": "Party",
      "kind": "topic"
    },
    {
      "id": "food",
      "label": "Food",
      "kind": "topic",
      "parentId": "root"
    },
    {
      "id": "games",
      "label": "Games",
      "kind": "topic",
      "parentId": "root"
    }
  ],
  "edges": []
}
```

This second example shows the standalone/manual-authoring rule: the document's own renderer metadata is authoritative because there is no upstream ITM `render:` source.

## Initial fixture set

The first accepted fixture set is:

1. one derived graph Visual ITM document;
2. one derived tree or mindmap Visual ITM document;
3. one standalone/manual-authored Visual ITM document;
4. one missing-renderer diagnostic case;
5. one `itm-pub` parity case proving the same target resolves to the same Visual ITM shape class.

These fixtures may be stored as JSON examples or equivalent test resources when implementation begins. They do not need a separate schema bureaucracy first.

## Acceptance criteria for `WP-VITM-01`

`WP-VITM-01` is ready to implement when all of the following are true:

- the package boundary is fixed to `@textforge/visual-itm`;
- the v1 document shape is concrete enough for tests and renderer inputs;
- derived-vs-standalone renderer precedence is documented;
- the shared renderer registry model is documented;
- at least one graph example and one tree or mindmap example are defined;
- fixture expectations are specified;
- exclusions for delta consumption, editing, BPMN semantics, and bidirectional live sync are explicit.

## Extension discipline

Extensions remain allowed, but only under the following guidance:

- prove the need with a real renderer or translator requirement;
- prefer generic fields before renderer-specific ones;
- namespace renderer-specific keys;
- keep extensions optional;
- add examples when extending the profile.

This is a roadmap/spec discipline rule, not a mandate to front-load strict runtime schema enforcement.