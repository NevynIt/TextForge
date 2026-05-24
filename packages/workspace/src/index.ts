import type { CanonicalPatch, CommandContribution, ContributionManifest, PipelineValue, ResourceRef } from '@textforge/core';

export type WorkspaceEntryKind = 'folder' | 'text' | 'binary';
export type WorkspaceArchiveResourceEncoding = 'utf8' | 'binary';
export type WorkspaceImportConflictPolicy = 'error' | 'replace' | 'skip';
export type WorkspaceStorageKind = 'indexeddb';
export type WorkspaceStorageDriver = 'dexie';
export type WorkspaceStorageStatus = 'idle' | 'persisting' | 'error';
export type WorkspaceHydrationSource = 'seed' | 'storage';

export interface WorkspaceMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceEntryBase {
  readonly id: string;
  readonly path: string;
  readonly parentId?: string;
  readonly metadata: WorkspaceMetadata;
}

export interface WorkspaceFolder extends WorkspaceEntryBase {
  readonly kind: 'folder';
  readonly childIds: ReadonlyArray<string>;
}

export interface WorkspaceTextResource extends WorkspaceEntryBase {
  readonly kind: 'text';
  readonly text: string;
  readonly languageId?: string;
  readonly mimeType?: string;
}

export interface WorkspaceBinaryResource extends WorkspaceEntryBase {
  readonly kind: 'binary';
  readonly bytes: Uint8Array;
  readonly mimeType?: string;
}

export type WorkspaceResource = WorkspaceTextResource | WorkspaceBinaryResource;
export type WorkspaceEntry = WorkspaceFolder | WorkspaceResource;

export interface WorkspaceManifest {
  readonly workspaceId: string;
  readonly name: string;
  readonly rootPath: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly selectedResourceId?: string;
}

export interface WorkspaceState {
  readonly manifest: WorkspaceManifest;
  readonly folders: ReadonlyArray<WorkspaceFolder>;
  readonly resources: ReadonlyArray<WorkspaceResource>;
}

export interface WorkspaceArchiveFolderRecord {
  readonly id: string;
  readonly path: string;
  readonly parentId?: string;
  readonly metadata: WorkspaceMetadata;
}

export interface WorkspaceArchiveResourceRecord {
  readonly id: string;
  readonly kind: WorkspaceResource['kind'];
  readonly path: string;
  readonly parentId?: string;
  readonly metadata: WorkspaceMetadata;
  readonly archivePath: string;
  readonly encoding: WorkspaceArchiveResourceEncoding;
  readonly languageId?: string;
  readonly mimeType?: string;
}

export interface WorkspaceArchiveManifest {
  readonly format: 'textforge-workspace-archive';
  readonly version: 1;
  readonly exportedAt: string;
  readonly workspace: WorkspaceManifest;
  readonly folders: ReadonlyArray<WorkspaceArchiveFolderRecord>;
  readonly resources: ReadonlyArray<WorkspaceArchiveResourceRecord>;
}

export interface WorkspaceArchiveImportResult {
  readonly manifest: WorkspaceArchiveManifest;
  readonly state: WorkspaceState;
}

export interface WorkspaceArchiveExportOptions {
  readonly exportedAt?: string;
}

export interface WorkspaceArchiveImportOptions {
  readonly existingState?: WorkspaceState;
  readonly conflictPolicy?: WorkspaceImportConflictPolicy;
}

export interface WorkspaceQuery {
  readonly path?: string;
  readonly resourceId?: string;
  readonly kind?: WorkspaceEntryKind;
  readonly languageId?: string;
  readonly mimeType?: string;
  readonly parentId?: string;
}

export interface WorkspaceReferenceResolver {
  resolveReference(source: ResourceRef, reference: string): ResourceRef | undefined;
}

export interface WorkspaceDexieSchema {
  readonly system: string;
  readonly folders: string;
  readonly textResources: string;
  readonly binaryResources: string;
  readonly manifests: string;
}

export interface WorkspaceCreateFolderInput {
  readonly path: string;
  readonly title?: string;
}

export interface WorkspaceCreateTextInput {
  readonly path: string;
  readonly text?: string;
  readonly title?: string;
  readonly languageId?: string;
  readonly mimeType?: string;
}

export interface WorkspaceCreateBinaryInput {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly title?: string;
  readonly mimeType?: string;
}

export interface WorkspaceSaveTextInput {
  readonly resourceId: string;
  readonly text: string;
  readonly languageId?: string;
  readonly mimeType?: string;
  readonly updatedAt?: string;
}

export interface WorkspaceSaveBinaryInput {
  readonly resourceId: string;
  readonly bytes: Uint8Array;
  readonly updatedAt?: string;
}

export interface WorkspaceMoveInput {
  readonly resourceId: string;
  readonly parentPath: string;
  readonly title?: string;
}

export type WorkspaceMutation =
  | { readonly kind: 'create-folder'; readonly input: WorkspaceCreateFolderInput }
  | { readonly kind: 'create-text'; readonly input: WorkspaceCreateTextInput }
  | { readonly kind: 'create-binary'; readonly input: WorkspaceCreateBinaryInput }
  | { readonly kind: 'save-text'; readonly input: WorkspaceSaveTextInput }
  | { readonly kind: 'save-binary'; readonly input: WorkspaceSaveBinaryInput }
  | { readonly kind: 'rename'; readonly resourceId: string; readonly path: string }
  | { readonly kind: 'move'; readonly input: WorkspaceMoveInput }
  | { readonly kind: 'delete'; readonly resourceId: string };

export interface WorkspaceService {
  readonly workspaceId: string;
  snapshot(): WorkspaceState;
  query(query: WorkspaceQuery): ReadonlyArray<WorkspaceEntry>;
  getEntry(resourceId: string): WorkspaceEntry | undefined;
  getEntryByPath(path: string): WorkspaceEntry | undefined;
  getManifest(): WorkspaceManifest;
  createFolder(input: WorkspaceCreateFolderInput): WorkspaceFolder;
  createTextResource(input: WorkspaceCreateTextInput): WorkspaceTextResource;
  createBinaryResource(input: WorkspaceCreateBinaryInput): WorkspaceBinaryResource;
  saveTextResource(input: WorkspaceSaveTextInput): WorkspaceTextResource;
  saveBinaryResource(input: WorkspaceSaveBinaryInput): WorkspaceBinaryResource;
  renameEntry(resourceId: string, path: string): WorkspaceEntry | undefined;
  moveEntry(input: WorkspaceMoveInput): WorkspaceEntry | undefined;
  deleteEntry(resourceId: string): boolean;
  replaceState(state: WorkspaceState | WorkspaceService): WorkspaceState;
  setSelectedResourceId(resourceId?: string): WorkspaceManifest;
  resolveReference(source: ResourceRef, reference: string): ResourceRef | undefined;
  applyMutation(mutation: WorkspaceMutation): WorkspaceEntry | boolean | undefined;
}

export interface WorkspaceServiceOptions {
  readonly workspaceId?: string;
  readonly name?: string;
  readonly rootPath?: string;
  readonly now?: () => string;
  readonly idFactory?: () => string;
  readonly selectedResourceId?: string;
  readonly state?: Partial<WorkspaceState>;
}

export interface WorkspaceStorageOptions {
  readonly databaseName?: string;
}

export interface WorkspaceStorageErrorSnapshot {
  readonly code: string;
  readonly message: string;
}

export interface WorkspacePersistenceStatus {
  readonly state: WorkspaceStorageStatus;
  readonly driver: WorkspaceStorageDriver;
  readonly databaseName: string;
  readonly schemaVersion: number;
  readonly browserManaged: boolean;
  readonly lastSavedAt?: string;
  readonly pendingReason?: string;
  readonly error?: WorkspaceStorageErrorSnapshot;
}

export interface WorkspaceDexieStorage {
  readonly kind: WorkspaceStorageKind;
  readonly driver: WorkspaceStorageDriver;
  readonly browserManaged: boolean;
  readonly databaseName: string;
  readonly schemaVersion: number;
  loadState(): Promise<WorkspaceState | undefined>;
  saveState(input: WorkspaceState | WorkspaceService): Promise<WorkspaceState>;
  clear(): Promise<void>;
  delete(): Promise<void>;
  close(): void;
}

export interface PersistentWorkspaceService extends WorkspaceService {
  readonly storage: WorkspaceDexieStorage;
  getPersistenceStatus(): WorkspacePersistenceStatus;
  subscribePersistence(listener: () => void): () => void;
  whenIdle(): Promise<WorkspaceState>;
  persistNow(reason?: string): Promise<WorkspaceState>;
  resetPersistence(nextState?: WorkspaceState | WorkspaceService): Promise<WorkspaceState>;
  disposePersistence(): void;
}

export interface CreatePersistedWorkspaceServiceOptions extends WorkspaceServiceOptions {
  readonly storage?: WorkspaceDexieStorage;
  readonly storageOptions?: WorkspaceStorageOptions;
  readonly seed?: WorkspaceState | WorkspaceService | (() => WorkspaceState | WorkspaceService);
}

export interface HydratedWorkspaceServiceResult {
  readonly hydrationSource: WorkspaceHydrationSource;
  readonly storage: WorkspaceDexieStorage;
  readonly workspace: PersistentWorkspaceService;
}

export interface WorkspaceTreeItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly kind: WorkspaceEntryKind;
  readonly depth: number;
  readonly expanded: boolean;
  readonly active: boolean;
  readonly badge: string;
}

export interface WorkspacePipelineValue<TValue = unknown> extends PipelineValue<TValue> {
  readonly kind: 'workspace';
}

export interface WorkspaceCanonicalPatch extends CanonicalPatch {
  readonly target: ResourceRef;
}

export declare const workspaceDexieSchemaVersion: 1;
export declare const defaultWorkspaceDexieDatabaseName: 'textforge-workspace';
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
export declare function createWorkspaceManifest(options?: WorkspaceServiceOptions): WorkspaceManifest;
export declare function workspaceEntryToResourceRef(entry: WorkspaceEntry): ResourceRef;
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
export declare function openWorkspaceDexieStorage(options?: WorkspaceStorageOptions): Promise<WorkspaceDexieStorage>;
export declare function resetWorkspaceDexieStorage(options?: WorkspaceStorageOptions): Promise<void>;
export declare function createPersistentWorkspaceService(
  baseWorkspace: WorkspaceService,
  storage: WorkspaceDexieStorage,
  options?: Pick<WorkspaceServiceOptions, 'now'>,
): PersistentWorkspaceService;
export declare function createPersistedWorkspaceService(
  options?: CreatePersistedWorkspaceServiceOptions,
): Promise<HydratedWorkspaceServiceResult>;
export declare function createWorkspaceTreeItems(state: WorkspaceState): ReadonlyArray<WorkspaceTreeItem>;
export declare function createWorkspaceService(options?: WorkspaceServiceOptions): WorkspaceService;
