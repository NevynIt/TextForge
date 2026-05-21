import type { PluginManifestEntry } from "../domain/types";

export const pluginManifest: PluginManifestEntry[] = [
  {
    id: "viewer-core",
    name: "Viewer Core",
    version: "0.1.0",
    contributionIds: [
      "html-viewer",
      "source-html-viewer",
      "itm-inspector-viewer",
      "itm-tree-viewer",
      "itm-mindmap-viewer",
      "itm-cytoscape-viewer",
      "itm-sigma-viewer",
      "tree-viewer",
      "table-viewer",
      "svg-viewer",
      "mindmap-viewer",
      "cytoscape-graph-viewer",
      "sigma-graph-viewer",
      "tree-visual-editor-skeleton",
      "graph-visual-editor-skeleton"
    ],
    contributions: [
      { id: "html-viewer", kind: "viewer" },
      { id: "source-html-viewer", kind: "viewer" },
      { id: "itm-inspector-viewer", kind: "viewer" },
      { id: "itm-tree-viewer", kind: "viewer" },
      { id: "itm-mindmap-viewer", kind: "viewer" },
      { id: "itm-cytoscape-viewer", kind: "viewer" },
      { id: "itm-sigma-viewer", kind: "viewer" },
      { id: "tree-viewer", kind: "viewer" },
      { id: "table-viewer", kind: "viewer" },
      { id: "svg-viewer", kind: "viewer" },
      { id: "mindmap-viewer", kind: "viewer" },
      { id: "cytoscape-graph-viewer", kind: "viewer" },
      { id: "sigma-graph-viewer", kind: "viewer" },
      { id: "tree-visual-editor-skeleton", kind: "editor" },
      { id: "graph-visual-editor-skeleton", kind: "editor" }
    ],
    pipelines: [
      {
        id: "view-source-html",
        name: "Source -> Highlighted HTML",
        input: "text",
        steps: ["source-html-viewer"],
        category: "View"
      }
    ],
    load: () => import("./viewerCore")
  },
  {
    id: "markdown-core",
    name: "Markdown Core",
    version: "0.1.0",
    languages: [
      {
        id: "text.markdown",
        name: "Markdown",
        parentId: "text",
        extensions: [".md", ".markdown"],
        mediaType: "text/markdown"
      }
    ],
    pipelines: [
      {
        id: "view-markdown-html",
        name: "Markdown -> HTML Viewer",
        input: "text.markdown",
        steps: ["markdown-to-html", "html-viewer"],
        category: "View"
      },
      {
        id: "view-markdown-heading-tree",
        name: "Markdown -> Heading Tree",
        input: "text.markdown",
        steps: ["markdown-heading-tree", "tree-viewer"],
        category: "View"
      }
    ],
    contributionIds: ["markdown-to-html", "markdown-heading-tree"],
    contributions: [
      { id: "markdown-to-html", kind: "transformer" },
      { id: "markdown-heading-tree", kind: "transformer" }
    ],
    load: () => import("./markdownCore")
  },
  {
    id: "json-core",
    name: "JSON Core",
    version: "0.1.0",
    pipelines: [
      {
        id: "view-json-tree",
        name: "JSON -> Tree Viewer",
        input: "text.json",
        steps: ["json-to-tree", "tree-viewer"],
        category: "View"
      }
    ],
    contributionIds: ["json-linter", "json-to-tree"],
    contributions: [
      { id: "json-linter", kind: "linter" },
      { id: "json-to-tree", kind: "transformer" }
    ],
    load: () => import("./jsonCore")
  },
  {
    id: "xml-core",
    name: "XML Core",
    version: "0.1.0",
    pipelines: [
      {
        id: "view-xml-tree",
        name: "XML -> Tree Viewer",
        input: "text.xml",
        steps: ["xml-to-tree", "tree-viewer"],
        category: "View"
      }
    ],
    contributionIds: ["xml-linter", "xml-to-tree"],
    contributions: [
      { id: "xml-linter", kind: "linter" },
      { id: "xml-to-tree", kind: "transformer" }
    ],
    load: () => import("./xmlCore")
  },
  {
    id: "bpmn-core",
    name: "BPMN Core",
    version: "0.1.0",
    languages: [
      {
        id: "text.bpmn",
        name: "BPMN 2.0 XML",
        parentId: "text.xml",
        extensions: [".bpmn"],
        mediaType: "application/xml",
        aliases: ["bpmn"]
      }
    ],
    pipelines: [
      {
        id: "view-bpmn-diagram",
        name: "BPMN 2.0 XML -> BPMN Viewer",
        input: "text.bpmn",
        steps: ["bpmn-viewer"],
        category: "View"
      },
      {
        id: "view-bpmn-svg",
        name: "BPMN 2.0 XML -> SVG Viewer",
        input: "text.bpmn",
        steps: ["bpmn-to-svg", "svg-viewer"],
        category: "View"
      }
    ],
    contributionIds: ["bpmn-viewer", "bpmn-to-svg"],
    contributions: [
      { id: "bpmn-viewer", kind: "viewer" },
      { id: "bpmn-to-svg", kind: "transformer" }
    ],
    load: () => import("./bpmnCore")
  },
  {
    id: "csv-core",
    name: "Delimited Text Core",
    version: "0.1.0",
    pipelines: [
      {
        id: "view-csv-table",
        name: "Delimited Text -> Table Viewer",
        input: "text.csv",
        steps: ["delimited-to-table", "table-viewer"],
        category: "View"
      }
    ],
    contributionIds: ["delimited-linter", "delimited-to-table"],
    contributions: [
      { id: "delimited-linter", kind: "linter" },
      { id: "delimited-to-table", kind: "transformer" }
    ],
    load: () => import("./csvCore")
  },
  {
    id: "itm-core",
    name: "Indented Text Model Core",
    version: "0.1.0",
    pipelines: [
      {
        id: "view-itm-inspector",
        name: "ITM -> Inspector",
        input: "text.itm",
        steps: ["itm-parse", "itm-inspector-viewer"],
        category: "View"
      },
      {
        id: "view-itm-tree",
        name: "ITM -> Tree Viewer",
        input: "text.itm",
        steps: ["itm-parse", "itm-tree-viewer"],
        category: "View"
      },
      {
        id: "view-itm-mindmap",
        name: "ITM -> Mind Map Viewer",
        input: "text.itm",
        steps: ["itm-parse", "itm-mindmap-viewer"],
        category: "View"
      },
      {
        id: "view-itm-cytoscape",
        name: "ITM -> Cytoscape Graph Viewer",
        input: "text.itm",
        steps: ["itm-parse", "itm-cytoscape-viewer"],
        category: "View"
      },
      {
        id: "view-itm-sigma",
        name: "ITM -> Sigma/Graphology Viewer",
        input: "text.itm",
        steps: ["itm-parse", "itm-sigma-viewer"],
        category: "View"
      },
      {
        id: "edit-itm-tree-skeleton",
        name: "ITM Visual Tree Editor Skeleton",
        input: "text.itm",
        steps: ["itm-to-tree", "tree-visual-editor-skeleton"],
        category: "Edit"
      },
      {
        id: "edit-itm-graph-skeleton",
        name: "ITM Graph Editor Skeleton",
        input: "text.itm",
        steps: ["itm-to-graph", "graph-visual-editor-skeleton"],
        category: "Edit"
      }
    ],
    contributionIds: ["itm-linter", "itm-parse", "itm-to-tree", "itm-to-graph"],
    contributions: [
      { id: "itm-linter", kind: "linter" },
      { id: "itm-parse", kind: "transformer" },
      { id: "itm-to-tree", kind: "transformer" },
      { id: "itm-to-graph", kind: "transformer" }
    ],
    load: () => import("./itmCore")
  },
  {
    id: "diagram-core",
    name: "Diagram Core",
    version: "0.1.0",
    pipelines: [
      {
        id: "view-mermaid-svg",
        name: "Mermaid -> SVG Viewer",
        input: "text.mermaid",
        steps: ["mermaid-to-svg", "svg-viewer"],
        category: "View"
      },
      {
        id: "view-dot-svg",
        name: "Graphviz DOT -> SVG Viewer",
        input: "text.graphviz-dot",
        steps: ["graphviz-dot-to-svg", "svg-viewer"],
        category: "View"
      },
      {
        id: "view-dot-cytoscape",
        name: "Graphviz DOT -> Cytoscape Viewer",
        input: "text.graphviz-dot",
        steps: ["graphviz-dot-to-graph", "cytoscape-graph-viewer"],
        category: "View"
      },
      {
        id: "view-dot-sigma",
        name: "Graphviz DOT -> Sigma/Graphology Viewer",
        input: "text.graphviz-dot",
        steps: ["graphviz-dot-to-graph", "sigma-graph-viewer"],
        category: "View"
      },
      {
        id: "edit-dot-graph-skeleton",
        name: "DOT Graph Editor Skeleton",
        input: "text.graphviz-dot",
        steps: ["graphviz-dot-to-graph", "graph-visual-editor-skeleton"],
        category: "Edit"
      }
    ],
    contributionIds: ["mermaid-to-svg", "graphviz-dot-to-svg", "graphviz-dot-to-graph"],
    contributions: [
      { id: "mermaid-to-svg", kind: "transformer" },
      { id: "graphviz-dot-to-svg", kind: "transformer" },
      { id: "graphviz-dot-to-graph", kind: "transformer" }
    ],
    load: () => import("./diagramCore")
  }
];
