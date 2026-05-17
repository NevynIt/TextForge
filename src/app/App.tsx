import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  Bug,
  Download,
  FilePlus2,
  FolderOpen,
  Languages,
  ListChecks,
  PanelTopOpen,
  Puzzle,
  Workflow,
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
import type { PipelineTraceStep, PopupRecord, TextDocument, TextForgePlugin } from "../domain/types";
import { pluginManifest } from "../plugins/manifest";
import { CodeEditor } from "../components/CodeEditor";
import { DocumentBadge } from "../components/DocumentBadge";
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
  const [pluginRevision, setPluginRevision] = useState(0);
  const [draggedTabId, setDraggedTabId] = useState("");
  const [renamingDocumentId, setRenamingDocumentId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const popupsRef = useRef(popups);
  popupsRef.current = popups;

  useEffect(() => {
    let cancelled = false;
    services.storage
      .init()
      .then(async () => {
        const preferences = await services.storage.loadPluginPreferences();
        preferences.autoloadPluginIds.forEach((pluginId) => services.plugins.setAutoload(pluginId, true));
        for (const pluginId of services.plugins.listAutoloadPluginIds()) {
          try {
            await services.plugins.loadPlugin(pluginId);
          } catch {
            // The plugin manager displays the stored load error.
          }
        }
        setPluginRevision((value) => value + 1);
        return services.storage.loadWorkspace();
      })
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
  const pluginStates = useMemo(() => services.plugins.listPluginStates(), [services, pluginRevision]);

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

  function openTraceStepDocument(popupId: string, step: PipelineTraceStep): void {
    if (!step.serializedValue) {
      return;
    }
    const languageId = languageForTraceStep(step);
    const document = services.workspace.openDocument({
      fileName: traceStepFileName(step, languageId),
      languageId,
      text: step.serializedValue
    });
    setPopups((items) =>
      items.map((popup) =>
        popup.id === popupId
          ? {
              ...popup,
              trace: popup.trace?.map((candidate) =>
                candidate.stepId === step.stepId
                  ? { ...candidate, targetDocumentId: document.id, targetDocumentName: document.fileName }
                  : candidate
              )
            }
          : popup
      )
    );
    commitWorkspace(`Opened ${step.stepId} as ${document.fileName}.`);
  }

  function switchDocument(id: string): void {
    services.workspace.switchDocument(id);
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
    const nextName = renameDraft.trim();
    services.workspace.updateFileName(renamingDocumentId, nextName || "untitled.txt");
    setRenamingDocumentId("");
    setRenameDraft("");
    commitWorkspace("Document renamed.");
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
    upsertPopup(createDiagnosticsPopup(activeDocument, diagnostics), (popup) => popup.kind === "diagnostics");
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
    upsertPopup(
      {
        ...createToolPopup("pipeline-trace", "Pipeline Trace", result.trace),
        documentId: activeDocument.id,
        documentName: activeDocument.fileName,
        documentLanguageId: activeDocument.languageId,
        documentIdentity: activeDocument.identity,
        sourceVersion: activeDocument.version
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
              documentIdentity: document.identity,
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

  function openPluginManager(): void {
    upsertPopup(createToolPopup("plugin-manager", "Plugin Manager"), (popup) => popup.kind === "plugin-manager");
  }

  async function uploadCustomPlugin(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) {
      return;
    }
    try {
      const plugin = await importCustomPlugin(file);
      services.plugins.registerCustomPlugin(plugin);
      setPluginRevision((value) => value + 1);
      setStatus(`Loaded custom plugin ${plugin.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
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

      <nav
        class="document-tabs"
        onDragOver={(event) => {
          if (event.dataTransfer?.types.includes("Files") || event.dataTransfer?.types.includes("application/x-textforge-document-id")) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          const transfer = event.dataTransfer;
          const tabId = transfer?.getData("application/x-textforge-document-id") || draggedTabId;
          if (tabId) {
            reorderDocument(tabId, undefined, "end");
            setDraggedTabId("");
          } else if (transfer) {
            void openFiles(transfer.files);
          }
        }}
        onDblClick={(event) => {
          if (event.target === event.currentTarget) {
            newDocument();
          }
        }}
      >
        {workspace.documents.map((document) => (
          <button
            type="button"
            class={document.id === workspace.activeDocumentId ? "active" : ""}
            onClick={() => switchDocument(document.id)}
            key={document.id}
            draggable
            onDragStart={(event) => {
              setDraggedTabId(document.id);
              event.dataTransfer?.setData("application/x-textforge-document-id", document.id);
              event.dataTransfer?.setData("text/plain", document.fileName);
              if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "move";
              }
            }}
            onDragOver={(event) => {
              if (event.dataTransfer?.types.includes("application/x-textforge-document-id")) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(event) => {
              const sourceId = event.dataTransfer?.getData("application/x-textforge-document-id") || draggedTabId;
              if (!sourceId) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              reorderDocument(sourceId, document.id, event.clientX > rect.left + rect.width / 2 ? "after" : "before");
              setDraggedTabId("");
            }}
            onDragEnd={() => setDraggedTabId("")}
            title={`${document.id} - ${document.languageId} - v${document.version}`}
          >
            <DocumentBadge identity={document.identity} />
            <span>{document.dirty ? "* " : ""}{document.fileName}</span>
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
        {activeDocument ? (
          <div class="active-document-chip">
            <DocumentBadge identity={activeDocument.identity} />
            {renamingDocumentId === activeDocument.id ? (
              <input
                class="rename-input"
                value={renameDraft}
                autoFocus
                onInput={(event) => setRenameDraft(event.currentTarget.value)}
                onBlur={finishRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    finishRename();
                  } else if (event.key === "Escape") {
                    setRenamingDocumentId("");
                    setRenameDraft("");
                  }
                }}
              />
            ) : (
              <button type="button" class="document-title-button" title="Rename file" onClick={() => startRename(activeDocument)}>
                <strong>{activeDocument.fileName}</strong>
              </button>
            )}
          </div>
        ) : null}
        <label title="Language" aria-label="Language">
          <Languages size={16} />
          <select value={activeDocument?.languageId || "text.plain"} onChange={(event) => updateLanguage(event.currentTarget.value)} disabled={!activeDocument}>
            {services.languages.list().map((language) => (
              <option value={language.id} key={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
        <div class="pipeline-picker" title="Pipeline" aria-label="Pipeline">
          <Workflow size={16} />
          {pipelines.length === 1 ? (
            <button type="button" onClick={() => void runPipeline(pipelines[0].id)} disabled={!activeDocument}>
              {pipelines[0].name}
            </button>
          ) : (
            <select value="" onChange={(event) => void runPipeline(event.currentTarget.value)} disabled={!activeDocument || !pipelines.length}>
              <option value="">{pipelines.length ? "Choose action..." : "No actions"}</option>
              {pipelines.map((pipeline) => (
                <option value={pipeline.id} key={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <span class="document-status">
          {activeDocument ? `${activeDocument.languageId} - v${activeDocument.version} - ${activeDocument.dirty ? "dirty" : "clean"}` : "No document"}
        </span>
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
        pluginStates={pluginStates}
        onUploadPlugin={(files) => void uploadCustomPlugin(files)}
        onClose={(id) => setPopups((items) => items.filter((popup) => popup.id !== id))}
        onRefresh={(id) => void refreshPopup(id)}
        onUpdate={updatePopup}
        onOpenTraceStep={openTraceStepDocument}
      />
    </div>
  );
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
  if (looksLikeJson(step.serializedValue || "")) {
    return "text.json";
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
  if (languageId === "text.itt") {
    return "itt";
  }
  if (languageId === "text.javascript") {
    return "js";
  }
  if (languageId === "text.python") {
    return "py";
  }
  return "txt";
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

async function importCustomPlugin(file: File): Promise<TextForgePlugin> {
  const source = await file.text();
  const eventName = `textforge-plugin-${Math.random().toString(36).slice(2)}`;
  const wrappedSource = `(() => {
const registerTextForgePlugin = (plugin) => {
  document.dispatchEvent(new CustomEvent("${eventName}", { detail: plugin }));
};
${source}
})();`;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([wrappedSource], { type: "text/javascript" }));
    const script = document.createElement("script");
    let settled = false;
    const cleanup = () => {
      document.removeEventListener(eventName, onPlugin);
      script.remove();
      URL.revokeObjectURL(url);
    };
    const fail = (message: string) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const timer = window.setTimeout(() => fail("Custom plugin did not call registerTextForgePlugin(plugin)."), 1000);
    function onPlugin(event: Event): void {
      if (settled) {
        return;
      }
      const plugin = (event as CustomEvent).detail;
      if (!isTextForgePlugin(plugin)) {
        window.clearTimeout(timer);
        fail("Custom plugin must register a plugin object with id, name, and version.");
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve(plugin);
    }
    document.addEventListener(eventName, onPlugin);
    script.onerror = () => {
      window.clearTimeout(timer);
      fail("Custom plugin script failed to load.");
    };
    script.src = url;
    document.head.append(script);
  });
}

function isTextForgePlugin(value: unknown): value is TextForgePlugin {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<TextForgePlugin>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.version === "string";
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsText(file);
  });
}
