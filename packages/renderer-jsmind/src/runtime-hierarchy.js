import { syntheticRootId } from './constants.js';

export function buildHierarchy(visualDocument, rootId) {
  const byId = new Map(visualDocument.nodes.map((node) => [node.id, { ...node, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else if (node.id !== syntheticRootId) {
      roots.push(node);
    }
  }

  if (rootId === syntheticRootId) {
    return {
      id: syntheticRootId,
      children: roots,
    };
  }

  return byId.get(rootId) ?? { id: rootId, children: [] };
}

function walkHierarchy(node, visitor, depth = 0) {
  visitor(node, depth);
  for (const child of node.children ?? []) {
    walkHierarchy(child, visitor, depth + 1);
  }
}

export function applyExpansionMode(instance, hierarchy, rootId, mode) {
  if (!instance) {
    return;
  }

  if (mode === 'full') {
    instance.expand_all?.();
    return;
  }

  instance.collapse_all?.();
  instance.expand_node?.(rootId);

  if (mode === 'depth2') {
    walkHierarchy(hierarchy, (node, depth) => {
      if (depth < 2 && node.id && node.id !== rootId) {
        instance.expand_node?.(node.id);
      }
    });
  }
}
