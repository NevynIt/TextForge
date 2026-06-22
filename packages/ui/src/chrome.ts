import type { ReactNode } from 'react';
import type { IconName } from './icons';
import type { CommandMenuGroup, CommandMenuItem, StatusBadge, SurfaceFrame, ToolbarSlot, WorkspaceTreeFrame } from './models';

export interface TextForgeTopBarProps {
  readonly activeResource?: {
    readonly title: string;
    readonly detail?: string;
    readonly icon?: IconName;
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
  readonly editingItemId?: string;
  readonly editingSelectionEnd?: number;
  readonly editingSelectionStart?: number;
  readonly editingValue?: string;
  readonly footer?: ReactNode;
  readonly onActivateItem?: (itemId: string) => void;
  readonly onCancelEdit?: () => void;
  readonly onClose?: () => void;
  readonly onCommitEdit?: () => void;
  readonly onDropFilesToFolder?: (itemId: string, files: ReadonlyArray<File>) => void;
  readonly onMoveItem?: (sourceItemId: string, targetItemId: string) => void;
  readonly onRequestItemContextMenu?: (itemId: string, anchor: ContextMenuAnchor) => void;
  readonly onSelectItem?: (itemId: string) => void;
  readonly onToggleFolder?: (itemId: string) => void;
  readonly onUpdateEditValue?: (value: string) => void;
  readonly workspaceTree: WorkspaceTreeFrame;
}

export interface TextForgeSessionTabStripProps {
  readonly emptyLabel?: string;
  readonly frameModel: SurfaceFrame;
  readonly onCreateTab?: () => void;
  readonly onCloseTab?: (tabId: string) => void;
  readonly onDropFiles?: (files: ReadonlyArray<File>) => void;
  readonly onRequestTabContextMenu?: (tabId: string, anchor: ContextMenuAnchor) => void;
  readonly onSelectTab?: (tabId: string) => void;
}

export interface ContextMenuAnchor {
  readonly x: number;
  readonly y: number;
}

export interface TextForgeContextMenuProps {
  readonly items?: ReadonlyArray<CommandMenuItem>;
  readonly onClose?: () => void;
  readonly onCommandPress?: (commandId: string) => void;
  readonly open?: boolean;
  readonly position?: ContextMenuAnchor;
  readonly title?: string;
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
  readonly onRequestTabContextMenu?: (tabId: string, anchor: ContextMenuAnchor) => void;
  readonly onSelectTab?: (tabId: string) => void;
  readonly subtitle?: string;
  readonly title?: string;
}

export declare function TextForgeTopBar(props: TextForgeTopBarProps): unknown;
export declare function TextForgeWorkspaceSidebar(props: TextForgeWorkspaceSidebarProps): unknown;
export declare function TextForgeSessionTabStrip(props: TextForgeSessionTabStripProps): unknown;
export declare function TextForgeContextMenu(props: TextForgeContextMenuProps): unknown;
export declare function TextForgeSelectField(props: TextForgeSelectFieldProps): unknown;
export declare function TextForgeUtilityPane(props: TextForgeUtilityPaneProps): unknown;
export declare function TextForgePopupHost(props: TextForgePopupHostProps): unknown;

