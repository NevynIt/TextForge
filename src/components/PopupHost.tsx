import type { JSX } from "preact";
import { Activity, Download, ExternalLink, RefreshCw, RotateCcw, Search, Settings, X, ZoomIn, ZoomOut } from "lucide-preact";
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
        const frame = popupFrame(popup, index);
        return (
          <section class="popup-window" style={popupStyle(frame, index)} key={popup.id}>
            <header class="popup-header" onPointerDown={(event) => startPopupDrag(event, popup, frame, onUpdate)}>
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
                <WindowLayoutMenu popupId={popup.id} onUpdate={onUpdate} />
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
                  <>
                    <button type="button" title="Reset controls" onClick={() => onUpdate(popup.id, { settings: defaultSettingsFromControls(popup.result?.controls || []) })}>
                      <RotateCcw size={15} />
                    </button>
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
                  </>
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
            <div class="popup-resize-handle" title="Resize" onPointerDown={(event) => startPopupResize(event, popup, frame, onUpdate)} />
          </section>
        );
      })}
    </div>
  );
}

interface PopupFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_POPUP_WIDTH = 320;
const MIN_POPUP_HEIGHT = 260;

function popupStyle(frame: PopupFrame, index: number): JSX.CSSProperties {
  return {
    left: `${frame.x}px`,
    top: `${frame.y}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    zIndex: 20 + index
  };
}

function popupFrame(popup: PopupRecord, index: number): PopupFrame {
  const viewport = viewportSize();
  const width = clamp(finiteNumber(popup.width, popup.kind === "viewer" ? 920 : 760), MIN_POPUP_WIDTH, Math.max(MIN_POPUP_WIDTH, viewport.width - 16));
  const height = clamp(finiteNumber(popup.height, popup.kind === "viewer" ? 680 : 560), MIN_POPUP_HEIGHT, Math.max(MIN_POPUP_HEIGHT, viewport.height - 16));
  const fallbackX = viewport.width - width - 28 + index * 18;
  const fallbackY = 96 + index * 18;
  return {
    x: clamp(finiteNumber(popup.x, fallbackX), 8, Math.max(8, viewport.width - width - 8)),
    y: clamp(finiteNumber(popup.y, fallbackY), 8, Math.max(8, viewport.height - height - 8)),
    width,
    height
  };
}

function startPopupDrag(
  event: JSX.TargetedPointerEvent<HTMLElement>,
  popup: PopupRecord,
  frame: PopupFrame,
  onUpdate: PopupHostProps["onUpdate"]
): void {
  if (event.button !== 0 || isInteractiveTarget(event.target)) {
    return;
  }
  event.preventDefault();
  const startX = event.clientX;
  const startY = event.clientY;

  const move = (moveEvent: PointerEvent) => {
    const viewport = viewportSize();
    onUpdate(popup.id, {
      x: Math.round(clamp(frame.x + moveEvent.clientX - startX, 8, Math.max(8, viewport.width - frame.width - 8))),
      y: Math.round(clamp(frame.y + moveEvent.clientY - startY, 8, Math.max(8, viewport.height - frame.height - 8)))
    });
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function startPopupResize(
  event: JSX.TargetedPointerEvent<HTMLDivElement>,
  popup: PopupRecord,
  frame: PopupFrame,
  onUpdate: PopupHostProps["onUpdate"]
): void {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const startX = event.clientX;
  const startY = event.clientY;

  const move = (moveEvent: PointerEvent) => {
    const viewport = viewportSize();
    onUpdate(popup.id, {
      width: Math.round(clamp(frame.width + moveEvent.clientX - startX, MIN_POPUP_WIDTH, Math.max(MIN_POPUP_WIDTH, viewport.width - frame.x - 8))),
      height: Math.round(clamp(frame.height + moveEvent.clientY - startY, MIN_POPUP_HEIGHT, Math.max(MIN_POPUP_HEIGHT, viewport.height - frame.y - 8)))
    });
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("button,input,select,textarea,label,a,summary,.popup-actions"));
}

function defaultSettingsFromControls(controls: ViewerControlDefinition[]): Record<string, ViewerSettingValue> {
  return Object.fromEntries(controls.map((control) => [control.id, control.defaultValue]));
}

function viewportSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1200, height: 800 };
  }
  return { width: window.innerWidth || 1200, height: window.innerHeight || 800 };
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function WindowLayoutMenu({ popupId, onUpdate }: { popupId: string; onUpdate: PopupHostProps["onUpdate"] }) {
  return (
    <details class="window-layout-menu">
      <summary title="Window layout" aria-label="Window layout">
        <span class="quadrant-glyph quadrant-glyph-menu" />
      </summary>
      <div class="window-layout-panel" aria-label="Window layout controls">
        <button type="button" title="Maximize" aria-label="Maximize" onClick={() => onUpdate(popupId, layoutPatch("max"))}>
          <span class="quadrant-glyph quadrant-glyph-max" />
        </button>
        <button type="button" title="Top left" aria-label="Top left" onClick={() => onUpdate(popupId, layoutPatch("top-left"))}>
          <span class="quadrant-glyph quadrant-glyph-top-left" />
        </button>
        <button type="button" title="Top right" aria-label="Top right" onClick={() => onUpdate(popupId, layoutPatch("top-right"))}>
          <span class="quadrant-glyph quadrant-glyph-top-right" />
        </button>
        <button type="button" title="Bottom left" aria-label="Bottom left" onClick={() => onUpdate(popupId, layoutPatch("bottom-left"))}>
          <span class="quadrant-glyph quadrant-glyph-bottom-left" />
        </button>
        <button type="button" title="Bottom right" aria-label="Bottom right" onClick={() => onUpdate(popupId, layoutPatch("bottom-right"))}>
          <span class="quadrant-glyph quadrant-glyph-bottom-right" />
        </button>
      </div>
    </details>
  );
}

function layoutPatch(layout: "max" | "top-left" | "top-right" | "bottom-left" | "bottom-right"): Partial<PopupRecord> {
  const viewport = viewportSize();
  const gap = 8;
  if (layout === "max") {
    return { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height - gap * 2 };
  }
  const width = Math.floor((viewport.width - gap * 3) / 2);
  const height = Math.floor((viewport.height - gap * 3) / 2);
  const left = layout.endsWith("left") ? gap : gap * 2 + width;
  const top = layout.startsWith("top") ? gap : gap * 2 + height;
  return { x: left, y: top, width, height };
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
  const payload = exportPayload(popup.result);
  const blob = new Blob([payload.content], { type: payload.type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${popup.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "textforge-view"}.${payload.extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportPayload(result: NonNullable<PopupRecord["result"]>): { content: string; extension: string; type: string } {
  if (result.kind === "svg") {
    return { content: viewerSnapshotHtml(result), extension: "svg", type: "image/svg+xml" };
  }
  if (result.kind === "table") {
    const extension = result.table.delimiter === "\t" ? "tsv" : "csv";
    return { content: tableToDelimited(result.table.columns, result.table.rows, result.table.delimiter), extension, type: "text/plain" };
  }
  if (result.kind === "tree" || result.kind === "mindmap") {
    return { content: JSON.stringify(result.nodes, null, 2), extension: "json", type: "application/json" };
  }
  if (result.kind === "graph") {
    return { content: JSON.stringify(result.graph, null, 2), extension: "json", type: "application/json" };
  }
  return {
    content: `<!doctype html><meta charset="utf-8">${viewerSnapshotHtml(result)}`,
    extension: "html",
    type: "text/html"
  };
}

function tableToDelimited(columns: string[], rows: string[][], delimiter: "," | "\t"): string {
  const lines = [columns, ...rows].map((row) => row.map((cell) => escapeDelimitedCell(cell, delimiter)).join(delimiter));
  return `${lines.join("\n")}\n`;
}

function escapeDelimitedCell(value: string, delimiter: "," | "\t"): string {
  if (!value.includes(delimiter) && !value.includes("\n") && !value.includes('"')) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}
