import type { TextForgePlugin } from "../domain/types";
import { escapeHtml } from "../parsers/source";

const viewBackgroundControl = {
  id: "viewerBackground",
  label: "Viewer background",
  type: "select" as const,
  defaultValue: "paper",
  group: "Presentation",
  options: [
    { label: "Paper", value: "paper" },
    { label: "White", value: "white" },
    { label: "Soft blue", value: "soft" },
    { label: "Dark", value: "dark" },
    { label: "Grid", value: "grid" }
  ]
};

const showArrowsControl = {
  id: "showArrows",
  label: "Show oriented arrows",
  type: "boolean" as const,
  defaultValue: true,
  group: "Edge style"
};

const showEdgeLabelsControl = {
  id: "showEdgeLabels",
  label: "Show edge labels",
  type: "boolean" as const,
  defaultValue: false,
  group: "Labels"
};

const concentricRingSpacingControl = {
  id: "concentricRingSpacing",
  label: "Concentric ring spacing",
  type: "number" as const,
  defaultValue: 1,
  group: "Layout",
  min: 0.5,
  max: 3,
  step: 0.1
};

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

const graphControls = [
  viewBackgroundControl,
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
    id: "showLabels",
    label: "Show labels",
    type: "boolean" as const,
    defaultValue: true,
    group: "Labels"
  },
  concentricRingSpacingControl,
  showEdgeLabelsControl,
  showArrowsControl,
  {
    id: "filterToMatches",
    label: "Filter to search matches",
    type: "boolean" as const,
    defaultValue: false,
    group: "Filtering"
  },
  {
    id: "focusNeighbors",
    label: "Focus selected neighbors",
    type: "boolean" as const,
    defaultValue: false,
    group: "Filtering"
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
      id: "source-html-viewer",
      name: "Highlighted Source Viewer",
      input: "text",
      capabilities: { zoom: true, search: true },
      render(value) {
        if (value.kind !== "text") {
          throw new Error("Highlighted source viewer requires text input.");
        }
        const fileName = value.fileName || value.languageId;
        return {
          kind: "html",
          title: "Highlighted Source",
          html: `<article class="source-viewer source-language-${safeClassName(value.languageId)}"><header><strong>${escapeHtml(fileName)}</strong><span>${escapeHtml(value.languageId)}</span></header><pre><code>${highlightSource(value.text, value.languageId)}</code></pre></article>`,
          capabilities: { zoom: true, search: true, export: true, presets: true },
          controls: htmlControls,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "viewer",
      id: "itm-inspector-viewer",
      name: "ITM Inspector",
      input: "model.itm",
      capabilities: { search: true, inspect: true },
      render(value) {
        if (value.kind !== "model" || value.modelType !== "model.itm") {
          throw new Error("ITM inspector requires ITM model input.");
        }
        const metadataEntries = Object.entries(value.document.metadata?.values || {});
        const inspectorHtml = [
          '<article class="itm-inspector">',
          '<header><strong>ITM Inspector</strong></header>',
          `<p>Entities: ${value.resolved.entities.length} | Relationships: ${value.resolved.relationships.length} | Styles: ${(value.document.styles || []).length} | Viewpoints: ${(value.document.viewpoints || []).length} | Views: ${(value.document.views || []).length}</p>`,
          metadataEntries.length
            ? `<section><h2>Metadata</h2><dl>${metadataEntries
                .map(([key, item]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(item))}</dd></div>`)
                .join("")}</dl></section>`
            : "",
          value.diagnostics?.length
            ? `<section><h2>Diagnostics</h2><ul>${value.diagnostics
                .map((diagnostic) => `<li><strong>${escapeHtml(diagnostic.severity)}</strong>: ${escapeHtml(diagnostic.message)}</li>`)
                .join("")}</ul></section>`
            : "",
          '<section><h2>Root entities</h2><ul>',
          value.resolved.entities
            .filter((entity) => !entity.parent)
            .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
            .map((entity) => `<li>${escapeHtml(entity.label || entity.id || entity.localId || entity.uid)}${entity.typeRef ? ` <span>${escapeHtml(entity.typeRef)}</span>` : ""}</li>`)
            .join(""),
          '</ul></section>',
          '</article>'
        ].join("");
        return {
          kind: "html",
          title: "ITM Inspector",
          html: inspectorHtml,
          capabilities: { search: true, inspect: true, export: true, presets: true },
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
          controls: [viewBackgroundControl],
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
          controls: [{ ...viewBackgroundControl, defaultValue: "grid" }, showArrowsControl, showEdgeLabelsControl],
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
          controls: graphControls.filter((control) => control.id !== "focusNeighbors"),
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
          controls: graphControls
            .filter((control) => control.id !== "concentricRingSpacing")
            .map((control) =>
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

interface HighlightRule {
  className: string;
  pattern: RegExp;
}

function highlightSource(text: string, languageId: string): string {
  if (languageId === "text.xml") {
    return highlightByRules(text, xmlRules);
  }
  if (languageId === "text.json") {
    return highlightByRules(text, jsonRules);
  }
  if (languageId === "text.javascript") {
    return highlightByRules(text, javascriptRules);
  }
  if (languageId === "text.python") {
    return highlightByRules(text, pythonRules);
  }
  if (languageId === "text.itm" || languageId === "text.indented-tree" || languageId === "text.itt") {
    return highlightByRules(text, ittRules);
  }
  if (languageId === "text.csv") {
    return highlightByRules(text, delimitedRules);
  }
  if (languageId === "text.markdown") {
    return highlightMarkdown(text);
  }
  if (languageId === "text.mermaid" || languageId === "text.graphviz-dot") {
    return highlightByRules(text, diagramRules);
  }
  return escapeHtml(text);
}

function highlightByRules(text: string, rules: HighlightRule[]): string {
  let output = "";
  let index = 0;
  while (index < text.length) {
    const rest = text.slice(index);
    const match = firstRuleMatch(rest, rules);
    if (match) {
      output += `<span class="source-token ${match.className}">${escapeHtml(match.value)}</span>`;
      index += match.value.length;
      continue;
    }
    output += escapeHtml(text[index]);
    index += 1;
  }
  return output;
}

function firstRuleMatch(text: string, rules: HighlightRule[]): { className: string; value: string } | null {
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (match?.index === 0 && match[0]) {
      return { className: rule.className, value: match[0] };
    }
  }
  return null;
}

function highlightMarkdown(text: string): string {
  let inFence = false;
  return text
    .split(/(\r?\n)/)
    .map((part) => {
      if (/^\r?\n$/.test(part)) {
        return part;
      }
      if (/^\s*```/.test(part)) {
        inFence = !inFence;
        return `<span class="source-token keyword">${escapeHtml(part)}</span>`;
      }
      if (inFence) {
        return `<span class="source-token string">${escapeHtml(part)}</span>`;
      }
      if (/^\s{0,3}#{1,6}\s/.test(part)) {
        return `<span class="source-token heading">${escapeHtml(part)}</span>`;
      }
      if (/^\s{0,3}[-*+]\s/.test(part) || /^\s{0,3}\d+\.\s/.test(part)) {
        return `<span class="source-token keyword">${escapeHtml(part)}</span>`;
      }
      return highlightByRules(part, markdownInlineRules);
    })
    .join("");
}

function safeClassName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "text";
}

const stringPattern = /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/;

const javascriptRules: HighlightRule[] = [
  { className: "comment", pattern: /\/\*[\s\S]*?\*\// },
  { className: "comment", pattern: /\/\/[^\n\r]*/ },
  { className: "string", pattern: /`(?:\\[\s\S]|[^`\\])*`/ },
  { className: "string", pattern: stringPattern },
  { className: "keyword", pattern: /\b(?:async|await|break|case|catch|class|const|continue|default|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|interface|let|new|of|return|set|static|switch|this|throw|try|type|var|while|yield)\b/ },
  { className: "literal", pattern: /\b(?:false|Infinity|NaN|null|true|undefined)\b/ },
  { className: "number", pattern: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/i }
];

const pythonRules: HighlightRule[] = [
  { className: "comment", pattern: /#[^\n\r]*/ },
  { className: "string", pattern: /"""[\s\S]*?"""|'''[\s\S]*?'''/ },
  { className: "string", pattern: stringPattern },
  { className: "keyword", pattern: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/ },
  { className: "literal", pattern: /\b(?:False|None|True)\b/ },
  { className: "number", pattern: /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i }
];

const jsonRules: HighlightRule[] = [
  { className: "attribute", pattern: /"(?:\\[\s\S]|[^"\\])*"(?=\s*:)/ },
  { className: "string", pattern: /"(?:\\[\s\S]|[^"\\])*"/ },
  { className: "literal", pattern: /\b(?:false|null|true)\b/ },
  { className: "number", pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i }
];

const xmlRules: HighlightRule[] = [
  { className: "comment", pattern: /<!--[\s\S]*?-->/ },
  { className: "keyword", pattern: /<\/?[A-Za-z_][\w:.-]*/ },
  { className: "attribute", pattern: /\b[A-Za-z_:][\w:.-]*(?=\s*=)/ },
  { className: "string", pattern: stringPattern },
  { className: "keyword", pattern: /\/?>/ }
];

const ittRules: HighlightRule[] = [
  { className: "comment", pattern: /[|%][^\n\r]*/ },
  { className: "atom", pattern: /&[A-Za-z][A-Za-z0-9_-]*/ },
  { className: "keyword", pattern: /\[[^\]\n\r]+\]/ },
  { className: "link", pattern: /@[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z][A-Za-z0-9_-]*)?/ },
  { className: "tag", pattern: /#[A-Za-z][A-Za-z0-9_-]*/ },
  { className: "attribute", pattern: /[A-Za-z_][A-Za-z0-9_.-]*(?=\s*:)/ },
  { className: "string", pattern: stringPattern },
  { className: "number", pattern: /\b\d+(?:\.\d+)?(?:px|em|rem|%)?\b/ }
];

const delimitedRules: HighlightRule[] = [
  { className: "string", pattern: /"(?:""|[^"])*"/ },
  { className: "keyword", pattern: /,|\t|;|\|/ }
];

const diagramRules: HighlightRule[] = [
  { className: "comment", pattern: /\/\/[^\n\r]*/ },
  { className: "keyword", pattern: /\b(?:classDiagram|digraph|erDiagram|flowchart|graph|sequenceDiagram|stateDiagram|subgraph)\b/ },
  { className: "literal", pattern: /-->|---|->|--|\{|\}|\[|\]/ },
  { className: "string", pattern: stringPattern }
];

const markdownInlineRules: HighlightRule[] = [
  { className: "link", pattern: /\[[^\]]+\]\([^)]+\)/ },
  { className: "string", pattern: /`[^`\n\r]+`/ },
  { className: "keyword", pattern: /\*\*[^*\n\r]+\*\*|__[^_\n\r]+__/ },
  { className: "literal", pattern: /\*[^*\n\r]+\*|_[^_\n\r]+_/ }
];
