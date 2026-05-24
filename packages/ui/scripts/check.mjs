import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  TextForgeAppFrame,
  TextForgeSessionTabStrip,
  TextForgeTopBar,
  TextForgeUtilityPane,
  TextForgeWorkspaceSidebar,
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
assert.equal(defaultTheme.colors.brand, '#152033');
assert.equal(createToolbarSlot({ id: 'slot-1', label: 'Slot', kind: 'command' }).kind, 'command');
assert.equal(createStatusBadge({ id: 'badge-1', label: 'Ready', tone: 'success' }).tone, 'success');

const chrome = createWorkbenchChromeModel({
  workspaceTree: createWorkspaceTreeFrameModel({
    items: [{ id: 'resource-1', label: 'notes.md', path: '/docs/notes.md', kind: 'text', depth: 1 }],
    selectedResourceId: 'resource-1',
  }),
  surfaceFrame: createSurfaceFrameModel({
    tabs: [{ id: 'tab-1', title: 'Welcome', surfaceId: 'welcome', active: true }],
    activeTabId: 'tab-1',
  }),
});

const html = renderToStaticMarkup(
  React.createElement(
    TextForgeAppFrame,
    {
      header: React.createElement(TextForgeTopBar, {
        brandTitle: chrome.brandTitle,
        sidebarCollapsed: false,
        statusBadges: chrome.statusBadges,
        subtitle: chrome.subtitle,
        toolbarSlots: chrome.toolbarSlots,
        utilityOpen: true,
      }),
      sidebar: React.createElement(TextForgeWorkspaceSidebar, {
        collapsed: false,
        workspaceTree: chrome.workspaceTree,
      }),
      utility: React.createElement(TextForgeUtilityPane, {
        activeSectionId: 'registry',
        sections: [{ id: 'registry', label: 'Contribution Packs' }],
        title: 'Utility',
      }, React.createElement('div', null, 'Registry content')),
      utilityOpen: true,
    },
    React.createElement(TextForgeSessionTabStrip, {
      frameModel: chrome.surfaceFrame,
    }),
  ),
);

assert.equal(chrome.workspaceTree.items.length, 1);
assert.equal(chrome.surfaceFrame.tabs[0].title, 'Welcome');
assert.equal(createWorkbenchTheme({ name: 'Custom' }).name, 'Custom');
assert.equal(createAppFrameModel().brandTitle, 'TextForge');
assert.match(html, /data-pane="workspace"/);
assert.match(html, /role="tablist"/);
assert.match(html, /role="tree"/);
assert.match(html, /role="treeitem"/);
assert.match(html, /aria-selected="true"/);
assert.match(html, /tabindex="0"/);

console.info('ui package checks passed');
