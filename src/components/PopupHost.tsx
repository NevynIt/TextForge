import type { JSX } from "preact";
import { useState } from "preact/hooks";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FilePlus2,
  Filter,
  FoldVertical,
  Focus,
  Check,
  CheckCheck,
  LocateFixed,
  Maximize2,
  Minimize2,
  Network,
  Palette,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Tag,
  Tags,
  UnfoldVertical,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-preact";
import type { PipelineTraceStep, PipelineValue, PluginState, PopupRecord, SourceRange, TextDocument, ViewerControlDefinition, ViewerSettingValue, VisualSelection } from "../domain/types";
import { serializeItmPipelineDocument } from "../viewers/itm/itmSerialization";
import type { RegisteredLuaAction } from "../lua/luaScriptRegistry";
import type { LuaRunResult } from "../lua/types";
import type { TextForgeResource } from "../resources/resourceCatalog";
import { DocumentBadge, documentBadgeSvgMarkup } from "./DocumentBadge";
import { LuaConsolePanel, LuaScriptManagerPanel } from "./LuaConsolePanel";
import { ResourceBrowserPanel } from "./ResourceBrowserPanel";
import { ViewerContent, viewerSnapshotHtml } from "./viewers";

interface PopupHostProps {
  popups: PopupRecord[];
  documents: TextDocument[];
  activeDocument?: TextDocument;
  pluginStates: PluginState[];
  luaActions: RegisteredLuaAction[];
  resources: TextForgeResource[];
  onRunLuaCommand: (source: string) => Promise<LuaRunResult>;
  onRunActiveLuaDocument: () => Promise<LuaRunResult>;
  onRunSelectedLuaText: () => Promise<LuaRunResult>;
  selectedLuaText?: string;
  onOpenLuaResult: (value: PipelineValue) => void;
  onNewLuaScript: () => void;
  onOpenResource: (resource: TextForgeResource) => void;
  onOpenSvgArtifact: (originPopupId: string, svg: string, title: string) => void;
  sourceSelection?: VisualSelection;
  onSelectSourceRange: (documentId: string, range: SourceRange) => void;
  onClose: (id: string) => void;
  onRefresh: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PopupRecord>) => void;
  onOpenTraceStep: (popupId: string, step: PipelineTraceStep) => void;
}

export function PopupHost({
  popups,
  documents,
  activeDocument,
  pluginStates,
  luaActions,
  resources,
  onRunLuaCommand,
  onRunActiveLuaDocument,
  onRunSelectedLuaText,
  selectedLuaText,
  onOpenLuaResult,
  onNewLuaScript,
  onOpenResource,
  onOpenSvgArtifact,
  sourceSelection,
  onSelectSourceRange,
  onClose,
  onRefresh,
  onUpdate,
  onOpenTraceStep
}: PopupHostProps) {
  return (
    <div class="popup-layer">
      {popups.map((popup, index) => {
        const document = popup.documentId ? documents.find((candidate) => candidate.id === popup.documentId) : undefined;
        const stale = Boolean(document && popup.sourceVersion !== undefined && document.version > popup.sourceVersion);
        const frame = popupFrame(popup, index);
        const remainingControls = popup.result ? remainingControlsForResult(popup.result) : [];
        return (
          <section class="popup-window" style={popupStyle(frame, index)} key={popup.id}>
            <header class="popup-header" onPointerDown={(event) => startPopupDrag(event, popup, frame, onUpdate)}>
              <div>
                <strong>
                  {popup.documentIdentity ? (
                    <DocumentBadge identity={popup.documentIdentity} />
                  ) : null}
                  {popup.title}
                </strong>
                {popup.documentName ? (
                  <span>
                    Viewing: {popup.documentName} - {shortId(popup.documentId)} - v{popup.sourceVersion} -{" "}
                    {popup.documentLanguageId} - {stale ? "stale" : "current"}
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
                    <button type="button" title={`Export snapshot as ${exportFileName(popup)}`} onClick={() => exportPopup(popup)}>
                      <Download size={16} />
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  title={popup.restoreFrame ? "Restore" : "Maximize"}
                  aria-label={popup.restoreFrame ? "Restore" : "Maximize"}
                  onClick={() => onUpdate(popup.id, maximizeRestorePatch(popup, frame))}
                >
                  {popup.restoreFrame ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <WindowQuadrantMenu popupId={popup.id} onUpdate={onUpdate} />
                <button type="button" title="Close" onClick={() => onClose(popup.id)}>
                  <X size={16} />
                </button>
              </div>
            </header>
            {popup.kind === "viewer" ? (
              <div class="viewer-toolbar">
                <button type="button" title="Zoom out" onClick={() => onUpdate(popup.id, { zoom: Math.max(0.2, popup.zoom - 0.1) })}>
                  <ZoomOut size={16} />
                </button>
                <button type="button" title="Reset zoom" onClick={() => onUpdate(popup.id, { zoom: 1 })}>
                  {Math.round(popup.zoom * 100)}%
                </button>
                <button type="button" title="Zoom in" onClick={() => onUpdate(popup.id, { zoom: Math.min(5, popup.zoom + 0.1) })}>
                  <ZoomIn size={16} />
                </button>
                {popup.result?.capabilities?.search ? (
                  <>
                    <label class="search-field">
                      <Search size={15} />
                      <input
                        value={popup.query}
                        placeholder="Search viewer"
                        onInput={(event) => onUpdate(popup.id, { query: event.currentTarget.value, searchCount: 0, searchIndex: -1 })}
                      />
                    </label>
                    <button
                      type="button"
                      title="Previous match"
                      disabled={!popup.query.trim() || !popup.searchCount}
                      onClick={() => onUpdate(popup.id, searchNavigationPatch(popup, "previous"))}
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      title="Next match"
                      disabled={!popup.query.trim() || !popup.searchCount}
                      onClick={() => onUpdate(popup.id, searchNavigationPatch(popup, "next"))}
                    >
                      <ChevronDown size={15} />
                    </button>
                    <span class="viewer-search-count">
                      {popup.query.trim() ? `${popup.searchCount ? (popup.searchIndex || 0) + 1 : 0} / ${popup.searchCount || 0}` : ""}
                    </span>
                  </>
                ) : null}
                {popup.result?.kind === "html" ? (
                  <>
                    <button type="button" title="Fold all headings" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "html-fold-all"))}>
                      <FoldVertical size={15} />
                    </button>
                    <button type="button" title="Unfold all headings" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "html-unfold-all"))}>
                      <UnfoldVertical size={15} />
                    </button>
                  </>
                ) : null}
                {popup.result?.kind === "tree" || popup.result?.kind === "itm-tree" ? (
                  <>
                    <button type="button" title="Fold all tree nodes" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "tree-fold-all"))}>
                      <FoldVertical size={15} />
                    </button>
                    <button type="button" title="Unfold all tree nodes" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "tree-unfold-all"))}>
                      <UnfoldVertical size={15} />
                    </button>
                    <button
                      type="button"
                      class={Boolean(popup.settings.inlineDetails) ? "active" : ""}
                      title="Show details in tree"
                      aria-pressed={Boolean(popup.settings.inlineDetails)}
                      onClick={() => onUpdate(popup.id, { settings: { ...popup.settings, inlineDetails: !Boolean(popup.settings.inlineDetails) } })}
                    >
                      <Settings size={15} />
                    </button>
                  </>
                ) : null}
                {(popup.result?.kind === "graph" || popup.result?.kind === "itm-graph") && popup.result.engine === "cytoscape" ? (
                  <button type="button" title="Run layout" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "graph-run-layout"))}>
                    <Network size={15} />
                  </button>
                ) : null}
                {popup.result?.kind === "svg" ? (
                  <button type="button" title="Fit SVG" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "svg-fit"))}>
                    <Focus size={15} />
                  </button>
                ) : null}
                {popup.result?.kind === "bpmn" ? (
                  <button type="button" title="Fit BPMN diagram" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "bpmn-fit"))}>
                    <Focus size={15} />
                  </button>
                ) : null}
                {popup.result?.kind === "mindmap" || popup.result?.kind === "itm-mindmap" ? (
                  <>
                    <button type="button" title="Fold all branches" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "mindmap-fold-all"))}>
                      <FoldVertical size={15} />
                    </button>
                    <button type="button" title="Unfold all branches" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "mindmap-unfold-all"))}>
                      <UnfoldVertical size={15} />
                    </button>
                    <button type="button" title="Center mind map" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "mindmap-center"))}>
                      <LocateFixed size={15} />
                    </button>
                    <button type="button" title="Fit mind map" onClick={() => onUpdate(popup.id, toolbarActionPatch(popup, "mindmap-fit"))}>
                      <Focus size={15} />
                    </button>
                  </>
                ) : null}
                {popup.result?.controls?.length ? (
                  <ViewerToolbarControls
                    result={popup.result}
                    settings={popup.settings}
                    onChange={(key, value) => onUpdate(popup.id, { settings: { ...popup.settings, [key]: value } })}
                  />
                ) : null}
                {remainingControls.length ? (
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
                        controls={remainingControls}
                        settings={popup.settings}
                        onChange={(key, value) => onUpdate(popup.id, { settings: { ...popup.settings, [key]: value } })}
                      />
                    </details>
                  </>
                ) : null}
                {popup.refreshedAt ? <span>Refreshed {new Date(popup.refreshedAt).toLocaleTimeString()}</span> : null}
              </div>
            ) : null}
            <main class={`popup-body${popup.kind === "resource-browser" ? " resource-browser-body" : ""}`}>
              {popup.kind === "viewer" && popup.result ? (
                <ViewerContent
                  result={popup.result}
                  query={popup.query}
                  zoom={popup.zoom}
                  settings={popup.settings}
                  searchCommand={
                    popup.searchRevision
                      ? { revision: popup.searchRevision, direction: popup.searchDirection || "next" }
                      : undefined
                  }
                  toolbarAction={
                    popup.toolbarActionRevision
                      ? { revision: popup.toolbarActionRevision, action: popup.toolbarAction || "" }
                      : undefined
                  }
                  onZoomChange={(zoom) => onUpdate(popup.id, { zoom })}
                  onOpenSvgArtifact={(svg, title) => onOpenSvgArtifact(popup.id, svg, title)}
                  sourceSelection={viewerSourceSelection(sourceSelection, popup)}
                  onSelectSourceRange={(range) => popup.documentId && onSelectSourceRange(popup.documentId, range)}
                  onSearchStateChange={(state) => {
                    if (popup.searchCount !== state.count || popup.searchIndex !== state.index) {
                      onUpdate(popup.id, { searchCount: state.count, searchIndex: state.index });
                    }
                  }}
                />
              ) : null}
              {popup.kind === "diagnostics" ? <DiagnosticsList popup={popup} onUpdate={onUpdate} /> : null}
              {popup.kind === "plugin-manager" ? <PluginManagerList states={pluginStates} /> : null}
              {popup.kind === "pipeline-trace" ? (
                <PipelineTrace
                  trace={popup.trace || []}
                  documents={documents}
                  onOpenStep={(step) => onOpenTraceStep(popup.id, step)}
                />
              ) : null}
              {popup.kind === "lua-console" ? (
                <LuaConsolePanel
                  activeDocument={activeDocument}
                  actions={luaActions}
                  onRunCommand={onRunLuaCommand}
                  onRunActiveDocument={onRunActiveLuaDocument}
                  onRunSelection={onRunSelectedLuaText}
                  selectedText={selectedLuaText}
                  onOpenResult={onOpenLuaResult}
                />
              ) : null}
              {popup.kind === "lua-scripts" ? (
                <LuaScriptManagerPanel documents={documents} actions={luaActions} onNewScript={onNewLuaScript} />
              ) : null}
              {popup.kind === "resource-browser" ? (
                <ResourceBrowserPanel resources={resources} onOpenResource={onOpenResource} />
              ) : null}
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
      y: Math.round(clamp(frame.y + moveEvent.clientY - startY, 8, Math.max(8, viewport.height - frame.height - 8))),
      restoreFrame: undefined
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
      height: Math.round(clamp(frame.height + moveEvent.clientY - startY, MIN_POPUP_HEIGHT, Math.max(MIN_POPUP_HEIGHT, viewport.height - frame.y - 8))),
      restoreFrame: undefined
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

function maximizeRestorePatch(popup: PopupRecord, frame: PopupFrame): Partial<PopupRecord> {
  if (popup.restoreFrame) {
    return { ...popup.restoreFrame, restoreFrame: undefined };
  }
  return { ...layoutPatch("max"), restoreFrame: frame };
}

function searchNavigationPatch(popup: PopupRecord, direction: "previous" | "next"): Partial<PopupRecord> {
  return {
    searchDirection: direction,
    searchRevision: (popup.searchRevision || 0) + 1
  };
}

function toolbarActionPatch(popup: PopupRecord, action: string): Partial<PopupRecord> {
  return {
    toolbarAction: action,
    toolbarActionRevision: (popup.toolbarActionRevision || 0) + 1
  };
}

function viewerSourceSelection(selection: VisualSelection | undefined, popup: PopupRecord): VisualSelection | undefined {
  if (!selection || selection.documentId !== popup.documentId || selection.documentVersion !== popup.sourceVersion) {
    return undefined;
  }
  return selection;
}

type WindowLayoutTarget = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom" | "left" | "right";

function WindowQuadrantMenu({ popupId, onUpdate }: { popupId: string; onUpdate: PopupHostProps["onUpdate"] }) {
  const [open, setOpen] = useState(false);
  function apply(layout: WindowLayoutTarget): void {
    onUpdate(popupId, layoutPatch(layout));
    setOpen(false);
  }

  return (
    <div
      class={`window-layout-menu ${open ? "open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusIn={() => setOpen(true)}
      onFocusOut={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button type="button" title="Window layout" aria-label="Window layout">
        <span class="quadrant-glyph quadrant-glyph-menu" />
      </button>
      <div class="window-layout-panel" aria-label="Window layout controls">
        <button type="button" title="Top left" aria-label="Top left" onClick={() => apply("top-left")}>
          <span class="quadrant-glyph quadrant-glyph-top-left" />
        </button>
        <button type="button" title="Top right" aria-label="Top right" onClick={() => apply("top-right")}>
          <span class="quadrant-glyph quadrant-glyph-top-right" />
        </button>
        <button type="button" title="Bottom left" aria-label="Bottom left" onClick={() => apply("bottom-left")}>
          <span class="quadrant-glyph quadrant-glyph-bottom-left" />
        </button>
        <button type="button" title="Bottom right" aria-label="Bottom right" onClick={() => apply("bottom-right")}>
          <span class="quadrant-glyph quadrant-glyph-bottom-right" />
        </button>
        <button type="button" title="Top left and right" aria-label="Top left and right" onClick={() => apply("top")}>
          <span class="quadrant-glyph quadrant-glyph-top" />
        </button>
        <button type="button" title="Bottom left and right" aria-label="Bottom left and right" onClick={() => apply("bottom")}>
          <span class="quadrant-glyph quadrant-glyph-bottom" />
        </button>
        <button type="button" title="Left top and bottom" aria-label="Left top and bottom" onClick={() => apply("left")}>
          <span class="quadrant-glyph quadrant-glyph-left" />
        </button>
        <button type="button" title="Right top and bottom" aria-label="Right top and bottom" onClick={() => apply("right")}>
          <span class="quadrant-glyph quadrant-glyph-right" />
        </button>
      </div>
    </div>
  );
}

function layoutPatch(layout: "max" | WindowLayoutTarget): Partial<PopupRecord> {
  const viewport = viewportSize();
  const gap = 8;
  if (layout === "max") {
    return { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height - gap * 2 };
  }
  if (layout === "top" || layout === "bottom") {
    const height = Math.floor((viewport.height - gap * 3) / 2);
    return { x: gap, y: layout === "top" ? gap : gap * 2 + height, width: viewport.width - gap * 2, height, restoreFrame: undefined };
  }
  if (layout === "left" || layout === "right") {
    const width = Math.floor((viewport.width - gap * 3) / 2);
    return { x: layout === "left" ? gap : gap * 2 + width, y: gap, width, height: viewport.height - gap * 2, restoreFrame: undefined };
  }
  const width = Math.floor((viewport.width - gap * 3) / 2);
  const height = Math.floor((viewport.height - gap * 3) / 2);
  const left = layout.endsWith("left") ? gap : gap * 2 + width;
  const top = layout.startsWith("top") ? gap : gap * 2 + height;
  return { x: left, y: top, width, height, restoreFrame: undefined };
}

function ViewerToolbarControls({
  result,
  settings,
  onChange
}: {
  result: NonNullable<PopupRecord["result"]>;
  settings: Record<string, ViewerSettingValue>;
  onChange: (key: string, value: ViewerSettingValue) => void;
}) {
  const controls = toolbarControlsForResult(result);
  if (!controls.length) {
    return null;
  }
  return (
    <div class="viewer-toolbar-controls">
      {controls.map((control) => {
        const value = settings[control.id] ?? control.defaultValue;
        if (control.type === "boolean") {
          return (
            <button
              type="button"
              key={control.id}
              class={Boolean(value) ? "active" : ""}
              title={control.label}
              aria-label={control.label}
              aria-pressed={Boolean(value)}
              onClick={() => onChange(control.id, !Boolean(value))}
            >
              {toolbarControlIcon(control.id)}
            </button>
          );
        }
        if (control.type === "select") {
          return (
            <label class="viewer-toolbar-select" key={control.id} title={control.label} aria-label={control.label}>
              {toolbarControlIcon(control.id)}
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
        return null;
      })}
    </div>
  );
}

function toolbarControlsForResult(result: NonNullable<PopupRecord["result"]>): ViewerControlDefinition[] {
  const ids = toolbarControlIds(result);
  return (result.controls || []).filter((control) => ids.includes(control.id));
}

function remainingControlsForResult(result: NonNullable<PopupRecord["result"]>): ViewerControlDefinition[] {
  const ids = new Set(toolbarControlIds(result));
  return (result.controls || []).filter((control) => !ids.has(control.id));
}

function toolbarControlIds(result: NonNullable<PopupRecord["result"]>): string[] {
  if (result.kind === "html") {
    return ["readingTheme", "contentWidth"];
  }
  if (result.kind === "svg") {
    return ["fitMode", "svgBackground"];
  }
  if (result.kind === "bpmn") {
    return [];
  }
  if (result.kind === "tree" || result.kind === "itm-tree") {
    return ["viewerBackground"];
  }
  if (result.kind === "mindmap" || result.kind === "itm-mindmap") {
    return ["viewerBackground", "showArrows", "showEdgeLabels"];
  }
  if (result.kind === "graph" || result.kind === "itm-graph") {
    return result.engine === "sigma"
      ? ["viewerBackground", "layout", "showArrows", "showLabels", "showEdgeLabels", "filterToMatches", "focusNeighbors"]
      : ["viewerBackground", "layout", "showArrows", "showLabels", "showEdgeLabels", "filterToMatches"];
  }
  return [];
}

function toolbarControlIcon(id: string): JSX.Element {
  if (id === "showArrows") {
    return <ArrowRight size={15} />;
  }
  if (id === "showLabels") {
    return <Tag size={15} />;
  }
  if (id === "showEdgeLabels") {
    return <Tags size={15} />;
  }
  if (id === "filterToMatches") {
    return <Filter size={15} />;
  }
  if (id === "focusNeighbors" || id === "layout" || id === "mindmapMode") {
    return <Network size={15} />;
  }
  if (id === "readingTheme" || id === "svgBackground" || id === "viewerBackground") {
    return <Palette size={15} />;
  }
  return <Settings size={15} />;
}

function DiagnosticsList({ popup, onUpdate }: { popup: PopupRecord; onUpdate: PopupHostProps["onUpdate"] }) {
  const diagnostics = popup.diagnostics || [];
  if (!diagnostics.length) {
    return <p class="empty-state">No diagnostics for this document.</p>;
  }
  const acknowledged = new Set(popup.acknowledgedDiagnosticKeys || []);
  const visible = diagnostics
    .map((diagnostic, index) => ({ diagnostic, originalIndex: index }))
    .filter(({ diagnostic, originalIndex }) => !acknowledged.has(diagnosticKey(diagnostic, originalIndex)));
  function acknowledge(keys: string[]): void {
    onUpdate(popup.id, { acknowledgedDiagnosticKeys: Array.from(new Set([...(popup.acknowledgedDiagnosticKeys || []), ...keys])) });
  }
  if (!visible.length) {
    return (
      <div class="diagnostics-panel">
        <p class="empty-state">All diagnostics acknowledged.</p>
      </div>
    );
  }
  return (
    <div class="diagnostics-panel">
      <div class="diagnostics-toolbar">
        <span>{visible.length} active of {diagnostics.length}</span>
        <button type="button" title="Acknowledge all diagnostics" onClick={() => acknowledge(diagnostics.map((diagnostic, index) => diagnosticKey(diagnostic, index)))}>
          <CheckCheck size={15} />
          All
        </button>
      </div>
      <ul class="diagnostics-list">
        {visible.map(({ diagnostic, originalIndex }) => {
          const key = diagnosticKey(diagnostic, originalIndex);
          const sameKindKeys = diagnostics
            .map((candidate, index) => ({ candidate, index }))
            .filter(({ candidate }) => diagnosticKindKey(candidate) === diagnosticKindKey(diagnostic))
            .map(({ candidate, index }) => diagnosticKey(candidate, index));
          return (
            <li class={`severity-${diagnostic.severity}`} key={key}>
              <strong>#{originalIndex + 1}</strong>
              <span class="diagnostic-location">{diagnosticLocation(diagnostic)}</span>
              <span class="diagnostic-severity">{diagnostic.severity}</span>
              <span class="diagnostic-message">{diagnostic.message}</span>
              <div class="diagnostic-actions">
                <button type="button" title="Acknowledge this diagnostic" onClick={() => acknowledge([key])}>
                  <Check size={14} />
                </button>
                <button type="button" title="Acknowledge all diagnostics of this kind" onClick={() => acknowledge(sameKindKeys)}>
                  <CheckCheck size={14} />
                </button>
              </div>
              <small>
                {diagnostic.source}
                {diagnostic.pipelineStepId ? ` - ${diagnostic.pipelineStepId}` : ""}
                {diagnostic.documentId ? ` - ${diagnostic.documentId.slice(0, 10)}` : ""}
              </small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function diagnosticKey(diagnostic: NonNullable<PopupRecord["diagnostics"]>[number], index: number): string {
  return [
    diagnostic.documentId || "",
    diagnostic.source,
    diagnostic.severity,
    diagnostic.message,
    diagnostic.line ?? diagnostic.range?.line ?? "",
    diagnostic.column ?? diagnostic.range?.column ?? "",
    diagnostic.modelPath || "",
    index
  ].join("|");
}

function diagnosticKindKey(diagnostic: NonNullable<PopupRecord["diagnostics"]>[number]): string {
  return [diagnostic.source, diagnostic.pipelineStepId || "", diagnostic.message].join("|");
}

function diagnosticLocation(diagnostic: NonNullable<PopupRecord["diagnostics"]>[number]): string {
  const line = diagnostic.line ?? diagnostic.range?.line;
  const column = diagnostic.column ?? diagnostic.range?.column;
  if (typeof line !== "number") {
    return "-";
  }
  return `${line + 1}:${typeof column === "number" ? column + 1 : 1}`;
}

function PluginManagerList({ states }: { states: PluginState[] }) {
  return (
    <div class="plugin-list">
      <div class="plugin-upload">
        <small>User extensibility is Lua-only in this build. Trusted JavaScript plugins are packaged with TextForge and lazy-loaded internally.</small>
      </div>
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

function PipelineTrace({
  trace,
  documents,
  onOpenStep
}: {
  trace: PipelineTraceStep[];
  documents: TextDocument[];
  onOpenStep: (step: PipelineTraceStep) => void;
}) {
  const openDocumentIds = new Set(documents.map((document) => document.id));
  const visibleTrace = trace.filter((step) => {
    const sourceOpen = !step.documentId || openDocumentIds.has(step.documentId);
    const targetOpen = !step.targetDocumentId || openDocumentIds.has(step.targetDocumentId);
    return sourceOpen && targetOpen;
  });
  if (!visibleTrace.length) {
    return <p class="empty-state">No pipeline trace is available yet.</p>;
  }
  return (
    <ol class="trace-list">
      {visibleTrace.map((step) => (
        <li key={step.stepId}>
          <div>
            <Activity size={15} />
            {step.documentIdentity ? (
              <DocumentBadge identity={step.documentIdentity} />
            ) : null}
            <strong>{step.stepId}</strong>
            <span>{step.status}</span>
          </div>
          <small>
            {step.documentName ? `${step.documentName} - ${shortId(step.documentId)} - v${step.documentVersion} - ` : ""}
            {step.inputType}
            {step.outputType ? ` -> ${step.outputType}` : ""}
            {step.targetDocumentName ? ` - opened as ${step.targetDocumentName}` : ""}
          </small>
          {step.diagnostics?.length ? <p>{step.diagnostics.length} diagnostic{step.diagnostics.length === 1 ? "" : "s"} from this step.</p> : null}
          {step.message ? <p>{step.message}</p> : null}
          {step.serializedValue ? (
            <button type="button" class="trace-open-document" onClick={() => onOpenStep(step)}>
              <FilePlus2 size={15} />
              Open step as document
            </button>
          ) : null}
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
  const badge = popup.documentIdentity ? documentBadgeSvgMarkup(popup.documentIdentity) : "";
  win.document.body.innerHTML = `
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #fbfbf8; color: #202225; }
      header { padding: 12px 16px; border-bottom: 1px solid #d8d4c8; background: #f0eee7; }
      .document-badge { display: inline-flex; width: 26px; height: 26px; margin-right: 8px; vertical-align: middle; border: 1px solid #b8c0d0; border-radius: 7px; background: #fff; }
      .document-badge svg { width: 100%; height: 100%; display: block; }
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
  anchor.download = exportFileName(popup);
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportFileName(popup: PopupRecord): string {
  if (!popup.result) {
    return "textforge-view.html";
  }
  const payload = exportPayload(popup.result);
  const sourceName = popup.documentName ? popup.documentName.replace(/\.[^.]+$/, "") : popup.title;
  const title = `${sourceName}-${popup.result.title || popup.title}`;
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "textforge-view"}.${payload.extension}`;
}

function exportPayload(result: NonNullable<PopupRecord["result"]>): { content: string; extension: string; type: string } {
  if (result.kind === "svg") {
    return { content: viewerSnapshotHtml(result), extension: "svg", type: "image/svg+xml" };
  }
  if (result.kind === "bpmn") {
    return { content: result.xml, extension: "bpmn", type: "application/xml" };
  }
  if (result.kind === "table") {
    const extension = result.table.delimiter === "\t" ? "tsv" : "csv";
    return { content: tableToDelimited(result.table.columns, result.table.rows, result.table.delimiter), extension, type: "text/plain" };
  }
  if (result.kind === "tree" || result.kind === "mindmap") {
    return { content: JSON.stringify(result.nodes, null, 2), extension: "json", type: "application/json" };
  }
  if (result.kind === "itm-tree" || result.kind === "itm-mindmap" || result.kind === "itm-graph") {
    return { content: serializeItmPipelineDocument(result.model), extension: "itm", type: "text/plain" };
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

function tableToDelimited(columns: string[], rows: string[][], delimiter: string): string {
  const lines = [columns, ...rows].map((row) => row.map((cell) => escapeDelimitedCell(cell, delimiter)).join(delimiter));
  return `${lines.join("\n")}\n`;
}

function escapeDelimitedCell(value: string, delimiter: string): string {
  if (!value.includes(delimiter) && !value.includes("\n") && !value.includes('"')) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}
