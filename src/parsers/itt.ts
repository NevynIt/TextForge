import type { Diagnostic, GraphModel, TreeNode } from "../domain/types";
import { sourceRange } from "./source";

interface StackItem {
  indent: number;
  node: TreeNode;
}

export function parseIndentedTree(text: string, languageId = "text.indented-tree"): { nodes: TreeNode[]; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const roots: TreeNode[] = [];
  const stack: StackItem[] = [];
  const idMap = new Map<string, TreeNode>();
  let previousNode: TreeNode | null = null;
  let previousDetailIndent: number | null = null;
  let offset = 0;
  let counter = 0;
  let inFrontMatter = false;

  for (const line of text.split(/\r?\n/)) {
    const rawLine = line;
    const trimmed = rawLine.trim();
    const lineStart = offset;
    offset += rawLine.length + 1;

    if (trimmed === "---" && !roots.length) {
      inFrontMatter = !inFrontMatter;
      continue;
    }
    if (inFrontMatter || !trimmed || trimmed.startsWith("%")) {
      continue;
    }
    if (rawLine.includes("\t")) {
      diagnostics.push({
        source: "itt-parser",
        severity: "warning",
        languageId,
        message: "Tabs in indentation are ambiguous; use spaces."
      });
    }

    const indent = rawLine.match(/^\s*/)?.[0].replaceAll("\t", "  ").length || 0;
    const content = rawLine.trimStart();
    if (content.startsWith("|")) {
      if (!previousNode) {
        diagnostics.push({
          source: "itt-parser",
          severity: "warning",
          languageId,
          message: "Detail block has no preceding node."
        });
        continue;
      }
      if (indent < findIndentForNode(stack, previousNode)) {
        diagnostics.push({
          source: "itt-parser",
          severity: "warning",
          languageId,
          message: "Detail block indentation is less than its node indentation."
        });
      }
      if (previousDetailIndent !== null && indent !== previousDetailIndent) {
        diagnostics.push({
          source: "itt-parser",
          severity: "warning",
          languageId,
          message: "Detail block indentation changed inside the same block."
        });
      }
      previousDetailIndent = indent;
      previousNode.details = [previousNode.details, content.slice(1).trimStart()].filter(Boolean).join("\n");
      continue;
    }

    previousDetailIndent = null;
    while (stack.length && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    if (indent > 0 && stack.length === 0 && roots.length === 0) {
      diagnostics.push({
        source: "itt-parser",
        severity: "warning",
        languageId,
        message: "First node is indented without a parent."
      });
    }

    const parsed = parseNodeContent(content);
    const node: TreeNode = {
      id: parsed.declaredId || `itt-${counter++}`,
      declaredId: parsed.declaredId,
      label: parsed.label || "(empty)",
      type: parsed.type,
      tags: parsed.tags,
      attributes: parsed.attributes,
      links: parsed.links,
      children: [],
      sourceRange: sourceRange(text, lineStart, lineStart + rawLine.length)
    };
    if (!parsed.label) {
      diagnostics.push({
        source: "itt-parser",
        severity: "warning",
        languageId,
        message: "Node label is empty.",
        range: node.sourceRange
      });
    }
    if (node.declaredId) {
      if (idMap.has(node.declaredId)) {
        diagnostics.push({
          source: "itt-parser",
          severity: "error",
          languageId,
          message: `Duplicate node id "${node.declaredId}".`,
          range: node.sourceRange
        });
      }
      idMap.set(node.declaredId, node);
    }

    if (stack.length) {
      stack[stack.length - 1].node.children.push(node);
    } else {
      roots.push(node);
    }
    stack.push({ indent, node });
    previousNode = node;
  }

  for (const node of flattenTree(roots)) {
    for (const link of node.links || []) {
      if (!idMap.has(link.target)) {
        diagnostics.push({
          source: "itt-parser",
          severity: "warning",
          languageId,
          message: `Unresolved link target "${link.target}".`,
          range: node.sourceRange
        });
      }
    }
  }

  return { nodes: roots, diagnostics };
}

export function indentedTreeToGraph(nodes: TreeNode[]): GraphModel {
  const graphNodes = new Map<string, GraphModel["nodes"][number]>();
  const edges: GraphModel["edges"] = [];

  function visit(node: TreeNode, parent: TreeNode | undefined, depth: number, rank: number): void {
    const attributes = node.attributes || {};
    graphNodes.set(node.id, {
      id: node.id,
      label: node.label,
      type: node.type || "node",
      color: styleColor(attributes, ["color", "background", "background-color", "backgroundColor", "bg", "fill"]),
      size: styleNumber(attributes, ["size", "node-size", "nodeSize"]),
      x: styleNumber(attributes, ["x"]),
      y: styleNumber(attributes, ["y"]),
      data: {
        depth,
        rank,
        tags: node.tags || [],
        attributes,
        declaredId: node.declaredId
      }
    });
    if (parent) {
      const edgeColor = styleColor(attributes, ["edge-color", "edgeColor", "line-color", "lineColor", "stroke"]);
      const edgeWidth = styleNumber(attributes, ["edge-width", "edgeWidth", "line-width", "lineWidth"]);
      edges.push({
        id: `hierarchy-${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        type: "hierarchy",
        label: "contains",
        color: edgeColor,
        width: edgeWidth
      });
    }
    for (const link of node.links || []) {
      const linkColor = link.color || styleColor(attributes, ["link-color", "linkColor", "line-color", "lineColor", "edge-color", "edgeColor"]);
      const linkWidth = link.width || styleNumber(attributes, ["link-width", "linkWidth", "line-width", "lineWidth", "edge-width", "edgeWidth"]);
      edges.push({
        id: `link-${node.id}-${link.target}-${edges.length}`,
        source: node.id,
        target: link.target,
        type: link.type || "related-to",
        label: link.type || "related-to",
        color: linkColor,
        width: linkWidth
      });
    }
    node.children.forEach((child, childIndex) => visit(child, node, depth + 1, childIndex));
  }

  nodes.forEach((node, index) => visit(node, undefined, 0, index));
  return { nodes: Array.from(graphNodes.values()), edges, directed: true };
}

function styleColor(attributes: Record<string, string>, keys: string[]): string | undefined {
  const value = firstAttribute(attributes, keys);
  return value && /^(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|[a-z]+)$/i.test(value) ? value : undefined;
}

function styleNumber(attributes: Record<string, string>, keys: string[]): number | undefined {
  const value = firstAttribute(attributes, keys);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstAttribute(attributes: Record<string, string>, keys: string[]): string | undefined {
  const normalized = new Map(Object.entries(attributes).map(([key, value]) => [key.toLowerCase(), value.trim()]));
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase());
    if (value) {
      return value;
    }
  }
  return undefined;
}

function parseNodeContent(content: string): {
  declaredId?: string;
  type?: string;
  label: string;
  tags: string[];
  attributes: Record<string, string>;
  links: NonNullable<TreeNode["links"]>;
} {
  let remaining = content.trim();
  const declaredIdMatch = /^&([A-Za-z][A-Za-z0-9_-]*)\s*/.exec(remaining);
  const declaredId = declaredIdMatch?.[1];
  if (declaredIdMatch) {
    remaining = remaining.slice(declaredIdMatch[0].length);
  }
  const typeMatch = /^\[([^\]]+)\]\s*/.exec(remaining);
  const type = typeMatch?.[1];
  if (typeMatch) {
    remaining = remaining.slice(typeMatch[0].length);
  }

  const links = parseLinks(remaining);
  if (links.raw) {
    remaining = remaining.slice(0, -links.raw.length).trimEnd();
  }
  const attrMatch = /\s+\{([^{}]+)\}\s*$/.exec(remaining);
  const attributes = attrMatch ? parseAttributes(attrMatch[1]) : {};
  if (attrMatch) {
    remaining = remaining.slice(0, attrMatch.index).trimEnd();
  }
  const tags: string[] = [];
  remaining = remaining.replace(/\s+#([A-Za-z][A-Za-z0-9_-]*)/g, (_match, tag: string) => {
    tags.push(tag);
    return "";
  });

  return {
    declaredId,
    type,
    label: remaining.trim(),
    tags,
    attributes,
    links: links.items
  };
}

function parseLinks(content: string): { raw: string; items: NonNullable<TreeNode["links"]> } {
  const match = /\s+(@[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z][A-Za-z0-9_-]*)?(?:\s*,\s*@[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z][A-Za-z0-9_-]*)?)*)\s*$/.exec(content);
  if (!match) {
    return { raw: "", items: [] };
  }
  const items = match[1].split(/\s*,\s*/).map((part) => {
    const value = part.slice(1);
    const [first, second] = value.split(":");
    return second ? { type: first, target: second } : { target: first };
  });
  return { raw: match[0], items };
}

function parseAttributes(text: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  text.split(",").forEach((pair) => {
    const [key, ...rest] = pair.split(":");
    if (key && rest.length) {
      attributes[key.trim()] = rest.join(":").trim();
    }
  });
  return attributes;
}

function findIndentForNode(stack: StackItem[], node: TreeNode): number {
  return stack.find((item) => item.node === node)?.indent ?? 0;
}

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}
