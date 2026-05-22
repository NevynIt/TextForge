import { FolderPlus, FilePlus2, Copy, Eye, Pencil, Trash2 } from "lucide-preact";
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
  onDeleteEntry
}: WorkspaceExplorerProps) {
  const root = entries.find((entry) => entry.id === rootFolderId) as WorkspaceFolder | undefined;
  const selected = entries.find((entry) => entry.id === selectedEntryId) || root;
  const parentId = selected?.kind === "folder" ? selected.id : selected?.parentId || rootFolderId;

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
  onSelectEntry,
  onOpenEntry,
  onViewEntry
}: {
  entry: WorkspaceEntry;
  entries: WorkspaceEntry[];
  selectedEntryId: string | null;
  activeFileId: string | null;
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
        <span class="workspace-node-glyph">{entry.kind === "folder" ? ">" : "-"}</span>
        <span class="workspace-node-label">{entry.path === "/" ? "/" : entry.name}</span>
        {entry.readOnly ? <small>ro</small> : null}
      </button>
      {children.length ? (
        <div class="workspace-node-children">
          {children.map((child) => (
            <WorkspaceNode
              key={child.id}
              entry={child}
              entries={entries}
              selectedEntryId={selectedEntryId}
              activeFileId={activeFileId}
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
