import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSequentialIdFactory,
  createWorkspaceService,
  createWorkspaceTreeItems,
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
