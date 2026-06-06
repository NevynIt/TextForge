import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  HardDriveDownload,
  HardDriveUpload,
  Info,
  Lock,
  Search,
  Sparkles,
  SquareTerminal,
  X,
} from 'lucide-react';

import { element } from './shared.js';

const iconRegistry = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  search: Search,
  command: Command,
  folder: Folder,
  folderOpen: FolderOpen,
  fileText: FileText,
  fileImage: FileImage,
  fileBinary: File,
  import: HardDriveUpload,
  export: HardDriveDownload,
  collapse: ChevronLeft,
  expand: ChevronRight,
  disclosureClosed: ChevronRight,
  disclosureOpen: ChevronDown,
  close: X,
  utility: SquareTerminal,
  status: Sparkles,
  lock: Lock,
};

export function IconGlyph({ className, name, size = 16, strokeWidth = 1.9 }) {
  const Icon = iconRegistry[name];
  if (!Icon) {
    return null;
  }

  return element(Icon, {
    className,
    size,
    strokeWidth,
    'aria-hidden': 'true',
    focusable: 'false',
  });
}

export function resolveWorkspaceItemIcon(item) {
  if (item.kind === 'folder') {
    return item.expanded ? 'folderOpen' : 'folder';
  }

  if (item.detail === 'SVG' || item.detail === 'IMAGE' || item.detail === 'PDF') {
    return 'fileImage';
  }

  return item.representation === 'text' ? 'fileText' : 'fileBinary';
}

export const defaultIcons = [
  { name: 'success', glyph: 'C', viewBox: '0 0 24 24' },
  { name: 'warning', glyph: '!', viewBox: '0 0 24 24' },
  { name: 'info', glyph: 'i', viewBox: '0 0 24 24' },
  { name: 'search', glyph: 'S', viewBox: '0 0 24 24' },
  { name: 'command', glyph: 'K', viewBox: '0 0 24 24' },
  { name: 'folder', glyph: 'F', viewBox: '0 0 24 24' },
  { name: 'folderOpen', glyph: 'O', viewBox: '0 0 24 24' },
  { name: 'fileText', glyph: 'T', viewBox: '0 0 24 24' },
  { name: 'fileImage', glyph: 'I', viewBox: '0 0 24 24' },
  { name: 'fileBinary', glyph: 'B', viewBox: '0 0 24 24' },
  { name: 'import', glyph: 'U', viewBox: '0 0 24 24' },
  { name: 'export', glyph: 'D', viewBox: '0 0 24 24' },
  { name: 'collapse', glyph: '<', viewBox: '0 0 24 24' },
  { name: 'expand', glyph: '>', viewBox: '0 0 24 24' },
  { name: 'disclosureClosed', glyph: '>', viewBox: '0 0 24 24' },
  { name: 'disclosureOpen', glyph: 'v', viewBox: '0 0 24 24' },
  { name: 'close', glyph: 'X', viewBox: '0 0 24 24' },
  { name: 'utility', glyph: 'U', viewBox: '0 0 24 24' },
  { name: 'status', glyph: '*', viewBox: '0 0 24 24' },
  { name: 'lock', glyph: 'L', viewBox: '0 0 24 24' },
];

