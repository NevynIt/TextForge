import type { GraphModel } from "../domain/types";

export function dotToGraph(text: string): GraphModel {
  const nodes = new Map<string, string>();
  const edges: GraphModel["edges"] = [];
  const directed = text.includes("digraph") || text.includes("->");
  const edgePattern = /"?([A-Za-z0-9_. -]+)"?\s*(--|->)\s*"?([A-Za-z0-9_. -]+)"?(?:\s*\[([^\]]+)\])?/g;
  let match: RegExpExecArray | null;

  while ((match = edgePattern.exec(text))) {
    const source = match[1].trim();
    const target = match[3].trim();
    nodes.set(source, source);
    nodes.set(target, target);
    edges.push({
      id: `edge-${edges.length + 1}`,
      source,
      target,
      type: match[2] === "->" ? "directed" : "undirected",
      label: extractLabel(match[4] || "")
    });
  }

  const nodePattern = /^\s*"?([A-Za-z0-9_. -]+)"?\s*(?:\[([^\]]+)\])?;/gm;
  while ((match = nodePattern.exec(text))) {
    const id = match[1].trim();
    if (!["graph", "digraph", "node", "edge"].includes(id)) {
      nodes.set(id, extractLabel(match[2] || "") || id);
    }
  }

  return {
    directed,
    nodes: Array.from(nodes.entries()).map(([id, label]) => ({ id, label, type: "dot-node" })),
    edges
  };
}

function extractLabel(attributes: string): string {
  const match = /label\s*=\s*"?([^",\]]+)/.exec(attributes);
  return match ? match[1].trim() : "";
}
