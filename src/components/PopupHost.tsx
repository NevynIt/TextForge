import { Activity, ExternalLink, RefreshCw, Search, X, ZoomIn, ZoomOut } from "lucide-preact";
import type { PipelineTraceStep, PluginState, PopupRecord, TextDocument } from "../domain/types";
import { ViewerContent, viewerSnapshotHtml } from "./viewers";

interface PopupHostProps {
  popups: PopupRecord[];
  documents: TextDocument[];
  pluginStates: PluginState[];
  onClose: (id: string) => void;
  onRefresh: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PopupRecord>) => void;
}

export function PopupHost({ popups, documents, pluginStates, onClose, onRefresh, onUpdate }: PopupHostProps) {
  return (
    <div class="popup-layer">
      {popups.map((popup, index) => {
        const document = popup.documentId ? documents.find((candidate) => candidate.id === popup.documentId) : undefined;
        const stale = Boolean(document && popup.sourceVersion !== undefined && document.version > popup.sourceVersion);
        return (
          <section class="popup-window" style={{ transform: `translate(${index * 18}px, ${index * 18}px)` }} key={popup.id}>
            <header class="popup-header">
              <div>
                <strong>{popup.title}</strong>
                {popup.documentName ? (
                  <span>
                    Viewing: {popup.documentName} · {shortId(popup.documentId)} · v{popup.sourceVersion} ·{" "}
                    {popup.documentLanguageId} · {stale ? "stale" : "current"}
                  </span>
                ) : null}
              </div>
              <div class="popup-actions">
                {popup.kind === "viewer" ? (
                  <>
                    <button type="button" title="Refresh" onClick={() => onRefresh(popup.id)}>
                      <RefreshCw size={16} />
                    </button>
                    <label class="follow-toggle">
                      <input
                        type="checkbox"
                        checked={popup.followSource}
                        onChange={(event) => onUpdate(popup.id, { followSource: event.currentTarget.checked })}
                      />
                      Follow source
                    </label>
                    <button type="button" title="Detach" onClick={() => detachPopup(popup)}>
                      <ExternalLink size={16} />
                    </button>
                  </>
                ) : null}
                <button type="button" title="Close" onClick={() => onClose(popup.id)}>
                  <X size={16} />
                </button>
              </div>
            </header>
            {popup.kind === "viewer" ? (
              <div class="viewer-toolbar">
                <button type="button" title="Zoom out" onClick={() => onUpdate(popup.id, { zoom: Math.max(0.5, popup.zoom - 0.1) })}>
                  <ZoomOut size={16} />
                </button>
                <button type="button" title="Reset zoom" onClick={() => onUpdate(popup.id, { zoom: 1 })}>
                  {Math.round(popup.zoom * 100)}%
                </button>
                <button type="button" title="Zoom in" onClick={() => onUpdate(popup.id, { zoom: Math.min(2, popup.zoom + 0.1) })}>
                  <ZoomIn size={16} />
                </button>
                {popup.result?.capabilities?.search ? (
                  <label class="search-field">
                    <Search size={15} />
                    <input value={popup.query} placeholder="Search viewer" onInput={(event) => onUpdate(popup.id, { query: event.currentTarget.value })} />
                  </label>
                ) : null}
                {popup.refreshedAt ? <span>Refreshed {new Date(popup.refreshedAt).toLocaleTimeString()}</span> : null}
              </div>
            ) : null}
            <main class="popup-body">
              {popup.kind === "viewer" && popup.result ? <ViewerContent result={popup.result} query={popup.query} zoom={popup.zoom} /> : null}
              {popup.kind === "diagnostics" ? <DiagnosticsList diagnostics={popup.diagnostics || []} /> : null}
              {popup.kind === "plugin-manager" ? <PluginManagerList states={pluginStates} /> : null}
              {popup.kind === "pipeline-trace" ? <PipelineTrace trace={popup.trace || []} /> : null}
            </main>
          </section>
        );
      })}
    </div>
  );
}

function DiagnosticsList({ diagnostics }: { diagnostics: NonNullable<PopupRecord["diagnostics"]> }) {
  if (!diagnostics.length) {
    return <p class="empty-state">No diagnostics for this document.</p>;
  }
  return (
    <ul class="diagnostics-list">
      {diagnostics.map((diagnostic, index) => (
        <li class={`severity-${diagnostic.severity}`} key={diagnostic.id || index}>
          <strong>{diagnostic.severity}</strong>
          <span>{diagnostic.message}</span>
          <small>{diagnostic.source}</small>
        </li>
      ))}
    </ul>
  );
}

function PluginManagerList({ states }: { states: PluginState[] }) {
  return (
    <div class="plugin-list">
      {states.map((state) => (
        <article key={state.id}>
          <div>
            <strong>{state.name}</strong>
            <span>{state.id}</span>
          </div>
          <span class={`plugin-status ${state.status}`}>{state.status}</span>
          <small>{state.contributionIds.join(", ")}</small>
          {state.error ? <p>{state.error}</p> : null}
        </article>
      ))}
    </div>
  );
}

function PipelineTrace({ trace }: { trace: PipelineTraceStep[] }) {
  if (!trace.length) {
    return <p class="empty-state">No pipeline trace is available yet.</p>;
  }
  return (
    <ol class="trace-list">
      {trace.map((step) => (
        <li key={step.stepId}>
          <div>
            <Activity size={15} />
            <strong>{step.stepId}</strong>
            <span>{step.status}</span>
          </div>
          <small>
            {step.inputType}
            {step.outputType ? ` -> ${step.outputType}` : ""}
          </small>
          {step.message ? <p>{step.message}</p> : null}
          {step.serializedValue ? <pre>{step.serializedValue.slice(0, 1400)}</pre> : null}
        </li>
      ))}
    </ol>
  );
}

function shortId(id?: string): string {
  return id ? id.slice(0, 10) : "";
}

function detachPopup(popup: PopupRecord): void {
  if (!popup.result) {
    return;
  }
  const win = window.open("", "_blank", "width=980,height=720");
  if (!win) {
    return;
  }
  win.document.title = popup.title;
  win.document.body.innerHTML = `
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #fbfbf8; color: #202225; }
      header { padding: 12px 16px; border-bottom: 1px solid #d8d4c8; background: #f0eee7; }
      main { padding: 16px; overflow: auto; }
      svg { max-width: 100%; height: auto; }
      pre { white-space: pre-wrap; }
    </style>
    <header><strong>${popup.title}</strong><br><span>${popup.documentName || ""} v${popup.sourceVersion || ""}</span></header>
    <main>${viewerSnapshotHtml(popup.result)}</main>
  `;
}
