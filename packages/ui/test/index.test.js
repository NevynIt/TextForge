import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  TextForgeAppFrame,
  TextForgeCommandPalette,
  TextForgeSessionTabStrip,
  TextForgeTopBar,
  TextForgeUtilityPane,
  TextForgeWorkspaceSidebar,
  createWorkbenchChromeModel,
  createWorkspaceTreeFrameModel,
} from '../src/index.js';

test('ui package renders react shell primitives from chrome models', () => {
  const chrome = createWorkbenchChromeModel({
    workspaceTree: createWorkspaceTreeFrameModel({
      items: [{ id: 'resource-1', label: 'notes.md', path: '/docs/notes.md', kind: 'text', depth: 1 }],
      selectedResourceId: 'resource-1',
    }),
    surfaceFrame: {
      id: 'main-tabs',
      title: 'Documents',
      placement: 'main',
      layout: 'tabs',
      activeTabId: 'tab-1',
      tabs: [{ id: 'tab-1', surfaceId: 'surface-1', resourceId: 'resource-1', title: 'notes.md' }],
    },
  });

  const html = renderToStaticMarkup(
    React.createElement(
      TextForgeAppFrame,
      {
        header: React.createElement(TextForgeTopBar, {
          brandTitle: chrome.brandTitle,
          commandPaletteLabel: 'Commands',
          commandPaletteShortcut: 'Ctrl+K',
          menuGroups: [{ id: 'workspace', label: 'Workspace', items: [{ commandId: 'workspace.export', label: 'Export workspace ZIP' }] }],
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
      React.createElement(
        React.Fragment,
        null,
        React.createElement(TextForgeSessionTabStrip, {
          frameModel: chrome.surfaceFrame,
        }),
        React.createElement(TextForgeCommandPalette, {
          entries: [{ commandId: 'workspace.export', label: 'Export workspace ZIP', group: 'Workspace' }],
          open: true,
          title: 'Command palette',
        }),
      ),
    ),
  );

  assert.match(html, /TextForge/);
  assert.match(html, /notes\.md/);
  assert.match(html, /Contribution Packs/);
  assert.match(html, /Workspace/);
  assert.match(html, /Command palette/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tree"/);
  assert.match(html, /role="treeitem"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /data-pane="workspace"/);
});
