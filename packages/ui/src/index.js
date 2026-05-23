export function createWorkbenchTheme(overrides = {}) {
  const defaultTheme = {
    id: 'textforge-default',
    name: 'TextForge Default',
    mode: 'system',
    colors: {
      brand: '#0b3d91',
      accent: '#3168d5',
      background: '#0f172a',
      surface: '#111827',
      surfaceRaised: '#1f2937',
      border: '#334155',
      text: '#e5e7eb',
      mutedText: '#94a3b8',
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
    },
    typography: {
      family: '"IBM Plex Sans", "Segoe UI", sans-serif',
      size: '14px',
      lineHeight: '1.5',
      weightRegular: 400,
      weightStrong: 600,
    },
    radius: '10px',
    shadow: '0 12px 32px rgb(15 23 42 / 0.24)',
  };

  return {
    ...defaultTheme,
    ...overrides,
    colors: {
      ...defaultTheme.colors,
      ...(overrides.colors ?? {}),
    },
    typography: {
      ...defaultTheme.typography,
      ...(overrides.typography ?? {}),
    },
  };
}

export const defaultTheme = createWorkbenchTheme();

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
    title: 'Surface',
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
      { id: 'command-palette', label: 'Command palette', pinned: false },
      { id: 'workspace-tree', label: 'Workspace tree', pinned: true },
      { id: 'surface-chrome', label: 'Surface chrome', pinned: true },
    ],
    regions: [
      { id: 'toolbar', title: 'Toolbar', kind: 'toolbar', slotIds: ['command-palette'] },
      { id: 'sidebar', title: 'Sidebar', kind: 'sidebar', slotIds: ['workspace-tree'] },
      { id: 'main', title: 'Main surface', kind: 'main', slotIds: ['surface-chrome'] },
    ],
    workspaceTree: createWorkspaceTreeFrameModel(),
    surfaceFrame: createSurfaceFrameModel(),
    toolbarSlots: [
      createToolbarSlot({ id: 'open-workspace', label: 'Open workspace', kind: 'command', pinned: true }),
      createToolbarSlot({ id: 'insert-item', label: 'Insert item', kind: 'workspace' }),
    ],
    statusBadges: [
      createStatusBadge({ id: 'workspace-status', label: 'Workspace ready', tone: 'success' }),
      createStatusBadge({ id: 'surface-status', label: 'Surface host idle', tone: 'neutral' }),
    ],
    ...overrides,
    theme: overrides.theme ?? defaultTheme,
    slots: overrides.slots ?? [
      { id: 'command-palette', label: 'Command palette', pinned: false },
      { id: 'workspace-tree', label: 'Workspace tree', pinned: true },
      { id: 'surface-chrome', label: 'Surface chrome', pinned: true },
    ],
    regions: overrides.regions ?? [
      { id: 'toolbar', title: 'Toolbar', kind: 'toolbar', slotIds: ['command-palette'] },
      { id: 'sidebar', title: 'Sidebar', kind: 'sidebar', slotIds: ['workspace-tree'] },
      { id: 'main', title: 'Main surface', kind: 'main', slotIds: ['surface-chrome'] },
    ],
    workspaceTree: overrides.workspaceTree ?? createWorkspaceTreeFrameModel(),
    surfaceFrame: overrides.surfaceFrame ?? createSurfaceFrameModel(),
    toolbarSlots: overrides.toolbarSlots ?? [
      createToolbarSlot({ id: 'open-workspace', label: 'Open workspace', kind: 'command', pinned: true }),
      createToolbarSlot({ id: 'insert-item', label: 'Insert item', kind: 'workspace' }),
    ],
    statusBadges: overrides.statusBadges ?? [
      createStatusBadge({ id: 'workspace-status', label: 'Workspace ready', tone: 'success' }),
      createStatusBadge({ id: 'surface-status', label: 'Surface host idle', tone: 'neutral' }),
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

export const defaultIcons = [
  { name: 'search', glyph: 'S', viewBox: '0 0 24 24' },
  { name: 'check', glyph: 'C', viewBox: '0 0 24 24' },
  { name: 'warning', glyph: '!', viewBox: '0 0 24 24' },
  { name: 'close', glyph: 'X', viewBox: '0 0 24 24' },
];

export const contributions = {
  id: '@textforge/ui',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};
