import type { ResourceBadgeToken, ResourceRepresentation } from '@textforge/core';
import type { IconName } from './icons';
import type { WorkbenchTheme } from './theme';

export type ChromeDensity = 'compact' | 'comfortable';
export type FrameRegionKind = 'toolbar' | 'sidebar' | 'main' | 'footer' | 'overlay';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type WorkspaceTreeItemKind = 'folder' | 'resource';
export type SurfaceTabLayout = 'single' | 'tabs';
export type ResourceAttention = 'warning';

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
  readonly representation?: ResourceRepresentation;
  readonly depth: number;
  readonly detail?: string;
  readonly expanded?: boolean;
  readonly hasChildren?: boolean;
  readonly active?: boolean;
  readonly movable?: boolean;
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

export declare function createWorkspaceTreeFrameModel(overrides?: Partial<WorkspaceTreeFrame>): WorkspaceTreeFrame;
export declare function createSurfaceFrameModel(overrides?: Partial<SurfaceFrame>): SurfaceFrame;
export declare function createToolbarSlot(overrides: Partial<ToolbarSlot> & Pick<ToolbarSlot, 'id' | 'label' | 'kind'>): ToolbarSlot;
export declare function createStatusBadge(overrides: Partial<StatusBadge> & Pick<StatusBadge, 'id' | 'label' | 'tone'>): StatusBadge;
export declare function createAppFrameModel(overrides?: Partial<AppFrameModel>): AppFrameModel;
export declare function createWorkbenchChromeModel(overrides?: Partial<WorkbenchChromeModel>): WorkbenchChromeModel;

export declare const defaultAppFrameModel: AppFrameModel;

