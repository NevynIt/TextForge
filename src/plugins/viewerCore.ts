import type { TextForgePlugin } from "../domain/types";

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
    id: "showEdgeLabels",
    label: "Show edge labels",
    type: "boolean" as const,
    defaultValue: false,
    group: "Labels"
  },
  {
    id: "colorByType",
    label: "Colour by type",
    type: "boolean" as const,
    defaultValue: true,
    group: "Node style"
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
          capabilities: { zoom: true, search: true },
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
          capabilities: { zoom: true, search: true, fold: true, inspect: true },
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
          capabilities: { zoom: true, search: true, filter: true, inspect: true },
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
          capabilities: { zoom: true, pan: true, search: true },
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
          capabilities: { zoom: true, pan: true, search: true, fold: true, inspect: true },
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
            control.id === "layout" ? { ...control, defaultValue: "circle" } : control
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
