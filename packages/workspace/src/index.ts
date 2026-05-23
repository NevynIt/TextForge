import { unzipSync, zipSync } from 'fflate';

import type { CanonicalPatch, PipelineValue, ResourceRef } from '@textforge/core';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const workspaceArchiveFormat = 'textforge-workspace-archive';
const workspaceArchiveVersion = 1;
const workspaceArchiveManifestPath = 'textforge-workspace.json';

export type WorkspaceEntryKind = 'folder' | 'text' | 'binary';

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

export type WorkspaceArchiveResourceEncoding = 'utf8' | 'binary';

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
  readonly folders: string;
  readonly resources: string;
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
  createFolder(input: WorkspaceCreateFolderInput): WorkspaceFolder;
  createTextResource(input: WorkspaceCreateTextInput): WorkspaceTextResource;
  createBinaryResource(input: WorkspaceCreateBinaryInput): WorkspaceBinaryResource;
  saveTextResource(input: WorkspaceSaveTextInput): WorkspaceTextResource;
  saveBinaryResource(input: WorkspaceSaveBinaryInput): WorkspaceBinaryResource;
  renameEntry(resourceId: string, path: string): WorkspaceEntry | undefined;
  moveEntry(input: WorkspaceMoveInput): WorkspaceEntry | undefined;
  deleteEntry(resourceId: string): boolean;
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

export interface WorkspacePipelineValue<TValue = unknown> extends PipelineValue<TValue> {
  readonly kind: 'workspace';
}

export interface WorkspaceCanonicalPatch extends CanonicalPatch {
  readonly target: ResourceRef;
}

export const workspaceDexieSchema: WorkspaceDexieSchema = {
  folders: 'id, path, parentId, metadata.createdAt, metadata.updatedAt',
  resources: 'id, path, parentId, kind, languageId, mimeType, metadata.createdAt, metadata.updatedAt',
  manifests: 'workspaceId, name, rootPath, createdAt, updatedAt, selectedResourceId',
};

export const workspaceContribution = {
  id: '@textforge/workspace',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;

export const contributions = workspaceContribution;

export function createSequentialIdFactory(prefix = 'workspace-entry'): () => string {
  let counter = 0;

  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

export function normalizeWorkspacePath(path: string): string {
  const segments = path
    .replaceAll('\\', '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalized: string[] = [];
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

export function joinWorkspacePath(...parts: ReadonlyArray<string>): string {
  return normalizeWorkspacePath(parts.filter(Boolean).join('/'));
}

export function dirnameWorkspacePath(path: string): string {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === '/') {
    return '/';
  }

  const segments = normalized.split('/').filter(Boolean);
  segments.pop();
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

export function basenameWorkspacePath(path: string): string {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === '/') {
    return '';
  }

  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

export function createWorkspaceManifest(options: WorkspaceServiceOptions = {}): WorkspaceManifest {
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

function cloneMetadata(metadata: WorkspaceMetadata): WorkspaceMetadata {
  return {
    ...metadata,
    tags: metadata.tags ? [...metadata.tags] : undefined,
  };
}

function cloneWorkspaceManifestRecord(manifest: WorkspaceManifest): WorkspaceManifest {
  return {
    ...manifest,
  };
}

function snapshotWorkspaceState(input: WorkspaceService | WorkspaceState): WorkspaceState {
  return typeof (input as WorkspaceService).snapshot === 'function'
    ? (input as WorkspaceService).snapshot()
    : input as WorkspaceState;
}

function toArchiveResourcePath(path: string): string {
  const normalizedPath = normalizeWorkspacePath(path);
  const relativePath = normalizedPath.split('/').filter(Boolean).join('/');
  if (relativePath.length === 0) {
    throw new Error(`Cannot archive workspace resource without a path: ${path}`);
  }

  return `resources/${relativePath}`;
}

function normalizeArchiveEntryPath(path: string): string {
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

function createWorkspaceArchiveFolderRecord(folder: WorkspaceFolder): WorkspaceArchiveFolderRecord {
  return {
    id: folder.id,
    path: normalizeWorkspacePath(folder.path),
    parentId: folder.parentId,
    metadata: cloneMetadata(folder.metadata),
  };
}

function createWorkspaceArchiveResourceRecord(resource: WorkspaceResource): WorkspaceArchiveResourceRecord {
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

function parseWorkspaceArchiveManifest(bytes: Uint8Array): WorkspaceArchiveManifest {
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

  return parsed as WorkspaceArchiveManifest;
}

function cloneBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}

function createMetadata(title: string, now: () => string): WorkspaceMetadata {
  const timestamp = now();
  return {
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function matchesWorkspaceQuery(entry: WorkspaceEntry, query: WorkspaceQuery): boolean {
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

function rebuildFolderChildren(
  folders: ReadonlyArray<WorkspaceFolder>,
  resources: ReadonlyArray<WorkspaceResource>,
): WorkspaceFolder[] {
  return folders.map((folder) => ({
    ...folder,
    childIds: [
      ...folders.filter((candidate) => candidate.parentId === folder.id).map((candidate) => candidate.id),
      ...resources.filter((candidate) => candidate.parentId === folder.id).map((candidate) => candidate.id),
    ],
  }));
}

function createFolderEntry(
  input: WorkspaceCreateFolderInput,
  now: () => string,
  idFactory: () => string,
  parentId?: string,
): WorkspaceFolder {
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

function createTextEntry(
  input: WorkspaceCreateTextInput,
  now: () => string,
  idFactory: () => string,
  parentId?: string,
): WorkspaceTextResource {
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

function createBinaryEntry(
  input: WorkspaceCreateBinaryInput,
  now: () => string,
  idFactory: () => string,
  parentId?: string,
): WorkspaceBinaryResource {
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

function replaceById<T extends WorkspaceEntry>(entries: ReadonlyArray<T>, nextEntry: T): T[] {
  return entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry));
}

function removeById<T extends WorkspaceEntry>(entries: ReadonlyArray<T>, id: string): T[] {
  return entries.filter((entry) => entry.id !== id);
}

function updateDescendantPaths(entries: ReadonlyArray<WorkspaceEntry>, previousPath: string, nextPath: string): WorkspaceEntry[] {
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

function collectDescendants(entries: ReadonlyArray<WorkspaceEntry>, parentId: string): WorkspaceEntry[] {
  const directChildren = entries.filter((entry) => entry.parentId === parentId);
  return directChildren.flatMap((entry) => (entry.kind === 'folder' ? [entry, ...collectDescendants(entries, entry.id)] : [entry]));
}

function toResourceRef(entry: WorkspaceEntry): ResourceRef {
  return {
    resourceId: entry.id,
    path: entry.path,
    kind: entry.kind === 'folder' ? 'virtual' : entry.kind,
    mimeType: 'mimeType' in entry ? entry.mimeType : undefined,
    languageId: entry.kind === 'text' ? entry.languageId : undefined,
    parentResourceId: entry.parentId,
  };
}

export function createWorkspaceArchiveManifest(
  input: WorkspaceService | WorkspaceState,
  options: WorkspaceArchiveExportOptions = {},
): WorkspaceArchiveManifest {
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

export function exportWorkspaceToZip(
  input: WorkspaceService | WorkspaceState,
  options: WorkspaceArchiveExportOptions = {},
): Uint8Array {
  const state = snapshotWorkspaceState(input);
  const manifest = createWorkspaceArchiveManifest(state, options);
  const archiveEntries: Record<string, Uint8Array> = {
    [workspaceArchiveManifestPath]: textEncoder.encode(JSON.stringify(manifest, null, 2)),
  };

  for (const resource of state.resources) {
    archiveEntries[toArchiveResourcePath(resource.path)] = resource.kind === 'text'
      ? textEncoder.encode(resource.text)
      : cloneBytes(resource.bytes);
  }

  return zipSync(archiveEntries);
}

export function importWorkspaceFromZip(bytes: Uint8Array): WorkspaceArchiveImportResult {
  const archiveEntries = unzipSync(bytes);
  const manifestBytes = archiveEntries[workspaceArchiveManifestPath];
  if (!manifestBytes) {
    throw new Error(`Workspace archive is missing ${workspaceArchiveManifestPath}`);
  }

  const manifest = parseWorkspaceArchiveManifest(manifestBytes);
  const resources: WorkspaceResource[] = manifest.resources.map((resourceRecord) => {
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

  const folders: WorkspaceFolder[] = manifest.folders.map((folderRecord) => ({
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

  const state: WorkspaceState = {
    manifest: {
      ...cloneWorkspaceManifestRecord(manifest.workspace),
      rootPath: normalizeWorkspacePath(manifest.workspace.rootPath),
    },
    folders: rebuildFolderChildren(folders, resources),
    resources,
  };

  return {
    manifest: {
      format: manifest.format,
      version: manifest.version,
      exportedAt: manifest.exportedAt,
      workspace: state.manifest,
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

export function createWorkspaceService(options: WorkspaceServiceOptions = {}): WorkspaceService {
  const now = options.now ?? (() => new Date().toISOString());
  const idFactory = options.idFactory ?? createSequentialIdFactory(options.workspaceId ?? 'workspace-entry');

  let manifest = options.state?.manifest ?? createWorkspaceManifest(options);
  let folders = [...(options.state?.folders ?? [])];
  let resources = [...(options.state?.resources ?? [])];

  const rootFolder: WorkspaceFolder = {
    kind: 'folder',
    id: 'root',
    path: manifest.rootPath,
    metadata: {
      title: manifest.name,
      createdAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
    },
    childIds: [],
  };

  if (!folders.some((folder) => folder.id === rootFolder.id)) {
    folders = [rootFolder, ...folders];
  }

  function allEntries(): WorkspaceEntry[] {
    return [...folders, ...resources];
  }

  function snapshot(): WorkspaceState {
    return {
      manifest,
      folders: rebuildFolderChildren(folders, resources),
      resources: resources.map((resource) =>
        resource.kind === 'binary'
          ? { ...resource, bytes: cloneBytes(resource.bytes) }
          : { ...resource },
      ),
    };
  }

  function query(queryValue: WorkspaceQuery): ReadonlyArray<WorkspaceEntry> {
    return allEntries().filter((entry) => matchesWorkspaceQuery(entry, queryValue));
  }

  function getEntry(resourceId: string): WorkspaceEntry | undefined {
    return allEntries().find((entry) => entry.id === resourceId);
  }

  function getEntryByPath(path: string): WorkspaceEntry | undefined {
    return allEntries().find((entry) => entry.path === normalizeWorkspacePath(path));
  }

  function resolveParentFolder(path: string): WorkspaceFolder | undefined {
    const parentPath = dirnameWorkspacePath(path);
    return allEntries().find((entry): entry is WorkspaceFolder => entry.kind === 'folder' && entry.path === parentPath);
  }

  function createFolder(input: WorkspaceCreateFolderInput): WorkspaceFolder {
    const parent = resolveParentFolder(input.path);
    const nextFolder = createFolderEntry(input, now, idFactory, parent?.id);
    folders = [...folders, nextFolder];
    if (parent) {
      folders = folders.map((folder) =>
        folder.id === parent.id ? { ...folder, childIds: [...folder.childIds, nextFolder.id] } : folder,
      );
    }
    return nextFolder;
  }

  function createTextResource(input: WorkspaceCreateTextInput): WorkspaceTextResource {
    const parent = resolveParentFolder(input.path);
    const nextResource = createTextEntry(input, now, idFactory, parent?.id);
    resources = [...resources, nextResource];
    if (parent) {
      folders = folders.map((folder) =>
        folder.id === parent.id ? { ...folder, childIds: [...folder.childIds, nextResource.id] } : folder,
      );
    }
    return nextResource;
  }

  function createBinaryResource(input: WorkspaceCreateBinaryInput): WorkspaceBinaryResource {
    const parent = resolveParentFolder(input.path);
    const nextResource = createBinaryEntry(input, now, idFactory, parent?.id);
    resources = [...resources, nextResource];
    if (parent) {
      folders = folders.map((folder) =>
        folder.id === parent.id ? { ...folder, childIds: [...folder.childIds, nextResource.id] } : folder,
      );
    }
    return nextResource;
  }

  function saveTextResource(input: WorkspaceSaveTextInput): WorkspaceTextResource {
    const current = resources.find((entry) => entry.id === input.resourceId && entry.kind === 'text');
    if (!current) {
      throw new Error(`Unknown text resource: ${input.resourceId}`);
    }

    const nextResource: WorkspaceTextResource = {
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
    return nextResource;
  }

  function saveBinaryResource(input: WorkspaceSaveBinaryInput): WorkspaceBinaryResource {
    const current = resources.find((entry) => entry.id === input.resourceId && entry.kind === 'binary');
    if (!current) {
      throw new Error(`Unknown binary resource: ${input.resourceId}`);
    }

    const nextResource: WorkspaceBinaryResource = {
      ...current,
      bytes: cloneBytes(input.bytes),
      metadata: {
        ...current.metadata,
        updatedAt: input.updatedAt ?? now(),
      },
    };

    resources = replaceById(resources, nextResource);
    return nextResource;
  }

  function renameEntry(resourceId: string, path: string): WorkspaceEntry | undefined {
    const current = getEntry(resourceId);
    if (!current) {
      return undefined;
    }

    const nextPath = normalizeWorkspacePath(path);
    const updatedAt = now();

    if (current.kind === 'folder') {
      const folderDescendants = collectDescendants(allEntries(), current.id);
      folders = updateDescendantPaths(folders, current.path, nextPath) as WorkspaceFolder[];
      resources = updateDescendantPaths(resources, current.path, nextPath) as WorkspaceResource[];
      const nextFolder = folders.find((entry) => entry.id === current.id);
      if (!nextFolder) {
        return undefined;
      }

      const parent = resolveParentFolder(nextPath);
      const patchedFolder: WorkspaceFolder = {
        ...nextFolder,
        path: nextPath,
        parentId: parent?.id,
        metadata: { ...nextFolder.metadata, updatedAt },
        childIds: folderDescendants.filter((entry) => entry.parentId === current.id).map((entry) => entry.id),
      };
      folders = replaceById(folders, patchedFolder);
      return patchedFolder;
    }

    const parent = resolveParentFolder(nextPath);
    const nextResource: WorkspaceResource = {
      ...current,
      path: nextPath,
      parentId: parent?.id,
      metadata: { ...current.metadata, updatedAt },
    };
    resources = replaceById(resources, nextResource);
    return nextResource;
  }

  function moveEntry(input: WorkspaceMoveInput): WorkspaceEntry | undefined {
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

  function deleteEntry(resourceId: string): boolean {
    const current = getEntry(resourceId);
    if (!current) {
      return false;
    }

    if (current.kind === 'folder') {
      for (const descendant of collectDescendants(allEntries(), current.id)) {
        if (descendant.kind === 'folder') {
          folders = removeById(folders, descendant.id) as WorkspaceFolder[];
        } else {
          resources = removeById(resources, descendant.id) as WorkspaceResource[];
        }
      }
      folders = removeById(folders, current.id) as WorkspaceFolder[];
      return true;
    }

    resources = removeById(resources, current.id) as WorkspaceResource[];
    return true;
  }

  function resolveReference(source: ResourceRef, reference: string): ResourceRef | undefined {
    const resolvedPath = reference.startsWith('/')
      ? normalizeWorkspacePath(reference)
      : joinWorkspacePath(source.path ? dirnameWorkspacePath(source.path) : '/', reference);
    const entry = getEntryByPath(resolvedPath);
    return entry ? toResourceRef(entry) : undefined;
  }

  function applyMutation(mutation: WorkspaceMutation): WorkspaceEntry | boolean | undefined {
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

  return {
    workspaceId: manifest.workspaceId,
    snapshot,
    query,
    getEntry,
    getEntryByPath,
    createFolder,
    createTextResource,
    createBinaryResource,
    saveTextResource,
    saveBinaryResource,
    renameEntry,
    moveEntry,
    deleteEntry,
    resolveReference,
    applyMutation,
  };
}
