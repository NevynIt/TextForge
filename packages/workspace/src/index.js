import Dexie from 'dexie';
import { unzipSync, zipSync } from 'fflate';

import {
  createCommand,
  createContributionManifest,
  createResourceBadgeToken,
  createResourceRef,
  hasResourceCapability,
} from '@textforge/core';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const workspaceArchiveFormat = 'textforge-workspace-archive';
const workspaceArchiveVersion = 1;
const workspaceArchiveManifestPath = 'textforge-workspace.json';
const workspaceSystemTableName = 'system';
const workspaceFoldersTableName = 'folders';
const workspaceResourcesTableName = 'resources';
const workspaceLegacyTextResourcesTableName = 'textResources';
const workspaceLegacyBinaryResourcesTableName = 'binaryResources';
const workspaceManifestsTableName = 'manifests';
const workspaceSchemaRecordKey = 'workspace-schema-version';
const workspaceSavedAtRecordKey = 'workspace-last-saved-at';
const resourceBadgeShapes = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hex', 'octagon', 'shield'];
const resourceBadgeAccents = ['teal', 'amber', 'sky', 'coral', 'lime', 'slate', 'rose', 'cobalt'];
const resourceBadgeMarks = ['dot', 'bar', 'split', 'ring', 'corner', 'stack', 'plus', 'slash'];
const resourceBadgePlacements = ['center', 'top', 'right', 'bottom', 'left'];
const workspaceRepositoryUriPattern = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/(.*)$/u;
const workspaceBundledRootPath = '/.textforge/resources';

const legacyWorkspaceDexieSchema = {
  system: 'key',
  folders: 'id, path, parentId, metadata.createdAt, metadata.updatedAt',
  textResources: 'id, path, parentId, languageId, mimeType, metadata.createdAt, metadata.updatedAt',
  binaryResources: 'id, path, parentId, mimeType, metadata.createdAt, metadata.updatedAt',
  manifests: 'workspaceId, name, rootPath, createdAt, updatedAt, selectedResourceId',
};

export const workspaceDexieSchemaVersion = 2;
export const defaultWorkspaceDexieDatabaseName = 'textforge-workspace';
export const workspaceProviderIds = {
  local: 'workspace-local',
  bundled: 'bundled-docs',
  generated: 'generated-artifact',
};

export function createDefaultWorkspaceRepositoryRoots() {
  return [
    {
      id: 'workspace-local-root',
      providerId: workspaceProviderIds.local,
      scheme: 'workspace',
      rootPath: '/',
      label: 'Writable workspace root',
      allowed: true,
      available: true,
    },
    {
      id: 'bundled-docs-root',
      providerId: workspaceProviderIds.bundled,
      scheme: 'bundled',
      rootPath: workspaceBundledRootPath,
      label: 'Bundled docs root',
      allowed: true,
      available: true,
    },
  ];
}
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
  resources: 'id, path, parentId, representation, languageId, mimeType, metadata.createdAt, metadata.updatedAt',
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
  createCommand('workspace.upload-file', 'Upload file to selected folder...', {
    category: 'workspace',
    description: 'Upload a local file into the selected workspace folder without replacing the whole workspace.',
    keywords: ['workspace', 'upload', 'file', 'import'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 25 },
    toolbar: { order: 35, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.import-workspace', 'Import workspace dump ZIP...', {
    category: 'workspace',
    description: 'Import a workspace archive into the browser-managed workspace.',
    keywords: ['workspace', 'import', 'zip', 'archive', 'dump'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 30 },
    toolbar: { order: 40, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.import-folder-zip', 'Import ZIP as folder...', {
    category: 'workspace',
    description: 'Import a plain ZIP file into the selected folder context without requiring a TextForge workspace manifest.',
    keywords: ['workspace', 'import', 'folder', 'zip', 'upload'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 35 },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.export-workspace', 'Download workspace dump ZIP', {
    category: 'workspace',
    description: 'Export the current browser-managed workspace as a ZIP archive.',
    keywords: ['workspace', 'export', 'zip', 'archive', 'download', 'dump'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 40 },
    toolbar: { order: 50, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.export-selected-folder', 'Download selected folder as ZIP', {
    category: 'workspace',
    description: 'Download the selected folder subtree as a plain ZIP file tree without TextForge workspace metadata.',
    keywords: ['workspace', 'export', 'folder', 'zip', 'archive', 'download'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 50 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['folder'],
      selectionCapabilityIds: ['resource.export'],
    },
  }),
  createCommand('workspace.download-selected-file', 'Download selected file', {
    category: 'workspace',
    description: 'Download the selected workspace file directly without exporting the whole workspace.',
    keywords: ['workspace', 'download', 'export', 'file'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 55 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionCapabilityIds: ['resource.export'],
    },
  }),
  createCommand('workspace.copy-selected-resource', 'Copy selected resource into workspace', {
    category: 'workspace',
    description: 'Create an editable workspace copy of the selected provider-backed resource.',
    keywords: ['workspace', 'copy', 'resource', 'provider', 'bundled'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 58 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionCapabilityIds: ['resource.copy'],
    },
  }),
  createCommand('workspace.rename-selected', 'Rename selected item...', {
    category: 'workspace',
    description: 'Rename the currently selected folder or resource.',
    keywords: ['workspace', 'rename', 'selected'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 60 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['folder', 'resource'],
      selectionCapabilityIds: ['resource.rename'],
    },
  }),
  createCommand('workspace.delete-selected', 'Delete selected item...', {
    category: 'workspace',
    description: 'Delete the currently selected folder or resource.',
    keywords: ['workspace', 'delete', 'remove', 'selected'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 70 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['folder', 'resource'],
      selectionCapabilityIds: ['resource.delete'],
    },
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

function looksLikeWorkspacePath(path) {
  return typeof path === 'string' && path.startsWith('/');
}

function looksLikeUrl(value) {
  return workspaceRepositoryUriPattern.test(String(value ?? ''));
}

function normalizeRepositoryLocationString(value) {
  return String(value ?? '').trim();
}

function joinRepositoryLocation(base, suffix) {
  if (!suffix) {
    return base;
  }

  if (looksLikeWorkspacePath(base)) {
    return joinWorkspacePath(base, suffix);
  }

  return `${String(base).replace(/[\\/]+$/u, '')}/${String(suffix).replace(/^[/\\]+/u, '')}`;
}

function normalizeWorkspaceRepositoryRoot(root) {
  const scheme = String(root?.scheme ?? '').trim().toLowerCase();
  if (!scheme) {
    return undefined;
  }

  return {
    ...root,
    id: String(root?.id ?? `${root?.providerId ?? 'workspace'}:${scheme}`),
    providerId: root?.providerId ?? workspaceProviderIds.local,
    scheme,
    rootPath: normalizeWorkspacePath(root?.rootPath ?? '/'),
    allowed: root?.allowed !== false,
    available: root?.available !== false,
  };
}

function listWorkspaceRepositoryRoots(options = {}) {
  const customRoots = (options.repositoryRoots ?? [])
    .map((root) => normalizeWorkspaceRepositoryRoot(root))
    .filter(Boolean);
  const defaults = createDefaultWorkspaceRepositoryRoots()
    .map((root) => normalizeWorkspaceRepositoryRoot(root))
    .filter(Boolean);
  return [...customRoots, ...defaults];
}

function findWorkspaceRepositoryRootByPath(path, roots) {
  const normalizedPath = normalizeWorkspacePath(path);
  return roots
    .filter((root) =>
      normalizedPath === root.rootPath
      || normalizedPath.startsWith(`${root.rootPath === '/' ? '' : root.rootPath}/`))
    .sort((left, right) => right.rootPath.length - left.rootPath.length)[0];
}

function findWorkspaceRepositoryRootByScheme(scheme, roots) {
  const normalizedScheme = String(scheme ?? '').trim().toLowerCase();
  if (!normalizedScheme) {
    return undefined;
  }

  return roots.find((root) =>
    root.scheme === normalizedScheme
    || String(root.providerId ?? '').trim().toLowerCase() === normalizedScheme);
}

function createResolvedWorkspaceRepositoryLocation(input) {
  const root = input.root;
  const allowed = input.allowed ?? root?.allowed ?? true;
  const available = input.available ?? root?.available ?? true;
  const status = input.status ?? (
    allowed === false
      ? 'unauthorized'
      : available === false
        ? 'unavailable'
        : 'resolved'
  );
  const resolvedPath = input.resolvedPath ? normalizeWorkspacePath(input.resolvedPath) : undefined;
  return {
    requestedLocation: input.requestedLocation,
    source: input.source,
    status,
    providerId: input.providerId ?? root?.providerId,
    rootId: input.rootId ?? root?.id,
    resolvedPath,
    resolvedLocation: input.resolvedLocation ?? resolvedPath,
    allowed,
    available,
  };
}

function resolveWorkspaceRepositoryAlias(location, options = {}, seen) {
  const aliases = options.repositoryAliases ?? {};
  const normalizedLocation = normalizeRepositoryLocationString(location);
  const aliasEntries = Object.entries(aliases)
    .filter(([alias]) =>
      normalizedLocation === normalizeRepositoryLocationString(alias)
      || normalizedLocation.startsWith(`${normalizeRepositoryLocationString(alias)}/`))
    .sort((left, right) => right[0].length - left[0].length);

  const [matchedAlias, matchedEntry] = aliasEntries[0] ?? [];
  if (!matchedAlias) {
    return undefined;
  }

  const aliasKey = normalizeRepositoryLocationString(matchedAlias);
  const suffix = normalizedLocation === aliasKey ? '' : normalizedLocation.slice(aliasKey.length + 1);
  const alias = typeof matchedEntry === 'string'
    ? { location: matchedEntry }
    : matchedEntry;
  const nextLocation = joinRepositoryLocation(alias.location, suffix);
  const aliasCycleKey = `alias:${aliasKey}:${nextLocation}`;
  if (seen.has(aliasCycleKey)) {
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation: normalizedLocation,
      source: 'alias',
      status: 'unsupported',
      allowed: false,
      available: false,
    });
  }

  seen.add(aliasCycleKey);
  const resolved = resolveWorkspaceRepositoryLocation(nextLocation, options, seen);
  return createResolvedWorkspaceRepositoryLocation({
    requestedLocation: normalizedLocation,
    source: 'alias',
    providerId: resolved.providerId,
    rootId: resolved.rootId,
    resolvedPath: resolved.resolvedPath,
    resolvedLocation: resolved.resolvedLocation,
    allowed: alias.allowed ?? resolved.allowed,
    available: alias.available ?? resolved.available,
  });
}

export function resolveWorkspaceRepositoryLocation(location, options = {}, seen = new Set()) {
  const requestedLocation = normalizeRepositoryLocationString(location);
  if (!requestedLocation) {
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'logical',
      status: 'unsupported',
      allowed: false,
      available: false,
    });
  }

  const aliasResolution = resolveWorkspaceRepositoryAlias(requestedLocation, options, seen);
  if (aliasResolution) {
    return aliasResolution;
  }

  const roots = listWorkspaceRepositoryRoots(options);
  if (looksLikeWorkspacePath(requestedLocation)) {
    const resolvedPath = normalizeWorkspacePath(requestedLocation);
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'workspace-path',
      root: findWorkspaceRepositoryRootByPath(resolvedPath, roots),
      resolvedPath,
    });
  }

  if (requestedLocation.startsWith('./') || requestedLocation.startsWith('../')) {
    const basePath = options.basePath;
    if (!looksLikeWorkspacePath(basePath)) {
      return createResolvedWorkspaceRepositoryLocation({
        requestedLocation,
        source: 'relative-path',
        status: 'unsupported',
        allowed: false,
        available: false,
      });
    }

    const resolvedPath = joinWorkspacePath(dirnameWorkspacePath(basePath), requestedLocation);
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'relative-path',
      root: findWorkspaceRepositoryRootByPath(resolvedPath, roots),
      resolvedPath,
    });
  }

  const uriMatch = requestedLocation.match(workspaceRepositoryUriPattern);
  if (uriMatch) {
    const scheme = uriMatch[1]?.trim().toLowerCase();
    const suffix = uriMatch[2] ?? '';
    const root = findWorkspaceRepositoryRootByScheme(scheme, roots);
    if (!root) {
      return createResolvedWorkspaceRepositoryLocation({
        requestedLocation,
        source: 'url',
        status: 'unsupported',
        allowed: false,
        available: false,
      });
    }

    const resolvedPath = suffix
      ? joinWorkspacePath(root.rootPath, suffix)
      : root.rootPath;
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'scheme-root',
      root,
      resolvedPath,
    });
  }

  return createResolvedWorkspaceRepositoryLocation({
    requestedLocation,
    source: looksLikeUrl(requestedLocation) ? 'url' : 'logical',
    status: 'unsupported',
    allowed: false,
    available: false,
  });
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
    provenance: normalizedMetadata.provenance ? { ...normalizedMetadata.provenance } : undefined,
    capabilityIds: normalizedMetadata.capabilityIds ? [...normalizedMetadata.capabilityIds] : undefined,
    diagnostics: normalizedMetadata.diagnostics
      ? normalizedMetadata.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        origin: diagnostic.origin ? { ...diagnostic.origin } : undefined,
        resource: diagnostic.resource ? createResourceRef(diagnostic.resource.resourceId ?? '', diagnostic.resource) : undefined,
        related: diagnostic.related ? diagnostic.related.map((entry) => ({
          ...entry,
          resource: entry.resource ? createResourceRef(entry.resource.resourceId ?? '', entry.resource) : undefined,
        })) : undefined,
      }))
      : undefined,
  };
}

function normalizeWorkspaceCapabilityIds(capabilityIds = []) {
  return [...new Set(
    capabilityIds
      .map((capabilityId) => String(capabilityId ?? '').trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right));
}

function determineWorkspaceProviderId(entry) {
  if (entry.metadata?.providerId) {
    return entry.metadata.providerId;
  }

  if (entry.metadata?.provenance?.kind === 'generated') {
    return workspaceProviderIds.generated;
  }

  if (entry.metadata?.provenance?.kind === 'bundled') {
    return workspaceProviderIds.bundled;
  }

  return workspaceProviderIds.local;
}

function createWorkspaceCapabilityDefaults(entry, providerId) {
  if (providerId === workspaceProviderIds.bundled) {
    return entry.kind === 'folder'
      ? ['resource.read', 'resource.list', 'resource.open', 'resource.view', 'resource.export']
      : ['resource.read', 'resource.open', 'resource.view', 'resource.copy', 'resource.export'];
  }

  if (entry.kind === 'folder') {
    return ['resource.read', 'resource.list', 'resource.open', 'resource.view', 'resource.export', 'resource.create-child', 'resource.rename', 'resource.move', 'resource.delete'];
  }

  return providerId === workspaceProviderIds.generated
    ? ['resource.read', 'resource.open', 'resource.view', 'resource.export', 'resource.write', 'resource.rename', 'resource.move', 'resource.delete']
    : ['resource.read', 'resource.open', 'resource.view', 'resource.export', 'resource.write', 'resource.rename', 'resource.move', 'resource.delete'];
}

function normalizeWorkspaceEntryDescriptor(entry, manifest) {
  const metadata = cloneMetadata(entry.metadata);
  const providerId = determineWorkspaceProviderId({ ...entry, metadata });
  const capabilityIds = providerId === workspaceProviderIds.bundled
    ? createWorkspaceCapabilityDefaults(entry, providerId)
    : normalizeWorkspaceCapabilityIds(
      metadata.capabilityIds ?? createWorkspaceCapabilityDefaults(entry, providerId),
    );
  return {
    ...entry,
    metadata: {
      ...metadata,
      providerId,
      revision: metadata.revision ?? metadata.updatedAt,
      capabilityIds,
      ownerKind: providerId === workspaceProviderIds.bundled
        ? (metadata.ownerKind ?? 'application')
        : (metadata.ownerKind ?? 'workspace'),
      ownerId: providerId === workspaceProviderIds.bundled
        ? (metadata.ownerId ?? 'textforge')
        : (metadata.ownerId ?? manifest.workspaceId),
      diagnostics: metadata.diagnostics ? [...metadata.diagnostics] : [],
    },
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

function cloneWorkspaceFolder(folder) {
  return {
    ...folder,
    metadata: cloneMetadata(folder.metadata),
    childIds: [...(folder.childIds ?? [])],
  };
}

function cloneWorkspaceResource(resource) {
  const representation = resource.representation
    ?? (resource.kind === 'text' ? 'text' : undefined)
    ?? (resource.kind === 'binary' ? 'bytes' : undefined);
  if (representation === 'text') {
    return {
      ...resource,
      kind: 'resource',
      representation: 'text',
      metadata: cloneMetadata(resource.metadata),
      text: resource.text ?? '',
    };
  }

  return {
    ...resource,
    kind: 'resource',
    representation: 'bytes',
    metadata: cloneMetadata(resource.metadata),
    bytes: cloneBytes(resource.bytes ?? new Uint8Array()),
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
    representation: entry.kind === 'resource' ? entry.representation : undefined,
    path: normalizeWorkspacePath(entry.path),
    title: entry.metadata?.title ?? '',
    languageId: entry.kind === 'resource' && entry.representation === 'text' ? entry.languageId ?? '' : '',
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
    .map((folder) => normalizeWorkspaceEntryDescriptor({
      ...cloneWorkspaceFolder(folder),
      path: normalizeWorkspacePath(folder.path),
      childIds: [],
    }, nextManifest));
  const nextResources = resources.map((resource) => normalizeWorkspaceEntryDescriptor({
    ...cloneWorkspaceResource(resource),
    path: normalizeWorkspacePath(resource.path),
  }, nextManifest));
  const badgedState = assignWorkspaceBadges(nextFolders, nextResources);
  const rootFolder = {
    kind: 'folder',
    id: 'root',
    path: nextManifest.rootPath,
    parentId: undefined,
    metadata: {
      title: nextManifest.name,
      providerId: workspaceProviderIds.local,
      revision: nextManifest.updatedAt,
      capabilityIds: createWorkspaceCapabilityDefaults({ kind: 'folder' }, workspaceProviderIds.local),
      ownerKind: 'workspace',
      ownerId: nextManifest.workspaceId,
      diagnostics: [],
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
    resources: database.table(workspaceResourcesTableName),
    manifests: database.table(workspaceManifestsTableName),
  };
}

function createWorkspaceDexieDatabase(databaseName = defaultWorkspaceDexieDatabaseName) {
  const database = new Dexie(databaseName);
  database.version(1).stores(legacyWorkspaceDexieSchema);
  database.version(workspaceDexieSchemaVersion).stores(workspaceDexieSchema).upgrade(async (transaction) => {
    const legacyTextResources = await transaction.table(workspaceLegacyTextResourcesTableName).toArray();
    const legacyBinaryResources = await transaction.table(workspaceLegacyBinaryResourcesTableName).toArray();
    const resources = [
      ...legacyTextResources.map((resource) => cloneWorkspaceResource(resource)),
      ...legacyBinaryResources.map((resource) => cloneWorkspaceResource(resource)),
    ];

    if (resources.length > 0) {
      await transaction.table(workspaceResourcesTableName).bulkPut(resources);
    }

    await transaction.table(workspaceSystemTableName).put({
      key: workspaceSchemaRecordKey,
      value: workspaceDexieSchemaVersion,
    });
  });
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

function cloneBytes(bytes) {
  return new Uint8Array(bytes);
}

function createMetadata(title, now, overrides = {}) {
  const timestamp = now();
  return {
    ...overrides,
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

  if (query.representation && entry.kind === 'resource' && entry.representation !== query.representation) {
    return false;
  }

  if (query.parentId && entry.parentId !== query.parentId) {
    return false;
  }

  if (query.languageId && entry.kind === 'resource' && entry.representation === 'text' && entry.languageId !== query.languageId) {
    return false;
  }

  if (query.mimeType && 'mimeType' in entry && entry.mimeType !== query.mimeType) {
    return false;
  }

  if (query.providerId && entry.metadata?.providerId !== query.providerId) {
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
    metadata: createMetadata(title, now, cloneMetadata(input.metadata)),
    childIds: [],
  };
}

function createTextEntry(input, now, idFactory, parentId) {
  const title = input.title ?? (basenameWorkspacePath(input.path) || 'Untitled text');
  return {
    kind: 'resource',
    representation: 'text',
    id: idFactory(),
    path: normalizeWorkspacePath(input.path),
    parentId,
    metadata: createMetadata(title, now, cloneMetadata(input.metadata)),
    text: input.text ?? '',
    languageId: input.languageId,
    mimeType: input.mimeType,
  };
}

function createBinaryEntry(input, now, idFactory, parentId) {
  const title = input.title ?? (basenameWorkspacePath(input.path) || 'Untitled file');
  return {
    kind: 'resource',
    representation: 'bytes',
    id: idFactory(),
    path: normalizeWorkspacePath(input.path),
    parentId,
    metadata: createMetadata(title, now, cloneMetadata(input.metadata)),
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
    kind: entry.kind === 'folder' ? 'virtual' : 'resource',
    representation: entry.kind === 'resource' ? entry.representation : undefined,
    mimeType: 'mimeType' in entry ? entry.mimeType : undefined,
    languageId: entry.kind === 'resource' && entry.representation === 'text' ? entry.languageId : undefined,
    parentResourceId: entry.parentId,
    badge: entry.metadata?.badge,
    providerId: entry.metadata?.providerId,
    revision: entry.metadata?.revision,
    capabilityIds: entry.metadata?.capabilityIds,
    ownerKind: entry.metadata?.ownerKind,
    ownerId: entry.metadata?.ownerId,
    provenance: entry.metadata?.provenance,
    diagnostics: entry.metadata?.diagnostics,
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
        tables.resources,
        async () => ({
          schemaRecord: await tables.system.get(workspaceSchemaRecordKey),
          lastSavedAtRecord: await tables.system.get(workspaceSavedAtRecordKey),
          manifestRecords: await tables.manifests.toArray(),
          folderRecords: await tables.folders.toArray(),
          resourceRecords: await tables.resources.toArray(),
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
      || records.resourceRecords.length > 0;
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
      records.resourceRecords.map((resource) => cloneWorkspaceResource(resource)),
    );
  }

  async function saveState(input) {
    const state = cloneWorkspaceState(snapshotWorkspaceState(input));
    const savedAt = state.manifest.updatedAt;
    const resources = state.resources.map((resource) => cloneWorkspaceResource(resource));

    try {
      await database.transaction(
        'rw',
        tables.system,
        tables.manifests,
        tables.folders,
        tables.resources,
        async () => {
          await Promise.all([
            tables.system.clear(),
            tables.manifests.clear(),
            tables.folders.clear(),
            tables.resources.clear(),
          ]);
          await tables.system.bulkPut([
            { key: workspaceSchemaRecordKey, value: workspaceDexieSchemaVersion },
            { key: workspaceSavedAtRecordKey, value: savedAt },
          ]);
          await tables.manifests.put(cloneWorkspaceManifestRecord(state.manifest));
          if (state.folders.length > 0) {
            await tables.folders.bulkPut(state.folders.map((folder) => cloneWorkspaceFolder(folder)));
          }
          if (resources.length > 0) {
            await tables.resources.bulkPut(resources);
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
        tables.resources,
        async () => {
          await Promise.all([
            tables.system.clear(),
            tables.manifests.clear(),
            tables.folders.clear(),
            tables.resources.clear(),
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
    createResource: wrapMutation('createResource', 'create-resource'),
    createTextResource: wrapMutation('createTextResource', 'create-text'),
    createBinaryResource: wrapMutation('createBinaryResource', 'create-binary'),
    saveResource: wrapMutation('saveResource', 'save-resource'),
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

function collectWorkspaceEntries(state) {
  return [...state.folders, ...state.resources];
}

function createMergedWorkspaceState(baseState, overlayState, selectedResourceId) {
  const overlayPaths = new Set(collectWorkspaceEntries(overlayState).map((entry) => entry.path));
  const mergedFolders = [
    ...baseState.folders
      .filter((folder) => folder.id !== 'root' && !overlayPaths.has(folder.path))
      .map((folder) => cloneWorkspaceFolder(folder)),
    ...overlayState.folders
      .filter((folder) => folder.id !== 'root')
      .map((folder) => cloneWorkspaceFolder(folder)),
  ];
  const mergedResources = [
    ...baseState.resources
      .filter((resource) => !overlayPaths.has(resource.path))
      .map((resource) => cloneWorkspaceResource(resource)),
    ...overlayState.resources.map((resource) => cloneWorkspaceResource(resource)),
  ];
  const mergedEntries = [...mergedFolders, ...mergedResources];
  const nextSelectedResourceId = mergedEntries.some((entry) => entry.id === selectedResourceId)
    ? selectedResourceId
    : undefined;

  return createWorkspaceState(
    {
      ...cloneWorkspaceManifestRecord(baseState.manifest),
      selectedResourceId: nextSelectedResourceId,
    },
    mergedFolders,
    mergedResources,
  );
}

function stripOverlayEntriesFromState(input, overlayState) {
  const state = snapshotWorkspaceState(input);
  const overlayPaths = new Set(collectWorkspaceEntries(overlayState).map((entry) => entry.path));
  const folders = state.folders
    .filter((folder) => folder.id !== 'root' && !overlayPaths.has(folder.path))
    .map((folder) => cloneWorkspaceFolder(folder));
  const resources = state.resources
    .filter((resource) => !overlayPaths.has(resource.path))
    .map((resource) => cloneWorkspaceResource(resource));

  return createWorkspaceState(cloneWorkspaceManifestRecord(state.manifest), folders, resources);
}

export function createWorkspaceOverlayService(baseWorkspace, options) {
  if (!options?.overlay) {
    return baseWorkspace;
  }

  let overlaySelectedResourceId;

  function getOverlayState() {
    return cloneWorkspaceState(snapshotWorkspaceState(
      typeof options.overlay === 'function' ? options.overlay() : options.overlay,
    ));
  }

  function getBaseState() {
    return baseWorkspace.snapshot();
  }

  function getMergedState() {
    const baseState = getBaseState();
    const overlayState = getOverlayState();
    const selectedResourceId = overlaySelectedResourceId ?? baseState.manifest.selectedResourceId;
    return createMergedWorkspaceState(baseState, overlayState, selectedResourceId);
  }

  function getMergedEntryById(resourceId) {
    if (!resourceId) {
      return undefined;
    }

    return collectWorkspaceEntries(getMergedState()).find((entry) => entry.id === resourceId);
  }

  function getMergedEntryByPath(path) {
    const normalizedPath = normalizeWorkspacePath(path);
    return collectWorkspaceEntries(getMergedState()).find((entry) => entry.path === normalizedPath);
  }

  const overlaidWorkspace = {
    ...baseWorkspace,
    snapshot() {
      return getMergedState();
    },
    query(queryValue) {
      return collectWorkspaceEntries(getMergedState()).filter((entry) => matchesWorkspaceQuery(entry, queryValue));
    },
    getEntry(resourceId) {
      return getMergedEntryById(resourceId);
    },
    getEntryByPath(path) {
      return getMergedEntryByPath(path);
    },
    getManifest() {
      return cloneWorkspaceManifestRecord(getMergedState().manifest);
    },
    replaceState(nextState) {
      overlaySelectedResourceId = undefined;
      const strippedState = stripOverlayEntriesFromState(nextState, getOverlayState());
      baseWorkspace.replaceState(strippedState);
      return getMergedState();
    },
    setSelectedResourceId(resourceId) {
      const baseEntry = baseWorkspace.getEntry(resourceId);
      if (baseEntry) {
        overlaySelectedResourceId = undefined;
        baseWorkspace.setSelectedResourceId(resourceId);
        return cloneWorkspaceManifestRecord(getMergedState().manifest);
      }

      const overlayEntry = getMergedEntryById(resourceId);
      if (!overlayEntry) {
        overlaySelectedResourceId = undefined;
        baseWorkspace.setSelectedResourceId(undefined);
        return cloneWorkspaceManifestRecord(getMergedState().manifest);
      }

      overlaySelectedResourceId = overlayEntry.id;
      return cloneWorkspaceManifestRecord(getMergedState().manifest);
    },
    resolveReference(source, reference) {
      const resolvedPath = reference.startsWith('/')
        ? normalizeWorkspacePath(reference)
        : joinWorkspacePath(source.path ? dirnameWorkspacePath(source.path) : '/', reference);
      const entry = getMergedEntryByPath(resolvedPath);
      return entry ? toResourceRef(entry) : undefined;
    },
  };

  if (typeof baseWorkspace.whenIdle === 'function') {
    overlaidWorkspace.whenIdle = async () => {
      await baseWorkspace.whenIdle();
      return getMergedState();
    };
  }

  if (typeof baseWorkspace.persistNow === 'function') {
    overlaidWorkspace.persistNow = async (reason) => {
      await baseWorkspace.persistNow(reason);
      return getMergedState();
    };
  }

  if (typeof baseWorkspace.resetPersistence === 'function') {
    overlaidWorkspace.resetPersistence = async (nextState) => {
      overlaySelectedResourceId = undefined;
      const strippedState = nextState ? stripOverlayEntriesFromState(nextState, getOverlayState()) : undefined;
      await baseWorkspace.resetPersistence(strippedState);
      return getMergedState();
    };
  }

  return overlaidWorkspace;
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
      representation: entry.kind === 'resource' ? entry.representation : undefined,
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

  function assertWorkspaceCapability(entry, capabilityId, action) {
    if (!entry) {
      return;
    }

    if (!hasResourceCapability(workspaceEntryToResourceRef(entry), capabilityId)) {
      throw new Error(`Workspace entry ${entry.path} does not allow ${action}.`);
    }
  }

  function createFolder(input) {
    const parent = resolveParentFolder(input.path);
    assertWorkspaceCapability(parent, 'resource.create-child', 'creating child entries');
    const nextFolder = createFolderEntry(input, now, createUniqueId, parent?.id);
    folders = [...folders, nextFolder];
    touchManifest(nextFolder.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextFolder.id);
  }

  function createResource(input) {
    const parent = resolveParentFolder(input.path);
    assertWorkspaceCapability(parent, 'resource.create-child', 'creating child entries');
    const nextResource = input.representation === 'text'
      ? createTextEntry(input, now, createUniqueId, parent?.id)
      : createBinaryEntry(input, now, createUniqueId, parent?.id);
    resources = [...resources, nextResource];
    touchManifest(nextResource.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
  }

  function createTextResource(input) {
    return createResource({
      ...input,
      representation: 'text',
    });
  }

  function createBinaryResource(input) {
    return createResource({
      ...input,
      representation: 'bytes',
    });
  }

  function saveResource(input) {
    const current = resources.find((entry) => entry.id === input.resourceId && entry.kind === 'resource');
    if (!current) {
      throw new Error(`Unknown workspace resource: ${input.resourceId}`);
    }
    assertWorkspaceCapability(current, 'resource.write', 'saving resource content');

    if (input.representation === 'text') {
      if (current.representation !== 'text') {
        throw new Error(`Workspace resource ${input.resourceId} is not text-backed.`);
      }

      const nextResource = {
        ...current,
        text: input.text,
        languageId: input.languageId ?? current.languageId,
        mimeType: input.mimeType ?? current.mimeType,
        metadata: {
          ...current.metadata,
          ...cloneMetadata(input.metadata),
          updatedAt: input.updatedAt ?? now(),
        },
      };

      resources = replaceById(resources, nextResource);
      touchManifest(nextResource.metadata.updatedAt);
      refreshStructure();
      return getEntry(nextResource.id);
    }

    if (current.representation !== 'bytes') {
      throw new Error(`Workspace resource ${input.resourceId} is not byte-backed.`);
    }

    const nextResource = {
      ...current,
      bytes: cloneBytes(input.bytes),
      mimeType: input.mimeType ?? current.mimeType,
      metadata: {
        ...current.metadata,
        ...cloneMetadata(input.metadata),
        updatedAt: input.updatedAt ?? now(),
      },
    };

    resources = replaceById(resources, nextResource);
    touchManifest(nextResource.metadata.updatedAt);
    refreshStructure();
    return getEntry(nextResource.id);
  }

  function saveTextResource(input) {
    return saveResource({
      ...input,
      representation: 'text',
    });
  }

  function saveBinaryResource(input) {
    return saveResource({
      ...input,
      representation: 'bytes',
    });
  }

  function renameEntry(resourceId, path) {
    const current = getEntry(resourceId);
    if (!current) {
      return undefined;
    }
    assertWorkspaceCapability(current, 'resource.rename', 'renaming');

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
      assertWorkspaceCapability(parent, 'resource.create-child', 'creating child entries');
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
    assertWorkspaceCapability(parent, 'resource.create-child', 'creating child entries');
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
    assertWorkspaceCapability(current, 'resource.move', 'moving');

    const parent = getEntryByPath(input.parentPath);
    if (!parent || parent.kind !== 'folder') {
      throw new Error(`Unknown workspace folder: ${input.parentPath}`);
    }
    assertWorkspaceCapability(parent, 'resource.create-child', 'creating child entries');

    const baseTitle = input.title ?? current.metadata.title ?? basenameWorkspacePath(current.path);
    const title = baseTitle || current.id;
    return renameEntry(current.id, joinWorkspacePath(parent.path, title));
  }

  function deleteEntry(resourceId) {
    const current = getEntry(resourceId);
    if (!current) {
      return false;
    }
    assertWorkspaceCapability(current, 'resource.delete', 'deleting');

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
      case 'create-resource':
        return createResource(mutation.input);
      case 'create-text':
        return createTextResource(mutation.input);
      case 'create-binary':
        return createBinaryResource(mutation.input);
      case 'save-resource':
        return saveResource(mutation.input);
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
    createResource,
    createTextResource,
    createBinaryResource,
    saveResource,
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
