import type { IconName } from './icons';

export interface CommandPaletteEntry {
  readonly commandId: string;
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly icon?: IconName;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly keywords?: ReadonlyArray<string>;

export interface TextForgeCommandPaletteProps {
  readonly emptyLabel?: string;
  readonly entries?: ReadonlyArray<CommandPaletteEntry>;
  readonly onClose?: () => void;
  readonly onCommandPress?: (commandId: string) => void;
  readonly open?: boolean;
  readonly placeholder?: string;
  readonly title?: string;
}

export declare function TextForgeCommandPalette(props: TextForgeCommandPaletteProps): unknown;

