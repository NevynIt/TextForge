import {
  isVisualItmDocument,
  validateVisualItmDocument,
} from '@textforge/visual-itm';

function stringifyScalar(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function normalizeSearchText(values) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => stringifyScalar(value).trim().toLowerCase())
    .filter(Boolean);
}

function createSearchIndex(visualDocument) {
  return {
    nodes: visualDocument.nodes.map((node) => ({
      id: node.id,
      kind: 'node',
      label: node.label ?? node.id,
      haystack: normalizeSearchText([
        node.id,
        node.label,
        node.kind,
        node.classes,
        node.tags,
        Object.keys(node.style ?? {}),
      ]),
    })),
    edges: visualDocument.edges.map((edge) => ({
      id: edge.id,
      kind: 'edge',
      label: edge.label ?? edge.id,
      haystack: normalizeSearchText([
        edge.id,
        edge.label,
        edge.kind,
        edge.sourceId,
        edge.targetId,
        edge.classes,
        edge.tags,
      ]),
    })),
  };
}

function coerceVisualGraphDocument(visualDocument) {
  if (!isVisualItmDocument(visualDocument)) {
    return undefined;
  }

  return visualDocument;
}

export function createCytoscapeElements(visualDocument) {
  return {
    nodes: visualDocument.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label ?? node.id,
        kind: node.kind,
        classes: [...(node.classes ?? [])],
        tags: [...(node.tags ?? [])],
        parent: node.parentId,
        style: node.style,
        layout: node.layout,
        provenance: node.provenance,
      },
    })),
    edges: visualDocument.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label ?? edge.id,
        kind: edge.kind,
        classes: [...(edge.classes ?? [])],
        tags: [...(edge.tags ?? [])],
        style: edge.style,
        layout: edge.layout,
        provenance: edge.provenance,
      },
    })),
  };
}

export function findCytoscapeMatches(visualDocument, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const index = createSearchIndex(visualDocument);
  return [...index.nodes, ...index.edges]
    .filter((entry) => entry.haystack.some((value) => value.includes(normalizedQuery)))
    .map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
    }));
}

export function createCytoscapeSurfaceModel(visualDocument, options = {}) {
  const validated = coerceVisualGraphDocument(visualDocument);
  const diagnostics = [
    ...(options.diagnostics ?? []),
    ...validateVisualItmDocument(validated ?? visualDocument),
  ];
  const graphDocument = validated ?? {
    format: 'textforge.visual-itm/v1',
    origin: { mode: 'translated' },
    nodes: [],
    edges: [],
  };
  const elements = createCytoscapeElements(graphDocument);

  return {
    id: `cytoscape:${options.title ?? 'visual-itm'}`,
    title: options.title ?? 'Cytoscape graph',
    summary: `Interactive Cytoscape graph for ${graphDocument.nodes.length} nodes and ${graphDocument.edges.length} edges.`,
    detail: `${graphDocument.nodes.length} nodes / ${graphDocument.edges.length} edges`,
    diagnostics,
    visualDocument: graphDocument,
    elements,
  };
}
