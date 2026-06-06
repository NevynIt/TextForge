import { unzipSync, zipSync } from 'fflate';

import {
  textDecoder,
  textEncoder,
  workspaceArchiveFormat,
  workspaceArchiveManifestPath,
  workspaceArchiveVersion,
} from './constants.js';
import {
  dirnameWorkspacePath,
  normalizeWorkspacePath,
} from './paths.js';
import {
  cloneBytes,
  cloneMetadata,
  cloneWorkspaceEntry,
  cloneWorkspaceFolder,
  cloneWorkspaceManifestRecord,
  cloneWorkspaceResource,
  collectDescendants,
  createWorkspaceState,
  snapshotWorkspaceState,
} from './model.js';

function rebaseWorkspacePath(path, basePath) {
  const normalizedPath = normalizeWorkspacePath(path);
  const normalizedBasePath = normalizeWorkspacePath(basePath);
  if (normalizedBasePath === '/') {
    return normalizedPath;
  }

  if (normalizedPath === normalizedBasePath || !normalizedPath.startsWith(`${normalizedBasePath}/`)) {
    throw new Error(`Cannot rebase ${normalizedPath} from ${normalizedBasePath}`);
  }

  return normalizeWorkspacePath(normalizedPath.slice(normalizedBasePath.length));
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
    kind: 'resource',
    representation: resource.representation,
    path: normalizeWorkspacePath(resource.path),
    parentId: resource.parentId,
    metadata: cloneMetadata(resource.metadata),
    archivePath: toArchiveResourcePath(resource.path),
    encoding: resource.representation === 'text' ? 'utf8' : 'binary',
    languageId: resource.representation === 'text' ? resource.languageId : undefined,
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

function collectImportedRootEntries(state) {
  const importedEntries = [...state.folders.filter((folder) => folder.id !== 'root'), ...state.resources];
  const importedIds = new Set(importedEntries.map((entry) => entry.id));
  return importedEntries
    .filter((entry) => !entry.parentId || entry.parentId === 'root' || !importedIds.has(entry.parentId))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function findWorkspaceEntryByPath(folders, resources, path) {
  return [...folders, ...resources].find((entry) => entry.path === path);
}

function minimizeConflictEntries(entries) {
  return entries.filter((entry, index) => !entries.some((candidate, candidateIndex) =>
    candidateIndex !== index
      && candidate.kind === 'folder'
      && entry.path !== candidate.path
      && entry.path.startsWith(`${candidate.path}/`),
  ));
}

function removeWorkspaceEntrySubtree(folders, resources, entry) {
  if (entry.kind !== 'folder') {
    return {
      folders,
      resources: resources.filter((resource) => resource.id !== entry.id),
    };
  }

  const descendants = collectDescendants([...folders, ...resources], entry.id);
  const removedIds = new Set([entry.id, ...descendants.map((descendant) => descendant.id)]);
  return {
    folders: folders.filter((folder) => !removedIds.has(folder.id)),
    resources: resources.filter((resource) => !removedIds.has(resource.id)),
  };
}

function assignUniqueImportedEntryIds(entries, takenIds) {
  const idMap = new Map();
  let counter = 0;

  function createUniqueId(baseId) {
    let candidate = baseId;
    while (takenIds.has(candidate) || idMap.has(candidate)) {
      counter += 1;
      candidate = `${baseId}-import-${counter}`;
    }
    return candidate;
  }

  for (const entry of entries) {
    const nextId = createUniqueId(entry.id);
    idMap.set(entry.id, nextId);
    takenIds.add(nextId);
  }

  return entries.map((entry) => {
    const parentId = entry.parentId && idMap.has(entry.parentId)
      ? idMap.get(entry.parentId)
      : entry.parentId === 'root' || !entry.parentId
        ? 'root'
        : entry.parentId;
    return {
      ...cloneWorkspaceEntry(entry),
      id: idMap.get(entry.id),
      parentId,
      childIds: entry.kind === 'folder' ? [] : undefined,
    };
  });
}

function createWorkspaceFolderArchiveState(input, folderPath) {
  const state = snapshotWorkspaceState(input);
  const normalizedFolderPath = normalizeWorkspacePath(folderPath);
  const selectedFolder = state.folders.find((folder) => folder.id !== 'root' && folder.path === normalizedFolderPath);
  if (!selectedFolder) {
    throw new Error(`Unknown workspace folder for archive export: ${normalizedFolderPath}`);
  }

  const selectionBasePath = dirnameWorkspacePath(normalizedFolderPath);
  const selectedEntries = [selectedFolder, ...collectDescendants([...state.folders, ...state.resources], selectedFolder.id)];
  const selectedIds = new Set(selectedEntries.map((entry) => entry.id));
  const folders = selectedEntries
    .filter((entry) => entry.kind === 'folder')
    .map((folder) => ({
      ...cloneWorkspaceFolder(folder),
      path: rebaseWorkspacePath(folder.path, selectionBasePath),
      parentId: selectedIds.has(folder.parentId) ? folder.parentId : 'root',
      childIds: [],
    }));
  const resources = selectedEntries
    .filter((entry) => entry.kind !== 'folder')
    .map((resource) => ({
      ...cloneWorkspaceResource(resource),
      path: rebaseWorkspacePath(resource.path, selectionBasePath),
      parentId: selectedIds.has(resource.parentId) ? resource.parentId : 'root',
    }));

  return createWorkspaceState(
    {
      ...cloneWorkspaceManifestRecord(state.manifest),
      rootPath: '/',
      selectedResourceId: undefined,
    },
    folders,
    resources,
  );
}

function createWorkspaceFolderZipEntries(input, folderPath) {
  const state = snapshotWorkspaceState(input);
  const normalizedFolderPath = normalizeWorkspacePath(folderPath);
  const selectedFolder = state.folders.find((folder) => folder.id !== 'root' && folder.path === normalizedFolderPath);
  if (!selectedFolder) {
    throw new Error(`Unknown workspace folder for archive export: ${normalizedFolderPath}`);
  }

  const descendants = collectDescendants([...state.folders, ...state.resources], selectedFolder.id);
  const archiveEntries = {};

  for (const folder of descendants.filter((entry) => entry.kind === 'folder')) {
    const relativePath = rebaseWorkspacePath(folder.path, normalizedFolderPath).split('/').filter(Boolean).join('/');
    if (relativePath) {
      archiveEntries[`${relativePath}/`] = new Uint8Array(0);
    }
  }

  for (const resource of descendants.filter((entry) => entry.kind !== 'folder')) {
    const relativePath = rebaseWorkspacePath(resource.path, normalizedFolderPath).split('/').filter(Boolean).join('/');
    archiveEntries[relativePath] = resource.representation === 'text'
      ? textEncoder.encode(resource.text)
      : cloneBytes(resource.bytes);
  }

  return archiveEntries;
}

function collectArchiveParentFolders(path) {
  const segments = normalizeArchiveEntryPath(path).split('/').filter(Boolean);
  const folders = [];
  for (let index = 1; index < segments.length; index += 1) {
    folders.push(segments.slice(0, index).join('/'));
  }
  return folders;
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
    archiveEntries[toArchiveResourcePath(resource.path)] = resource.representation === 'text'
      ? textEncoder.encode(resource.text)
      : cloneBytes(resource.bytes);
  }

  return zipSync(archiveEntries);
}

export function exportWorkspaceFolderToZip(input, folderPath, options = {}) {
  return zipSync(createWorkspaceFolderZipEntries(input, folderPath), options);
}

export function mergeImportedWorkspaceState(existingState, importedState, options = {}) {
  const conflictPolicy = options.conflictPolicy ?? 'error';
  let resultFolders = existingState.folders.filter((folder) => folder.id !== 'root').map((folder) => cloneWorkspaceFolder(folder));
  let resultResources = existingState.resources.map((resource) => cloneWorkspaceResource(resource));
  const normalizedImportedState = createWorkspaceState(
    importedState.manifest,
    importedState.folders,
    importedState.resources,
  );
  const importedEntries = [
    ...normalizedImportedState.folders.filter((folder) => folder.id !== 'root'),
    ...normalizedImportedState.resources,
  ];

  for (const rootEntry of collectImportedRootEntries(normalizedImportedState)) {
    const subtreeEntries = [rootEntry, ...collectDescendants(importedEntries, rootEntry.id)].map((entry) => cloneWorkspaceEntry(entry));
    const conflictingEntries = minimizeConflictEntries(
      subtreeEntries
        .map((entry) => findWorkspaceEntryByPath(resultFolders, resultResources, entry.path))
        .filter(Boolean),
    );

    if (conflictingEntries.length > 0) {
      if (conflictPolicy === 'error') {
        throw new Error(`Workspace import conflict at ${conflictingEntries[0].path}`);
      }

      if (conflictPolicy === 'skip') {
        continue;
      }

      if (conflictPolicy === 'replace') {
        for (const conflictEntry of conflictingEntries) {
          const nextState = removeWorkspaceEntrySubtree(resultFolders, resultResources, conflictEntry);
          resultFolders = nextState.folders;
          resultResources = nextState.resources;
        }
      }
    }

    const takenIds = new Set([...resultFolders, ...resultResources].map((entry) => entry.id));
    const mergedEntries = assignUniqueImportedEntryIds(subtreeEntries, takenIds);
    resultFolders = [...resultFolders, ...mergedEntries.filter((entry) => entry.kind === 'folder')];
    resultResources = [...resultResources, ...mergedEntries.filter((entry) => entry.kind !== 'folder')];
  }

  return createWorkspaceState(existingState.manifest, resultFolders, resultResources);
}

export function importWorkspaceFromZip(bytes, options = {}) {
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

    const representation = resourceRecord.representation
      ?? (resourceRecord.kind === 'text' ? 'text' : undefined)
      ?? (resourceRecord.kind === 'binary' ? 'bytes' : undefined)
      ?? (resourceRecord.encoding === 'utf8' ? 'text' : 'bytes');
    const metadata = cloneMetadata(resourceRecord.metadata);
    const normalizedPath = normalizeWorkspacePath(resourceRecord.path);
    if (representation === 'text') {
      return {
        kind: 'resource',
        representation: 'text',
        id: resourceRecord.id,
        path: normalizedPath,
        parentId: resourceRecord.parentId,
        metadata,
        text: textDecoder.decode(resourceBytes),
        languageId: resourceRecord.languageId,
        mimeType: resourceRecord.mimeType,
      };
    }

    if (representation === 'bytes') {
      return {
        kind: 'resource',
        representation: 'bytes',
        id: resourceRecord.id,
        path: normalizedPath,
        parentId: resourceRecord.parentId,
        metadata,
        bytes: cloneBytes(resourceBytes),
        mimeType: resourceRecord.mimeType,
      };
    }

    throw new Error(`Unsupported workspace resource representation in archive: ${representation}`);
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

  const importedState = createWorkspaceState(
    {
      ...cloneWorkspaceManifestRecord(manifest.workspace),
      rootPath: normalizeWorkspacePath(manifest.workspace.rootPath),
    },
    folders,
    resources,
  );

  const state = options.existingState
    ? mergeImportedWorkspaceState(options.existingState, importedState, options)
    : importedState;

  return {
    manifest: {
      format: manifest.format,
      version: manifest.version,
      exportedAt: manifest.exportedAt,
      workspace: importedState.manifest,
      folders: manifest.folders.map((folderRecord) => ({
        ...folderRecord,
        path: normalizeWorkspacePath(folderRecord.path),
        metadata: cloneMetadata(folderRecord.metadata),
      })),
      resources: manifest.resources.map((resourceRecord) => ({
        ...resourceRecord,
        representation: resourceRecord.representation
          ?? (resourceRecord.kind === 'text' ? 'text' : undefined)
          ?? (resourceRecord.kind === 'binary' ? 'bytes' : undefined),
        path: normalizeWorkspacePath(resourceRecord.path),
        metadata: cloneMetadata(resourceRecord.metadata),
        archivePath: normalizeArchiveEntryPath(resourceRecord.archivePath),
      })),
    },
    state,
  };
}

export function importWorkspaceFolderFromZip(bytes) {
  const archiveEntries = unzipSync(bytes);
  const folders = new Set();
  const files = [];

  for (const [archivePath, archiveBytes] of Object.entries(archiveEntries)) {
    const rawPath = String(archivePath ?? '').replaceAll('\\', '/');
    const isDirectory = rawPath.endsWith('/');
    const normalizedPath = normalizeArchiveEntryPath(rawPath);
    for (const parentFolder of collectArchiveParentFolders(normalizedPath)) {
      folders.add(parentFolder);
    }

    if (isDirectory) {
      folders.add(normalizedPath);
      continue;
    }

    files.push({
      path: normalizedPath,
      bytes: cloneBytes(archiveBytes),
    });
  }

  return {
    folders: [...folders].sort((left, right) => left.localeCompare(right)),
    files: files.sort((left, right) => left.path.localeCompare(right.path)),
  };
}
