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

export function createSigmaGraphDescriptor(visualDocument) {
  return {
    nodes: visualDocument.nodes.map((node) => ({
      id: node.id,
      label: node.label ?? node.id,
      kind: node.kind,
      classes: [...(node.classes ?? [])],
      tags: [...(node.tags ?? [])],
      style: node.style,
      provenance: node.provenance,
    })),
    edges: visualDocument.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label ?? edge.id,
      kind: edge.kind,
      classes: [...(edge.classes ?? [])],
      tags: [...(edge.tags ?? [])],
      style: edge.style,
      provenance: edge.provenance,
    })),
  };
}

export function findSigmaMatches(visualDocument, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const nodeMatches = visualDocument.nodes
    .filter((node) => normalizeSearchText([
      node.id,
      node.label,
      node.kind,
      node.classes,
      node.tags,
    ]).some((value) => value.includes(normalizedQuery)))
    .map((node) => ({
      id: node.id,
      kind: 'node',
      label: node.label ?? node.id,
    }));
  const edgeMatches = visualDocument.edges
    .filter((edge) => normalizeSearchText([
      edge.id,
      edge.label,
      edge.kind,
      edge.sourceId,
      edge.targetId,
      edge.classes,
      edge.tags,
    ]).some((value) => value.includes(normalizedQuery)))
    .map((edge) => ({
      id: edge.id,
      kind: 'edge',
      label: edge.label ?? edge.id,
    }));

  return [...nodeMatches, ...edgeMatches];
}
