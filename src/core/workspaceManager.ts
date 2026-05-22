import type { DocumentIdentity, TextDocument } from "../domain/types";
import { textForgeResources } from "../resources/resourceCatalog";
import { createId } from "./id";
import {
  baseName,
  isPathInside,
  joinWorkspacePath,
  normalizeWorkspacePath,
  parentPath,
  resolveRelativePath,
  validateEntryName
} from "./workspacePaths";
import type {
  WorkspaceEntry,
  WorkspaceFile,
  WorkspaceFolder,
  WorkspaceImportFile,
  WorkspaceState,
  WorkspaceTextFileView
} from "./workspaceTypes";
import { createUniqueDocumentIdentity, documentIdentityForShapezCode, isValidShapezOneLayerCode } from "./shapezBadges";

type OpenDocumentInput = Partial<TextDocument> & Pick<TextDocument, "text" | "languageId">;

export class WorkspaceManager {
  private state = createDefaultWorkspaceState();
  private openSequence = 0;

  snapshot(): WorkspaceState {
    return structuredClone(this.state);
  }

  restore(state: WorkspaceState): void {
    this.state = structuredClone(state);
    this.openSequence = this.listDocuments().length;
    this.repairIdentities();
  }

  resetToDefaultWorkspace(): void {
    this.state = createDefaultWorkspaceState();
    this.openSequence = 0;
  }

  listEntries(): WorkspaceEntry[] {
    return Object.values(this.state.entries).sort(compareEntries);
  }

  listChildren(folderId: string): WorkspaceEntry[] {
    return this.listEntries().filter((entry) => entry.parentId === folderId);
  }

  getEntry(id: string): WorkspaceEntry | undefined {
    return this.state.entries[id];
  }

  getFile(id: string): WorkspaceFile | undefined {
    const entry = this.getEntry(id);
    return entry?.kind === "file" ? entry : undefined;
  }

  getFolder(id: string): WorkspaceFolder | undefined {
    const entry = this.getEntry(id);
    return entry?.kind === "folder" ? entry : undefined;
  }

  resolveWritableFolderId(preferredEntryId?: string | null, fallbackPath = "/docs"): string {
    const fallback = this.findByPath(fallbackPath);
    const visited = new Set<string>();
    let currentId = preferredEntryId || this.state.selectedEntryId || this.state.activeFileId;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const entry = this.getEntry(currentId);
      if (!entry) {
        break;
      }
      if (entry.kind === "folder" && !entry.readOnly && entry.id !== this.state.rootFolderId) {
        return entry.id;
      }
      currentId = entry.parentId;
    }

    if (fallback?.kind === "folder" && !fallback.readOnly) {
      return fallback.id;
    }
    const root = this.getFolder(this.state.rootFolderId);
    if (root && !root.readOnly) {
      return root.id;
    }
    return this.state.rootFolderId;
  }

  findByPath(path: string): WorkspaceEntry | undefined {
    const normalized = normalizeWorkspacePath(path);
    return Object.values(this.state.entries).find((entry) => entry.path === normalized);
  }

  createFolder(parentId: string, name: string): WorkspaceFolder {
    const parent = this.requireFolder(parentId);
    this.ensureWritable(parent);
    const nextName = normalizeEntryName(name);
    this.ensureSiblingNameAvailable(parent.id, nextName);
    const now = new Date().toISOString();
    const folder: WorkspaceFolder = {
      id: createId("folder"),
      kind: "folder",
      name: nextName,
      parentId: parent.id,
      path: joinWorkspacePath(parent.path, nextName),
      createdAt: now,
      updatedAt: now,
      origin: "created"
    };
    this.state.entries[folder.id] = folder;
    this.touch();
    return folder;
  }

  createTextFile(parentId: string, name: string, text = "", languageId = "text.plain", options: Partial<WorkspaceFile> = {}): WorkspaceFile {
    const parent = this.requireFolder(parentId);
    this.ensureWritable(parent);
    const nextName = normalizeEntryName(name);
    this.ensureSiblingNameAvailable(parent.id, nextName);
    const now = new Date().toISOString();
    const identity = this.nextIdentity({
      id: options.id || createId("file"),
      fileName: nextName,
      languageId
    });
    const file: WorkspaceFile = {
      id: identity.id,
      kind: "file",
      fileKind: "text",
      name: nextName,
      parentId: parent.id,
      path: joinWorkspacePath(parent.path, nextName),
      languageId,
      mediaType: options.mediaType,
      text,
      size: text.length,
      version: options.version || 1,
      dirty: options.dirty ?? false,
      identity: identity.identity,
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now,
      origin: options.origin || "created",
      readOnly: options.readOnly,
      system: options.system,
      virtual: options.virtual,
      defaultPipelineId: options.defaultPipelineId,
      preferredPipelineIds: options.preferredPipelineIds,
      sourcePath: options.sourcePath
    };
    this.state.entries[file.id] = file;
    this.touch();
    return file;
  }

  createBinaryFile(parentId: string, name: string, blob: Blob, mediaType?: string, options: Partial<WorkspaceFile> = {}): WorkspaceFile {
    const parent = this.requireFolder(parentId);
    this.ensureWritable(parent);
    const nextName = normalizeEntryName(name);
    this.ensureSiblingNameAvailable(parent.id, nextName);
    const now = new Date().toISOString();
    const id = createId("file");
    const file: WorkspaceFile = {
      id: options.id || id,
      kind: "file",
      fileKind: "binary",
      name: nextName,
      parentId: parent.id,
      path: joinWorkspacePath(parent.path, nextName),
      languageId: undefined,
      mediaType,
      blob,
      size: blob.size,
      version: options.version || 1,
      dirty: options.dirty ?? false,
      identity: this.nextIdentity({ id: options.id || id, fileName: nextName, languageId: mediaType || "application/octet-stream" }).identity,
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now,
      origin: options.origin || "uploaded",
      readOnly: options.readOnly,
      system: options.system,
      virtual: options.virtual,
      sourcePath: options.sourcePath
    };
    this.state.entries[file.id] = file;
    this.touch();
    return file;
  }

  importFiles(parentId: string, files: WorkspaceImportFile[]): { imported: WorkspaceFile[]; skipped: string[] } {
    const parent = this.requireFolder(parentId);
    this.ensureWritable(parent);
    const imported: WorkspaceFile[] = [];
    const skipped: string[] = [];
    for (const item of files) {
      try {
        const normalized = item.path.replaceAll("\\", "/");
        const segments = normalized.split("/").filter(Boolean);
        if (!segments.length) {
          skipped.push(item.path);
          continue;
        }
        let folder = parent;
        for (const segment of segments.slice(0, -1)) {
          folder = this.findOrCreateFolder(folder.id, segment);
        }
        const desiredName = segments.at(-1) || "untitled.txt";
        const fileName = this.resolveConflictName(folder.id, desiredName);
        if (item.fileKind === "binary" && item.blob) {
          imported.push(
            this.createBinaryFile(folder.id, fileName, item.blob, item.mediaType, {
              origin: item.origin || "uploaded",
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              sourcePath: item.path
            })
          );
        } else {
          imported.push(
            this.createTextFile(folder.id, fileName, item.text || "", item.languageId || "text.plain", {
              origin: item.origin || "uploaded",
              dirty: false,
              sourcePath: item.path,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              mediaType: item.mediaType
            })
          );
        }
      } catch {
        skipped.push(item.path);
      }
    }
    this.touch();
    return { imported, skipped };
  }

  renameEntry(id: string, nextName: string): WorkspaceEntry | undefined {
    const entry = this.getEntry(id);
    if (!entry || !entry.parentId) {
      return entry;
    }
    this.ensureWritable(entry);
    const name = normalizeEntryName(nextName);
    this.ensureSiblingNameAvailable(entry.parentId, name, id);
    this.renamePathRecursive(id, joinWorkspacePath(this.requireFolder(entry.parentId).path, name), name);
    this.touch();
    return this.getEntry(id);
  }

  moveEntry(id: string, nextParentId: string): WorkspaceEntry | undefined {
    const entry = this.getEntry(id);
    const nextParent = this.getFolder(nextParentId);
    if (!entry || !nextParent || !entry.parentId) {
      return entry;
    }
    this.ensureWritable(entry);
    this.ensureWritable(nextParent);
    if (entry.kind === "folder" && isPathInside(entry.path, nextParent.path)) {
      throw new Error("Cannot move a folder into itself.");
    }
    this.ensureSiblingNameAvailable(nextParentId, entry.name, id);
    this.renamePathRecursive(id, joinWorkspacePath(nextParent.path, entry.name), entry.name, nextParentId);
    this.touch();
    return this.getEntry(id);
  }

  deleteEntry(id: string): { deletedIds: string[] } {
    const entry = this.getEntry(id);
    if (!entry || !entry.parentId) {
      return { deletedIds: [] };
    }
    this.ensureWritable(entry);
    const deletedIds = entry.kind === "folder"
      ? [entry.id, ...this.collectSubtree(entry.id).map((candidate) => candidate.id)]
      : [entry.id];
    const uniqueIds = Array.from(new Set(deletedIds));
    uniqueIds.forEach((entryId) => delete this.state.entries[entryId]);
    this.state.openFileIds = this.state.openFileIds.filter((fileId) => !uniqueIds.includes(fileId));
    if (this.state.activeFileId && uniqueIds.includes(this.state.activeFileId)) {
      this.state.activeFileId = this.state.openFileIds.at(-1) || null;
    }
    if (this.state.selectedEntryId && uniqueIds.includes(this.state.selectedEntryId)) {
      this.state.selectedEntryId = null;
    }
    this.touch();
    return { deletedIds: uniqueIds };
  }

  openFile(id: string): WorkspaceFile | undefined {
    const file = this.getFile(id);
    if (!file || file.fileKind !== "text") {
      return file;
    }
    if (!this.state.openFileIds.includes(file.id)) {
      this.state.openFileIds.push(file.id);
    }
    this.state.activeFileId = file.id;
    this.state.selectedEntryId = file.id;
    this.touch();
    return file;
  }

  closeFile(id: string): WorkspaceFile | undefined {
    const file = this.getFile(id);
    if (!file) {
      return file;
    }
    const index = this.state.openFileIds.indexOf(id);
    this.state.openFileIds = this.state.openFileIds.filter((candidate) => candidate !== id);
    if (this.state.activeFileId === id) {
      this.state.activeFileId = this.state.openFileIds[index] || this.state.openFileIds[index - 1] || null;
    }
    this.touch();
    return file;
  }

  switchFile(id: string): WorkspaceFile | undefined {
    const file = this.getFile(id);
    if (!file) {
      return file;
    }
    if (!this.state.openFileIds.includes(id) && file.fileKind === "text") {
      this.state.openFileIds.push(id);
    }
    this.state.activeFileId = id;
    this.state.selectedEntryId = id;
    this.touch();
    return file;
  }

  reorderOpenFile(id: string, targetId?: string, position: "before" | "after" | "end" = "before"): void {
    if (!this.state.openFileIds.includes(id)) {
      return;
    }
    const nextOrder = this.state.openFileIds.filter((candidate) => candidate !== id);
    if (!targetId || position === "end") {
      nextOrder.push(id);
      this.state.openFileIds = nextOrder;
      this.touch();
      return;
    }
    const targetIndex = nextOrder.indexOf(targetId);
    if (targetIndex < 0) {
      nextOrder.push(id);
    } else {
      nextOrder.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, id);
    }
    this.state.openFileIds = nextOrder;
    this.touch();
  }

  updateText(id: string, text: string): WorkspaceFile | undefined {
    const file = this.getFile(id);
    if (!file || file.fileKind !== "text" || file.text === text) {
      return file;
    }
    this.ensureWritable(file);
    this.state.entries[id] = {
      ...file,
      text,
      size: text.length,
      version: file.version + 1,
      dirty: true,
      updatedAt: new Date().toISOString()
    };
    this.touch();
    return this.getFile(id);
  }

  updateLanguage(id: string, languageId: string): WorkspaceFile | undefined {
    const file = this.getFile(id);
    if (!file || file.languageId === languageId) {
      return file;
    }
    this.ensureWritable(file);
    this.state.entries[id] = {
      ...file,
      languageId,
      version: file.version + 1,
      dirty: true,
      updatedAt: new Date().toISOString()
    };
    this.touch();
    return this.getFile(id);
  }

  markClean(id: string): void {
    const file = this.getFile(id);
    if (file) {
      this.state.entries[id] = { ...file, dirty: false, lastExportedAt: new Date().toISOString() };
      this.touch();
    }
  }

  exportFile(id: string): WorkspaceFile | undefined {
    const file = this.getFile(id);
    if (!file) {
      return file;
    }
    this.state.entries[id] = { ...file, lastExportedAt: new Date().toISOString(), dirty: false };
    this.touch();
    return this.getFile(id);
  }

  collectSubtree(folderId = this.state.rootFolderId): WorkspaceEntry[] {
    const results: WorkspaceEntry[] = [];
    const folder = this.requireFolder(folderId);
    for (const entry of this.listEntries()) {
      if (entry.id !== folderId && isPathInside(folder.path, entry.path)) {
        results.push(entry);
      }
    }
    return results;
  }

  listOpenTextFileViews(): WorkspaceTextFileView[] {
    return this.state.openFileIds
      .map((id) => this.toTextDocument(this.getFile(id)))
      .filter(Boolean) as WorkspaceTextFileView[];
  }

  listAllTextFileViews(): WorkspaceTextFileView[] {
    return this.listEntries()
      .filter((entry): entry is WorkspaceFile => entry.kind === "file" && entry.fileKind === "text")
      .map((file) => this.toTextDocument(file))
      .filter(Boolean) as WorkspaceTextFileView[];
  }

  getActiveTextFileView(): WorkspaceTextFileView | undefined {
    return this.toTextDocument(this.state.activeFileId ? this.getFile(this.state.activeFileId) : undefined);
  }

  selectEntry(id: string | null): void {
    this.state.selectedEntryId = id;
    this.touch();
  }

  copyEntry(id: string, targetFolderId: string): WorkspaceEntry | undefined {
    const entry = this.getEntry(id);
    const target = this.getFolder(targetFolderId);
    if (!entry || !target) {
      return undefined;
    }
    if (entry.kind === "folder") {
      const copiedFolder = this.createFolder(target.id, this.resolveConflictName(target.id, entry.name));
      for (const child of this.listChildren(entry.id)) {
        this.copyEntry(child.id, copiedFolder.id);
      }
      return copiedFolder;
    }
    if (entry.fileKind === "text") {
      return this.createTextFile(target.id, this.resolveConflictName(target.id, entry.name), entry.text || "", entry.languageId || "text.plain", {
        origin: entry.origin === "bundled-resource" ? "resource-copy" : entry.origin,
        dirty: false
      });
    }
    if (entry.blob) {
      return this.createBinaryFile(target.id, this.resolveConflictName(target.id, entry.name), entry.blob, entry.mediaType);
    }
    return undefined;
  }

  ensureFolder(path: string, origin: WorkspaceFolder["origin"] = "created"): WorkspaceFolder {
    const normalized = normalizeWorkspacePath(path);
    const existing = this.findByPath(normalized);
    if (existing?.kind === "folder") {
      return existing;
    }
    const parent = parentPath(normalized);
    const parentFolder = parent === "/"
      ? this.getFolder(this.state.rootFolderId)!
      : this.ensureFolder(parent, origin);
    return this.createFolder(parentFolder.id, baseName(normalized));
  }

  resolvePath(fromFileId: string, target: string): string {
    const file = this.getFile(fromFileId);
    if (!file) {
      throw new Error(`Unknown file ${fromFileId}.`);
    }
    return resolveRelativePath(file.path, target);
  }

  readTextByPath(path: string): string | undefined {
    const entry = this.findByPath(path);
    return entry?.kind === "file" && entry.fileKind === "text" ? entry.text || "" : undefined;
  }

  listDocuments(): WorkspaceTextFileView[] {
    return this.listOpenTextFileViews();
  }

  getActiveDocument(): WorkspaceTextFileView | undefined {
    return this.getActiveTextFileView();
  }

  getActiveDocumentId(): string | null {
    return this.state.activeFileId;
  }

  getDocument(id: string): WorkspaceTextFileView | undefined {
    return this.toTextDocument(this.getFile(id));
  }

  openDocument(input: OpenDocumentInput): WorkspaceTextFileView {
    const root = this.getFolder(this.state.rootFolderId)!;
    const desiredName = normalizeEntryName(input.fileName || "untitled.txt");
    const nextName = this.resolveConflictName(root.id, desiredName);
    const file = this.createTextFile(root.id, nextName, input.text || "", input.languageId, {
      dirty: input.dirty ?? false,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      id: input.id,
      version: input.version,
      origin: "created"
    });
    this.openFile(file.id);
    return this.toTextDocument(file)!;
  }

  switchDocument(id: string): WorkspaceTextFileView | undefined {
    return this.toTextDocument(this.switchFile(id));
  }

  closeDocument(id: string): WorkspaceTextFileView | undefined {
    return this.toTextDocument(this.closeFile(id));
  }

  reorderDocument(id: string, targetId?: string, position: "before" | "after" | "end" = "before"): void {
    this.reorderOpenFile(id, targetId, position);
  }

  updateFileName(id: string, fileName: string): WorkspaceTextFileView | undefined {
    this.renameEntry(id, fileName);
    return this.getDocument(id);
  }

  private toTextDocument(file?: WorkspaceFile): WorkspaceTextFileView | undefined {
    if (!file || file.fileKind !== "text") {
      return undefined;
    }
    return {
      id: file.id,
      fileName: file.name,
      path: file.path,
      languageId: file.languageId || "text.plain",
      text: file.text || "",
      version: file.version,
      dirty: file.dirty,
      identity: file.identity,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      readOnly: file.readOnly
    };
  }

  private findOrCreateFolder(parentId: string, name: string): WorkspaceFolder {
    const nextName = normalizeEntryName(name);
    const existing = this.listChildren(parentId).find((entry) => entry.kind === "folder" && entry.name === nextName) as WorkspaceFolder | undefined;
    return existing || this.createFolder(parentId, nextName);
  }

  private requireFolder(id: string): WorkspaceFolder {
    const folder = this.getFolder(id);
    if (!folder) {
      throw new Error(`Folder ${id} was not found.`);
    }
    return folder;
  }

  private ensureWritable(entry: WorkspaceEntry): void {
    if (entry.readOnly) {
      throw new Error(`${entry.path} is read-only.`);
    }
  }

  private ensureSiblingNameAvailable(parentId: string, name: string, currentId?: string): void {
    const conflict = this.listChildren(parentId).find((entry) => entry.name === name && entry.id !== currentId);
    if (conflict) {
      throw new Error(`An entry named "${name}" already exists in ${this.requireFolder(parentId).path}.`);
    }
  }

  private resolveConflictName(parentId: string, desiredName: string): string {
    const currentNames = new Set(this.listChildren(parentId).map((entry) => entry.name.toLowerCase()));
    if (!currentNames.has(desiredName.toLowerCase())) {
      return desiredName;
    }
    const match = /^(.*?)(\.[^.]+)?$/.exec(desiredName) || [];
    const stem = match[1] || desiredName;
    const ext = match[2] || "";
    let index = 2;
    while (currentNames.has(`${stem} (${index})${ext}`.toLowerCase())) {
      index += 1;
    }
    return `${stem} (${index})${ext}`;
  }

  private renamePathRecursive(id: string, nextPath: string, nextName: string, parentId?: string): void {
    const entry = this.getEntry(id);
    if (!entry) {
      return;
    }
    const previousPath = entry.path;
    const nextUpdatedAt = new Date().toISOString();
    if (entry.kind === "file") {
      this.state.entries[id] = {
        ...entry,
        name: nextName,
        path: nextPath,
        parentId: parentId ?? entry.parentId,
        updatedAt: nextUpdatedAt,
        dirty: true,
        version: entry.version + 1
      };
    } else {
      this.state.entries[id] = {
        ...entry,
        name: nextName,
        path: nextPath,
        parentId: parentId ?? entry.parentId,
        updatedAt: nextUpdatedAt
      };
    }
    if (entry.kind === "folder") {
      for (const child of this.listChildren(id)) {
        const childPath = child.path.replace(previousPath, nextPath);
        this.renamePathRecursive(child.id, childPath, baseName(childPath));
      }
    }
  }

  private nextIdentity(document: { id: string; fileName: string; languageId: string }): { id: string; identity: DocumentIdentity } {
    const existing = existingShapeCodes(this.listDocuments());
    const sequence = this.openSequence;
    this.openSequence += 1;
    return {
      id: document.id,
      identity: normalizeDocumentIdentity(undefined, documentIdentitySeed(document, sequence), existing)
    };
  }

  private repairIdentities(): void {
    const existing = new Set<string>();
    for (const file of Object.values(this.state.entries)) {
      if (file.kind !== "file" || file.fileKind !== "text") {
        continue;
      }
      this.state.entries[file.id] = {
        ...file,
        identity: normalizeDocumentIdentity(file.identity, documentIdentitySeed({ id: file.id, fileName: file.name, languageId: file.languageId || "text.plain" }, this.openSequence), existing)
      };
      this.openSequence += 1;
    }
  }

  private touch(): void {
    this.state.updatedAt = new Date().toISOString();
  }
}

function createDefaultWorkspaceState(): WorkspaceState {
  const now = new Date().toISOString();
  const workspaceId = createId("workspace");
  const rootFolderId = createId("folder");
  const entries: Record<string, WorkspaceEntry> = {};
  entries[rootFolderId] = {
    id: rootFolderId,
    kind: "folder",
    name: "",
    parentId: null,
    path: "/",
    createdAt: now,
    updatedAt: now,
    origin: "created"
  };

  const manager = {
    addFolder(path: string, origin: WorkspaceFolder["origin"], readOnly = false, system = false, virtual = false): string {
      const folderId = createId("folder");
      const parent = path === "/" ? null : parentPath(path);
      entries[folderId] = {
        id: folderId,
        kind: "folder",
        name: baseName(path),
        parentId: parent === "/" ? rootFolderId : Object.values(entries).find((entry) => entry.kind === "folder" && entry.path === parent)?.id || rootFolderId,
        path,
        createdAt: now,
        updatedAt: now,
        origin,
        readOnly,
        system,
        virtual
      };
      return folderId;
    }
  };

  const hiddenRootId = manager.addFolder("/.textforge", "created", true, true, true);
  const resourcesFolderId = manager.addFolder("/.textforge/resources", "bundled-resource", true, true, true);
  manager.addFolder("/.textforge/automation", "created", false, true, true);
  manager.addFolder("/.textforge/automation/lua", "created", false, true, true);
  manager.addFolder("/docs", "created");
  manager.addFolder("/examples", "created");

  let sequence = 0;
  const existing = new Set<string>();
  for (const resource of textForgeResources) {
    const parentPathValue = parentPath(`/.textforge/resources/${resource.path}`);
    const folderEntry = Object.values(entries).find((entry) => entry.kind === "folder" && entry.path === parentPathValue) as WorkspaceFolder | undefined;
    const parentId = folderEntry?.id || resourcesFolderId;
    if (!folderEntry && parentPathValue !== "/.textforge/resources") {
      const segments = parentPathValue.split("/").filter(Boolean);
      let currentPath = "";
      let currentParentId = hiddenRootId;
      for (const segment of segments) {
        currentPath = `${currentPath}/${segment}`;
        const existingFolder = Object.values(entries).find((entry) => entry.kind === "folder" && entry.path === currentPath) as WorkspaceFolder | undefined;
        if (existingFolder) {
          currentParentId = existingFolder.id;
          continue;
        }
        const id = createId("folder");
        entries[id] = {
          id,
          kind: "folder",
          name: segment,
          parentId: currentParentId,
          path: currentPath,
          createdAt: now,
          updatedAt: now,
          origin: "bundled-resource",
          readOnly: true,
          system: true,
          virtual: true
        };
        currentParentId = id;
      }
    }
    const finalParent = Object.values(entries).find((entry) => entry.kind === "folder" && entry.path === parentPathValue) as WorkspaceFolder | undefined;
    const fileId = createId("file");
    entries[fileId] = {
      id: fileId,
      kind: "file",
      fileKind: "text",
      name: baseName(`/${resource.path}`),
      parentId: finalParent?.id || parentId,
      path: normalizeWorkspacePath(`/.textforge/resources/${resource.path}`),
      languageId: resource.languageId,
      text: resource.text,
      size: resource.text.length,
      version: 1,
      dirty: false,
      identity: normalizeDocumentIdentity(undefined, documentIdentitySeed({ id: fileId, fileName: resource.path, languageId: resource.languageId }, sequence), existing),
      createdAt: now,
      updatedAt: now,
      origin: "bundled-resource",
      readOnly: true,
      system: true,
      virtual: true
    };
    sequence += 1;
  }

  return {
    schemaVersion: 1,
    workspaceId,
    rootFolderId,
    entries,
    openFileIds: [],
    activeFileId: null,
    selectedEntryId: null,
    updatedAt: now
  };
}

function compareEntries(left: WorkspaceEntry, right: WorkspaceEntry): number {
  if (left.path === "/") {
    return -1;
  }
  if (right.path === "/") {
    return 1;
  }
  if (left.parentId === right.parentId && left.kind !== right.kind) {
    return left.kind === "folder" ? -1 : 1;
  }
  return left.path.localeCompare(right.path);
}

function normalizeEntryName(name: string): string {
  const trimmed = String(name || "").trim() || "untitled.txt";
  const validity = validateEntryName(trimmed);
  if (!validity.ok) {
    throw new Error(validity.message);
  }
  return trimmed;
}

function normalizeDocumentIdentity(identity: DocumentIdentity | undefined, seed: string, existing: Set<string>): DocumentIdentity {
  const preferredCode = identity?.shapeCode || identity?.badgeLabel;
  if (isValidShapezOneLayerCode(preferredCode) && !existing.has(preferredCode)) {
    existing.add(preferredCode);
    return {
      ...identity,
      ...documentIdentityForShapezCode(preferredCode),
      badgeLabel: preferredCode,
      badgeKind: "shapez-one-layer",
      shapeCode: preferredCode
    };
  }
  return createUniqueDocumentIdentity(seed, existing, preferredCode);
}

function existingShapeCodes(documents: Iterable<TextDocument>): Set<string> {
  const existing = new Set<string>();
  for (const document of documents) {
    const code = document.identity?.shapeCode || document.identity?.badgeLabel;
    if (isValidShapezOneLayerCode(code)) {
      existing.add(code);
    }
  }
  return existing;
}

function documentIdentitySeed(
  document: { id: string; fileName: string; languageId: string },
  sequence: number
): string {
  return `${document.id}|${document.fileName}|${document.languageId}|${sequence}`;
}
