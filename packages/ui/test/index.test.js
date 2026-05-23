import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAppFrameModel,
  createWorkbenchChromeModel,
  createWorkspaceTreeFrameModel,
} from '../src/index.js';

test('ui chrome models preserve workspace and surface models', () => {
  const chrome = createWorkbenchChromeModel({
    workspaceTree: createWorkspaceTreeFrameModel({
      items: [{ id: 'resource-1', label: 'notes.md', path: '/docs/notes.md', kind: 'text', depth: 1 }],
    }),
  });

  assert.equal(chrome.brandTitle, 'TextForge');
  assert.equal(chrome.workspaceTree.items[0].label, 'notes.md');
  assert.equal(createAppFrameModel().statusBadges.length, 2);
});
