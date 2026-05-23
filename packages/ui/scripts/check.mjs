import assert from 'node:assert/strict';

import {
  contributions,
  createAppFrameModel,
  createStatusBadge,
  createSurfaceFrameModel,
  createToolbarSlot,
  createWorkbenchChromeModel,
  createWorkbenchTheme,
  createWorkspaceTreeFrameModel,
  defaultTheme,
} from '../src/index.js';

assert.equal(contributions.id, '@textforge/ui');
assert.equal(defaultTheme.colors.brand, '#0b3d91');
assert.equal(createToolbarSlot({ id: 'slot-1', label: 'Slot', kind: 'command' }).kind, 'command');
assert.equal(createStatusBadge({ id: 'badge-1', label: 'Ready', tone: 'success' }).tone, 'success');

const chrome = createWorkbenchChromeModel({
  workspaceTree: createWorkspaceTreeFrameModel({ items: [{ id: 'resource-1', label: 'notes.md', path: '/docs/notes.md', kind: 'text', depth: 1 }] }),
  surfaceFrame: createSurfaceFrameModel({ tabs: [{ id: 'tab-1', title: 'Welcome', active: true }] }),
});

assert.equal(chrome.workspaceTree.items.length, 1);
assert.equal(chrome.surfaceFrame.tabs[0].title, 'Welcome');
assert.equal(createWorkbenchTheme({ name: 'Custom' }).name, 'Custom');
assert.equal(createAppFrameModel().brandTitle, 'TextForge');

console.info('ui package checks passed');
