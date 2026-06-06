import {
  createBaseRuntimeMarkup,
  createEmptySelectionMarkup,
  createRuntimeMessageHtml,
  createSelectionMarkup,
} from './html.js';
import { findSigmaMatches } from './graph-descriptor.js';
import { chooseEdgeColor, chooseEdgeWidth, chooseNodeColor, chooseNodeSize } from './style.js';
import {
  graphologyDegreeMap,
  metricDomain,
  runSigmaGraphologyLayout,
  safePagerankValues,
  sigmaNodeSize,
  uniqueGraphologyEdgeKey,
} from './runtime-graphology.js';

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

export function mountSigmaRuntime(container, model, execution) {
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
