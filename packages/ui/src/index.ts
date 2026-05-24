import type { CSSProperties, ReactNode } from 'react';

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
  readonly disabled?: boolean;
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

export interface TextForgeToolbarButtonProps {
  readonly active?: boolean;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
  readonly kind?: 'primary' | 'secondary' | 'toggle';
  readonly label: string;
  readonly onPress?: () => void;
  readonly title?: string;
}

export interface TextForgeStatusRailProps {
  readonly badges?: ReadonlyArray<StatusBadge>;
}

export interface TextForgeCalloutProps {
  readonly actions?: ReadonlyArray<ReactNode>;
  readonly children?: ReactNode;
  readonly tone?: BadgeTone;
  readonly title?: string;
}

export interface TextForgeTopBarProps {
  readonly brandTitle: string;
  readonly onToggleSidebar?: () => void;
  readonly onToggleUtility?: () => void;
  readonly sidebarCollapsed?: boolean;
  readonly statusBadges?: ReadonlyArray<StatusBadge>;
  readonly subtitle?: string;
  readonly toolbarSlots?: ReadonlyArray<ToolbarSlot>;
  readonly utilityOpen?: boolean;
  readonly onToolbarAction?: (slotId: string) => void;
}

export interface TextForgeWorkspaceSidebarProps {
  readonly collapsed?: boolean;
  readonly footer?: ReactNode;
  readonly onSelectItem?: (itemId: string) => void;
  readonly onToggleCollapsed?: () => void;
  readonly workspaceTree: WorkspaceTreeFrame;
}

export interface TextForgeSessionTabStripProps {
  readonly emptyLabel?: string;
  readonly frameModel: SurfaceFrame;
  readonly onCloseTab?: (tabId: string) => void;
  readonly onSelectTab?: (tabId: string) => void;
}

export interface SelectFieldOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

export interface SelectFieldControl {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly description?: string;
  readonly options: ReadonlyArray<SelectFieldOption>;
  readonly onChange?: (value: string) => void;
}

export interface TextForgeSelectFieldProps {
  readonly control: SelectFieldControl;
}

export interface UtilityPaneSection {
  readonly id: string;
  readonly label: string;
}

export interface TextForgeUtilityPaneProps {
  readonly activeSectionId?: string;
  readonly children?: ReactNode;
  readonly onClose?: () => void;
  readonly onSelectSection?: (sectionId: string) => void;
  readonly sections?: ReadonlyArray<UtilityPaneSection>;
  readonly subtitle?: string;
  readonly title?: string;
}

export interface TextForgeAppFrameProps {
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly header?: ReactNode;
  readonly sidebar?: ReactNode;
  readonly sidebarCollapsed?: boolean;
  readonly utility?: ReactNode;
  readonly utilityOpen?: boolean;
}

export declare function createWorkbenchTheme(overrides?: Partial<WorkbenchTheme>): WorkbenchTheme;
export declare const defaultTheme: WorkbenchTheme;
export declare function createWorkspaceTreeFrameModel(overrides?: Partial<WorkspaceTreeFrame>): WorkspaceTreeFrame;
export declare function createSurfaceFrameModel(overrides?: Partial<SurfaceFrame>): SurfaceFrame;
export declare function createToolbarSlot(overrides: Partial<ToolbarSlot> & Pick<ToolbarSlot, 'id' | 'label' | 'kind'>): ToolbarSlot;
export declare function createStatusBadge(overrides: Partial<StatusBadge> & Pick<StatusBadge, 'id' | 'label' | 'tone'>): StatusBadge;
export declare function createAppFrameModel(overrides?: Partial<AppFrameModel>): AppFrameModel;
export declare function createWorkbenchChromeModel(overrides?: Partial<WorkbenchChromeModel>): WorkbenchChromeModel;

export declare function TextForgeToolbarButton(props: TextForgeToolbarButtonProps): unknown;
export declare function TextForgeCallout(props: TextForgeCalloutProps): unknown;
export declare function TextForgeStatusRail(props: TextForgeStatusRailProps): unknown;
export declare function TextForgeTopBar(props: TextForgeTopBarProps): unknown;
export declare function TextForgeWorkspaceSidebar(props: TextForgeWorkspaceSidebarProps): unknown;
export declare function TextForgeSessionTabStrip(props: TextForgeSessionTabStripProps): unknown;
export declare function TextForgeSelectField(props: TextForgeSelectFieldProps): unknown;
export declare function TextForgeUtilityPane(props: TextForgeUtilityPaneProps): unknown;
export declare function TextForgeAppFrame(props: TextForgeAppFrameProps): unknown;

export declare const defaultAppFrameModel: AppFrameModel;

export declare const defaultIcons: ReadonlyArray<IconSpec>;

export declare const contributions: {
  readonly id: '@textforge/ui';
  readonly diagnostics: readonly [];
  readonly commands: readonly [];
  readonly surfaces: readonly [];
  readonly pipelines: readonly [];
};
