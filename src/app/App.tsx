import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ActionBar } from "../components/shell/ActionBar";
import { DocumentTabs } from "../components/shell/DocumentTabs";
import { TopBar } from "../components/shell/TopBar";
import { PopupHost } from "../components/PopupHost";
import { CodeEditor, type CodeEditorCommand } from "../components/CodeEditor";
import { WorkspaceExplorer } from "../components/workspace/WorkspaceExplorer";
import { createDiagnosticsPopup, createToolPopup, createViewerPopup } from "../core/popupFactory";
import { defaultPipelineIdForDocument } from "../core/viewPipelineRouter";
import { downloadBlob, downloadWorkspaceFile, fileListToWorkspaceImports } from "../core/fileGateway";
import type { Diagnostic, PipelineTraceStep, PipelineValue, PopupRecord, SourceRange, TextDocument, VisualSelection } from "../domain/types";
import type { WorkspaceEntry } from "../core/workspaceTypes";
import { exportWorkspaceFilesToZip, importZipToWorkspaceFiles } from "../core/zipGateway";
import { serializeItmPipelineValue } from "../viewers/itm/itmSerialization";
import { buildLuaActionsPlugin, type RegisteredLuaAction } from "../lua/luaScriptRegistry";
import type { LuaRunResult } from "../lua/types";
import { useAppServices } from "./useAppServices";

export function App() {
  const services = useAppServices();
  const [workspace, setWorkspace] = useState(services.workspace.snapshot());
  const [popups, setPopups] = useState<PopupRecord[]>([]);
  const [status, setStatus] = useState("Starting TextForge.");
  const [lastTrace, setLastTrace] = useState<PipelineTraceStep[]>([]);
  const [ready, setReady] = useState(false);
  const [pluginRevision, setPluginRevision] = useState(0);
  const [draggedTabId, setDraggedTabId] = useState("");
  const [renamingDocumentId, setRenamingDocumentId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [luaActions, setLuaActions] = useState<RegisteredLuaAction[]>([]);
  const [visualSelection, setVisualSelection] = useState<VisualSelection | undefined>();
  const [editorReveal, setEditorReveal] = useState<VisualSelection | undefined>();
  const [editorSelection, setEditorSelection] = useState<{ documentId: string; documentVersion: number; range: SourceRange; text: string } | undefined>();
  const [editorCommand, setEditorCommand] = useState<CodeEditorCommand | undefined>();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const popupsRef = useRef(popups);
  popupsRef.current = popups;

  const openDocuments = services.workspace.listDocuments();
  const allDocuments = services.workspace.listAllTextFileViews();
  const activeDocument = services.workspace.getActiveDocument();
  const activeEntry = workspace.selectedEntryId ? services.workspace.getEntry(workspace.selectedEntryId) : undefined;
  const selectedBinaryFile = activeEntry?.kind === "file" && activeEntry.fileKind === "binary" ? activeEntry : undefined;
  const pipelines = activeDocument ? services.plugins.listPipelinesForLanguage(activeDocument.languageId) : [];
  const pluginStates = useMemo(() => services.plugins.listPluginStates(), [services, pluginRevision]);
  const registeredPipelines = useMemo(() => services.plugins.listRegisteredPipelines(), [services, pluginRevision]);
  const pluginDiagnostics = useMemo(() => services.plugins.listPluginDiagnostics(), [services, pluginRevision]);
  const hasPluginAttention = pluginDiagnostics.some((diagnostic) => !diagnostic.acknowledged);

  useEffect(() => {
    let cancelled = false;
    services.storage
      .init()
      .then(async () => {
        const preferences = await services.storage.loadPluginPreferences();
        preferences.autoloadPluginIds.forEach((pluginId) => services.plugins.setAutoload(pluginId, true));
        services.plugins.applyPipelinePreferences(preferences.disabledPipelines || []);
        for (const pluginId of services.plugins.listAutoloadPluginIds()) {
          try {
            await services.plugins.loadPlugin(pluginId);
          } catch {
            // Load diagnostics are surfaced through plugin state.
          }
        }
        setPluginRevision((value) => value + 1);
        return services.storage.loadWorkspace();
      })
      .then((stored) => {
        if (cancelled) {
          return;
        }
        if (stored?.schemaVersion === 1) {
          services.workspace.restore(stored);
        } else {
          services.workspace.resetToDefaultWorkspace();
          const docsFolder = services.workspace.findByPath("/docs");
          if (docsFolder?.kind === "folder") {
            const file = services.workspace.createTextFile(
              docsFolder.id,
              "welcome.md",
              "# Welcome to TextForge\n\nThis workspace is private to the app. Create files, browse bundled resources under `/.textforge/resources`, and view documents directly from the tree.",
              "text.markdown"
            );
            services.workspace.openFile(file.id);
            services.workspace.selectEntry(file.id);
          }
        }
        const snapshot = services.workspace.snapshot();
        setWorkspace(snapshot);
        void services.storage.saveWorkspace(snapshot);
        setReady(true);
        setStatus("Ready.");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
    return () => {
      cancelled = true;
    };
  }, [services]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = window.setTimeout(() => {
      void buildLuaActionsPlugin(services.workspace.listAllTextFileViews(), services.lua)
        .then(({ plugin, actions }) => {
          services.plugins.replaceGeneratedPlugin(plugin);
          setLuaActions(actions);
          setPluginRevision((value) => value + 1);
        })
        .catch((error) => {
          setLuaActions([]);
          setStatus(error instanceof Error ? `Lua action scan failed: ${error.message}` : "Lua action scan failed.");
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    ready,
    services,
    allDocuments.map((document) => `${document.id}:${document.version}:${document.path || document.fileName}`).join("|")
  ]);

  useEffect(() => {
    const staleFollowPopups = popups.filter((popup) => {
      if (!popup.followSource || !popup.documentId || popup.sourceVersion === undefined) {
        return false;
      }
      const document = services.workspace.getDocument(popup.documentId);
      return Boolean(document && document.version > popup.sourceVersion);
    });
    if (!staleFollowPopups.length) {
      return;
    }
    const timer = window.setTimeout(() => {
      staleFollowPopups.forEach((popup) => {
        void refreshPopup(popup.id);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [workspace, popups, services]);

  function commitWorkspace(nextStatus?: string): void {
    const snapshot = services.workspace.snapshot();
    setWorkspace(snapshot);
    if (nextStatus) {
      setStatus(nextStatus);
    }
    void services.storage.saveWorkspace(snapshot);
  }

  async function persistPluginPreferences(): Promise<void> {
    const preferences = await services.storage.loadPluginPreferences();
    preferences.autoloadPluginIds = services.plugins.listAutoloadPluginIds();
    preferences.disabledPipelines = services.plugins
      .listRegisteredPipelines()
      .filter((record) => !record.enabled)
      .map((record) => ({
        pluginId: record.pluginId,
        pipelineId: record.pipeline.id,
        reason: record.disabledReason
      }));
    await services.storage.savePluginPreferences(preferences);
  }

  function selectedFolderId(): string {
    return services.workspace.resolveWritableFolderId(activeEntry?.id ?? workspace.selectedEntryId ?? workspace.activeFileId);
  }

  function newDocument(): void {
    const folderId = selectedFolderId();
    const file = services.workspace.createTextFile(folderId, "untitled.txt", "", "text.plain");
    services.workspace.openFile(file.id);
    services.workspace.selectEntry(file.id);
    commitWorkspace(`Created ${file.path}.`);
  }

  async function openFiles(files: FileList | null): Promise<void> {
    if (!files?.length) {
      return;
    }
    const folderId = selectedFolderId();
    const result = services.workspace.importFiles(folderId, await fileListToWorkspaceImports(files, services.languages.inferFromFileName));
    const importedPaths = result.imported.map((file) => file.path);
    const first = importedPaths[0] ? services.workspace.findByPath(importedPaths[0]) : undefined;
    if (first?.kind === "file") {
      services.workspace.openFile(first.id);
      services.workspace.selectEntry(first.id);
    }
    const skippedSuffix = result.skipped.length ? ` Skipped ${result.skipped.length}.` : "";
    commitWorkspace(`Imported ${result.imported.length} file${result.imported.length === 1 ? "" : "s"} into ${services.workspace.getFolder(folderId)?.path}.${skippedSuffix}`);
  }

  async function importZip(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) {
      return;
    }
    const folderId = selectedFolderId();
    const result = services.workspace.importFiles(
      folderId,
      await importZipToWorkspaceFiles(file, services.languages.inferFromFileName)
    );
    const first = result.imported[0];
    if (first) {
      services.workspace.selectEntry(first.id);
      if (first.fileKind === "text") {
        services.workspace.openFile(first.id);
      }
    }
    const skippedSuffix = result.skipped.length ? ` Skipped ${result.skipped.length}.` : "";
    commitWorkspace(`Imported ZIP into ${services.workspace.getFolder(folderId)?.path}.${skippedSuffix}`);
  }

  function closeDocument(id: string): void {
    services.workspace.closeDocument(id);
    setPopups((items) => items.filter((popup) => popup.documentId !== id));
    commitWorkspace("Closed editor tab.");
  }

  function switchDocument(id: string): void {
    services.workspace.switchDocument(id);
    services.workspace.selectEntry(id);
    commitWorkspace();
  }

  function reorderDocument(id: string, targetId?: string, position: "before" | "after" | "end" = "before"): void {
    services.workspace.reorderDocument(id, targetId, position);
    commitWorkspace();
  }

  function startRename(document: TextDocument): void {
    setRenamingDocumentId(document.id);
    setRenameDraft(document.fileName);
  }

  function finishRename(): void {
    if (!renamingDocumentId) {
      return;
    }
    services.workspace.updateFileName(renamingDocumentId, renameDraft.trim() || "untitled.txt");
    setRenamingDocumentId("");
    setRenameDraft("");
    commitWorkspace("Renamed workspace file.");
  }

  function cancelRename(): void {
    setRenamingDocumentId("");
    setRenameDraft("");
  }

  function updateText(text: string): void {
    if (!activeDocument) {
      return;
    }
    services.workspace.updateText(activeDocument.id, text);
    commitWorkspace(`Edited ${activeDocument.path || activeDocument.fileName}.`);
  }

  function updateLanguage(languageId: string): void {
    if (!activeDocument) {
      return;
    }
    services.workspace.updateLanguage(activeDocument.id, languageId);
    commitWorkspace(`Language changed for ${activeDocument.path || activeDocument.fileName}.`);
  }

  function updateEditorSelection(range: SourceRange, selectedText: string): void {
    if (!activeDocument) {
      return;
    }
    setEditorSelection({
      documentId: activeDocument.id,
      documentVersion: activeDocument.version,
      range,
      text: selectedText
    });
  }

  function selectSourceRange(documentId: string, range: SourceRange): void {
    const document = services.workspace.getDocument(documentId);
    if (!document) {
      return;
    }
    if (workspace.activeFileId !== documentId) {
      services.workspace.switchFile(documentId);
      commitWorkspace();
    }
    const nextSelection = {
      documentId,
      documentVersion: document.version,
      sourceRange: range,
      revision: (visualSelection?.revision || 0) + 1
    };
    setVisualSelection(nextSelection);
    setEditorReveal(nextSelection);
    setStatus(`Selected source in ${document.path || document.fileName}.`);
  }

  function clearHandledEditorReveal(revision?: number): void {
    setEditorReveal((current) => {
      if (!current) {
        return current;
      }
      if (revision !== undefined && current.revision !== revision) {
        return current;
      }
      return undefined;
    });
  }

  function downloadActiveDocument(): void {
    if (!activeDocument) {
      return;
    }
    const file = services.workspace.getFile(activeDocument.id);
    if (!file) {
      return;
    }
    downloadWorkspaceFile(file);
    services.workspace.exportFile(activeDocument.id);
    commitWorkspace(`Exported ${activeDocument.path || activeDocument.fileName}.`);
  }

  async function exportWorkspace(): Promise<void> {
    const files = services.workspace
      .collectSubtree(workspace.rootFolderId)
      .filter((entry): entry is Extract<WorkspaceEntry, { kind: "file" }> => entry.kind === "file");
    const zip = await exportWorkspaceFilesToZip(files);
    downloadBlob("textforge-workspace.zip", zip);
    commitWorkspace("Exported workspace ZIP.");
  }

  async function runDiagnostics(): Promise<void> {
    if (!activeDocument) {
      return;
    }
    setStatus("Running diagnostics.");
    const diagnostics = [
      ...(await services.diagnostics.run(activeDocument)),
      ...pluginDiagnostics.map((diagnostic, index): Diagnostic => ({
        id: diagnostic.id,
        source: diagnostic.source,
        severity: diagnostic.severity,
        message: diagnostic.message,
        languageId: activeDocument.languageId,
        documentId: activeDocument.id,
        documentVersion: activeDocument.version,
        contributionId: diagnostic.pluginId,
        pipelineId: diagnostic.pipelineId,
        line: index,
        column: 0
      }))
    ];
    upsertPopup(createDiagnosticsPopup(activeDocument, diagnostics), (popup) => popup.kind === "diagnostics");
    setStatus(`Diagnostics complete: ${diagnostics.length} result${diagnostics.length === 1 ? "" : "s"}.`);
  }

  async function runPipeline(pipelineId: string, document = activeDocument): Promise<void> {
    if (!document || !pipelineId) {
      return;
    }
    const pipeline = services.plugins.getPipeline(pipelineId);
    setStatus(`Running ${pipeline?.name || pipelineId}.`);
    const result = await services.pipelines.run(pipelineId, document);
    setLastTrace(result.trace);
    const viewerResult = result.viewerResult || result.editorResult;
    if (viewerResult) {
      setPopups((items) => [
        ...items,
        createViewerPopup(document, viewerResult, {
          pipelineId,
          contributionId: result.trace[result.trace.length - 1]?.stepId,
          trace: result.trace
        })
      ]);
      setStatus(`${pipeline?.name || pipelineId} opened.`);
      return;
    }
    const terminalStep = result.trace[result.trace.length - 1];
    if (result.status === "available" && result.value && terminalStep?.contributionKind === "transformer") {
      const output = openGeneratedValue(result.value, pipeline?.name || pipelineId);
      commitWorkspace(`${pipeline?.name || pipelineId} created ${output.path}.`);
      return;
    }
    upsertPopup(
      {
        ...createToolPopup("pipeline-trace", "Pipeline Trace", result.trace),
        documentId: document.id,
        documentName: document.fileName,
        documentLanguageId: document.languageId,
        documentIdentity: document.identity,
        sourceVersion: document.version
      },
      (popup) => popup.kind === "pipeline-trace"
    );
    setStatus(result.status === "available" ? "Pipeline complete." : `Pipeline ${result.status}.`);
  }

  async function refreshPopup(id: string): Promise<void> {
    const popup = popupsRef.current.find((candidate) => candidate.id === id);
    if (!popup?.pipelineId || !popup.documentId) {
      return;
    }
    const document = services.workspace.getDocument(popup.documentId);
    if (!document) {
      return;
    }
    await runPipeline(popup.pipelineId, document);
  }

  function updatePopup(id: string, patch: Partial<PopupRecord>): void {
    setPopups((items) => items.map((popup) => (popup.id === id ? { ...popup, ...patch } : popup)));
  }

  function upsertPopup(nextPopup: PopupRecord, matches: (popup: PopupRecord) => boolean): void {
    setPopups((items) => {
      const index = items.findIndex(matches);
      if (index < 0) {
        return [...items, nextPopup];
      }
      const current = items[index];
      const updated = {
        ...current,
        ...nextPopup,
        id: current.id,
        createdAt: current.createdAt,
        x: current.x,
        y: current.y,
        width: current.width,
        height: current.height,
        restoreFrame: current.restoreFrame
      };
      return [...items.slice(0, index), ...items.slice(index + 1), updated];
    });
  }

  async function togglePluginAutoload(pluginId: string, autoload: boolean): Promise<void> {
    services.plugins.setAutoload(pluginId, autoload);
    await persistPluginPreferences();
    setPluginRevision((value) => value + 1);
  }

  async function setPipelineEnabled(pluginId: string, pipelineId: string, enabled: boolean): Promise<void> {
    services.plugins.setPipelineEnabled(pluginId, pipelineId, enabled);
    await persistPluginPreferences();
    setPluginRevision((value) => value + 1);
  }

  function acknowledgePluginDiagnostic(id: string): void {
    services.plugins.acknowledgePluginDiagnostic(id);
    setPluginRevision((value) => value + 1);
  }

  function openPluginManager(): void {
    upsertPopup(createToolPopup("plugin-manager", "Plugin Manager"), (popup) => popup.kind === "plugin-manager");
  }

  function openPipelineTrace(): void {
    upsertPopup(
      activeDocument
        ? {
            ...createToolPopup("pipeline-trace", "Pipeline Trace", lastTrace),
            documentId: activeDocument.id,
            documentName: activeDocument.fileName,
            documentLanguageId: activeDocument.languageId,
            documentIdentity: activeDocument.identity,
            sourceVersion: activeDocument.version
          }
        : createToolPopup("pipeline-trace", "Pipeline Trace", lastTrace),
      (popup) => popup.kind === "pipeline-trace"
    );
  }

  function openLuaConsole(): void {
    upsertPopup(createToolPopup("lua-console", "Lua Console"), (popup) => popup.kind === "lua-console");
  }

  function openLuaScripts(): void {
    upsertPopup(createToolPopup("lua-scripts", "Lua Scripts"), (popup) => popup.kind === "lua-scripts");
  }

  function newLuaScript(): void {
    const folderId = selectedFolderId();
    const file = services.workspace.createTextFile(folderId, "transform.lua", luaActionBoilerplate, "text.lua");
    services.workspace.openFile(file.id);
    services.workspace.selectEntry(file.id);
    commitWorkspace(`Created ${file.path}.`);
  }

  async function runLuaConsoleCommand(source: string): Promise<LuaRunResult> {
    const input = activeDocument ? documentInput(activeDocument) : { kind: "text" as const, languageId: "text.plain", text: "" };
    const result = await services.lua.run({
      mode: "command",
      source,
      fileName: "console.lua",
      input,
      workspaceTextFiles: allDocuments,
      actions: luaActions
    });
    publishLuaDiagnostics(result, activeDocument);
    setStatus(result.ok ? "Lua command complete." : result.error || "Lua command failed.");
    return result;
  }

  async function runActiveLuaDocument(): Promise<LuaRunResult> {
    if (!activeDocument || activeDocument.languageId !== "text.lua") {
      return { ok: false, output: "", error: "Active document is not a Lua document." };
    }
    const result = await services.lua.run({
      mode: "script",
      source: activeDocument.text,
      fileName: activeDocument.path || activeDocument.fileName,
      input: documentInput(activeDocument),
      workspaceTextFiles: allDocuments,
      actions: luaActions
    });
    publishLuaDiagnostics(result, activeDocument);
    setStatus(result.ok ? `Ran ${activeDocument.path || activeDocument.fileName}.` : result.error || "Lua script failed.");
    return result;
  }

  async function runSelectedLuaText(): Promise<LuaRunResult> {
    if (!activeDocument || activeDocument.languageId !== "text.lua") {
      return { ok: false, output: "", error: "Active document is not a Lua document." };
    }
    if (
      !editorSelection ||
      editorSelection.documentId !== activeDocument.id ||
      editorSelection.documentVersion !== activeDocument.version ||
      !editorSelection.text.trim()
    ) {
      return { ok: false, output: "", error: "No Lua selection to run." };
    }
    const result = await services.lua.run({
      mode: "script",
      source: editorSelection.text,
      fileName: `${activeDocument.path || activeDocument.fileName} selection`,
      sourceOffset: {
        from: editorSelection.range.from,
        line: editorSelection.range.line,
        column: editorSelection.range.column
      },
      input: documentInput(activeDocument),
      workspaceTextFiles: allDocuments,
      actions: luaActions
    });
    publishLuaDiagnostics(result, activeDocument);
    setStatus(result.ok ? `Ran selection from ${activeDocument.path || activeDocument.fileName}.` : result.error || "Lua selection failed.");
    return result;
  }

  function publishLuaDiagnostics(result: LuaRunResult, document?: TextDocument): void {
    if (!result.diagnostics?.length || !document) {
      return;
    }
    const diagnostics = result.diagnostics.map((diagnostic, index): Diagnostic => ({
      ...diagnostic,
      id: diagnostic.id || `lua-runtime-${index}`,
      languageId: diagnostic.languageId || "text.lua",
      documentId: diagnostic.documentId || document.id,
      documentVersion: diagnostic.documentVersion || document.version,
      target: { ...(diagnostic.target || {}), documentId: diagnostic.documentId || document.id }
    }));
    upsertPopup(createDiagnosticsPopup(document, diagnostics), (popup) => popup.kind === "diagnostics" && popup.documentId === document.id);
  }

  function openGeneratedValue(value: PipelineValue, pipelineName: string): { path: string } {
    const folder = services.workspace.ensureFolder(`/generated/${safeGeneratedFolderName(pipelineName)}`, "generated");
    const document = pipelineValueToDocument(value);
    const created = services.workspace.createTextFile(
      folder.id,
      document.fileName || `generated.${extensionForLanguage(document.languageId)}`,
      document.text,
      document.languageId,
      { origin: "generated", dirty: false }
    );
    services.workspace.selectEntry(created.id);
    if (value.kind === "html") {
      setPopups((items) => [
        ...items,
        createViewerPopup(services.workspace.getDocument(created.id)!, { kind: "html", title: created.name, html: value.html })
      ]);
      return { path: created.path };
    }
    if (value.kind === "svg") {
      setPopups((items) => [
        ...items,
        createViewerPopup(
          services.workspace.getDocument(created.id)!,
          { kind: "svg", title: created.name, svg: value.svg, capabilities: { zoom: true, pan: true, search: true, export: true } }
        )
      ]);
      return { path: created.path };
    }
    services.workspace.openFile(created.id);
    return { path: created.path };
  }

  function openLuaResult(value: PipelineValue): void {
    const output = openGeneratedValue(value, "lua-result");
    commitWorkspace(`Created ${output.path} from Lua output.`);
  }

  function openTraceStepDocument(_popupId: string, step: PipelineTraceStep): void {
    if (!step.serializedValue) {
      return;
    }
    const document = services.workspace.openDocument({
      fileName: traceStepFileName(step, languageForTraceStep(step)),
      languageId: languageForTraceStep(step),
      text: step.serializedValue
    });
    commitWorkspace(`Opened ${step.stepId} as ${document.fileName}.`);
  }

  function handleSelectEntry(id: string): void {
    services.workspace.selectEntry(id);
    commitWorkspace();
  }

  function handleOpenEntry(id: string): void {
    services.workspace.openFile(id);
    services.workspace.selectEntry(id);
    commitWorkspace(`Opened ${services.workspace.getFile(id)?.path}.`);
  }

  function handleViewEntry(id: string): void {
    const document = services.workspace.getDocument(id);
    if (!document) {
      setStatus("Only text workspace files can be viewed in this build.");
      return;
    }
    void runPipeline(defaultPipelineIdForDocument(document), document);
  }

  function handleCreateFile(parentId: string): void {
    const name = window.prompt("New file name", "untitled.txt")?.trim();
    if (!name) {
      return;
    }
    const file = services.workspace.createTextFile(parentId, name, "", services.languages.inferFromFileName(name));
    services.workspace.openFile(file.id);
    services.workspace.selectEntry(file.id);
    commitWorkspace(`Created ${file.path}.`);
  }

  function handleCreateFolder(parentId: string): void {
    const name = window.prompt("New folder name", "folder")?.trim();
    if (!name) {
      return;
    }
    const folder = services.workspace.createFolder(parentId, name);
    services.workspace.selectEntry(folder.id);
    commitWorkspace(`Created ${folder.path}.`);
  }

  function handleCopyEntry(id: string): void {
    const entry = services.workspace.getEntry(id);
    if (!entry) {
      return;
    }
    const defaultTarget = entry.path.includes("/examples/") ? "/examples" : "/docs";
    const target = services.workspace.findByPath(defaultTarget);
    if (!target || target.kind !== "folder") {
      return;
    }
    const copied = services.workspace.copyEntry(id, target.id);
    if (copied) {
      services.workspace.selectEntry(copied.id);
      if (copied.kind === "file" && copied.fileKind === "text") {
        services.workspace.openFile(copied.id);
      }
      commitWorkspace(`Copied ${entry.path} to ${copied.path}.`);
    }
  }

  function handleDeleteEntry(id: string): void {
    const entry = services.workspace.getEntry(id);
    if (!entry || !entry.parentId || entry.readOnly || !window.confirm(`Delete ${entry.path}?`)) {
      return;
    }
    services.workspace.deleteEntry(id);
    setPopups((items) => items.filter((popup) => popup.documentId !== id));
    commitWorkspace(`Deleted ${entry.path}.`);
  }

  async function handleExportEntry(id: string): Promise<void> {
    const entry = services.workspace.getEntry(id);
    if (!entry) {
      return;
    }
    if (entry.kind === "file") {
      downloadWorkspaceFile(entry);
      services.workspace.exportFile(entry.id);
      commitWorkspace(`Exported ${entry.path}.`);
      return;
    }
    const files = services.workspace.collectSubtree(entry.id).filter((candidate): candidate is Extract<WorkspaceEntry, { kind: "file" }> => candidate.kind === "file");
    const zip = await exportWorkspaceFilesToZip(files, entry.path);
    downloadBlob(`${entry.name || "workspace"}.zip`, zip);
    commitWorkspace(`Exported ${entry.path} as ZIP.`);
  }

  function handlePromoteLua(id: string): void {
    const entry = services.workspace.getFile(id);
    if (!entry || entry.fileKind !== "text" || entry.languageId !== "text.lua") {
      return;
    }
    const targetFolder = services.workspace.ensureFolder("/.textforge/automation/lua", "created");
    const copied = services.workspace.copyEntry(id, targetFolder.id);
    if (!copied || copied.kind !== "file" || copied.fileKind !== "text") {
      return;
    }
    services.workspace.selectEntry(copied.id);
    services.workspace.openFile(copied.id);
    commitWorkspace(`Promoted ${entry.path} to ${copied.path}.`);
  }

  function openSvgArtifact(originPopupId: string, svg: string, title: string): void {
    const origin = popupsRef.current.find((popup) => popup.id === originPopupId);
    const document = origin?.documentId ? services.workspace.getDocument(origin.documentId) : activeDocument;
    if (!document) {
      return;
    }
    setPopups((items) => [
      ...items,
      createViewerPopup(
        document,
        {
          kind: "svg",
          title,
          svg,
          capabilities: { zoom: true, pan: true, search: true, export: true }
        },
        {
          pipelineId: origin?.pipelineId,
          contributionId: "markdown-embedded-artifact",
          trace: origin?.trace
        }
      )
    ]);
    setStatus(`Opened ${title}.`);
  }

  return (
    <div class="app-shell">
      <TopBar
        ready={ready}
        hasActiveDocument={Boolean(activeDocument)}
        hasDiagnosticsAttention={hasPluginAttention}
        hasPluginAttention={hasPluginAttention}
        hasTrace={Boolean(lastTrace.length)}
        sidebarVisible={sidebarVisible}
        onNewDocument={newDocument}
        onOpenFiles={(files) => void openFiles(files)}
        onImportZip={(files) => void importZip(files)}
        onDownload={downloadActiveDocument}
        onExportWorkspace={() => void exportWorkspace()}
        onRunDiagnostics={() => void runDiagnostics()}
        onOpenPluginManager={openPluginManager}
        onOpenTrace={openPipelineTrace}
        onOpenLuaConsole={openLuaConsole}
        onOpenLuaScripts={openLuaScripts}
        onToggleSidebar={() => setSidebarVisible((value) => !value)}
      />

      <DocumentTabs
        documents={openDocuments}
        activeDocumentId={workspace.activeFileId}
        draggedTabId={draggedTabId}
        onSetDraggedTabId={setDraggedTabId}
        onSwitchDocument={switchDocument}
        onReorderDocument={reorderDocument}
        onCloseDocument={closeDocument}
        onOpenFiles={(files) => void openFiles(files)}
        onNewDocument={newDocument}
      />

      <ActionBar
        activeDocument={activeDocument}
        languages={services.languages.list()}
        pipelines={pipelines}
        renamingDocumentId={renamingDocumentId}
        renameDraft={renameDraft}
        onRenameDraftChange={setRenameDraft}
        onFinishRename={finishRename}
        onCancelRename={cancelRename}
        onStartRename={startRename}
        onUpdateLanguage={updateLanguage}
        onRunPipeline={(pipelineId) => void runPipeline(pipelineId)}
        onSetEditorCommand={setEditorCommand}
      />

      <main class={`workspace${sidebarVisible ? "" : " sidebar-hidden"}`}>
        {sidebarVisible ? (
          <WorkspaceExplorer
            rootFolderId={workspace.rootFolderId}
            entries={Object.values(workspace.entries)}
            selectedEntryId={workspace.selectedEntryId}
            activeFileId={workspace.activeFileId}
            onSelectEntry={handleSelectEntry}
            onOpenEntry={handleOpenEntry}
            onViewEntry={handleViewEntry}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onCopyEntry={handleCopyEntry}
            onExportEntry={(id) => void handleExportEntry(id)}
            onPromoteLua={handlePromoteLua}
            onDeleteEntry={handleDeleteEntry}
          />
        ) : null}
        <section class="editor-pane">
          {selectedBinaryFile ? (
            <section class="file-metadata-panel">
              <header>
                <strong>{selectedBinaryFile.name}</strong>
                <span>{selectedBinaryFile.mediaType || "application/octet-stream"}</span>
              </header>
              <dl>
                <div>
                  <dt>Path</dt>
                  <dd>{selectedBinaryFile.path}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{formatFileSize(selectedBinaryFile.size)}</dd>
                </div>
                <div>
                  <dt>Origin</dt>
                  <dd>{selectedBinaryFile.origin}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(selectedBinaryFile.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
              <p>Binary files are stored in the workspace and can be exported, but no editor is available for this type yet.</p>
              <div class="file-metadata-actions">
                <button type="button" onClick={() => void handleExportEntry(selectedBinaryFile.id)}>
                  Download
                </button>
                <button type="button" onClick={() => handleSelectEntry(selectedBinaryFile.parentId)}>
                  Reveal Parent Folder
                </button>
              </div>
            </section>
          ) : activeDocument ? (
            <CodeEditor
              key={activeDocument.id}
              value={activeDocument.text}
              languageId={activeDocument.languageId}
              onChange={updateText}
              onRevealHandled={clearHandledEditorReveal}
              onSelectionChange={updateEditorSelection}
              onSelectSourceRange={(range) => selectSourceRange(activeDocument.id, range)}
              editorCommand={editorCommand}
              readOnly={Boolean(activeDocument.readOnly)}
              revealRange={
                editorReveal?.documentId === activeDocument.id && editorReveal.documentVersion === activeDocument.version
                  ? { ...editorReveal.sourceRange, revision: editorReveal.revision }
                  : null
              }
            />
          ) : (
            <div class="empty-editor">Select a file from the workspace tree or create a new one.</div>
          )}
        </section>
      </main>

      <footer class="statusbar">{status}</footer>

      <PopupHost
        popups={popups}
        documents={allDocuments}
        activeDocument={activeDocument}
        pluginStates={pluginStates}
        registeredPipelines={registeredPipelines}
        pluginDiagnostics={pluginDiagnostics}
        luaActions={luaActions}
        onTogglePluginAutoload={(pluginId, autoload) => void togglePluginAutoload(pluginId, autoload)}
        onSetPipelineEnabled={(pluginId, pipelineId, enabled) => void setPipelineEnabled(pluginId, pipelineId, enabled)}
        onAcknowledgePluginDiagnostic={acknowledgePluginDiagnostic}
        onRunLuaCommand={runLuaConsoleCommand}
        onRunActiveLuaDocument={runActiveLuaDocument}
        onRunSelectedLuaText={runSelectedLuaText}
        selectedLuaText={
          activeDocument?.languageId === "text.lua" &&
          editorSelection?.documentId === activeDocument.id &&
          editorSelection.documentVersion === activeDocument.version
            ? editorSelection.text
            : ""
        }
        onOpenLuaResult={openLuaResult}
        onNewLuaScript={newLuaScript}
        onOpenSvgArtifact={openSvgArtifact}
        sourceSelection={visualSelection}
        onSelectSourceRange={selectSourceRange}
        onClose={(id) => setPopups((items) => items.filter((popup) => popup.id !== id))}
        onRefresh={(id) => void refreshPopup(id)}
        onUpdate={updatePopup}
        onOpenTraceStep={openTraceStepDocument}
      />
    </div>
  );
}

function documentInput(document: TextDocument): PipelineValue {
  return {
    kind: "text",
    languageId: document.languageId,
    text: document.text,
    fileName: document.path || document.fileName,
    documentId: document.id
  };
}

function pipelineValueToDocument(value: PipelineValue): Partial<TextDocument> & Pick<TextDocument, "text" | "languageId"> {
  if (value.kind === "text") {
    return {
      fileName: value.fileName?.split("/").pop() || `lua-result.${extensionForLanguage(value.languageId)}`,
      languageId: value.languageId,
      text: value.text
    };
  }
  if (value.kind === "model") {
    if (value.modelType === "model.itm") {
      return {
        fileName: "lua-result.json",
        languageId: "text.json",
        text: serializeItmPipelineValue(value)
      };
    }
    return {
      fileName: "lua-result.json",
      languageId: "text.json",
      text: JSON.stringify(value.data, null, 2)
    };
  }
  if (value.kind === "html") {
    return { fileName: "lua-result.html", languageId: "text.xml", text: value.html };
  }
  return { fileName: "lua-result.svg", languageId: "text.xml", text: value.svg };
}

function languageForTraceStep(step: PipelineTraceStep): string {
  const type = step.outputType || step.inputType;
  if (type.startsWith("text.")) {
    return type;
  }
  if (type.startsWith("model.")) {
    return "text.json";
  }
  if (type === "svg" || type === "html") {
    return "text.xml";
  }
  return "text.plain";
}

function traceStepFileName(step: PipelineTraceStep, languageId: string): string {
  const base = `${step.stepId || "pipeline-step"}`.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "pipeline-step";
  return `${base}.${extensionForLanguage(languageId)}`;
}

function extensionForLanguage(languageId: string): string {
  if (languageId === "text.json") {
    return "json";
  }
  if (languageId === "text.xml") {
    return "xml";
  }
  if (languageId === "text.markdown") {
    return "md";
  }
  if (languageId === "text.csv") {
    return "csv";
  }
  if (languageId === "text.itm" || languageId === "text.indented-tree") {
    return "itm";
  }
  if (languageId === "text.javascript") {
    return "js";
  }
  if (languageId === "text.python") {
    return "py";
  }
  if (languageId === "text.lua") {
    return "lua";
  }
  return "txt";
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function safeGeneratedFolderName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "generated";
}


const luaActionBoilerplate = `local tree = require("tf.tree")

return {
  id = "uppercase-itm-labels",
  name = "Uppercase ITM labels",
  category = "Lua Transform",
  input = "text.itm",
  output = "text.itm",
  description = "Uppercases every ITM node label and emits ITM.",
  run = function(input)
    local nodes = input:parse_itm()
    tree.walk(nodes, function(node)
      node.label = string.upper(node.label)
    end)
    return input:emit_itm(nodes)
  end
}
`;
