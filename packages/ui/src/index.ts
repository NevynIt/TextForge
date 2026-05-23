export type ThemeMode = 'light' | 'dark' | 'system';
export type ChromeDensity = 'compact' | 'comfortable';
export type FrameRegionKind = 'toolbar' | 'sidebar' | 'main' | 'footer' | 'overlay';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type WorkspaceTreeItemKind = 'folder' | 'text' | 'binary';
export type SurfaceTabLayout = 'single' | 'tabs';

export interface ThemeTokens {
  readonly brand: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly text: string;
  readonly mutedText: string;
  readonly danger: string;
  readonly warning: string;
  readonly success: string;
}

export interface TypographyTokens {
  readonly family: string;
  readonly size: string;
  readonly lineHeight: string;
  readonly weightRegular: number;
  readonly weightStrong: number;
}

export interface WorkbenchTheme {
  readonly id: string;
  readonly name: string;
  readonly mode: ThemeMode;
  readonly colors: ThemeTokens;
  readonly typography: TypographyTokens;
  readonly radius: string;
  readonly shadow: string;
}

export interface ChromeSlot {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly pinned?: boolean;
}

export interface ToolbarSlot {
  readonly id: string;
  readonly label: string;
  readonly kind: 'command' | 'navigation' | 'status' | 'workspace';
  readonly description?: string;
  readonly pinned?: boolean;
}

export interface FrameRegion {
  readonly id: string;
  readonly title: string;
  readonly kind: FrameRegionKind;
  readonly slotIds?: ReadonlyArray<string>;
}

export interface WorkspaceTreeItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly kind: WorkspaceTreeItemKind;
  readonly depth: number;
  readonly expanded?: boolean;
  readonly active?: boolean;
  readonly badge?: string;
}

export interface WorkspaceTreeFrame {
  readonly id: string;
  readonly title: string;
  readonly rootLabel: string;
  readonly items: ReadonlyArray<WorkspaceTreeItem>;
  readonly selectedResourceId?: string;
}

export interface SurfaceTab {
  readonly id: string;
  readonly surfaceId?: string;
  readonly resourceId?: string;
  readonly title: string;
  readonly active?: boolean;
  readonly dirty?: boolean;
  readonly stale?: boolean;
}

export interface SurfaceFrame {
  readonly id: string;
  readonly title: string;
  readonly placement: 'main' | 'popup';
  readonly layout: SurfaceTabLayout;
  readonly tabs: ReadonlyArray<SurfaceTab>;
  readonly activeTabId?: string;
}

export interface StatusBadge {
  readonly id: string;
  readonly label: string;
  readonly tone: BadgeTone;
  readonly detail?: string;
}

export interface AppFrameModel {
  readonly id: string;
  readonly brandTitle: string;
  readonly subtitle?: string;
  readonly density: ChromeDensity;
  readonly theme: WorkbenchTheme;
  readonly slots: ReadonlyArray<ChromeSlot>;
  readonly regions: ReadonlyArray<FrameRegion>;
  readonly workspaceTree?: WorkspaceTreeFrame;
  readonly surfaceFrame?: SurfaceFrame;
  readonly toolbarSlots?: ReadonlyArray<ToolbarSlot>;
  readonly statusBadges?: ReadonlyArray<StatusBadge>;
}

export interface WorkbenchChromeModel extends AppFrameModel {
  readonly workspaceTree: WorkspaceTreeFrame;
  readonly surfaceFrame: SurfaceFrame;
  readonly toolbarSlots: ReadonlyArray<ToolbarSlot>;
  readonly statusBadges: ReadonlyArray<StatusBadge>;
}

export interface CommandPaletteEntry {
  readonly commandId: string;
  readonly label: string;
  readonly group?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
}

export interface IconSpec {
  readonly name: string;
  readonly glyph: string;
  readonly viewBox?: string;
}

export function createWorkbenchTheme(overrides: Partial<WorkbenchTheme> = {}): WorkbenchTheme {
  const defaultTheme: WorkbenchTheme = {
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

export function createWorkspaceTreeFrameModel(
  overrides: Partial<WorkspaceTreeFrame> = {},
): WorkspaceTreeFrame {
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

export function createSurfaceFrameModel(overrides: Partial<SurfaceFrame> = {}): SurfaceFrame {
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

export function createToolbarSlot(overrides: Partial<ToolbarSlot> & Pick<ToolbarSlot, 'id' | 'label' | 'kind'>): ToolbarSlot {
  return {
    ...overrides,
  };
}

export function createStatusBadge(overrides: Partial<StatusBadge> & Pick<StatusBadge, 'id' | 'label' | 'tone'>): StatusBadge {
  return {
    ...overrides,
  };
}

export function createAppFrameModel(overrides: Partial<AppFrameModel> = {}): AppFrameModel {
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

export function createWorkbenchChromeModel(overrides: Partial<WorkbenchChromeModel> = {}): WorkbenchChromeModel {
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

export const defaultIcons: ReadonlyArray<IconSpec> = [
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
} as const;
