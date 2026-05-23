import { unzipSync, zipSync } from 'fflate';

import { createResourceRef } from '../../core/src/index.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const workspaceArchiveFormat = 'textforge-workspace-archive';
const workspaceArchiveVersion = 1;
const workspaceArchiveManifestPath = 'textforge-workspace.json';

export const workspaceDexieSchema = {
  folders: 'id, path, parentId, metadata.createdAt, metadata.updatedAt',
  resources: 'id, path, parentId, kind, languageId, mimeType, metadata.createdAt, metadata.updatedAt',
  manifests: 'workspaceId, name, rootPath, createdAt, updatedAt, selectedResourceId',
};

export const workspaceContribution = {
  id: '@textforge/workspace',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};

export const contributions = workspaceContribution;

export function createSequentialIdFactory(prefix = 'workspace-entry') {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

export function normalizeWorkspacePath(path) {
  const segments = path
    .replaceAll('\\', '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalized = [];
  for (const segment of segments) {
    if (segment === '.') {
      continue;
    }

    if (segment === '..') {
      normalized.pop();
      continue;
    }

    normalized.push(segment);
  }

  return `/${normalized.join('/')}`;
}

export function joinWorkspacePath(...parts) {
  return normalizeWorkspacePath(parts.filter(Boolean).join('/'));
}

export function dirnameWorkspacePath(path) {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === '/') {
    return '/';
  }

  const segments = normalized.split('/').filter(Boolean);
  segments.pop();
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

export function basenameWorkspacePath(path) {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === '/') {
    return '';
  }

  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

export function createWorkspaceManifest(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const timestamp = now();

  return {
    workspaceId: options.workspaceId ?? 'workspace',
    name: options.name ?? 'TextForge Workspace',
    rootPath: normalizeWorkspacePath(options.rootPath ?? '/'),
    createdAt: timestamp,
    updatedAt: timestamp,
    selectedResourceId: options.selectedResourceId,
  };
}

function cloneMetadata(metadata) {
  return {
    ...metadata,
    tags: metadata.tags ? [...metadata.tags] : undefined,
  };
}

function cloneWorkspaceManifestRecord(manifest) {
  return {
    ...manifest,
  };
}

function snapshotWorkspaceState(input) {
  return typeof input?.snapshot === 'function' ? input.snapshot() : input;
}

function toArchiveResourcePath(path) {
  const normalizedPath = normalizeWorkspacePath(path);
  const relativePath = normalizedPath.split('/').filter(Boolean).join('/');
  if (relativePath.length === 0) {
    throw new Error(`Cannot archive workspace resource without a path: ${path}`);
  }

  return `resources/${relativePath}`;
}

function normalizeArchiveEntryPath(path) {
  const segments = String(path ?? '')
    .replaceAll('\\', '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error(`Invalid workspace archive entry path: ${path}`);
  }

  return segments.join('/');
}

function createWorkspaceArchiveFolderRecord(folder) {
  return {
    id: folder.id,
    path: normalizeWorkspacePath(folder.path),
    parentId: folder.parentId,
    metadata: cloneMetadata(folder.metadata),
  };
}

function createWorkspaceArchiveResourceRecord(resource) {
  return {
    id: resource.id,
    kind: resource.kind,
    path: normalizeWorkspacePath(resource.path),
    parentId: resource.parentId,
    metadata: cloneMetadata(resource.metadata),
    archivePath: toArchiveResourcePath(resource.path),
    encoding: resource.kind === 'text' ? 'utf8' : 'binary',
    languageId: resource.kind === 'text' ? resource.languageId : undefined,
    mimeType: resource.mimeType,
  };
}

function parseWorkspaceArchiveManifest(bytes) {
  const parsed = JSON.parse(textDecoder.decode(bytes));
  if (parsed?.format !== workspaceArchiveFormat) {
    throw new Error(`Unsupported workspace archive format: ${parsed?.format ?? 'unknown'}`);
  }

  if (parsed.version !== workspaceArchiveVersion) {
    throw new Error(`Unsupported workspace archive version: ${parsed?.version ?? 'unknown'}`);
  }

  if (!parsed.workspace || !Array.isArray(parsed.folders) || !Array.isArray(parsed.resources)) {
    throw new Error('Invalid workspace archive manifest payload');
  }

  return parsed;
}

function cloneBytes(bytes) {
  return new Uint8Array(bytes);
}

function createMetadata(title, now) {
  const timestamp = now();
  return {
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function matchesWorkspaceQuery(entry, query) {
  if (query.resourceId && entry.id !== query.resourceId) {
    return false;
  }

  if (query.path && entry.path !== normalizeWorkspacePath(query.path)) {
    return false;
  }

  if (query.kind && entry.kind !== query.kind) {
    return false;
  }

  if (query.parentId && entry.parentId !== query.parentId) {
    return false;
  }

  if (query.languageId && entry.kind === 'text' && entry.languageId !== query.languageId) {
    return false;
  }

  if (query.mimeType && 'mimeType' in entry && entry.mimeType !== query.mimeType) {
    return false;
  }

  return true;
}

function rebuildFolderChildren(folders, resources) {
  return folders.map((folder) => ({
    ...folder,
    childIds: [
      ...folders.filter((candidate) => candidate.parentId === folder.id).map((candidate) => candidate.id),
      ...resources.filter((candidate) => candidate.parentId === folder.id).map((candidate) => candidate.id),
    ],
  }));
}

function createFolderEntry(input, now, idFactory, parentId) {
  const title = input.title ?? (basenameWorkspacePath(input.path) || 'Untitled folder');
  return {
    kind: 'folder',
    id: idFactory(),
    path: normalizeWorkspacePath(input.path),
    parentId,
    metadata: createMetadata(title, now),
    childIds: [],
  };
}

function createTextEntry(input, now, idFactory, parentId) {
  const title = input.title ?? (basenameWorkspacePath(input.path) || 'Untitled text');
  return {
    kind: 'text',
    id: idFactory(),
    path: normalizeWorkspacePath(input.path),
    parentId,
    metadata: createMetadata(title, now),
    text: input.text ?? '',
    languageId: input.languageId,
    mimeType: input.mimeType,
  };
}

function createBinaryEntry(input, now, idFactory, parentId) {
  const title = input.title ?? (basenameWorkspacePath(input.path) || 'Untitled binary');
  return {
    kind: 'binary',
    id: idFactory(),
    path: normalizeWorkspacePath(input.path),
    parentId,
    metadata: createMetadata(title, now),
    bytes: cloneBytes(input.bytes),
    mimeType: input.mimeType,
  };
}

function replaceById(entries, nextEntry) {
  return entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry));
}

function removeById(entries, id) {
  return entries.filter((entry) => entry.id !== id);
}

function updateDescendantPaths(entries, previousPath, nextPath) {
  const normalizedPreviousPath = normalizeWorkspacePath(previousPath);
  const normalizedNextPath = normalizeWorkspacePath(nextPath);
  const prefix = `${normalizedPreviousPath === '/' ? '' : `${normalizedPreviousPath}/`}`;

  return entries.map((entry) => {
    if (entry.path === normalizedPreviousPath) {
      return entry;
    }

    if (normalizedPreviousPath !== '/' && !entry.path.startsWith(prefix)) {
      return entry;
    }

    if (normalizedPreviousPath === '/' && entry.path === '/') {
      return entry;
    }

    const suffix = entry.path.slice(normalizedPreviousPath.length);
    return {
      ...entry,
      path: `${normalizedNextPath}${suffix}`,
    };
  });
}

function collectDescendants(entries, parentId) {
  const directChildren = entries.filter((entry) => entry.parentId === parentId);
  return directChildren.flatMap((entry) => (entry.kind === 'folder' ? [entry, ...collectDescendants(entries, entry.id)] : [entry]));
}

function toResourceRef(entry) {
  return createResourceRef(entry.id, {
    path: entry.path,
    kind: entry.kind === 'folder' ? 'virtual' : entry.kind,
    mimeType: 'mimeType' in entry ? entry.mimeType : undefined,
    languageId: entry.kind === 'text' ? entry.languageId : undefined,
    parentResourceId: entry.parentId,
  });
}

export function workspaceEntryToResourceRef(entry) {
  return toResourceRef(entry);
}

export function createWorkspaceArchiveManifest(input, options = {}) {
  const state = snapshotWorkspaceState(input);
  const exportedAt = options.exportedAt ?? new Date().toISOString();
  return {
    format: workspaceArchiveFormat,
    version: workspaceArchiveVersion,
    exportedAt,
    workspace: cloneWorkspaceManifestRecord(state.manifest),
    folders: state.folders.map((folder) => createWorkspaceArchiveFolderRecord(folder)),
    resources: state.resources.map((resource) => createWorkspaceArchiveResourceRecord(resource)),
  };
}

export function exportWorkspaceToZip(input, options = {}) {
  const state = snapshotWorkspaceState(input);
  const manifest = createWorkspaceArchiveManifest(state, options);
  const archiveEntries = {
    [workspaceArchiveManifestPath]: textEncoder.encode(JSON.stringify(manifest, null, 2)),
  };

  for (const resource of state.resources) {
    archiveEntries[toArchiveResourcePath(resource.path)] = resource.kind === 'text'
      ? textEncoder.encode(resource.text)
      : cloneBytes(resource.bytes);
  }

  return zipSync(archiveEntries);
}

export function importWorkspaceFromZip(bytes) {
  const archiveEntries = unzipSync(bytes);
  const manifestBytes = archiveEntries[workspaceArchiveManifestPath];
  if (!manifestBytes) {
    throw new Error(`Workspace archive is missing ${workspaceArchiveManifestPath}`);
  }

  const manifest = parseWorkspaceArchiveManifest(manifestBytes);
  const resources = manifest.resources.map((resourceRecord) => {
    const archivePath = normalizeArchiveEntryPath(resourceRecord.archivePath);
    const resourceBytes = archiveEntries[archivePath];
    if (!resourceBytes) {
      throw new Error(`Workspace archive is missing ${archivePath}`);
    }

    const metadata = cloneMetadata(resourceRecord.metadata);
    const normalizedPath = normalizeWorkspacePath(resourceRecord.path);
    if (resourceRecord.kind === 'text') {
      return {
        kind: 'text',
        id: resourceRecord.id,
        path: normalizedPath,
        parentId: resourceRecord.parentId,
        metadata,
        text: textDecoder.decode(resourceBytes),
        languageId: resourceRecord.languageId,
        mimeType: resourceRecord.mimeType,
      };
    }

    if (resourceRecord.kind === 'binary') {
      return {
        kind: 'binary',
        id: resourceRecord.id,
        path: normalizedPath,
        parentId: resourceRecord.parentId,
        metadata,
        bytes: cloneBytes(resourceBytes),
        mimeType: resourceRecord.mimeType,
      };
    }

    throw new Error(`Unsupported workspace resource kind in archive: ${resourceRecord.kind}`);
  });

  const folders = manifest.folders.map((folderRecord) => ({
    kind: 'folder',
    id: folderRecord.id,
    path: normalizeWorkspacePath(folderRecord.path),
    parentId: folderRecord.parentId,
    metadata: cloneMetadata(folderRecord.metadata),
    childIds: [],
  }));
  if (!folders.some((folder) => folder.id === 'root')) {
    folders.unshift({
      kind: 'folder',
      id: 'root',
      path: normalizeWorkspacePath(manifest.workspace.rootPath),
      parentId: undefined,
      metadata: {
        title: manifest.workspace.name,
        createdAt: manifest.workspace.createdAt,
        updatedAt: manifest.workspace.updatedAt,
      },
      childIds: [],
    });
  }

  const state = {
    manifest: {
      ...cloneWorkspaceManifestRecord(manifest.workspace),
      rootPath: normalizeWorkspacePath(manifest.workspace.rootPath),
    },
    folders: rebuildFolderChildren(folders, resources),
    resources,
  };

  return {
    manifest: {
      format: manifest.format,
      version: manifest.version,
      exportedAt: manifest.exportedAt,
      workspace: state.manifest,
      folders: manifest.folders.map((folderRecord) => ({
        ...folderRecord,
        path: normalizeWorkspacePath(folderRecord.path),
        metadata: cloneMetadata(folderRecord.metadata),
      })),
      resources: manifest.resources.map((resourceRecord) => ({
        ...resourceRecord,
        path: normalizeWorkspacePath(resourceRecord.path),
        metadata: cloneMetadata(resourceRecord.metadata),
        archivePath: normalizeArchiveEntryPath(resourceRecord.archivePath),
      })),
    },
    state,
  };
}

export function createWorkspaceTreeItems(state) {
  const entries = [...state.folders, ...state.resources]
    .filter((entry) => entry.id !== 'root')
    .sort((left, right) => left.path.localeCompare(right.path));

  return entries.map((entry) => {
    const pathSegments = entry.path.split('/').filter(Boolean);
    const depth = Math.max(0, pathSegments.length - 1);
    const badge = entry.kind === 'folder'
      ? String((state.folders.find((folder) => folder.id === entry.id)?.childIds.length ?? 0))
      : entry.kind === 'text'
        ? (entry.languageId ? entry.languageId.toUpperCase() : (entry.path.split('.').pop() ?? 'TXT').toUpperCase())
        : (entry.mimeType === 'image/svg+xml' ? 'SVG' : entry.mimeType?.startsWith('image/') ? 'IMG' : 'BIN');

    return {
      id: entry.id,
      label: entry.metadata.title ?? basenameWorkspacePath(entry.path) ?? entry.path,
      path: entry.path,
      kind: entry.kind,
      depth,
      expanded: entry.kind === 'folder' ? (entry.childIds.length > 0) : false,
      active: state.manifest.selectedResourceId === entry.id,
      badge,
    };
  });
}

export function createWorkspaceService(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const idFactory = options.idFactory ?? createSequentialIdFactory(options.workspaceId ?? 'workspace-entry');

  let manifest = options.state?.manifest ?? createWorkspaceManifest(options);
  let folders = [...(options.state?.folders ?? [])];
  let resources = [...(options.state?.resources ?? [])];

  const rootFolder = {
    kind: 'folder',
    id: 'root',
    path: manifest.rootPath,
    metadata: {
      title: manifest.name,
      createdAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
    },
    childIds: [],
  };

  if (!folders.some((folder) => folder.id === rootFolder.id)) {
    folders = [rootFolder, ...folders];
  }

  function allEntries() {
    return [...folders, ...resources];
  }

  function snapshot() {
    return {
      manifest,
      folders: rebuildFolderChildren(folders, resources),
      resources: resources.map((resource) =>
        resource.kind === 'binary'
          ? { ...resource, bytes: cloneBytes(resource.bytes) }
          : { ...resource },
      ),
    };
  }

  function query(queryValue) {
    return allEntries().filter((entry) => matchesWorkspaceQuery(entry, queryValue));
  }

  function getEntry(resourceId) {
    return allEntries().find((entry) => entry.id === resourceId);
  }

  function getEntryByPath(path) {
    return allEntries().find((entry) => entry.path === normalizeWorkspacePath(path));
  }

  function resolveParentFolder(path) {
    const parentPath = dirnameWorkspacePath(path);
    return allEntries().find((entry) => entry.kind === 'folder' && entry.path === parentPath);
  }

  function createFolder(input) {
    const parent = resolveParentFolder(input.path);
    const nextFolder = createFolderEntry(input, now, idFactory, parent?.id);
    folders = [...folders, nextFolder];
    if (parent) {
      folders = folders.map((folder) =>
        folder.id === parent.id ? { ...folder, childIds: [...folder.childIds, nextFolder.id] } : folder,
      );
    }
    return nextFolder;
  }

  function createTextResource(input) {
    const parent = resolveParentFolder(input.path);
    const nextResource = createTextEntry(input, now, idFactory, parent?.id);
    resources = [...resources, nextResource];
    if (parent) {
      folders = folders.map((folder) =>
        folder.id === parent.id ? { ...folder, childIds: [...folder.childIds, nextResource.id] } : folder,
      );
    }
    return nextResource;
  }

  function createBinaryResource(input) {
    const parent = resolveParentFolder(input.path);
    const nextResource = createBinaryEntry(input, now, idFactory, parent?.id);
    resources = [...resources, nextResource];
    if (parent) {
      folders = folders.map((folder) =>
        folder.id === parent.id ? { ...folder, childIds: [...folder.childIds, nextResource.id] } : folder,
      );
    }
    return nextResource;
  }

  function saveTextResource(input) {
    const current = resources.find((entry) => entry.id === input.resourceId && entry.kind === 'text');
    if (!current) {
      throw new Error(`Unknown text resource: ${input.resourceId}`);
    }

    const nextResource = {
      ...current,
      text: input.text,
      languageId: input.languageId ?? current.languageId,
      mimeType: input.mimeType ?? current.mimeType,
      metadata: {
        ...current.metadata,
        updatedAt: input.updatedAt ?? now(),
      },
    };

    resources = replaceById(resources, nextResource);
    return nextResource;
  }

  function saveBinaryResource(input) {
    const current = resources.find((entry) => entry.id === input.resourceId && entry.kind === 'binary');
    if (!current) {
      throw new Error(`Unknown binary resource: ${input.resourceId}`);
    }

    const nextResource = {
      ...current,
      bytes: cloneBytes(input.bytes),
      metadata: {
        ...current.metadata,
        updatedAt: input.updatedAt ?? now(),
      },
    };

    resources = replaceById(resources, nextResource);
    return nextResource;
  }

  function renameEntry(resourceId, path) {
    const current = getEntry(resourceId);
    if (!current) {
      return undefined;
    }

    const nextPath = normalizeWorkspacePath(path);
    const updatedAt = now();

    if (current.kind === 'folder') {
      const folderDescendants = collectDescendants(allEntries(), current.id);
      folders = updateDescendantPaths(folders, current.path, nextPath);
      resources = updateDescendantPaths(resources, current.path, nextPath);
      const nextFolder = folders.find((entry) => entry.id === current.id);
      if (!nextFolder) {
        return undefined;
      }

      const parent = resolveParentFolder(nextPath);
      const patchedFolder = {
        ...nextFolder,
        path: nextPath,
        parentId: parent?.id,
        metadata: { ...nextFolder.metadata, updatedAt },
        childIds: folderDescendants.filter((entry) => entry.parentId === current.id).map((entry) => entry.id),
      };
      folders = replaceById(folders, patchedFolder);
      return patchedFolder;
    }

    const parent = resolveParentFolder(nextPath);
    const nextResource = {
      ...current,
      path: nextPath,
      parentId: parent?.id,
      metadata: { ...current.metadata, updatedAt },
    };
    resources = replaceById(resources, nextResource);
    return nextResource;
  }

  function moveEntry(input) {
    const current = getEntry(input.resourceId);
    if (!current) {
      return undefined;
    }

    const parent = getEntryByPath(input.parentPath);
    if (!parent || parent.kind !== 'folder') {
      throw new Error(`Unknown workspace folder: ${input.parentPath}`);
    }

    const baseTitle = input.title ?? current.metadata.title ?? basenameWorkspacePath(current.path);
    const title = baseTitle || current.id;
    return renameEntry(current.id, joinWorkspacePath(parent.path, title));
  }

  function deleteEntry(resourceId) {
    const current = getEntry(resourceId);
    if (!current) {
      return false;
    }

    if (current.kind === 'folder') {
      for (const descendant of collectDescendants(allEntries(), current.id)) {
        if (descendant.kind === 'folder') {
          folders = removeById(folders, descendant.id);
        } else {
          resources = removeById(resources, descendant.id);
        }
      }
      folders = removeById(folders, current.id);
      return true;
    }

    resources = removeById(resources, current.id);
    return true;
  }

  function resolveReference(source, reference) {
    const resolvedPath = reference.startsWith('/')
      ? normalizeWorkspacePath(reference)
      : joinWorkspacePath(source.path ? dirnameWorkspacePath(source.path) : '/', reference);
    const entry = getEntryByPath(resolvedPath);
    return entry ? toResourceRef(entry) : undefined;
  }

  function applyMutation(mutation) {
    switch (mutation.kind) {
      case 'create-folder':
        return createFolder(mutation.input);
      case 'create-text':
        return createTextResource(mutation.input);
      case 'create-binary':
        return createBinaryResource(mutation.input);
      case 'save-text':
        return saveTextResource(mutation.input);
      case 'save-binary':
        return saveBinaryResource(mutation.input);
      case 'rename':
        return renameEntry(mutation.resourceId, mutation.path);
      case 'move':
        return moveEntry(mutation.input);
      case 'delete':
        return deleteEntry(mutation.resourceId);
    }
  }

  return {
    workspaceId: manifest.workspaceId,
    snapshot,
    query,
    getEntry,
    getEntryByPath,
    createFolder,
    createTextResource,
    createBinaryResource,
    saveTextResource,
    saveBinaryResource,
    renameEntry,
    moveEntry,
    deleteEntry,
    resolveReference,
    applyMutation,
  };
}
