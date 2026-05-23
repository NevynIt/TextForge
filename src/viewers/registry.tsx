import type { JSX } from "preact";
import type { ViewerResult } from "../domain/types";
import {
  BpmnView,
  filterTree,
  GraphView,
  HtmlView,
  ItmMindMapView,
  ItmTreeView,
  MediaView,
  MindMapView,
  SvgView,
  TableView,
  TreeView,
  type ViewerContentProps
} from "../components/viewers";
import { projectItmGraph } from "./itm/itmViewModel";
import { escapeHtml } from "../parsers/source";
import { serializeItmPipelineDocument } from "./itm/itmSerialization";

type ViewerResultKind = ViewerResult["kind"];
type ViewerResultByKind<K extends ViewerResultKind> = Extract<ViewerResult, { kind: K }>;

export interface ViewerRenderer<K extends ViewerResultKind = ViewerResultKind> {
  kind: K;
  render: (props: ViewerContentProps & { result: ViewerResultByKind<K> }) => JSX.Element;
  snapshot?: (result: ViewerResultByKind<K>) => string;
}

interface RuntimeViewerRenderer {
  kind: ViewerResultKind;
  render: (props: ViewerContentProps) => JSX.Element;
  snapshot?: (result: ViewerResult) => string;
}

function defineViewerRenderer<K extends ViewerResultKind>(renderer: ViewerRenderer<K>): ViewerRenderer<K> {
  return renderer;
}

function toRuntimeViewerRenderer<K extends ViewerResultKind>(renderer: ViewerRenderer<K>): RuntimeViewerRenderer {
  return {
    kind: renderer.kind,
    render: (props) => renderer.render(props as ViewerContentProps & { result: ViewerResultByKind<K> }),
    snapshot: renderer.snapshot ? (result) => renderer.snapshot!(result as ViewerResultByKind<K>) : undefined
  };
}

const defaultRenderers = [
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "html",
    render: ({ result, ...props }) => (
      <HtmlView
        html={result.html}
        query={props.query}
        zoom={props.zoom}
        settings={props.settings}
        searchCommand={props.searchCommand}
        toolbarAction={props.toolbarAction}
        onSearchStateChange={props.onSearchStateChange}
        onOpenSvgArtifact={props.onOpenSvgArtifact}
        sourceSelection={props.sourceSelection}
        onSelectSourceRange={props.onSelectSourceRange}
      />
    ),
    snapshot: (result) => result.html
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "svg",
    render: ({ result, ...props }) => (
      <SvgView
        svg={result.svg}
        query={props.query}
        zoom={props.zoom}
        settings={props.settings}
        searchCommand={props.searchCommand}
        toolbarAction={props.toolbarAction}
        onSearchStateChange={props.onSearchStateChange}
        onZoomChange={props.onZoomChange}
      />
    ),
    snapshot: (result) => result.svg
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "media",
    render: ({ result }) => (
      <MediaView
        blob={result.blob}
        mediaType={result.mediaType}
        mediaKind={result.mediaKind}
        title={result.title}
      />
    ),
    snapshot: (result) => {
      const url = URL.createObjectURL(result.blob);
      if (result.mediaKind === "pdf") {
        return `<object data="${escapeHtml(url)}" type="${escapeHtml(result.mediaType)}" style="width:100%;min-height:80vh"><iframe src="${escapeHtml(url)}" title="${escapeHtml(result.title)}" style="width:100%;min-height:80vh"></iframe></object>`;
      }
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(result.title)}" style="max-width:100%;height:auto" />`;
    }
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "bpmn",
    render: ({ result, ...props }) => (
      <BpmnView
        xml={result.xml}
        zoom={props.zoom}
        toolbarAction={props.toolbarAction}
        onZoomChange={props.onZoomChange}
      />
    ),
    snapshot: (result) => `<pre>${escapeHtml(result.xml)}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "tree",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-tree" style={{ "--viewer-zoom": String(props.zoom) }}>
        <TreeView
          nodes={filterTree(result.nodes, props.query)}
          query={props.query}
          settings={props.settings}
          toolbarAction={props.toolbarAction}
          sourceSelection={props.sourceSelection}
          onSelectSourceRange={props.onSelectSourceRange}
        />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(JSON.stringify(result.nodes, null, 2))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "itm-tree",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-tree" style={{ "--viewer-zoom": String(props.zoom) }}>
        <ItmTreeView
          model={result.model}
          query={props.query}
          settings={props.settings}
          toolbarAction={props.toolbarAction}
          sourceSelection={props.sourceSelection}
          onSelectSourceRange={props.onSelectSourceRange}
        />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(serializeItmPipelineDocument(result.model))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "itm-mindmap",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-mindmap" style={{ "--viewer-zoom": "1" }}>
        <ItmMindMapView
          model={result.model}
          query={props.query}
          zoom={props.zoom}
          settings={props.settings}
          searchCommand={props.searchCommand}
          toolbarAction={props.toolbarAction}
          onSearchStateChange={props.onSearchStateChange}
          onZoomChange={props.onZoomChange}
          sourceSelection={props.sourceSelection}
          onSelectSourceRange={props.onSelectSourceRange}
        />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(serializeItmPipelineDocument(result.model))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "table",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-table" style={{ "--viewer-zoom": String(props.zoom) }}>
        <TableView table={result.table} query={props.query} settings={props.settings} />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(JSON.stringify(result.table, null, 2))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "mindmap",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-mindmap" style={{ "--viewer-zoom": "1" }}>
        <MindMapView
          nodes={result.nodes}
          query={props.query}
          zoom={props.zoom}
          settings={props.settings}
          searchCommand={props.searchCommand}
          toolbarAction={props.toolbarAction}
          onSearchStateChange={props.onSearchStateChange}
          onZoomChange={props.onZoomChange}
          sourceSelection={props.sourceSelection}
          onSelectSourceRange={props.onSelectSourceRange}
        />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(JSON.stringify(result.nodes, null, 2))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "graph",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-graph" style={{ "--viewer-zoom": String(props.zoom) }}>
        <GraphView
          graph={result.graph}
          engine={result.engine}
          query={props.query}
          settings={props.settings}
          searchCommand={props.searchCommand}
          toolbarAction={props.toolbarAction}
          onSearchStateChange={props.onSearchStateChange}
          sourceSelection={props.sourceSelection}
          onSelectSourceRange={props.onSelectSourceRange}
        />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(JSON.stringify(result.graph, null, 2))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "itm-graph",
    render: ({ result, ...props }) => (
      <div class="viewer-content viewer-graph" style={{ "--viewer-zoom": String(props.zoom) }}>
        <GraphView
          graph={projectItmGraph(result.model)}
          engine={result.engine}
          query={props.query}
          settings={props.settings}
          searchCommand={props.searchCommand}
          toolbarAction={props.toolbarAction}
          onSearchStateChange={props.onSearchStateChange}
          sourceSelection={props.sourceSelection}
          onSelectSourceRange={props.onSelectSourceRange}
        />
      </div>
    ),
    snapshot: (result) => `<pre>${escapeHtml(serializeItmPipelineDocument(result.model))}</pre>`
  })),
  toRuntimeViewerRenderer(defineViewerRenderer({
    kind: "editor-skeleton",
    render: ({ result, ...props }) => (
      <div class="viewer-content editor-skeleton" style={{ "--viewer-zoom": String(props.zoom) }}>
        <h2>{result.title}</h2>
        <p>{result.message}</p>
        <p>Editor surface: {result.editorKind}</p>
      </div>
    ),
    snapshot: (result) => `<p>${escapeHtml(result.message)}</p>`
  }))
];

const rendererRegistry = new Map<ViewerResultKind, RuntimeViewerRenderer>();

for (const renderer of defaultRenderers) {
  rendererRegistry.set(renderer.kind, renderer);
}

export function registerViewerRenderer<K extends ViewerResultKind>(renderer: ViewerRenderer<K>): void {
  rendererRegistry.set(renderer.kind, toRuntimeViewerRenderer(renderer));
}

export function ViewerContent(props: ViewerContentProps) {
  const renderer = rendererRegistry.get(props.result.kind);
  if (!renderer) {
    return (
      <div class="viewer-content editor-skeleton" style={{ "--viewer-zoom": String(props.zoom) }}>
        <h2>{props.result.title}</h2>
        <p>Unsupported viewer kind: {props.result.kind}</p>
      </div>
    );
  }

  return renderer.render(props as never);
}

export function viewerSnapshotHtml(result: ViewerResult): string {
  const renderer = rendererRegistry.get(result.kind);
  if (renderer?.snapshot) {
    return renderer.snapshot(result as never);
  }

  return `<pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
}
