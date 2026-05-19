import type { PluginManifestEntry } from "../domain/types";

export const pluginManifest: PluginManifestEntry[] = [
  {
    id: "viewer-core",
    name: "Viewer Core",
    version: "0.1.0",
    contributionIds: [
      "html-viewer",
      "source-html-viewer",
      "tree-viewer",
      "table-viewer",
      "svg-viewer",
      "mindmap-viewer",
      "cytoscape-graph-viewer",
      "sigma-graph-viewer",
      "tree-visual-editor-skeleton",
      "graph-visual-editor-skeleton"
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
    load: () => import("./csvCore")
  },
  {
    id: "itt-core",
    name: "Indented Tree Core",
    version: "0.1.0",
    pipelines: [
      {
        id: "view-itt-tree",
        name: "ITT -> Tree Viewer",
        input: "text.indented-tree",
        steps: ["itt-to-tree", "tree-viewer"],
        category: "View"
      },
      {
        id: "view-itt-mindmap",
        name: "ITT -> Mind Map Viewer",
        input: "text.indented-tree",
        steps: ["itt-to-tree", "mindmap-viewer"],
        category: "View"
      },
      {
        id: "view-itt-cytoscape",
        name: "ITT -> Cytoscape Graph Viewer",
        input: "text.indented-tree",
        steps: ["itt-to-graph", "cytoscape-graph-viewer"],
        category: "View"
      },
      {
        id: "view-itt-sigma",
        name: "ITT -> Sigma/Graphology Viewer",
        input: "text.indented-tree",
        steps: ["itt-to-graph", "sigma-graph-viewer"],
        category: "View"
      },
      {
        id: "edit-itt-tree-skeleton",
        name: "ITT Visual Tree Editor Skeleton",
        input: "text.indented-tree",
        steps: ["itt-to-tree", "tree-visual-editor-skeleton"],
        category: "Edit"
      },
      {
        id: "edit-itt-graph-skeleton",
        name: "ITT Graph Editor Skeleton",
        input: "text.indented-tree",
        steps: ["itt-to-graph", "graph-visual-editor-skeleton"],
        category: "Edit"
      }
    ],
    contributionIds: ["itt-linter", "itt-to-tree", "itt-to-graph"],
    load: () => import("./ittCore")
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
    load: () => import("./diagramCore")
  }
];
