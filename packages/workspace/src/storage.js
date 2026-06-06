import Dexie from 'dexie';

import {
  defaultWorkspaceDexieDatabaseName,
  legacyWorkspaceDexieSchema,
  workspaceDexieSchema,
  workspaceDexieSchemaVersion,
  workspaceFoldersTableName,
  workspaceLegacyBinaryResourcesTableName,
  workspaceLegacyTextResourcesTableName,
  workspaceManifestsTableName,
  workspaceResourcesTableName,
  workspaceSavedAtRecordKey,
  workspaceSchemaRecordKey,
  workspaceStorageErrorCodes,
  workspaceSystemTableName,
} from './constants.js';
import {
  cloneWorkspaceFolder,
  cloneWorkspaceManifestRecord,
  cloneWorkspaceResource,
  cloneWorkspaceState,
  createWorkspaceState,
  snapshotWorkspaceState,
} from './model.js';

export function createWorkspaceStorageError(code, message, cause) {
  const error = new Error(message);
  error.name = 'WorkspaceStorageError';
  error.code = code;
  if (cause !== undefined) {
    error.cause = cause;
  }
  return error;
}

export function cloneWorkspaceStorageErrorSnapshot(error) {
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
