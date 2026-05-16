import type { TextForgePlugin } from "../domain/types";

const htmlControls = [
  {
    id: "readingTheme",
    label: "Reading theme",
    type: "select" as const,
    defaultValue: "light",
    group: "Presentation",
    options: [
      { label: "Light", value: "light" },
      { label: "Sepia", value: "sepia" },
      { label: "Dark", value: "dark" }
    ]
  },
  {
    id: "contentWidth",
    label: "Content width",
    type: "select" as const,
    defaultValue: "normal",
    group: "Presentation",
    options: [
      { label: "Normal", value: "normal" },
      { label: "Wide", value: "wide" },
      { label: "Full", value: "full" }
    ]
  }
];

const svgControls = [
  {
    id: "svgBackground",
    label: "Background",
    type: "select" as const,
    defaultValue: "white",
    group: "Presentation",
    options: [
      { label: "White", value: "white" },
      { label: "Transparent", value: "transparent" },
      { label: "Checker", value: "checker" },
      { label: "Dark", value: "dark" }
    ]
  },
  {
    id: "fitMode",
    label: "Fit mode",
    type: "select" as const,
    defaultValue: "contain",
    group: "Presentation",
    options: [
      { label: "Contain", value: "contain" },
      { label: "Actual size", value: "actual" },
      { label: "Full width", value: "full" }
    ]
  }
];

const treeControls = [
  {
    id: "expandDepth",
    label: "Expand depth",
    type: "range" as const,
    defaultValue: 3,
    min: 0,
    max: 8,
    step: 1,
    group: "Structure"
  },
  {
    id: "depthLimit",
    label: "Depth limit",
    type: "range" as const,
    defaultValue: 0,
    min: 0,
    max: 12,
    step: 1,
    group: "Structure"
  },
  {
    id: "showDetails",
    label: "Show details",
    type: "boolean" as const,
    defaultValue: true,
    group: "Inspection"
  },
  {
    id: "density",
    label: "Density",
    type: "select" as const,
    defaultValue: "comfortable",
    group: "Presentation",
    options: [
      { label: "Comfortable", value: "comfortable" },
      { label: "Compact", value: "compact" }
    ]
  }
];

const tableControls = [
  {
    id: "sortColumn",
    label: "Sort column",
    type: "text" as const,
    defaultValue: "",
    group: "Table"
  },
  {
    id: "sortDirection",
    label: "Direction",
    type: "select" as const,
    defaultValue: "asc",
    group: "Table",
    options: [
      { label: "Ascending", value: "asc" },
      { label: "Descending", value: "desc" }
    ]
  },
  {
    id: "maxRows",
    label: "Max rows",
    type: "range" as const,
    defaultValue: 1000,
    min: 0,
    max: 5000,
    step: 50,
    group: "Table"
  }
];

const mindmapControls = [
  {
    id: "mindmapMode",
    label: "Mode",
    type: "select" as const,
    defaultValue: "full",
    group: "Layout",
    options: [
      { label: "Balanced", value: "full" },
      { label: "Right side", value: "side" }
    ]
  },
  {
    id: "initialDepth",
    label: "Initial depth",
    type: "select" as const,
    defaultValue: "depth2",
    group: "Layout",
    options: [
      { label: "Collapsed", value: "collapsed" },
      { label: "Depth 2", value: "depth2" },
      { label: "All", value: "all" }
    ]
  },
  {
    id: "mindmapTheme",
    label: "Theme",
    type: "select" as const,
    defaultValue: "textforge",
    group: "Presentation",
    options: [
      { label: "TextForge", value: "textforge" },
      { label: "Primary", value: "primary" },
      { label: "Greensea", value: "greensea" },
      { label: "Warning", value: "warning" }
    ]
  },
  {
    id: "textScale",
    label: "Text scale",
    type: "range" as const,
    defaultValue: 1,
    min: 0.7,
    max: 1.6,
    step: 0.1,
    group: "Presentation"
  }
];

const graphControls = [
  {
    id: "layout",
    label: "Layout",
    type: "select" as const,
    defaultValue: "breadthfirst",
    group: "Layout",
    options: [
      { label: "Breadth-first", value: "breadthfirst" },
      { label: "Circle", value: "circle" },
      { label: "Concentric", value: "concentric" },
      { label: "Grid", value: "grid" },
      { label: "Cose", value: "cose" },
      { label: "Random", value: "random" }
    ]
  },
  {
    id: "nodeSize",
    label: "Node size",
    type: "range" as const,
    defaultValue: 18,
    min: 6,
    max: 48,
    step: 1,
    group: "Node style"
  },
  {
    id: "layoutIterations",
    label: "Layout iterations",
    type: "range" as const,
    defaultValue: 120,
    min: 10,
    max: 500,
    step: 10,
    group: "Layout"
  },
  {
    id: "edgeWidth",
    label: "Edge width",
    type: "range" as const,
    defaultValue: 1.5,
    min: 0.5,
    max: 8,
    step: 0.5,
    group: "Edge style"
  },
  {
    id: "showLabels",
    label: "Show labels",
    type: "boolean" as const,
    defaultValue: true,
    group: "Labels"
  },
  {
    id: "labelMode",
    label: "Label mode",
    type: "select" as const,
    defaultValue: "auto",
    group: "Labels",
    options: [
      { label: "Auto", value: "auto" },
      { label: "All", value: "all" },
      { label: "None", value: "none" }
    ]
  },
  {
    id: "showEdgeLabels",
    label: "Show edge labels",
    type: "boolean" as const,
    defaultValue: false,
    group: "Labels"
  },
  {
    id: "filterToMatches",
    label: "Filter to search matches",
    type: "boolean" as const,
    defaultValue: false,
    group: "Filtering"
  },
  {
    id: "colorByType",
    label: "Colour by type",
    type: "boolean" as const,
    defaultValue: true,
    group: "Node style"
  },
  {
    id: "sizeMetric",
    label: "Size metric",
    type: "select" as const,
    defaultValue: "fixed",
    group: "Node style",
    options: [
      { label: "Fixed", value: "fixed" },
      { label: "Degree", value: "degree" },
      { label: "PageRank", value: "pagerank" }
    ]
  },
  {
    id: "focusNeighbors",
    label: "Focus selected neighbors",
    type: "boolean" as const,
    defaultValue: false,
    group: "Filtering"
  },
  {
    id: "performanceMode",
    label: "Performance mode",
    type: "select" as const,
    defaultValue: "balanced",
    group: "Performance",
    options: [
      { label: "Readable", value: "readable" },
      { label: "Balanced", value: "balanced" },
      { label: "Dense", value: "dense" }
    ]
  }
];

const plugin: TextForgePlugin = {
  id: "viewer-core",
  name: "Viewer Core",
  version: "0.1.0",
  viewers: [
    {
      kind: "viewer",
      id: "html-viewer",
      name: "HTML Viewer",
      input: "html",
      capabilities: { zoom: true, search: true },
      render(value) {
        if (value.kind !== "html") {
          throw new Error("HTML viewer requires HTML input.");
        }
        return {
          kind: "html",
          title: "HTML Viewer",
          html: value.html,
          capabilities: { zoom: true, search: true, export: true, presets: true },
          controls: htmlControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "tree-viewer",
      name: "Tree Viewer",
      input: "model.tree",
      capabilities: { zoom: true, search: true, fold: true, inspect: true },
      render(value) {
        if (value.kind !== "model" || value.modelType !== "model.tree") {
          throw new Error("Tree viewer requires tree model input.");
        }
        return {
          kind: "tree",
          title: "Tree Viewer",
          nodes: value.data,
          capabilities: { zoom: true, search: true, fold: true, inspect: true, export: true, presets: true },
          controls: treeControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "table-viewer",
      name: "Table Viewer",
      input: "model.table",
      capabilities: { zoom: true, search: true, filter: true, inspect: true },
      render(value) {
        if (value.kind !== "model" || value.modelType !== "model.table") {
          throw new Error("Table viewer requires table model input.");
        }
        return {
          kind: "table",
          title: "Table Viewer",
          table: value.data,
          capabilities: { zoom: true, search: true, filter: true, inspect: true, export: true, presets: true },
          controls: tableControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "svg-viewer",
      name: "SVG Viewer",
      input: "svg",
      capabilities: { zoom: true, pan: true, search: true },
      render(value) {
        if (value.kind !== "svg") {
          throw new Error("SVG viewer requires SVG input.");
        }
        return {
          kind: "svg",
          title: "SVG Viewer",
          svg: value.svg,
          capabilities: { zoom: true, pan: true, search: true, export: true, presets: true },
          controls: svgControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "mindmap-viewer",
      name: "Mind Map Viewer",
      input: "model.tree",
      capabilities: { zoom: true, pan: true, search: true, fold: true, inspect: true },
      render(value) {
        if (value.kind !== "model" || value.modelType !== "model.tree") {
          throw new Error("Mind-map viewer requires tree model input.");
        }
        return {
          kind: "mindmap",
          title: "Mind Map Viewer",
          nodes: value.data,
          capabilities: { zoom: true, pan: true, search: true, fold: true, inspect: true, export: true, presets: true },
          controls: mindmapControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "cytoscape-graph-viewer",
      name: "Cytoscape Graph Viewer",
      input: "model.graph",
      capabilities: { zoom: true, pan: true, search: true, filter: true, inspect: true },
      render(value) {
        if (value.kind !== "model" || value.modelType !== "model.graph") {
          throw new Error("Cytoscape viewer requires graph model input.");
        }
        return {
          kind: "graph",
          title: "Cytoscape Graph Viewer",
          graph: value.data,
          engine: "cytoscape",
          capabilities: { zoom: true, pan: true, search: true, filter: true, inspect: true, select: true, export: true, presets: true, tooltips: true },
          controls: graphControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "sigma-graph-viewer",
      name: "Sigma/Graphology Graph Viewer",
      input: "model.graph",
      capabilities: { zoom: true, pan: true, search: true, filter: true, inspect: true },
      render(value) {
        if (value.kind !== "model" || value.modelType !== "model.graph") {
          throw new Error("Sigma viewer requires graph model input.");
        }
        return {
          kind: "graph",
          title: "Sigma/Graphology Viewer",
          graph: value.data,
          engine: "sigma",
          capabilities: { zoom: true, pan: true, search: true, filter: true, inspect: true, select: true, export: true, presets: true, tooltips: true },
          controls: graphControls.map((control) =>
            control.id === "layout"
              ? {
                  ...control,
                  defaultValue: "forceatlas2",
                  options: [
                    { label: "ForceAtlas2", value: "forceatlas2" },
                    { label: "Noverlap", value: "noverlap" },
                    { label: "Circular", value: "circular" },
                    { label: "Random", value: "random" }
                  ]
                }
              : control.id === "sizeMetric"
                ? { ...control, defaultValue: "degree" }
                : control
          ),
          diagnostics: value.diagnostics
        };
      }
    }
  ],
  editors: [
    {
      kind: "editor",
      id: "tree-visual-editor-skeleton",
      name: "Visual Tree Editor Skeleton",
      input: "model.tree",
      create() {
        return {
          kind: "editor-skeleton",
          title: "Visual Tree Editor Skeleton",
          editorKind: "tree",
          message: "This V1 skeleton is source-bound and read-only. Tree write-back will use source patches in a later version.",
          capabilities: { zoom: true, search: true, inspect: true }
        };
      }
    },
    {
      kind: "editor",
      id: "graph-visual-editor-skeleton",
      name: "Graph Editor Skeleton",
      input: "model.graph",
      create() {
        return {
          kind: "editor-skeleton",
          title: "Graph Editor Skeleton",
          editorKind: "graph",
          message: "This V1 skeleton is source-bound and read-only. Graph write-back will use validated source patches in a later version.",
          capabilities: { zoom: true, pan: true, search: true, inspect: true }
        };
      }
    }
  ]
};

export default plugin;
