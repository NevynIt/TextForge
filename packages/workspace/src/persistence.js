import { workspaceDexieSchemaVersion } from './constants.js';
import {
  cloneWorkspaceState,
  snapshotWorkspaceState,
} from './model.js';
import {
  cloneWorkspaceStorageErrorSnapshot,
  openWorkspaceDexieStorage,
} from './storage.js';
import { createWorkspaceService } from './service.js';

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
