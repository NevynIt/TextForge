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
    return <div class="viewer-content viewer-html" style={style} dangerouslySetInnerHTML={{ __html: result.html }} />;
  }
  if (result.kind === "svg") {
    return <div class="viewer-content viewer-svg" style={style} dangerouslySetInnerHTML={{ __html: result.svg }} />;
  }
  if (result.kind === "tree") {
    return (
      <div class="viewer-content viewer-tree" style={style}>
        <TreeView nodes={filterTree(result.nodes, query)} />
      </div>
    );
  }
  if (result.kind === "table") {
    return (
      <div class="viewer-content viewer-table" style={style}>
        <TableView table={result.table} query={query} />
      </div>
    );
  }
  if (result.kind === "mindmap") {
    return (
      <div class="viewer-content viewer-mindmap" style={style}>
        <MindMapView nodes={filterTree(result.nodes, query)} />
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

function TreeView({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ol class="tree-list">
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} />
      ))}
    </ol>
  );
}

function TreeItem({ node }: { node: TreeNode }) {
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <details open={hasChildren}>
        <summary>
          <span class="node-label">{node.label}</span>
          {node.declaredId ? <span class="badge">&amp;{node.declaredId}</span> : null}
          {node.type ? <span class="badge">{node.type}</span> : null}
          {(node.tags || []).map((tag) => (
            <span class="badge" key={tag}>#{tag}</span>
          ))}
          {node.links?.length ? <span class="badge">{node.links.length} links</span> : null}
        </summary>
        {node.details ? <pre class="node-details">{node.details}</pre> : null}
        {hasChildren ? <TreeView nodes={node.children} /> : null}
      </details>
    </li>
  );
}

function TableView({ table, query }: { table: TableModel; query: string }) {
  const lower = query.trim().toLowerCase();
  const rows = lower
    ? table.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(lower)))
    : table.rows;
  return (
    <table>
      <thead>
        <tr>
          {table.columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {table.columns.map((_column, columnIndex) => (
              <td key={columnIndex}>{row[columnIndex] || ""}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MindMapView({ nodes }: { nodes: TreeNode[] }) {
  return (
    <div class="mindmap-roots">
      {nodes.map((node) => (
        <MindMapNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

function MindMapNode({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div class="mindmap-node-wrap">
      <div class={`mindmap-node depth-${Math.min(depth, 4)}`}>
        <span>{node.label}</span>
        {node.type ? <small>{node.type}</small> : null}
      </div>
      {node.children.length ? (
        <div class="mindmap-children">
          {node.children.map((child) => (
            <MindMapNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
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
  const layout = stringSetting(settings.layout, engine === "sigma" ? "circle" : "breadthfirst");
  const nodeSize = numberSetting(settings.nodeSize, 18);
  const edgeWidth = numberSetting(settings.edgeWidth, 1.5);
  const showLabels = booleanSetting(settings.showLabels, true);
  const showEdgeLabels = booleanSetting(settings.showEdgeLabels, false);
  const colorByType = booleanSetting(settings.colorByType, true);
  const performanceMode = stringSetting(settings.performanceMode, "balanced");

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
            ...graph.nodes.map((node) => ({
              data: {
                id: node.id,
                label: node.label,
                kind: node.type || "node",
                size: node.size || nodeSize,
                color: node.color || typeColor(colorByType ? node.type || "node" : "node"),
                matched: highlighted && node.label.toLowerCase().includes(highlighted)
              }
            })),
            ...graph.edges.map((edge, index) => ({
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
                "target-arrow-shape": graph.directed ? "triangle" : "none",
                "curve-style": "bezier",
                label: showEdgeLabels && performanceMode === "readable" ? "data(label)" : "",
                "font-size": 9
              }
            }
          ],
          layout: { name: layout, directed: graph.directed !== false, padding: 40, animate: performanceMode === "readable" } as never
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
        const Graphology = (await import("graphology")).default;
        const Sigma = (await import("sigma")).default;
        const g = new Graphology({ type: graph.directed === false ? "undirected" : "directed" });
        const count = Math.max(1, graph.nodes.length);
        graph.nodes.forEach((node, index) => {
          const coordinates = sigmaCoordinates(index, count, layout);
          g.addNode(node.id, {
            x: node.x ?? coordinates.x,
            y: node.y ?? coordinates.y,
            size: node.size || nodeSize / 2,
            label: showLabels && performanceMode !== "dense" ? node.label : "",
            color: highlighted && node.label.toLowerCase().includes(highlighted) ? "#cf6f2a" : node.color || typeColor(colorByType ? node.type || "node" : "node"),
            kind: node.type || "node"
          });
        });
        graph.edges.forEach((edge, index) => {
          if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
            g.addEdgeWithKey(edge.id || `edge-${index}`, edge.source, edge.target, {
              label: showEdgeLabels && performanceMode === "readable" ? edge.label || edge.type || "" : "",
              size: edge.width || edgeWidth,
              color: edge.color || "#87939f"
            });
          }
        });
        const renderer = new Sigma(g, containerRef.current);
        renderer.on("clickNode", ({ node }) => {
          setSelected({
            id: node,
            label: String(g.getNodeAttribute(node, "label") || node),
            kind: "node",
            type: String(g.getNodeAttribute(node, "kind") || "")
          });
        });
        cleanup = () => renderer.kill();
      }
    }

    mount().catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });

    return () => cleanup?.();
  }, [graph, engine, highlighted, layout, nodeSize, edgeWidth, showLabels, showEdgeLabels, colorByType, performanceMode]);

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
          {graph.nodes.length} nodes · {graph.edges.length} edges · {layout}
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

function sigmaCoordinates(index: number, count: number, layout: string): { x: number; y: number } {
  if (layout === "grid") {
    const width = Math.ceil(Math.sqrt(count));
    return { x: (index % width) - width / 2, y: Math.floor(index / width) - width / 2 };
  }
  if (layout === "random") {
    const hash = (index * 9301 + 49297) % 233280;
    return { x: hash / 116640 - 1, y: ((hash * 37) % 233280) / 116640 - 1 };
  }
  const angle = (Math.PI * 2 * index) / Math.max(1, count);
  return { x: Math.cos(angle), y: Math.sin(angle) };
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
