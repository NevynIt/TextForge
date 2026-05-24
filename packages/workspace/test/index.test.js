import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWorkspaceArchiveManifest,
  createSequentialIdFactory,
  createWorkspaceService,
  createWorkspaceTreeItems,
  exportWorkspaceToZip,
  exportWorkspaceFolderToZip,
  importWorkspaceFromZip,
  mergeImportedWorkspaceState,
  normalizeWorkspacePath,
} from '../src/index.js';

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
