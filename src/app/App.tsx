import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  Bug,
  Download,
  FilePlus2,
  FolderOpen,
  GitBranch,
  ListChecks,
  PanelTopOpen,
  Puzzle,
  RefreshCw,
  X
} from "lucide-preact";
import { DiagnosticsService } from "../core/diagnosticsService";
import { LanguageRegistry, registerBaseLanguages } from "../core/languageRegistry";
import { PipelineRunner } from "../core/pipelineRunner";
import { createDiagnosticsPopup, createToolPopup, createViewerPopup } from "../core/popupFactory";
import { PluginRegistry } from "../core/pluginRegistry";
import { RuntimeLoader } from "../core/runtimeLoader";
import { TextForgeStorage } from "../core/storage";
import { WorkspaceManager } from "../core/workspaceManager";
import type { PipelineTraceStep, PopupRecord, TextDocument } from "../domain/types";
import { pluginManifest } from "../plugins/manifest";
import { CodeEditor } from "../components/CodeEditor";
import { PopupHost } from "../components/PopupHost";

interface AppServices {
  languages: LanguageRegistry;
  workspace: WorkspaceManager;
  runtime: RuntimeLoader;
  plugins: PluginRegistry;
  pipelines: PipelineRunner;
  diagnostics: DiagnosticsService;
  storage: TextForgeStorage;
}

export function App() {
  const services = useMemo<AppServices>(() => {
    const languages = new LanguageRegistry();
    registerBaseLanguages(languages);
    const runtime = new RuntimeLoader();
    const plugins = new PluginRegistry(languages);
    plugins.registerManifest(pluginManifest);
    return {
      languages,
      runtime,
      plugins,
      workspace: new WorkspaceManager(),
      pipelines: new PipelineRunner(plugins, runtime),
      diagnostics: new DiagnosticsService(plugins, runtime),
      storage: new TextForgeStorage()
    };
  }, []);

  const [workspace, setWorkspace] = useState(services.workspace.snapshot());
  const [popups, setPopups] = useState<PopupRecord[]>([]);
  const [status, setStatus] = useState("Starting TextForge.");
  const [lastTrace, setLastTrace] = useState<PipelineTraceStep[]>([]);
  const [ready, setReady] = useState(false);
  const popupsRef = useRef(popups);
  popupsRef.current = popups;

  useEffect(() => {
    let cancelled = false;
    services.storage
      .init()
      .then(() => services.storage.loadWorkspace())
      .then((stored) => {
        if (cancelled) {
          return;
        }
        if (stored?.documents?.length) {
          services.workspace.restore(stored.documents, stored.activeDocumentId || undefined);
        } else {
          services.workspace.openDocument({
            fileName: "untitled.txt",
            languageId: "text.plain",
            text: "Welcome to TextForge.\n\nCreate or open a text document, choose a language, then run a viewer pipeline."
          });
        }
        setWorkspace(services.workspace.snapshot());
        setReady(true);
        setStatus("Ready.");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
    return () => {
      cancelled = true;
    };
  }, [services]);

  useEffect(() => {
    const staleFollowPopups = popups.filter((popup) => {
      if (!popup.followSource || !popup.documentId || popup.sourceVersion === undefined) {
        return false;
      }
      const document = workspace.documents.find((candidate) => candidate.id === popup.documentId);
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
  }, [workspace, popups]);

  const activeDocument = workspace.activeDocumentId
    ? workspace.documents.find((document) => document.id === workspace.activeDocumentId)
    : undefined;
  const pipelines = activeDocument ? services.plugins.listPipelinesForLanguage(activeDocument.languageId) : [];

  function commitWorkspace(nextStatus?: string): void {
    const snapshot = services.workspace.snapshot();
    setWorkspace(snapshot);
    if (nextStatus) {
      setStatus(nextStatus);
    }
    void services.storage.saveWorkspace(snapshot);
  }

  function newDocument(): void {
    services.workspace.openDocument({
      fileName: "untitled.txt",
      languageId: "text.plain",
      text: ""
    });
    commitWorkspace("New document opened.");
  }

  async function openFiles(files: FileList | null): Promise<void> {
    if (!files?.length) {
      return;
    }
    for (const file of Array.from(files)) {
      const text = await readFile(file);
      services.workspace.openDocument({
        fileName: file.name,
        languageId: services.languages.inferFromFileName(file.name),
        text
      });
    }
    commitWorkspace(`Opened ${files.length} file${files.length === 1 ? "" : "s"}.`);
  }

  function closeDocument(id: string): void {
    services.workspace.closeDocument(id);
    setPopups((items) => items.filter((popup) => popup.documentId !== id));
    if (!services.workspace.listDocuments().length) {
      services.workspace.openDocument({ fileName: "untitled.txt", languageId: "text.plain", text: "" });
    }
    commitWorkspace("Document closed.");
  }

  function switchDocument(id: string): void {
    services.workspace.switchDocument(id);
    commitWorkspace();
  }

  function updateText(text: string): void {
    if (!activeDocument) {
      return;
    }
    services.workspace.updateText(activeDocument.id, text);
    commitWorkspace(`Editing ${activeDocument.fileName}.`);
  }

  function updateLanguage(languageId: string): void {
    if (!activeDocument) {
      return;
    }
    services.workspace.updateLanguage(activeDocument.id, languageId);
    commitWorkspace(`Language changed to ${languageId}.`);
  }

  function downloadActiveDocument(): void {
    if (!activeDocument) {
      return;
    }
    const blob = new Blob([activeDocument.text], { type: services.languages.get(activeDocument.languageId)?.mediaType || "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeDocument.fileName || "untitled.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    services.workspace.markClean(activeDocument.id);
    commitWorkspace(`Downloaded ${activeDocument.fileName}.`);
  }

  async function runDiagnostics(): Promise<void> {
    if (!activeDocument) {
      return;
    }
    setStatus("Running diagnostics.");
    const diagnostics = await services.diagnostics.run(activeDocument);
    setPopups((items) => [...items, createDiagnosticsPopup(activeDocument, diagnostics)]);
    setStatus(`Diagnostics complete: ${diagnostics.length} result${diagnostics.length === 1 ? "" : "s"}.`);
  }

  async function runPipeline(pipelineId: string): Promise<void> {
    if (!activeDocument || !pipelineId) {
      return;
    }
    const pipeline = services.plugins.getPipeline(pipelineId);
    setStatus(`Running ${pipeline?.name || pipelineId}.`);
    const result = await services.pipelines.run(pipelineId, activeDocument);
    setLastTrace(result.trace);
    const viewerResult = result.viewerResult || result.editorResult;
    if (viewerResult) {
      const popup = createViewerPopup(activeDocument, viewerResult, {
        pipelineId,
        contributionId: result.trace[result.trace.length - 1]?.stepId,
        trace: result.trace
      });
      setPopups((items) => [...items, popup]);
      setStatus(`${pipeline?.name || pipelineId} opened.`);
      return;
    }
    setPopups((items) => [...items, createToolPopup("pipeline-trace", "Pipeline Trace", result.trace)]);
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
    const result = await services.pipelines.run(popup.pipelineId, document);
    const viewerResult = result.viewerResult || result.editorResult;
    setLastTrace(result.trace);
    if (!viewerResult) {
      setPopups((items) =>
        items.map((item) => (item.id === id ? { ...item, trace: result.trace, refreshedAt: new Date().toISOString() } : item))
      );
      return;
    }
    setPopups((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              title: viewerResult.title,
              result: viewerResult,
              trace: result.trace,
              sourceVersion: document.version,
              documentName: document.fileName,
              documentLanguageId: document.languageId,
              refreshedAt: new Date().toISOString()
            }
          : item
      )
    );
    setStatus(`Refreshed ${popup.title}.`);
  }

  function updatePopup(id: string, patch: Partial<PopupRecord>): void {
    setPopups((items) => items.map((popup) => (popup.id === id ? { ...popup, ...patch } : popup)));
  }

  function openPluginManager(): void {
    setPopups((items) => [...items, createToolPopup("plugin-manager", "Plugin Manager")]);
  }

  function openPipelineTrace(): void {
    setPopups((items) => [...items, createToolPopup("pipeline-trace", "Pipeline Trace", lastTrace)]);
  }

  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <PanelTopOpen size={20} />
          <strong>TextForge</strong>
        </div>
        <div class="toolbar">
          <button type="button" onClick={newDocument} disabled={!ready}>
            <FilePlus2 size={16} />
            New
          </button>
          <label class="file-button">
            <FolderOpen size={16} />
            Open
            <input type="file" multiple onChange={(event) => void openFiles(event.currentTarget.files)} />
          </label>
          <button type="button" onClick={downloadActiveDocument} disabled={!activeDocument}>
            <Download size={16} />
            Download
          </button>
          <button type="button" onClick={() => void runDiagnostics()} disabled={!activeDocument}>
            <Bug size={16} />
            Diagnostics
          </button>
          <button type="button" onClick={openPluginManager}>
            <Puzzle size={16} />
            Plugins
          </button>
          <button type="button" onClick={openPipelineTrace} disabled={!lastTrace.length}>
            <ListChecks size={16} />
            Trace
          </button>
        </div>
      </header>

      <nav class="document-tabs">
        {workspace.documents.map((document) => (
          <button
            type="button"
            class={document.id === workspace.activeDocumentId ? "active" : ""}
            onClick={() => switchDocument(document.id)}
            key={document.id}
            title={`${document.id} · ${document.languageId} · v${document.version}`}
          >
            <span>{document.dirty ? "• " : ""}{document.fileName}</span>
            <X
              size={14}
              onClick={(event) => {
                event.stopPropagation();
                closeDocument(document.id);
              }}
            />
          </button>
        ))}
      </nav>

      <section class="actionbar">
        <label>
          Language
          <select value={activeDocument?.languageId || "text.plain"} onChange={(event) => updateLanguage(event.currentTarget.value)} disabled={!activeDocument}>
            {services.languages.list().map((language) => (
              <option value={language.id} key={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
        <label class="pipeline-picker">
          Pipeline
          <select value="" onChange={(event) => void runPipeline(event.currentTarget.value)} disabled={!activeDocument || !pipelines.length}>
            <option value="">{pipelines.length ? "Choose action..." : "No actions"}</option>
            {pipelines.map((pipeline) => (
              <option value={pipeline.id} key={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </label>
        <span class="document-status">
          {activeDocument ? `${activeDocument.languageId} · v${activeDocument.version} · ${activeDocument.dirty ? "dirty" : "clean"}` : "No document"}
        </span>
        <button type="button" onClick={() => pipelines[0] && void runPipeline(pipelines[0].id)} disabled={!pipelines.length}>
          <GitBranch size={16} />
          Run default
        </button>
        <button type="button" onClick={() => popups.forEach((popup) => void refreshPopup(popup.id))} disabled={!popups.some((popup) => popup.kind === "viewer")}>
          <RefreshCw size={16} />
          Refresh viewers
        </button>
      </section>

      <main class="workspace">
        <section class="editor-pane">
          {activeDocument ? (
            <CodeEditor value={activeDocument.text} languageId={activeDocument.languageId} onChange={updateText} />
          ) : (
            <div class="empty-editor">No document open.</div>
          )}
        </section>
      </main>

      <footer class="statusbar">{status}</footer>

      <PopupHost
        popups={popups}
        documents={workspace.documents}
        pluginStates={services.plugins.listPluginStates()}
        onClose={(id) => setPopups((items) => items.filter((popup) => popup.id !== id))}
        onRefresh={(id) => void refreshPopup(id)}
        onUpdate={updatePopup}
      />
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsText(file);
  });
}
