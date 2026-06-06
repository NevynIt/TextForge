export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();
export const workspaceArchiveFormat = 'textforge-workspace-archive';
export const workspaceArchiveVersion = 1;
export const workspaceArchiveManifestPath = 'textforge-workspace.json';
export const workspaceSystemTableName = 'system';
export const workspaceFoldersTableName = 'folders';
export const workspaceResourcesTableName = 'resources';
export const workspaceLegacyTextResourcesTableName = 'textResources';
export const workspaceLegacyBinaryResourcesTableName = 'binaryResources';
export const workspaceManifestsTableName = 'manifests';
export const workspaceSchemaRecordKey = 'workspace-schema-version';
export const workspaceSavedAtRecordKey = 'workspace-last-saved-at';
export const resourceBadgeShapes = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hex', 'octagon', 'shield'];
export const resourceBadgeAccents = ['teal', 'amber', 'sky', 'coral', 'lime', 'slate', 'rose', 'cobalt'];
export const resourceBadgeMarks = ['dot', 'bar', 'split', 'ring', 'corner', 'stack', 'plus', 'slash'];
export const resourceBadgePlacements = ['center', 'top', 'right', 'bottom', 'left'];
export const workspaceRepositoryUriPattern = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/(.*)$/u;
export const workspaceBundledRootPath = '/.textforge/resources';

export const legacyWorkspaceDexieSchema = {
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
