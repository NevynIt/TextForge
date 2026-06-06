import {
  isVisualItmDocument,
  validateVisualItmDocument,
} from '@textforge/visual-itm';

import { syntheticRootId } from './constants.js';

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

function buildNodeChildrenMap(visualDocument) {
  const nodeMap = new Map();
  const childrenMap = new Map();
  for (const node of visualDocument.nodes) {
    nodeMap.set(node.id, node);
    if (!childrenMap.has(node.id)) {
      childrenMap.set(node.id, []);
    }
  }

  const roots = [];
  for (const node of visualDocument.nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      if (!childrenMap.has(node.parentId)) {
        childrenMap.set(node.parentId, []);
      }
      childrenMap.get(node.parentId).push(node);
    } else {
      roots.push(node);
    }
  }

  return {
    nodeMap,
    childrenMap,
    roots,
  };
}

function buildSyntheticRootLabel(visualDocument) {
  return visualDocument.origin?.derivedTarget?.id
    ?? visualDocument.origin?.sourceResource
    ?? 'Visual ITM mindmap';
}

export function createJsMindNodeArray(visualDocument) {
  const { childrenMap, roots } = buildNodeChildrenMap(visualDocument);
  const output = [];
  const rootId = roots.length === 1 ? roots[0].id : syntheticRootId;

  if (roots.length !== 1) {
    output.push({
      id: syntheticRootId,
      topic: buildSyntheticRootLabel(visualDocument),
      isroot: true,
      expanded: true,
    });
  }

  const visit = (node, parentId, index) => {
    output.push({
      id: node.id,
      topic: node.label ?? node.id,
      isroot: !parentId,
      parentid: parentId,
      expanded: true,
      direction: node.layout?.['jsmind.side'] === 'left'
        ? 'left'
        : node.layout?.['jsmind.side'] === 'right'
          ? 'right'
          : (parentId === rootId && index % 2 === 0 ? 'left' : 'right'),
    });

    const children = childrenMap.get(node.id) ?? [];
    children.forEach((child, childIndex) => visit(child, node.id, childIndex));
  };

  if (roots.length === 1) {
    visit(roots[0], undefined, 0);
  } else {
    roots.forEach((node, index) => visit(node, syntheticRootId, index));
  }

  if (output.length === 0 && visualDocument.nodes[0]) {
    const first = visualDocument.nodes[0];
    output.push({
      id: first.id,
      topic: first.label ?? first.id,
      isroot: true,
      expanded: true,
    });
  }

  return {
    rootId,
    nodes: output,
  };
}

export function findJsMindMatches(visualDocument, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return visualDocument.nodes
    .filter((node) => normalizeSearchText([
      node.id,
      node.label,
      node.kind,
      node.classes,
      node.tags,
    ]).some((value) => value.includes(normalizedQuery)))
    .map((node) => ({
      id: node.id,
      label: node.label ?? node.id,
    }));
}

export function createJsMindSurfaceModel(visualDocument, options = {}) {
  const diagnostics = [
    ...(options.diagnostics ?? []),
    ...validateVisualItmDocument(visualDocument),
  ];
  const valid = isVisualItmDocument(visualDocument)
    ? visualDocument
    : {
      format: 'textforge.visual-itm/v1',
      origin: { mode: 'translated' },
      nodes: [],
      edges: [],
    };
  const tree = createJsMindNodeArray(valid);

  return {
    id: `jsmind:${options.title ?? 'visual-itm'}`,
    title: options.title ?? 'jsMind mindmap',
    summary: `Interactive jsMind surface for ${valid.nodes.length} topics.`,
    detail: `${valid.nodes.length} topics / ${valid.edges.length} cross-links`,
    diagnostics,
    visualDocument: valid,
    rootId: tree.rootId,
    nodes: tree.nodes,
  };
}
