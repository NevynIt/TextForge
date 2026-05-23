import assert from 'node:assert/strict';

import {
  basenameWorkspacePath,
  createWorkspaceArchiveManifest,
  createSequentialIdFactory,
  createWorkspaceService,
  createWorkspaceTreeItems,
  dirnameWorkspacePath,
  exportWorkspaceToZip,
  importWorkspaceFromZip,
  joinWorkspacePath,
  normalizeWorkspacePath,
  workspaceContribution,
  workspaceEntryToResourceRef,
} from '../src/index.js';

assert.equal(normalizeWorkspacePath('docs/../roadmap/./note.md'), '/roadmap/note.md');
assert.equal(joinWorkspacePath('/docs', 'notes.md'), '/docs/notes.md');
assert.equal(dirnameWorkspacePath('/docs/notes.md'), '/docs');
assert.equal(basenameWorkspacePath('/docs/notes.md'), 'notes.md');
assert.equal(workspaceContribution.id, '@textforge/workspace');

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
const binary = workspace.createBinaryResource({
  path: '/docs/system.svg',
  bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
  mimeType: 'image/svg+xml',
});

assert.equal(workspace.getEntry(folder.id)?.path, '/docs');
assert.equal(workspace.getEntry(text.id)?.path, '/docs/notes.md');
assert.equal(workspace.getEntry(binary.id)?.mimeType, 'image/svg+xml');
assert.equal(workspace.saveTextResource({
  resourceId: text.id,
  text: 'hello: world',
  languageId: 'yaml',
  mimeType: 'text/yaml',
}).languageId, 'yaml');

const items = createWorkspaceTreeItems(workspace.snapshot());
assert.equal(items.find((item) => item.id === text.id)?.badge, 'YAML');

const moved = workspace.moveEntry({ resourceId: text.id, parentPath: '/docs', title: 'guide.md' });
assert.equal(moved?.path, '/docs/guide.md');

const ref = workspaceEntryToResourceRef(binary);
assert.equal(ref.kind, 'binary');

const archiveManifest = createWorkspaceArchiveManifest(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
const archiveBytes = exportWorkspaceToZip(workspace, { exportedAt: '2026-05-23T00:00:00.000Z' });
const imported = importWorkspaceFromZip(archiveBytes);
const restoredWorkspace = createWorkspaceService({
  state: imported.state,
  idFactory: createSequentialIdFactory('restored'),
  now: () => '2026-05-23T00:00:00.000Z',
});

assert.equal(archiveManifest.format, 'textforge-workspace-archive');
assert.equal(archiveManifest.resources.find((resource) => resource.path === '/docs/system.svg')?.encoding, 'binary');
assert.equal(imported.state.manifest.workspaceId, 'workspace-check');
assert.equal(restoredWorkspace.getEntryByPath('/docs/guide.md')?.kind, 'text');
assert.equal(restoredWorkspace.getEntryByPath('/docs/guide.md')?.text, 'hello: world');
assert.equal(restoredWorkspace.getEntryByPath('/docs/system.svg')?.mimeType, 'image/svg+xml');

console.info('workspace package checks passed');
