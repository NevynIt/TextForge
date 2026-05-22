import type { TextDocument, WorkspaceContributionContext, WorkspaceFileSummary } from "../domain/types";
import { normalizeWorkspacePath } from "./workspacePaths";
import { WorkspaceManager } from "./workspaceManager";

export function createWorkspaceContributionContext(workspace: WorkspaceManager): WorkspaceContributionContext {
  return {
    get activeFileId() {
      return workspace.getActiveDocumentId();
    },
    get selectedFileId() {
      const selected = workspace.snapshot().selectedEntryId;
      const entry = selected ? workspace.getEntry(selected) : undefined;
      return entry?.kind === "file" ? entry.id : null;
    },
    listFiles() {
      return workspace.listEntries().map(toWorkspaceFileSummary);
    },
    listTextFiles() {
      return workspace.listEntries()
        .filter((entry) => entry.kind === "file" && entry.fileKind === "text")
        .map((entry) => workspace.getDocument(entry.id))
        .filter(Boolean) as TextDocument[];
    },
    listOpenTextFiles() {
      return workspace.listDocuments();
    },
    getFile(id: string) {
      const entry = workspace.getEntry(id);
      return entry ? toWorkspaceFileSummary(entry) : undefined;
    },
    findByPath(path: string) {
      const entry = workspace.findByPath(path);
      return entry ? toWorkspaceFileSummary(entry) : undefined;
    },
    resolvePath(baseFileId: string, target: string) {
      return workspace.resolvePath(baseFileId, target);
    },
    readText(pathOrId: string, options?: { baseFileId?: string }) {
      const entry = resolveEntry(workspace, pathOrId, options);
      return entry?.kind === "file" && entry.fileKind === "text" ? entry.text || "" : undefined;
    },
    readBinary(pathOrId: string, options?: { baseFileId?: string }) {
      const entry = resolveEntry(workspace, pathOrId, options);
      return entry?.kind === "file" && entry.fileKind === "binary" ? entry.blob : undefined;
    }
  };
}

function resolveEntry(workspace: WorkspaceManager, pathOrId: string, options?: { baseFileId?: string }) {
  const byId = workspace.getEntry(pathOrId);
  if (byId) {
    return byId;
  }
  const path = options?.baseFileId ? workspace.resolvePath(options.baseFileId, pathOrId) : normalizeWorkspacePath(pathOrId);
  return workspace.findByPath(path);
}

function toWorkspaceFileSummary(entry: ReturnType<WorkspaceManager["getEntry"]> extends infer T ? Exclude<T, undefined> : never): WorkspaceFileSummary {
  return {
    id: entry.id,
    path: entry.path,
    name: entry.name,
    kind: entry.kind,
    fileKind: entry.kind === "file" ? entry.fileKind : undefined,
    languageId: entry.kind === "file" ? entry.languageId : undefined,
    mediaType: entry.kind === "file" ? entry.mediaType : undefined,
    readOnly: entry.readOnly,
    system: entry.system,
    virtual: entry.virtual
  };
}
