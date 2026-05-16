import jsMind from "jsmind";
import "jsmind/style/jsmind.css";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { GraphModel, TableModel, TreeNode, ViewerResult, ViewerSettingValue } from "../domain/types";
import { escapeHtml } from "../parsers/source";

interface ViewerContentProps {
  result: ViewerResult;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
}

export function ViewerContent({ result, query, zoom, settings }: ViewerContentProps) {
  const style = { "--viewer-zoom": String(zoom) };
  if (result.kind === "html") {
    return <HtmlView html={result.html} query={query} zoom={zoom} settings={settings} />;
  }
  if (result.kind === "svg") {
    return <SvgView svg={result.svg} query={query} zoom={zoom} settings={settings} />;
  }
  if (result.kind === "tree") {
    return (
      <div class="viewer-content viewer-tree" style={style}>
        <TreeView nodes={filterTree(result.nodes, query)} query={query} settings={settings} />
      </div>
    );
  }
  if (result.kind === "table") {
    return (
      <div class="viewer-content viewer-table" style={style}>
        <TableView table={result.table} query={query} settings={settings} />
      </div>
    );
  }
  if (result.kind === "mindmap") {
    return (
      <div class="viewer-content viewer-mindmap" style={style}>
        <MindMapView nodes={filterTree(result.nodes, query)} query={query} settings={settings} />
      </div>
    );
  }
  if (result.kind === "graph") {
    return (
      <div class="viewer-content viewer-graph" style={style}>
        <GraphView graph={result.graph} engine={result.engine} query={query} settings={settings} />
      </div>
    );
  }
  return (
    <div class="viewer-content editor-skeleton" style={style}>
      <h2>{result.title}</h2>
      <p>{result.message}</p>
      <p>Editor surface: {result.editorKind}</p>
    </div>
  );
}

function HtmlView({
  html,
  query,
  zoom,
  settings
}: {
  html: string;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = safeClassName(stringSetting(settings.readingTheme, "light"));
  const width = safeClassName(stringSetting(settings.contentWidth, "normal"));

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.innerHTML = html;
    highlightTextNodes(ref.current, query);
  }, [html, query]);

  return <div ref={ref} class={`viewer-content viewer-html theme-${theme} width-${width}`} style={{ "--viewer-zoom": String(zoom) }} />;
}

function SvgView({
  svg,
  query,
  zoom,
  settings
}: {
  svg: string;
  query: string;
  zoom: number;
  settings: Record<string, ViewerSettingValue>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const background = safeClassName(stringSetting(settings.svgBackground, "white"));
  const fitMode = safeClassName(stringSetting(settings.fitMode, "contain"));

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.innerHTML = svg;
    highlightSvgText(ref.current, query);
  }, [svg, query]);

  return (
    <div class={`viewer-content viewer-svg svg-bg-${background} svg-fit-${fitMode}`} style={{ "--viewer-zoom": String(zoom) }}>
      <div class="svg-frame" ref={ref} />
    </div>
  );
}

function TreeView({
  nodes,
  query,
  settings
}: {
  nodes: TreeNode[];
  query: string;
  settings: Record<string, ViewerSettingValue>;
}) {
  const density = safeClassName(stringSetting(settings.density, "comfortable"));
  return (
    <ol class={`tree-list tree-${density}`}>
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} depth={0} query={query} settings={settings} />
      ))}
    </ol>
  );
}

function TreeItem({
  node,
  depth,
  query,
  settings
}: {
  node: TreeNode;
  depth: number;
  query: string;
  settings: Record<string, ViewerSettingValue>;
}) {
  const hasChildren = node.children.length > 0;
  const expandDepth = numberSetting(settings.expandDepth, 3);
  const depthLimit = numberSetting(settings.depthLimit, 0);
  const showDetails = booleanSetting(settings.showDetails, true);
  const canShowChildren = hasChildren && (depthLimit === 0 || depth < depthLimit);
  return (
    <li>
      <details open={canShowChildren && depth < expandDepth}>
        <summary>
          <span class="node-label">{renderHighlighted(node.label, query)}</span>
          {node.declaredId ? <span class="badge">&amp;{node.declaredId}</span> : null}
          {node.type ? <span class="badge">{node.type}</span> : null}
          {(node.tags || []).map((tag) => (
            <span class="badge" key={tag}>#{tag}</span>
          ))}
          {node.links?.length ? <span class="badge">{node.links.length} links</span> : null}
        </summary>
        {showDetails && node.details ? <pre class="node-details">{node.details}</pre> : null}
        {canShowChildren ? (
          <ol class="tree-list">
            {node.children.map((child) => (
              <TreeItem key={child.id} node={child} depth={depth + 1} query={query} settings={settings} />
            ))}
          </ol>
        ) : null}
        {hasChildren && !canShowChildren ? <small class="tree-pruned">{node.children.length} hidden children</small> : null}
      </details>
    </li>
  );
}

function TableView({
  table,
  query,
  settings
}: {
  table: TableModel;
  query: string;
  settings: Record<string, ViewerSettingValue>;
}) {
  const lower = query.trim().toLowerCase();
  const sortColumn = stringSetting(settings.sortColumn, "").trim();
  const sortDirection = stringSetting(settings.sortDirection, "asc");
  const maxRows = numberSetting(settings.maxRows, 1000);
  const sortIndex = resolveColumnIndex(table.columns, sortColumn);
  const filteredRows = lower
    ? table.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(lower)))
    : table.rows;
  const sortedRows =
    sortIndex >= 0
      ? [...filteredRows].sort((left, right) => compareCell(left[sortIndex] || "", right[sortIndex] || "", sortDirection))
      : filteredRows;
  const rows = maxRows > 0 ? sortedRows.slice(0, maxRows) : sortedRows;
  return (
    <>
      <div class="table-status">
        <span>
          {rows.length} of {filteredRows.length} rows
        </span>
        {sortIndex >= 0 ? <span>sorted by {table.columns[sortIndex]}</span> : null}
      </div>
      <table>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column}>{renderHighlighted(column, query)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {table.columns.map((_column, columnIndex) => (
                <td key={columnIndex}>{renderHighlighted(row[columnIndex] || "", query)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MindMapView({
  nodes,
  query,
  settings
}: {
  nodes: TreeNode[];
  query: string;
  settings: Record<string, ViewerSettingValue>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mind = useMemo(() => treeToJsMind(nodes), [nodes]);
  const mode = stringSetting(settings.mindmapMode, "full");
  const initialDepth = stringSetting(settings.initialDepth, "depth2");
  const theme = safeClassName(stringSetting(settings.mindmapTheme, "textforge"));
  const textScale = numberSetting(settings.textScale, 1);

  useEffect(() => {
    const host = hostRef.current;
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
        draggable: true,
        hide_scrollbars_when_draggable: true,
        hmargin: 120,
        vmargin: 80,
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
        enable_mousewheel_handle: true
      },
      shortcut: { enable: false }
    });

    instance.show(mind);
    if (initialDepth === "collapsed") {
      instance.collapse_all?.();
    } else if (initialDepth === "depth2") {
      instance.expand_to_depth?.(2);
    } else {
      instance.expand_all?.();
    }
    const firstMatch = findFirstMatchingTreeNode(nodes, query);
    if (firstMatch) {
      instance.select_node?.(firstMatch.id);
      instance.scroll_node_to_center?.(firstMatch.id);
    } else {
      instance.scroll_node_to_center?.(mind.data.id);
    }
    window.setTimeout(() => instance.resize?.(), 0);

    return () => {
      host.innerHTML = "";
    };
  }, [mind, mode, initialDepth, theme, textScale, nodes, query]);

  return (
    <section class="jsmind-viewer-shell">
      <div class="jsmind-viewer-meta">
        <strong>{mind.meta.name}</strong>
        <span>{countTreeNodes(nodes)} nodes</span>
      </div>
      <div class="jsmind-viewer-host" ref={hostRef} />
    </section>
  );
}

function GraphView({
  graph,
  engine,
  query,
  settings
}: {
  graph: GraphModel;
  engine: "cytoscape" | "sigma" | "static";
  query: string;
  settings: Record<string, ViewerSettingValue>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ id: string; label: string; kind: "node" | "edge"; type?: string } | null>(null);
  const highlighted = useMemo(() => query.trim().toLowerCase(), [query]);
  const layout = stringSetting(settings.layout, engine === "sigma" ? "forceatlas2" : "breadthfirst");
  const nodeSize = numberSetting(settings.nodeSize, 18);
  const edgeWidth = numberSetting(settings.edgeWidth, 1.5);
  const showLabels = booleanSetting(settings.showLabels, true);
  const showEdgeLabels = booleanSetting(settings.showEdgeLabels, false);
  const colorByType = booleanSetting(settings.colorByType, true);
  const performanceMode = stringSetting(settings.performanceMode, "balanced");
  const filterToMatches = booleanSetting(settings.filterToMatches, false);
  const layoutIterations = numberSetting(settings.layoutIterations, 120);
  const labelMode = stringSetting(settings.labelMode, "auto");
  const sizeMetric = stringSetting(settings.sizeMetric, engine === "sigma" ? "degree" : "fixed");
  const focusNeighbors = booleanSetting(settings.focusNeighbors, false);
  const visibleGraph = useMemo(() => filterGraph(graph, highlighted, filterToMatches), [graph, highlighted, filterToMatches]);

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
            ...visibleGraph.nodes.map((node) => ({
              data: {
                id: node.id,
                label: node.label,
                kind: node.type || "node",
                size: node.size || nodeSize,
                color: node.color || typeColor(colorByType ? node.type || "node" : "node"),
                matched: highlighted && node.label.toLowerCase().includes(highlighted)
              }
            })),
            ...visibleGraph.edges.map((edge, index) => ({
              data: {
                id: edge.id || `edge-${index}`,
                source: edge.source,
                target: edge.target,
                label: edge.label || edge.type || "",
                width: edge.width || edgeWidth,
                color: edge.color || "#87939f"
              }
            }))
          ],
          style: [
            {
              selector: "node",
              style: {
                label: showLabels && performanceMode !== "dense" ? "data(label)" : "",
                "background-color": "data(color)",
                width: "data(size)",
                height: "data(size)",
                color: "#202225",
                "font-size": performanceMode === "readable" ? 13 : 11,
                "text-valign": "bottom",
                "text-margin-y": 5
              }
            },
            {
              selector: "node[matched]",
              style: { "background-color": "#cf6f2a", "border-width": 3, "border-color": "#1f1f1f" }
            },
            {
              selector: "edge",
              style: {
                width: "data(width)",
                "line-color": "data(color)",
                "target-arrow-color": "data(color)",
                "target-arrow-shape": visibleGraph.directed ? "triangle" : "none",
                "curve-style": "bezier",
                label: showEdgeLabels && performanceMode === "readable" ? "data(label)" : "",
                "font-size": 9
              }
            }
          ],
          layout: { name: layout, directed: visibleGraph.directed !== false, padding: 40, animate: performanceMode === "readable" } as never
        });
        cy.on("select", "node, edge", (event) => {
          const target = event.target;
          setSelected({
            id: target.id(),
            label: String(target.data("label") || target.id()),
            kind: target.isNode() ? "node" : "edge",
            type: String(target.data("kind") || target.data("label") || "")
          });
        });
        cleanup = () => cy.destroy();
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
          g.addNode(node.id, {
            x: Number.isFinite(node.x) ? node.x : 0,
            y: Number.isFinite(node.y) ? node.y : 0,
            baseSize: node.size || nodeSize / 2,
            size: node.size || nodeSize / 2,
            label: node.label,
            color: highlighted && node.label.toLowerCase().includes(highlighted) ? "#cf6f2a" : node.color || typeColor(colorByType ? node.type || "node" : "node"),
            kind: node.type || "node",
            matched: Boolean(highlighted && [node.id, node.label, node.type].filter(Boolean).join(" ").toLowerCase().includes(highlighted))
          });
        });
        visibleGraph.edges.forEach((edge, index) => {
          if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
            const edgeKey = uniqueGraphologyEdgeKey(g, edge.id || `edge-${index}`);
            const attrs = {
              label: edge.label || edge.type || "",
              size: edge.width || edgeWidth,
              color: edge.color || "#87939f",
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
        let selectedNode = "";
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
          if (!selectedNode || !g.hasNode(selectedNode)) {
            return nodes;
          }
          nodes.add(selectedNode);
          g.neighbors(selectedNode).forEach((node: string) => nodes.add(node));
          return nodes;
        };
        const renderer = new Sigma(g, containerRef.current, {
          defaultNodeColor: "#3a6ea5",
          defaultEdgeColor: "#87939f",
          renderEdgeLabels: showEdgeLabels && performanceMode === "readable",
          labelDensity: performanceMode === "readable" ? 1 : 0.4,
          nodeReducer(node: string, data: Record<string, unknown>) {
            const neighborhood = focusNeighbors ? selectedNeighborhood() : null;
            const mutedByFocus = Boolean(neighborhood && neighborhood.size && !neighborhood.has(node));
            const mutedBySearch = Boolean(matchedNodes.size && !matchedNodes.has(node));
            return {
              ...data,
              label: labelMode === "none" || !showLabels || performanceMode === "dense" ? "" : String(data.label || ""),
              color: mutedByFocus || mutedBySearch ? "#bac2c7" : String(data.color || "#3a6ea5"),
              size: mutedByFocus || mutedBySearch ? Math.max(2, Number(data.size) * 0.5) : Number(data.size) || nodeSize / 2,
              forceLabel: labelMode === "all" || node === selectedNode || matchedNodes.has(node),
              highlighted: node === selectedNode || matchedNodes.has(node)
            };
          },
          edgeReducer(edge: string, data: Record<string, unknown>) {
            const source = g.source(edge);
            const target = g.target(edge);
            const neighborhood = focusNeighbors ? selectedNeighborhood() : null;
            const outsideFocus = Boolean(neighborhood && neighborhood.size && (!neighborhood.has(source) || !neighborhood.has(target)));
            const outsideSearch = Boolean(matchedNodes.size && !matchedNodes.has(source) && !matchedNodes.has(target) && !data.matched);
            return {
              ...data,
              label: showEdgeLabels && performanceMode === "readable" ? String(data.label || "") : "",
              color: outsideFocus || outsideSearch ? "#d2d7dc" : String(data.color || "#87939f"),
              size: outsideFocus || outsideSearch ? 0.5 : Number(data.size) || edgeWidth,
              hidden: outsideFocus
            };
          }
        });
        renderer.on("clickNode", ({ node }) => {
          selectedNode = node;
          setSelected({
            id: node,
            label: String(g.getNodeAttribute(node, "label") || node),
            kind: "node",
            type: String(g.getNodeAttribute(node, "kind") || "")
          });
          renderer.refresh();
        });
        renderer.on("clickStage", () => {
          selectedNode = "";
          setSelected(null);
          renderer.refresh();
        });
        cleanup = () => renderer.kill();
      }
    }

    mount().catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });

    return () => cleanup?.();
  }, [
    visibleGraph,
    engine,
    highlighted,
    layout,
    nodeSize,
    edgeWidth,
    showLabels,
    showEdgeLabels,
    colorByType,
    performanceMode,
    layoutIterations,
    labelMode,
    sizeMetric,
    focusNeighbors
  ]);

  if (error) {
    return <StaticGraph graph={graph} error={error} />;
  }
  return (
    <div class="graph-view-wrap">
      <div class="graph-canvas" ref={containerRef} />
      <aside class="graph-inspector">
        <strong>Inspector</strong>
        {selected ? (
          <>
            <span>{selected.kind}</span>
            <h3>{selected.label}</h3>
            <p>{selected.id}</p>
            {selected.type ? <p>{selected.type}</p> : null}
          </>
        ) : (
          <p>Select a node or edge.</p>
        )}
        <small>
          {visibleGraph.nodes.length} of {graph.nodes.length} nodes - {visibleGraph.edges.length} of {graph.edges.length} edges - {layout}
        </small>
      </aside>
    </div>
  );
}

function StaticGraph({ graph, error }: { graph: GraphModel; error: string }) {
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

interface JsMindNode {
  id: string;
  topic: string;
  expanded?: boolean;
  direction?: "left" | "right";
  children?: JsMindNode[];
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

function treeNodeToJsMind(node: TreeNode, index: number): JsMindNode {
  return {
    id: node.id,
    topic: node.type ? `${node.label} (${node.type})` : node.label,
    expanded: true,
    direction: index % 2 === 0 ? "right" : "left",
    children: node.children.map((child, childIndex) => treeNodeToJsMind(child, childIndex))
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

function countTreeNodes(nodes: TreeNode[]): number {
  return nodes.reduce((count, node) => count + 1 + countTreeNodes(node.children), 0);
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
  hasEdge?: (edge: string) => boolean;
}

function filterGraph(graph: GraphModel, query: string, filterToMatches: boolean): GraphModel {
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

function resolveColumnIndex(columns: string[], sortColumn: string): number {
  if (!sortColumn) {
    return -1;
  }
  const numeric = Number(sortColumn);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= columns.length) {
    return numeric - 1;
  }
  return columns.findIndex((column) => column.toLowerCase() === sortColumn.toLowerCase());
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

function highlightTextNodes(root: HTMLElement, query: string): void {
  const needle = query.trim();
  if (!needle) {
    return;
  }
  const lowerNeedle = needle.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const matches: Text[] = [];
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
      cursor = matchIndex + needle.length;
      matchIndex = value.toLowerCase().indexOf(lowerNeedle, cursor);
    }
    fragment.append(document.createTextNode(value.slice(cursor)));
    node.parentNode?.replaceChild(fragment, node);
  });
}

function highlightSvgText(root: HTMLElement, query: string): void {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return;
  }
  root.querySelectorAll("text,tspan").forEach((element) => {
    if ((element.textContent || "").toLowerCase().includes(needle)) {
      element.classList.add("svg-text-match");
    }
  });
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
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

export function viewerSnapshotHtml(result: ViewerResult): string {
  if (result.kind === "html") {
    return result.html;
  }
  if (result.kind === "svg") {
    return result.svg;
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
  return `<p>${escapeHtml(result.message)}</p>`;
}
