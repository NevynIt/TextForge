import type { DocumentIdentity, TextDocument } from "../domain/types";

export type WorkspaceEntryKind = "folder" | "file";
export type WorkspaceFileKind = "text" | "binary";
export type WorkspaceEntryOrigin =
  | "created"
  | "uploaded"
  | "zip-imported"
  | "generated"
  | "bundled-resource"
  | "resource-copy";

export interface WorkspaceState {
  schemaVersion: 1;
  workspaceId: string;
  rootFolderId: string;
  entries: Record<string, WorkspaceEntry>;
  openFileIds: string[];
  activeFileId: string | null;
  selectedEntryId: string | null;
  updatedAt: string;
}

export type WorkspaceEntry = WorkspaceFolder | WorkspaceFile;

export interface WorkspaceFolder {
  id: string;
  kind: "folder";
  name: string;
  parentId: string | null;
  path: string;
  createdAt: string;
  updatedAt: string;
  origin: WorkspaceEntryOrigin;
  readOnly?: boolean;
  system?: boolean;
  virtual?: boolean;
}

export interface WorkspaceFile {
  id: string;
  kind: "file";
  fileKind: WorkspaceFileKind;
  name: string;
  parentId: string;
  path: string;
  languageId?: string;
  mediaType?: string;
  text?: string;
  binaryBase64?: string;
  size: number;
  version: number;
  dirty: boolean;
  identity: DocumentIdentity;
  createdAt: string;
  updatedAt: string;
  origin: WorkspaceEntryOrigin;
  readOnly?: boolean;
  system?: boolean;
  virtual?: boolean;
  defaultPipelineId?: string;
  preferredPipelineIds?: string[];
  lastImportedAt?: string;
  lastExportedAt?: string;
  sourcePath?: string;
}

export interface WorkspaceImportFile {
  path: string;
  fileKind?: WorkspaceFileKind;
  languageId?: string;
  mediaType?: string;
  text?: string;
  blob?: Blob;
  updatedAt?: string;
  createdAt?: string;
  origin?: WorkspaceEntryOrigin;
}

export interface WorkspaceTextFileView extends TextDocument {
  path: string;
  readOnly?: boolean;
}
