import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWorkspaceArchiveManifest,
  createSequentialIdFactory,
  createWorkspaceService,
  createWorkspaceTreeItems,
  exportWorkspaceToZip,
  importWorkspaceFromZip,
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
