import type {
  CommandContribution,
  ContributionManifest,
  ResourceRef,
} from '@textforge/core';

import type {
  CreatePersistedWorkspaceServiceOptions,
  CreateWorkspaceOverlayServiceOptions,
  HydratedWorkspaceServiceResult,
  PersistentWorkspaceService,
  WorkspaceArchiveExportOptions,
  WorkspaceArchiveImportOptions,
  WorkspaceArchiveImportResult,
  WorkspaceArchiveManifest,
  WorkspaceBadgeDiagnostic,
  WorkspaceDexieSchema,
  WorkspaceDexieStorage,
  WorkspaceEntry,
  WorkspaceFolderArchive,
  WorkspaceManifest,
  WorkspaceRepositoryResolverOptions,
  WorkspaceRepositoryRoot,
  WorkspaceResolvedRepositoryLocation,
  WorkspaceService,
  WorkspaceServiceOptions,
  WorkspaceState,
  WorkspaceStorageOptions,
  WorkspaceTreeItem,
} from './types';

export declare const workspaceDexieSchemaVersion: 2;
export declare const defaultWorkspaceDexieDatabaseName: 'textforge-workspace';
export declare const workspaceProviderIds: {
  readonly local: 'workspace-local';
  readonly bundled: 'bundled-docs';
  readonly generated: 'generated-artifact';
};
export declare function createDefaultWorkspaceRepositoryRoots(): ReadonlyArray<WorkspaceRepositoryRoot>;
export declare const workspaceStorageErrorCodes: {
  readonly initializationFailed: 'workspace-storage-initialization-failed';
  readonly loadFailed: 'workspace-storage-load-failed';
  readonly saveFailed: 'workspace-storage-save-failed';
  readonly clearFailed: 'workspace-storage-clear-failed';
  readonly deleteFailed: 'workspace-storage-delete-failed';
  readonly corruptedState: 'workspace-storage-corrupted';
  readonly incompatibleState: 'workspace-storage-incompatible';
};
export declare const workspaceDexieSchema: WorkspaceDexieSchema;
export declare const workspaceCommandContributions: ReadonlyArray<CommandContribution>;
export declare function createWorkspaceContributionManifest(): ContributionManifest;
export declare const workspaceContribution: {
  readonly packageId: '@textforge/workspace';
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly dependencies: readonly [];
  readonly capabilities: readonly [];
  readonly commands: ReadonlyArray<CommandContribution>;
  readonly surfaces: readonly [];
  readonly pipelines: readonly [];
};
export declare const contributions: typeof workspaceContribution;

export declare function createSequentialIdFactory(prefix?: string): () => string;
export declare function normalizeWorkspacePath(path: string): string;
export declare function joinWorkspacePath(...parts: ReadonlyArray<string>): string;
export declare function dirnameWorkspacePath(path: string): string;
export declare function basenameWorkspacePath(path: string): string;
export declare function resolveWorkspaceRepositoryLocation(
  location: string,
  options?: WorkspaceRepositoryResolverOptions,
): WorkspaceResolvedRepositoryLocation;
export declare function createWorkspaceManifest(options?: WorkspaceServiceOptions): WorkspaceManifest;
export declare function workspaceEntryToResourceRef(entry: WorkspaceEntry): ResourceRef;
export declare function listWorkspaceBadgeDiagnostics(
  input: WorkspaceState | WorkspaceService,
): ReadonlyArray<WorkspaceBadgeDiagnostic>;
export declare function createWorkspaceArchiveManifest(
  input: WorkspaceState | WorkspaceService,
  options?: WorkspaceArchiveExportOptions,
): WorkspaceArchiveManifest;
export declare function exportWorkspaceToZip(
  input: WorkspaceState | WorkspaceService,
  options?: WorkspaceArchiveExportOptions,
): Uint8Array;
export declare function exportWorkspaceFolderToZip(
  input: WorkspaceState | WorkspaceService,
  folderPath: string,
  options?: WorkspaceArchiveExportOptions,
): Uint8Array;
export declare function mergeImportedWorkspaceState(
  existingState: WorkspaceState,
  importedState: WorkspaceState,
  options?: WorkspaceArchiveImportOptions,
): WorkspaceState;
export declare function importWorkspaceFromZip(
  bytes: Uint8Array,
  options?: WorkspaceArchiveImportOptions,
): WorkspaceArchiveImportResult;
export declare function importWorkspaceFolderFromZip(bytes: Uint8Array): WorkspaceFolderArchive;
export declare function openWorkspaceDexieStorage(options?: WorkspaceStorageOptions): Promise<WorkspaceDexieStorage>;
export declare function resetWorkspaceDexieStorage(options?: WorkspaceStorageOptions): Promise<void>;
export declare function createPersistentWorkspaceService(
  baseWorkspace: WorkspaceService,
  storage: WorkspaceDexieStorage,
  options?: Pick<CreatePersistedWorkspaceServiceOptions, 'now' | 'autoSaveDelayMs'>,
): PersistentWorkspaceService;
export declare function createPersistedWorkspaceService(
  options?: CreatePersistedWorkspaceServiceOptions,
): Promise<HydratedWorkspaceServiceResult>;
export declare function createWorkspaceOverlayService<TWorkspace extends WorkspaceService>(
  baseWorkspace: TWorkspace,
  options: CreateWorkspaceOverlayServiceOptions,
): TWorkspace;
export declare function createWorkspaceTreeItems(state: WorkspaceState): ReadonlyArray<WorkspaceTreeItem>;
export declare function createWorkspaceService(options?: WorkspaceServiceOptions): WorkspaceService;
