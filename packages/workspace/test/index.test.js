import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';
import test from 'node:test';
import Dexie from 'dexie';

import {
  createWorkspaceContributionManifest,
  createWorkspaceArchiveManifest,
  createPersistedWorkspaceService,
  createSequentialIdFactory,
  createWorkspaceManifest,
  createWorkspaceService,
  createWorkspaceTreeItems,
  exportWorkspaceToZip,
  exportWorkspaceFolderToZip,
  importWorkspaceFromZip,
  mergeImportedWorkspaceState,
  normalizeWorkspacePath,
  openWorkspaceDexieStorage,
  resetWorkspaceDexieStorage,
  workspaceDexieSchema,
  workspaceDexieSchemaVersion,
} from '../src/index.js';

const textEncoder = new TextEncoder();
const fixedNow = () => '2026-05-24T00:00:00.000Z';

function createDatabaseName(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

function createSeedWorkspaceState() {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-persisted-test',
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });

  workspace.createFolder({ path: '/docs' });
  workspace.createTextResource({
    path: '/docs/notes.md',
    text: '# Stored notes\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  workspace.createBinaryResource({
    path: '/docs/system.svg',
    bytes: textEncoder.encode('<svg xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16"/></svg>'),
    mimeType: 'image/svg+xml',
  });

  return workspace.snapshot();
}

test('workspace service normalizes paths and mutates entries', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  const docs = workspace.createFolder({ path: '/docs' });
  const notes = workspace.createTextResource({ path: '/docs/notes.md', text: '# Notes', languageId: 'markdown' });
  const updated = workspace.saveTextResource({
    resourceId: notes.id,
    text: '# Updated notes',
    languageId: 'yaml',
    mimeType: 'text/yaml',
  });

  assert.equal(normalizeWorkspacePath('docs/../docs/notes.md'), '/docs/notes.md');
  assert.equal(docs.path, '/docs');
  assert.equal(updated.text, '# Updated notes');
  assert.equal(updated.languageId, 'yaml');
  assert.equal(updated.mimeType, 'text/yaml');
  assert.equal(createWorkspaceTreeItems(workspace.snapshot()).length >= 2, true);
});

test('workspace contribution manifest exposes the Phase 3.3 shell commands', () => {
  const manifest = createWorkspaceContributionManifest();

  assert.equal(manifest.packageId, '@textforge/workspace');
  assert.deepEqual(
    manifest.commands.map((command) => command.id),
    [
      'workspace.new-folder',
      'workspace.new-resource',
      'workspace.import-workspace',
      'workspace.export-workspace',
      'workspace.export-selected-folder',
      'workspace.rename-selected',
      'workspace.delete-selected',
      'workspace.reset-storage',
      'workspace.retry-storage',
    ],
  );
});

test('workspace archives round-trip full workspace state through zip', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-archive-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  workspace.createFolder({ path: '/docs' });
  const notes = workspace.createTextResource({
    path: '/docs/notes.md',
    text: '# Notes\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });
  const binaryBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  workspace.createBinaryResource({
    path: '/docs/system.svg',
    bytes: binaryBytes,
    mimeType: 'image/svg+xml',
  });

  const manifest = createWorkspaceArchiveManifest(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const archive = exportWorkspaceToZip(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const imported = importWorkspaceFromZip(archive);
  const restoredWorkspace = createWorkspaceService({
    state: imported.state,
    idFactory: createSequentialIdFactory('restored'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  assert.equal(manifest.format, 'textforge-workspace-archive');
  assert.equal(manifest.resources.find((resource) => resource.id === notes.id)?.encoding, 'utf8');
  assert.equal(imported.state.manifest.workspaceId, 'workspace-archive-test');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/notes.md')?.kind, 'text');
  assert.equal(restoredWorkspace.getEntryByPath('/docs/notes.md')?.text, '# Notes\n');
  assert.deepEqual(restoredWorkspace.getEntryByPath('/docs/system.svg')?.bytes, binaryBytes);
});

test('selected folder export rebases a nested folder subtree at archive root', () => {
  const workspace = createWorkspaceService({
    workspaceId: 'workspace-folder-export-test',
    idFactory: createSequentialIdFactory('entry'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  workspace.createFolder({ path: '/docs' });
  const guides = workspace.createFolder({ path: '/docs/guides' });
  workspace.createTextResource({
    path: '/docs/guides/intro.md',
    text: '# Intro\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const archive = exportWorkspaceFolderToZip(workspace, guides.path, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const imported = importWorkspaceFromZip(archive);
  const restoredWorkspace = createWorkspaceService({
    state: imported.state,
    idFactory: createSequentialIdFactory('restored'),
    now: () => '2026-05-23T00:00:00.000Z',
  });

  assert.equal(restoredWorkspace.getEntryByPath('/guides')?.kind, 'folder');
  assert.equal(restoredWorkspace.getEntryByPath('/guides/intro.md')?.kind, 'text');
  assert.equal(restoredWorkspace.getEntryByPath('/docs'), undefined);
});

test('workspace import conflict policies are explicit when merging imported archives', () => {
  const existingWorkspace = createWorkspaceService({
    workspaceId: 'workspace-conflict-target',
    idFactory: createSequentialIdFactory('target'),
    now: () => '2026-05-23T00:00:00.000Z',
  });
  existingWorkspace.createFolder({ path: '/guides' });
  existingWorkspace.createTextResource({
    path: '/guides/old.md',
    text: '# Old\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const importWorkspace = createWorkspaceService({
    workspaceId: 'workspace-conflict-source',
    idFactory: createSequentialIdFactory('source'),
    now: () => '2026-05-23T00:00:00.000Z',
  });
  importWorkspace.createFolder({ path: '/docs' });
  const guides = importWorkspace.createFolder({ path: '/docs/guides' });
  importWorkspace.createTextResource({
    path: '/docs/guides/new.md',
    text: '# New\n',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  const archive = exportWorkspaceFolderToZip(importWorkspace, guides.path, { exportedAt: '2026-05-23T00:00:00.000Z' });
  const imported = importWorkspaceFromZip(archive);

  assert.throws(
    () => mergeImportedWorkspaceState(existingWorkspace.snapshot(), imported.state, { conflictPolicy: 'error' }),
    /Workspace import conflict at \/guides/,
  );

  const skippedState = mergeImportedWorkspaceState(existingWorkspace.snapshot(), imported.state, { conflictPolicy: 'skip' });
  const replacedState = mergeImportedWorkspaceState(existingWorkspace.snapshot(), imported.state, { conflictPolicy: 'replace' });

  assert.equal(skippedState.resources.some((resource) => resource.path === '/guides/new.md'), false);
  assert.equal(replacedState.resources.some((resource) => resource.path === '/guides/new.md'), true);
  assert.equal(replacedState.resources.some((resource) => resource.path === '/guides/old.md'), false);
  assert.equal(importWorkspaceFromZip(archive, {
    existingState: existingWorkspace.snapshot(),
    conflictPolicy: 'replace',
  }).state.resources.some((resource) => resource.path === '/guides/new.md'), true);
});

test('persisted workspace service hydrates through Dexie and preserves IDs, selection, and binary content', async () => {
  const databaseName = createDatabaseName('workspace-dexie-hydrate');
  await resetWorkspaceDexieStorage({ databaseName });

  const firstPass = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    seed: createSeedWorkspaceState(),
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });

  assert.equal(firstPass.hydrationSource, 'seed');
  const selectedResource = firstPass.workspace.getEntryByPath('/docs/notes.md');
  firstPass.workspace.setSelectedResourceId(selectedResource?.id);
  const createdText = firstPass.workspace.createTextResource({
    path: '/docs/followup.md',
    text: 'persist me',
    languageId: 'text',
    mimeType: 'text/plain',
  });
  const createdBinary = firstPass.workspace.createBinaryResource({
    path: '/docs/diagram.svg',
    bytes: textEncoder.encode('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6"/></svg>'),
    mimeType: 'image/svg+xml',
  });
  await firstPass.workspace.whenIdle();
  firstPass.workspace.disposePersistence();

  const restored = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    idFactory: createSequentialIdFactory('entry'),
    now: fixedNow,
  });

  assert.equal(restored.hydrationSource, 'storage');
  assert.equal(restored.workspace.getManifest().selectedResourceId, selectedResource?.id);
  assert.equal(restored.workspace.getEntryByPath('/docs/followup.md')?.text, 'persist me');
  assert.deepEqual(restored.workspace.getEntryByPath('/docs/diagram.svg')?.bytes, createdBinary.bytes);

  const postHydration = restored.workspace.createTextResource({
    path: '/docs/post-hydration.md',
    text: 'new file',
    languageId: 'markdown',
    mimeType: 'text/markdown',
  });

  assert.notEqual(postHydration.id, createdText.id);
  assert.notEqual(postHydration.id, createdBinary.id);
  await restored.workspace.whenIdle();
  restored.workspace.disposePersistence();
  await resetWorkspaceDexieStorage({ databaseName });
});

test('workspace Dexie storage detects corrupted records and explicit reset recovers cleanly', async () => {
  const databaseName = createDatabaseName('workspace-dexie-corrupt');
  await resetWorkspaceDexieStorage({ databaseName });

  const database = new Dexie(databaseName);
  database.version(workspaceDexieSchemaVersion).stores(workspaceDexieSchema);
  await database.open();
  await database.table('manifests').put(createWorkspaceManifest({
    workspaceId: 'broken-workspace',
    name: 'Broken workspace',
    now: fixedNow,
  }));
  database.close();

  const storage = await openWorkspaceDexieStorage({ databaseName });
  await assert.rejects(
    () => storage.loadState(),
    /missing the schema version record/i,
  );
  storage.close();

  await resetWorkspaceDexieStorage({ databaseName });

  const recovered = await createPersistedWorkspaceService({
    storageOptions: { databaseName },
    seed: createSeedWorkspaceState(),
    now: fixedNow,
  });

  assert.equal(recovered.hydrationSource, 'seed');
  assert.equal(recovered.workspace.getEntryByPath('/docs/notes.md')?.kind, 'text');
  recovered.workspace.disposePersistence();
  await resetWorkspaceDexieStorage({ databaseName });
});
