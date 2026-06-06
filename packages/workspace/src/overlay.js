import {
  dirnameWorkspacePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
} from './paths.js';
import {
  cloneWorkspaceFolder,
  cloneWorkspaceManifestRecord,
  cloneWorkspaceResource,
  cloneWorkspaceState,
  createWorkspaceState,
  matchesWorkspaceQuery,
  snapshotWorkspaceState,
  toResourceRef,
} from './model.js';

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
