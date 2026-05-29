import {
  createContributionManifest,
  createDiagnostic,
  createResourcePredicate,
} from '@textforge/core';
import {
  createWorkspaceItmIncludeProvider,
  loadItmDocument,
  resolveItmVisualTarget,
} from '@textforge/itm';
import {
  isVisualItmDocument,
  validateVisualItmDocument,
} from '@textforge/visual-itm';

const sigmaSurfaceId = '@textforge/renderer-sigma/runtime';
const itmVisualCapabilityId = '@textforge/itm/capability/view';

export const sigmaItmDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
});

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stringifyScalar(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function normalizeSearchText(values) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => stringifyScalar(value).trim().toLowerCase())
    .filter(Boolean);
}

function readStyleValue(style, key) {
  const value = style?.[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function chooseNodeColor(node) {
  return readStyleValue(node.style, 'background-color')
    ?? readStyleValue(node.style, 'fill')
    ?? readStyleValue(node.style, 'color')
    ?? '#2563eb';
}

function chooseEdgeColor(edge) {
  return readStyleValue(edge.style, 'line-color')
    ?? readStyleValue(edge.style, 'stroke')
    ?? readStyleValue(edge.style, 'color')
    ?? '#64748b';
}

function chooseEdgeWidth(edge) {
  const width = Number.parseFloat(readStyleValue(edge.style, 'width') ?? readStyleValue(edge.style, 'stroke-width') ?? '');
  return Number.isFinite(width) && width > 0 ? width : 1.7;
}

function chooseNodeSize(node) {
  const height = Number.parseFloat(readStyleValue(node.style, 'height') ?? '');
  const width = Number.parseFloat(readStyleValue(node.style, 'width') ?? '');
  const size = Math.max(
    Number.isFinite(height) ? height : 0,
    Number.isFinite(width) ? width : 0,
  );
  return size > 0 ? Math.min(Math.max(size, 3), 20) : 8;
}

function createSurfaceIncludeProviders(execution) {
  const includeProviders = [];
  if (execution.workspaceService?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(execution.workspaceService, {
      basePath: execution.resource?.path,
      ...(execution.repositoryResolution ?? {}),
    }));
  }
  return includeProviders;
}

function createRuntimeMessageHtml(title, message, tone = 'info') {
  return `
    <section class="tf-visual-runtime tf-visual-runtime--${escapeHtml(tone)}">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">Sigma runtime</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
      </header>
      <div class="tf-visual-runtime__body tf-visual-runtime__body--message">
        <p class="tf-visual-runtime__message">${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function createBaseRuntimeMarkup(title, diagnosticsCount) {
  return `
    <section class="tf-visual-runtime tf-visual-runtime--sigma">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">Sigma runtime</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
        <div class="tf-visual-runtime__meta">
          <span data-runtime-summary>0 nodes / 0 edges</span>
          <span data-runtime-diagnostics>${diagnosticsCount} diagnostics</span>
        </div>
      </header>
      <div class="tf-visual-runtime__toolbar">
        <label class="tf-visual-runtime__field">
          <span>Layout</span>
          <select data-runtime-layout>
            <option value="forceatlas2">ForceAtlas2</option>
            <option value="noverlap">Noverlap</option>
            <option value="circular">Circular</option>
            <option value="random">Random</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field">
          <span>Node size</span>
          <select data-runtime-size-metric>
            <option value="degree">Degree</option>
            <option value="pagerank">Pagerank</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field">
          <span>Labels</span>
          <select data-runtime-label-mode>
            <option value="matched">Matches</option>
            <option value="all">All</option>
            <option value="none">None</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field tf-visual-runtime__field--search">
          <span>Search</span>
          <input type="search" data-runtime-search placeholder="Node, type, relation" />
        </label>
        <div class="tf-visual-runtime__toggle-row">
          <label class="tf-visual-runtime__toggle"><input type="checkbox" data-runtime-focus-neighbors /> Focus neighbors</label>
          <label class="tf-visual-runtime__toggle"><input type="checkbox" data-runtime-filter-matches /> Matches only</label>
        </div>
        <div class="tf-visual-runtime__actions">
          <button type="button" data-runtime-fit>Fit</button>
          <button type="button" data-runtime-zoom-in>Zoom in</button>
          <button type="button" data-runtime-zoom-out>Zoom out</button>
          <button type="button" data-runtime-rerun-layout>Run layout</button>
        </div>
      </div>
      <div class="tf-visual-runtime__body">
        <div class="tf-visual-runtime__stage" data-runtime-stage></div>
        <aside class="tf-visual-runtime__sidebar">
          <section class="tf-visual-runtime__panel">
            <h5>Selection</h5>
            <div data-runtime-selection class="tf-visual-runtime__empty">Select a node or edge.</div>
          </section>
          <section class="tf-visual-runtime__panel">
            <h5>Search</h5>
            <div data-runtime-search-status class="tf-visual-runtime__empty">No active search.</div>
          </section>
        </aside>
      </div>
    </section>
  `;
}

function createEmptySelectionMarkup(message = 'Select a node or edge.') {
  return `<p class="tf-visual-runtime__empty">${escapeHtml(message)}</p>`;
}

function createSelectionMarkup(entry) {
  const primaryProvenance = entry.provenance?.[0];
  const secondaryProvenance = entry.provenance?.slice(1) ?? [];
  return `
    <dl class="tf-visual-runtime__detail-list">
      <div><dt>Label</dt><dd>${escapeHtml(entry.label ?? entry.id)}</dd></div>
      <div><dt>ID</dt><dd>${escapeHtml(entry.id)}</dd></div>
      <div><dt>Kind</dt><dd>${escapeHtml(entry.kind ?? 'n/a')}</dd></div>
      <div><dt>Classes</dt><dd>${escapeHtml((entry.classes ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Tags</dt><dd>${escapeHtml((entry.tags ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Trace</dt><dd>${escapeHtml(primaryProvenance?.sourceId ?? primaryProvenance?.sourcePath ?? 'none')}</dd></div>
      <div><dt>Extra provenance</dt><dd>${escapeHtml(String(secondaryProvenance.length))}</dd></div>
    </dl>
    <div class="tf-visual-runtime__detail-actions">
      <button type="button" data-runtime-open-source ${primaryProvenance?.sourcePath ? '' : 'disabled'}>Open source</button>
    </div>
  `;
}

function createUnavailableDiagnostics(resource, message, code) {
  return [
    createDiagnostic(message, 'error', {
      resource,
      code,
      origin: {
        packageId: '@textforge/renderer-sigma',
        subsystem: 'sigma-runtime',
        contributionId: sigmaSurfaceId,
      },
    }),
  ];
}

export function createSigmaGraphDescriptor(visualDocument) {
  return {
    nodes: visualDocument.nodes.map((node) => ({
      id: node.id,
      label: node.label ?? node.id,
      kind: node.kind,
      classes: [...(node.classes ?? [])],
      tags: [...(node.tags ?? [])],
      style: node.style,
      provenance: node.provenance,
    })),
    edges: visualDocument.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label ?? edge.id,
      kind: edge.kind,
      classes: [...(edge.classes ?? [])],
      tags: [...(edge.tags ?? [])],
      style: edge.style,
      provenance: edge.provenance,
    })),
  };
}

export function findSigmaMatches(visualDocument, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const nodeMatches = visualDocument.nodes
    .filter((node) => normalizeSearchText([
      node.id,
      node.label,
      node.kind,
      node.classes,
      node.tags,
    ]).some((value) => value.includes(normalizedQuery)))
    .map((node) => ({
      id: node.id,
      kind: 'node',
      label: node.label ?? node.id,
    }));
  const edgeMatches = visualDocument.edges
    .filter((edge) => normalizeSearchText([
      edge.id,
      edge.label,
      edge.kind,
      edge.sourceId,
      edge.targetId,
      edge.classes,
      edge.tags,
    ]).some((value) => value.includes(normalizedQuery)))
    .map((edge) => ({
      id: edge.id,
      kind: 'edge',
      label: edge.label ?? edge.id,
    }));

  return [...nodeMatches, ...edgeMatches];
}

export function createSigmaSurfaceModel(visualDocument, options = {}) {
  const diagnostics = [
    ...(options.diagnostics ?? []),
    ...validateVisualItmDocument(visualDocument),
  ];
  const valid = isVisualItmDocument(visualDocument)
    ? visualDocument
    : {
      format: 'textforge.visual-itm/v1',
      origin: { mode: 'translated' },
      nodes: [],
      edges: [],
    };

  return {
    id: `sigma:${options.title ?? 'visual-itm'}`,
    title: options.title ?? 'Sigma graph',
    summary: `Interactive Sigma graph for ${valid.nodes.length} nodes and ${valid.edges.length} edges.`,
    detail: `${valid.nodes.length} nodes / ${valid.edges.length} edges`,
    diagnostics,
    visualDocument: valid,
    graph: createSigmaGraphDescriptor(valid),
  };
}

async function resolveSurfaceModelFromExecution(execution, title) {
  const sourceText = execution.sourceText ?? '';
  if (!sourceText.trim()) {
    return {
      model: createSigmaSurfaceModel({
        format: 'textforge.visual-itm/v1',
        origin: { mode: 'translated' },
        nodes: [],
        edges: [],
      }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'No ITM source is available for the Sigma surface.', 'renderer-sigma.source-missing'),
      }),
      surfaceHtml: createRuntimeMessageHtml(title, 'No ITM source is available for this surface.', 'error'),
    };
  }

  const loaded = await loadItmDocument(sourceText, {
    strict: false,
    uri: execution.resource?.path,
    includeProviders: createSurfaceIncludeProviders(execution),
    repositoryResolution: execution.repositoryResolution,
    contributionRegistry: execution.contributionRegistry,
    documentResource: {
      path: execution.resource?.path,
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: execution.resource?.mimeType ?? 'text/x-itm',
    },
  });
  const requestedTarget = execution.session?.surfaceState?.itmVisualTarget;
  const resolved = resolveItmVisualTarget(loaded, {
    target: requestedTarget,
    projection: 'graph',
    title,
  });

  return {
    model: createSigmaSurfaceModel(resolved.visualDocument, {
      title,
      diagnostics: [...resolved.diagnostics, ...resolved.visualDiagnostics],
    }),
  };
}

function graphologyDegreeMap(graph) {
  const degree = new Map();
  for (const node of graph.nodes()) {
    degree.set(node, graph.degree(node) || 0);
  }
  return degree;
}

function metricDomain(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) {
    return [0, 1];
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return min === max ? [min, min + 1] : [min, max];
}

function sigmaNodeSize(nodeId, baseSize, metric, degrees, pageranks, domain) {
  if (metric === 'fixed') {
    return baseSize;
  }

  const value = metric === 'pagerank'
    ? pageranks.get(nodeId) || 0
    : degrees.get(nodeId) || 0;
  const ratio = (value - domain[0]) / (domain[1] - domain[0]);
  return 4 + Math.min(Math.max(ratio, 0), 1) * Math.max(6, baseSize * 1.6);
}

function uniqueGraphologyEdgeKey(graph, baseKey) {
  const base = baseKey || `edge-${Date.now()}`;
  if (!graph.hasEdge(base)) {
    return base;
  }

  let index = 2;
  while (graph.hasEdge(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function safePagerankValues(graph, pagerank) {
  const values = new Map();
  for (const node of graph.nodes()) {
    values.set(node, 0);
  }
  try {
    const ranks = pagerank(graph, { alpha: 0.85, maxIterations: 100, tolerance: 1e-6 });
    for (const [id, value] of Object.entries(ranks)) {
      values.set(id, Number(value) || 0);
    }
  } catch {
    return values;
  }
  return values;
}

function runSigmaGraphologyLayout(graph, layouts, layoutName, iterations) {
  const count = Math.max(1, Math.min(1000, Math.round(iterations) || 120));
  const scale = Math.max(4, Math.sqrt(Math.max(1, Number(graph.order) || 1)) * 8);
  if (layoutName === 'random') {
    layouts.randomLayout.assign(graph, { scale, center: 0 });
  } else if (layoutName === 'circular') {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
  } else if (layoutName === 'noverlap') {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
    layouts.noverlap.assign(graph, {
      maxIterations: count,
      settings: { margin: 4, ratio: 1.2, expansion: 1.1 },
    });
  } else {
    layouts.circularLayout.assign(graph, { scale, center: 0 });
    layouts.forceAtlas2.assign(graph, {
      iterations: count,
      settings: layouts.forceAtlas2.inferSettings?.(graph) || {},
    });
  }
}

function openPrimaryProvenance(entry, execution) {
  const provenance = entry?.provenance?.find((candidate) => candidate?.sourcePath);
  if (!provenance?.sourcePath) {
    return false;
  }

  return execution.openSourceRange?.(provenance.sourcePath, provenance.sourceRange, { placement: 'main' }) ?? false;
}

function buildSearchState(visualDocument, query) {
  const matches = findSigmaMatches(visualDocument, query);
  const matchedNodes = new Set();
  const matchedEdges = new Set();
  const visibleNodes = new Set();

  for (const match of matches) {
    if (match.kind === 'node') {
      matchedNodes.add(match.id);
      visibleNodes.add(match.id);
    } else {
      matchedEdges.add(match.id);
      const edge = visualDocument.edges.find((entry) => entry.id === match.id);
      if (edge) {
        visibleNodes.add(edge.sourceId);
        visibleNodes.add(edge.targetId);
      }
    }
  }

  return {
    matches,
    matchedNodes,
    matchedEdges,
    visibleNodes,
  };
}

function mountSigmaRuntime(container, model, execution) {
  container.innerHTML = createBaseRuntimeMarkup(model.title, model.diagnostics.length);
  const stage = container.querySelector('[data-runtime-stage]');
  const summary = container.querySelector('[data-runtime-summary]');
  const selectionHost = container.querySelector('[data-runtime-selection]');
  const searchStatus = container.querySelector('[data-runtime-search-status]');
  const diagnosticsLabel = container.querySelector('[data-runtime-diagnostics]');
  const layoutField = container.querySelector('[data-runtime-layout]');
  const sizeMetricField = container.querySelector('[data-runtime-size-metric]');
  const labelModeField = container.querySelector('[data-runtime-label-mode]');
  const searchField = container.querySelector('[data-runtime-search]');
  const focusNeighborsField = container.querySelector('[data-runtime-focus-neighbors]');
  const filterMatchesField = container.querySelector('[data-runtime-filter-matches]');
  const fitButton = container.querySelector('[data-runtime-fit]');
  const zoomInButton = container.querySelector('[data-runtime-zoom-in]');
  const zoomOutButton = container.querySelector('[data-runtime-zoom-out]');
  const rerunLayoutButton = container.querySelector('[data-runtime-rerun-layout]');

  if (!stage || !summary || !selectionHost || !searchStatus || !diagnosticsLabel || !layoutField || !sizeMetricField || !labelModeField || !searchField || !focusNeighborsField || !filterMatchesField || !fitButton || !zoomInButton || !zoomOutButton || !rerunLayoutButton) {
    container.innerHTML = createRuntimeMessageHtml(model.title, 'Sigma runtime UI failed to initialize.', 'error');
    return () => {
      container.innerHTML = '';
    };
  }

  summary.textContent = `${model.visualDocument.nodes.length} nodes / ${model.visualDocument.edges.length} edges`;
  diagnosticsLabel.textContent = `${model.diagnostics.length} diagnostics`;
  selectionHost.innerHTML = createEmptySelectionMarkup();
  searchStatus.innerHTML = createEmptySelectionMarkup('No active search.');

  let disposed = false;
  let renderer;
  let graph;
  let searchState = buildSearchState(model.visualDocument, '');
  let selectedEntry;
  let detachSourceButton = () => {};
  const nodeById = new Map(model.visualDocument.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(model.visualDocument.edges.map((edge) => [edge.id, edge]));
  const selectedNodes = new Set();
  const selectedEdges = new Set();
  let degrees = new Map();
  let pageranks = new Map();
  let sizeDomain = [0, 1];

  const settings = {
    layout: 'forceatlas2',
    sizeMetric: 'degree',
    labelMode: 'matched',
    focusNeighbors: false,
    filterMatches: false,
    layoutIterations: 120,
    nodeSize: 8,
  };

  const attachDomEvent = (node, eventName, handler) => {
    node.addEventListener(eventName, handler);
    return () => node.removeEventListener(eventName, handler);
  };

  const updateSelection = (entry) => {
    selectedEntry = entry;
    detachSourceButton();
    selectionHost.innerHTML = entry ? createSelectionMarkup(entry) : createEmptySelectionMarkup();
    const button = selectionHost.querySelector('[data-runtime-open-source]');
    if (button) {
      const handleClick = () => {
        openPrimaryProvenance(entry, execution);
      };
      button.addEventListener('click', handleClick);
      detachSourceButton = () => {
        button.removeEventListener('click', handleClick);
      };
    }
  };

  const selectedNeighborhood = () => {
    const nodes = new Set();
    if (!graph) {
      return nodes;
    }
    for (const selectedNode of selectedNodes) {
      if (!graph.hasNode(selectedNode)) {
        continue;
      }
      nodes.add(selectedNode);
      for (const node of graph.neighbors(selectedNode)) {
        nodes.add(node);
      }
    }
    return nodes;
  };

  const refreshRuntime = () => {
    if (!renderer || !graph) {
      return;
    }

    searchState = buildSearchState(model.visualDocument, searchField.value);
    searchStatus.innerHTML = searchState.matches.length === 0
      ? (searchField.value.trim()
        ? createEmptySelectionMarkup('No nodes or edges matched the current search.')
        : createEmptySelectionMarkup('No active search.'))
      : `<p class="tf-visual-runtime__caption">${searchState.matches.length} match${searchState.matches.length === 1 ? '' : 'es'} highlighted.</p>`;
    renderer.setSetting?.('renderEdgeLabels', settings.labelMode === 'all');
    renderer.setSetting?.('labelDensity', settings.labelMode === 'all' ? 1 : 0.55);
    renderer.refresh();
  };

  const removeListeners = [
    attachDomEvent(layoutField, 'change', () => {
      settings.layout = layoutField.value;
    }),
    attachDomEvent(sizeMetricField, 'change', () => {
      settings.sizeMetric = sizeMetricField.value;
      if (!graph) {
        return;
      }
      graph.forEachNode((node, attrs) => {
        graph.mergeNodeAttributes(node, {
          size: sigmaNodeSize(node, Number(attrs.baseSize) || settings.nodeSize, settings.sizeMetric, degrees, pageranks, sizeDomain),
        });
      });
      refreshRuntime();
    }),
    attachDomEvent(labelModeField, 'change', () => {
      settings.labelMode = labelModeField.value;
      refreshRuntime();
    }),
    attachDomEvent(searchField, 'input', refreshRuntime),
    attachDomEvent(focusNeighborsField, 'change', () => {
      settings.focusNeighbors = focusNeighborsField.checked;
      refreshRuntime();
    }),
    attachDomEvent(filterMatchesField, 'change', () => {
      settings.filterMatches = filterMatchesField.checked;
      refreshRuntime();
    }),
    attachDomEvent(fitButton, 'click', () => {
      const camera = renderer?.getCamera?.();
      camera?.animatedReset?.();
      camera?.setState?.({ x: 0.5, y: 0.5, ratio: 1 });
    }),
    attachDomEvent(zoomInButton, 'click', () => {
      const camera = renderer?.getCamera?.();
      if (!camera) {
        return;
      }
      const ratio = typeof camera.getState === 'function' ? camera.getState().ratio : camera.ratio;
      camera.animate?.({ ratio: Math.max(0.08, ratio / 1.25) }, { duration: 180 });
    }),
    attachDomEvent(zoomOutButton, 'click', () => {
      const camera = renderer?.getCamera?.();
      if (!camera) {
        return;
      }
      const ratio = typeof camera.getState === 'function' ? camera.getState().ratio : camera.ratio;
      camera.animate?.({ ratio: Math.min(10, ratio * 1.25) }, { duration: 180 });
    }),
  ];

  void (async () => {
    try {
      const [
        GraphologyModule,
        SigmaModule,
        circularModule,
        randomModule,
        forceAtlasModule,
        noverlapModule,
        pagerankModule,
      ] = await Promise.all([
        import('graphology'),
        import('sigma'),
        import('graphology-layout/circular.js'),
        import('graphology-layout/random.js'),
        import('graphology-layout-forceatlas2'),
        import('graphology-layout-noverlap'),
        import('graphology-metrics/centrality/pagerank.js'),
      ]);
      if (disposed) {
        return;
      }

      const Graphology = GraphologyModule.default;
      const Sigma = SigmaModule.default;
      const circularLayout = circularModule.default;
      const randomLayout = randomModule.default;
      const forceAtlas2 = forceAtlasModule.default;
      const noverlap = noverlapModule.default;
      const pagerank = pagerankModule.default;
      graph = new Graphology({ type: 'mixed', multi: true, allowSelfLoops: true });

      for (const node of model.visualDocument.nodes) {
        graph.addNode(node.id, {
          x: 0,
          y: 0,
          baseSize: chooseNodeSize(node),
          size: chooseNodeSize(node),
          label: node.label ?? node.id,
          color: chooseNodeColor(node),
          kind: node.kind ?? 'node',
          provenance: node.provenance,
          classes: node.classes ?? [],
          tags: node.tags ?? [],
        });
      }

      for (const edge of model.visualDocument.edges) {
        if (!graph.hasNode(edge.sourceId) || !graph.hasNode(edge.targetId)) {
          continue;
        }
        graph.addDirectedEdgeWithKey(
          uniqueGraphologyEdgeKey(graph, edge.id),
          edge.sourceId,
          edge.targetId,
          {
            label: edge.label ?? edge.id,
            size: chooseEdgeWidth(edge),
            color: chooseEdgeColor(edge),
            kind: edge.kind ?? 'edge',
            provenance: edge.provenance,
            classes: edge.classes ?? [],
            tags: edge.tags ?? [],
          },
        );
      }

      degrees = graphologyDegreeMap(graph);
      pageranks = safePagerankValues(graph, pagerank);
      sizeDomain = metricDomain(graph.nodes().map((node) =>
        settings.sizeMetric === 'pagerank' ? pageranks.get(node) || 0 : degrees.get(node) || 0));
      graph.forEachNode((node, attrs) => {
        graph.mergeNodeAttributes(node, {
          size: sigmaNodeSize(node, Number(attrs.baseSize) || settings.nodeSize, settings.sizeMetric, degrees, pageranks, sizeDomain),
        });
      });
      runSigmaGraphologyLayout(graph, { circularLayout, randomLayout, forceAtlas2, noverlap }, settings.layout, settings.layoutIterations);

      renderer = new Sigma(graph, stage, {
        defaultNodeColor: '#2563eb',
        defaultEdgeColor: '#64748b',
        enableEdgeEvents: true,
        renderEdgeLabels: false,
        labelDensity: 0.55,
        zIndex: true,
        nodeReducer(node, data) {
          const neighborhood = settings.focusNeighbors ? selectedNeighborhood() : null;
          const selected = selectedNodes.has(node);
          const matched = searchState.matchedNodes.has(node);
          const visibleBySearch = searchState.visibleNodes.has(node);
          const mutedByFocus = Boolean(neighborhood && neighborhood.size && !neighborhood.has(node));
          const hiddenBySearch = Boolean(settings.filterMatches && searchState.matches.length && !visibleBySearch);
          return {
            ...data,
            label: settings.labelMode === 'none'
              ? ''
              : settings.labelMode === 'all' || selected || matched
                ? String(data.label || '')
                : '',
            color: selected
              ? '#111827'
              : mutedByFocus || hiddenBySearch
                ? '#cbd5e1'
                : String(data.color || '#2563eb'),
            size: selected
              ? Math.max(5, Number(data.size) * 1.18)
              : mutedByFocus || hiddenBySearch
                ? Math.max(2, Number(data.size) * 0.45)
                : Number(data.size),
            hidden: hiddenBySearch,
            highlighted: selected || matched,
            forceLabel: settings.labelMode === 'all' || selected || matched,
            zIndex: selected ? 10 : 0,
          };
        },
        edgeReducer(edge, data) {
          const source = graph.source(edge);
          const target = graph.target(edge);
          const neighborhood = settings.focusNeighbors ? selectedNeighborhood() : null;
          const selected = selectedEdges.has(edge);
          const matched = searchState.matchedEdges.has(edge);
          const hiddenBySearch = Boolean(settings.filterMatches && searchState.matches.length && !matched && (!searchState.visibleNodes.has(source) || !searchState.visibleNodes.has(target)));
          const outsideFocus = Boolean(neighborhood && neighborhood.size && (!neighborhood.has(source) || !neighborhood.has(target)));
          return {
            ...data,
            label: settings.labelMode === 'all' ? String(data.label || '') : '',
            color: selected
              ? '#111827'
              : outsideFocus || hiddenBySearch
                ? '#d1d5db'
                : String(data.color || '#64748b'),
            size: selected
              ? Math.max(2.6, Number(data.size) * 1.55)
              : outsideFocus || hiddenBySearch
                ? 0.55
                : Number(data.size),
            hidden: outsideFocus || hiddenBySearch,
            forceLabel: settings.labelMode === 'all' || selected,
            zIndex: selected ? 9 : 0,
          };
        },
      });

      const publishSelection = () => {
        const nodeId = [...selectedNodes][0];
        const edgeId = [...selectedEdges][0];
        if (nodeId && nodeById.has(nodeId)) {
          updateSelection(nodeById.get(nodeId));
        } else if (edgeId && edgeById.has(edgeId)) {
          updateSelection(edgeById.get(edgeId));
        } else {
          updateSelection(undefined);
        }
        renderer.refresh();
      };

      renderer.on('clickNode', ({ node, event }) => {
        const original = event.original instanceof MouseEvent ? event.original : null;
        if (original?.ctrlKey || original?.metaKey) {
          original.preventDefault();
          openPrimaryProvenance(nodeById.get(node), execution);
        }
        selectedNodes.clear();
        selectedEdges.clear();
        selectedNodes.add(node);
        publishSelection();
        event.preventSigmaDefault?.();
      });
      renderer.on('clickEdge', ({ edge, event }) => {
        const original = event.original instanceof MouseEvent ? event.original : null;
        if (original?.ctrlKey || original?.metaKey) {
          original.preventDefault();
          openPrimaryProvenance(edgeById.get(edge), execution);
        }
        selectedNodes.clear();
        selectedEdges.clear();
        selectedEdges.add(edge);
        publishSelection();
        event.preventSigmaDefault?.();
      });
      renderer.on('clickStage', () => {
        selectedNodes.clear();
        selectedEdges.clear();
        publishSelection();
      });

      removeListeners.push(attachDomEvent(rerunLayoutButton, 'click', () => {
        runSigmaGraphologyLayout(graph, { circularLayout, randomLayout, forceAtlas2, noverlap }, settings.layout, settings.layoutIterations);
        renderer.refresh();
      }));

      refreshRuntime();
    } catch (error) {
      if (!disposed) {
        container.innerHTML = createRuntimeMessageHtml(model.title, error?.message ?? 'Sigma failed to load.', 'error');
      }
    }
  })();

  return () => {
    disposed = true;
    detachSourceButton();
    removeListeners.forEach((dispose) => dispose());
    renderer?.kill?.();
    container.innerHTML = '';
  };
}

export const sigmaSurfaceContribution = {
  id: sigmaSurfaceId,
  label: 'Sigma dense graph',
  description: 'Open ITM visual targets through the Sigma/Graphology runtime graph surface.',
  kind: 'visual-runtime',
  localName: 'sigma',
  capabilities: [itmVisualCapabilityId],
  readOnly: true,
  defaultActive: true,
  documentPredicate: sigmaItmDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
  placements: ['main', 'popup'],
  openWithPriority: 93,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'Sigma graph';
    const placeholderHtml = createRuntimeMessageHtml(title, 'Resolving Visual ITM target for Sigma...');

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: 'Resolving the Sigma runtime surface.',
      detail: 'Dense graph runtime loading',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'Sigma surface',
          rows: [
            { label: 'Nodes', value: 'resolving' },
            { label: 'Edges', value: 'resolving' },
            { label: 'Renderer', value: 'sigma' },
            { label: 'Diagnostics', value: 'pending' },
          ],
        },
      ],
      surface: {
        model: {
          html: placeholderHtml,
          diagnostics: [],
        },
        mount(container) {
          let disposed = false;
          let disposeRuntime = () => {};
          container.innerHTML = placeholderHtml;

          void (async () => {
            try {
              const resolved = await resolveSurfaceModelFromExecution(execution, title);
              if (disposed) {
                return;
              }

              this.model.diagnostics = resolved.model.diagnostics;
              this.model.html = resolved.surfaceHtml ?? createBaseRuntimeMarkup(resolved.model.title, resolved.model.diagnostics.length);
              disposeRuntime = resolved.surfaceHtml
                ? (() => {
                  container.innerHTML = resolved.surfaceHtml;
                  return () => {
                    container.innerHTML = '';
                  };
                })()
                : mountSigmaRuntime(container, resolved.model, execution);
            } catch (error) {
              if (!disposed) {
                this.model.diagnostics = createUnavailableDiagnostics(
                  execution.resource,
                  error?.message ?? 'Sigma surface resolution failed.',
                  'renderer-sigma.resolve-failed',
                );
                this.model.html = createRuntimeMessageHtml(title, error?.message ?? 'Sigma surface resolution failed.', 'error');
                container.innerHTML = this.model.html;
              }
            }
          })();

          return () => {
            disposed = true;
            disposeRuntime();
            container.innerHTML = '';
          };
        },
      },
    };
  },
};

export function createRendererSigmaContributionManifest() {
  return createContributionManifest('@textforge/renderer-sigma', {
    surfaces: [sigmaSurfaceContribution],
  });
}

export const contributions = createRendererSigmaContributionManifest();
