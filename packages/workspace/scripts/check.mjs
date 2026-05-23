import assert from 'node:assert/strict';

import {
  basenameWorkspacePath,
  createSequentialIdFactory,
  createWorkspaceService,
  createWorkspaceTreeItems,
  dirnameWorkspacePath,
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

const items = createWorkspaceTreeItems(workspace.snapshot());
assert.equal(items.find((item) => item.id === text.id)?.badge, 'MARKDOWN');

const moved = workspace.moveEntry({ resourceId: text.id, parentPath: '/docs', title: 'guide.md' });
assert.equal(moved?.path, '/docs/guide.md');

const ref = workspaceEntryToResourceRef(binary);
assert.equal(ref.kind, 'binary');

console.info('workspace package checks passed');
