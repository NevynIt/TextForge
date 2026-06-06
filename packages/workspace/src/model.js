import {
  createResourceBadgeToken,
  createResourceRef,
} from '@textforge/core';

import {
  resourceBadgeAccents,
  resourceBadgeMarks,
  resourceBadgePlacements,
  resourceBadgeShapes,
  workspaceProviderIds,
} from './constants.js';
import {
  basenameWorkspacePath,
  normalizeWorkspacePath,
} from './paths.js';

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

export function cloneMetadata(metadata) {
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

export function cloneWorkspaceManifestRecord(manifest) {
  return {
    ...manifest,
  };
}

export function snapshotWorkspaceState(input) {
  return typeof input?.snapshot === 'function' ? input.snapshot() : input;
}


export function cloneWorkspaceFolder(folder) {
  return {
    ...folder,
    metadata: cloneMetadata(folder.metadata),
    childIds: [...(folder.childIds ?? [])],
  };
}

export function cloneWorkspaceResource(resource) {
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

export function cloneWorkspaceEntry(entry) {
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

export function createWorkspaceState(manifest, folders, resources) {
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

export function cloneWorkspaceState(state) {
  return createWorkspaceState(state.manifest, state.folders, state.resources);
}

export function cloneBytes(bytes) {
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

export function matchesWorkspaceQuery(entry, query) {
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

export function createFolderEntry(input, now, idFactory, parentId) {
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

export function createTextEntry(input, now, idFactory, parentId) {
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

export function createBinaryEntry(input, now, idFactory, parentId) {
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

export function replaceById(entries, nextEntry) {
  return entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry));
}

export function removeById(entries, id) {
  return entries.filter((entry) => entry.id !== id);
}

export function updateDescendantPaths(entries, previousPath, nextPath) {
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

export function collectDescendants(entries, parentId) {
  const directChildren = entries.filter((entry) => entry.parentId === parentId);
  return directChildren.flatMap((entry) => (entry.kind === 'folder' ? [entry, ...collectDescendants(entries, entry.id)] : [entry]));
}

export function toResourceRef(entry) {
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
