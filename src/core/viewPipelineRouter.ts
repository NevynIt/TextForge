import type { PipelineContribution, TextDocument } from "../domain/types";

const DEFAULT_PIPELINES: Record<string, string[]> = {
  "text.markdown": ["view-markdown-html", "view-markdown-heading-tree"],
  "text.itm": ["view-itm-tree", "view-itm-mindmap", "view-itm-cytoscape", "view-itm-sigma", "view-itm-inspector"],
  "text.json": ["view-json-tree"],
  "text.xml": ["view-xml-tree"],
  "text.bpmn": ["view-bpmn-diagram", "view-bpmn-svg"],
  "text.csv": ["view-csv-table"],
  "text.graphviz-dot": ["view-dot-svg", "view-dot-cytoscape", "view-dot-sigma"],
  "text.mermaid": ["view-mermaid-svg"]
};

export function preferredPipelineIdsForDocument(document: Pick<TextDocument, "languageId">): string[] {
  return DEFAULT_PIPELINES[document.languageId] || ["view-source-html"];
}

export function defaultPipelineIdForDocument(document: Pick<TextDocument, "languageId">): string {
  return preferredPipelineIdsForDocument(document)[0];
}

export function viewPipelinesForDocument(
  document: Pick<TextDocument, "languageId">,
  pipelines: PipelineContribution[]
): PipelineContribution[] {
  const preferred = preferredPipelineIdsForDocument(document);
  const byId = new Map(pipelines.map((pipeline) => [pipeline.id, pipeline]));
  return preferred.map((id) => byId.get(id)).filter(Boolean) as PipelineContribution[];
}
