import type { ReactNode } from 'react';

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

export declare function TextForgeAppFrame(props: TextForgeAppFrameProps): unknown;

