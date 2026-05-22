import { parseDocumentResult, parseDocumentResultAsync, resolveDocument, type ItmAttributeBag, type ItmDiagnostic, type ItmDocument, type ItmEntity, type ItmRelationship, type ItmSourceRange, type ItmSourceProvider, type ResolvedItmDocument, type ResolvedItmEntity, type ResolvedItmRelationship } from "@textforge/itm";
import type { Diagnostic, GraphEdge, GraphModel, ItmPipelineValue, TextDocument, TreeNode } from "../domain/types";
import { sourceRange } from "./source";

export interface IttStyleRule {
  selector: string;
  declarations: Record<string, string>;
  target: "node" | "cross-link" | "hierarchy-edge";
}

export interface ParseIndentedTreeOptions {
  currentDocumentId?: string;
  currentFileName?: string;
  includeDocuments?: TextDocument[];
}

export function parseItmValue(
  text: string,
  languageId = "text.itm",
  options: ParseIndentedTreeOptions = {}
): ItmPipelineValue {
  const parsed = parseDocumentResult(text, {
    uri: options.currentFileName,
    strict: false
  });
  const resolved = resolveDocument(parsed.value);
  const diagnostics = parsed.diagnostics.map((diagnostic) => toTextForgeDiagnostic(diagnostic, text, languageId, options.currentDocumentId));

  return {
    kind: "model",
    modelType: "model.itm",
    document: parsed.value,
    resolved,
    diagnostics,
    itmDiagnostics: parsed.diagnostics,
    source: {
      languageId,
      fileName: options.currentFileName,
      documentId: options.currentDocumentId,
      text
    }
  };
}

export async function parseItmValueAsync(
  text: string,
  languageId = "text.itm",
  options: ParseIndentedTreeOptions = {}
): Promise<ItmPipelineValue> {
  const parsed = await parseDocumentResultAsync(text, {
    uri: options.currentFileName,
    strict: false,
    sourceProvider: createWorkspaceItmSourceProvider(options.includeDocuments || [])
  });
  const resolved = resolveDocument(parsed.value);
  const diagnostics = parsed.diagnostics.map((diagnostic) => toTextForgeDiagnostic(diagnostic, text, languageId, options.currentDocumentId));

  return {
    kind: "model",
    modelType: "model.itm",
    document: parsed.value,
    resolved,
    diagnostics,
    itmDiagnostics: parsed.diagnostics,
    source: {
      languageId,
      fileName: options.currentFileName,
      documentId: options.currentDocumentId,
      text
    }
  };
}

export function parseIndentedTree(
  text: string,
  languageId = "text.itm",
  options: ParseIndentedTreeOptions = {}
): { nodes: TreeNode[]; diagnostics: Diagnostic[]; styleRules: IttStyleRule[] } {
  const parsed = parseItmValue(text, languageId, options);
  const styleRules = collectStyleRules(parsed.document);
  const roots = sortEntities(parsed.resolved.entities.filter((entity) => !entity.parent)).map((entity) => itmEntityToTreeNode(entity, text));
  const diagnostics = parsed.diagnostics || [];

  applyTreeStyles(roots, styleRules);
  if (roots[0]) {
    Object.defineProperty(roots[0], "__itmStyleRules", {
      value: styleRules,
      enumerable: false,
      configurable: true
    });
  }

  return { nodes: roots, diagnostics, styleRules };
}

export async function parseIndentedTreeAsync(
  text: string,
  languageId = "text.itm",
  options: ParseIndentedTreeOptions = {}
): Promise<{ nodes: TreeNode[]; diagnostics: Diagnostic[]; styleRules: IttStyleRule[] }> {
  const parsed = await parseItmValueAsync(text, languageId, options);
  const styleRules = collectStyleRules(parsed.document);
  const roots = sortEntities(parsed.resolved.entities.filter((entity) => !entity.parent)).map((entity) => itmEntityToTreeNode(entity, text));
  const diagnostics = parsed.diagnostics || [];

  applyTreeStyles(roots, styleRules);
  if (roots[0]) {
    Object.defineProperty(roots[0], "__itmStyleRules", {
      value: styleRules,
      enumerable: false,
      configurable: true
    });
  }

  return { nodes: roots, diagnostics, styleRules };
}

function createWorkspaceItmSourceProvider(documents: TextDocument[]): ItmSourceProvider {
  return {
    read(request) {
      const normalizedTarget = normalizeIncludeKey(request.target);
      const targetBase = normalizeIncludeKey(baseName(request.target));
      const document = documents.find((candidate) => {
        const keys = documentIncludeKeys(candidate);
        return keys.includes(normalizedTarget) || keys.includes(targetBase);
      });

      if (!document) {
        return undefined;
      }

      return {
        uri: document.path || document.fileName,
        text: document.text
      };
    }
  };
}

export function indentedTreeToGraph(nodes: TreeNode[]): GraphModel {
  const graphNodes = new Map<string, GraphModel["nodes"][number]>();
  const edges: GraphModel["edges"] = [];
  const styleRules = collectTreeStyleRules(nodes);

  function visit(node: TreeNode, parent: TreeNode | undefined, depth: number, rank: number): void {
    const attributes = node.attributes || {};
    const style = effectiveStyle(node);
    graphNodes.set(node.id, {
      id: node.id,
      label: node.label,
      type: node.type || "node",
      classes: node.tags || [],
      color: styleColor(style, NODE_FILL_KEYS) || styleColor(attributes, ["color"]),
      size: styleNumber(style, NODE_SIZE_KEYS),
      x: styleNumber(style, ["x"]),
      y: styleNumber(style, ["y"]),
      style,
      details: node.details,
      sourceRange: node.sourceRange,
      data: {
        depth,
        rank,
        tags: node.tags || [],
        attributes,
        declaredId: node.declaredId,
        details: node.details,
        style
      }
    });
    if (parent) {
      const hierarchyStyle = {
        ...edgeStyleForRules(styleRules, "hierarchy-edge"),
        ...legacyHierarchyEdgeStyle(attributes)
      };
      edges.push({
        id: `hierarchy-${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        type: "hierarchy",
        label: "contains",
        sourceRange: node.sourceRange,
        color: styleColor(hierarchyStyle, EDGE_COLOR_KEYS),
        width: styleNumber(hierarchyStyle, EDGE_WIDTH_KEYS),
        style: hierarchyStyle
      });
    }
    for (const link of node.links || []) {
      const linkStyle = {
        ...edgeStyleForRules(styleRules, "cross-link", link.type),
        ...(link.style || {}),
        ...legacyCrossLinkStyle(attributes)
      };
      edges.push({
        id: `link-${node.id}-${link.target}-${edges.length}`,
        source: node.id,
        target: link.target,
        type: link.type || "related-to",
        label: link.type || "related-to",
        sourceRange: link.sourceRange || node.sourceRange,
        color: link.color || styleColor(linkStyle, EDGE_COLOR_KEYS),
        width: link.width || styleNumber(linkStyle, EDGE_WIDTH_KEYS),
        style: linkStyle
      });
    }
    node.children.forEach((child, childIndex) => visit(child, node, depth + 1, childIndex));
  }

  nodes.forEach((node, index) => visit(node, undefined, 0, index));
  return { nodes: Array.from(graphNodes.values()), edges, directed: true, graph: { attrs: { itmStyleRules: styleRules } } };
}

function collectStyleRules(document: ItmDocument): IttStyleRule[] {
  return (document.styles || []).map((style, index) => ({
    selector: style.selector.raw,
    declarations: stringifyAttributeBag(style.style) || {},
    target: selectorTarget(style.selector.raw)
  })).filter((rule) => Object.keys(rule.declarations).length > 0);
}

function itmEntityToTreeNode(entity: ResolvedItmEntity, text: string): TreeNode {
  const source = toTextForgeSourceRange(entity.sourceRange, text);
  const node: TreeNode = {
    id: entityNodeId(entity),
    declaredId: entity.id || entity.localId,
    label: entity.label || "(empty)",
    type: entity.typeRef,
    tags: entity.tags,
    attributes: stringifyAttributeBag(entity.attributes),
    details: entity.description?.text,
    links: explicitLinksForEntity(entity, text),
    children: sortEntities(entity.children).map((child) => itmEntityToTreeNode(child, text)),
    sourceRange: source
  };
  node.links?.forEach((link) => {
    link.sourceRange = link.sourceRange || source;
  });
  return node;
}

function explicitLinksForEntity(entity: ResolvedItmEntity, text: string): GraphEdge[] {
  return sortRelationships(entity.outgoing)
    .filter((relationship) => relationship.relationshipKind === "explicit")
    .map((relationship, index) => ({
      id: relationship.id || relationship.uid || `link-${entity.uid}-${index}`,
      target: relationshipTargetId(relationship),
      type: normalizeRelationshipType(relationship.typeRef),
      label: normalizeRelationshipType(relationship.typeRef),
      sourceRange: toTextForgeSourceRange(relationship.sourceRange, text),
      style: stringifyAttributeBag(relationship.attributes)
    }));
}

function toTextForgeDiagnostic(
  diagnostic: ItmDiagnostic,
  text: string,
  languageId: string,
  documentId?: string
): Diagnostic {
  return {
    source: diagnostic.source || "@textforge/itm",
    severity: diagnostic.severity,
    languageId,
    documentId,
    message: diagnostic.message,
    range: toTextForgeSourceRange(diagnostic.range, text)
  };
}

export function toTextForgeSourceRange(range: ItmSourceRange | undefined, text: string) {
  if (!range) {
    return undefined;
  }
  if (typeof range.startOffset === "number" && typeof range.endOffset === "number") {
    return sourceRange(text, range.startOffset, range.endOffset);
  }
  const offsets = lineOffsets(text);
  const from = Math.max(0, lineColumnToOffset(offsets, range.startLine, range.startColumn));
  const to = Math.max(from, lineColumnToOffset(offsets, range.endLine, range.endColumn));
  return sourceRange(text, from, to);
}

function lineOffsets(text: string): number[] {
  const offsets = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      offsets.push(index + 1);
    }
  }
  return offsets;
}

function lineColumnToOffset(offsets: number[], line: number, column: number): number {
  const lineIndex = Math.max(0, Math.min(offsets.length - 1, line - 1));
  return offsets[lineIndex] + Math.max(0, column - 1);
}

function stringifyAttributeBag(bag: ItmAttributeBag | undefined): Record<string, string> | undefined {
  if (!bag) {
    return undefined;
  }
  const entries = Object.entries(bag.values).map(([key, value]) => [key, stringifyAttributeValue(value)]);
  return Object.fromEntries(entries.filter(([, value]) => value.length > 0));
}

function stringifyAttributeValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  return JSON.stringify(value);
}

function entityNodeId(entity: Pick<ItmEntity, "id" | "localId" | "qualifiedId" | "uid">): string {
  return entity.id || entity.localId || localNameFromReference(entity.qualifiedId) || entity.uid;
}

function relationshipTargetId(relationship: Pick<ResolvedItmRelationship, "target" | "targetRef">): string {
  return relationship.target ? entityNodeId(relationship.target) : localNameFromReference(relationship.targetRef) || relationship.targetRef || "missing-target";
}

function localNameFromReference(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const parts = value.split("::");
  return parts[parts.length - 1] || value;
}

function normalizeRelationshipType(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }
  return value === "related_to" ? "related-to" : value;
}

function sortEntities<T extends Pick<ResolvedItmEntity, "rank">>(entities: readonly T[]): T[] {
  return [...entities].sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
}

function sortRelationships<T extends Pick<ItmRelationship, "sourceRange">>(relationships: readonly T[]): T[] {
  return [...relationships].sort((left, right) => {
    const leftLine = left.sourceRange?.startLine ?? 0;
    const rightLine = right.sourceRange?.startLine ?? 0;
    if (leftLine !== rightLine) {
      return leftLine - rightLine;
    }
    return (left.sourceRange?.startColumn ?? 0) - (right.sourceRange?.startColumn ?? 0);
  });
}

function collectStyleBlock(lines: string[], startIndex: number): { text: string; endIndex: number; closed: boolean } {
  const first = lines[startIndex].trim().replace(/^%style\s*/, "");
  const parts = [first];
  let balance = braceBalance(first);
  let endIndex = startIndex;
  while (balance > 0 && endIndex + 1 < lines.length) {
    endIndex += 1;
    parts.push(lines[endIndex]);
    balance += braceBalance(lines[endIndex]);
  }
  return { text: parts.join("\n"), endIndex, closed: balance <= 0 && first.includes("{") };
}

function braceBalance(text: string): number {
  let balance = 0;
  for (const char of text) {
    if (char === "{") {
      balance += 1;
    } else if (char === "}") {
      balance -= 1;
    }
  }
  return balance;
}

function parseStyleDirective(text: string): IttStyleRule[] {
  const trimmed = text.trim();
  const close = trimmed.lastIndexOf("}");
  const open = close > 0 ? trimmed.lastIndexOf("{", close) : -1;
  if (open <= 0 || close <= open) {
    return [];
  }
  const selectorText = trimmed.slice(0, open).trim();
  const declarations = parseStyleDeclarations(trimmed.slice(open + 1, close));
  if (!Object.keys(declarations).length) {
    return [];
  }
  return selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => ({ selector, declarations, target: selectorTarget(selector) }));
}

function parseStyleDeclarations(text: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  text.split(";").forEach((part) => {
    const [key, ...rest] = part.split(":");
    if (!key || !rest.length) {
      return;
    }
    const name = key.trim();
    const value = rest.join(":").trim();
    if (name && value) {
      declarations[name] = value;
    }
  });
  return declarations;
}

function selectorTarget(selector: string): IttStyleRule["target"] {
  const trimmed = selector.trim();
  if (trimmed === "=>" || trimmed === "~>") {
    return "hierarchy-edge";
  }
  if (trimmed === "->" || /^->\[[^\]]+\]$/.test(trimmed) || trimmed.startsWith("@")) {
    return "cross-link";
  }
  return "node";
}

function parseIncludeTarget(line: string): string {
  const match = /^%include\s+(.+?)\s*$/.exec(line);
  const target = match?.[1]?.trim() || "";
  return stripQuotes(target);
}

function findIncludedDocument(target: string, documents: TextDocument[]): TextDocument | undefined {
  const normalized = normalizeIncludeKey(target);
  const targetBase = normalizeIncludeKey(baseName(target));
  return documents.find((document) => {
    const keys = documentIncludeKeys(document);
    return keys.includes(normalized) || keys.includes(targetBase);
  });
}

function rootIncludeKeys(options: ParseIndentedTreeOptions): Set<string> {
  const keys = new Set<string>();
  [options.currentDocumentId, options.currentFileName, options.currentFileName ? baseName(options.currentFileName) : ""].forEach((value) => {
    const key = normalizeIncludeKey(value || "");
    if (key) {
      keys.add(key);
    }
  });
  return keys;
}

function documentIncludeKeys(document: TextDocument): string[] {
  return [document.id, document.path || "", document.fileName, baseName(document.path || document.fileName)].map(normalizeIncludeKey).filter(Boolean);
}

function normalizeIncludeKey(value: string): string {
  return stripQuotes(value).replace(/\\/g, "/").replace(/^\.\//, "").trim().toLowerCase();
}

function baseName(value: string): string {
  return value.split(/[\\/]/).pop() || value;
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function applyTreeStyles(nodes: TreeNode[], styleRules: IttStyleRule[], inherited: Record<string, string> = {}): void {
  nodes.forEach((node) => {
    const ruleStyle = mergeMatchingNodeStyles(node, styleRules);
    const inlineStyle = inlineNodeStyle(node.attributes || {});
    const style = cleanStyle({ ...inherited, ...ruleStyle, ...inlineStyle });
    if (Object.keys(style).length) {
      node.style = style;
    }
    (node.links || []).forEach((link) => {
      const linkStyle = cleanStyle({
        ...edgeStyleForRules(styleRules, "cross-link", link.type),
        ...(link.style || {}),
        ...legacyCrossLinkStyle(node.attributes || {})
      });
      if (Object.keys(linkStyle).length) {
        link.style = linkStyle;
        link.color = link.color || styleColor(linkStyle, EDGE_COLOR_KEYS);
        link.width = link.width || styleNumber(linkStyle, EDGE_WIDTH_KEYS);
      }
    });
    applyTreeStyles(node.children, styleRules, inheritedStyle(style));
  });
}

function mergeMatchingNodeStyles(node: TreeNode, styleRules: IttStyleRule[]): Record<string, string> {
  const style: Record<string, string> = {};
  styleRules.forEach((rule) => {
    if (rule.target === "node" && nodeMatchesSelector(node, rule.selector)) {
      Object.assign(style, rule.declarations);
    }
  });
  return style;
}

function nodeMatchesSelector(node: TreeNode, selector: string): boolean {
  const trimmed = selector.trim();
  if (trimmed === "*") {
    return true;
  }
  if (trimmed.startsWith("&")) {
    const id = trimmed.slice(1);
    return node.id === id || node.declaredId === id;
  }
  const typeMatch = /^\[([^\]]+)\]$/.exec(trimmed);
  if (typeMatch) {
    return node.type === typeMatch[1].trim();
  }
  if (trimmed.startsWith("#")) {
    return Boolean(node.tags?.includes(trimmed.slice(1)));
  }
  const attributeMatch = /^\{([^=}\s]+)\s*=\s*([^}]+)\}$/.exec(trimmed);
  if (attributeMatch) {
    const key = attributeMatch[1].trim().toLowerCase();
    const expected = stripQuotes(attributeMatch[2]).trim().toLowerCase();
    const actual = Object.entries(node.attributes || {}).find(([name]) => name.trim().toLowerCase() === key)?.[1];
    return actual?.trim().toLowerCase() === expected;
  }
  return false;
}

function inheritedStyle(style: Record<string, string>): Record<string, string> {
  const inherited: Record<string, string> = {};
  Object.entries(style).forEach(([key, value]) => {
    if (INHERITED_STYLE_KEYS.has(normalizeStyleKey(key))) {
      inherited[key] = value;
    }
  });
  return inherited;
}

function cleanStyle(style: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  Object.entries(style).forEach(([key, value]) => {
    const trimmed = value.trim();
    if (key.trim() && trimmed) {
      cleaned[key.trim()] = trimmed;
    }
  });
  return cleaned;
}

function inlineNodeStyle(attributes: Record<string, string>): Record<string, string> {
  const style: Record<string, string> = {};
  Object.entries(attributes).forEach(([key, value]) => {
    if (NODE_STYLE_ATTRIBUTE_KEYS.has(normalizeStyleKey(key))) {
      style[key] = value;
    }
  });
  return style;
}

function legacyHierarchyEdgeStyle(attributes: Record<string, string>): Record<string, string> {
  return pickStyle(attributes, [
    "edge-color",
    "edgeColor",
    "line-color",
    "lineColor",
    "stroke",
    "edge-width",
    "edgeWidth",
    "line-width",
    "lineWidth",
    "stroke-width"
  ]);
}

function legacyCrossLinkStyle(attributes: Record<string, string>): Record<string, string> {
  return pickStyle(attributes, [
    "link-color",
    "linkColor",
    "line-color",
    "lineColor",
    "edge-color",
    "edgeColor",
    "stroke",
    "link-width",
    "linkWidth",
    "line-width",
    "lineWidth",
    "edge-width",
    "edgeWidth",
    "stroke-width"
  ]);
}

function pickStyle(attributes: Record<string, string>, keys: string[]): Record<string, string> {
  const picked: Record<string, string> = {};
  const normalized = new Map(Object.entries(attributes).map(([key, value]) => [normalizeStyleKey(key), { key, value }]));
  keys.forEach((key) => {
    const match = normalized.get(normalizeStyleKey(key));
    if (match) {
      picked[match.key] = match.value;
    }
  });
  return picked;
}

function collectTreeStyleRules(nodes: TreeNode[]): IttStyleRule[] {
  const root = nodes[0] as (TreeNode & { __itmStyleRules?: IttStyleRule[] }) | undefined;
  return root?.__itmStyleRules || [];
}

function edgeStyleForRules(styleRules: IttStyleRule[], target: IttStyleRule["target"], type?: string): Record<string, string> {
  const style: Record<string, string> = {};
  styleRules.forEach((rule) => {
    if (rule.target !== target) {
      return;
    }
    if (target === "cross-link" && !edgeSelectorMatches(rule.selector, type)) {
      return;
    }
    Object.assign(style, rule.declarations);
  });
  return style;
}

function edgeSelectorMatches(selector: string, type?: string): boolean {
  const trimmed = selector.trim();
  if (trimmed === "->" || trimmed === "~>" || trimmed === "=>") {
    return true;
  }
  const match = /^->\[([^\]]+)\]$/.exec(trimmed);
  if (match) {
    return Boolean(type && match[1].trim() === type);
  }
  if (trimmed.startsWith("@")) {
    const atMatch = /^@([^:]+)(?::(.+))?$/.exec(trimmed);
    return Boolean(atMatch && type && atMatch[1].trim() === type);
  }
  return false;
}

function effectiveStyle(node: TreeNode): Record<string, string> {
  return { ...(node.style || {}), ...inlineNodeStyle(node.attributes || {}) };
}

function styleColor(attributes: Record<string, string>, keys: string[]): string | undefined {
  const value = firstAttribute(attributes, keys);
  return value && /^(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|[a-z]+)$/i.test(value) ? value : undefined;
}

function styleNumber(attributes: Record<string, string>, keys: string[]): number | undefined {
  const value = firstAttribute(attributes, keys);
  const parsed = value ? Number.parseFloat(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstAttribute(attributes: Record<string, string>, keys: string[]): string | undefined {
  const normalized = new Map(Object.entries(attributes).map(([key, value]) => [normalizeStyleKey(key), value.trim()]));
  for (const key of keys) {
    const value = normalized.get(normalizeStyleKey(key));
    if (value) {
      return value;
    }
  }
  return undefined;
}

function normalizeStyleKey(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`).toLowerCase();
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
  const items: NonNullable<TreeNode["links"]> = match[1].split(/\s*,\s*/).map((part): GraphEdge => {
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

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

const NODE_FILL_KEYS = ["background-color", "backgroundColor", "background", "bg", "fill"];
const NODE_COLOR_KEYS = [...NODE_FILL_KEYS, "color"];
const NODE_SIZE_KEYS = ["size", "node-size", "nodeSize", "width"];
const EDGE_COLOR_KEYS = ["stroke", "line-color", "lineColor", "edge-color", "edgeColor", "link-color", "linkColor", "color"];
const EDGE_WIDTH_KEYS = ["stroke-width", "line-width", "lineWidth", "edge-width", "edgeWidth", "link-width", "linkWidth", "width"];

const NODE_STYLE_ATTRIBUTE_KEYS = new Set(
  [
    ...NODE_COLOR_KEYS,
    ...NODE_SIZE_KEYS,
    "x",
    "y",
    "foreground-color",
    "foregroundColor",
    "text-color",
    "textColor",
    "fg",
    "font-size",
    "fontSize",
    "font-weight",
    "fontWeight",
    "font-style",
    "fontStyle",
    "weight",
    "style",
    "border-color",
    "borderColor",
    "border",
    "border-width",
    "borderWidth",
    "stroke",
    "stroke-width",
    "shape",
    "node-shape",
    "nodeShape",
    "opacity"
  ].map(normalizeStyleKey)
);

const INHERITED_STYLE_KEYS = new Set(
  [
    "color",
    "foreground-color",
    "foregroundColor",
    "text-color",
    "textColor",
    "fg",
    "font",
    "font-family",
    "fontFamily",
    "font-size",
    "fontSize",
    "font-style",
    "fontStyle",
    "font-weight",
    "fontWeight",
    "line-height",
    "lineHeight"
  ].map(normalizeStyleKey)
);
