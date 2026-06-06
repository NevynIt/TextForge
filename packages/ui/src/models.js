import { defaultTheme } from './theme.js';

export function createWorkspaceTreeFrameModel(overrides = {}) {
  return {
    id: 'workspace-tree-frame',
    title: 'Workspace',
    rootLabel: 'Workspace root',
    items: [],
    selectedResourceId: undefined,
    ...overrides,
    items: overrides.items ?? [],
  };
}

export function createSurfaceFrameModel(overrides = {}) {
  return {
    id: 'surface-frame',
    title: 'Documents',
    placement: 'main',
    layout: 'tabs',
    tabs: [],
    activeTabId: undefined,
    ...overrides,
    tabs: overrides.tabs ?? [],
  };
}

export function createToolbarSlot(overrides) {
  return {
    ...overrides,
  };
}

export function createStatusBadge(overrides) {
  return {
    ...overrides,
  };
}

export function createAppFrameModel(overrides = {}) {
  return {
    id: 'textforge-app-frame',
    brandTitle: 'TextForge',
    subtitle: 'Local-first workbench shell',
    density: 'comfortable',
    theme: defaultTheme,
    slots: [
      { id: 'workspace-tree', label: 'Workspace tree', pinned: true },
      { id: 'surface-chrome', label: 'Surface chrome', pinned: true },
      { id: 'utility-pane', label: 'Utility pane', pinned: false },
    ],
    regions: [
      { id: 'toolbar', title: 'Toolbar', kind: 'toolbar', slotIds: ['workspace-tree', 'utility-pane'] },
      { id: 'sidebar', title: 'Sidebar', kind: 'sidebar', slotIds: ['workspace-tree'] },
      { id: 'main', title: 'Main surface', kind: 'main', slotIds: ['surface-chrome'] },
      { id: 'utility', title: 'Utility pane', kind: 'overlay', slotIds: ['utility-pane'] },
    ],
    workspaceTree: createWorkspaceTreeFrameModel(),
    surfaceFrame: createSurfaceFrameModel(),
    toolbarSlots: [],
    statusBadges: [
      createStatusBadge({ id: 'workspace-status', label: 'Workspace ready', tone: 'success' }),
      createStatusBadge({ id: 'surface-status', label: 'No active documents', tone: 'neutral' }),
    ],
    ...overrides,
    theme: overrides.theme ?? defaultTheme,
    slots: overrides.slots ?? [
      { id: 'workspace-tree', label: 'Workspace tree', pinned: true },
      { id: 'surface-chrome', label: 'Surface chrome', pinned: true },
      { id: 'utility-pane', label: 'Utility pane', pinned: false },
    ],
    regions: overrides.regions ?? [
      { id: 'toolbar', title: 'Toolbar', kind: 'toolbar', slotIds: ['workspace-tree', 'utility-pane'] },
      { id: 'sidebar', title: 'Sidebar', kind: 'sidebar', slotIds: ['workspace-tree'] },
      { id: 'main', title: 'Main surface', kind: 'main', slotIds: ['surface-chrome'] },
      { id: 'utility', title: 'Utility pane', kind: 'overlay', slotIds: ['utility-pane'] },
    ],
    workspaceTree: overrides.workspaceTree ?? createWorkspaceTreeFrameModel(),
    surfaceFrame: overrides.surfaceFrame ?? createSurfaceFrameModel(),
    toolbarSlots: overrides.toolbarSlots ?? [],
    statusBadges: overrides.statusBadges ?? [
      createStatusBadge({ id: 'workspace-status', label: 'Workspace ready', tone: 'success' }),
      createStatusBadge({ id: 'surface-status', label: 'No active documents', tone: 'neutral' }),
    ],
  };
}

export function createWorkbenchChromeModel(overrides = {}) {
  const frame = createAppFrameModel(overrides);
  return {
    ...frame,
    workspaceTree: frame.workspaceTree ?? createWorkspaceTreeFrameModel(),
    surfaceFrame: frame.surfaceFrame ?? createSurfaceFrameModel(),
    toolbarSlots: frame.toolbarSlots ?? [],
    statusBadges: frame.statusBadges ?? [],
  };
}

export const defaultAppFrameModel = createAppFrameModel();

