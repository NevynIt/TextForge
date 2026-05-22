import type { ResolvedItmEntity, ResolvedItmRelationship } from "@textforge/itm";
import jsMind from "jsmind";
import "jsmind/style/jsmind.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import type { JSX } from "preact";
import { PanelRightClose, PanelRightOpen } from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { GraphEdge, GraphModel, ItmPipelineValue, SourceRange, TableModel, TreeNode, ViewerResult, ViewerSettingValue, VisualSelection } from "../domain/types";
import { parseDelimited } from "../parsers/csv";
import { escapeHtml } from "../parsers/source";
import { serializeItmPipelineDocument } from "../viewers/itm/itmSerialization";
import { countEntities, entityTopic, getEntityAttributes, getEntityDescription, getEntityId, getEntityLabel, getEntityStyleRecord, getEntityTags, getEntityType, getOutgoingRelationships, getRelationshipId, getRelationshipLabel, getRelationshipTargetId, getRootEntities, getSourceRange, projectItmGraph, sortEntities, stringifyAttributeValue, type ItmGraphViewEdge, type ItmGraphViewModel, type ItmGraphViewNode } from "../viewers/itm/itmViewModel";

export interface ViewerContentProps {
  result: ViewerResult;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
  searchCommand?: ViewerSearchCommand;
  toolbarAction?: ViewerToolbarAction;
  onSearchStateChange?: (state: { count: number; index: number }) => void;
  onZoomChange?: (zoom: number) => void;
  onOpenSvgArtifact?: (svg: string, title: string) => void;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}

export interface ViewerSearchCommand {
  revision: number;
  direction: "previous" | "next";
}

export interface ViewerToolbarAction {
  revision: number;
  action: string;
}

export function shouldSuppressSvgSelection(target: EventTarget | null): boolean {
  let current = target;
  while (current instanceof Element) {
    const tagName = current.tagName.toLowerCase();
    if (tagName === "text" || tagName === "tspan") {
      return false;
    }
    current = current.parentElement;
  }
  return true;
}

export function zoomStandaloneSvgViewAtPoint(
  view: { panX: number; panY: number },
  currentScale: number,
  nextScale: number,
  pointerX: number,
  pointerY: number
): { panX: number; panY: number } {
  if (!Number.isFinite(currentScale) || !Number.isFinite(nextScale) || currentScale <= 0 || nextScale <= 0) {
    return view;
  }
  const contentX = (pointerX - view.panX) / currentScale;
  const contentY = (pointerY - view.panY) / currentScale;
  return {
    panX: pointerX - contentX * nextScale,
    panY: pointerY - contentY * nextScale
  };
}

type BpmnViewerModule = typeof import("bpmn-js/lib/NavigatedViewer");

interface BpmnCanvasLike {
  zoom(level: number | "fit-viewport"): number;
}

interface BpmnViewerInstance {
  importXML(xml: string): Promise<{ warnings?: unknown[] }>;
  get(service: "canvas"): BpmnCanvasLike;
  destroy(): void;
}

export function BpmnView({
  xml,
  zoom,
  toolbarAction,
  onZoomChange
}: {
  xml: string;
  zoom: number;
  toolbarAction?: ViewerToolbarAction;
  onZoomChange?: (zoom: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewerInstance | null>(null);
  const fitScaleRef = useRef(1);
  const [warningCount, setWarningCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  function applyZoom(level: number): void {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    viewer.get("canvas").zoom(fitScaleRef.current * level);
  }

  function fitDiagram(): void {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    fitScaleRef.current = viewer.get("canvas").zoom("fit-viewport") || 1;
    onZoomChange?.(1);
  }

  useEffect(() => {
    let disposed = false;
    let localViewer: BpmnViewerInstance | null = null;

    async function mountDiagram(): Promise<void> {
      if (!hostRef.current) {
        return;
      }
      setErrorMessage("");
      setWarningCount(0);
      hostRef.current.replaceChildren();

      try {
        const module = (await import("bpmn-js/lib/NavigatedViewer")) as BpmnViewerModule;
        if (disposed || !hostRef.current) {
          return;
        }
        const ViewerCtor = module.default;
        localViewer = new ViewerCtor({ container: hostRef.current }) as unknown as BpmnViewerInstance;
        viewerRef.current = localViewer;
        const importResult = await localViewer.importXML(xml);
        if (disposed) {
          return;
        }
        setWarningCount(importResult.warnings?.length || 0);
        fitScaleRef.current = localViewer.get("canvas").zoom("fit-viewport") || 1;
        applyZoom(zoom);
      } catch (error) {
        if (disposed) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    }

    void mountDiagram();

    return () => {
      disposed = true;
      localViewer?.destroy();
      if (viewerRef.current === localViewer) {
        viewerRef.current = null;
      }
    };
  }, [xml]);

  useEffect(() => {
    applyZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (!toolbarAction?.revision || toolbarAction.action !== "bpmn-fit") {
      return;
    }
    fitDiagram();
  }, [toolbarAction?.revision]);

  return (
    <section class="viewer-content viewer-bpmn-shell">
      {errorMessage ? <p class="viewer-bpmn-message viewer-bpmn-error">{errorMessage}</p> : null}
      {!errorMessage && warningCount ? <p class="viewer-bpmn-message">Imported with {warningCount} warning{warningCount === 1 ? "" : "s"}.</p> : null}
      <div class="viewer-bpmn">
        <div ref={hostRef} class="viewer-bpmn-canvas" />
      </div>
    </section>
  );
}

export function HtmlView({
  html,
  query,
  zoom,
  settings,
  searchCommand,
  toolbarAction,
  onSearchStateChange,
  onOpenSvgArtifact,
  sourceSelection,
  onSelectSourceRange
}: {
  html: string;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
  searchCommand?: ViewerSearchCommand;
  toolbarAction?: ViewerToolbarAction;
  onSearchStateChange?: (state: { count: number; index: number }) => void;
  onOpenSvgArtifact?: (svg: string, title: string) => void;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const openSvgArtifactRef = useRef(onOpenSvgArtifact);
  const selectSourceRangeRef = useRef(onSelectSourceRange);
  const [findState, setFindState] = useState<FindState>({ count: 0, activeIndex: -1, markers: [] });
  const theme = safeClassName(stringSetting(settings.readingTheme, "light"));
  const width = safeClassName(stringSetting(settings.contentWidth, "normal"));
  openSvgArtifactRef.current = onOpenSvgArtifact;
  selectSourceRangeRef.current = onSelectSourceRange;

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.innerHTML = html;
    enhanceHtmlHeadings(ref.current);
    enhanceMarkdownArtifacts(
      ref.current,
      (svg, title) => openSvgArtifactRef.current?.(svg, title),
      (range) => selectSourceRangeRef.current?.(range)
    );
    const matches = highlightTextNodes(ref.current, query);
    setFindState({
      count: matches.length,
      activeIndex: matches.length ? 0 : -1,
      markers: findMarkers(matches, ref.current)
    });
    applyMarkdownSourceSelection(ref.current, sourceSelection?.sourceRange);
  }, [html, query]);

  useEffect(() => {
    applyMarkdownSourceSelection(ref.current, sourceSelection?.sourceRange);
  }, [sourceSelection?.revision, sourceSelection?.sourceRange?.from, sourceSelection?.sourceRange?.to]);

  useEffect(() => {
    updateActiveFindMatch(ref.current, findState.activeIndex);
    onSearchStateChange?.({ count: findState.count, index: findState.activeIndex });
  }, [findState.activeIndex, findState.count]);

  function moveMatch(direction: 1 | -1): void {
    setFindState((current) => {
      if (!current.count) {
        return current;
      }
      return { ...current, activeIndex: (current.activeIndex + direction + current.count) % current.count };
    });
  }

  useEffect(() => {
    if (!searchCommand?.revision) {
      return;
    }
    moveMatch(searchCommand.direction === "previous" ? -1 : 1);
  }, [searchCommand?.revision]);

  useEffect(() => {
    if (!toolbarAction?.revision || !ref.current) {
      return;
    }
    if (toolbarAction.action === "html-fold-all") {
      setAllHtmlHeadings(ref.current, true);
    } else if (toolbarAction.action === "html-unfold-all") {
      setAllHtmlHeadings(ref.current, false);
    }
  }, [toolbarAction?.revision]);

  return (
    <section class={`viewer-content viewer-html-shell theme-${theme} width-${width}`} style={{ "--viewer-zoom": String(zoom) }}>
      <div ref={ref} class="viewer-html" />
      {findState.markers.length ? (
        <div class="viewer-find-markers" aria-hidden="true">
          {findState.markers.map((top, index) => (
            <span key={`${top}-${index}`} class={index === findState.activeIndex ? "active" : ""} style={{ top: `${top}%` }} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function SvgView({
  svg,
  query,
  zoom,
  settings,
  searchCommand,
  toolbarAction,
  onSearchStateChange,
  onZoomChange
}: {
  svg: string;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
  searchCommand?: ViewerSearchCommand;
  toolbarAction?: ViewerToolbarAction;
  onSearchStateChange?: (state: { count: number; index: number }) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; panX: number; panY: number; suppressSelection: boolean } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [svgView, setSvgView] = useState({ panX: 0, panY: 0 });
  const [findState, setFindState] = useState<FindState>({ count: 0, activeIndex: -1, markers: [] });
  const [isPanning, setIsPanning] = useState(false);
  const [selectionSuppressed, setSelectionSuppressed] = useState(false);
  const background = safeClassName(stringSetting(settings.svgBackground, "white"));
  const fitMode = safeClassName(stringSetting(settings.fitMode, "contain"));

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.innerHTML = svg;
    const matches = highlightSvgText(ref.current, query);
    setFindState({
      count: matches.length,
      activeIndex: matches.length ? 0 : -1,
      markers: findMarkers(matches, ref.current)
    });
    queueMicrotask(() => {
      const fitted = fittedStandaloneSvgView(ref.current, frameRef.current, fitMode);
      if (!fitted) {
        return;
      }
      setFitScale(fitted.scale);
      setSvgView({ panX: fitted.x, panY: fitted.y });
    });
  }, [svg, query]);

  useEffect(() => {
    updateActiveSvgMatch(ref.current, findState.activeIndex);
    onSearchStateChange?.({ count: findState.count, index: findState.activeIndex });
  }, [findState.activeIndex, findState.count]);

  function moveMatch(direction: 1 | -1): void {
    setFindState((current) => {
      if (!current.count) {
        return current;
      }
      return { ...current, activeIndex: (current.activeIndex + direction + current.count) % current.count };
    });
  }

  useEffect(() => {
    if (!searchCommand?.revision) {
      return;
    }
    moveMatch(searchCommand.direction === "previous" ? -1 : 1);
  }, [searchCommand?.revision]);

  useEffect(() => {
    if (!toolbarAction?.revision || toolbarAction.action !== "svg-fit") {
      return;
    }
    const fitted = fittedStandaloneSvgView(ref.current, frameRef.current, fitMode);
    if (!fitted) {
      return;
    }
    setFitScale(fitted.scale);
    setSvgView({ panX: fitted.x, panY: fitted.y });
    onZoomChange?.(1);
  }, [toolbarAction?.revision]);

  useEffect(() => {
    const fitted = fittedStandaloneSvgView(ref.current, frameRef.current, fitMode);
    if (!fitted) {
      return;
    }
    setFitScale(fitted.scale);
    setSvgView({ panX: fitted.x, panY: fitted.y });
  }, [fitMode]);

  function startPan(event: JSX.TargetedPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0 || event.target instanceof Element && event.target.closest("button")) {
      return;
    }
    const suppressSelection = shouldSuppressSvgSelection(event.target);
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: svgView.panX, panY: svgView.panY, suppressSelection };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (suppressSelection) {
      event.preventDefault();
    }
    setSelectionSuppressed(suppressSelection);
    setIsPanning(true);
  }

  function updatePan(event: JSX.TargetedPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    if (drag.suppressSelection || Math.abs(event.clientX - drag.x) > 2 || Math.abs(event.clientY - drag.y) > 2) {
      event.preventDefault();
    }
    setSvgView((current) => ({ ...current, panX: drag.panX + event.clientX - drag.x, panY: drag.panY + event.clientY - drag.y }));
  }

  function stopPan(event: JSX.TargetedPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setSelectionSuppressed(false);
    setIsPanning(false);
  }

  function cancelPan(): void {
    dragRef.current = null;
    setSelectionSuppressed(false);
    setIsPanning(false);
  }

  return (
    <section class={`viewer-content viewer-svg svg-bg-${background} svg-fit-${fitMode}`} style={{ "--viewer-zoom": "1" }}>
      <div
        class={`svg-frame${isPanning ? " is-panning" : ""}${selectionSuppressed ? " suppress-selection" : ""}`}
        ref={frameRef}
        onPointerDown={startPan}
        onPointerMove={updatePan}
        onPointerUp={stopPan}
        onPointerCancel={cancelPan}
        onLostPointerCapture={cancelPan}
        onWheel={(event) => {
          event.preventDefault();
          const nextZoom = clamp(zoom + (event.deltaY > 0 ? -0.1 : 0.1), 0.2, 5);
          if (nextZoom === zoom) {
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          const pointerX = event.clientX - rect.left;
          const pointerY = event.clientY - rect.top;
          setSvgView((current) => zoomStandaloneSvgViewAtPoint(current, fitScale * zoom, fitScale * nextZoom, pointerX, pointerY));
          onZoomChange?.(nextZoom);
        }}
      >
        <div
          class="svg-stage"
          ref={ref}
          style={{ transform: `translate(${svgView.panX}px, ${svgView.panY}px) scale(${fitScale * zoom})` }}
        />
      </div>
    </section>
  );
}

export function TreeView({
  nodes,
  query,
  settings,
  toolbarAction,
  sourceSelection,
  onSelectSourceRange
}: {
  nodes: TreeNode[];
  query: string;
  settings: Record<string, ViewerSettingValue>;
  toolbarAction?: ViewerToolbarAction;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const density = safeClassName(stringSetting(settings.density, "comfortable"));
  const inlineDetails = booleanSetting(settings.inlineDetails, false);
  const background = safeClassName(stringSetting(settings.viewerBackground, "paper"));
  const [selectedId, setSelectedId] = useState(nodes[0]?.id || "");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const nodeIndex = useMemo(() => indexTreeNodes(nodes), [nodes]);
  const selectedNode = nodeIndex.get(selectedId) || nodes[0];

  useEffect(() => {
    if (selectedId && nodeIndex.has(selectedId)) {
      return;
    }
    setSelectedId(nodes[0]?.id || "");
  }, [nodeIndex, nodes, selectedId]);

  function selectNode(id: string): void {
    if (!nodeIndex.has(id)) {
      return;
    }
    setSelectedId(id);
    window.requestAnimationFrame(() => document.getElementById(treeDomId(id))?.scrollIntoView({ block: "center", inline: "nearest" }));
  }

  function selectNodeSource(id: string): void {
    const node = nodeIndex.get(id);
    if (node?.sourceRange) {
      onSelectSourceRange?.(node.sourceRange);
    }
  }

  useEffect(() => {
    const node = sourceSelection ? treeNodeForSourceRange(nodes, sourceSelection.sourceRange) : undefined;
    if (!node) {
      return;
    }
    selectNode(node.id);
  }, [sourceSelection?.revision, nodes]);

  return (
    <div class={`viewer-with-inspector viewer-bg-${background} ${inspectorOpen ? "inspector-open" : "inspector-closed"}`}>
      <div class="viewer-main-panel tree-main-panel">
        <button type="button" class="inspector-toggle" title={inspectorOpen ? "Hide inspector" : "Show inspector"} onClick={() => setInspectorOpen((value) => !value)}>
          {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
        <ol class={`tree-list tree-${density}`}>
          {nodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              query={query}
              settings={settings}
              inlineDetails={inlineDetails}
              toolbarAction={toolbarAction}
              selectedId={selectedNode?.id || ""}
              onSelect={selectNode}
              onSelectSource={selectNodeSource}
              onSelectSourceRange={onSelectSourceRange}
            />
          ))}
        </ol>
      </div>
      {inspectorOpen ? <ViewerInspector title="Selection" emptyText="Select a tree node." item={selectedNode ? treeNodeInspector(selectedNode) : null} /> : null}
    </div>
  );
}

interface FilteredItmEntity {
  entity: ResolvedItmEntity;
  children: FilteredItmEntity[];
}

export function ItmTreeView({
  model,
  query,
  settings,
  toolbarAction,
  sourceSelection,
  onSelectSourceRange
}: {
  model: ItmPipelineValue;
  query: string;
  settings: Record<string, ViewerSettingValue>;
  toolbarAction?: ViewerToolbarAction;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const density = safeClassName(stringSetting(settings.density, "comfortable"));
  const inlineDetails = booleanSetting(settings.inlineDetails, false);
  const background = safeClassName(stringSetting(settings.viewerBackground, "paper"));
  const sourceText = model.source?.text;
  const allRoots = useMemo(() => getRootEntities(model), [model]);
  const roots = useMemo(() => filterItmTree(allRoots, query), [allRoots, query]);
  const entityIndex = useMemo(() => indexItmEntities(allRoots), [allRoots]);
  const [selectedId, setSelectedId] = useState(allRoots[0] ? getEntityId(allRoots[0]) : "");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const selectedEntity = entityIndex.get(selectedId) || roots[0]?.entity || allRoots[0];

  useEffect(() => {
    if (selectedId && entityIndex.has(selectedId)) {
      return;
    }
    setSelectedId(allRoots[0] ? getEntityId(allRoots[0]) : "");
  }, [allRoots, entityIndex, selectedId]);

  function selectEntity(id: string): void {
    if (!entityIndex.has(id)) {
      return;
    }
    setSelectedId(id);
    window.requestAnimationFrame(() => document.getElementById(treeDomId(id))?.scrollIntoView({ block: "center", inline: "nearest" }));
  }

  function selectEntitySource(id: string): void {
    const entity = entityIndex.get(id);
    const range = entity ? getSourceRange(entity.sourceRange, sourceText) : undefined;
    if (range) {
      onSelectSourceRange?.(range);
    }
  }

  useEffect(() => {
    const entity = sourceSelection ? itmEntityForSourceRange(allRoots, sourceSelection.sourceRange, sourceText) : undefined;
    if (!entity) {
      return;
    }
    selectEntity(getEntityId(entity));
  }, [allRoots, sourceSelection?.revision, sourceText]);

  return (
    <div class={`viewer-with-inspector viewer-bg-${background} ${inspectorOpen ? "inspector-open" : "inspector-closed"}`}>
      <div class="viewer-main-panel tree-main-panel">
        <button type="button" class="inspector-toggle" title={inspectorOpen ? "Hide inspector" : "Show inspector"} onClick={() => setInspectorOpen((value) => !value)}>
          {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
        <ol class={`tree-list tree-${density}`}>
          {roots.map((node) => (
            <ItmTreeItem
              key={getEntityId(node.entity)}
              node={node}
              depth={0}
              query={query}
              inlineDetails={inlineDetails}
              toolbarAction={toolbarAction}
              selectedId={selectedEntity ? getEntityId(selectedEntity) : ""}
              sourceText={sourceText}
              onSelect={selectEntity}
              onSelectSource={selectEntitySource}
              onSelectSourceRange={onSelectSourceRange}
            />
          ))}
        </ol>
      </div>
      {inspectorOpen ? <ViewerInspector title="Selection" emptyText="Select an ITM entity." item={selectedEntity ? itmEntityInspector(selectedEntity, sourceText) : null} /> : null}
    </div>
  );
}

function ItmTreeItem({
  node,
  depth,
  query,
  inlineDetails,
  toolbarAction,
  selectedId,
  sourceText,
  onSelect,
  onSelectSource,
  onSelectSourceRange
}: {
  node: FilteredItmEntity;
  depth: number;
  query: string;
  inlineDetails: boolean;
  toolbarAction?: ViewerToolbarAction;
  selectedId: string;
  sourceText?: string;
  onSelect: (id: string) => void;
  onSelectSource: (id: string) => void;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const entityId = getEntityId(node.entity);
  const entityLabel = getEntityLabel(node.entity);
  const entityType = getEntityType(node.entity);
  const entityTags = getEntityTags(node.entity);
  const explicitRelationships = getOutgoingRelationships(node.entity);
  const hasChildren = node.children.length > 0;
  const expandDepth = 3;
  const [open, setOpen] = useState(hasChildren && depth < expandDepth);

  useEffect(() => {
    setOpen(hasChildren && depth < expandDepth);
  }, [depth, hasChildren]);

  useEffect(() => {
    if (!toolbarAction?.revision) {
      return;
    }
    if (toolbarAction.action === "tree-fold-all") {
      setOpen(false);
    } else if (toolbarAction.action === "tree-unfold-all") {
      setOpen(true);
    }
  }, [toolbarAction?.revision]);

  if (!hasChildren) {
    return (
      <li>
        <div
          id={treeDomId(entityId)}
          class={`tree-leaf-row tree-node-row ${selectedId === entityId ? "tree-selected" : ""}`}
          onClick={(event) => {
            onSelect(entityId);
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              onSelectSource(entityId);
            }
          }}
        >
          <span class="node-label">{renderHighlighted(entityLabel, query)}</span>
          {entityType ? <span class="badge">[{entityType}]</span> : null}
          {entityTags.map((tag) => (
            <span class="badge" key={tag}>#{tag}</span>
          ))}
          <ItmTreeLinks links={explicitRelationships} sourceText={sourceText} onSelect={onSelect} onSelectSourceRange={onSelectSourceRange} />
        </div>
        {inlineDetails && getEntityDescription(node.entity) ? <pre class="node-details">{getEntityDescription(node.entity)}</pre> : null}
      </li>
    );
  }

  return (
    <li>
      <details ref={detailsRef} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          id={treeDomId(entityId)}
          class={`tree-node-row ${selectedId === entityId ? "tree-selected" : ""}`}
          onClick={(event) => {
            onSelect(entityId);
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              onSelectSource(entityId);
              return;
            }
            if (!event.shiftKey) {
              return;
            }
            event.preventDefault();
            const nextOpen = !detailsRef.current?.open;
            setOpen(nextOpen);
            setDescendantDetailsOpen(detailsRef.current, nextOpen);
          }}
        >
          <span class="node-label">{renderHighlighted(entityLabel, query)}</span>
          {entityType ? <span class="badge">[{entityType}]</span> : null}
          {entityTags.map((tag) => (
            <span class="badge" key={tag}>#{tag}</span>
          ))}
          <ItmTreeLinks links={explicitRelationships} sourceText={sourceText} onSelect={onSelect} onSelectSourceRange={onSelectSourceRange} />
        </summary>
        {inlineDetails && getEntityDescription(node.entity) ? <pre class="node-details">{getEntityDescription(node.entity)}</pre> : null}
        <ol class="tree-list">
          {node.children.map((child) => (
            <ItmTreeItem
              key={getEntityId(child.entity)}
              node={child}
              depth={depth + 1}
              query={query}
              inlineDetails={inlineDetails}
              toolbarAction={toolbarAction}
              selectedId={selectedId}
              sourceText={sourceText}
              onSelect={onSelect}
              onSelectSource={onSelectSource}
              onSelectSourceRange={onSelectSourceRange}
            />
          ))}
        </ol>
      </details>
    </li>
  );
}

function ItmTreeLinks({
  links,
  sourceText,
  onSelect,
  onSelectSourceRange
}: {
  links: ResolvedItmRelationship[];
  sourceText?: string;
  onSelect: (id: string) => void;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  if (!links.length) {
    return null;
  }
  return (
    <>
      {links.map((link) => {
        const targetId = getRelationshipTargetId(link);
        const sourceRange = getSourceRange(link.sourceRange, sourceText);
        return (
          <a
            class="badge tree-link"
            href={`#${treeDomId(targetId)}`}
            key={link.uid}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if ((event.ctrlKey || event.metaKey) && sourceRange) {
                onSelectSourceRange?.(sourceRange);
              } else {
                onSelect(targetId);
              }
            }}
          >
            @{getRelationshipLabel(link)}:{targetId}
          </a>
        );
      })}
    </>
  );
}

function TreeItem({
  node,
  depth,
  query,
  settings,
  inlineDetails,
  toolbarAction,
  selectedId,
  onSelect,
  onSelectSource,
  onSelectSourceRange
}: {
  node: TreeNode;
  depth: number;
  query: string;
  settings: Record<string, ViewerSettingValue>;
  inlineDetails: boolean;
  toolbarAction?: ViewerToolbarAction;
  selectedId: string;
  onSelect: (id: string) => void;
  onSelectSource: (id: string) => void;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const hasChildren = node.children.length > 0;
  const expandDepth = 3;
  const depthLimit = 0;
  const canShowChildren = hasChildren && (depthLimit === 0 || depth < depthLimit);
  const [open, setOpen] = useState(canShowChildren && depth < expandDepth);
  const nodeStyle = treeNodeVisualStyle(node);

  useEffect(() => {
    setOpen(canShowChildren && depth < expandDepth);
  }, [canShowChildren, depth, expandDepth]);

  useEffect(() => {
    if (!toolbarAction?.revision) {
      return;
    }
    if (toolbarAction.action === "tree-fold-all") {
      setOpen(false);
    } else if (toolbarAction.action === "tree-unfold-all") {
      setOpen(true);
    }
  }, [toolbarAction?.revision]);

  if (!canShowChildren) {
    return (
      <li>
        <div
          id={treeDomId(node.id)}
          class={`tree-leaf-row tree-node-row ${selectedId === node.id ? "tree-selected" : ""}`}
          style={nodeStyle}
          onClick={(event) => {
            onSelect(node.id);
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              onSelectSource(node.id);
            }
          }}
        >
          <span class="node-label">{renderHighlighted(node.label, query)}</span>
          {(node.tags || []).map((tag) => (
            <span class="badge" key={tag}>#{tag}</span>
          ))}
          <TreeLinks links={node.links || []} onSelect={onSelect} onSelectSourceRange={onSelectSourceRange} />
        </div>
        {inlineDetails && node.details ? <pre class="node-details">{node.details}</pre> : null}
        {hasChildren ? <small class="tree-pruned">{node.children.length} hidden children</small> : null}
      </li>
    );
  }

  return (
    <li>
      <details ref={detailsRef} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          id={treeDomId(node.id)}
          class={`tree-node-row ${selectedId === node.id ? "tree-selected" : ""}`}
          style={nodeStyle}
          onClick={(event) => {
            onSelect(node.id);
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              onSelectSource(node.id);
              return;
            }
            if (!event.shiftKey) {
              return;
            }
            event.preventDefault();
            const nextOpen = !detailsRef.current?.open;
            setOpen(nextOpen);
            setDescendantDetailsOpen(detailsRef.current, nextOpen);
          }}
        >
          <span class="node-label">{renderHighlighted(node.label, query)}</span>
          {(node.tags || []).map((tag) => (
            <span class="badge" key={tag}>#{tag}</span>
          ))}
          <TreeLinks links={node.links || []} onSelect={onSelect} onSelectSourceRange={onSelectSourceRange} />
        </summary>
        {inlineDetails && node.details ? <pre class="node-details">{node.details}</pre> : null}
        {canShowChildren ? (
          <ol class="tree-list">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                query={query}
                settings={settings}
                inlineDetails={inlineDetails}
                toolbarAction={toolbarAction}
                selectedId={selectedId}
                onSelect={onSelect}
                onSelectSource={onSelectSource}
                onSelectSourceRange={onSelectSourceRange}
              />
            ))}
          </ol>
        ) : null}
      </details>
    </li>
  );
}

function TreeLinks({
  links,
  onSelect,
  onSelectSourceRange
}: {
  links: NonNullable<TreeNode["links"]>;
  onSelect: (id: string) => void;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  if (!links.length) {
    return null;
  }
  return (
    <>
      {links.map((link, index) => (
        <a
          class="badge tree-link"
          href={`#${treeDomId(link.target)}`}
          key={`${link.target}-${link.type || ""}-${index}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if ((event.ctrlKey || event.metaKey) && link.sourceRange) {
              onSelectSourceRange?.(link.sourceRange);
            } else {
              onSelect(link.target);
            }
          }}
        >
          @{link.type ? `${link.type}:${link.target}` : link.target}
        </a>
      ))}
    </>
  );
}

export function TableView({
  table,
  query,
  settings: _settings
}: {
  table: TableModel;
  query: string;
  settings: Record<string, ViewerSettingValue>;
}) {
  const [separator, setSeparator] = useState(table.delimiter || ",");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [sortState, setSortState] = useState<{ column: number; direction: "asc" | "desc" } | null>(null);
  const lower = query.trim().toLowerCase();
  const parsed = useMemo(() => parseDelimited(table.sourceText ?? tableToText(table), separator, "text.csv"), [table, separator]);
  const sourceRows = includeHeaders ? parsed.rows : [parsed.columns, ...parsed.rows];
  const columns = includeHeaders ? parsed.columns : generatedColumns(sourceRows);
  const filteredRows = lower
    ? sourceRows.filter((row) => row.some((cell) => cell.toLowerCase().includes(lower)))
    : sourceRows;
  const sortedRows =
    sortState
      ? [...filteredRows].sort((left, right) => compareCell(left[sortState.column] || "", right[sortState.column] || "", sortState.direction))
      : filteredRows;
  const rows = sortedRows;

  function toggleSort(column: number): void {
    setSortState((current) => {
      if (!current || current.column !== column) {
        return { column, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { column, direction: "desc" };
      }
      return null;
    });
  }

  return (
    <>
      <div class="table-status">
        <span>
          {rows.length} of {filteredRows.length} rows
        </span>
        <label>
          Separator
          <select value={separator} onChange={(event) => setSeparator(event.currentTarget.value)}>
            <option value=",">Comma</option>
            <option value={"\t"}>Tab</option>
            <option value=";">Semicolon</option>
            <option value="|">Pipe</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((column, columnIndex) => (
              <th key={`${column}-${columnIndex}`}>
                <button type="button" class="table-sort-button" onClick={() => toggleSort(columnIndex)}>
                  {renderHighlighted(column, query)}
                  <span>{sortState?.column === columnIndex ? (sortState.direction === "asc" ? "Asc" : "Desc") : "Sort"}</span>
                </button>
              </th>
            ))}
          </tr>
          <tr>
            <th colSpan={Math.max(1, columns.length)}>
              <label class="table-header-toggle">
                <input type="checkbox" checked={includeHeaders} onChange={(event) => setIncludeHeaders(event.currentTarget.checked)} />
                Table includes headers
              </label>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((_column, columnIndex) => (
                <td key={columnIndex}>{renderHighlighted(row[columnIndex] || "", query)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function MindMapView({
  nodes,
  query,
  zoom,
  settings,
  searchCommand,
  toolbarAction,
  onSearchStateChange,
  onZoomChange,
  sourceSelection,
  onSelectSourceRange
}: {
  nodes: TreeNode[];
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
  searchCommand?: ViewerSearchCommand;
  toolbarAction?: ViewerToolbarAction;
  onSearchStateChange?: (state: { count: number; index: number }) => void;
  onZoomChange?: (zoom: number) => void;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<jsMind | null>(null);
  const crossLinkLabelOffsetsRef = useRef(new Map<string, Point>());
  const selectSourceRangeRef = useRef(onSelectSourceRange);
  const mind = useMemo(() => treeToJsMind(nodes), [nodes]);
  const searchMatches = useMemo(() => matchingTreeNodes(nodes, query), [nodes, query]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const mode = stringSetting(settings.mindmapMode, "full");
  const initialDepth = stringSetting(settings.initialDepth, "depth2");
  const theme = safeClassName(stringSetting(settings.mindmapTheme, "textforge"));
  const textScale = numberSetting(settings.textScale, 1);
  const background = safeClassName(stringSetting(settings.viewerBackground, "grid"));
  const showCrossLinkArrows = booleanSetting(settings.showArrows, true);
  const showCrossLinkLabels = booleanSetting(settings.showEdgeLabels, false);
  selectSourceRangeRef.current = onSelectSourceRange;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    let drag: { id: number; x: number; y: number; left: number; top: number; moved: boolean } | null = null;
    const start = (event: PointerEvent) => {
      if (event.button !== 0 || event.target instanceof Element && event.target.closest("button,a,input,select,textarea,jmnode,jmexpander")) {
        return;
      }
      const panel = mindMapPanel(hostRef.current);
      if (!panel) {
        return;
      }
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: panel.scrollLeft, top: panel.scrollTop, moved: false };
      viewport.setPointerCapture?.(event.pointerId);
      viewport.classList.add("is-panning");
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        drag.moved = true;
        event.preventDefault();
      }
      const panel = mindMapPanel(hostRef.current);
      if (panel) {
        panel.scrollLeft = drag.left - deltaX;
        panel.scrollTop = drag.top - deltaY;
      }
    };
    const stop = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) {
        return;
      }
      viewport.releasePointerCapture?.(event.pointerId);
      viewport.classList.remove("is-panning");
      drag = null;
    };
    viewport.addEventListener("pointerdown", start);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", stop);
    viewport.addEventListener("pointercancel", stop);
    return () => {
      viewport.removeEventListener("pointerdown", start);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", stop);
      viewport.removeEventListener("pointercancel", stop);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    if (!host) {
      return;
    }
    const hostId = `jsmind-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    host.id = hostId;
    host.innerHTML = "";
    host.style.setProperty("--jsmind-node-scale", String(clamp(textScale, 0.7, 1.6)));

    const instance = new jsMind({
      container: hostId,
      editable: false,
      theme,
      mode: mode === "side" ? "side" : "full",
      support_html: false,
      log_level: "error",
      view: {
        engine: "svg",
        draggable: false,
        hide_scrollbars_when_draggable: false,
        hmargin: 8000,
        vmargin: 6000,
        line_width: 2,
        line_color: "#78909c",
        line_style: "curved",
        node_overflow: "wrap",
        zoom: {
          min: 0.1,
          max: 5,
          step: 0.15,
          mask_key: 0
        }
      },
      layout: {
        hspace: 140,
        vspace: 56,
        pspace: 24,
        cousin_space: 24
      },
      default_event_handle: {
        enable_mousedown_handle: true,
        enable_click_handle: true,
        enable_dblclick_handle: false,
        enable_mousewheel_handle: false
      },
      shortcut: { enable: false }
    });

    instanceRef.current = instance;
    instance.show(mind);
    (instance as unknown as { add_event_listener?: (handler: () => void) => void }).add_event_listener?.(() => {
      window.requestAnimationFrame(() => renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current }));
    });
    const doubleClick = (event: MouseEvent) => {
      const id = jsMindNodeId(instance, event.target);
      if (!id) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      toggleJsMindNode(instance, id, event.shiftKey);
      window.requestAnimationFrame(() => renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current }));
    };
    const click = (event: MouseEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      const id = jsMindNodeId(instance, event.target);
      if (!id) {
        return;
      }
      const node = indexTreeNodes(nodes).get(id);
      if (!node?.sourceRange) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      selectSourceRangeRef.current?.(node.sourceRange);
    };
    host.addEventListener("dblclick", doubleClick, true);
    host.addEventListener("click", click, true);
    if (initialDepth === "collapsed") {
      instance.collapse_all?.();
    } else if (initialDepth === "depth2") {
      instance.expand_to_depth?.(2);
    } else {
      instance.expand_all?.();
    }
    setNativeMindMapZoom(instance, zoom);
    renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    centerMindMapNode(viewport, host, mind.data.id);
    window.setTimeout(() => {
      instance.resize?.();
      setNativeMindMapZoom(instance, zoom);
      renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
      centerMindMapNode(viewport, host, mind.data.id);
    }, 0);

    return () => {
      host.removeEventListener("dblclick", doubleClick, true);
      host.removeEventListener("click", click, true);
      instanceRef.current = null;
      host.innerHTML = "";
    };
  }, [mind, mode, initialDepth, theme, textScale, nodes, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    setActiveMatchIndex(searchMatches.length ? 0 : -1);
  }, [searchMatches]);

  useEffect(() => {
    onSearchStateChange?.({ count: searchMatches.length, index: activeMatchIndex });
  }, [searchMatches.length, activeMatchIndex]);

  useEffect(() => {
    if (!searchCommand?.revision) {
      return;
    }
    setActiveMatchIndex((current) => {
      if (!searchMatches.length) {
        return -1;
      }
      const direction = searchCommand.direction === "previous" ? -1 : 1;
      return (current + direction + searchMatches.length) % searchMatches.length;
    });
  }, [searchCommand?.revision]);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const instance = instanceRef.current;
    if (!host || !viewport || !instance) {
      return;
    }
    const activeMatch = searchMatches[activeMatchIndex];
    renderMindMapDecorations(host, nodes, query, activeMatch?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    if (!activeMatch) {
      return;
    }
    expandJsMindPath(instance, nodes, activeMatch.id, (node) => node.id, (node) => node.children);
    window.requestAnimationFrame(() => {
      instance.select_node?.(activeMatch.id);
      renderMindMapDecorations(host, nodes, query, activeMatch.id, { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
      centerMindMapNode(viewport, host, activeMatch.id);
    });
  }, [query, searchMatches, activeMatchIndex, nodes, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const instance = instanceRef.current;
    if (!host || !viewport || !instance || !sourceSelection) {
      return;
    }
    const node = treeNodeForSourceRange(nodes, sourceSelection.sourceRange);
    if (!node) {
      return;
    }
    expandJsMindPath(instance, nodes, node.id, (item) => item.id, (item) => item.children);
    window.requestAnimationFrame(() => {
      instance.select_node?.(node.id);
      renderMindMapDecorations(host, nodes, query, node.id, { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
      centerMindMapNode(viewport, host, node.id);
    });
  }, [sourceSelection?.revision, nodes]);

  useEffect(() => {
    const host = hostRef.current;
    const instance = instanceRef.current;
    if (!host || !instance) {
      return;
    }
    setNativeMindMapZoom(instance, zoom);
    window.requestAnimationFrame(() => renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current }));
  }, [zoom, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    if (!toolbarAction?.revision) {
      return;
    }
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const instance = instanceRef.current;
    if (!host || !viewport || !instance) {
      return;
    }
    if (toolbarAction.action === "mindmap-center") {
      centerMindMapNode(viewport, host, mind.data.id);
    } else if (toolbarAction.action === "mindmap-fit") {
      fitMindMap(instance, viewport, host, onZoomChange);
    } else if (toolbarAction.action === "mindmap-fold-all") {
      instance.collapse_all?.();
      renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    } else if (toolbarAction.action === "mindmap-unfold-all") {
      instance.expand_all?.();
      renderMindMapDecorations(host, nodes, query, searchMatches[activeMatchIndex]?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    }
  }, [toolbarAction?.revision]);

  return (
    <section class={`jsmind-viewer-shell viewer-bg-${background}`}>
      <div class="jsmind-viewer-meta">
        <strong>{mind.meta.name}</strong>
        <span>{countTreeNodes(nodes)} nodes</span>
      </div>
      <div
        class="jsmind-viewer-viewport"
        ref={viewportRef}
        onWheel={(event) => {
          event.preventDefault();
          const nextZoom = clamp(zoom + (event.deltaY > 0 ? -0.1 : 0.1), 0.1, 5);
          const instance = instanceRef.current;
          if (instance) {
            setNativeMindMapZoom(instance, nextZoom, { x: event.clientX, y: event.clientY });
          }
          onZoomChange?.(nextZoom);
        }}
      >
        <div class="jsmind-viewer-host" ref={hostRef} />
      </div>
    </section>
  );
}

export function ItmMindMapView({
  model,
  query,
  zoom,
  settings,
  searchCommand,
  toolbarAction,
  onSearchStateChange,
  onZoomChange,
  sourceSelection,
  onSelectSourceRange
}: {
  model: ItmPipelineValue;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
  searchCommand?: ViewerSearchCommand;
  toolbarAction?: ViewerToolbarAction;
  onSearchStateChange?: (state: { count: number; index: number }) => void;
  onZoomChange?: (zoom: number) => void;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<jsMind | null>(null);
  const crossLinkLabelOffsetsRef = useRef(new Map<string, Point>());
  const selectSourceRangeRef = useRef(onSelectSourceRange);
  const roots = useMemo(() => getRootEntities(model), [model]);
  const entityIndex = useMemo(() => indexItmEntities(roots), [roots]);
  const sourceText = model.source?.text;
  const mind = useMemo(() => itmToJsMind(roots), [roots]);
  const searchMatches = useMemo(() => matchingItmEntities(roots, query), [roots, query]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const mode = stringSetting(settings.mindmapMode, "full");
  const initialDepth = stringSetting(settings.initialDepth, "depth2");
  const theme = safeClassName(stringSetting(settings.mindmapTheme, "textforge"));
  const textScale = numberSetting(settings.textScale, 1);
  const background = safeClassName(stringSetting(settings.viewerBackground, "grid"));
  const showCrossLinkArrows = booleanSetting(settings.showArrows, true);
  const showCrossLinkLabels = booleanSetting(settings.showEdgeLabels, false);
  selectSourceRangeRef.current = onSelectSourceRange;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    let drag: { id: number; x: number; y: number; left: number; top: number; moved: boolean } | null = null;
    const start = (event: PointerEvent) => {
      if (event.button !== 0 || event.target instanceof Element && event.target.closest("button,a,input,select,textarea,jmnode,jmexpander")) {
        return;
      }
      const panel = mindMapPanel(hostRef.current);
      if (!panel) {
        return;
      }
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: panel.scrollLeft, top: panel.scrollTop, moved: false };
      viewport.setPointerCapture?.(event.pointerId);
      viewport.classList.add("is-panning");
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        drag.moved = true;
        event.preventDefault();
      }
      const panel = mindMapPanel(hostRef.current);
      if (panel) {
        panel.scrollLeft = drag.left - deltaX;
        panel.scrollTop = drag.top - deltaY;
      }
    };
    const stop = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) {
        return;
      }
      viewport.releasePointerCapture?.(event.pointerId);
      viewport.classList.remove("is-panning");
      drag = null;
    };
    viewport.addEventListener("pointerdown", start);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", stop);
    viewport.addEventListener("pointercancel", stop);
    return () => {
      viewport.removeEventListener("pointerdown", start);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", stop);
      viewport.removeEventListener("pointercancel", stop);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    if (!host) {
      return;
    }
    const hostId = `jsmind-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    host.id = hostId;
    host.innerHTML = "";
    host.style.setProperty("--jsmind-node-scale", String(clamp(textScale, 0.7, 1.6)));

    const instance = new jsMind({
      container: hostId,
      editable: false,
      theme,
      mode: mode === "side" ? "side" : "full",
      support_html: false,
      log_level: "error",
      view: {
        engine: "svg",
        draggable: false,
        hide_scrollbars_when_draggable: false,
        hmargin: 8000,
        vmargin: 6000,
        line_width: 2,
        line_color: "#78909c",
        line_style: "curved",
        node_overflow: "wrap",
        zoom: {
          min: 0.1,
          max: 5,
          step: 0.15,
          mask_key: 0
        }
      },
      layout: {
        hspace: 140,
        vspace: 56,
        pspace: 24,
        cousin_space: 24
      },
      default_event_handle: {
        enable_mousedown_handle: true,
        enable_click_handle: true,
        enable_dblclick_handle: false,
        enable_mousewheel_handle: false
      },
      shortcut: { enable: false }
    });

    instanceRef.current = instance;
    instance.show(mind);
    (instance as unknown as { add_event_listener?: (handler: () => void) => void }).add_event_listener?.(() => {
      window.requestAnimationFrame(() => renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current }));
    });
    const doubleClick = (event: MouseEvent) => {
      const id = jsMindNodeId(instance, event.target);
      if (!id) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      toggleJsMindNode(instance, id, event.shiftKey);
      window.requestAnimationFrame(() => renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current }));
    };
    const click = (event: MouseEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      const id = jsMindNodeId(instance, event.target);
      if (!id) {
        return;
      }
      const entity = entityIndex.get(id);
      const range = entity ? getSourceRange(entity.sourceRange, sourceText) : undefined;
      if (!range) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      selectSourceRangeRef.current?.(range);
    };
    host.addEventListener("dblclick", doubleClick, true);
    host.addEventListener("click", click, true);
    if (initialDepth === "collapsed") {
      instance.collapse_all?.();
    } else if (initialDepth === "depth2") {
      instance.expand_to_depth?.(2);
    } else {
      instance.expand_all?.();
    }
    setNativeMindMapZoom(instance, zoom);
    renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    centerMindMapNode(viewport, host, mind.data.id);
    window.setTimeout(() => {
      instance.resize?.();
      setNativeMindMapZoom(instance, zoom);
      renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
      centerMindMapNode(viewport, host, mind.data.id);
    }, 0);

    return () => {
      host.removeEventListener("dblclick", doubleClick, true);
      host.removeEventListener("click", click, true);
      instanceRef.current = null;
      host.innerHTML = "";
    };
  }, [mind, mode, initialDepth, theme, textScale, roots, sourceText, query, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    setActiveMatchIndex(searchMatches.length ? 0 : -1);
  }, [searchMatches]);

  useEffect(() => {
    onSearchStateChange?.({ count: searchMatches.length, index: activeMatchIndex });
  }, [searchMatches.length, activeMatchIndex]);

  useEffect(() => {
    if (!searchCommand?.revision) {
      return;
    }
    setActiveMatchIndex((current) => {
      if (!searchMatches.length) {
        return -1;
      }
      const direction = searchCommand.direction === "previous" ? -1 : 1;
      return (current + direction + searchMatches.length) % searchMatches.length;
    });
  }, [searchCommand?.revision, searchMatches.length]);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const instance = instanceRef.current;
    if (!host || !viewport || !instance) {
      return;
    }
    const activeMatch = searchMatches[activeMatchIndex];
    renderItmMindMapDecorations(host, roots, sourceText, query, activeMatch?.id || "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    if (!activeMatch) {
      return;
    }
    const activeId = getEntityId(activeMatch);
    expandJsMindPath(instance, roots, activeId, getEntityId, (entity) => sortEntities(entity.children));
    window.requestAnimationFrame(() => {
      instance.select_node?.(activeId);
      renderItmMindMapDecorations(host, roots, sourceText, query, activeId, { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
      centerMindMapNode(viewport, host, activeId);
    });
  }, [query, searchMatches, activeMatchIndex, roots, sourceText, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const instance = instanceRef.current;
    if (!host || !viewport || !instance || !sourceSelection) {
      return;
    }
    const entity = itmEntityForSourceRange(roots, sourceSelection.sourceRange, sourceText);
    if (!entity) {
      return;
    }
    const entityId = getEntityId(entity);
    expandJsMindPath(instance, roots, entityId, getEntityId, (item) => sortEntities(item.children));
    window.requestAnimationFrame(() => {
      instance.select_node?.(entityId);
      renderItmMindMapDecorations(host, roots, sourceText, query, entityId, { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
      centerMindMapNode(viewport, host, entityId);
    });
  }, [sourceSelection?.revision, roots, sourceText, query, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    const host = hostRef.current;
    const instance = instanceRef.current;
    if (!host || !instance) {
      return;
    }
    setNativeMindMapZoom(instance, zoom);
    window.requestAnimationFrame(() => renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current }));
  }, [zoom, roots, sourceText, query, searchMatches, activeMatchIndex, showCrossLinkArrows, showCrossLinkLabels]);

  useEffect(() => {
    if (!toolbarAction?.revision) {
      return;
    }
    const host = hostRef.current;
    const viewport = viewportRef.current;
    const instance = instanceRef.current;
    if (!host || !viewport || !instance) {
      return;
    }
    if (toolbarAction.action === "mindmap-center") {
      centerMindMapNode(viewport, host, mind.data.id);
    } else if (toolbarAction.action === "mindmap-fit") {
      fitMindMap(instance, viewport, host, onZoomChange);
    } else if (toolbarAction.action === "mindmap-fold-all") {
      instance.collapse_all?.();
      renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    } else if (toolbarAction.action === "mindmap-unfold-all") {
      instance.expand_all?.();
      renderItmMindMapDecorations(host, roots, sourceText, query, searchMatches[activeMatchIndex] ? getEntityId(searchMatches[activeMatchIndex]) : "", { showArrows: showCrossLinkArrows, showLabels: showCrossLinkLabels, labelOffsets: crossLinkLabelOffsetsRef.current });
    }
  }, [toolbarAction?.revision, mind.data.id, roots, sourceText, query, searchMatches, activeMatchIndex, showCrossLinkArrows, showCrossLinkLabels]);

  return (
    <section class={`jsmind-viewer-shell viewer-bg-${background}`}>
      <div class="jsmind-viewer-meta">
        <strong>{mind.meta.name}</strong>
        <span>{countEntities(roots)} nodes</span>
      </div>
      <div
        class="jsmind-viewer-viewport"
        ref={viewportRef}
        onWheel={(event) => {
          event.preventDefault();
          const nextZoom = clamp(zoom + (event.deltaY > 0 ? -0.1 : 0.1), 0.1, 5);
          const instance = instanceRef.current;
          if (instance) {
            setNativeMindMapZoom(instance, nextZoom, { x: event.clientX, y: event.clientY });
          }
          onZoomChange?.(nextZoom);
        }}
      >
        <div class="jsmind-viewer-host" ref={hostRef} />
      </div>
    </section>
  );
}

type GraphViewModel = GraphModel | ItmGraphViewModel;
type GraphViewNode = GraphModel["nodes"][number] | ItmGraphViewNode;
type GraphViewEdge = GraphModel["edges"][number] | ItmGraphViewEdge;

const READABLE_GRAPH_NODE_LIMIT = 50;
const DENSE_GRAPH_NODE_LIMIT = 250;
const DENSE_GRAPH_EDGE_LIMIT = 800;
const SVG_NAMESPACE = ["http:", "", "www.w3.org", "2000", "svg"].join("/");

export function GraphView({
  graph,
  engine,
  query,
  settings,
  searchCommand,
  toolbarAction,
  onSearchStateChange,
  sourceSelection,
  onSelectSourceRange
}: {
  graph: GraphViewModel;
  engine: "cytoscape" | "sigma" | "static";
  query: string;
  settings: Record<string, ViewerSettingValue>;
  searchCommand?: ViewerSearchCommand;
  toolbarAction?: ViewerToolbarAction;
  onSearchStateChange?: (state: { count: number; index: number }) => void;
  sourceSelection?: VisualSelection;
  onSelectSourceRange?: (range: SourceRange) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<CytoscapeLike | null>(null);
  const sigmaRuntimeRef = useRef<SigmaRuntime | null>(null);
  const selectSourceRangeRef = useRef(onSelectSourceRange);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<GraphSelection | null>(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const highlighted = useMemo(() => query.trim().toLowerCase(), [query]);
  const layout = stringSetting(settings.layout, engine === "sigma" ? "forceatlas2" : "breadthfirst");
  const concentricRingSpacing = numberSetting(settings.concentricRingSpacing, 1);
  const nodeSize = numberSetting(settings.nodeSize, 18);
  const edgeWidth = numberSetting(settings.edgeWidth, 1.5);
  const showLabels = booleanSetting(settings.showLabels, true);
  const showEdgeLabels = booleanSetting(settings.showEdgeLabels, false);
  const showArrows = booleanSetting(settings.showArrows, graph.directed !== false);
  const background = safeClassName(stringSetting(settings.viewerBackground, "white"));
  const performanceModeSetting = stringSetting(settings.performanceMode, "auto");
  const filterToMatches = booleanSetting(settings.filterToMatches, false);
  const layoutIterations = numberSetting(settings.layoutIterations, 120);
  const labelMode = stringSetting(settings.labelMode, "auto");
  const sizeMetric = stringSetting(settings.sizeMetric, engine === "sigma" ? "degree" : "fixed");
  const focusNeighbors = booleanSetting(settings.focusNeighbors, false);
  const visibleGraph = useMemo(() => filterGraph(graph, highlighted, filterToMatches), [graph, highlighted, filterToMatches]);
  const performanceMode = inferGraphPerformanceMode(performanceModeSetting, visibleGraph);
  const graphMatches = useMemo(() => graphSearchMatches(visibleGraph, highlighted), [visibleGraph, highlighted]);
  const runtimeHighlighted = engine === "sigma" ? highlighted : "";
  const runtimeLayout = engine === "sigma" ? layout : "";
  const runtimeLayoutActionRevision = engine === "sigma" && toolbarAction?.action === "graph-run-layout" ? toolbarAction.revision : 0;
  const runtimeNodeSize = engine === "sigma" ? nodeSize : 0;
  const runtimeEdgeWidth = engine === "sigma" ? edgeWidth : 0;
  const runtimeLayoutIterations = engine === "sigma" ? layoutIterations : 0;
  const runtimeLabelMode = engine === "sigma" ? labelMode : "";
  const runtimeSizeMetric = engine === "sigma" ? sizeMetric : "";
  const runtimeFocusNeighbors = engine === "sigma" ? focusNeighbors : false;
  const runtimePerformanceMode = engine === "sigma" ? performanceMode : "";
  const runtimeShowArrows = engine === "sigma" ? showArrows : false;
  const runtimeShowLabels = engine === "sigma" ? showLabels : false;
  const runtimeShowEdgeLabels = engine === "sigma" ? showEdgeLabels : false;
  selectSourceRangeRef.current = onSelectSourceRange;

  useEffect(() => {
    setActiveMatchIndex(graphMatches.length ? 0 : -1);
  }, [graphMatches]);

  useEffect(() => {
    onSearchStateChange?.({ count: graphMatches.length, index: activeMatchIndex });
  }, [graphMatches.length, activeMatchIndex]);

  useEffect(() => {
    if (!searchCommand?.revision) {
      return;
    }
    setActiveMatchIndex((current) => {
      if (!graphMatches.length) {
        return -1;
      }
      const direction = searchCommand.direction === "previous" ? -1 : 1;
      return (current + direction + graphMatches.length) % graphMatches.length;
    });
  }, [searchCommand?.revision]);

  useEffect(() => {
    const match = graphMatches[activeMatchIndex];
    if (match) {
      setSelected(match);
    }
  }, [graphMatches, activeMatchIndex]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    let cleanup: (() => void) | undefined;
    setError("");

    async function mount() {
      if (!containerRef.current) {
        return;
      }
      containerRef.current.innerHTML = "";
      if (engine === "cytoscape") {
        const mod = await import("cytoscape");
        const cy = mod.default({
          container: containerRef.current,
          elements: [
            ...visibleGraph.nodes.map((node) => {
              const visual = graphNodeVisual(node, nodeSize);
              return {
                data: {
                  id: node.id,
                  label: node.label,
                  kind: node.type || "node",
                  size: visual.size,
                  color: visual.color,
                  textColor: visual.textColor,
                  fontSize: visual.fontSize,
                  fontWeight: visual.fontWeight,
                  borderColor: visual.borderColor,
                  borderWidth: visual.borderWidth,
                  shape: visual.shape,
                  opacity: visual.opacity,
                  details: graphNodeDetails(node),
                  sourceRange: node.sourceRange,
                  matched: highlighted && node.label.toLowerCase().includes(highlighted)
                }
              };
            }),
            ...visibleGraph.edges.map((edge, index) => {
              const visual = graphEdgeVisual(edge, edgeWidth);
              return {
                data: {
                  id: edge.id || `edge-${index}`,
                  source: edge.source,
                  target: edge.target,
                  label: edge.label || edge.type || "",
                  kind: edge.type || "edge",
                  width: visual.width,
                  color: visual.color,
                  lineStyle: visual.lineStyle,
                  curveStyle: visual.curveStyle,
                  opacity: visual.opacity,
                  sourceRange: edge.sourceRange,
                  details: edge.details || stringDataValue(edge.data?.details)
                }
              };
            })
          ],
          style: cytoscapeStyle(showLabels, showEdgeLabels, showArrows, performanceMode, visibleGraph.directed !== false) as never,
          layout: cytoscapeLayoutOptions(layout, visibleGraph, performanceMode, containerRef.current, concentricRingSpacing) as never
        });
        cyRef.current = cy as unknown as CytoscapeLike;
        const resizeObserver = new ResizeObserver(() => {
          cy.resize();
          cy.fit(undefined, 40);
        });
        resizeObserver.observe(containerRef.current);
        const updateSelection = () => setSelected(cytoscapeSelection(cy));
        cy.on("select unselect", "node, edge", updateSelection);
        cy.on("tap", "node, edge", (event) => {
          const original = event.originalEvent instanceof MouseEvent ? event.originalEvent : null;
          if (!original?.ctrlKey && !original?.metaKey) {
            return;
          }
          const range = event.target.data("sourceRange") as SourceRange | undefined;
          if (range) {
            selectSourceRangeRef.current?.(range);
          }
        });
        cy.on("dbltap", "node, edge", (event) => {
          event.target.unselect();
          updateSelection();
        });
        window.setTimeout(() => cy.fit(undefined, 40), 0);
        cleanup = () => {
          resizeObserver.disconnect();
          cy.destroy();
          cyRef.current = null;
        };
        return;
      }

      if (engine === "sigma") {
        const [GraphologyModule, SigmaModule, circularModule, randomModule, forceAtlasModule, noverlapModule, pagerankModule] = await Promise.all([
          import("graphology"),
          import("sigma"),
          import("graphology-layout/circular.js"),
          import("graphology-layout/random.js"),
          import("graphology-layout-forceatlas2"),
          import("graphology-layout-noverlap"),
          import("graphology-metrics/centrality/pagerank.js")
        ]);
        const Graphology = GraphologyModule.default;
        const Sigma = SigmaModule.default;
        const circularLayout = circularModule.default;
        const randomLayout = randomModule.default;
        const forceAtlas2 = forceAtlasModule.default;
        const noverlap = noverlapModule.default;
        const pagerank = pagerankModule.default;
        const g = new Graphology({ type: "mixed", multi: true, allowSelfLoops: true });
        visibleGraph.nodes.forEach((node) => {
          const visual = graphNodeVisual(node, nodeSize / 2);
          const position = graphNodePosition(node);
          g.addNode(node.id, {
            x: position.x,
            y: position.y,
            baseSize: visual.size,
            size: visual.size,
            label: node.label,
            color: highlighted && node.label.toLowerCase().includes(highlighted) ? "#cf6f2a" : visual.color,
            labelColor: visual.textColor,
            kind: node.type || "node",
            sourceRange: node.sourceRange,
            depth: node.data?.depth,
            rank: node.data?.rank,
            details: graphNodeDetails(node),
            style: node.style || node.data?.style,
            matched: Boolean(highlighted && [node.id, node.label, node.type].filter(Boolean).join(" ").toLowerCase().includes(highlighted))
          });
        });
        visibleGraph.edges.forEach((edge, index) => {
          if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
            const edgeKey = uniqueGraphologyEdgeKey(g, edge.id || `edge-${index}`);
            const visual = graphEdgeVisual(edge, edgeWidth);
            const attrs = {
              label: edge.label || edge.type || "",
              size: visual.width,
              color: visual.color,
              type: visibleGraph.directed !== false && showArrows ? "arrow" : "line",
              kind: edge.type || "edge",
              sourceRange: edge.sourceRange,
              details: edge.details || stringDataValue(edge.data?.details),
              style: edge.style || edge.data?.style,
              matched: Boolean(highlighted && [edge.id, edge.label, edge.type].filter(Boolean).join(" ").toLowerCase().includes(highlighted))
            };
            if (visibleGraph.directed === false) {
              g.addUndirectedEdgeWithKey(edgeKey, edge.source, edge.target, attrs);
            } else {
              g.addDirectedEdgeWithKey(edgeKey, edge.source, edge.target, attrs);
            }
          }
        });
        const pageranks = safePagerankValues(g, pagerank);
        const degrees = graphologyDegreeMap(g);
        const sizeDomain = metricDomain((g.nodes() as string[]).map((node) => (sizeMetric === "pagerank" ? pageranks.get(node) || 0 : degrees.get(node) || 0)));
        g.forEachNode((node: string, attrs: Record<string, unknown>) => {
          g.mergeNodeAttributes(node, {
            size: sizeMetric === "fixed" ? Number(attrs.baseSize) || nodeSize / 2 : sigmaNodeSize(node, nodeSize, sizeMetric, degrees, pageranks, sizeDomain)
          });
        });
        runSigmaGraphologyLayout(g, { circularLayout, randomLayout, forceAtlas2, noverlap }, layout, layoutIterations);
        const selectedNodes = new Set<string>();
        const selectedEdges = new Set<string>();
        let draggedNodes: { nodes: string[]; start: { x: number; y: number }; positions: Map<string, { x: number; y: number }>; moved: boolean } | null = null;
        let suppressNextSigmaClick = false;
        const matchedNodes = new Set<string>();
        if (highlighted) {
          g.forEachNode((node: string, attrs: { matched?: boolean }) => {
            if (attrs.matched) {
              matchedNodes.add(node);
            }
          });
        }
        const selectedNeighborhood = () => {
          const nodes = new Set<string>();
          selectedNodes.forEach((selectedNode) => {
            if (!g.hasNode(selectedNode)) {
              return;
            }
            nodes.add(selectedNode);
            g.neighbors(selectedNode).forEach((node: string) => nodes.add(node));
          });
          return nodes;
        };
        const publishSigmaSelection = () => {
          setSelected(sigmaSelectionFromSets(g, selectedNodes, selectedEdges));
          renderer.refresh();
        };
        const renderer = new Sigma(g, containerRef.current, {
          defaultNodeColor: "#3a6ea5",
          defaultEdgeColor: "#87939f",
          defaultEdgeType: visibleGraph.directed !== false && showArrows ? "arrow" : "line",
          renderEdgeLabels: showEdgeLabels,
          enableEdgeEvents: true,
          zIndex: true,
          labelDensity: performanceMode === "readable" ? 1 : 0.4,
          nodeReducer(node: string, data: Record<string, unknown>) {
            const neighborhood = focusNeighbors ? selectedNeighborhood() : null;
            const selected = selectedNodes.has(node);
            const mutedByFocus = Boolean(neighborhood && neighborhood.size && !neighborhood.has(node));
            const mutedBySearch = Boolean(matchedNodes.size && !matchedNodes.has(node));
            return {
              ...data,
              label: labelMode === "none" || !showLabels || performanceMode === "dense" ? "" : String(data.label || ""),
              color: selected ? "#111827" : mutedByFocus || mutedBySearch ? "#bac2c7" : String(data.color || "#3a6ea5"),
              labelColor: { color: String(data.labelColor || "#202225") },
              size: selected ? Math.max(5, Number(data.size) * 1.25) : mutedByFocus || mutedBySearch ? Math.max(2, Number(data.size) * 0.5) : Number(data.size) || nodeSize / 2,
              forceLabel: labelMode === "all" || selected || matchedNodes.has(node),
              highlighted: selected || matchedNodes.has(node),
              zIndex: selected ? 10 : 0
            };
          },
          edgeReducer(edge: string, data: Record<string, unknown>) {
            const source = g.source(edge);
            const target = g.target(edge);
            const neighborhood = focusNeighbors ? selectedNeighborhood() : null;
            const selected = selectedEdges.has(edge);
            const outsideFocus = Boolean(neighborhood && neighborhood.size && (!neighborhood.has(source) || !neighborhood.has(target)));
            const outsideSearch = Boolean(matchedNodes.size && !matchedNodes.has(source) && !matchedNodes.has(target) && !data.matched);
            return {
              ...data,
              label: showEdgeLabels ? String(data.label || "") : "",
              color: selected ? "#111827" : outsideFocus || outsideSearch ? "#d2d7dc" : String(data.color || "#87939f"),
              size: selected ? Math.max(3, Number(data.size) * 1.6) : outsideFocus || outsideSearch ? 0.5 : Number(data.size) || edgeWidth,
              type: visibleGraph.directed !== false && showArrows ? "arrow" : "line",
              hidden: outsideFocus,
              forceLabel: showEdgeLabels || selected,
              zIndex: selected ? 9 : 0
            };
          }
        });
        renderer.on("downNode", ({ node, event }) => {
          const original = event.original instanceof MouseEvent ? event.original : null;
          const shift = Boolean(original?.shiftKey);
          if (!selectedNodes.has(node) && !shift) {
            selectedNodes.clear();
            selectedEdges.clear();
            selectedNodes.add(node);
            publishSigmaSelection();
          }
          const dragSelection = selectedNodes.has(node) ? Array.from(selectedNodes) : [node];
          const start = renderer.viewportToGraph({ x: event.x, y: event.y });
          draggedNodes = {
            nodes: dragSelection,
            start,
            positions: new Map(dragSelection.map((selectedNode) => [selectedNode, { x: Number(g.getNodeAttribute(selectedNode, "x")) || 0, y: Number(g.getNodeAttribute(selectedNode, "y")) || 0 }])),
            moved: false
          };
          renderer.setSetting("enableCameraPanning", false);
          event.preventSigmaDefault();
        });
        renderer.getMouseCaptor().on("mousemove", (event) => {
          if (!draggedNodes) {
            return;
          }
          const next = renderer.viewportToGraph({ x: event.x, y: event.y });
          const dx = next.x - draggedNodes.start.x;
          const dy = next.y - draggedNodes.start.y;
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            draggedNodes.moved = true;
          }
          draggedNodes.positions.forEach((position, node) => {
            g.mergeNodeAttributes(node, { x: position.x + dx, y: position.y + dy });
          });
          renderer.refresh({ partialGraph: { nodes: draggedNodes.nodes }, skipIndexation: true });
          event.preventSigmaDefault();
        });
        renderer.getMouseCaptor().on("mouseup", () => {
          if (!draggedNodes) {
            return;
          }
          suppressNextSigmaClick = draggedNodes.moved;
          draggedNodes = null;
          renderer.setSetting("enableCameraPanning", true);
          renderer.refresh();
        });
        renderer.on("clickNode", ({ node, event }) => {
          const original = event.original instanceof MouseEvent ? event.original : null;
          const shift = Boolean(original?.shiftKey);
          if (original?.ctrlKey || original?.metaKey) {
            const range = g.getNodeAttribute?.(node, "sourceRange") as SourceRange | undefined;
            if (range) {
              selectSourceRangeRef.current?.(range);
            }
          }
          if (suppressNextSigmaClick) {
            suppressNextSigmaClick = false;
            return;
          }
          if (shift) {
            selectedEdges.clear();
            if (selectedNodes.has(node)) {
              selectedNodes.delete(node);
            } else {
              selectedNodes.add(node);
            }
          } else {
            selectedNodes.clear();
            selectedEdges.clear();
            selectedNodes.add(node);
          }
          publishSigmaSelection();
          event.preventSigmaDefault();
        });
        renderer.on("clickEdge", ({ edge, event }) => {
          const original = event.original instanceof MouseEvent ? event.original : null;
          const shift = Boolean(original?.shiftKey);
          if (original?.ctrlKey || original?.metaKey) {
            const range = g.getEdgeAttribute?.(edge, "sourceRange") as SourceRange | undefined;
            if (range) {
              selectSourceRangeRef.current?.(range);
            }
          }
          if (shift) {
            selectedNodes.clear();
            if (selectedEdges.has(edge)) {
              selectedEdges.delete(edge);
            } else {
              selectedEdges.add(edge);
            }
          } else {
            selectedNodes.clear();
            selectedEdges.clear();
            selectedEdges.add(edge);
          }
          publishSigmaSelection();
          event.preventSigmaDefault();
        });
        renderer.on("clickStage", () => {
          selectedNodes.clear();
          selectedEdges.clear();
          setSelected(null);
          renderer.refresh();
        });
        sigmaRuntimeRef.current = {
          selectBySourceRange(range: SourceRange) {
            const match = graphSelectionForSourceRange(visibleGraph, range);
            if (!match) {
              return;
            }
            selectedNodes.clear();
            selectedEdges.clear();
            if (match.kind === "node") {
              selectedNodes.add(match.id);
            } else if (match.kind === "edge") {
              selectedEdges.add(match.id);
            }
            setSelected(match);
            publishSigmaSelection();
          }
        };
        if (sourceSelection) {
          sigmaRuntimeRef.current.selectBySourceRange(sourceSelection.sourceRange);
        }
        cleanup = () => {
          sigmaRuntimeRef.current = null;
          renderer.kill();
        };
      }
    }

    mount().catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });

    return () => cleanup?.();
  }, [
    visibleGraph,
    engine,
    runtimeHighlighted,
    runtimeLayout,
    runtimeLayoutActionRevision,
    runtimeNodeSize,
    runtimeEdgeWidth,
    runtimeLayoutIterations,
    runtimeLabelMode,
    runtimeSizeMetric,
    runtimeFocusNeighbors,
    runtimePerformanceMode,
    runtimeShowArrows,
    runtimeShowLabels,
    runtimeShowEdgeLabels
  ]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.style(cytoscapeStyle(showLabels, showEdgeLabels, showArrows, performanceMode, visibleGraph.directed !== false)).update();
  }, [showLabels, showEdgeLabels, showArrows, performanceMode, visibleGraph.directed]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    const nodes = new Map(visibleGraph.nodes.map((node) => [node.id, node]));
    const edges = new Map(visibleGraph.edges.map((edge, index) => [edge.id || `edge-${index}`, edge]));
    cy.nodes().forEach((element) => {
      const node = nodes.get(element.id());
      if (!node) {
        return;
      }
      const visual = graphNodeVisual(node, nodeSize);
      element.data("size", visual.size);
      element.data("color", visual.color);
      element.data("textColor", visual.textColor);
      element.data("fontSize", visual.fontSize);
      element.data("fontWeight", visual.fontWeight);
      element.data("borderColor", visual.borderColor);
      element.data("borderWidth", visual.borderWidth);
      element.data("shape", visual.shape);
      element.data("opacity", visual.opacity);
      element.data("details", graphNodeDetails(node));
    });
    cy.edges().forEach((element) => {
      const edge = edges.get(element.id());
      if (!edge) {
        return;
      }
      const visual = graphEdgeVisual(edge, edgeWidth);
      element.data("width", visual.width);
      element.data("color", visual.color);
      element.data("lineStyle", visual.lineStyle);
      element.data("curveStyle", visual.curveStyle);
      element.data("opacity", visual.opacity);
      element.data("details", edge.details || stringDataValue(edge.data?.details));
    });
  }, [visibleGraph, nodeSize, edgeWidth]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.elements().removeClass("tf-match tf-active");
    graphMatches.forEach((match) => cy.getElementById(match.id).addClass("tf-match"));
    const active = graphMatches[activeMatchIndex];
    if (active) {
      const element = cy.getElementById(active.id);
      element.addClass("tf-active");
      cy.animate({ center: { eles: element }, zoom: Math.max(cy.zoom(), 1.2) }, { duration: 160 });
    }
  }, [graphMatches, activeMatchIndex]);

  useEffect(() => {
    if (!sourceSelection) {
      return;
    }
    const match = graphSelectionForSourceRange(visibleGraph, sourceSelection.sourceRange);
    if (!match) {
      return;
    }
    setSelected(match);
    const cy = cyRef.current;
    if (cy) {
      cy.elements().removeClass("tf-source");
      const element = cy.getElementById(match.id);
      element.addClass("tf-source");
      cy.animate({ center: { eles: element }, zoom: Math.max(cy.zoom(), 1.2) }, { duration: 160 });
    }
    sigmaRuntimeRef.current?.selectBySourceRange(sourceSelection.sourceRange);
  }, [sourceSelection?.revision, visibleGraph]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || toolbarAction?.action !== "graph-run-layout" || !toolbarAction.revision) {
      return;
    }
    runCytoscapeLayout(cy, layout, visibleGraph, performanceMode, containerRef.current, concentricRingSpacing);
  }, [toolbarAction?.revision]);

  if (error) {
    return <StaticGraph graph={graph} error={error} />;
  }
  return (
    <div class={`graph-view-wrap viewer-bg-${background}`}>
      <div class="graph-canvas" ref={containerRef} />
      <ViewerInspector
        title="Inspector"
        emptyText="Select a node or edge."
        item={
          selected
            ? {
                kind: selected.kind,
                title: selected.label,
                details: selected.details,
                rows: [
                  { label: "ID", value: selected.id },
                  ...(selected.type ? [{ label: "Type", value: selected.type }] : []),
                  ...selected.rows,
                  { label: "Visible", value: `${visibleGraph.nodes.length} of ${graph.nodes.length} nodes, ${visibleGraph.edges.length} of ${graph.edges.length} edges` },
                  { label: "Layout", value: layout }
                ]
              }
            : null
        }
      />
    </div>
  );
}

function StaticGraph({ graph, error }: { graph: GraphViewModel; error: string }) {
  return (
    <div class="static-graph">
      <p>Interactive graph runtime failed: {error}</p>
      <ul>
        {graph.nodes.map((node) => (
          <li key={node.id}>
            <strong>{node.label}</strong>
            <span>{graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length} links</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface GraphSelection {
  id: string;
  label: string;
  kind: "node" | "edge" | "selection";
  type?: string;
  details?: string;
  sourceRange?: SourceRange;
  rows: InspectorItem["rows"];
}

interface SigmaRuntime {
  selectBySourceRange(range: SourceRange): void;
}

interface CytoscapeElementLike {
  id(): string;
  isNode(): boolean;
  data(key: string): unknown;
  data(key: string, value: unknown): void;
  unselect?(): void;
}

interface CytoscapeCollectionLike {
  length: number;
  forEach(callback: (element: CytoscapeElementLike) => void): void;
}

interface CytoscapeLike {
  resize(): void;
  fit(elements?: unknown, padding?: number): void;
  destroy(): void;
  zoom(): number;
  style(style: unknown): { update(): void };
  elements(): { removeClass(className: string): void };
  nodes(): { forEach(callback: (element: CytoscapeElementLike) => void): void };
  edges(): { forEach(callback: (element: CytoscapeElementLike) => void): void };
  getElementById(id: string): { addClass(className: string): void };
  animate(properties: unknown, options?: unknown): void;
  layout(options: unknown): CytoscapeLayoutRunLike;
}

interface CytoscapeLayoutRunLike {
  run(): void;
  on?(event: string, callback: () => void): void;
}

function cytoscapeStyle(showLabels: boolean, showEdgeLabels: boolean, showArrows: boolean, performanceMode: string, directed: boolean) {
  return [
    {
      selector: "node",
      style: {
        label: showLabels && performanceMode !== "dense" ? "data(label)" : "",
        "background-color": "data(color)",
        shape: "data(shape)",
        width: "data(size)",
        height: "data(size)",
        color: "data(textColor)",
        "font-size": "data(fontSize)",
        "font-weight": "data(fontWeight)",
        "text-valign": "bottom",
        "text-margin-y": 5,
        "border-color": "data(borderColor)",
        "border-width": "data(borderWidth)",
        opacity: "data(opacity)"
      }
    },
    {
      selector: "node.tf-match",
      style: { "background-color": "#cf6f2a", "border-width": 3, "border-color": "#1f1f1f" }
    },
    {
      selector: "node.tf-active",
      style: { "background-color": "#111827", "border-width": 4, "border-color": "#ffe28a", color: "#111827" }
    },
    {
      selector: "node.tf-source",
      style: { "border-width": 5, "border-color": "#2f80ed", "overlay-color": "#2f80ed", "overlay-opacity": 0.12 }
    },
    {
      selector: "node:selected",
      style: {
        "border-width": 5,
        "border-color": "#ffe28a",
        "overlay-color": "#111827",
        "overlay-opacity": 0.14,
        "z-index": 20
      }
    },
    {
      selector: "edge",
      style: {
        width: "data(width)",
        "line-color": "data(color)",
        "target-arrow-color": "data(color)",
        "target-arrow-shape": directed && showArrows ? "triangle" : "none",
        "curve-style": "data(curveStyle)",
        "line-style": "data(lineStyle)",
        label: showEdgeLabels && performanceMode === "readable" ? "data(label)" : "",
        "font-size": 9,
        opacity: "data(opacity)"
      }
    },
    {
      selector: "edge.tf-match",
      style: { "line-color": "#cf6f2a", "target-arrow-color": "#cf6f2a", width: 3 }
    },
    {
      selector: "edge.tf-active",
      style: { "line-color": "#111827", "target-arrow-color": "#111827", width: 5 }
    },
    {
      selector: "edge.tf-source",
      style: { "line-color": "#2f80ed", "target-arrow-color": "#2f80ed", width: 5 }
    },
    {
      selector: "edge:selected",
      style: {
        "line-color": "#111827",
        "target-arrow-color": "#111827",
        width: 5,
        "overlay-color": "#ffe28a",
        "overlay-opacity": 0.22
      }
    }
  ];
}

function inferGraphPerformanceMode(setting: string, graph: GraphViewModel): string {
  if (setting !== "auto") {
    return setting;
  }
  if (graph.nodes.length < READABLE_GRAPH_NODE_LIMIT) {
    return "readable";
  }
  if (graph.nodes.length > DENSE_GRAPH_NODE_LIMIT || graph.edges.length > DENSE_GRAPH_EDGE_LIMIT) {
    return "dense";
  }
  return "balanced";
}

function cytoscapeLayoutOptions(
  layout: string,
  graph: GraphViewModel,
  performanceMode: string,
  container: HTMLElement | null,
  concentricRingSpacing = 1
): Record<string, unknown> {
  const padding = performanceMode === "dense" ? 24 : 40;
  const options: Record<string, unknown> = {
    name: layout,
    directed: graph.directed !== false,
    fit: true,
    padding,
    animate: performanceMode === "readable"
  };
  if (layout === "cose") {
    Object.assign(options, {
      randomize: true,
      nodeOverlap: 20,
      idealEdgeLength: performanceMode === "readable" ? 92 : 72,
      componentSpacing: performanceMode === "readable" ? 90 : 64,
      boundingBox: {
        x1: 0,
        y1: 0,
        w: Math.max(360, container?.clientWidth || 0),
        h: Math.max(260, container?.clientHeight || 0)
      }
    });
  }
  if (layout === "breadthfirst") {
    Object.assign(options, { spacingFactor: performanceMode === "readable" ? 1.15 : 0.95, avoidOverlap: true });
  }
  if (layout === "circle" || layout === "grid" || layout === "random") {
    Object.assign(options, { spacingFactor: performanceMode === "readable" ? 1.05 : 0.9, avoidOverlap: true });
  }
  if (layout === "concentric") {
    const baseSpacingFactor = performanceMode === "readable" ? 1.05 : 0.9;
    Object.assign(options, { spacingFactor: baseSpacingFactor * clamp(concentricRingSpacing, 0.5, 3), avoidOverlap: true });
  }
  return options;
}

function runCytoscapeLayout(
  cy: CytoscapeLike,
  layout: string,
  graph: GraphViewModel,
  performanceMode: string,
  container: HTMLElement | null,
  concentricRingSpacing = 1
): void {
  const options = cytoscapeLayoutOptions(layout, graph, performanceMode, container, concentricRingSpacing);
  const runner = cy.layout(options);
  let didFit = false;
  const fit = () => {
    if (didFit) {
      return;
    }
    didFit = true;
    cy.fit(undefined, Number(options.padding) || 40);
  };
  runner.on?.("layoutstop", fit);
  runner.run();
  window.setTimeout(fit, layout === "cose" ? 360 : 80);
}

function cytoscapeSelection(cy: unknown): GraphSelection | null {
  const collection = (cy as { $?: (selector: string) => CytoscapeCollectionLike }).$?.(":selected");
  if (!collection?.length) {
    return null;
  }
  const elements: CytoscapeElementLike[] = [];
  collection.forEach((element) => elements.push(element));
  if (elements.length === 1) {
    const element = elements[0];
    return {
      id: element.id(),
      label: String(element.data("label") || element.id()),
      kind: element.isNode() ? "node" : "edge",
      type: String(element.data("kind") || element.data("label") || ""),
      details: stringDataValue(element.data("details")),
      sourceRange: element.data("sourceRange") as SourceRange | undefined,
      rows: graphElementRows(element)
    };
  }
  const nodeIds = elements.filter((element) => element.isNode()).map((element) => element.id());
  const edgeIds = elements.filter((element) => !element.isNode()).map((element) => element.id());
  return {
    id: "multi-selection",
    label: `${elements.length} selected`,
    kind: "selection",
    rows: [
      { label: "Nodes", value: String(nodeIds.length) },
      { label: "Edges", value: String(edgeIds.length) },
      { label: "IDs", value: [...nodeIds, ...edgeIds].slice(0, 16).join(", ") || "-" }
    ]
  };
}

function sigmaSelectionFromSets(graph: GraphologyLike, selectedNodes: Set<string>, selectedEdges: Set<string>): GraphSelection | null {
  const nodeIds = Array.from(selectedNodes).filter((node) => graph.hasNode?.(node) !== false);
  const edgeIds = Array.from(selectedEdges).filter((edge) => graph.hasEdge?.(edge) !== false);
  if (nodeIds.length === 1 && edgeIds.length === 0) {
    const node = nodeIds[0];
    return {
      id: node,
      label: String(graph.getNodeAttribute?.(node, "label") || node),
      kind: "node",
      type: String(graph.getNodeAttribute?.(node, "kind") || ""),
      details: stringDataValue(graph.getNodeAttribute?.(node, "details")),
      sourceRange: graph.getNodeAttribute?.(node, "sourceRange") as SourceRange | undefined,
      rows: sigmaNodeRows(graph, node)
    };
  }
  if (edgeIds.length === 1 && nodeIds.length === 0) {
    const edge = edgeIds[0];
    return {
      id: edge,
      label: String(graph.getEdgeAttribute?.(edge, "label") || edge),
      kind: "edge",
      type: String(graph.getEdgeAttribute?.(edge, "kind") || ""),
      details: stringDataValue(graph.getEdgeAttribute?.(edge, "details")),
      sourceRange: graph.getEdgeAttribute?.(edge, "sourceRange") as SourceRange | undefined,
      rows: sigmaEdgeRows(graph, edge)
    };
  }
  if (!nodeIds.length && !edgeIds.length) {
    return null;
  }
  return {
    id: "multi-selection",
    label: `${nodeIds.length + edgeIds.length} selected`,
    kind: "selection",
    rows: [
      { label: "Nodes", value: String(nodeIds.length) },
      { label: "Edges", value: String(edgeIds.length) },
      { label: "IDs", value: [...nodeIds, ...edgeIds].slice(0, 16).join(", ") || "-" }
    ]
  };
}

function sigmaNodeRows(graph: GraphologyLike, node: string): InspectorItem["rows"] {
  const rows: InspectorItem["rows"] = [
    { label: "Type", value: String(graph.getNodeAttribute?.(node, "kind") || "node") },
    { label: "Degree", value: String(graph.degree?.(node) || 0) }
  ];
  const depth = graph.getNodeAttribute?.(node, "depth");
  const rank = graph.getNodeAttribute?.(node, "rank");
  if (depth !== undefined) {
    rows.push({ label: "Depth", value: String(depth) });
  }
  if (rank !== undefined) {
    rows.push({ label: "Rank", value: String(rank) });
  }
  return rows;
}

function sigmaEdgeRows(graph: GraphologyLike, edge: string): InspectorItem["rows"] {
  const [source, target] = graph.extremities?.(edge) || [graph.source?.(edge) || "", graph.target?.(edge) || ""];
  const rows: InspectorItem["rows"] = [
    { label: "Source", value: source },
    { label: "Target", value: target }
  ];
  const label = graph.getEdgeAttribute?.(edge, "label");
  if (label) {
    rows.push({ label: "Label", value: String(label) });
  }
  return rows;
}

function graphElementRows(element: CytoscapeElementLike): InspectorItem["rows"] {
  const rows: InspectorItem["rows"] = [];
  if (!element.isNode()) {
    rows.push({ label: "Source", value: String(element.data("source") || "") });
    rows.push({ label: "Target", value: String(element.data("target") || "") });
  }
  const label = element.data("label");
  const size = element.data("size") || element.data("width");
  if (label) {
    rows.push({ label: "Label", value: String(label) });
  }
  if (size) {
    rows.push({ label: element.isNode() ? "Size" : "Width", value: String(size) });
  }
  return rows;
}

function graphSearchMatches(graph: GraphViewModel, query: string): GraphSelection[] {
  if (!query) {
    return [];
  }
  const matches: GraphSelection[] = [];
  graph.nodes.forEach((node) => {
    const haystack = [node.id, node.label, node.type, ...(node.classes || [])].filter(Boolean).join(" ").toLowerCase();
    if (haystack.includes(query)) {
      matches.push({
        id: node.id,
        label: node.label,
        kind: "node",
        type: node.type,
        details: graphNodeDetails(node),
        sourceRange: node.sourceRange,
        rows: [
          { label: "Degree", value: String(graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length) }
        ]
      });
    }
  });
  graph.edges.forEach((edge, index) => {
    const id = edge.id || `edge-${index}`;
    const haystack = [id, edge.label, edge.type, edge.source, edge.target, ...graphEdgeClasses(edge)].filter(Boolean).join(" ").toLowerCase();
    if (haystack.includes(query)) {
      matches.push({
        id,
        label: edge.label || edge.type || id,
        kind: "edge",
        type: edge.type,
        details: edge.details || stringDataValue(edge.data?.details),
        sourceRange: edge.sourceRange,
        rows: [
          { label: "Source", value: edge.source },
          { label: "Target", value: edge.target },
          ...(graphEdgeWeight(edge) !== undefined ? [{ label: "Weight", value: String(graphEdgeWeight(edge)) }] : [])
        ]
      });
    }
  });
  return matches;
}

function graphSelectionForSourceRange(graph: GraphViewModel, range: SourceRange): GraphSelection | null {
  const node = bestSourceRangeMatch(graph.nodes, range);
  const edge = bestSourceRangeMatch(graph.edges, range);
  if (edge && (!node || sourceRangeSpan(edge.sourceRange) <= sourceRangeSpan(node.sourceRange))) {
    const edgeIndex = graph.edges.findIndex((candidate) => candidate === edge);
    const id = edge.id || `edge-${edgeIndex}`;
    return {
      id,
      label: edge.label || edge.type || id,
      kind: "edge",
      type: edge.type,
      details: edge.details || stringDataValue(edge.data?.details),
      sourceRange: edge.sourceRange,
      rows: [
        { label: "Source", value: edge.source },
        { label: "Target", value: edge.target },
        ...(edge.weight !== undefined ? [{ label: "Weight", value: String(edge.weight) }] : [])
      ]
    };
  }
  if (node) {
    return {
      id: node.id,
      label: node.label,
      kind: "node",
      type: node.type,
      details: graphNodeDetails(node),
      sourceRange: node.sourceRange,
      rows: [
        { label: "Degree", value: String(graph.edges.filter((candidate) => candidate.source === node.id || candidate.target === node.id).length) }
      ]
    };
  }
  return null;
}

function treeNodeForSourceRange(nodes: TreeNode[], range: SourceRange): TreeNode | undefined {
  return bestSourceRangeMatch(flattenTreeNodes(nodes), range);
}

function itmEntityForSourceRange(nodes: ResolvedItmEntity[], range: SourceRange, sourceText?: string): ResolvedItmEntity | undefined {
  return bestSourceRangeMatch(flattenItmEntities(nodes), range, (entity) => getSourceRange(entity.sourceRange, sourceText));
}

function bestSourceRangeMatch<T>(items: T[], range: SourceRange, getRange: (item: T) => SourceRange | undefined = (item) => (item as { sourceRange?: SourceRange }).sourceRange): T | undefined {
  return items
    .filter((item) => {
      const itemRange = getRange(item);
      return itemRange && sourceRangesTouch(itemRange, range);
    })
    .sort((left, right) => sourceRangeSpan(getRange(left)) - sourceRangeSpan(getRange(right)))[0];
}

function sourceRangesTouch(left: SourceRange | undefined, right: SourceRange): boolean {
  if (!left) {
    return false;
  }
  const cursor = right.from === right.to;
  if (cursor) {
    return right.from >= left.from && right.from <= left.to;
  }
  return left.from <= right.to && right.from <= left.to;
}

function sourceRangeSpan(range: SourceRange | undefined): number {
  return range ? Math.max(0, range.to - range.from) : Number.POSITIVE_INFINITY;
}

function applyMarkdownSourceSelection(root: HTMLElement | null, range: SourceRange | undefined): void {
  if (!root) {
    return;
  }
  root.querySelectorAll(".tf-source-selected").forEach((element) => element.classList.remove("tf-source-selected"));
  if (!range) {
    return;
  }
  const match = Array.from(root.querySelectorAll<HTMLElement>(".tf-source-bridge"))
    .map((element) => ({ element, range: elementSourceRange(element) }))
    .filter((entry): entry is { element: HTMLElement; range: SourceRange } => Boolean(entry.range && sourceRangesTouch(entry.range, range)))
    .sort((left, right) => sourceRangeSpan(left.range) - sourceRangeSpan(right.range))[0];
  if (!match) {
    return;
  }
  match.element.classList.add("tf-source-selected");
  match.element.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

function elementSourceRange(element: HTMLElement): SourceRange | null {
  const from = Number.parseInt(element.dataset.sourceFrom || "", 10);
  const to = Number.parseInt(element.dataset.sourceTo || "", 10);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return null;
  }
  return {
    from,
    to,
    line: 0,
    column: 0
  };
}

interface InspectorItem {
  kind: string;
  title: string;
  rows: Array<{ label: string; value: string | JSX.Element }>;
  details?: string;
}

function ViewerInspector({ title, item, emptyText }: { title: string; item: InspectorItem | null; emptyText: string }) {
  return (
    <aside class="viewer-inspector">
      <strong>{title}</strong>
      {item ? (
        <>
          <span>{item.kind}</span>
          <h3>{item.title}</h3>
          {item.details ? <pre>{item.details}</pre> : null}
          <dl>
            {item.rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p>{emptyText}</p>
      )}
    </aside>
  );
}

function stringSetting(value: ViewerSettingValue | undefined, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function numberSetting(value: ViewerSettingValue | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanSetting(value: ViewerSettingValue | undefined, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function typeColor(type: string): string {
  const palette = ["#3a6ea5", "#7b8f3a", "#b26b2e", "#8f5c8a", "#2f8f83", "#9a514e"];
  let hash = 0;
  for (let index = 0; index < type.length; index += 1) {
    hash = (hash * 29 + type.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

function graphNodePosition(node: GraphViewNode): Point {
  const rawX = "x" in node ? node.x : undefined;
  const rawY = "y" in node ? node.y : undefined;
  const x = typeof rawX === "number" && Number.isFinite(rawX) ? rawX : 0;
  const y = typeof rawY === "number" && Number.isFinite(rawY) ? rawY : 0;
  return { x, y };
}

function graphNodeConfiguredColor(node: GraphViewNode): string | undefined {
  return "color" in node ? node.color : undefined;
}

function graphNodeConfiguredSize(node: GraphViewNode): number | undefined {
  return "size" in node ? node.size : undefined;
}

function graphEdgeClasses(edge: GraphViewEdge): string[] {
  return "classes" in edge && Array.isArray(edge.classes) ? edge.classes : [];
}

function graphEdgeWeight(edge: GraphViewEdge): number | undefined {
  return "weight" in edge ? edge.weight : undefined;
}

function graphNodeColor(node: GraphViewNode): string {
  const color = graphNodeConfiguredColor(node);
  if (color) {
    return color;
  }
  const depth = Number(node.data?.depth);
  if (Number.isFinite(depth)) {
    return depthColor(depth);
  }
  return node.type && node.type !== "node" ? typeColor(node.type) : "#3a6ea5";
}

function depthColor(depth: number): string {
  const palette = ["#3a6ea5", "#5aa36f", "#d7a12f", "#8b67c7", "#4bb3b4", "#9a514e"];
  return palette[Math.max(0, Math.round(depth)) % palette.length];
}

function effectiveViewerStyle(node: TreeNode): Record<string, string> {
  return { ...(node.style || {}), ...(node.attributes || {}) };
}

function treeNodeVisualStyle(node: TreeNode): JSX.CSSProperties {
  const style = effectiveViewerStyle(node);
  const background = safeCssColor(firstStyleAttribute(style, ["background-color", "backgroundColor", "background", "bg", "fill"]));
  const foreground = safeCssColor(firstStyleAttribute(style, ["foreground-color", "foregroundColor", "text-color", "textColor", "fg", "color"]));
  const borderColor = safeCssColor(firstStyleAttribute(style, ["border-color", "borderColor", "stroke"]));
  const borderWidth = safeCssLength(firstStyleAttribute(style, ["border-width", "borderWidth", "stroke-width"]));
  const fontSize = safeCssLength(firstStyleAttribute(style, ["font-size", "fontSize"]));
  const fontWeight = safeCssFontWeight(firstStyleAttribute(style, ["font-weight", "fontWeight", "weight"]));
  const fontStyle = safeCssFontStyle(firstStyleAttribute(style, ["font-style", "fontStyle", "style"]));
  const opacity = safeCssOpacity(firstStyleAttribute(style, ["opacity"]));
  const shape = firstStyleAttribute(style, ["shape", "node-shape", "nodeShape"])?.toLowerCase();
  return {
    ...(background ? { backgroundColor: background } : {}),
    ...(foreground ? { color: foreground } : {}),
    ...(borderColor ? { borderColor, borderStyle: "solid" } : {}),
    ...(borderWidth ? { borderWidth, borderStyle: "solid" } : {}),
    ...(fontSize ? { fontSize } : {}),
    ...(fontWeight ? { fontWeight } : {}),
    ...(fontStyle ? { fontStyle } : {}),
    ...(opacity ? { opacity } : {}),
    ...(shape ? { borderRadius: mindMapShapeRadius(shape) } : {})
  };
}

function graphNodeVisual(node: GraphViewNode, fallbackSize: number) {
  const style = graphStyleRecord(node.style || node.data?.style);
  const color = graphNodeConfiguredColor(node) || safeCssColor(firstStyleAttribute(style, ["background-color", "backgroundColor", "background", "bg", "fill"])) || graphNodeColor(node);
  const textColor = safeCssColor(firstStyleAttribute(style, ["foreground-color", "foregroundColor", "text-color", "textColor", "fg", "color"])) || "#202225";
  const fontSize = safePositiveNumber(firstStyleAttribute(style, ["font-size", "fontSize"])) || 12;
  const fontWeight = safeCssFontWeight(firstStyleAttribute(style, ["font-weight", "fontWeight", "weight"])) || "500";
  const borderColor = safeCssColor(firstStyleAttribute(style, ["border-color", "borderColor", "stroke"])) || "#7d8b94";
  const borderWidth = safePositiveNumber(firstStyleAttribute(style, ["border-width", "borderWidth", "stroke-width"])) || 0;
  const opacity = safeCssOpacity(firstStyleAttribute(style, ["opacity"])) || "1";
  const shape = cytoscapeNodeShape(firstStyleAttribute(style, ["shape", "node-shape", "nodeShape"]));
  return {
    color,
    textColor,
    fontSize,
    fontWeight,
    borderColor,
    borderWidth,
    opacity,
    shape,
    size: graphNodeConfiguredSize(node) || safePositiveNumber(firstStyleAttribute(style, ["size", "node-size", "nodeSize", "width"])) || fallbackSize
  };
}

function graphEdgeVisual(edge: GraphViewEdge, fallbackWidth: number) {
  const style = graphStyleRecord(edge.style || edge.data?.style);
  const lineStyle = edgeLineStyle(style);
  return {
    color: edge.color || safeCssColor(firstStyleAttribute(style, ["stroke", "line-color", "lineColor", "edge-color", "edgeColor", "link-color", "linkColor", "color"])) || "#87939f",
    width: edge.width || safePositiveNumber(firstStyleAttribute(style, ["stroke-width", "line-width", "lineWidth", "edge-width", "edgeWidth", "link-width", "linkWidth", "width"])) || fallbackWidth,
    lineStyle,
    curveStyle: cytoscapeCurveStyle(firstStyleAttribute(style, ["curve", "curve-style", "curveStyle"])),
    opacity: safeCssOpacity(firstStyleAttribute(style, ["opacity"])) || "1"
  };
}

function graphStyleRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => key && (typeof item === "string" || typeof item === "number"))
      .map(([key, item]) => [key, String(item)])
  );
}

function graphNodeDetails(node: GraphViewNode): string | undefined {
  return node.details || stringDataValue(node.data?.details);
}

function stringDataValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function safeCssFontWeight(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^(normal|bold|bolder|lighter|[1-9]00)$/i.test(trimmed) ? trimmed : undefined;
}

function safeCssFontStyle(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^(normal|italic|oblique)$/i.test(trimmed) ? trimmed : undefined;
}

function safeCssOpacity(value: string | undefined): string | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(clamp(parsed, 0, 1)) : undefined;
}

function cytoscapeNodeShape(value: string | undefined): string {
  const shape = value?.trim().toLowerCase();
  if (shape === "rectangle" || shape === "square") {
    return "rectangle";
  }
  if (shape === "round" || shape === "rounded" || shape === "pill" || shape === "capsule") {
    return "round-rectangle";
  }
  if (shape === "diamond" || shape === "hexagon" || shape === "heptagon" || shape === "octagon" || shape === "star" || shape === "triangle" || shape === "vee" || shape === "tag") {
    return shape;
  }
  return "ellipse";
}

function cytoscapeCurveStyle(value: string | undefined): string {
  const curve = value?.trim().toLowerCase();
  if (curve === "straight" || curve === "taxi" || curve === "segments" || curve === "haystack") {
    return curve;
  }
  return "bezier";
}

function edgeLineStyle(style: Record<string, string>): string {
  const lineStyle = firstStyleAttribute(style, ["line-style", "lineStyle", "stroke-style", "strokeStyle"])?.trim().toLowerCase();
  if (lineStyle === "dashed" || lineStyle === "dotted" || lineStyle === "solid") {
    return lineStyle;
  }
  return firstStyleAttribute(style, ["stroke-dasharray", "strokeDasharray"]) ? "dashed" : "solid";
}

function indexTreeNodes(nodes: TreeNode[], map = new Map<string, TreeNode>()): Map<string, TreeNode> {
  nodes.forEach((node) => {
    map.set(node.id, node);
    if (node.declaredId) {
      map.set(node.declaredId, node);
    }
    indexTreeNodes(node.children, map);
  });
  return map;
}

function indexItmEntities(nodes: ResolvedItmEntity[], map = new Map<string, ResolvedItmEntity>()): Map<string, ResolvedItmEntity> {
  nodes.forEach((node) => {
    const entityId = getEntityId(node);
    map.set(entityId, node);
    if (node.id) {
      map.set(node.id, node);
    }
    if (node.localId) {
      map.set(node.localId, node);
    }
    indexItmEntities(sortEntities(node.children), map);
  });
  return map;
}

function flattenTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTreeNodes(node.children || [])]);
}

function flattenItmEntities(nodes: ResolvedItmEntity[]): ResolvedItmEntity[] {
  return nodes.flatMap((node) => [node, ...flattenItmEntities(sortEntities(node.children))]);
}

function treeDomId(id: string): string {
  return `tree-node-${id.replace(/[^a-z0-9_-]+/gi, "-")}`;
}

function treeNodeInspector(node: TreeNode): InspectorItem {
  const rows: InspectorItem["rows"] = [
    { label: "ID", value: node.id },
    { label: "Children", value: String(node.children.length) }
  ];
  if (node.declaredId) {
    rows.push({ label: "Declared ID", value: node.declaredId });
  }
  if (node.type) {
    rows.push({ label: "Type", value: node.type });
  }
  if (node.tags?.length) {
    rows.push({ label: "Tags", value: node.tags.map((tag) => `#${tag}`).join(", ") });
  }
  if (node.links?.length) {
    rows.push({ label: "Links", value: node.links.map((link) => `@${link.type ? `${link.type}:` : ""}${link.target}`).join(", ") });
  }
  if (node.sourceRange) {
    rows.push({ label: "Source", value: `line ${node.sourceRange.line + 1}, column ${node.sourceRange.column + 1}` });
  }
  Object.entries(node.attributes || {}).forEach(([key, value]) => rows.push({ label: key, value }));
  return {
    kind: "tree node",
    title: node.label,
    rows,
    details: node.details
  };
}

function itmEntityInspector(entity: ResolvedItmEntity, sourceText?: string): InspectorItem {
  const rows: InspectorItem["rows"] = [
    { label: "ID", value: getEntityId(entity) },
    { label: "Children", value: String(entity.children.length) }
  ];
  const type = getEntityType(entity);
  const tags = getEntityTags(entity);
  const outgoing = getOutgoingRelationships(entity);
  const sourceRange = getSourceRange(entity.sourceRange, sourceText);
  if (entity.id) {
    rows.push({ label: "Declared ID", value: entity.id });
  }
  if (type) {
    rows.push({ label: "Type", value: type });
  }
  if (tags.length) {
    rows.push({ label: "Tags", value: tags.map((tag) => `#${tag}`).join(", ") });
  }
  if (outgoing.length) {
    rows.push({ label: "Relationships", value: outgoing.map((relationship) => `@${getRelationshipLabel(relationship)}:${getRelationshipTargetId(relationship)}`).join(", ") });
  }
  if (sourceRange) {
    rows.push({ label: "Source", value: `line ${sourceRange.line + 1}, column ${sourceRange.column + 1}` });
  }
  Object.entries(getEntityAttributes(entity)).forEach(([key, value]) => rows.push({ label: key, value: stringifyAttributeValue(value) }));
  return {
    kind: "itm entity",
    title: getEntityLabel(entity),
    rows,
    details: getEntityDescription(entity)
  };
}

interface JsMindNode {
  id: string;
  topic: string;
  expanded?: boolean;
  direction?: "left" | "right";
  children?: JsMindNode[];
  "background-color"?: string;
  "foreground-color"?: string;
  "font-size"?: string;
  "font-weight"?: string;
  "font-style"?: string;
}

interface JsMindData {
  meta: { name: string; author: string; version: string };
  format: "node_tree";
  data: JsMindNode;
}

function treeToJsMind(nodes: TreeNode[]): JsMindData {
  const rootChildren = nodes.map((node, index) => treeNodeToJsMind(node, index));
  const root = rootChildren.length === 1 ? rootChildren[0] : { id: "root", topic: "Mind Map", expanded: true, children: rootChildren };
  return {
    meta: { name: root.topic || "Mind Map", author: "TextForge", version: "1.0" },
    format: "node_tree",
    data: root
  };
}

function itmToJsMind(entities: ResolvedItmEntity[]): JsMindData {
  const rootChildren = sortEntities(entities).map((entity, index) => itmEntityToJsMind(entity, index));
  const root = rootChildren.length === 1 ? rootChildren[0] : { id: "root", topic: "Mind Map", expanded: true, children: rootChildren };
  return {
    meta: { name: root.topic || "Mind Map", author: "TextForge", version: "1.0" },
    format: "node_tree",
    data: root
  };
}

function treeNodeToJsMind(node: TreeNode, index: number): JsMindNode {
  return {
    id: node.id,
    topic: node.type ? `${node.label} (${node.type})` : node.label,
    expanded: true,
    direction: index % 2 === 0 ? "right" : "left",
    ...mindMapStyleData(effectiveViewerStyle(node)),
    children: node.children.map((child, childIndex) => treeNodeToJsMind(child, childIndex))
  };
}

function itmEntityToJsMind(entity: ResolvedItmEntity, index: number): JsMindNode {
  return {
    id: getEntityId(entity),
    topic: entityTopic(entity),
    expanded: true,
    direction: index % 2 === 0 ? "right" : "left",
    ...mindMapStyleData(getEntityStyleRecord(entity)),
    children: sortEntities(entity.children).map((child, childIndex) => itmEntityToJsMind(child, childIndex))
  };
}

function findFirstMatchingTreeNode(nodes: TreeNode[], query: string): TreeNode | null {
  const lower = query.trim().toLowerCase();
  if (!lower) {
    return null;
  }
  for (const node of nodes) {
    const text = [node.id, node.label, node.type, node.declaredId].filter(Boolean).join(" ").toLowerCase();
    if (text.includes(lower)) {
      return node;
    }
    const child = findFirstMatchingTreeNode(node.children, query);
    if (child) {
      return child;
    }
  }
  return null;
}

function matchingTreeNodes(nodes: TreeNode[], query: string): TreeNode[] {
  const lower = query.trim().toLowerCase();
  if (!lower) {
    return [];
  }
  const matches: TreeNode[] = [];
  walkTreeNodes(nodes, (node) => {
    const text = [node.id, node.label, node.type, node.declaredId, ...(node.tags || [])].filter(Boolean).join(" ").toLowerCase();
    if (text.includes(lower)) {
      matches.push(node);
    }
  });
  return matches;
}

function matchingItmEntities(nodes: ResolvedItmEntity[], query: string): ResolvedItmEntity[] {
  const lower = query.trim().toLowerCase();
  if (!lower) {
    return [];
  }
  const matches: ResolvedItmEntity[] = [];
  walkItmEntities(nodes, (entity) => {
    const text = [
      getEntityId(entity),
      getEntityLabel(entity),
      getEntityType(entity),
      ...getEntityTags(entity),
      ...Object.entries(getEntityAttributes(entity)).flatMap(([key, value]) => [key, stringifyAttributeValue(value)]),
      getEntityDescription(entity)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (text.includes(lower)) {
      matches.push(entity);
    }
  });
  return matches;
}

function walkTreeNodes(nodes: TreeNode[], callback: (node: TreeNode) => void): void {
  nodes.forEach((node) => {
    callback(node);
    walkTreeNodes(node.children, callback);
  });
}

function walkItmEntities(nodes: ResolvedItmEntity[], callback: (entity: ResolvedItmEntity) => void): void {
  nodes.forEach((node) => {
    callback(node);
    walkItmEntities(sortEntities(node.children), callback);
  });
}

function countTreeNodes(nodes: TreeNode[]): number {
  return nodes.reduce((count, node) => count + 1 + countTreeNodes(node.children), 0);
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface MindMapDecorationOptions {
  showArrows: boolean;
  showLabels: boolean;
  labelOffsets?: Map<string, Point>;
}

function renderMindMapDecorations(
  host: HTMLElement,
  nodes: TreeNode[],
  query = "",
  activeId = "",
  options: MindMapDecorationOptions = { showArrows: true, showLabels: false }
): void {
  applyMindMapNodeStyles(host, nodes);
  applyMindMapSearchState(host, nodes, query, activeId);
  renderMindMapCrossLinks(host, nodes, options);
}

function renderItmMindMapDecorations(
  host: HTMLElement,
  entities: ResolvedItmEntity[],
  sourceText: string | undefined,
  query = "",
  activeId = "",
  options: MindMapDecorationOptions = { showArrows: true, showLabels: false }
): void {
  applyItmMindMapNodeStyles(host, entities);
  applyItmMindMapSearchState(host, entities, query, activeId);
  renderItmMindMapCrossLinks(host, entities, sourceText, options);
}

function applyMindMapSearchState(host: HTMLElement, nodes: TreeNode[], query: string, activeId: string): void {
  const matchedIds = new Set(matchingTreeNodes(nodes, query).map((node) => node.id));
  applyMindMapSearchIds(host, matchedIds, activeId);
}

function applyItmMindMapSearchState(host: HTMLElement, entities: ResolvedItmEntity[], query: string, activeId: string): void {
  const matchedIds = new Set(matchingItmEntities(entities, query).map((entity) => getEntityId(entity)));
  applyMindMapSearchIds(host, matchedIds, activeId);
}

function applyMindMapSearchIds(host: HTMLElement, matchedIds: Set<string>, activeId: string): void {
  host.querySelectorAll<HTMLElement>("jmnode").forEach((element) => {
    const id = element.getAttribute("nodeid") || "";
    element.classList.toggle("mindmap-search-match", matchedIds.has(id));
    element.classList.toggle("mindmap-search-active", Boolean(activeId && id === activeId));
  });
}

function applyMindMapNodeStyles(host: HTMLElement, nodes: TreeNode[]): void {
  const flatNodes = Array.from(indexTreeNodes(nodes).values()).filter((node, index, list) => list.findIndex((candidate) => candidate.id === node.id) === index);
  flatNodes.forEach((node) => {
    const element = jsMindElementById(host, node.id);
    if (!element) {
      return;
    }
    const attrs = effectiveViewerStyle(node);
    const borderColor = safeCssColor(firstStyleAttribute(attrs, ["border-color", "borderColor", "border", "stroke"]));
    const borderWidth = safeCssLength(firstStyleAttribute(attrs, ["border-width", "borderWidth"]));
    const shape = firstStyleAttribute(attrs, ["shape", "node-shape", "nodeShape"])?.toLowerCase();
    if (borderColor) {
      element.style.borderColor = borderColor;
      element.style.borderStyle = "solid";
      element.style.borderWidth = borderWidth || "1px";
    }
    if (borderWidth && !borderColor) {
      element.style.borderWidth = borderWidth;
      element.style.borderStyle = "solid";
    }
    if (shape) {
      element.style.borderRadius = mindMapShapeRadius(shape);
    }
  });
}

function applyItmMindMapNodeStyles(host: HTMLElement, entities: ResolvedItmEntity[]): void {
  const flatEntities = Array.from(indexItmEntities(entities).values()).filter((entity, index, list) => list.findIndex((candidate) => getEntityId(candidate) === getEntityId(entity)) === index);
  flatEntities.forEach((entity) => {
    const element = jsMindElementById(host, getEntityId(entity));
    if (!element) {
      return;
    }
    const attrs = getEntityStyleRecord(entity);
    const borderColor = safeCssColor(firstStyleAttribute(attrs, ["border-color", "borderColor", "border", "stroke"]));
    const borderWidth = safeCssLength(firstStyleAttribute(attrs, ["border-width", "borderWidth"]));
    const shape = firstStyleAttribute(attrs, ["shape", "node-shape", "nodeShape"])?.toLowerCase();
    if (borderColor) {
      element.style.borderColor = borderColor;
      element.style.borderStyle = "solid";
      element.style.borderWidth = borderWidth || "1px";
    }
    if (borderWidth && !borderColor) {
      element.style.borderWidth = borderWidth;
      element.style.borderStyle = "solid";
    }
    if (shape) {
      element.style.borderRadius = mindMapShapeRadius(shape);
    }
  });
}

function renderMindMapCrossLinks(host: HTMLElement, nodes: TreeNode[], options: MindMapDecorationOptions): void {
  const layer = host.querySelector<HTMLElement>("jmnodes") || host.querySelector<HTMLElement>(".jsmind-inner") || host;
  layer.querySelector(".jsmind-cross-links")?.remove();
  const nodeIndex = indexTreeNodes(nodes);
  const links: Array<{ id: string; source: TreeNode; target: TreeNode; type?: string; color?: string; width?: number }> = [];
  const seenSources = new Set<string>();
  nodeIndex.forEach((node) => {
    if (seenSources.has(node.id)) {
      return;
    }
    seenSources.add(node.id);
    (node.links || []).forEach((link) => {
      const target = nodeIndex.get(link.target);
      if (target) {
        links.push({
          id: `${node.id}->${link.type || ""}->${target.id}`,
          source: node,
          target,
          type: link.type,
          color: link.color || safeCssColor(firstStyleAttribute({ ...(node.attributes || {}), ...(link.style || {}) }, ["stroke", "link-color", "linkColor", "line-color", "lineColor", "edge-color", "edgeColor"])),
          width: link.width || safePositiveNumber(firstStyleAttribute({ ...(node.attributes || {}), ...(link.style || {}) }, ["stroke-width", "link-width", "linkWidth", "line-width", "lineWidth", "edge-width", "edgeWidth"]))
        });
      }
    });
  });
  if (!links.length) {
    return;
  }
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.classList.add("jsmind-cross-links");
  svg.setAttribute("width", String(Math.max(layer.scrollWidth, layer.clientWidth)));
  svg.setAttribute("height", String(Math.max(layer.scrollHeight, layer.clientHeight)));
  const defs = document.createElementNS(SVG_NAMESPACE, "defs");
  svg.append(defs);
  links.forEach((link, index) => {
    const source = jsMindElementById(host, link.source.id);
    const target = jsMindElementById(host, link.target.id);
    if (!source || !target || source.offsetParent === null || target.offsetParent === null) {
      return;
    }
    const sourceBox = elementBox(source);
    const targetBox = elementBox(target);
    const sourceCenter = boxCenter(sourceBox);
    const targetCenter = boxCenter(targetBox);
    const start = lineBoxIntersection(sourceCenter, targetCenter, sourceBox);
    const end = lineBoxIntersection(targetCenter, sourceCenter, targetBox);
    const midX = start.x + (end.x - start.x) * 0.5;
    const midY = start.y + (end.y - start.y) * 0.5;
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", link.color || "#cf6f2a");
    path.setAttribute("stroke-width", String(link.width || 2));
    if (options.showArrows) {
      const markerId = `${host.id}-cross-link-arrow-${index}`;
      const marker = document.createElementNS(SVG_NAMESPACE, "marker");
      marker.setAttribute("id", markerId);
      marker.setAttribute("markerWidth", "8");
      marker.setAttribute("markerHeight", "8");
      marker.setAttribute("refX", "7");
      marker.setAttribute("refY", "4");
      marker.setAttribute("orient", "auto");
      const markerPath = document.createElementNS(SVG_NAMESPACE, "path");
      markerPath.setAttribute("d", "M 0 0 L 8 4 L 0 8 z");
      markerPath.setAttribute("fill", link.color || "#cf6f2a");
      marker.append(markerPath);
      defs.append(marker);
      path.setAttribute("marker-end", `url(#${markerId})`);
    }
    path.setAttribute("data-link-index", String(index));
    const title = document.createElementNS(SVG_NAMESPACE, "title");
    title.textContent = `${link.source.label} -> ${link.target.label}${link.type ? ` (${link.type})` : ""}`;
    path.append(title);
    svg.append(path);
    if (options.showLabels && link.type) {
      const offset = options.labelOffsets?.get(link.id) || { x: 0, y: 0 };
      const text = document.createElementNS(SVG_NAMESPACE, "text") as SVGTextElement;
      text.classList.add("jsmind-cross-link-label");
      text.setAttribute("x", String(midX + offset.x));
      text.setAttribute("y", String(midY - 6 + offset.y));
      text.setAttribute("data-edge-id", link.id);
      text.textContent = link.type;
      attachMindMapLabelDrag(text, link.id, { x: midX, y: midY - 6 }, options.labelOffsets);
      svg.append(text);
    }
  });
  layer.prepend(svg);
}

function elementBox(element: HTMLElement): Box {
  return {
    left: element.offsetLeft,
    top: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

function renderItmMindMapCrossLinks(host: HTMLElement, entities: ResolvedItmEntity[], sourceText: string | undefined, options: MindMapDecorationOptions): void {
  const layer = host.querySelector<HTMLElement>("jmnodes") || host.querySelector<HTMLElement>(".jsmind-inner") || host;
  layer.querySelector(".jsmind-cross-links")?.remove();
  const links: Array<{ id: string; sourceId: string; sourceLabel: string; targetId: string; targetLabel: string; type?: string; color?: string; width?: number }> = [];
  walkItmEntities(entities, (entity) => {
    getOutgoingRelationships(entity).forEach((relationship) => {
      if (!relationship.target) {
        return;
      }
      const style = { ...getEntityStyleRecord(entity), ...relationshipStyleRecord(relationship) };
      links.push({
        id: getRelationshipId(relationship),
        sourceId: getEntityId(entity),
        sourceLabel: getEntityLabel(entity),
        targetId: getEntityId(relationship.target),
        targetLabel: getEntityLabel(relationship.target),
        type: getRelationshipLabel(relationship),
        color: safeCssColor(firstStyleAttribute(style, ["stroke", "link-color", "linkColor", "line-color", "lineColor", "edge-color", "edgeColor"])),
        width: safePositiveNumber(firstStyleAttribute(style, ["stroke-width", "link-width", "linkWidth", "line-width", "lineWidth", "edge-width", "edgeWidth"]))
      });
    });
  });
  if (!links.length) {
    return;
  }
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.classList.add("jsmind-cross-links");
  svg.setAttribute("width", String(Math.max(layer.scrollWidth, layer.clientWidth)));
  svg.setAttribute("height", String(Math.max(layer.scrollHeight, layer.clientHeight)));
  const defs = document.createElementNS(SVG_NAMESPACE, "defs");
  svg.append(defs);
  links.forEach((link, index) => {
    const source = jsMindElementById(host, link.sourceId);
    const target = jsMindElementById(host, link.targetId);
    if (!source || !target || source.offsetParent === null || target.offsetParent === null) {
      return;
    }
    const sourceBox = elementBox(source);
    const targetBox = elementBox(target);
    const sourceCenter = boxCenter(sourceBox);
    const targetCenter = boxCenter(targetBox);
    const start = lineBoxIntersection(sourceCenter, targetCenter, sourceBox);
    const end = lineBoxIntersection(targetCenter, sourceCenter, targetBox);
    const midX = start.x + (end.x - start.x) * 0.5;
    const midY = start.y + (end.y - start.y) * 0.5;
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", link.color || "#cf6f2a");
    path.setAttribute("stroke-width", String(link.width || 2));
    if (options.showArrows) {
      const markerId = `${host.id}-cross-link-arrow-${index}`;
      const marker = document.createElementNS(SVG_NAMESPACE, "marker");
      marker.setAttribute("id", markerId);
      marker.setAttribute("markerWidth", "8");
      marker.setAttribute("markerHeight", "8");
      marker.setAttribute("refX", "7");
      marker.setAttribute("refY", "4");
      marker.setAttribute("orient", "auto");
      const markerPath = document.createElementNS(SVG_NAMESPACE, "path");
      markerPath.setAttribute("d", "M 0 0 L 8 4 L 0 8 z");
      markerPath.setAttribute("fill", link.color || "#cf6f2a");
      marker.append(markerPath);
      defs.append(marker);
      path.setAttribute("marker-end", `url(#${markerId})`);
    }
    const title = document.createElementNS(SVG_NAMESPACE, "title");
    title.textContent = `${link.sourceLabel} -> ${link.targetLabel}${link.type ? ` (${link.type})` : ""}`;
    path.append(title);
    svg.append(path);
    if (options.showLabels && link.type) {
      const offset = options.labelOffsets?.get(link.id) || { x: 0, y: 0 };
      const text = document.createElementNS(SVG_NAMESPACE, "text") as SVGTextElement;
      text.textContent = link.type;
      text.setAttribute("x", String(midX + offset.x));
      text.setAttribute("y", String(midY + offset.y - 6));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", link.color || "#7a4d1c");
      text.setAttribute("font-size", "11");
      text.setAttribute("font-weight", "600");
      svg.append(text);
    }
  });
  layer.append(svg);
}

function relationshipStyleRecord(relationship: ResolvedItmRelationship): Record<string, string> {
  return Object.fromEntries(
    Object.entries(relationship.attributes?.values || {})
      .map(([key, value]) => [key, stringifyAttributeValue(value)])
      .filter(([, value]) => value.length > 0)
  );
}

function boxCenter(box: Box): Point {
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2
  };
}

function lineBoxIntersection(from: Point, to: Point, box: Box): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (!dx && !dy) {
    return from;
  }
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(halfWidth / dx),
    dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(halfHeight / dy)
  );
  return {
    x: from.x + dx * scale,
    y: from.y + dy * scale
  };
}

function attachMindMapLabelDrag(
  label: SVGTextElement,
  edgeId: string,
  base: Point,
  offsets?: Map<string, Point>
): void {
  if (!offsets) {
    return;
  }
  let drag: { id: number; x: number; y: number; start: Point } | null = null;
  label.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: offsets.get(edgeId) || { x: 0, y: 0 }
    };
    label.setPointerCapture?.(event.pointerId);
  });
  label.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    const next = {
      x: drag.start.x + event.clientX - drag.x,
      y: drag.start.y + event.clientY - drag.y
    };
    offsets.set(edgeId, next);
    label.setAttribute("x", String(base.x + next.x));
    label.setAttribute("y", String(base.y + next.y));
  });
  const stop = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    label.releasePointerCapture?.(event.pointerId);
    drag = null;
  };
  label.addEventListener("pointerup", stop);
  label.addEventListener("pointercancel", stop);
}

function mindMapStyleData(attributes: Record<string, string> | undefined): Partial<JsMindNode> {
  const attrs = attributes || {};
  const background = safeCssColor(firstStyleAttribute(attrs, ["background-color", "backgroundColor", "background", "bg", "fill"]));
  const foreground = safeCssColor(firstStyleAttribute(attrs, ["foreground-color", "foregroundColor", "text-color", "textColor", "fg", "color"]));
  const fontSize = safeCssLength(firstStyleAttribute(attrs, ["font-size", "fontSize"]));
  const fontWeight = firstStyleAttribute(attrs, ["font-weight", "fontWeight", "weight"]);
  const fontStyle = firstStyleAttribute(attrs, ["font-style", "fontStyle", "style"]);
  return {
    ...(background ? { "background-color": background } : {}),
    ...(foreground ? { "foreground-color": foreground } : {}),
    ...(fontSize ? { "font-size": fontSize } : {}),
    ...(fontWeight && /^(normal|bold|[1-9]00)$/i.test(fontWeight) ? { "font-weight": fontWeight } : {}),
    ...(fontStyle && /^(normal|italic|oblique)$/i.test(fontStyle) ? { "font-style": fontStyle } : {})
  };
}

function firstStyleAttribute(attributes: Record<string, string>, keys: string[]): string | undefined {
  const normalized = new Map(Object.entries(attributes).map(([key, value]) => [key.toLowerCase(), value.trim()]));
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase());
    if (value) {
      return value;
    }
  }
  return undefined;
}

function safeCssColor(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return /^(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|[a-z]+)$/i.test(trimmed) ? trimmed : undefined;
}

function safeCssLength(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return /^[0-9]+(?:\.[0-9]+)?(?:px|em|rem|%)?$/i.test(trimmed) ? trimmed : undefined;
}

function safePositiveNumber(value: string | undefined): number | undefined {
  const parsed = value ? Number.parseFloat(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function mindMapShapeRadius(shape: string): string {
  if (shape === "square" || shape === "rectangle") {
    return "2px";
  }
  if (shape === "pill" || shape === "capsule") {
    return "999px";
  }
  if (shape === "round" || shape === "rounded") {
    return "8px";
  }
  return "8px";
}

function centerMindMapNode(viewport: HTMLElement | null, host: HTMLElement, id: string): void {
  const panel = mindMapPanel(host);
  const element = jsMindElementById(host, id);
  if (!viewport || !panel || !element) {
    return;
  }
  const panelRect = panel.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  panel.scrollBy({
    left: elementRect.left + elementRect.width / 2 - (panelRect.left + panelRect.width / 2),
    top: elementRect.top + elementRect.height / 2 - (panelRect.top + panelRect.height / 2),
    behavior: "smooth"
  });
}

function fitMindMap(
  instance: jsMind,
  viewport: HTMLElement,
  host: HTMLElement,
  onZoomChange: ((zoom: number) => void) | undefined
): void {
  const visibleNodes = visibleJsMindNodes(host);
  if (!visibleNodes.length) {
    centerMindMapNode(viewport, host, "root");
    return;
  }
  const bounds = elementBounds(visibleNodes);
  const availableWidth = Math.max(120, viewport.clientWidth - 80);
  const availableHeight = Math.max(120, viewport.clientHeight - 80);
  const currentZoom = mindMapZoom(instance);
  const nextZoom = clamp(
    currentZoom * Math.min(availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height), 1.6),
    0.1,
    2.1
  );
  setNativeMindMapZoom(instance, nextZoom);
  onZoomChange?.(nextZoom);
  window.requestAnimationFrame(() => centerMindMapBounds(host, visibleJsMindNodes(host)));
}

function centerMindMapBounds(host: HTMLElement, elements: HTMLElement[]): void {
  const panel = mindMapPanel(host);
  if (!panel || !elements.length) {
    return;
  }
  const panelRect = panel.getBoundingClientRect();
  const bounds = elementBounds(elements);
  panel.scrollBy({
    left: bounds.left + bounds.width / 2 - (panelRect.left + panelRect.width / 2),
    top: bounds.top + bounds.height / 2 - (panelRect.top + panelRect.height / 2),
    behavior: "smooth"
  });
}

function elementBounds(elements: HTMLElement[]): DOMRect {
  const rects = elements.map((element) => element.getBoundingClientRect());
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function mindMapPanel(host: HTMLElement | null): HTMLElement | null {
  return host?.querySelector<HTMLElement>(".jsmind-inner") || null;
}

function visibleJsMindNodes(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>("jmnode")).filter((element) => element.offsetParent !== null);
}

function setNativeMindMapZoom(instance: jsMind, zoom: number, anchor?: { x: number; y: number }): boolean {
  const view = instanceView(instance);
  const nextZoom = clamp(zoom, 0.1, 5);
  if (!view?.set_zoom) {
    return false;
  }
  if (view.set_zoom(nextZoom, anchor)) {
    return true;
  }
  ensureMindMapZoomSpace(view, nextZoom);
  return view.set_zoom(nextZoom, anchor);
}

function ensureMindMapZoomSpace(view: JsMindViewHandle, zoom: number): void {
  const panel = view.e_panel;
  if (!panel || !view.size) {
    return;
  }
  const rect = panel.getBoundingClientRect();
  const minWidth = Math.ceil(rect.width / Math.max(0.1, zoom)) + 1600;
  const minHeight = Math.ceil(rect.height / Math.max(0.1, zoom)) + 1200;
  view.size.w = Math.max(view.size.w, minWidth);
  view.size.h = Math.max(view.size.h, minHeight);
}

function mindMapZoom(instance: jsMind): number {
  const zoom = instanceView(instance)?.zoom_current;
  return typeof zoom === "number" && Number.isFinite(zoom) ? zoom : 1;
}

function jsMindElementById(host: HTMLElement, id: string): HTMLElement | null {
  return Array.from(host.querySelectorAll<HTMLElement>("jmnode")).find((element) => element.getAttribute("nodeid") === id) || null;
}

function jsMindNodeId(instance: jsMind, target: EventTarget | null): string {
  const view = instanceView(instance);
  if (view?.get_binded_nodeid && target instanceof Element) {
    return String(view.get_binded_nodeid(target) || "");
  }
  return target instanceof Element ? String(target.closest("jmnode,jmexpander")?.getAttribute("nodeid") || "") : "";
}

function toggleJsMindNode(instance: jsMind, id: string, recursive: boolean): void {
  const node = instance.get_node?.(id);
  if (!node || node.isroot || !node.children?.length) {
    return;
  }
  const collapse = Boolean(node.expanded);
  if (recursive) {
    walkJsMindNodes(node, (child) => {
      if (child.id !== id) {
        collapse ? instance.collapse_node?.(child.id) : instance.expand_node?.(child.id);
      }
    });
  }
  collapse ? instance.collapse_node?.(id) : instance.expand_node?.(id);
}

function expandJsMindPath<T>(instance: jsMind, nodes: T[], id: string, getId: (node: T) => string, getChildren: (node: T) => T[]): void {
  const path = treePathToNode(nodes, id, getId, getChildren);
  path.slice(0, -1).forEach((node) => instance.expand_node?.(getId(node)));
}

function treePathToNode<T>(nodes: T[], id: string, getId: (node: T) => string, getChildren: (node: T) => T[], path: T[] = []): T[] {
  for (const node of nodes) {
    const nextPath = [...path, node];
    if (getId(node) === id) {
      return nextPath;
    }
    const childPath = treePathToNode(getChildren(node), id, getId, getChildren, nextPath);
    if (childPath.length) {
      return childPath;
    }
  }
  return [];
}

function walkJsMindNodes(node: JsMindRuntimeNode, callback: (node: JsMindRuntimeNode) => void): void {
  callback(node);
  (node.children || []).forEach((child) => walkJsMindNodes(child, callback));
}

function instanceView(instance: jsMind): JsMindViewHandle | undefined {
  return (instance as unknown as { view?: JsMindViewHandle }).view;
}

interface JsMindViewHandle {
  get_binded_nodeid?: (target: Element) => string;
  set_zoom?: (zoom: number, anchor?: { x: number; y: number }) => boolean;
  zoom_current?: number;
  e_panel?: HTMLElement;
  size?: { w: number; h: number };
}

interface JsMindRuntimeNode {
  id: string;
  isroot?: boolean;
  expanded?: boolean;
  children?: JsMindRuntimeNode[];
}

function runSigmaGraphologyLayout(
  graph: GraphologyLike,
  layouts: {
    circularLayout: GraphologyLayout;
    randomLayout: GraphologyLayout;
    forceAtlas2: GraphologyLayout & { inferSettings?: (graph: GraphologyLike) => Record<string, unknown> };
    noverlap: GraphologyLayout;
  },
  layoutName: string,
  iterations: number
): void {
  const count = Math.max(1, Math.min(1000, Math.round(iterations) || 120));
  const scale = Math.max(4, Math.sqrt(Math.max(1, Number(graph.order) || 1)) * 8);
  if (layoutName === "random") {
    layouts.randomLayout.assign(graph, { scale, center: 0 });
  } else if (layoutName === "circular") {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
  } else if (layoutName === "noverlap") {
    ensureGraphologyPositions(graph, layouts.circularLayout);
    layouts.noverlap.assign(graph, {
      maxIterations: count,
      settings: { margin: 4, ratio: 1.2, expansion: 1.1 }
    });
  } else {
    ensureGraphologyPositions(graph, layouts.circularLayout);
    layouts.forceAtlas2.assign(graph, {
      iterations: count,
      settings: layouts.forceAtlas2.inferSettings?.(graph) || {}
    });
  }
  normalizeGraphologyPositions(graph);
}

function ensureGraphologyPositions(graph: GraphologyLike, circularLayout: GraphologyLayout): void {
  let hasPosition = false;
  graph.forEachNode((_node, attrs) => {
    if (Number.isFinite(Number(attrs.x)) && Number.isFinite(Number(attrs.y)) && (Number(attrs.x) !== 0 || Number(attrs.y) !== 0)) {
      hasPosition = true;
    }
  });
  if (!hasPosition) {
    circularLayout.assign(graph, {
      scale: Math.max(4, Math.sqrt(Math.max(1, Number(graph.order) || 1)) * 8),
      center: 0
    });
  }
  normalizeGraphologyPositions(graph);
}

function normalizeGraphologyPositions(graph: GraphologyLike): void {
  graph.forEachNode((node, attrs) => {
    graph.mergeNodeAttributes(node, {
      x: Number.isFinite(Number(attrs.x)) ? Number(attrs.x) : 0,
      y: Number.isFinite(Number(attrs.y)) ? Number(attrs.y) : 0
    });
  });
}

function graphologyDegreeMap(graph: GraphologyLike): Map<string, number> {
  const degree = new Map<string, number>();
  (graph.nodes?.() || []).forEach((node) => {
    degree.set(node, graph.degree?.(node) || 0);
  });
  return degree;
}

function uniqueGraphologyEdgeKey(graph: GraphologyLike, baseKey: string): string {
  const base = baseKey || `edge-${Date.now()}`;
  if (!graph.hasEdge?.(base)) {
    return base;
  }
  let index = 2;
  while (graph.hasEdge?.(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function safePagerankValues(graph: GraphologyLike, pagerank: (graph: GraphologyLike, options?: Record<string, unknown>) => Record<string, number>): Map<string, number> {
  const values = new Map<string, number>();
  (graph.nodes?.() || []).forEach((node) => values.set(node, 0));
  try {
    const ranks = pagerank(graph, { alpha: 0.85, maxIterations: 100, tolerance: 1e-6 });
    Object.entries(ranks).forEach(([id, value]) => values.set(id, Number(value) || 0));
  } catch {
    return values;
  }
  return values;
}

function metricDomain(values: number[]): [number, number] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) {
    return [0, 1];
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return min === max ? [min, min + 1] : [min, max];
}

function sigmaNodeSize(
  nodeId: string,
  baseSize: number,
  metric: string,
  degrees: Map<string, number>,
  pageranks: Map<string, number>,
  domain: [number, number]
): number {
  if (metric === "fixed") {
    return baseSize / 2;
  }
  const value = metric === "pagerank" ? pageranks.get(nodeId) || 0 : degrees.get(nodeId) || 0;
  const ratio = (value - domain[0]) / (domain[1] - domain[0]);
  return 4 + clamp(ratio, 0, 1) * Math.max(8, baseSize);
}

interface GraphologyLayout {
  assign: (graph: GraphologyLike, options?: Record<string, unknown>) => void;
}

interface GraphologyLike {
  order?: number;
  forEachNode: (callback: (node: string, attrs: Record<string, unknown>) => void) => void;
  mergeNodeAttributes: (node: string, attrs: Record<string, unknown>) => void;
  degree?: (node: string) => number;
  inDegree?: (node: string) => number;
  outDegree?: (node: string) => number;
  nodes?: () => string[];
  edges?: () => string[];
  source?: (edge: string) => string;
  target?: (edge: string) => string;
  extremities?: (edge: string) => [string, string];
  hasNode?: (node: string) => boolean;
  hasEdge?: (edge: string) => boolean;
  getNodeAttribute?: (node: string, key: string) => unknown;
  getEdgeAttribute?: (edge: string, key: string) => unknown;
}

function filterGraph(graph: GraphViewModel, query: string, filterToMatches: boolean): GraphViewModel {
  if (!filterToMatches || !query) {
    return graph;
  }
  const matchedNodes = new Set(
    graph.nodes
      .filter((node) => [node.id, node.label, node.type].filter(Boolean).join(" ").toLowerCase().includes(query))
      .map((node) => node.id)
  );
  const matchedEdges = graph.edges.filter((edge) => [edge.id, edge.label, edge.type].filter(Boolean).join(" ").toLowerCase().includes(query));
  matchedEdges.forEach((edge) => {
    matchedNodes.add(edge.source);
    matchedNodes.add(edge.target);
  });
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => matchedNodes.has(node.id)),
    edges: graph.edges.filter((edge) => matchedNodes.has(edge.source) && matchedNodes.has(edge.target))
  };
}

function compareCell(left: string, right: string, direction: string): number {
  const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
  return direction === "desc" ? -result : result;
}

function safeClassName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "default";
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface FindState {
  count: number;
  activeIndex: number;
  markers: number[];
}

function enhanceHtmlHeadings(root: HTMLElement): void {
  root.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((heading) => {
    const section = headingSectionElements(heading);
    if (!section.length) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "html-heading-fold";
    button.dataset.state = "open";
    button.setAttribute("aria-label", "Fold heading section");
    button.title = "Fold heading section";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const nextCollapsed = !heading.classList.contains("is-collapsed");
      setHeadingCollapsed(heading, nextCollapsed, false);
      if (event.shiftKey) {
        descendantHeadings(heading).forEach((childHeading) => setHeadingCollapsed(childHeading, nextCollapsed, false));
      }
      applyHtmlHeadingVisibility(headingRoot(heading));
    });
    heading.prepend(button);
  });
}

function enhanceMarkdownArtifacts(
  root: HTMLElement,
  onOpenSvgArtifact?: (svg: string, title: string) => void,
  onSelectSourceRange?: (range: SourceRange) => void
): void {
  root.querySelectorAll<HTMLElement>(".tf-embedded-artifact").forEach((artifact) => {
    const body = artifact.querySelector<HTMLElement>(".tf-artifact-body");
    const toolbar = artifact.querySelector<HTMLElement>(".tf-artifact-toolbar");
    const svg = artifact.querySelector<SVGSVGElement>(".tf-artifact-body > svg");
    if (!body || !toolbar || !svg || artifact.dataset.enhanced === "true") {
      return;
    }
    artifact.dataset.enhanced = "true";
    toolbar.style.removeProperty("display");
    toolbar.classList.add("is-enhanced");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svg.style.maxWidth = "none";
    svg.style.maxHeight = "none";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const view = { x: 0, y: 0, width: 1, height: 1 };
    const apply = () => {
      svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
    };
    apply();
    let fitFrame = 0;
    const runFit = () => {
      fitFrame = 0;
      sizeEmbeddedArtifactViewport(body);
      fitEmbeddedArtifact(body, svg, view, apply);
    };
    const scheduleFit = () => {
      if (fitFrame) {
        cancelAnimationFrame(fitFrame);
      }
      fitFrame = requestAnimationFrame(() => {
        fitFrame = requestAnimationFrame(runFit);
      });
    };
    let interactive = false;
    const setInteractive = (nextInteractive: boolean) => {
      interactive = nextInteractive;
      artifact.dataset.interactive = nextInteractive ? "true" : "false";
      body.classList.toggle("interactive", nextInteractive);
      if (!nextInteractive) {
        drag = null;
      }
    };
    const interactionToggle = document.createElement("label");
    interactionToggle.className = "tf-artifact-interaction-toggle";
    const interactionCheckbox = document.createElement("input");
    interactionCheckbox.type = "checkbox";
    interactionCheckbox.setAttribute("aria-label", "Enable diagram pan and zoom");
    const interactionLabel = document.createElement("span");
    interactionLabel.textContent = "Interactive";
    interactionToggle.append(interactionCheckbox, interactionLabel);
    toolbar.append(interactionToggle);
    interactionCheckbox.addEventListener("change", () => {
      setInteractive(interactionCheckbox.checked);
    });
    let drag: { x: number; y: number; startX: number; startY: number } | null = null;
    body.addEventListener("pointerdown", (event) => {
      if (!interactive || event.button !== 0 || isEmbeddedArtifactResizeGesture(body, event)) {
        return;
      }
      drag = { x: event.clientX, y: event.clientY, startX: view.x, startY: view.y };
      body.setPointerCapture(event.pointerId);
    });
    body.addEventListener("pointermove", (event) => {
      if (!drag) {
        return;
      }
      const viewport = elementContentViewport(body);
      view.x = drag.startX - (event.clientX - drag.x) * (view.width / viewport.width);
      view.y = drag.startY - (event.clientY - drag.y) * (view.height / viewport.height);
      apply();
    });
    body.addEventListener("pointerup", () => {
      drag = null;
    });
    body.addEventListener("pointercancel", () => {
      drag = null;
    });
    body.addEventListener("lostpointercapture", () => {
      drag = null;
    });
    body.addEventListener("wheel", (event) => {
      if (!interactive) {
        return;
      }
      event.preventDefault();
      zoomEmbeddedArtifact(body, view, event);
      apply();
    }, { passive: false });
    setInteractive(false);
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
        if (body.dataset.userResized === "true") {
          fitEmbeddedArtifact(body, svg, view, apply);
          return;
        }
        scheduleFit();
      });
    resizeObserver?.observe(body);
    resizeObserver?.observe(svg);
    scheduleFit();
    artifact.querySelectorAll<HTMLButtonElement>("[data-artifact-action]").forEach((button) => {
      button.addEventListener("click", () => handleArtifactAction(button.dataset.artifactAction || "", artifact, body, svg, view, apply, onOpenSvgArtifact));
    });
  });
  root.querySelectorAll<HTMLElement>(".tf-source-bridge").forEach((element) => {
    if (element.dataset.sourceBridgeEnhanced === "true") {
      return;
    }
    element.dataset.sourceBridgeEnhanced = "true";
    element.addEventListener("click", (event) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("button, a")) {
        return;
      }
      const range = elementSourceRange(element);
      if (!range) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onSelectSourceRange?.(range);
    });
  });
}

function handleArtifactAction(
  action: string,
  artifact: HTMLElement,
  body: HTMLElement,
  svgRoot: SVGSVGElement,
  view: { x: number; y: number; width: number; height: number },
  apply: () => void,
  onOpenSvgArtifact?: (svg: string, title: string) => void
): void {
  const svg = body.querySelector("svg")?.outerHTML || "";
  if (action === "copy-source") {
    void writeClipboard(decodeURIComponent(artifact.dataset.source || ""));
  } else if (action === "copy-svg" && svg) {
    void writeClipboard(svg);
  } else if (action === "download-svg" && svg) {
    downloadText(svg, `${artifact.dataset.artifactKind || "diagram"}.svg`, "image/svg+xml");
  } else if (action === "download-png" && svg) {
    void downloadSvgPng(svg, `${artifact.dataset.artifactKind || "diagram"}.png`);
  } else if (action === "popout-svg" && svg) {
    onOpenSvgArtifact?.(svg, `${artifact.dataset.artifactKind || "diagram"} SVG`);
  } else if (action === "fit-view" || action === "reset-view") {
    fitEmbeddedArtifact(body, svgRoot, view, apply);
  }
}

function fitEmbeddedArtifact(
  body: HTMLElement,
  svg: SVGSVGElement,
  view: { x: number; y: number; width: number; height: number },
  apply: () => void
): void {
  const bounds = embeddedSvgContentBounds(svg);
  if (!bounds.width || !bounds.height) {
    view.x = 0;
    view.y = 0;
    view.width = 1;
    view.height = 1;
    apply();
    return;
  }
  const fitted = fitEmbeddedBoundsToViewport(bounds, elementContentViewport(body));
  view.x = fitted.x;
  view.y = fitted.y;
  view.width = fitted.width;
  view.height = fitted.height;
  apply();
}

function embeddedSvgBounds(svg: SVGSVGElement): { x: number; y: number; width: number; height: number } {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height };
  }
  const width = svg.width?.baseVal;
  const height = svg.height?.baseVal;
  const numericLengthUnit = typeof SVGLength === "undefined" ? 1 : SVGLength.SVG_LENGTHTYPE_NUMBER;
  if (width?.unitType === numericLengthUnit && height?.unitType === numericLengthUnit && width.value > 0 && height.value > 0) {
    return { x: 0, y: 0, width: width.value, height: height.value };
  }
  try {
    const box = svg.getBBox();
    if (box.width > 0 && box.height > 0) {
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } catch {
    // Some SVGs do not expose bounding boxes until laid out.
  }
  return { x: 0, y: 0, width: svg.clientWidth || 0, height: svg.clientHeight || 0 };
}

function embeddedSvgContentBounds(svg: SVGSVGElement): { x: number; y: number; width: number; height: number } {
  try {
    const box = svg.getBBox();
    if (box.width > 0 && box.height > 0) {
      const padding = Math.max(12, Math.min(box.width, box.height) * 0.06);
      return {
        x: box.x - padding,
        y: box.y - padding,
        width: box.width + padding * 2,
        height: box.height + padding * 2
      };
    }
  } catch {
    // Some SVGs do not expose bounding boxes until laid out.
  }
  return embeddedSvgBounds(svg);
}

function sizeEmbeddedArtifactViewport(body: HTMLElement): void {
  const svg = body.querySelector<SVGSVGElement>("svg");
  if (!svg || body.dataset.userResized === "true") {
    return;
  }
  const bounds = embeddedSvgContentBounds(svg);
  if (!bounds.width || !bounds.height) {
    return;
  }
  const padding = elementPadding(body);
  const hostWidth = Math.max(320, body.parentElement?.clientWidth || body.clientWidth || 0);
  const availableWidth = Math.max(1, hostWidth - padding.left - padding.right);
  const aspect = bounds.height / bounds.width;
  const fittedHeight = Math.round(availableWidth * aspect + padding.top + padding.bottom);
  const nextHeight = clamp(fittedHeight, 180, Math.max(720, Math.round(window.innerHeight * 0.82)));
  body.style.height = `${nextHeight}px`;
}

function isEmbeddedArtifactResizeGesture(body: HTMLElement, event: PointerEvent): boolean {
  const rect = body.getBoundingClientRect();
  const handleSize = 24;
  if (event.clientX >= rect.right - handleSize && event.clientY >= rect.bottom - handleSize) {
    body.dataset.userResized = "true";
    return true;
  }
  return false;
}

function fitEmbeddedBoundsToViewport(
  bounds: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const safeWidth = Math.max(1, viewport.width);
  const safeHeight = Math.max(1, viewport.height);
  const viewportAspect = safeWidth / safeHeight;
  const boundsAspect = bounds.width / bounds.height;
  if (viewportAspect >= boundsAspect) {
    const height = bounds.height;
    const width = height * viewportAspect;
    return {
      x: bounds.x - (width - bounds.width) / 2,
      y: bounds.y,
      width,
      height
    };
  }
  const width = bounds.width;
  const height = width / viewportAspect;
  return {
    x: bounds.x,
    y: bounds.y - (height - bounds.height) / 2,
    width,
    height
  };
}

function zoomEmbeddedArtifact(
  body: HTMLElement,
  view: { x: number; y: number; width: number; height: number },
  event: WheelEvent
): void {
  const viewport = elementContentViewport(body);
  const rect = body.getBoundingClientRect();
  const padding = elementPadding(body);
  const offsetX = clamp(event.clientX - rect.left - padding.left, 0, viewport.width);
  const offsetY = clamp(event.clientY - rect.top - padding.top, 0, viewport.height);
  const anchorX = view.x + (offsetX / viewport.width) * view.width;
  const anchorY = view.y + (offsetY / viewport.height) * view.height;
  const factor = event.deltaY > 0 ? 1.12 : 1 / 1.12;
  const nextWidth = clamp(view.width * factor, 24, 100000);
  const nextHeight = clamp(view.height * factor, 24, 100000);
  view.x = anchorX - (offsetX / viewport.width) * nextWidth;
  view.y = anchorY - (offsetY / viewport.height) * nextHeight;
  view.width = nextWidth;
  view.height = nextHeight;
}

function fittedStandaloneSvgView(host: HTMLElement | null, frame: HTMLElement | null, fitMode: string): { scale: number; x: number; y: number } | null {
  const svg = host?.querySelector<SVGSVGElement>("svg");
  if (!svg || !frame) {
    return null;
  }
  const bounds = embeddedSvgBounds(svg);
  if (!bounds.width || !bounds.height) {
    return null;
  }
  return fitSvgBoundsInViewport(bounds, elementContentViewport(frame), fitMode);
}

function fitSvgBoundsInViewport(
  bounds: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  fitMode: string
): { scale: number; x: number; y: number } {
  const safeWidth = Math.max(1, viewport.width);
  const safeHeight = Math.max(1, viewport.height);
  const widthScale = safeWidth / bounds.width;
  const heightScale = safeHeight / bounds.height;
  const scale = clamp(
    fitMode === "actual"
      ? 1
      : fitMode === "full"
        ? widthScale
        : Math.min(widthScale, heightScale),
    0.2,
    5
  );
  return {
    scale,
    x: Math.round((safeWidth - bounds.width * scale) / 2 - bounds.x * scale),
    y: Math.round((safeHeight - bounds.height * scale) / 2 - bounds.y * scale)
  };
}

function elementContentViewport(element: HTMLElement): { width: number; height: number } {
  const padding = elementPadding(element);
  return {
    width: Math.max(1, element.clientWidth - padding.left - padding.right),
    height: Math.max(1, element.clientHeight - padding.top - padding.bottom)
  };
}

function elementPadding(element: HTMLElement): { top: number; right: number; bottom: number; left: number } {
  const styles = window.getComputedStyle(element);
  return {
    top: Number.parseFloat(styles.paddingTop) || 0,
    right: Number.parseFloat(styles.paddingRight) || 0,
    bottom: Number.parseFloat(styles.paddingBottom) || 0,
    left: Number.parseFloat(styles.paddingLeft) || 0
  };
}

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    // Clipboard permission is browser-controlled; the source remains visible in the document.
  }
}

function downloadText(text: string, fileName: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadSvgPng(svg: string, fileName: string): Promise<void> {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render SVG as PNG."));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, image.naturalWidth || 1200);
    canvas.height = Math.max(1, image.naturalHeight || 800);
    canvas.getContext("2d")?.drawImage(image, 0, 0);
    canvas.toBlob((png) => {
      if (png) {
        const pngUrl = URL.createObjectURL(png);
        const anchor = document.createElement("a");
        anchor.href = pngUrl;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(pngUrl);
      }
    }, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function headingSectionElements(heading: Element): HTMLElement[] {
  const level = headingLevel(heading);
  const section: HTMLElement[] = [];
  let cursor = heading.nextElementSibling;
  while (cursor) {
    if (headingLevel(cursor) > 0 && headingLevel(cursor) <= level) {
      break;
    }
    if (cursor instanceof HTMLElement) {
      section.push(cursor);
    }
    cursor = cursor.nextElementSibling;
  }
  return section;
}

function descendantHeadings(heading: Element): Element[] {
  const level = headingLevel(heading);
  const headings: Element[] = [];
  let cursor = heading.nextElementSibling;
  while (cursor) {
    const cursorLevel = headingLevel(cursor);
    if (cursorLevel > 0 && cursorLevel <= level) {
      break;
    }
    if (cursorLevel > level) {
      headings.push(cursor);
    }
    cursor = cursor.nextElementSibling;
  }
  return headings;
}

function setHeadingCollapsed(heading: Element, collapsed: boolean, applyVisibility = true): void {
  heading.classList.toggle("is-collapsed", collapsed);
  const button = heading.querySelector<HTMLButtonElement>(":scope > .html-heading-fold");
  if (button) {
    button.dataset.state = collapsed ? "collapsed" : "open";
    button.setAttribute("aria-label", collapsed ? "Unfold heading section" : "Fold heading section");
    button.title = collapsed ? "Unfold heading section" : "Fold heading section";
  }
  if (applyVisibility) {
    applyHtmlHeadingVisibility(headingRoot(heading));
  }
}

function setAllHtmlHeadings(root: HTMLElement, collapsed: boolean): void {
  const visibilityRoots = new Set<HTMLElement>();
  root.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((heading) => {
    setHeadingCollapsed(heading, collapsed, false);
    visibilityRoots.add(headingRoot(heading));
  });
  if (!visibilityRoots.size) {
    applyHtmlHeadingVisibility(root);
    return;
  }
  visibilityRoots.forEach((visibilityRoot) => applyHtmlHeadingVisibility(visibilityRoot));
}

function headingRoot(heading: Element): HTMLElement {
  return heading.parentElement || (heading.closest(".viewer-html") as HTMLElement | null) || document.body;
}

function applyHtmlHeadingVisibility(root: HTMLElement): void {
  const collapsedLevels: number[] = [];
  Array.from(root.children).forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const level = headingLevel(element);
    if (level > 0) {
      while (collapsedLevels.length && collapsedLevels[collapsedLevels.length - 1] >= level) {
        collapsedLevels.pop();
      }
      element.hidden = collapsedLevels.length > 0;
      if (element.classList.contains("is-collapsed")) {
        collapsedLevels.push(level);
      }
      return;
    }
    element.hidden = collapsedLevels.length > 0;
  });
}

function headingLevel(element: Element): number {
  const match = /^H([1-6])$/.exec(element.tagName);
  return match ? Number(match[1]) : 0;
}

function setDescendantDetailsOpen(details: HTMLDetailsElement | null, open: boolean): void {
  details?.querySelectorAll("details").forEach((child) => {
    child.open = open;
  });
}

function tableToText(table: TableModel): string {
  return [table.columns, ...table.rows].map((row) => row.map((cell) => escapeDelimitedCell(cell, table.delimiter || ",")).join(table.delimiter || ",")).join("\n");
}

function generatedColumns(rows: string[][]): string[] {
  const count = Math.max(1, ...rows.map((row) => row.length));
  return Array.from({ length: count }, (_value, index) => `Column ${index + 1}`);
}

function escapeDelimitedCell(value: string, delimiter: string): string {
  if (!value.includes(delimiter) && !value.includes("\n") && !value.includes('"')) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

function renderHighlighted(value: string, query: string) {
  const needle = query.trim();
  if (!needle) {
    return value;
  }
  const lowerValue = value.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const parts = [];
  let cursor = 0;
  let matchIndex = lowerValue.indexOf(lowerNeedle);
  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      parts.push(value.slice(cursor, matchIndex));
    }
    parts.push(
      <mark class="viewer-search-hit" key={`${matchIndex}-${cursor}`}>
        {value.slice(matchIndex, matchIndex + needle.length)}
      </mark>
    );
    cursor = matchIndex + needle.length;
    matchIndex = lowerValue.indexOf(lowerNeedle, cursor);
  }
  if (cursor < value.length) {
    parts.push(value.slice(cursor));
  }
  return parts;
}

function highlightTextNodes(root: HTMLElement, query: string): HTMLElement[] {
  const needle = query.trim();
  if (!needle) {
    return [];
  }
  const lowerNeedle = needle.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("button,script,style,textarea")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const matches: Text[] = [];
  const marks: HTMLElement[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.nodeValue?.toLowerCase().includes(lowerNeedle)) {
      matches.push(node);
    }
  }
  matches.slice(0, 500).forEach((node) => {
    const value = node.nodeValue || "";
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let matchIndex = value.toLowerCase().indexOf(lowerNeedle);
    while (matchIndex >= 0) {
      fragment.append(document.createTextNode(value.slice(cursor, matchIndex)));
      const mark = document.createElement("mark");
      mark.className = "viewer-search-hit";
      mark.textContent = value.slice(matchIndex, matchIndex + needle.length);
      fragment.append(mark);
      marks.push(mark);
      cursor = matchIndex + needle.length;
      matchIndex = value.toLowerCase().indexOf(lowerNeedle, cursor);
    }
    fragment.append(document.createTextNode(value.slice(cursor)));
    node.parentNode?.replaceChild(fragment, node);
  });
  return marks;
}

function highlightSvgText(root: HTMLElement, query: string): Element[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }
  const matches: Element[] = [];
  root.querySelectorAll("text,tspan").forEach((element) => {
    if ((element.textContent || "").toLowerCase().includes(needle)) {
      element.classList.add("svg-text-match");
      matches.push(element);
    }
  });
  return matches;
}

function findMarkers(matches: Array<Element | HTMLElement>, root: HTMLElement): number[] {
  const height = Math.max(1, root.scrollHeight || root.getBoundingClientRect().height);
  return matches.slice(0, 250).map((element) => {
    const top = element instanceof HTMLElement ? element.offsetTop : element.getBoundingClientRect().top - root.getBoundingClientRect().top;
    return clamp((top / height) * 100, 0, 99);
  });
}

function updateActiveFindMatch(root: HTMLElement | null, activeIndex: number): void {
  if (!root) {
    return;
  }
  const marks = Array.from(root.querySelectorAll<HTMLElement>(".viewer-search-hit"));
  marks.forEach((mark, index) => mark.classList.toggle("active", index === activeIndex));
  marks[activeIndex]?.scrollIntoView({ block: "center", inline: "nearest" });
}

function updateActiveSvgMatch(root: HTMLElement | null, activeIndex: number): void {
  if (!root) {
    return;
  }
  const matches = Array.from(root.querySelectorAll<Element>(".svg-text-match"));
  matches.forEach((match, index) => match.classList.toggle("active", index === activeIndex));
  matches[activeIndex]?.scrollIntoView({ block: "center", inline: "center" });
}

export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const lower = query.trim().toLowerCase();
  if (!lower) {
    return nodes;
  }
  return nodes
    .map((node) => {
      const children = filterTree(node.children, lower);
      const text = [node.label, node.declaredId, node.type, ...(node.tags || [])].filter(Boolean).join(" ").toLowerCase();
      if (text.includes(lower) || children.length) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

function filterItmTree(nodes: ResolvedItmEntity[], query: string): FilteredItmEntity[] {
  const lower = query.trim().toLowerCase();
  return sortEntities(nodes)
    .map((entity) => {
      const children = filterItmTree(entity.children, lower);
      const text = [
        getEntityLabel(entity),
        entity.id,
        entity.localId,
        entity.qualifiedId,
        getEntityType(entity),
        ...getEntityTags(entity),
        ...Object.entries(getEntityAttributes(entity)).flatMap(([key, value]) => [key, stringifyAttributeValue(value)]),
        getEntityDescription(entity)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!lower || text.includes(lower) || children.length) {
        return { entity, children };
      }
      return null;
    })
    .filter(Boolean) as FilteredItmEntity[];
}

export function viewerSnapshotHtml(result: ViewerResult): string {
  if (result.kind === "html") {
    return result.html;
  }
  if (result.kind === "svg") {
    return result.svg;
  }
  if (result.kind === "bpmn") {
    return `<pre>${escapeHtml(result.xml)}</pre>`;
  }
  if (result.kind === "itm-tree" || result.kind === "itm-mindmap" || result.kind === "itm-graph") {
    return `<pre>${escapeHtml(serializeItmPipelineDocument(result.model))}</pre>`;
  }
  if (result.kind === "tree" || result.kind === "mindmap") {
    return `<pre>${escapeHtml(JSON.stringify(result.nodes, null, 2))}</pre>`;
  }
  if (result.kind === "table") {
    return `<pre>${escapeHtml(JSON.stringify(result.table, null, 2))}</pre>`;
  }
  if (result.kind === "graph") {
    return `<pre>${escapeHtml(JSON.stringify(result.graph, null, 2))}</pre>`;
  }
  if ("message" in result) {
    return `<p>${escapeHtml(result.message)}</p>`;
  }
  return `<pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
}
