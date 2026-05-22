import { FolderPlus, FilePlus2, Copy, Download, Eye, MoveRight, Pencil, Trash2 } from "lucide-preact";
import * as React from "react";
import { createRoot, type Root as ReactRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Tree, type NodeRendererProps, type TreeApi } from "react-arborist";
import type { WorkspaceEntry, WorkspaceFile, WorkspaceFolder } from "../../core/workspaceTypes";

interface WorkspaceTreeNode {
  id: string;
  name: string;
  path: string;
  entry: WorkspaceEntry;
  children?: WorkspaceTreeNode[];
}

const ArboristTree = Tree as unknown as React.ComponentType<Record<string, unknown>>;

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
  const treeRef = useRef<TreeApi<WorkspaceTreeNode> | null>(null);
  const treeHostRef = useRef<HTMLDivElement | null>(null);
  const reactRootRef = useRef<ReactRoot | null>(null);
  const [treeHeight, setTreeHeight] = useState(480);
  const treeData = useMemo(() => (root ? [createTreeNode(root, createChildrenIndex(entries))] : []), [entries, root]);
  const initialOpenState = useMemo(() => ({ [rootFolderId]: true }), [rootFolderId]);

  useEffect(() => {
    const element = treeHostRef.current;
    if (!element) {
      return;
    }
    const updateHeight = () => setTreeHeight(Math.max(element.clientHeight, 240));
    updateHeight();
    if (typeof globalThis.ResizeObserver !== "function") {
      return;
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!treeRef.current) {
      return;
    }
    treeRef.current.open(rootFolderId);
    const focusId = selectedEntryId || activeFileId || rootFolderId;
    if (focusId) {
      treeRef.current.openParents(focusId);
    }
  }, [activeFileId, rootFolderId, selectedEntryId, treeData]);

  function WorkspaceNodeRenderer({ node, style }: NodeRendererProps<WorkspaceTreeNode>) {
    const entry = node.data.entry;

    return React.createElement(
      "div",
      { style, className: `workspace-node ${entry.kind}` },
      React.createElement(
        "button",
        {
          type: "button",
          className: `workspace-node-button${node.isSelected ? " selected" : ""}${entry.id === activeFileId ? " active" : ""}`,
          onClick: () => {
            node.select();
            onSelectEntry(entry.id);
          },
          onDoubleClick: () => {
            if (entry.kind === "file") {
              if (entry.fileKind === "text" && !entry.readOnly) {
                onOpenEntry(entry.id);
              } else {
                onViewEntry(entry.id);
              }
              return;
            }
            node.toggle();
          },
          title: entry.path
        },
        entry.kind === "folder"
          ? React.createElement(
              "span",
              {
                className: `workspace-node-glyph folder-toggle${node.isOpen ? "" : " collapsed"}`,
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  node.toggle();
                },
                role: "button",
                tabIndex: 0,
                onKeyDown: (event: KeyboardEvent) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    node.toggle();
                  }
                },
                "aria-label": node.isOpen ? `Collapse ${entry.name || "root"}` : `Expand ${entry.name || "root"}`
              },
              node.isOpen ? "v" : ">"
            )
          : React.createElement("span", { className: "workspace-node-glyph" }, "-"),
        React.createElement("span", { className: "workspace-node-label" }, entry.path === "/" ? "/" : entry.name),
        entry.readOnly ? React.createElement("small", null, "ro") : null
      )
    );
  }

  useEffect(() => {
    const host = treeHostRef.current;
    if (!host || !root) {
      return;
    }
    if (!reactRootRef.current) {
      reactRootRef.current = createRoot(host);
    }
    reactRootRef.current.render(
      React.createElement(
        ArboristTree,
        {
          ref: treeRef,
          data: treeData,
          width: "100%",
          height: treeHeight,
          rowHeight: 34,
          indent: 18,
          paddingTop: 4,
          paddingBottom: 12,
          openByDefault: false,
          disableMultiSelection: true,
          disableDrag: true,
          disableDrop: true,
          selection: selectedEntryId || rootFolderId,
          initialOpenState,
          className: "workspace-arborist",
          children: WorkspaceNodeRenderer,
        }
      )
    );
  }, [WorkspaceNodeRenderer, initialOpenState, root, rootFolderId, selectedEntryId, activeFileId, treeData, treeHeight]);

  useEffect(() => () => {
    reactRootRef.current?.unmount();
    reactRootRef.current = null;
  }, []);

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
      <div class="workspace-tree" ref={treeHostRef} />
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

function createChildrenIndex(entries: WorkspaceEntry[]): Map<string, WorkspaceEntry[]> {
  const childrenByParent = new Map<string, WorkspaceEntry[]>();
  for (const entry of entries) {
    if (!entry.parentId) {
      continue;
    }
    const group = childrenByParent.get(entry.parentId) || [];
    group.push(entry);
    childrenByParent.set(entry.parentId, group);
  }
  childrenByParent.forEach((group) => group.sort(compareWorkspaceEntries));
  return childrenByParent;
}

function createTreeNode(entry: WorkspaceEntry, childrenByParent: Map<string, WorkspaceEntry[]>): WorkspaceTreeNode {
  const children = entry.kind === "folder"
    ? (childrenByParent.get(entry.id) || []).map((child) => createTreeNode(child, childrenByParent))
    : undefined;

  return {
    id: entry.id,
    name: entry.path === "/" ? "/" : entry.name,
    path: entry.path,
    entry,
    children
  };
}

function compareWorkspaceEntries(left: WorkspaceEntry, right: WorkspaceEntry): number {
  if (left.kind !== right.kind) {
    return left.kind === "folder" ? -1 : 1;
  }
  return left.name.localeCompare(right.name);
}
