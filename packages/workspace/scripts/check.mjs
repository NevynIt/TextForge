import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';

import {
  basenameWorkspacePath,
  createPersistedWorkspaceService,
  createDefaultWorkspaceRepositoryRoots,
  createWorkspaceArchiveManifest,
  createSequentialIdFactory,
  createWorkspaceService,
  createWorkspaceTreeItems,
  dirnameWorkspacePath,
  exportWorkspaceToZip,
  exportWorkspaceFolderToZip,
  importWorkspaceFolderFromZip,
  importWorkspaceFromZip,
  joinWorkspacePath,
  listWorkspaceBadgeDiagnostics,
  mergeImportedWorkspaceState,
  normalizeWorkspacePath,
  resolveWorkspaceRepositoryLocation,
  resetWorkspaceDexieStorage,
  workspaceContribution,
  workspaceDexieSchema,
  workspaceEntryToResourceRef,
} from '../src/index.js';

assert.equal(normalizeWorkspacePath('docs/../roadmap/./note.md'), '/roadmap/note.md');
assert.equal(joinWorkspacePath('/docs', 'notes.md'), '/docs/notes.md');
assert.equal(dirnameWorkspacePath('/docs/notes.md'), '/docs');
assert.equal(basenameWorkspacePath('/docs/notes.md'), 'notes.md');
assert.equal(workspaceContribution.id, '@textforge/workspace');
assert.equal(
  resolveWorkspaceRepositoryLocation('bundled://docs/examples', {
    repositoryRoots: createDefaultWorkspaceRepositoryRoots(),
  }).resolvedPath,
  '/.textforge/resources/docs/examples',
);

const workspace = createWorkspaceService({
  workspaceId: 'workspace-check',
  state: {
    manifest: {
      workspaceId: 'workspace-check',
      name: 'Workspace Check',
      rootPath: '/',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z',
      selectedResourceId: undefined,
    },
    folders: [],
    resources: [],
  },
  idFactory: createSequentialIdFactory('entry'),
  now: () => '2026-05-23T00:00:00.000Z',
});

const folder = workspace.createFolder({ path: '/docs', title: 'docs' });
const text = workspace.createTextResource({ path: '/docs/notes.md', text: 'hello', languageId: 'markdown' });
const svg = workspace.createTextResource({
  path: '/docs/system.svg',
  text: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  languageId: 'svg',
  mimeType: 'image/svg+xml',
});
const binary = workspace.createBinaryResource({
  path: '/docs/report.pdf',
  bytes: new TextEncoder().encode('%PDF-1.7'),
  mimeType: 'application/pdf',
});

assert.equal(workspace.getEntry(folder.id)?.path, '/docs');
assert.equal(workspace.getEntry(text.id)?.path, '/docs/notes.md');
assert.equal(workspace.getEntry(svg.id)?.mimeType, 'image/svg+xml');
assert.equal(workspace.getEntry(binary.id)?.mimeType, 'application/pdf');
assert.equal(workspace.saveTextResource({
  resourceId: text.id,
  text: 'hello: world',
  languageId: 'yaml',
  mimeType: 'text/yaml',
}).languageId, 'yaml');

const items = createWorkspaceTreeItems(workspace.snapshot());
assert.equal(items.find((item) => item.id === text.id)?.detail, 'YAML');
assert.equal(Boolean(items.find((item) => item.id === text.id)?.badge?.key), true);
assert.equal(['center', 'top', 'right', 'bottom', 'left'].includes(items.find((item) => item.id === text.id)?.badge?.placement ?? ''), true);
assert.equal(Object.hasOwn(items.find((item) => item.id === text.id)?.badge ?? {}, 'rotation'), false);
assert.equal(listWorkspaceBadgeDiagnostics(workspace.snapshot()).length, 0);

const moved = workspace.moveEntry({ resourceId: text.id, parentPath: '/docs', title: 'guide.md' });
assert.equal(moved?.path, '/docs/guide.md');

const ref = workspaceEntryToResourceRef(binary);
assert.equal(ref.kind, 'resource');
assert.equal(ref.representation, 'bytes');

const archiveManifest = createWorkspaceArchiveManifest(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
const archiveBytes = exportWorkspaceToZip(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
const imported = importWorkspaceFromZip(archiveBytes);
const restoredWorkspace = createWorkspaceService({
  state: imported.state,
  idFactory: createSequentialIdFactory('restored'),
  now: () => '2026-05-23T00:00:00.000Z',
});

assert.equal(archiveManifest.format, 'textforge-workspace-archive');
assert.equal(archiveManifest.resources.find((resource) => resource.path === '/docs/system.svg')?.encoding, 'utf8');
assert.equal(archiveManifest.resources.find((resource) => resource.path === '/docs/report.pdf')?.encoding, 'binary');
assert.equal(imported.state.manifest.workspaceId, 'workspace-check');
assert.equal(restoredWorkspace.getEntryByPath('/docs/guide.md')?.kind, 'resource');
assert.equal(restoredWorkspace.getEntryByPath('/docs/guide.md')?.representation, 'text');
assert.equal(restoredWorkspace.getEntryByPath('/docs/guide.md')?.text, 'hello: world');
assert.equal(restoredWorkspace.getEntryByPath('/docs/system.svg')?.mimeType, 'image/svg+xml');
assert.equal(restoredWorkspace.getEntryByPath('/docs/system.svg')?.representation, 'text');
assert.equal(restoredWorkspace.getEntryByPath('/docs/report.pdf')?.representation, 'bytes');

const nestedWorkspace = createWorkspaceService({
  workspaceId: 'workspace-folder-check',
  idFactory: createSequentialIdFactory('folder'),
  now: () => '2026-05-23T00:00:00.000Z',
});
nestedWorkspace.createFolder({ path: '/docs' });
const guidesFolder = nestedWorkspace.createFolder({ path: '/docs/guides' });
nestedWorkspace.createTextResource({
  path: '/docs/guides/intro.md',
  text: '# Intro\n',
  languageId: 'markdown',
  mimeType: 'text/markdown',
});
const folderArchive = exportWorkspaceFolderToZip(nestedWorkspace, guidesFolder.path, { exportedAt: '2026-05-23T00:00:00.000Z' });
const importedFolderArchive = importWorkspaceFolderFromZip(folderArchive);
assert.deepEqual(importedFolderArchive.folders, []);
assert.equal(importedFolderArchive.files.some((resourceEntry) => resourceEntry.path === 'intro.md'), true);
const importedFolderWorkspace = createWorkspaceService({
  workspaceId: 'workspace-folder-import-check',
  idFactory: createSequentialIdFactory('folder-import'),
  now: () => '2026-05-23T00:00:00.000Z',
});
importedFolderWorkspace.createFolder({ path: '/guides' });
importedFolderWorkspace.createTextResource({
  path: '/guides/intro.md',
  text: '# Intro\n',
  languageId: 'markdown',
  mimeType: 'text/markdown',
});

const conflictTarget = createWorkspaceService({
  workspaceId: 'workspace-conflict-target',
  idFactory: createSequentialIdFactory('target'),
  now: () => '2026-05-23T00:00:00.000Z',
});
conflictTarget.createFolder({ path: '/guides' });
conflictTarget.createTextResource({ path: '/guides/old.md', text: '# Old\n', languageId: 'markdown', mimeType: 'text/markdown' });
assert.equal(mergeImportedWorkspaceState(conflictTarget.snapshot(), importedFolderWorkspace.snapshot(), {
  conflictPolicy: 'replace',
}).resources.some((resourceEntry) => resourceEntry.path === '/guides/intro.md'), true);

assert.equal(typeof workspaceDexieSchema.system, 'string');
assert.equal(typeof workspaceDexieSchema.resources, 'string');

const databaseName = `workspace-check-${Math.random().toString(16).slice(2)}`;
await resetWorkspaceDexieStorage({ databaseName });

const persisted = await createPersistedWorkspaceService({
  storageOptions: { databaseName },
  seed: workspace.snapshot(),
  idFactory: createSequentialIdFactory('entry'),
  now: () => '2026-05-24T00:00:00.000Z',
});
persisted.workspace.setSelectedResourceId(text.id);
persisted.workspace.createTextResource({
  path: '/docs/persisted.md',
  text: '# Persisted\n',
  languageId: 'markdown',
  mimeType: 'text/markdown',
});
await persisted.workspace.whenIdle();
persisted.workspace.disposePersistence();

const restored = await createPersistedWorkspaceService({
  storageOptions: { databaseName },
  idFactory: createSequentialIdFactory('entry'),
  now: () => '2026-05-24T00:00:00.000Z',
});
assert.equal(restored.hydrationSource, 'storage');
assert.equal(restored.workspace.getManifest().selectedResourceId, text.id);
assert.equal(restored.workspace.getEntryByPath('/docs/persisted.md')?.kind, 'resource');
assert.equal(restored.workspace.getEntryByPath('/docs/persisted.md')?.representation, 'text');
restored.workspace.disposePersistence();
await resetWorkspaceDexieStorage({ databaseName });

console.info('workspace package checks passed');
