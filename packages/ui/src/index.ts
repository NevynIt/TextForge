export type ThemeMode = 'light' | 'dark' | 'system';
export type ChromeDensity = 'compact' | 'comfortable';
export type FrameRegionKind = 'toolbar' | 'sidebar' | 'main' | 'footer' | 'overlay';

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

export interface FrameRegion {
  readonly id: string;
  readonly title: string;
  readonly kind: FrameRegionKind;
  readonly slotIds?: ReadonlyArray<string>;
}

export interface AppFrameModel {
  readonly id: string;
  readonly brandTitle: string;
  readonly subtitle?: string;
  readonly density: ChromeDensity;
  readonly theme: WorkbenchTheme;
  readonly slots: ReadonlyArray<ChromeSlot>;
  readonly regions: ReadonlyArray<FrameRegion>;
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

export const defaultTheme: WorkbenchTheme = {
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
    family: '"Inter", "Segoe UI", sans-serif',
    size: '14px',
    lineHeight: '1.5',
    weightRegular: 400,
    weightStrong: 600,
  },
  radius: '10px',
  shadow: '0 12px 32px rgb(15 23 42 / 0.24)',
};

export const defaultAppFrameModel: AppFrameModel = {
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
};

export function createWorkbenchTheme(overrides: Partial<WorkbenchTheme> = {}): WorkbenchTheme {
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

export function createAppFrameModel(overrides: Partial<AppFrameModel> = {}): AppFrameModel {
  return {
    ...defaultAppFrameModel,
    ...overrides,
    theme: overrides.theme ?? defaultAppFrameModel.theme,
    slots: overrides.slots ?? defaultAppFrameModel.slots,
    regions: overrides.regions ?? defaultAppFrameModel.regions,
  };
}

export const defaultIcons: ReadonlyArray<IconSpec> = [
  { name: 'search', glyph: '⌕', viewBox: '0 0 24 24' },
  { name: 'check', glyph: '✓', viewBox: '0 0 24 24' },
  { name: 'warning', glyph: '!', viewBox: '0 0 24 24' },
  { name: 'close', glyph: '×', viewBox: '0 0 24 24' },
];

export const contributions = {
  id: '@textforge/ui',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;
