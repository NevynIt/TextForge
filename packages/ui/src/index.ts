import type { ResourceBadgeToken } from '@textforge/core';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ChromeDensity = 'compact' | 'comfortable';
export type FrameRegionKind = 'toolbar' | 'sidebar' | 'main' | 'footer' | 'overlay';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type WorkspaceTreeItemKind = 'folder' | 'text' | 'binary';
export type SurfaceTabLayout = 'single' | 'tabs';
export type ResourceAttention = 'warning';
export type IconName =
  | 'success'
  | 'warning'
  | 'info'
  | 'search'
  | 'command'
  | 'folder'
  | 'folderOpen'
  | 'fileText'
  | 'fileImage'
  | 'fileBinary'
  | 'import'
  | 'export'
  | 'collapse'
  | 'expand'
  | 'disclosureClosed'
  | 'disclosureOpen'
  | 'close'
  | 'utility'
  | 'status'
  | 'lock';

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
  readonly icon?: IconName;
  readonly pinned?: boolean;
  readonly disabled?: boolean;
  readonly shortcut?: string;
}

export interface CommandMenuItem {
  readonly commandId: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: IconName;
  readonly shortcut?: string;
  readonly disabled?: boolean;
}

export interface CommandMenuGroup {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly items: ReadonlyArray<CommandMenuItem>;
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
  readonly detail?: string;
  readonly expanded?: boolean;
  readonly hasChildren?: boolean;
  readonly active?: boolean;
  readonly attention?: ResourceAttention;
  readonly badge?: ResourceBadgeToken;
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
  readonly badge?: ResourceBadgeToken;
  readonly attention?: ResourceAttention;
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
  readonly icon?: IconName;
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
  readonly description?: string;
  readonly group?: string;
  readonly icon?: IconName;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly keywords?: ReadonlyArray<string>;
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
  readonly icon?: IconName;
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
  readonly activeResource?: {
    readonly title: string;
    readonly detail?: string;
    readonly icon?: IconName;
    readonly attention?: ResourceAttention;
    readonly badge?: ResourceBadgeToken;
  };
  readonly brandTitle: string;
  readonly commandPaletteLabel?: string;
  readonly commandPaletteShortcut?: string;
  readonly menuGroups?: ReadonlyArray<CommandMenuGroup>;
  readonly onCommandPress?: (commandId: string) => void;
  readonly onOpenCommandPalette?: () => void;
  readonly onToggleSidebar?: () => void;
  readonly onToggleUtility?: () => void;
  readonly sidebarCollapsed?: boolean;
  readonly statusBadges?: ReadonlyArray<StatusBadge>;
  readonly subtitle?: string;
  readonly toolbarSlots?: ReadonlyArray<ToolbarSlot>;
  readonly utilityToggleLabel?: string;
  readonly utilityOpen?: boolean;
}

export interface TextForgeWorkspaceSidebarProps {
  readonly collapsed?: boolean;
  readonly footer?: ReactNode;
  readonly onDropFilesToFolder?: (itemId: string, files: ReadonlyArray<File>) => void;
  readonly onSelectItem?: (itemId: string) => void;
  readonly onToggleFolder?: (itemId: string) => void;
  readonly workspaceTree: WorkspaceTreeFrame;
}

export interface TextForgeSessionTabStripProps {
  readonly emptyLabel?: string;
  readonly frameModel: SurfaceFrame;
  readonly onCloseTab?: (tabId: string) => void;
  readonly onDropFiles?: (files: ReadonlyArray<File>) => void;
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
  readonly icon?: IconName;
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

export interface TextForgePopupHostProps {
  readonly children?: ReactNode;
  readonly frameModel: SurfaceFrame;
  readonly onClose?: () => void;
  readonly onCloseTab?: (tabId: string) => void;
  readonly onSelectTab?: (tabId: string) => void;
  readonly subtitle?: string;
  readonly title?: string;
}

export interface TextForgeCommandPaletteProps {
  readonly emptyLabel?: string;
  readonly entries?: ReadonlyArray<CommandPaletteEntry>;
  readonly onClose?: () => void;
  readonly onCommandPress?: (commandId: string) => void;
  readonly open?: boolean;
  readonly placeholder?: string;
  readonly title?: string;
}

export interface ShellPanelLayoutConfig {
  readonly defaultSize?: number | string;
  readonly minSize?: number | string;
  readonly maxSize?: number | string;
  readonly collapsedSize?: number | string;
}

export interface TextForgeAppFramePanelLayout {
  readonly sidebar?: ShellPanelLayoutConfig;
  readonly utility?: ShellPanelLayoutConfig;
}

export interface TextForgeAppFrameProps {
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly header?: ReactNode;
  readonly onSidebarCollapsedChange?: (collapsed: boolean) => void;
  readonly onUtilityCollapsedChange?: (collapsed: boolean) => void;
  readonly panelLayout?: TextForgeAppFramePanelLayout;
  readonly sidebar?: ReactNode;
  readonly sidebarCollapsed?: boolean;
  readonly utility?: ReactNode;
  readonly utilityOpen?: boolean;
}

export interface TextForgeResourceBadgeProps {
  readonly active?: boolean;
  readonly attention?: ResourceAttention;
  readonly badge?: ResourceBadgeToken;
  readonly label?: string;
  readonly size?: 'compact' | 'regular';
}

export interface TextForgeInspectorCardProps {
  readonly actions?: ReadonlyArray<ReactNode>;
  readonly children?: ReactNode;
  readonly eyebrow?: string;
  readonly icon?: IconName;
  readonly title: string;
}

export interface TextForgeEmptyStateProps {
  readonly actions?: ReadonlyArray<ReactNode>;
  readonly children?: ReactNode;
  readonly eyebrow?: string;
  readonly icon?: IconName;
  readonly title: string;
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
export declare function TextForgeResourceBadge(props: TextForgeResourceBadgeProps): unknown;
export declare function TextForgeInspectorCard(props: TextForgeInspectorCardProps): unknown;
export declare function TextForgeEmptyState(props: TextForgeEmptyStateProps): unknown;
export declare function TextForgeStatusRail(props: TextForgeStatusRailProps): unknown;
export declare function TextForgeTopBar(props: TextForgeTopBarProps): unknown;
export declare function TextForgeWorkspaceSidebar(props: TextForgeWorkspaceSidebarProps): unknown;
export declare function TextForgeSessionTabStrip(props: TextForgeSessionTabStripProps): unknown;
export declare function TextForgeSelectField(props: TextForgeSelectFieldProps): unknown;
export declare function TextForgeUtilityPane(props: TextForgeUtilityPaneProps): unknown;
export declare function TextForgePopupHost(props: TextForgePopupHostProps): unknown;
export declare function TextForgeCommandPalette(props: TextForgeCommandPaletteProps): unknown;
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
