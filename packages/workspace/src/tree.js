import { basenameWorkspacePath } from './paths.js';

function createWorkspaceChildCountByParentId(state) {
  const childCountByParentId = new Map();
  for (const entry of [...state.folders, ...state.resources]) {
    const parentId = entry.parentId;
    if (!parentId) {
      continue;
    }
    childCountByParentId.set(parentId, (childCountByParentId.get(parentId) ?? 0) + 1);
  }
  return childCountByParentId;
}

function describeWorkspaceEntryDetail(entry, childCountByParentId) {
  if (entry.kind === 'folder') {
    const childCount = childCountByParentId.get(entry.id) ?? 0;
    return `${childCount} item${childCount === 1 ? '' : 's'}`;
  }

  if (entry.representation === 'text') {
    return entry.languageId ? entry.languageId.toUpperCase() : 'TEXT';
  }

  if (entry.mimeType === 'image/svg+xml') {
    return 'SVG';
  }

  if (entry.mimeType?.startsWith('image/')) {
    return 'IMAGE';
  }

  if (entry.mimeType === 'application/pdf') {
    return 'PDF';
  }

  return 'FILE';
}

export function createWorkspaceTreeItems(state) {
  const childCountByParentId = createWorkspaceChildCountByParentId(state);
  const entries = [...state.folders, ...state.resources]
    .filter((entry) => entry.id !== 'root')
    .sort((left, right) => left.path.localeCompare(right.path));

  return entries.map((entry) => {
    const pathSegments = entry.path.split('/').filter(Boolean);
    const depth = Math.max(0, pathSegments.length - 1);

    return {
      id: entry.id,
      label: entry.metadata.title ?? basenameWorkspacePath(entry.path) ?? entry.path,
      path: entry.path,
      kind: entry.kind,
      representation: entry.kind === 'resource' ? entry.representation : undefined,
      depth,
      expanded: entry.kind === 'folder' ? (entry.childIds.length > 0) : false,
      active: state.manifest.selectedResourceId === entry.id,
      detail: describeWorkspaceEntryDetail(entry, childCountByParentId),
    };
  });
}
