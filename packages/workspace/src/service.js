import { hasResourceCapability } from '@textforge/core';

import {
  basenameWorkspacePath,
  createSequentialIdFactory,
  dirnameWorkspacePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
} from './paths.js';
import {
  cloneBytes,
  cloneMetadata,
  cloneWorkspaceManifestRecord,
  cloneWorkspaceState,
  collectDescendants,
  createBinaryEntry,
  createFolderEntry,
  createTextEntry,
  createWorkspaceManifest,
  createWorkspaceState,
  matchesWorkspaceQuery,
  removeById,
  replaceById,
  snapshotWorkspaceState,
  toResourceRef,
  updateDescendantPaths,
  workspaceEntryToResourceRef,
} from './model.js';

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
  let revision = 0;
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
    revision += 1;
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
    revision += 1;
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
        metadata: {
          ...nextFolder.metadata,
          title: basenameWorkspacePath(nextPath),
          updatedAt,
        },
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
      metadata: {
        ...current.metadata,
        title: basenameWorkspacePath(nextPath),
        updatedAt,
      },
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
    getRevision: () => revision,
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
