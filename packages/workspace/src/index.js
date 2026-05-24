import Dexie from 'dexie';
import { unzipSync, zipSync } from 'fflate';

import {
  createCommand,
  createContributionManifest,
  createResourceBadgeToken,
  createResourceRef,
} from '../../core/src/index.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const workspaceArchiveFormat = 'textforge-workspace-archive';
const workspaceArchiveVersion = 1;
const workspaceArchiveManifestPath = 'textforge-workspace.json';
const workspaceSystemTableName = 'system';
const workspaceFoldersTableName = 'folders';
const workspaceTextResourcesTableName = 'textResources';
const workspaceBinaryResourcesTableName = 'binaryResources';
const workspaceManifestsTableName = 'manifests';
const workspaceSchemaRecordKey = 'workspace-schema-version';
const workspaceSavedAtRecordKey = 'workspace-last-saved-at';
const resourceBadgeShapes = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hex', 'octagon', 'shield'];
const resourceBadgeAccents = ['teal', 'amber', 'sky', 'coral', 'lime', 'slate', 'rose', 'cobalt'];
const resourceBadgeMarks = ['dot', 'bar', 'split', 'ring', 'corner', 'stack', 'plus', 'slash'];
const resourceBadgePlacements = ['center', 'top', 'right', 'bottom', 'left'];

export const workspaceDexieSchemaVersion = 1;
export const defaultWorkspaceDexieDatabaseName = 'textforge-workspace';
export const workspaceStorageErrorCodes = {
  initializationFailed: 'workspace-storage-initialization-failed',
  loadFailed: 'workspace-storage-load-failed',
  saveFailed: 'workspace-storage-save-failed',
  clearFailed: 'workspace-storage-clear-failed',
  deleteFailed: 'workspace-storage-delete-failed',
  corruptedState: 'workspace-storage-corrupted',
  incompatibleState: 'workspace-storage-incompatible',
};

export const workspaceDexieSchema = {
  system: 'key',
  folders: 'id, path, parentId, metadata.createdAt, metadata.updatedAt',
  textResources: 'id, path, parentId, languageId, mimeType, metadata.createdAt, metadata.updatedAt',
  binaryResources: 'id, path, parentId, mimeType, metadata.createdAt, metadata.updatedAt',
  manifests: 'workspaceId, name, rootPath, createdAt, updatedAt, selectedResourceId',
};

export const workspaceCommandContributions = [
  createCommand('workspace.new-folder', 'New folder...', {
    category: 'workspace',
    description: 'Create a folder in the selected workspace context.',
    keywords: ['workspace', 'create', 'folder', 'directory'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 10 },
    toolbar: { order: 20, kind: 'primary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.new-resource', 'New resource...', {
    category: 'workspace',
    description: 'Create a text or binary resource in the selected workspace context.',
    keywords: ['workspace', 'create', 'resource', 'file'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 20 },
    toolbar: { order: 30, kind: 'primary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.import-workspace', 'Import workspace ZIP...', {
    category: 'workspace',
    description: 'Import a workspace archive into the browser-managed workspace.',
    keywords: ['workspace', 'import', 'zip', 'archive'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 30 },
    toolbar: { order: 40, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.export-workspace', 'Export workspace ZIP', {
    category: 'workspace',
    description: 'Export the current browser-managed workspace as a ZIP archive.',
    keywords: ['workspace', 'export', 'zip', 'archive'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 40 },
    toolbar: { order: 50, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.export-selected-folder', 'Export selected folder ZIP', {
    category: 'workspace',
    description: 'Export the selected folder subtree as a ZIP archive rebased at archive root.',
    keywords: ['workspace', 'export', 'folder', 'zip', 'archive'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 50 },
    when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['folder'] },
  }),
  createCommand('workspace.rename-selected', 'Rename selected item...', {
    category: 'workspace',
    description: 'Rename the currently selected folder or resource.',
    keywords: ['workspace', 'rename', 'selected'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 60 },
    when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['folder', 'text', 'binary'] },
  }),
  createCommand('workspace.delete-selected', 'Delete selected item...', {
    category: 'workspace',
    description: 'Delete the currently selected folder or resource.',
    keywords: ['workspace', 'delete', 'remove', 'selected'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 70 },
    when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['folder', 'text', 'binary'] },
  }),
  createCommand('workspace.reset-storage', 'Reset browser workspace...', {
    category: 'workspace',
    description: 'Open the explicit browser-storage reset flow for the persisted workspace.',
    keywords: ['workspace', 'storage', 'reset', 'recovery'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 80 },
    when: { runtimeStatuses: ['ready', 'error'] },
  }),
  createCommand('workspace.retry-storage', 'Retry workspace load', {
    category: 'workspace',
    description: 'Retry browser-managed workspace initialization after a storage failure.',
    keywords: ['workspace', 'retry', 'storage', 'recovery'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 90 },
    when: { runtimeStatuses: ['error'] },
  }),
];

export function createWorkspaceContributionManifest() {
  return createContributionManifest('@textforge/workspace', {
    commands: workspaceCommandContributions,
  });
}

export const workspaceContribution = createWorkspaceContributionManifest();

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
  const normalizedMetadata = metadata ?? {};
  return {
    ...normalizedMetadata,
    tags: normalizedMetadata.tags ? [...normalizedMetadata.tags] : undefined,
    badge: normalizedMetadata.badge ? createResourceBadgeToken({ ...normalizedMetadata.badge }) : undefined,
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

function cloneWorkspaceFolder(folder) {
  return {
    ...folder,
    metadata: cloneMetadata(folder.metadata),
    childIds: [...(folder.childIds ?? [])],
  };
}

function cloneWorkspaceResource(resource) {
  return resource.kind === 'text'
    ? {
      ...resource,
      metadata: cloneMetadata(resource.metadata),
    }
    : {
      ...resource,
      metadata: cloneMetadata(resource.metadata),
      bytes: cloneBytes(resource.bytes),
    };
}

function cloneWorkspaceEntry(entry) {
  return entry.kind === 'folder' ? cloneWorkspaceFolder(entry) : cloneWorkspaceResource(entry);
}

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createWorkspaceBadgeFingerprint(entry) {
  return JSON.stringify({
    id: entry.id,
    kind: entry.kind,
    path: normalizeWorkspacePath(entry.path),
    title: entry.metadata?.title ?? '',
    languageId: entry.kind === 'text' ? entry.languageId ?? '' : '',
    mimeType: entry.kind !== 'folder' ? entry.mimeType ?? '' : '',
  });
}

function createWorkspaceBadgeLabel(token) {
  return `${token.accent} ${token.shape} ${token.mark} ${token.placement}`.trim();
}

function createWorkspaceBadgeDescription(entry, label) {
  const title = entry.metadata?.title ?? basenameWorkspacePath(entry.path) ?? entry.path;
  return `${title} identity badge: ${label}`;
}

function normalizeResourceBadgeToken(entry, badge) {
  if (!badge) {
    return undefined;
  }

  const normalized = createResourceBadgeToken({
    ...badge,
    key: undefined,
    fingerprint: badge.fingerprint ?? createWorkspaceBadgeFingerprint(entry),
    placement: badge.placement,
    variant: badge.variant ?? 0,
  });
  return createResourceBadgeToken({
    ...normalized,
    key: `${normalized.shape}-${normalized.accent}-${normalized.mark}-${normalized.placement}`,
    label: badge.label ?? createWorkspaceBadgeLabel(normalized),
    description: badge.description ?? createWorkspaceBadgeDescription(entry, badge.label ?? createWorkspaceBadgeLabel(normalized)),
  });
}

function createWorkspaceBadgeToken(entry, variant = 0, repairedFromKey) {
  const fingerprint = createWorkspaceBadgeFingerprint(entry);
  const hash = hashText(`${fingerprint}:${variant}`);
  const maxVariants = resourceBadgeShapes.length
    * resourceBadgeAccents.length
    * resourceBadgeMarks.length
    * resourceBadgePlacements.length;
  const baseIndex = hash % maxVariants;
  const shape = resourceBadgeShapes[baseIndex % resourceBadgeShapes.length];
  const accent = resourceBadgeAccents[Math.floor(baseIndex / resourceBadgeShapes.length) % resourceBadgeAccents.length];
  const mark = resourceBadgeMarks[
    Math.floor(baseIndex / (resourceBadgeShapes.length * resourceBadgeAccents.length)) % resourceBadgeMarks.length
  ];
  const placement = resourceBadgePlacements[
    Math.floor(baseIndex / (resourceBadgeShapes.length * resourceBadgeAccents.length * resourceBadgeMarks.length))
      % resourceBadgePlacements.length
  ];
  const token = createResourceBadgeToken({
    key: `${shape}-${accent}-${mark}-${placement}`,
    fingerprint,
    shape,
    accent,
    mark,
    placement,
    variant,
    repairedFromKey,
  });
  return createResourceBadgeToken({
    ...token,
    label: createWorkspaceBadgeLabel(token),
    description: createWorkspaceBadgeDescription(entry, createWorkspaceBadgeLabel(token)),
  });
}

function compareWorkspaceBadgeDescriptors(left, right) {
  if (left.hasStableBadge !== right.hasStableBadge) {
    return left.hasStableBadge ? -1 : 1;
  }

  const createdAt = (left.entry.metadata?.createdAt ?? '').localeCompare(right.entry.metadata?.createdAt ?? '');
  if (createdAt !== 0) {
    return createdAt;
  }

  const pathComparison = left.entry.path.localeCompare(right.entry.path);
  if (pathComparison !== 0) {
    return pathComparison;
  }

  if (left.entry.kind !== right.entry.kind) {
    return left.entry.kind.localeCompare(right.entry.kind);
  }

  return left.entry.id.localeCompare(right.entry.id);
}

function findAvailableWorkspaceBadge(entry, preferredBadge, usedKeys) {
  const maxVariants = resourceBadgeShapes.length
    * resourceBadgeAccents.length
    * resourceBadgeMarks.length
    * resourceBadgePlacements.length;
  for (let variant = (preferredBadge.variant ?? 0) + 1; variant < maxVariants + 8; variant += 1) {
    const candidate = createWorkspaceBadgeToken(entry, variant, preferredBadge.key);
    if (!usedKeys.has(candidate.key)) {
      return candidate;
    }
  }

  return createResourceBadgeToken({
    ...createWorkspaceBadgeToken(entry, (preferredBadge.variant ?? 0) + maxVariants + 8, preferredBadge.key),
    key: `${preferredBadge.key}-${entry.id}`,
  });
}

function assignWorkspaceBadges(folders, resources) {
  const descriptors = [...folders, ...resources].map((entry) => {
    const storedBadge = normalizeResourceBadgeToken(entry, entry.metadata?.badge);
    const fingerprint = createWorkspaceBadgeFingerprint(entry);
    return {
      entry,
      fingerprint,
      storedBadge,
      hasStableBadge: Boolean(storedBadge && storedBadge.fingerprint === fingerprint && storedBadge.key),
    };
  }).sort(compareWorkspaceBadgeDescriptors);

  const usedKeys = new Set();
  const assignedById = new Map();

  for (const descriptor of descriptors) {
    const preferredBadge = descriptor.hasStableBadge
      ? descriptor.storedBadge
      : createWorkspaceBadgeToken(descriptor.entry, 0);
    const assignedBadge = usedKeys.has(preferredBadge.key)
      ? findAvailableWorkspaceBadge(descriptor.entry, preferredBadge, usedKeys)
      : preferredBadge;
    usedKeys.add(assignedBadge.key);
    assignedById.set(descriptor.entry.id, assignedBadge);
  }

  return {
    folders: folders.map((folder) => ({
      ...folder,
      metadata: {
        ...folder.metadata,
        badge: assignedById.get(folder.id),
      },
    })),
    resources: resources.map((resource) => ({
      ...resource,
      metadata: {
        ...resource.metadata,
        badge: assignedById.get(resource.id),
      },
    })),
  };
}

function createWorkspaceState(manifest, folders, resources) {
  const nextManifest = {
    ...cloneWorkspaceManifestRecord(manifest),
    rootPath: normalizeWorkspacePath(manifest.rootPath ?? '/'),
  };
  const nextFolders = folders
    .filter((folder) => folder.id !== 'root')
    .map((folder) => ({
      ...cloneWorkspaceFolder(folder),
      path: normalizeWorkspacePath(folder.path),
      childIds: [],
    }));
  const nextResources = resources.map((resource) => ({
    ...cloneWorkspaceResource(resource),
    path: normalizeWorkspacePath(resource.path),
  }));
  const badgedState = assignWorkspaceBadges(nextFolders, nextResources);
  const rootFolder = {
    kind: 'folder',
    id: 'root',
    path: nextManifest.rootPath,
    parentId: undefined,
    metadata: {
      title: nextManifest.name,
      createdAt: nextManifest.createdAt,
      updatedAt: nextManifest.updatedAt,
    },
    childIds: [],
  };

  return {
    manifest: nextManifest,
    folders: rebuildFolderChildren([rootFolder, ...badgedState.folders], badgedState.resources),
    resources: badgedState.resources,
  };
}

function cloneWorkspaceState(state) {
  return createWorkspaceState(state.manifest, state.folders, state.resources);
}

function createWorkspaceStorageError(code, message, cause) {
  const error = new Error(message);
  error.name = 'WorkspaceStorageError';
  error.code = code;
  if (cause !== undefined) {
    error.cause = cause;
  }
  return error;
}

function cloneWorkspaceStorageErrorSnapshot(error) {
  if (!error) {
    return undefined;
  }

  return {
    code: error.code ?? workspaceStorageErrorCodes.saveFailed,
    message: error.message,
  };
}

function getWorkspaceDexieTables(database) {
  return {
    system: database.table(workspaceSystemTableName),
    folders: database.table(workspaceFoldersTableName),
    textResources: database.table(workspaceTextResourcesTableName),
    binaryResources: database.table(workspaceBinaryResourcesTableName),
    manifests: database.table(workspaceManifestsTableName),
  };
}

function createWorkspaceDexieDatabase(databaseName = defaultWorkspaceDexieDatabaseName) {
  const database = new Dexie(databaseName);
  database.version(workspaceDexieSchemaVersion).stores(workspaceDexieSchema);
  return database;
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
    badge: entry.metadata?.badge,
  });
}

export function workspaceEntryToResourceRef(entry) {
  return toResourceRef(entry);
}

function describeWorkspaceEntryDetail(entry) {
  if (entry.kind === 'folder') {
    const childCount = entry.childIds.length;
    return `${childCount} item${childCount === 1 ? '' : 's'}`;
  }

  if (entry.kind === 'text') {
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

  return 'BINARY';
}

export function listWorkspaceBadgeDiagnostics(input) {
  const state = snapshotWorkspaceState(input);
  return [...state.folders.filter((folder) => folder.id !== 'root'), ...state.resources]
    .filter((entry) => entry.metadata?.badge?.repairedFromKey)
    .map((entry) => ({
      resourceId: entry.id,
      path: entry.path,
      kind: entry.kind,
      badge: entry.metadata.badge,
      previousKey: entry.metadata.badge.repairedFromKey,
      nextKey: entry.metadata.badge.key,
      message: `Resource badge collision repaired for ${entry.path}.`,
    }));
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

export function exportWorkspaceFolderToZip(input, folderPath, options = {}) {
  return exportWorkspaceToZip(createWorkspaceFolderArchiveState(input, folderPath), options);
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
        path: normalizeWorkspacePath(resourceRecord.path),
        metadata: cloneMetadata(resourceRecord.metadata),
        archivePath: normalizeArchiveEntryPath(resourceRecord.archivePath),
      })),
    },
    state,
  };
}

function createDefaultWorkspaceSeedState(options = {}) {
  if (options.seed) {
    return cloneWorkspaceState(snapshotWorkspaceState(
      typeof options.seed === 'function' ? options.seed() : options.seed,
    ));
  }

  if (options.state) {
    return cloneWorkspaceState(snapshotWorkspaceState(options.state));
  }

  return createWorkspaceService(options).snapshot();
}

export async function openWorkspaceDexieStorage(options = {}) {
  const databaseName = options.databaseName ?? defaultWorkspaceDexieDatabaseName;
  const database = createWorkspaceDexieDatabase(databaseName);

  try {
    await database.open();
  } catch (cause) {
    database.close();
    throw createWorkspaceStorageError(
      workspaceStorageErrorCodes.initializationFailed,
      `Unable to open workspace browser storage ${databaseName}.`,
      cause,
    );
  }

  const tables = getWorkspaceDexieTables(database);

  async function loadState() {
    let records;
    try {
      records = await database.transaction(
        'r',
        tables.system,
        tables.manifests,
        tables.folders,
        tables.textResources,
        tables.binaryResources,
        async () => ({
          schemaRecord: await tables.system.get(workspaceSchemaRecordKey),
          lastSavedAtRecord: await tables.system.get(workspaceSavedAtRecordKey),
          manifestRecords: await tables.manifests.toArray(),
          folderRecords: await tables.folders.toArray(),
          textResourceRecords: await tables.textResources.toArray(),
          binaryResourceRecords: await tables.binaryResources.toArray(),
        }),
      );
    } catch (cause) {
      throw createWorkspaceStorageError(
        workspaceStorageErrorCodes.loadFailed,
        `Unable to read workspace browser storage ${databaseName}.`,
        cause,
      );
    }

    const hasAnyRecords = Boolean(records.schemaRecord || records.lastSavedAtRecord)
      || records.manifestRecords.length > 0
      || records.folderRecords.length > 0
      || records.textResourceRecords.length > 0
      || records.binaryResourceRecords.length > 0;
    if (!hasAnyRecords) {
      return undefined;
    }

    if (!records.schemaRecord) {
      throw createWorkspaceStorageError(
        workspaceStorageErrorCodes.corruptedState,
        'Persisted workspace state is missing the schema version record.',
      );
    }

    if (records.schemaRecord.value !== workspaceDexieSchemaVersion) {
      throw createWorkspaceStorageError(
        workspaceStorageErrorCodes.incompatibleState,
        `Persisted workspace schema version ${records.schemaRecord.value} is not supported.`,
      );
    }

    if (records.manifestRecords.length !== 1) {
      throw createWorkspaceStorageError(
        workspaceStorageErrorCodes.corruptedState,
        `Persisted workspace expected exactly one manifest record, found ${records.manifestRecords.length}.`,
      );
    }

    return createWorkspaceState(
      records.manifestRecords[0],
      records.folderRecords.map((folder) => ({
        ...cloneWorkspaceFolder(folder),
        childIds: [],
      })),
      [
        ...records.textResourceRecords.map((resource) => cloneWorkspaceResource(resource)),
        ...records.binaryResourceRecords.map((resource) => cloneWorkspaceResource(resource)),
      ],
    );
  }

  async function saveState(input) {
    const state = cloneWorkspaceState(snapshotWorkspaceState(input));
    const savedAt = state.manifest.updatedAt;
    const textResources = state.resources
      .filter((resource) => resource.kind === 'text')
      .map((resource) => cloneWorkspaceResource(resource));
    const binaryResources = state.resources
      .filter((resource) => resource.kind === 'binary')
      .map((resource) => cloneWorkspaceResource(resource));

    try {
      await database.transaction(
        'rw',
        tables.system,
        tables.manifests,
        tables.folders,
        tables.textResources,
        tables.binaryResources,
        async () => {
          await Promise.all([
            tables.system.clear(),
            tables.manifests.clear(),
            tables.folders.clear(),
            tables.textResources.clear(),
            tables.binaryResources.clear(),
          ]);
          await tables.system.bulkPut([
            { key: workspaceSchemaRecordKey, value: workspaceDexieSchemaVersion },
            { key: workspaceSavedAtRecordKey, value: savedAt },
          ]);
          await tables.manifests.put(cloneWorkspaceManifestRecord(state.manifest));
          if (state.folders.length > 0) {
            await tables.folders.bulkPut(state.folders.map((folder) => cloneWorkspaceFolder(folder)));
          }
          if (textResources.length > 0) {
            await tables.textResources.bulkPut(textResources);
          }
          if (binaryResources.length > 0) {
            await tables.binaryResources.bulkPut(binaryResources);
          }
        },
      );
    } catch (cause) {
      throw createWorkspaceStorageError(
        workspaceStorageErrorCodes.saveFailed,
        `Unable to write workspace browser storage ${databaseName}.`,
        cause,
      );
    }

    return state;
  }

  async function clear() {
    try {
      await database.transaction(
        'rw',
        tables.system,
        tables.manifests,
        tables.folders,
        tables.textResources,
        tables.binaryResources,
        async () => {
          await Promise.all([
            tables.system.clear(),
            tables.manifests.clear(),
            tables.folders.clear(),
            tables.textResources.clear(),
            tables.binaryResources.clear(),
          ]);
        },
      );
    } catch (cause) {
      throw createWorkspaceStorageError(
        workspaceStorageErrorCodes.clearFailed,
        `Unable to clear workspace browser storage ${databaseName}.`,
        cause,
      );
    }
  }

  return {
    kind: 'indexeddb',
    driver: 'dexie',
    browserManaged: true,
    databaseName,
    schemaVersion: workspaceDexieSchemaVersion,
    loadState,
    saveState,
    clear,
    async delete() {
      try {
        database.close();
        await Dexie.delete(databaseName);
      } catch (cause) {
        throw createWorkspaceStorageError(
          workspaceStorageErrorCodes.deleteFailed,
          `Unable to delete workspace browser storage ${databaseName}.`,
          cause,
        );
      }
    },
    close() {
      database.close();
    },
  };
}

export async function resetWorkspaceDexieStorage(options = {}) {
  const databaseName = options.databaseName ?? defaultWorkspaceDexieDatabaseName;

  try {
    await Dexie.delete(databaseName);
  } catch (cause) {
    throw createWorkspaceStorageError(
      workspaceStorageErrorCodes.deleteFailed,
      `Unable to delete workspace browser storage ${databaseName}.`,
      cause,
    );
  }
}

export function createPersistentWorkspaceService(baseWorkspace, storage, options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const listeners = new Set();
  let pendingState;
  let pendingReason;
  let flushQueued = false;
  let writeChain = Promise.resolve(baseWorkspace.snapshot());
  let persistenceStatus = {
    state: 'idle',
    driver: storage.driver ?? 'dexie',
    databaseName: storage.databaseName,
    schemaVersion: storage.schemaVersion ?? workspaceDexieSchemaVersion,
    browserManaged: storage.browserManaged !== false,
    lastSavedAt: baseWorkspace.getManifest().updatedAt,
    pendingReason: undefined,
    error: undefined,
  };

  function emitPersistence() {
    for (const listener of listeners) {
      listener();
    }
  }

  function getPersistenceStatus() {
    return {
      ...persistenceStatus,
      error: cloneWorkspaceStorageErrorSnapshot(persistenceStatus.error),
    };
  }

  async function flushPendingPersistence() {
    while (pendingState) {
      const stateToPersist = pendingState;
      const reasonToPersist = pendingReason;
      pendingState = undefined;
      pendingReason = undefined;

      try {
        const persistedState = await storage.saveState(stateToPersist);
        persistenceStatus = {
          ...persistenceStatus,
          state: 'idle',
          lastSavedAt: persistedState.manifest.updatedAt ?? now(),
          pendingReason: undefined,
          error: undefined,
        };
        emitPersistence();
      } catch (error) {
        flushQueued = false;
        persistenceStatus = {
          ...persistenceStatus,
          state: 'error',
          pendingReason: reasonToPersist,
          error,
        };
        emitPersistence();
        throw error;
      }
    }

    flushQueued = false;
    return baseWorkspace.snapshot();
  }

  function queuePersistence(reason = 'mutation') {
    pendingState = baseWorkspace.snapshot();
    pendingReason = reason;
    persistenceStatus = {
      ...persistenceStatus,
      state: 'persisting',
      pendingReason: reason,
      error: undefined,
    };
    emitPersistence();

    if (!flushQueued) {
      flushQueued = true;
      writeChain = writeChain.then(flushPendingPersistence, flushPendingPersistence);
    }

    return writeChain;
  }

  function persistLater(reason) {
    void queuePersistence(reason).catch(() => undefined);
  }

  function wrapMutation(methodName, reason) {
    return (...args) => {
      const result = baseWorkspace[methodName](...args);
      persistLater(reason);
      return result;
    };
  }

  return {
    workspaceId: baseWorkspace.workspaceId,
    storage,
    snapshot: () => baseWorkspace.snapshot(),
    query: (queryValue) => baseWorkspace.query(queryValue),
    getEntry: (resourceId) => baseWorkspace.getEntry(resourceId),
    getEntryByPath: (path) => baseWorkspace.getEntryByPath(path),
    getManifest: () => baseWorkspace.getManifest(),
    createFolder: wrapMutation('createFolder', 'create-folder'),
    createTextResource: wrapMutation('createTextResource', 'create-text'),
    createBinaryResource: wrapMutation('createBinaryResource', 'create-binary'),
    saveTextResource: wrapMutation('saveTextResource', 'save-text'),
    saveBinaryResource: wrapMutation('saveBinaryResource', 'save-binary'),
    renameEntry: wrapMutation('renameEntry', 'rename-entry'),
    moveEntry: wrapMutation('moveEntry', 'move-entry'),
    deleteEntry: wrapMutation('deleteEntry', 'delete-entry'),
    replaceState: wrapMutation('replaceState', 'replace-state'),
    setSelectedResourceId: wrapMutation('setSelectedResourceId', 'select-resource'),
    resolveReference: (source, reference) => baseWorkspace.resolveReference(source, reference),
    applyMutation: wrapMutation('applyMutation', 'apply-mutation'),
    getPersistenceStatus,
    subscribePersistence(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    whenIdle() {
      return writeChain.then(() => baseWorkspace.snapshot(), () => {
        throw persistenceStatus.error;
      });
    },
    persistNow(reason = 'manual') {
      return queuePersistence(reason);
    },
    async resetPersistence(nextState) {
      await storage.clear();
      baseWorkspace.replaceState(nextState ?? createDefaultWorkspaceSeedState({
        workspaceId: baseWorkspace.workspaceId,
        name: baseWorkspace.getManifest().name,
        rootPath: baseWorkspace.getManifest().rootPath,
        now,
      }));
      return queuePersistence('reset-storage');
    },
    disposePersistence() {
      listeners.clear();
      storage.close?.();
    },
  };
}

export async function createPersistedWorkspaceService(options = {}) {
  const storage = options.storage ?? await openWorkspaceDexieStorage(options.storageOptions);
  let loadedState;

  try {
    loadedState = await storage.loadState();
    const hydrationSource = loadedState ? 'storage' : 'seed';
    const baseWorkspace = createWorkspaceService({
      ...options,
      state: loadedState ?? createDefaultWorkspaceSeedState(options),
    });
    const workspace = createPersistentWorkspaceService(baseWorkspace, storage, options);

    if (!loadedState) {
      await workspace.persistNow('seed');
    }

    return {
      hydrationSource,
      storage,
      workspace,
    };
  } catch (error) {
    storage.close?.();
    throw error;
  }
}

export function createWorkspaceTreeItems(state) {
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
      depth,
      expanded: entry.kind === 'folder' ? (entry.childIds.length > 0) : false,
      active: state.manifest.selectedResourceId === entry.id,
      badge: entry.metadata.badge,
      detail: describeWorkspaceEntryDetail(entry),
      attention: entry.metadata?.badge?.repairedFromKey ? 'warning' : undefined,
    };
  });
}

export function createWorkspaceService(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const initialState = createWorkspaceState(
    options.state?.manifest ?? createWorkspaceManifest(options),
    options.state?.folders ?? [],
    options.state?.resources ?? [],
  );
  let manifest = initialState.manifest;
  let folders = initialState.folders;
  let resources = initialState.resources;
  let existingIds = new Set();
  const baseIdFactory = options.idFactory ?? createSequentialIdFactory(
    options.workspaceId ?? manifest.workspaceId ?? 'workspace-entry',
  );

  function rebuildKnownIds() {
    existingIds = new Set(allEntries().map((entry) => entry.id));
  }

  function createUniqueId() {
    let nextId = baseIdFactory();
    while (existingIds.has(nextId)) {
      nextId = baseIdFactory();
    }
    existingIds.add(nextId);
    return nextId;
  }

  function allEntries() {
    return [...folders, ...resources];
  }

  function touchManifest(updatedAt = now(), selectedResourceId = manifest.selectedResourceId) {
    manifest = {
      ...manifest,
      updatedAt,
      selectedResourceId,
    };
  }

  function normalizeSelectedResourceId(selectedResourceId) {
    if (!selectedResourceId) {
      return undefined;
    }

    return allEntries().some((entry) => entry.id === selectedResourceId) ? selectedResourceId : undefined;
  }

  function applyState(nextState) {
    const normalizedState = createWorkspaceState(
      nextState.manifest ?? createWorkspaceManifest(options),
      nextState.folders ?? [],
      nextState.resources ?? [],
    );
    manifest = normalizedState.manifest;
    folders = normalizedState.folders;
    resources = normalizedState.resources;
    manifest = {
      ...manifest,
      selectedResourceId: normalizeSelectedResourceId(manifest.selectedResourceId),
    };
    rebuildKnownIds();
    return snapshot();
  }

  function refreshStructure() {
    const normalizedState = createWorkspaceState(manifest, folders, resources);
    manifest = normalizedState.manifest;
    folders = normalizedState.folders;
    resources = normalizedState.resources;
    manifest = {
      ...manifest,
      selectedResourceId: normalizeSelectedResourceId(manifest.selectedResourceId),
    };
    rebuildKnownIds();
  }

  function snapshot() {
    return cloneWorkspaceState({
      manifest,
      folders,
      resources,
    });
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
    const nextFolder = createFolderEntry(input, now, createUniqueId, parent?.id);
    folders = [...folders, nextFolder];
    touchManifest(nextFolder.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextFolder.id);
  }

  function createTextResource(input) {
    const parent = resolveParentFolder(input.path);
    const nextResource = createTextEntry(input, now, createUniqueId, parent?.id);
    resources = [...resources, nextResource];
    touchManifest(nextResource.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
  }

  function createBinaryResource(input) {
    const parent = resolveParentFolder(input.path);
    const nextResource = createBinaryEntry(input, now, createUniqueId, parent?.id);
    resources = [...resources, nextResource];
    touchManifest(nextResource.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
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
    touchManifest(nextResource.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
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
    touchManifest(nextResource.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
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
      touchManifest(updatedAt);
      refreshStructure();
      return getEntry(patchedFolder.id);
    }

    const parent = resolveParentFolder(nextPath);
    const nextResource = {
      ...current,
      path: nextPath,
      parentId: parent?.id,
      metadata: { ...current.metadata, updatedAt },
    };
    resources = replaceById(resources, nextResource);
    touchManifest(updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
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
      const descendants = collectDescendants(allEntries(), current.id);
      for (const descendant of descendants) {
        if (descendant.kind === 'folder') {
          folders = removeById(folders, descendant.id);
        } else {
          resources = removeById(resources, descendant.id);
        }
      }
      folders = removeById(folders, current.id);
      const removedIds = new Set([current.id, ...descendants.map((entry) => entry.id)]);
      if (removedIds.has(manifest.selectedResourceId)) {
        touchManifest(now(), undefined);
      } else {
        touchManifest();
      }
      refreshStructure();
      return true;
    }

    resources = removeById(resources, current.id);
    if (manifest.selectedResourceId === current.id) {
      touchManifest(now(), undefined);
    } else {
      touchManifest();
    }
    refreshStructure();
    return true;
  }

  function getManifest() {
    return cloneWorkspaceManifestRecord(manifest);
  }

  function replaceState(nextState) {
    return applyState(snapshotWorkspaceState(nextState));
  }

  function setSelectedResourceId(resourceId) {
    const nextSelectedResourceId = normalizeSelectedResourceId(resourceId);
    touchManifest(now(), nextSelectedResourceId);
    return getManifest();
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

  rebuildKnownIds();

  return {
    workspaceId: manifest.workspaceId,
    snapshot,
    query,
    getEntry,
    getEntryByPath,
    getManifest,
    createFolder,
    createTextResource,
    createBinaryResource,
    saveTextResource,
    saveBinaryResource,
    renameEntry,
    moveEntry,
    deleteEntry,
    replaceState,
    setSelectedResourceId,
    resolveReference,
    applyMutation,
  };
}
