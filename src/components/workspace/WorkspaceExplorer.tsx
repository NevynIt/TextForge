import { FolderPlus, FilePlus2, Copy, Download, Eye, MoveRight, Pencil, Trash2 } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import type { WorkspaceEntry, WorkspaceFile, WorkspaceFolder } from "../../core/workspaceTypes";

interface WorkspaceExplorerProps {
  rootFolderId: string;
  entries: WorkspaceEntry[];
  selectedEntryId: string | null;
  activeFileId: string | null;
  onSelectEntry: (id: string) => void;
  onOpenEntry: (id: string) => void;
  onViewEntry: (id: string) => void;
  onCreateFile: (parentId: string) => void;
  onCreateFolder: (parentId: string) => void;
  onCopyEntry: (id: string) => void;
  onExportEntry: (id: string) => void;
  onPromoteLua: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

export function WorkspaceExplorer({
  rootFolderId,
  entries,
  selectedEntryId,
  activeFileId,
  onSelectEntry,
  onOpenEntry,
  onViewEntry,
  onCreateFile,
  onCreateFolder,
  onCopyEntry,
  onExportEntry,
  onPromoteLua,
  onDeleteEntry
}: WorkspaceExplorerProps) {
  const root = entries.find((entry) => entry.id === rootFolderId) as WorkspaceFolder | undefined;
  const selected = entries.find((entry) => entry.id === selectedEntryId) || root;
  const parentId = selected?.kind === "folder" ? selected.id : selected?.parentId || rootFolderId;
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Record<string, boolean>>(() => createInitialCollapsedState(entries, rootFolderId));

  useEffect(() => {
    setCollapsedFolderIds((current) => {
      const next = createInitialCollapsedState(entries, rootFolderId);
      for (const entry of entries) {
        if (entry.kind === "folder" && entry.id in current) {
          next[entry.id] = current[entry.id];
        }
      }
      return next;
    });
  }, [entries, rootFolderId]);

  return (
    <aside class="workspace-explorer">
      <header class="workspace-explorer-header">
        <div>
          <strong>Workspace</strong>
          <span>{entries.length - 1} entries</span>
        </div>
        <div class="workspace-explorer-actions">
          <button type="button" title="New file" onClick={() => onCreateFile(parentId || rootFolderId)}>
            <FilePlus2 size={15} />
          </button>
          <button type="button" title="New folder" onClick={() => onCreateFolder(parentId || rootFolderId)}>
            <FolderPlus size={15} />
          </button>
        </div>
      </header>
      <div class="workspace-tree">
        {root ? (
          <WorkspaceNode
            entry={root}
            entries={entries}
            selectedEntryId={selectedEntryId}
            activeFileId={activeFileId}
            collapsedFolderIds={collapsedFolderIds}
            onToggleFolder={(id) => setCollapsedFolderIds((current) => ({ ...current, [id]: !current[id] }))}
            onSelectEntry={onSelectEntry}
            onOpenEntry={onOpenEntry}
            onViewEntry={onViewEntry}
          />
        ) : null}
      </div>
      {selected ? (
        <footer class="workspace-entry-panel">
          <strong>{selected.kind === "folder" ? selected.path || "/" : selected.name}</strong>
          <small>{selected.path}</small>
          <div class="workspace-entry-panel-actions">
                {selected.kind === "file" ? (
              <>
                {selected.fileKind === "text" && !selected.readOnly ? (
                  <button type="button" onClick={() => onOpenEntry(selected.id)}>
                    <Pencil size={15} />
                    Open
                  </button>
                ) : null}
                <button type="button" onClick={() => onViewEntry(selected.id)}>
                  <Eye size={15} />
                  View
                </button>
              </>
            ) : null}
            {selected.readOnly ? (
              <button type="button" onClick={() => onCopyEntry(selected.id)}>
                <Copy size={15} />
                Copy
              </button>
            ) : null}
            <button type="button" onClick={() => onExportEntry(selected.id)}>
              <Download size={15} />
              Export
            </button>
            {selected.kind === "file" && selected.languageId === "text.lua" && !selected.path.startsWith("/.textforge/automation/lua/") ? (
              <button type="button" onClick={() => onPromoteLua(selected.id)}>
                <MoveRight size={15} />
                Promote Lua
              </button>
            ) : null}
            {!selected.readOnly && selected.parentId ? (
              <button type="button" onClick={() => onDeleteEntry(selected.id)}>
                <Trash2 size={15} />
                Delete
              </button>
            ) : null}
          </div>
        </footer>
      ) : null}
    </aside>
  );
}

function WorkspaceNode({
  entry,
  entries,
  selectedEntryId,
  activeFileId,
  collapsedFolderIds,
  onToggleFolder,
  onSelectEntry,
  onOpenEntry,
  onViewEntry
}: {
  entry: WorkspaceEntry;
  entries: WorkspaceEntry[];
  selectedEntryId: string | null;
  activeFileId: string | null;
  collapsedFolderIds: Record<string, boolean>;
  onToggleFolder: (id: string) => void;
  onSelectEntry: (id: string) => void;
  onOpenEntry: (id: string) => void;
  onViewEntry: (id: string) => void;
}) {
  const children = entries
    .filter((candidate) => candidate.parentId === entry.id)
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });
  const collapsed = entry.kind === "folder" ? Boolean(collapsedFolderIds[entry.id]) : false;

  return (
    <div class={`workspace-node ${entry.kind}`}>
      <button
        type="button"
        class={`workspace-node-button${entry.id === selectedEntryId ? " selected" : ""}${entry.id === activeFileId ? " active" : ""}`}
        onClick={() => onSelectEntry(entry.id)}
        onDblClick={() => {
          if (entry.kind === "file") {
            if (entry.fileKind === "text" && !entry.readOnly) {
              onOpenEntry(entry.id);
            } else {
              onViewEntry(entry.id);
            }
          }
        }}
        title={entry.path}
      >
        {entry.kind === "folder" ? (
          <span
            class={`workspace-node-glyph folder-toggle${collapsed ? " collapsed" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFolder(entry.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onToggleFolder(entry.id);
              }
            }}
            aria-label={collapsed ? `Expand ${entry.name || "root"}` : `Collapse ${entry.name || "root"}`}
          >
            {collapsed ? ">" : "v"}
          </span>
        ) : (
          <span class="workspace-node-glyph">-</span>
        )}
        <span class="workspace-node-label">{entry.path === "/" ? "/" : entry.name}</span>
        {entry.readOnly ? <small>ro</small> : null}
      </button>
      {children.length && !collapsed ? (
        <div class="workspace-node-children">
          {children.map((child) => (
            <WorkspaceNode
              key={child.id}
              entry={child}
              entries={entries}
              selectedEntryId={selectedEntryId}
              activeFileId={activeFileId}
              collapsedFolderIds={collapsedFolderIds}
              onToggleFolder={onToggleFolder}
              onSelectEntry={onSelectEntry}
              onOpenEntry={onOpenEntry}
              onViewEntry={onViewEntry}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function createInitialCollapsedState(entries: WorkspaceEntry[], rootFolderId: string): Record<string, boolean> {
  return entries.reduce<Record<string, boolean>>((state, entry) => {
    if (entry.kind === "folder") {
      state[entry.id] = entry.id !== rootFolderId;
    }
    return state;
  }, {});
}
