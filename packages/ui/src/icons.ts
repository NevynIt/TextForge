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

export interface IconSpec {
  readonly name: string;
  readonly glyph: string;
  readonly viewBox?: string;
}

export declare const defaultIcons: ReadonlyArray<IconSpec>;

