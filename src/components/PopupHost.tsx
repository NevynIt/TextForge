import { Activity, Download, ExternalLink, RefreshCw, Search, Settings, X, ZoomIn, ZoomOut } from "lucide-preact";
import type { PipelineTraceStep, PluginState, PopupRecord, TextDocument, ViewerControlDefinition, ViewerSettingValue } from "../domain/types";
import { ViewerContent, viewerSnapshotHtml } from "./viewers";

interface PopupHostProps {
  popups: PopupRecord[];
  documents: TextDocument[];
  pluginStates: PluginState[];
  onLoadPlugin: (id: string) => void;
  onSetPluginAutoload: (id: string, autoload: boolean) => void;
  onClose: (id: string) => void;
  onRefresh: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PopupRecord>) => void;
}

export function PopupHost({ popups, documents, pluginStates, onLoadPlugin, onSetPluginAutoload, onClose, onRefresh, onUpdate }: PopupHostProps) {
  return (
    <div class="popup-layer">
      {popups.map((popup, index) => {
        const document = popup.documentId ? documents.find((candidate) => candidate.id === popup.documentId) : undefined;
        const stale = Boolean(document && popup.sourceVersion !== undefined && document.version > popup.sourceVersion);
        return (
          <section class="popup-window" style={{ transform: `translate(${index * 18}px, ${index * 18}px)` }} key={popup.id}>
            <header class="popup-header">
              <div>
                <strong>
                  {popup.documentIdentity ? (
                    <span class="document-badge" style={{ "--doc-color": popup.documentIdentity.color }}>
                      {popup.documentIdentity.badgeLabel}
                    </span>
                  ) : null}
                  {popup.title}
                </strong>
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
                    <button type="button" title="Open external snapshot window" onClick={() => detachPopup(popup)}>
                      <ExternalLink size={16} />
                    </button>
                    <button type="button" title="Export snapshot" onClick={() => exportPopup(popup)}>
                      <Download size={16} />
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
                {popup.result?.controls?.length ? (
                  <details class="viewer-settings">
                    <summary>
                      <Settings size={15} />
                      Controls
                    </summary>
                    <ViewerControls
                      controls={popup.result.controls}
                      settings={popup.settings}
                      onChange={(key, value) => onUpdate(popup.id, { settings: { ...popup.settings, [key]: value } })}
                    />
                  </details>
                ) : null}
                {popup.refreshedAt ? <span>Refreshed {new Date(popup.refreshedAt).toLocaleTimeString()}</span> : null}
              </div>
            ) : null}
            <main class="popup-body">
              {popup.kind === "viewer" && popup.result ? <ViewerContent result={popup.result} query={popup.query} zoom={popup.zoom} settings={popup.settings} /> : null}
              {popup.kind === "diagnostics" ? <DiagnosticsList diagnostics={popup.diagnostics || []} /> : null}
              {popup.kind === "plugin-manager" ? <PluginManagerList states={pluginStates} onLoad={onLoadPlugin} onSetAutoload={onSetPluginAutoload} /> : null}
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
          <small>
            {diagnostic.source}
            {diagnostic.pipelineStepId ? ` · ${diagnostic.pipelineStepId}` : ""}
            {diagnostic.documentId ? ` · ${diagnostic.documentId.slice(0, 10)}` : ""}
          </small>
        </li>
      ))}
    </ul>
  );
}

function PluginManagerList({
  states,
  onLoad,
  onSetAutoload
}: {
  states: PluginState[];
  onLoad: (id: string) => void;
  onSetAutoload: (id: string, autoload: boolean) => void;
}) {
  return (
    <div class="plugin-list">
      {states.map((state) => (
        <article key={state.id}>
          <div>
            <strong>{state.name}</strong>
            <span>{state.id}</span>
          </div>
          <span class={`plugin-status ${state.status}`}>{state.status}</span>
          <div class="plugin-actions">
            <button type="button" disabled={state.status === "loaded"} onClick={() => onLoad(state.id)}>
              Load now
            </button>
            <label>
              <input type="checkbox" checked={state.autoload} onChange={(event) => onSetAutoload(state.id, event.currentTarget.checked)} />
              Autoload
            </label>
          </div>
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
          {step.diagnostics?.length ? <p>{step.diagnostics.length} diagnostic{step.diagnostics.length === 1 ? "" : "s"} from this step.</p> : null}
          {step.message ? <p>{step.message}</p> : null}
          {step.serializedValue ? <pre>{step.serializedValue.slice(0, 1400)}</pre> : null}
        </li>
      ))}
    </ol>
  );
}

function ViewerControls({
  controls,
  settings,
  onChange
}: {
  controls: ViewerControlDefinition[];
  settings: Record<string, ViewerSettingValue>;
  onChange: (key: string, value: ViewerSettingValue) => void;
}) {
  const groups = groupControls(controls);
  return (
    <div class="viewer-control-panel">
      {Object.entries(groups).map(([group, items]) => (
        <fieldset key={group}>
          <legend>{group}</legend>
          {items.map((control) => {
            const value = settings[control.id] ?? control.defaultValue;
            if (control.type === "boolean") {
              return (
                <label key={control.id}>
                  <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(control.id, event.currentTarget.checked)} />
                  {control.label}
                </label>
              );
            }
            if (control.type === "select") {
              return (
                <label key={control.id}>
                  {control.label}
                  <select value={String(value ?? "")} onChange={(event) => onChange(control.id, event.currentTarget.value)}>
                    {(control.options || []).map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            if (control.type === "range" || control.type === "number") {
              return (
                <label key={control.id}>
                  {control.label}
                  <input
                    type={control.type === "range" ? "range" : "number"}
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={String(value ?? control.defaultValue)}
                    onInput={(event) => onChange(control.id, Number(event.currentTarget.value))}
                  />
                  <span>{String(value)}</span>
                </label>
              );
            }
            return (
              <label key={control.id}>
                {control.label}
                <input type="text" value={String(value || "")} onInput={(event) => onChange(control.id, event.currentTarget.value)} />
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}

function groupControls(controls: ViewerControlDefinition[]): Record<string, ViewerControlDefinition[]> {
  return controls.reduce<Record<string, ViewerControlDefinition[]>>((groups, control) => {
    const group = control.group || "Viewer";
    groups[group] = groups[group] || [];
    groups[group].push(control);
    return groups;
  }, {});
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
  const badge = popup.documentIdentity
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:22px;border-radius:999px;background:${popup.documentIdentity.color};color:#fff;font-size:12px;font-weight:750;margin-right:8px;">${popup.documentIdentity.badgeLabel}</span>`
    : "";
  win.document.body.innerHTML = `
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #fbfbf8; color: #202225; }
      header { padding: 12px 16px; border-bottom: 1px solid #d8d4c8; background: #f0eee7; }
      main { padding: 16px; overflow: auto; }
      svg { max-width: 100%; height: auto; }
      pre { white-space: pre-wrap; }
    </style>
    <header>${badge}<strong>${popup.title}</strong><br><span>External snapshot: ${popup.documentName || ""} v${popup.sourceVersion || ""}</span></header>
    <main>${viewerSnapshotHtml(popup.result)}</main>
  `;
}

function exportPopup(popup: PopupRecord): void {
  if (!popup.result) {
    return;
  }
  const extension = popup.result.kind === "svg" ? "svg" : "html";
  const content = extension === "svg" ? viewerSnapshotHtml(popup.result) : `<!doctype html><meta charset="utf-8">${viewerSnapshotHtml(popup.result)}`;
  const blob = new Blob([content], { type: extension === "svg" ? "image/svg+xml" : "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${popup.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "textforge-view"}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
