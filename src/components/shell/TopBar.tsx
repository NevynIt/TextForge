import {
  Bug,
  Download,
  FilePlus2,
  FolderOpen,
  ListChecks,
  PanelTopOpen,
  Puzzle,
  ScrollText,
  Terminal
} from "lucide-preact";

export function TopBar({
  ready,
  hasActiveDocument,
  hasDiagnosticsAttention,
  hasPluginAttention,
  hasTrace,
  sidebarVisible,
  onNewDocument,
  onOpenFiles,
  onDownload,
  onRunDiagnostics,
  onOpenPluginManager,
  onOpenTrace,
  onOpenLuaConsole,
  onOpenLuaScripts,
  onToggleSidebar
}: {
  ready: boolean;
  hasActiveDocument: boolean;
  hasDiagnosticsAttention: boolean;
  hasPluginAttention: boolean;
  hasTrace: boolean;
  sidebarVisible: boolean;
  onNewDocument: () => void;
  onOpenFiles: (files: FileList | null) => void;
  onDownload: () => void;
  onRunDiagnostics: () => void;
  onOpenPluginManager: () => void;
  onOpenTrace: () => void;
  onOpenLuaConsole: () => void;
  onOpenLuaScripts: () => void;
  onToggleSidebar: () => void;
}) {
  return (
    <header class="topbar">
      <div class="brand">
        <PanelTopOpen size={20} />
        <strong>TextForge</strong>
      </div>
      <div class="toolbar">
        <button type="button" onClick={onNewDocument} disabled={!ready}>
          <FilePlus2 size={16} />
          New
        </button>
        <label class="file-button">
          <FolderOpen size={16} />
          Import
          <input type="file" multiple onChange={(event) => onOpenFiles(event.currentTarget.files)} />
        </label>
        <button type="button" onClick={onDownload} disabled={!hasActiveDocument}>
          <Download size={16} />
          Download
        </button>
        <button type="button" class={hasDiagnosticsAttention ? "attention" : ""} onClick={onRunDiagnostics} disabled={!hasActiveDocument}>
          <Bug size={16} />
          Diagnostics{hasDiagnosticsAttention ? " *" : ""}
        </button>
        <button type="button" class={hasPluginAttention ? "attention" : ""} onClick={onOpenPluginManager}>
          <Puzzle size={16} />
          Plugins{hasPluginAttention ? " *" : ""}
        </button>
        <button type="button" onClick={onOpenTrace} disabled={!hasTrace}>
          <ListChecks size={16} />
          Trace
        </button>
        <button type="button" onClick={onOpenLuaConsole}>
          <Terminal size={16} />
          Lua
        </button>
        <button type="button" onClick={onOpenLuaScripts}>
          <ScrollText size={16} />
          Scripts
        </button>
        <button type="button" onClick={onToggleSidebar} aria-pressed={sidebarVisible}>
          {sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        </button>
      </div>
    </header>
  );
}
