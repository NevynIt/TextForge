# Implementing the TextForge Application-Private Workspace

## Agent implementation white paper

**Version:** 4.0  
**Date:** 2026-05-22  
**Target repository:** `https://github.com/NevynIt/TextForge`  
**Target branch assumption:** `main`  
**Audience:** implementation agent, maintainer, reviewer  
**Purpose:** provide clear implementation instructions for adding a persistent, sandboxed, multi-file workspace to the current TextForge application without weakening the secure local-first architecture.

**Major v2 change:** TextForge is pre-alpha. There is **no requirement for backwards compatibility** with the current open-document model or with existing IndexedDB contents. The implementation may introduce a new destructive IndexedDB schema, clear old persisted data, remove compatibility adapters, and refactor the current `TextDocument`-centric model into a canonical workspace model.

**Major v3 change:** Lua integration is clarified. Ordinary `.lua` files in the workspace must remain inert by default. The user may explicitly run the Lua file being edited, or explicitly promote selected Lua files into a dedicated workspace automation area. Only Lua files stored in that dedicated auto-load area are scanned for pipeline/action registration, and that area may contain subfolders.

**Major v4 change:** The separate Resource Browser is removed as an architectural concept. Bundled TextForge resources become a virtual read-only folder inside the workspace tree. More generally, any workspace file can be acted on in two ways: it can be opened for editing when editable, or it can be sent directly to a suitable visualization pipeline without opening an editor tab. This is especially important for Markdown, Mermaid, SVG, PDF, images, generated artifacts, and other files whose primary interaction is viewing rather than text editing.

---

## 1. Executive summary

TextForge should evolve from a multi-document text editor into a local, sandboxed project workbench.

The current application already has many useful building blocks: CodeMirror editing, Preact UI, plugin pipelines, Lua scripting, viewer popups, diagnostics, resource browsing, local-only security verification, and IndexedDB persistence. The next architectural step is to replace the current assumption that “the workspace is the list of open documents” with a first-class **application-private workspace**.

The workspace must behave like a virtual project area inside TextForge:

- it contains folders and files;
- files may be text or binary;
- a file can exist in the workspace without being open in an editor tab;
- editor tabs are views over workspace text files;
- files can be visualized directly from the workspace tree without opening an editor tab;
- bundled TextForge docs/examples/resources appear as a read-only virtual workspace folder;
- viewers, transformers, Lua scripts, ITM includes, Markdown assets, PDF utilities, and future plugins can resolve related files through workspace paths;
- users can import individual files into a selected workspace folder;
- users can import a ZIP archive into a selected workspace folder;
- users can export one file, one selected folder subtree, or the whole workspace root;
- read-only bundled resources can be opened/viewed and copied into editable workspace areas when needed;
- persistence remains browser-local through IndexedDB;
- the File System Access API, directory handles, persistent handles, browser-specific directory traversal APIs, and native filesystem bridges remain forbidden.

The key security principle is:

```text
TextForge may freely read and write inside its own IndexedDB-backed workspace.
TextForge must not read or write arbitrary local filesystem paths.
Files cross the local filesystem boundary only through explicit user-mediated import/export actions.
```

This is not a live folder mapping. It is a sandboxed virtual workspace owned by the application.

Because TextForge is pre-alpha, the implementation should optimize for a clean architecture rather than compatibility with existing persisted sessions. Old IndexedDB content may be discarded.

---

## 2. Current repository baseline

The current repository already contains a usable foundation for this change.

### 2.1 Current capabilities to preserve functionally

Preserve the useful capabilities, but do not preserve the current internal data model if it gets in the way.

Functional capabilities to retain:

- TypeScript/Vite application structure.
- Preact UI.
- CodeMirror editing.
- Multi-tab editing experience.
- Open, rename, close, reorder, and download workflows, reinterpreted as workspace operations.
- IndexedDB persistence.
- Local-only security posture and verification scripts.
- Plugin registry and pipeline runner.
- Diagnostics service.
- Lua runtime, explicit Lua execution, and controlled Lua pipeline auto-loading from a dedicated workspace area.
- Popup-hosted viewers.
- Bundled resources, migrated from the separate Resource Browser into a read-only virtual workspace folder.
- ITT/ITM include workflows, but resolved from workspace paths rather than only open tabs.

### 2.2 No backwards compatibility requirement

The agent must not spend effort preserving the current IndexedDB state or old serialized workspace shape.

Allowed breaking changes:

```text
- Replace the current IndexedDB database schema.
- Delete or ignore old `kv.workspace` data.
- Remove localStorage fallback for workspace content.
- Redefine or remove `TextDocument` if a cleaner workspace type replaces it.
- Rename document-oriented APIs to file/workspace-oriented APIs.
- Update tests to the new model rather than preserving old behavior.
```

Do still preserve the **user-facing intent** where it remains useful:

```text
New document   -> create a new workspace text file and open it.
Open files     -> import files into the workspace and optionally open text files.
Download       -> export the active workspace file.
Close tab      -> close editor view only, not delete the file.
Delete file    -> delete the workspace file and close related views.
```

### 2.3 Current code anchors

The agent should inspect and modify at least these files:

```text
src/domain/types.ts
src/core/workspaceManager.ts
src/core/storage.ts
src/core/pipelineRunner.ts
src/core/diagnosticsService.ts
src/app/useAppServices.ts
src/app/App.tsx
src/components/shell/TopBar.tsx
src/components/shell/DocumentTabs.tsx
src/components/PopupHost.tsx
src/components/ResourceBrowserPanel.tsx        # retire or replace with workspace resources view
src/resources/resourceCatalog.ts              # source data for read-only resource folder
src/lua/*
src/parsers/*
src/plugins/*
src/security.verify.test.js
scripts/verify-security.mjs
package.json
```

Expected new files include:

```text
src/core/workspaceTypes.ts
src/core/workspacePaths.ts
src/core/workspaceStorage.ts
src/core/fileGateway.ts
src/core/zipGateway.ts
src/core/workspaceResolver.ts
src/core/viewPipelineRouter.ts
src/core/resourceFolderProvider.ts
src/lua/luaAutomationRegistry.ts
src/lua/luaWorkspaceRequire.ts
src/components/workspace/WorkspaceExplorer.tsx
src/components/workspace/WorkspaceTree.tsx
src/components/workspace/WorkspaceContextMenu.tsx
src/components/workspace/WorkspaceFileActions.tsx
src/core/workspacePaths.test.ts
src/core/workspaceManager.test.ts
src/core/workspaceStorage.test.ts
src/core/zipGateway.test.ts
src/lua/luaAutomationRegistry.test.ts
src/lua/luaWorkspaceRequire.test.ts
```

Names may vary, but responsibilities should remain separated.

---

## 3. Target concept

### 3.1 Replace “open documents are the workspace” with “workspace contains files”

The new model should distinguish:

| Concept | Meaning |
|---|---|
| Workspace | Persistent application-private project area. |
| Workspace folder | Virtual folder inside TextForge, not a local filesystem directory handle. |
| Workspace file | Stored text or binary item inside the workspace. |
| Open editor tab | A UI/editor view over an editable text workspace file. |
| Direct visualization | A pipeline/viewer invocation over a workspace file that does not require opening an editor tab. |
| Viewer popup | A view over one file, a derived model, or a pipeline result. |
| Generated file | A file created by a pipeline, viewer export, Lua script, or built-in operation. |
| Imported file | A file explicitly supplied by the user through file input, drag/drop, or ZIP import. |
| Bundled resource file | A read-only file supplied by the application and exposed inside a virtual workspace folder. |
| Exported file/folder | A file or subtree explicitly downloaded by the user. |

Closing an editor tab must not delete the underlying workspace file. Deleting a workspace file must close related editor tabs and invalidate or warn related viewers.

### 3.2 Workspace boundary

The workspace is a sandbox inside the browser origin:

```text
User filesystem
  -> explicit file import or ZIP import
TextForge workspace in IndexedDB
  -> edit, view, transform, generate, resolve references
User filesystem
  <- explicit file export, folder ZIP export, or workspace ZIP export
```

Forbidden:

```text
showOpenFilePicker
showSaveFilePicker
showDirectoryPicker
FileSystemFileHandle
FileSystemDirectoryHandle
DataTransferItem.getAsFileSystemHandle
webkitGetAsEntry
webkitdirectory
directory upload recursion
persistent local file handles
native filesystem bridge
chrome.fileSystem
file:// host permissions
```

Allowed:

```text
<input type="file"> for explicit file selection
controlled drag/drop of explicit files
ZIP import selected by the user
ZIP export triggered by the user
Blob download through approved export gateway
IndexedDB storage of application-private workspace content
```

### 3.3 Two file actions: edit or view

Every workspace file should support the clearest action for its kind. Do not assume that opening a file means opening CodeMirror.

Use this distinction:

| Action | Meaning | Examples |
|---|---|---|
| Open for editing | Create or focus an editor tab over an editable text file. | `.md`, `.itm`, `.lua`, `.json`, `.dot`, `.mmd`, `.txt` |
| View / run visualization | Invoke a viewer or visualization pipeline directly against the workspace file without opening an editor tab. | Markdown preview, Mermaid render, SVG preview, image preview, PDF preview, ITM graph, Graphviz render |

This should be exposed in the workspace explorer. A user should be able to right-click or select a file and choose:

```text
Open
View
View with...
Run pipeline...
Export
Copy to editable area, if read-only
```

Default double-click behavior may be type-aware:

```text
editable text source -> open in editor tab
strong viewer type   -> open default viewer
read-only resource   -> view by default, offer copy/edit action
binary unsupported   -> show metadata and export option
```

---

## 4. Clean data model

### 4.1 Workspace is canonical

Do not implement a dual model where legacy `TextDocument[]` remains the real state. The canonical application state must be a `WorkspaceState` containing entries, open file IDs, active file ID, and workspace metadata.

Use a clean model similar to the following:

```ts
type WorkspaceEntryKind = "folder" | "file";
type WorkspaceFileKind = "text" | "binary";
type WorkspaceEntryOrigin =
  | "created"
  | "uploaded"
  | "zip-imported"
  | "generated"
  | "bundled-resource"
  | "resource-copy";

interface WorkspaceState {
  schemaVersion: 1;
  workspaceId: string;
  rootFolderId: string;
  entries: Record<string, WorkspaceEntry>;
  openFileIds: string[];
  activeFileId: string | null;
  selectedEntryId?: string | null;
  updatedAt: string;
}

type WorkspaceEntry = WorkspaceFolder | WorkspaceFile;

interface WorkspaceFolder {
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
}

interface WorkspaceFile {
  id: string;
  kind: "file";
  fileKind: WorkspaceFileKind;
  name: string;
  parentId: string;
  path: string;
  languageId?: string;
  mediaType?: string;
  text?: string;
  blob?: Blob;
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
```

The workspace schema can start at `schemaVersion: 1` because this is a new canonical schema. IndexedDB itself may use database version `2` or a new database name to replace the current pre-alpha storage.

### 4.2 Replace or redefine `TextDocument`

Because backwards compatibility is not required, prefer replacing `TextDocument` with clearer workspace-oriented types.

Recommended new naming:

```ts
interface WorkspaceTextFileView {
  id: string;             // same as WorkspaceFile.id
  name: string;
  path: string;
  languageId: string;
  text: string;
  version: number;
  dirty: boolean;
  identity: DocumentIdentity;
  createdAt: string;
  updatedAt: string;
}
```

If keeping the name `TextDocument` reduces churn, redefine it as a view over a workspace text file and add `path` as mandatory. Do not create old-to-new adapters just for compatibility.

The open editor tab list must be derived from `WorkspaceState.openFileIds`, not from an independent document list.

### 4.3 Folder/file identity

Entry IDs must be stable and separate from paths. Paths can change through rename or move. Any popup, editor, diagnostic, trace, or viewer should use `fileId` or `documentId` for stable identity and display `path` for user confidence.

### 4.4 Binary files

Binary files are first-class workspace files. They may be imported, stored, previewed by capable viewers, moved, renamed, included in ZIP export, and downloaded.

Do not open binary content in CodeMirror by default. If no viewer exists, show a simple metadata panel and an export action.

---

## 5. Path rules

Create `src/core/workspacePaths.ts` and centralize all path logic there. Do not scatter path manipulation across components.

### 5.1 Canonical path rules

Use these rules:

```text
- Use `/` as the only separator.
- Root is `/`.
- Internal file paths should be absolute workspace paths for display and lookup, e.g. `/docs/model.itm`.
- Accept imported ZIP paths as relative paths and map them under the selected target folder.
- Convert backslashes to `/` during import.
- Collapse duplicate separators.
- Remove `.` segments.
- Reject paths that escape root through `..`.
- Reject absolute OS paths such as `C:\...`, `C:/...`, `/etc/passwd`, `//server/share` when imported from ZIP.
- Reject NUL and control characters.
- Trim leading/trailing whitespace in individual path segments.
- Do not allow empty names.
- Do not allow duplicate sibling names unless resolved by a conflict policy.
```

### 5.2 Required functions

Implement and unit-test at least:

```ts
normalizeWorkspacePath(path: string): string;
normalizeImportPath(path: string): string;
joinWorkspacePath(base: string, relative: string): string;
parentPath(path: string): string;
baseName(path: string): string;
isPathInside(parent: string, child: string): boolean;
resolveRelativePath(baseFilePath: string, target: string): string;
validateEntryName(name: string): { ok: true } | { ok: false; message: string };
```

### 5.3 Conflict policy

Use deterministic conflict resolution for bulk imports:

```text
foo.md
foo (2).md
foo (3).md
```

For interactive rename/create, reject duplicate sibling names and show a clear status message.

---

## 6. Workspace manager responsibilities

Refactor `WorkspaceManager` so it owns the tree, open tabs, active file, and file operations.

### 6.1 Required operations

The manager should expose operations similar to:

```ts
class WorkspaceManager {
  snapshot(): WorkspaceState;
  restore(state: WorkspaceState): void;
  resetToDefaultWorkspace(): void;

  listEntries(): WorkspaceEntry[];
  listChildren(folderId: string): WorkspaceEntry[];
  getEntry(id: string): WorkspaceEntry | undefined;
  getFile(id: string): WorkspaceFile | undefined;
  getFolder(id: string): WorkspaceFolder | undefined;
  findByPath(path: string): WorkspaceEntry | undefined;

  createFolder(parentId: string, name: string): WorkspaceFolder;
  createTextFile(parentId: string, name: string, text?: string, languageId?: string): WorkspaceFile;
  createBinaryFile(parentId: string, name: string, blob: Blob, mediaType?: string): WorkspaceFile;
  importFiles(parentId: string, files: WorkspaceImportFile[], options?: ImportOptions): ImportReport;
  importZip(parentId: string, zip: Blob): Promise<ImportReport>;

  renameEntry(id: string, nextName: string): WorkspaceEntry | undefined;
  moveEntry(id: string, nextParentId: string): WorkspaceEntry | undefined;
  deleteEntry(id: string): DeletedEntryReport;

  openFile(id: string): WorkspaceFile | undefined;
  closeFile(id: string): WorkspaceFile | undefined;
  switchFile(id: string): WorkspaceFile | undefined;
  reorderOpenFile(id: string, targetId?: string, position?: "before" | "after" | "end"): void;

  updateText(id: string, text: string): WorkspaceFile | undefined;
  updateLanguage(id: string, languageId: string): WorkspaceFile | undefined;
  markClean(id: string): void;

  exportFile(id: string): WorkspaceFile | undefined;
  collectSubtree(folderId: string): WorkspaceEntry[];
  listOpenTextFileViews(): WorkspaceTextFileView[];
  getActiveTextFileView(): WorkspaceTextFileView | undefined;
}
```

### 6.2 Open tabs

The current `DocumentTabs` component should continue to show open files. It should not show every workspace file. The new workspace explorer shows every workspace entry.

Close tab behavior:

```text
Close tab -> remove file id from openFileIds.
Delete file -> remove file from workspace and close any tab/popup tied to it.
```

### 6.3 Dirty state

Since there is no live external file, dirty cannot mean “not saved to disk”. It should mean:

```text
Modified since creation/import/last explicit export.
```

Keep the `*` tab marker. Update status text to avoid implying silent write-back to local disk.

Good status messages:

```text
Edited /docs/model.itm.
Exported /docs/model.itm.
Imported 12 files into /examples.
Exported /examples as examples.zip.
```

Avoid:

```text
Saved file.
Wrote to folder.
Synced with disk.
```

---

## 7. IndexedDB persistence

### 7.1 IndexedDB remains canonical

Continue using IndexedDB for workspace persistence. The workspace must not use File System Access API, persistent handles, or directory handles.

Because TextForge is pre-alpha, do not implement compatibility with existing persisted `kv.workspace` data. The old data can be ignored or destroyed.

### 7.2 Destructive schema reset is allowed

Use one of these clean strategies.

Preferred strategy:

```text
Use a new database name, for example `textforge-workspace`.
Leave the old `textforge` database unused or delete it once the new app starts successfully.
```

Alternative strategy:

```text
Keep the `textforge` database name but bump IndexedDB version and recreate stores.
In `onupgradeneeded`, delete old stores if present and create the new workspace stores.
```

Either strategy is acceptable. Do not write migration code from the old `StoredWorkspace` shape.

### 7.3 Recommended database layout

Recommended object stores:

```text
kv
  key -> miscellaneous settings and plugin preferences

workspaceMeta
  key -> workspace metadata, activeFileId, openFileIds, selectedEntryId, schemaVersion

workspaceEntries
  id -> metadata for file/folder entries, including text content for small text files if preferred

workspaceContent
  id -> Blob, ArrayBuffer, or text payload for each file
```

A simpler implementation may store the whole `WorkspaceState` in one `kv.workspace` record if the code is simpler. However, separate stores are preferred because ZIP imports and binary files can become large.

### 7.4 Storage service API

Create or refactor into methods such as:

```ts
class TextForgeStorage {
  init(): Promise<void>;
  resetWorkspaceStorage(): Promise<void>;
  loadWorkspaceState(): Promise<WorkspaceState | null>;
  saveWorkspaceState(state: WorkspaceState): Promise<void>;
  savePluginPreferences(preferences: PluginPreferences): Promise<void>;
  loadPluginPreferences(): Promise<PluginPreferences>;
}
```

### 7.5 Startup behavior

On startup:

1. initialize IndexedDB using the new schema;
2. load `WorkspaceState`;
3. if no state exists, create a default workspace with one welcome file;
4. restore open file IDs and active file ID from the new state;
5. never attempt to load or migrate old `StoredWorkspace` data.

### 7.6 localStorage fallback

The secure workspace profile should treat IndexedDB as canonical. Do not use localStorage for workspace content.

Recommended rule:

```text
If IndexedDB is unavailable, allow a degraded in-memory session with a visible warning.
Do not silently persist workspace content in localStorage.
```

Plugin preferences may still use a minimal fallback if already present, but workspace files and binary content must not.

---

## 8. File gateway

### 8.1 Centralize all file boundary operations

Create `src/core/fileGateway.ts` and ensure all imports/exports pass through it.

Approved responsibilities:

```ts
readSelectedFiles(files: FileList | File[]): Promise<WorkspaceImportFile[]>;
triggerFileDownload(fileName: string, blob: Blob): void;
triggerTextDownload(fileName: string, text: string, mediaType: string): void;
```

Allowed APIs in this module:

```text
File
FileReader or File.text()/File.arrayBuffer()
Blob
URL.createObjectURL
HTMLAnchorElement download click triggered by explicit user action
```

Forbidden everywhere, including this module:

```text
showOpenFilePicker
showSaveFilePicker
showDirectoryPicker
FileSystemFileHandle
FileSystemDirectoryHandle
DataTransferItem.getAsFileSystemHandle
webkitGetAsEntry
webkitdirectory
```

### 8.2 Existing open/download behavior

Replace current file input and download code paths with file gateway logic.

Current behavior:

```text
File input -> read as text -> open document tab.
Download active document -> Blob -> anchor download.
```

New behavior:

```text
File input -> import into selected workspace folder -> create workspace files -> open imported text files if appropriate.
Download active file -> export selected file only.
Export folder -> ZIP selected folder subtree.
Export workspace -> ZIP root subtree.
```

### 8.3 Drag/drop

Allow drag/drop of explicit files only. Do not inspect or recurse directories through browser-specific entry APIs.

Do not use:

```text
DataTransferItem.webkitGetAsEntry()
DataTransferItem.getAsFileSystemHandle()
```

If a dropped item is a directory, report:

```text
Folder drag/drop is not supported directly. Import a ZIP archive instead.
```

---

## 9. ZIP gateway

### 9.1 Purpose

ZIP is the approved way to move folders or whole workspaces across the local filesystem boundary.

Supported operations:

```text
Import ZIP into selected workspace folder.
Export selected workspace folder as ZIP.
Export whole workspace root as ZIP.
Export selected files as ZIP, optional later.
```

### 9.2 Library choice

Add one browser-compatible ZIP library. Prefer a small, pure JavaScript/TypeScript library such as `fflate` or `jszip`.

Selection criteria:

```text
- browser-only, no native dependency;
- works in local file build and extension target;
- supports unzip and zip creation;
- handles binary files;
- does not require network access;
- compatible with Vite bundling;
- acceptable package size.
```

### 9.3 ZIP import rules

Import behavior:

```text
User selects a .zip file.
TextForge reads it through the file gateway.
zipGateway enumerates archive entries in memory.
Each archive path is normalized and validated.
Entries are imported under the currently selected workspace folder.
Folders are created virtually.
Files are decoded as text where safe or stored as binary otherwise.
An import report is shown in status/diagnostics.
```

Reject or skip with diagnostic:

```text
- `../` path traversal;
- absolute paths;
- Windows drive paths;
- UNC paths;
- empty file names;
- NUL/control characters;
- entries above configured size limit;
- archive exceeding configured total size limit;
- excessive file count;
- encrypted or unsupported ZIP entries;
- symbolic links, if exposed by the library;
- duplicate entries after normalization unless conflict policy resolves them.
```

Recommended limits for initial implementation:

```text
max files per import: 2000
max uncompressed total: 200 MB
max single file: 50 MB
max path depth: 32
```

Make limits constants in one place.

### 9.4 ZIP export rules

Export behavior:

```text
Selected file -> ordinary file download.
Selected folder -> ZIP of that folder subtree.
Root folder -> ZIP of entire workspace.
```

When exporting a selected folder:

```text
- include subfolders;
- preserve relative paths inside the selected folder;
- include binary blobs unchanged;
- encode text as UTF-8;
- do not include internal metadata by default;
- optionally include `.textforge/workspace-manifest.json` later, but not in MVP.
```

File names:

```text
/docs -> docs.zip
/ -> textforge-workspace.zip
```

---

## 10. UI changes

### 10.1 Add a workspace explorer

Add a left-side `WorkspaceExplorer` panel. It should show the full virtual workspace tree, including ordinary user workspace folders, generated outputs, Lua automation folders, and the virtual read-only resource folder.

Minimum actions:

```text
- select folder/file;
- open editable text file in editor tab;
- view file using the default visualization pipeline;
- choose "View with..." or "Run pipeline..." for files with multiple matching pipelines;
- create file;
- create folder;
- rename editable entries;
- delete editable entries;
- copy read-only resource into editable workspace location;
- import files into selected folder;
- import ZIP into selected folder;
- export selected file;
- export selected folder as ZIP;
- export whole workspace as ZIP.
```

Nice-to-have but not required for MVP:

```text
- move by drag/drop inside tree;
- duplicate file;
- reveal active file in tree;
- filter/search workspace tree;
- show binary/text icons;
- show generated/imported/dirty/read-only badges;
- show file size;
- show default viewer/pipeline badge.
```

### 10.2 Preserve document tabs as open-file tabs

`DocumentTabs` should continue to show open editor tabs, not the whole workspace.

Changes:

```text
- Rename prop concept from `documents` to `openFiles` or `openTextFiles`.
- Show path in tooltip.
- Display basename in tab.
- Closing a tab closes the editor view only.
- Reordering tabs updates `openFileIds`.
- Viewing a file directly must not create a tab unless the user explicitly opens it for editing.
```

### 10.3 Replace the Resource Browser with a read-only resources folder

Remove the separate Resource Browser as a user-facing concept. The current resource catalogue should become data used to populate a virtual folder:

```text
/.textforge/resources/
  docs/
  examples/
  README.md
```

The user should browse these resources in the same workspace explorer used for ordinary files.

Rules:

```text
- Resource files are read-only by default.
- Double-clicking a resource should view it if a clear viewer exists.
- The user may choose "Open copy for editing" or "Copy to...".
- Copying creates a normal editable workspace file with origin `resource-copy`.
- Resource files should not be silently included in ordinary folder exports unless the user explicitly exports the resource folder or the whole root with system content enabled.
```

This removes the need for `ResourceBrowserPanel` as a separate browsing surface. Its useful resource list and open/view behavior should be reimplemented through the workspace explorer and file action router.

### 10.4 Update top bar

The current top bar includes a Resources button. Remove that button once the resource folder appears in the workspace tree.

Recommended top-level buttons:

```text
New File
Import Files
Import ZIP
Export Workspace
Download File
Diagnostics
Plugins
Trace
Lua
Automation
```

Alternative: keep the top bar compact and place most file/folder/view operations in the workspace explorer context menu.

### 10.5 Add direct visualization actions

The workspace explorer should expose direct visualization actions that do not require opening a CodeMirror editor tab.

Examples:

```text
/docs/user-manual.md          -> View Markdown
/diagrams/flow.mmd            -> View Mermaid
/diagrams/architecture.dot    -> View Graphviz
/models/system.itm            -> View ITM Tree / Mindmap / Graph
/assets/logo.svg              -> View SVG
/assets/photo.png             -> View Image
/assets/manual.pdf            -> View PDF, when PDF viewer support is added
/generated/report.html        -> View HTML, sanitized/local-only
```

A file may have:

```text
- one default viewer action;
- several compatible pipelines under "View with...";
- editor opening if it is editable text;
- no editor opening if it is binary or read-only-only.
```

### 10.6 Main layout

Current layout:

```text
TopBar
DocumentTabs
ActionBar
Editor pane
StatusBar
Popups
```

Target layout:

```text
TopBar
DocumentTabs
ActionBar
Main area
  WorkspaceExplorer | Editor pane or selected-file metadata
StatusBar
Popups
```

Add CSS carefully so existing popups and editor layout are not broken.

### 10.7 Binary file behavior

When a binary file is selected/opened:

```text
- if a viewer exists for the media type, offer preview;
- otherwise show a simple metadata panel;
- provide download/export;
- do not open binary content in CodeMirror by default.
```

MVP can simply refuse editor opening and show:

```text
Binary files are stored in the workspace and can be exported, but no editor is available for this type yet.
```

---

## 11. Pipeline and plugin integration

### 11.1 Extend contribution context

Current pipeline context provides `runtime` and `documents`. Replace or supplement that with a workspace context.

Because there is no backwards compatibility requirement, the preferred end state is:

```ts
export interface ContributionContext {
  runtime: RuntimeLoader;
  workspace: WorkspaceContributionContext;
}

export interface WorkspaceContributionContext {
  activeFileId: string | null;
  selectedFileId: string | null;
  listFiles(): WorkspaceFileSummary[];
  listTextFiles(): WorkspaceFileSummary[];
  listOpenTextFiles(): WorkspaceFileSummary[];
  getFile(id: string): WorkspaceFileSummary | undefined;
  findByPath(path: string): WorkspaceFileSummary | undefined;
  resolvePath(baseFileId: string, target: string): string;
  readText(pathOrId: string, options?: { baseFileId?: string }): Promise<string | undefined>;
  readBinary(pathOrId: string, options?: { baseFileId?: string }): Promise<Blob | undefined>;
}
```

If keeping `documents?: TextDocument[]` temporarily makes implementation easier, that is acceptable only as an internal transitional step within the same pull request. It should not remain the architectural center.

For safety, start with read-only workspace access for plugins/viewers/transformers. Writes should go through controlled pipeline results that the app decides how to place in the workspace.

### 11.2 Run pipelines against unopened files

Refactor `PipelineRunner` so it can run against a workspace file ID, not only the active editor document.

Required behavior:

```text
- A workspace file may be passed to a pipeline without being in `openFileIds`.
- The runner reads current file content from the workspace manager/storage.
- Diagnostics and traces refer to the file ID and path.
- Viewer popups display the source file path so the user knows what is being viewed.
- Refreshing a viewer re-reads the source file from the workspace.
```

Suggested API direction:

```ts
runPipelineForFile(pipelineId: string, fileId: string): Promise<PipelineRunResult>;
runPipelineForValue(pipeline: PipelineContribution, value: PipelineValue, source?: WorkspaceFileSummary): Promise<PipelineRunResult>;
```

Do not require a CodeMirror tab just to view Markdown, Mermaid, SVG, images, PDF, ITM graphs, or generated artifacts.

### 11.3 Add a view pipeline router

Create a `viewPipelineRouter` or equivalent service that selects suitable default visualization actions for a workspace file.

Inputs:

```text
file path
extension
languageId
mediaType
fileKind text/binary
readOnly flag
registered pipelines
viewer capabilities
```

Outputs:

```ts
type FileAction =
  | { kind: "edit"; label: "Open for editing"; fileId: string }
  | { kind: "view"; label: string; fileId: string; pipelineId: string; default?: boolean }
  | { kind: "metadata"; label: "Show file information"; fileId: string }
  | { kind: "copy"; label: "Copy to editable workspace"; fileId: string };
```

Initial default mapping examples:

| File kind | Suggested default action |
|---|---|
| `text.markdown`, `.md` | Markdown HTML viewer |
| Mermaid source, `.mmd`, `.mermaid` | Mermaid viewer/renderer |
| Graphviz DOT, `.dot`, `.gv` | Graphviz SVG viewer |
| ITM/ITT, `.itm`, `.itt` | ITM/ITT tree or graph viewer |
| SVG, `.svg` | SVG viewer |
| HTML, `.html` | sanitized/local HTML viewer if already supported |
| PNG/JPEG/GIF/WebP | image viewer |
| PDF, `.pdf` | PDF viewer when implemented |
| unknown binary | metadata panel and export |

The router should use registered pipelines rather than hard-coding everything into UI components. Hard-coded fallbacks are acceptable for simple built-in binary viewers such as image/SVG/PDF preview.

### 11.4 Pipeline output placement

Current terminal transformer outputs open as a new document. Replace that with:

```text
Transformer output -> generated workspace file -> open in editor tab if text, or offer/view if primarily visual.
```

Use a generated folder convention:

```text
/generated/<pipeline-name>/<timestamp-or-counter>.<ext>
```

Or simpler for MVP:

```text
/generated/<derived-file-name>
```

Avoid silently overwriting generated files. Use conflict suffixing.

For visual outputs:

```text
SVG output  -> create generated SVG file and open viewer popup.
HTML output -> create generated HTML/text file and open viewer popup if safe.
PDF output  -> create generated binary PDF file and offer viewer/download.
```

### 11.5 Diagnostics

Add path/file metadata to diagnostics where possible:

```ts
interface Diagnostic {
  documentId?: string;        // retained if still used by UI
  workspaceEntryId?: string;
  filePath?: string;
  ...
}
```

When an include or workspace reference fails, diagnostics should indicate both:

```text
source file path
referenced target
resolution rule tried
```

### 11.6 Viewer popup source binding

Viewer popups should be bound to a workspace source file, not just to an open editor tab.

Popup metadata should include:

```ts
sourceFileId?: string;
sourceFilePath?: string;
sourceFileVersion?: number;
sourcePipelineId?: string;
```

Refreshing a popup should work even when the source file is not open in an editor. If the source file is deleted, the popup should display a clear stale-source message.

---

## 12. Include and reference resolution

### 12.1 Replace open-document include resolution

Includes and related file references must resolve against the workspace tree, not merely open editor tabs.

New rule:

```text
Includes and related file references resolve against workspace paths.
```

### 12.2 Resolution order

For an active source file `/models/system/main.itm`:

```text
%include common.itm
  -> /models/system/common.itm

%include ../shared/types.itm
  -> /models/shared/types.itm

%include /profiles/bpmn.itm
  -> /profiles/bpmn.itm
```

Do not allow `../` to escape above `/`.

### 12.3 Ambiguity

Avoid global filename search as a primary rule. It creates ambiguity. Use path-based resolution.

Since there is no backwards compatibility requirement, do not implement an open-document filename fallback unless there is a strong current-code reason. If implemented temporarily, emit an observation diagnostic and remove it before final acceptance.

### 12.4 Markdown assets

Markdown rendering should resolve local images and links from workspace paths:

```markdown
![Diagram](assets/diagram.svg)
[Reference](../docs/reference.md)
```

For MVP:

- images can be converted to Blob URLs from workspace binary/text files;
- links to workspace text files can open the target file in TextForge;
- external HTTP links remain subject to the existing security posture and should not fetch automatically.

---

## 13. Lua integration

### 13.1 Preserve sandboxing

Lua must remain sandboxed:

```text
no browser globals
no DOM
no network
no local filesystem
no unrestricted JS interop
```

Workspace access, if exposed, is access to the TextForge virtual workspace only. Lua must never gain access to browser filesystem APIs, directory handles, network primitives, DOM objects, or arbitrary JavaScript execution.

### 13.2 Core rule: ordinary Lua files are inert by default

Do **not** scan and execute all `.lua` files in the workspace. A Lua file is just a workspace file unless the user deliberately does something with it.

The user must be able to use Lua in three distinct ways:

| Mode | Trigger | Scope | Result |
|---|---|---|---|
| Run active script | User clicks run while editing a Lua file | The active file only | Executes once and returns output/diagnostics. |
| Run selected text | User runs selected Lua text | Selection only | Executes once and returns output/diagnostics. |
| Auto-load as pipeline/action | User places or promotes a Lua file into the dedicated auto-load area | Only files under that area | Registered as pipelines/actions after inspection. |

This rule prevents a large workspace containing Lua libraries, examples, notes, downloaded code, or test snippets from automatically becoming executable pipeline code.

### 13.3 Dedicated auto-load area

Create a reserved workspace area for auto-load Lua scripts. Use a single canonical root such as:

```text
/.textforge/automation/lua/
```

Subfolders are allowed:

```text
/.textforge/automation/lua/
  transforms/
    uppercase-itm.lua
    normalize-markdown.lua
  exports/
    markdown-index.lua
  experiments/
    draft-action.lua
```

Only `.lua` files under this reserved root are candidates for automatic action/pipeline discovery. Do not discover Lua actions from arbitrary workspace folders such as `/lua`, `/lib`, `/models`, `/docs`, `/assets`, imported ZIP folders, or open editor tabs.

The UI must provide explicit operations to manage this area:

```text
Promote active Lua file to automation area
Copy selected Lua file to automation area
Move selected Lua file to automation area
Remove Lua file from automation area
Open automation area
Reload Lua automation pipelines
Disable/enable a discovered Lua pipeline
```

The implementation may use copy rather than move for MVP, but the UI must make the operation explicit. A file outside the auto-load area remains inert even if it returns a valid Lua action descriptor.

### 13.4 Auto-load discovery behavior

Replace current broad discovery with a workspace automation scanner. The scanner should:

```text
- read only files under `/.textforge/automation/lua/**/*.lua`;
- inspect files only for action descriptors;
- register discovered actions as generated plugin contributions/pipelines;
- report diagnostics for invalid action descriptors;
- never scan all workspace `.lua` files;
- never scan imported folders unless they are explicitly imported into the automation area;
- keep per-file enable/disable state if practical.
```

For MVP, it is acceptable for the scanner to inspect scripts by executing them in the existing Lua sandbox if that is how action descriptors currently work. However, this execution must be limited to the auto-load area and must use an empty/safe input value. Do not execute arbitrary workspace Lua files during app startup or workspace refresh.

Recommended state model:

```ts
type LuaAutomationFile = {
  fileId: string;
  path: string; // must be under /.textforge/automation/lua/
  enabled: boolean;
  lastInspectedVersion?: number;
  diagnostics?: Diagnostic[];
};
```

Current-code implication:

```text
Replace the current `buildLuaActionsPlugin(documents, service)` behavior that filters all open Lua documents.
The new registry must receive either the workspace manager or a pre-filtered list of automation files.
The filtering rule belongs in one place and must enforce the reserved root.
```

Suggested API shape:

```ts
buildLuaAutomationPlugin({
  workspace,
  service,
  automationRoot: "/.textforge/automation/lua",
  enabledFileIds
})
```

### 13.5 Explicit run of the active Lua file

The user must still be able to open any `.lua` file anywhere in the workspace and run it manually. Manual execution is not restricted to the auto-load area.

Examples:

```text
/lua/main.lua                  -> can be opened and run manually
/lib/helpers.lua               -> can be opened and run manually if user chooses
/imported/examples/demo.lua    -> can be opened and run manually if user chooses
/.textforge/automation/lua/x.lua -> can be opened and run manually, and can also auto-load as a pipeline if enabled
```

Manual execution should use the active file path as the script base path for diagnostics and virtual `require` resolution.

### 13.6 Lua module resolution

Add a virtual `require` resolver for workspace Lua libraries. The resolver applies during both manual execution and auto-loaded pipeline execution.

Suggested order for `require("helpers")` from `/lua/main.lua`:

```text
<same folder as current script>/helpers.lua
<same folder as current script>/helpers/init.lua
/lua/helpers.lua
/lua/helpers/init.lua
/lib/helpers.lua
/lib/helpers/init.lua
/.textforge/automation/lua/helpers.lua
/.textforge/automation/lua/helpers/init.lua
```

All reads come from workspace storage, not from local disk.

Do not treat every required Lua module as an auto-load action. A library module may be executable as Lua code when required by an explicitly run script or an auto-loaded action, but it must not be independently registered as a pipeline unless it lives in the auto-load area and returns a valid action descriptor.

### 13.7 Optional `tf.workspace` module

Expose a small safe module:

```lua
local workspace = require("tf.workspace")

local files = workspace.list()
local text = workspace.read_text("/models/main.itm")
return workspace.emit_text("Generated", "text.markdown", "# result")
```

Initial implementation may be read-only plus generated-output return. Avoid arbitrary write APIs until the review model is defined.

If write APIs are later added, they should produce proposed workspace patches or generated files through the TextForge workspace manager, not direct silent mutation from inside Lua.

---

## 14. Bundled resources as a read-only workspace folder

### 14.1 Remove the separate Resource Browser concept

The Resource Browser is no longer needed once TextForge has a real workspace tree. Do not keep two parallel ways to browse files.

Replace this pattern:

```text
Resource Browser popup -> resource catalogue -> Open/View resource
```

with this pattern:

```text
Workspace explorer -> /.textforge/resources/... -> Open/View/Copy resource
```

The current resource catalogue should become a provider for virtual read-only workspace entries. The catalogue already contains documentation, examples, Lua samples, ITM examples, Markdown examples, and the README. Use those paths and language IDs to populate the virtual resources folder.

### 14.2 Recommended virtual path layout

Use a reserved path such as:

```text
/.textforge/resources/
  README.md
  docs/
    user-manual.md
    manual-test-plan.md
    indented_text_model_format.md
    lua-scripting-tutorial.md
  examples/
    Party.itm
    shared-party-supplies.itm
    lua/
      markdown-headings-to-itm.lua
    markdown/
      diagrams-and-math.md
```

The exact resource paths can mirror the existing `TextForgeResource.path` values.

### 14.3 Resource entry rules

Resource entries should be:

```text
readOnly: true
system: true
virtual: true
origin: bundled-resource
```

Allowed actions:

```text
View
View with...
Open read-only preview, if implemented
Copy to editable workspace location
Export selected resource file or folder, if explicitly requested
```

Disallowed actions:

```text
Edit in place
Rename
Move
Delete
Overwrite during import
Use as auto-load Lua pipeline directly unless explicitly copied/promoted into the automation area
```

A bundled Lua example under resources remains inert. It is a sample file. It must not auto-register as a Lua pipeline simply because it exists in the resources folder.

### 14.4 Copy-to-edit behavior

When the user wants to edit a resource, create a copy outside the read-only resource folder.

Suggested behavior:

```text
User selects /.textforge/resources/docs/user-manual.md
User chooses Copy to editable workspace
Default target: /docs/user-manual.md
If conflict exists: /docs/user-manual (2).md
New file origin: resource-copy
New file readOnly: false
Open copied file in editor tab
```

For examples:

```text
/.textforge/resources/examples/Party.itm
  -> /examples/Party.itm
```

### 14.5 Resource visualization without editing

Resources should benefit from the same direct visualization pipeline mechanism as ordinary files.

Examples:

```text
Markdown resource -> Markdown viewer
ITM resource      -> ITM tree/mindmap/graph viewer
Lua resource      -> syntax/edit copy/manual run only after copied or explicitly opened as read-only; no auto-load
SVG resource      -> SVG viewer
```

The user should not need to open a resource into an editor tab just to view it.

---

## 15. Security enforcement updates

### 15.1 Update verification script

Expand `scripts/verify-security.mjs` to reject forbidden file-system APIs.

Add tokens/patterns such as:

```js
const forbiddenFileSystemTokens = [
  "showOpenFilePicker",
  "showSaveFilePicker",
  "showDirectoryPicker",
  "FileSystemFileHandle",
  "FileSystemDirectoryHandle",
  "FileSystemHandle",
  "getAsFileSystemHandle",
  "webkitGetAsEntry",
  "webkitdirectory",
  "chrome.fileSystem",
  "nativeMessaging"
];
```

Also scan built artifacts after build.

### 15.2 Approved gateway exceptions

The checker should allow ordinary browser file primitives only in approved gateway files:

```text
src/core/fileGateway.ts
src/core/zipGateway.ts
```

Allow there:

```text
File
FileReader
Blob
URL.createObjectURL
a.download
```

Do not allow there:

```text
File System Access API
Directory handles
Persistent handles
Native messaging
```

### 15.3 Tests for forbidden APIs

Add tests that fail if any forbidden API appears in source or built output.

The security test should include at least:

```text
- no showOpenFilePicker
- no showSaveFilePicker
- no showDirectoryPicker
- no FileSystemDirectoryHandle
- no FileSystemFileHandle
- no webkitdirectory
- no webkitGetAsEntry
- no getAsFileSystemHandle
- no chrome.fileSystem
- no nativeMessaging
- connect-src remains 'none'
- no fetch/XMLHttpRequest/WebSocket/EventSource/sendBeacon
- no remote URLs except package metadata if already allowed by current script
```

---

## 16. Implementation phases

### Phase 0 — Preparation

Goal: make the change safe and reviewable.

Tasks:

```text
- Create a feature branch.
- Run existing `npm run check` and record baseline.
- Add workspace-path unit tests first.
- Add security tests for forbidden filesystem APIs before implementing UI.
- Decide ZIP library and add dependency.
- Decide whether to use a new IndexedDB name or a destructive version bump.
```

Exit criteria:

```text
- Existing tests pass before feature work, or known unrelated failures are recorded.
- New security tests exist and pass before ZIP/file gateway code is added.
- The storage reset strategy is explicitly chosen.
```

### Phase 1 — Workspace data model and destructive storage reset

Tasks:

```text
- Add workspace types.
- Implement path normalization.
- Refactor WorkspaceManager to manage tree entries and openFileIds.
- Replace old TextDocument-centric state with workspace state.
- Replace old IndexedDB schema with new workspace schema.
- Create a default workspace on first run.
- Preserve current user-facing editing workflows under the new model.
```

Exit criteria:

```text
- The app starts from a clean default workspace.
- New workspace state persists and reloads.
- Opening, editing, renaming, closing, and reordering tabs works.
- Closing a tab no longer deletes the file.
- No legacy IndexedDB migration code remains.
```

### Phase 2 — Workspace explorer UI

Tasks:

```text
- Add left-side WorkspaceExplorer.
- Show root, folders, files, generated output, automation folders, and the read-only resources folder.
- Add create file/folder, rename, delete, open, view, view-with, copy-resource, and export file actions.
- Reflect active file selection.
- Remove the separate Resource Browser button/popup as the primary browsing mechanism.
- Update layout and CSS.
```

Exit criteria:

```text
- User can create folders and files.
- User can open editable files into tabs.
- User can directly view files without opening tabs.
- User can browse and view read-only bundled resources under `/.textforge/resources/`.
- User can copy a resource into an editable workspace location.
- User can close tabs without deleting files.
- User can delete a file and see dependent tab close.
```

### Phase 3 — File import/export and ZIP folder import/export

Tasks:

```text
- Implement fileGateway.
- Replace existing open/download code paths with fileGateway.
- Implement zipGateway.
- Add import files into selected folder.
- Add import ZIP into selected folder.
- Add export selected folder as ZIP.
- Add export root workspace as ZIP.
- Add import/export reports.
```

Exit criteria:

```text
- User can import several flat files into selected folder.
- User can import a ZIP with subfolders into selected folder.
- User can export any folder as ZIP.
- User can export root as whole workspace ZIP.
- ZIP path traversal tests pass.
```

### Phase 4 — Pipeline, viewer, and include integration

Tasks:

```text
- Add workspace context to ContributionContext.
- Update PipelineRunner and DiagnosticsService to pass workspace context.
- Allow pipelines/viewers to run against unopened workspace files.
- Add viewPipelineRouter or equivalent file action router.
- Update ITT/ITM include resolution to use workspace paths.
- Update Markdown asset resolution where practical.
- Ensure pipeline outputs create generated workspace files.
```

Exit criteria:

```text
- `%include` works for files not currently open.
- Relative include paths resolve from source file folder.
- Markdown/Mermaid/SVG/ITM files can be viewed directly from the workspace tree without opening editor tabs.
- Missing includes produce diagnostics with source path.
- Pipeline output appears as generated workspace file and opens as a tab or viewer according to file kind.
```

### Phase 5 — Lua workspace integration

Tasks:

```text
- Stop broad Lua action discovery across all open/workspace Lua files.
- Add the reserved auto-load root `/.textforge/automation/lua/`.
- Add UI commands to promote/copy/move selected Lua files into the auto-load root.
- Discover pipeline/action descriptors only from enabled `.lua` files under the auto-load root, including subfolders.
- Preserve explicit manual execution of the active Lua file from any workspace path.
- Add virtual require resolver for workspace Lua libraries.
- Optionally add `tf.workspace` read-only API.
- Ensure Lua still has no DOM/network/local filesystem access.
```

Exit criteria:

```text
- A Lua file outside `/.textforge/automation/lua/` is not auto-loaded.
- A Lua file outside the auto-load root can still be manually run when active.
- A Lua file promoted into `/.textforge/automation/lua/` can register as a pipeline/action.
- Auto-load discovery includes subfolders under the reserved root.
- Lua `require` can resolve virtual workspace libraries.
- Lua cannot access browser/local filesystem APIs.
```

### Phase 6 — Hardening, docs, and polish

Tasks:

```text
- Update README.
- Update security whitepaper link/reference if kept in repo.
- Add user manual section for workspace import/export.
- Add diagnostics for unsupported binary editing.
- Add performance limits for large ZIPs.
- Add final security verification.
```

Exit criteria:

```text
- `npm run check` passes.
- Security verifier fails on forbidden filesystem APIs.
- Manual smoke test covers import, edit, include, transform, export.
```

---

## 17. Acceptance tests

### 17.1 Workspace basics

```text
[ ] Starts with a clean default workspace when no new workspace state exists.
[ ] Can create `/docs` folder.
[ ] Can create `/docs/readme.md`.
[ ] Can open `/docs/readme.md` in a tab.
[ ] Can edit it and reload app with content preserved.
[ ] Can close tab while file remains in tree.
[ ] Can reopen file from tree.
[ ] Can rename file and preserve content/history identity.
[ ] Can delete file and close dependent tab.
[ ] Can browse `/.textforge/resources/` as a read-only virtual folder.
[ ] Can view a Markdown resource without opening it for editing.
[ ] Can copy a resource to an editable workspace folder.
[ ] Cannot edit, rename, move, or delete the original bundled resource.
[ ] Old IndexedDB workspace content is not required and may be absent after reset.
```

### 17.2 ZIP import/export

```text
[ ] Can import `project.zip` into root.
[ ] Can import `examples.zip` into `/examples`.
[ ] Subfolders are preserved.
[ ] Binary files round-trip unchanged.
[ ] Text files open correctly.
[ ] Export `/examples` produces ZIP rooted at selected folder contents.
[ ] Export `/` produces whole workspace ZIP.
[ ] Import rejects `../evil.txt`.
[ ] Import rejects `/absolute.txt`.
[ ] Import rejects `C:/temp/evil.txt`.
[ ] Import handles duplicate names deterministically.
```

### 17.3 ITM/ITT include resolution

```text
[ ] `/models/main.itm` can include `common.itm` from `/models/common.itm`.
[ ] `/models/main.itm` can include `../profiles/base.itm`.
[ ] Include works even if target file is not open in a tab.
[ ] Missing include produces a diagnostic.
[ ] Include cannot escape root.
```

### 17.4 Lua

```text
[ ] Lua script in `/lua/main.lua` can run manually when active.
[ ] Lua script can require `/lua/helpers.lua` through virtual resolver.
[ ] Lua file outside `/.textforge/automation/lua/` is not auto-loaded as a pipeline/action.
[ ] Lua file under `/.textforge/automation/lua/` can be discovered as a pipeline/action.
[ ] Lua auto-load discovery works in subfolders under `/.textforge/automation/lua/`.
[ ] User can promote/copy/move selected Lua files into the auto-load area.
[ ] Lua cannot access network or filesystem APIs.
```

### 17.5 Security

```text
[ ] Source scan rejects File System Access API.
[ ] Source scan rejects directory handle APIs.
[ ] Source scan rejects `webkitdirectory`.
[ ] Build scan rejects forbidden filesystem APIs in bundled output.
[ ] Existing network/eval restrictions remain active.
[ ] CSP still keeps `connect-src 'none'` for local-only/extension profile.
```

### 17.6 Direct visualization

```text
[ ] Markdown file can be viewed from the workspace explorer without opening a tab.
[ ] Mermaid file can be viewed from the workspace explorer without opening a tab, if Mermaid pipeline is available.
[ ] SVG file can be viewed from the workspace explorer without opening a tab.
[ ] ITM file can be sent directly to ITM tree/mindmap/graph pipeline without opening a tab.
[ ] Viewer popup remains refreshable when source file is not open.
[ ] Viewer popup reports stale source if the source file is deleted.
[ ] Read-only resource files use the same view pipeline routing as ordinary files.
```

---

## 18. Manual smoke test scenario

Use this after implementation:

```text
1. Start TextForge after clearing site data or using the new database schema.
2. Confirm a clean default workspace appears.
3. Confirm `/.textforge/resources/` exists and contains bundled docs/examples.
4. View `/.textforge/resources/docs/user-manual.md` without opening it for editing.
5. Copy one resource example into `/examples` and confirm the copy is editable.
6. Confirm the original resource remains read-only.
7. Create folders `/models`, `/models/common`, `/lua`, `/assets`, and `/.textforge/automation/lua/transforms`.
8. Create `/models/main.itm` with an include of `common/types.itm`.
9. Create `/models/common/types.itm`.
10. Open only `/models/main.itm` and run the ITM/ITT viewer pipeline.
11. Confirm include resolves even though `types.itm` is not open.
12. Close `/models/main.itm` and run a viewer pipeline directly from the workspace tree.
13. Create or import Markdown, Mermaid, SVG, and image files.
14. Confirm each can be viewed directly without opening an editor tab.
15. Create `/lua/helpers.lua` and `/lua/main.lua`.
16. Confirm `/lua/main.lua` is not auto-loaded as a pipeline/action.
17. Run `/lua/main.lua` manually using workspace require resolution.
18. Promote or copy a valid Lua action into `/.textforge/automation/lua/transforms/uppercase-itm.lua`.
19. Reload Lua automation and confirm the action appears as a pipeline.
20. Import a ZIP into `/assets/imported`.
21. Export `/assets` as ZIP.
22. Reload the app.
23. Confirm workspace tree, open tabs, viewed files, edited content, generated files, resources folder, and Lua automation settings persist.
24. Run `npm run check`.
```

---

## 19. Non-goals for the first implementation

Do not implement these in the first pass unless explicitly requested:

```text
- backwards compatibility with old IndexedDB workspace data;
- migration from the current `TextDocument[]` persistence shape;
- live synchronization with a local folder;
- File System Access API;
- directory handles;
- persistent file handles;
- automatic background export to local disk;
- cloud synchronization;
- remote package repositories;
- collaborative editing;
- arbitrary plugin write access to workspace files;
- full binary editor framework;
- Git integration;
- OPFS migration.
```

All of those may be future profiles or features, but they are outside the secure workspace MVP.

---

## 20. Documentation updates required

Update README and bundled docs to explain:

```text
- TextForge now has an application-private workspace.
- The workspace includes a read-only bundled resources folder.
- Files can be opened for editing or viewed directly through suitable pipelines.
- The workspace uses a new pre-alpha storage schema; old browser-stored sessions are not preserved.
- Files imported into the workspace are copies, not live references to local files.
- TextForge cannot silently modify local files.
- Export/download is explicit.
- Folders are imported/exported as ZIP archives.
- Closing a tab does not delete the file.
- Deleting a workspace file removes it from TextForge's private workspace only.
- IndexedDB stores the workspace locally in the browser profile.
- Clearing site data/browser storage may delete the workspace.
```

Suggested README wording:

```text
TextForge maintains an application-private workspace in IndexedDB. You can import files or ZIP archives, organize them in virtual folders, open selected text files in editor tabs, view suitable files directly through visualization pipelines, browse bundled read-only resources, and export individual files, selected folders, or the whole workspace. The workspace is not a live local filesystem folder: TextForge does not use File System Access API, directory handles, or persistent local file handles.

TextForge is pre-alpha. Workspace storage schema changes may reset browser-stored sessions.
```

---

## 21. Definition of done

The workspace feature is complete when:

```text
[ ] The app has a persistent IndexedDB-backed virtual workspace tree.
[ ] Open editor tabs are views over workspace text files.
[ ] Files can exist in the workspace without being open.
[ ] Files can be visualized directly without opening editor tabs.
[ ] Virtual folders are supported.
[ ] Bundled resources appear under a read-only virtual workspace folder.
[ ] The separate Resource Browser is no longer needed as a user-facing browsing surface.
[ ] File import works through explicit file selection and controlled drag/drop.
[ ] ZIP import can import a folder subtree into a selected workspace folder.
[ ] ZIP export can export any selected folder subtree.
[ ] ZIP export can export the root as the whole workspace.
[ ] File System Access API and directory handles are not used anywhere.
[ ] Security verification rejects forbidden filesystem APIs.
[ ] Old IndexedDB workspace contents are not required to survive.
[ ] ITM/ITT includes resolve from workspace paths, not only open tabs.
[ ] Pipeline outputs create generated workspace files.
[ ] Viewer popups can bind to unopened workspace source files.
[ ] Lua scripts can use workspace-local libraries without filesystem access.
[ ] Lua auto-load is limited to `/.textforge/automation/lua/**/*.lua`, including subfolders.
[ ] README and user-facing docs describe the workspace boundary accurately.
[ ] `npm run check` passes.
```

---

## 22. Implementation guidance for the coding agent

Follow these instructions strictly:

1. Treat this as a breaking pre-alpha architecture update.
2. Do not preserve or migrate the current IndexedDB workspace contents.
3. Keep IndexedDB as the canonical persistence layer for workspace state and content.
4. Replace the current open-document-centered state with a canonical workspace tree.
5. Make open editor tabs views over workspace text files.
6. Do not introduce File System Access API, directory handles, persistent handles, native filesystem bridges, or browser-specific directory traversal APIs.
7. Put all approved file ingress/egress code in `fileGateway` and `zipGateway` modules.
8. Put all path normalization and validation in `workspacePaths`.
9. Put all tree mutation logic in `WorkspaceManager`; UI components should call manager methods, not mutate workspace state directly.
10. Resolve includes and related files through workspace paths.
11. Replace the separate Resource Browser with a read-only virtual resources folder in the workspace.
12. Allow suitable files to be viewed through pipelines without opening editor tabs.
13. Use diagnostics for missing references, unsupported binary editing, ZIP import skips, path conflicts, and security-relevant rejections.
14. Add tests before or alongside implementation.
15. Keep the security checker updated so future regressions fail automatically.

The guiding principle is simple:

```text
TextForge becomes a local project workbench, not a local filesystem client.
```
