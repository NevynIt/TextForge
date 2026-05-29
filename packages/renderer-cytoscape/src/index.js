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

const cytoscapeSurfaceId = '@textforge/renderer-cytoscape/runtime';
const itmVisualCapabilityId = '@textforge/itm/capability/view';

export const cytoscapeItmDocumentPredicate = createResourcePredicate({
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

function chooseNodeTextColor(node) {
  return readStyleValue(node.style, 'text-color')
    ?? readStyleValue(node.style, 'label-color')
    ?? '#e2e8f0';
}

function chooseEdgeColor(edge) {
  return readStyleValue(edge.style, 'line-color')
    ?? readStyleValue(edge.style, 'stroke')
    ?? readStyleValue(edge.style, 'color')
    ?? '#64748b';
}

function chooseEdgeLineStyle(edge) {
  const lineStyle = readStyleValue(edge.style, 'line-style')
    ?? readStyleValue(edge.style, 'stroke-dasharray');
  if (!lineStyle) {
    return 'solid';
  }

  if (lineStyle.includes('dash') || lineStyle.includes(',')) {
    return 'dashed';
  }

  if (lineStyle.includes('dot')) {
    return 'dotted';
  }

  return 'solid';
}

function chooseEdgeWidth(edge) {
  const width = Number.parseFloat(readStyleValue(edge.style, 'width') ?? readStyleValue(edge.style, 'stroke-width') ?? '');
  return Number.isFinite(width) && width > 0 ? width : 2;
}

function chooseNodeShape(node) {
  const shape = readStyleValue(node.style, 'shape');
  if (shape && ['diamond', 'ellipse', 'hexagon', 'rectangle', 'round-rectangle', 'triangle'].includes(shape)) {
    return shape;
  }

  return node.parentId ? 'round-rectangle' : 'ellipse';
}

function chooseNodeSize(node) {
  const height = Number.parseFloat(readStyleValue(node.style, 'height') ?? '');
  const width = Number.parseFloat(readStyleValue(node.style, 'width') ?? '');
  const size = Math.max(
    Number.isFinite(height) ? height : 0,
    Number.isFinite(width) ? width : 0,
  );
  return size > 0 ? Math.min(Math.max(size, 34), 88) : 52;
}

function createSearchIndex(visualDocument) {
  return {
    nodes: visualDocument.nodes.map((node) => ({
      id: node.id,
      kind: 'node',
      label: node.label ?? node.id,
      haystack: normalizeSearchText([
        node.id,
        node.label,
        node.kind,
        node.classes,
        node.tags,
        Object.keys(node.style ?? {}),
      ]),
    })),
    edges: visualDocument.edges.map((edge) => ({
      id: edge.id,
      kind: 'edge',
      label: edge.label ?? edge.id,
      haystack: normalizeSearchText([
        edge.id,
        edge.label,
        edge.kind,
        edge.sourceId,
        edge.targetId,
        edge.classes,
        edge.tags,
      ]),
    })),
  };
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
          <span class="tf-visual-runtime__eyebrow">Cytoscape runtime</span>
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
    <section class="tf-visual-runtime tf-visual-runtime--cytoscape">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">Cytoscape runtime</span>
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
            <option value="breadthfirst">Breadth-first</option>
            <option value="cose">COSE</option>
            <option value="circle">Circle</option>
            <option value="concentric">Concentric</option>
            <option value="grid">Grid</option>
            <option value="random">Random</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field tf-visual-runtime__field--search">
          <span>Search</span>
          <input type="search" data-runtime-search placeholder="Label, type, tag, relation" />
        </label>
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
  const tags = [...(entry.classes ?? []), ...(entry.tags ?? [])];

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
    ${tags.length > 0 ? `<p class="tf-visual-runtime__caption">${escapeHtml(tags.join(' · '))}</p>` : ''}
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
        packageId: '@textforge/renderer-cytoscape',
        subsystem: 'cytoscape-runtime',
        contributionId: cytoscapeSurfaceId,
      },
    }),
  ];
}

function coerceVisualGraphDocument(visualDocument) {
  if (!isVisualItmDocument(visualDocument)) {
    return undefined;
  }

  return visualDocument;
}

export function createCytoscapeElements(visualDocument) {
  return {
    nodes: visualDocument.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label ?? node.id,
        kind: node.kind,
        classes: [...(node.classes ?? [])],
        tags: [...(node.tags ?? [])],
        parent: node.parentId,
        style: node.style,
        layout: node.layout,
        provenance: node.provenance,
      },
    })),
    edges: visualDocument.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label ?? edge.id,
        kind: edge.kind,
        classes: [...(edge.classes ?? [])],
        tags: [...(edge.tags ?? [])],
        style: edge.style,
        layout: edge.layout,
        provenance: edge.provenance,
      },
    })),
  };
}

export function findCytoscapeMatches(visualDocument, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const index = createSearchIndex(visualDocument);
  return [...index.nodes, ...index.edges]
    .filter((entry) => entry.haystack.some((value) => value.includes(normalizedQuery)))
    .map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
    }));
}

export function createCytoscapeSurfaceModel(visualDocument, options = {}) {
  const validated = coerceVisualGraphDocument(visualDocument);
  const diagnostics = [
    ...(options.diagnostics ?? []),
    ...validateVisualItmDocument(validated ?? visualDocument),
  ];
  const graphDocument = validated ?? {
    format: 'textforge.visual-itm/v1',
    origin: { mode: 'translated' },
    nodes: [],
    edges: [],
  };
  const elements = createCytoscapeElements(graphDocument);

  return {
    id: `cytoscape:${options.title ?? 'visual-itm'}`,
    title: options.title ?? 'Cytoscape graph',
    summary: `Interactive Cytoscape graph for ${graphDocument.nodes.length} nodes and ${graphDocument.edges.length} edges.`,
    detail: `${graphDocument.nodes.length} nodes / ${graphDocument.edges.length} edges`,
    diagnostics,
    visualDocument: graphDocument,
    elements,
  };
}

async function resolveSurfaceModelFromExecution(execution, title) {
  const sourceText = execution.sourceText ?? '';
  if (!sourceText.trim()) {
    return {
      model: createCytoscapeSurfaceModel({ format: 'textforge.visual-itm/v1', origin: { mode: 'translated' }, nodes: [], edges: [] }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'No ITM source is available for the Cytoscape surface.', 'renderer-cytoscape.source-missing'),
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
  const diagnostics = [...resolved.diagnostics, ...resolved.visualDiagnostics];

  return {
    model: createCytoscapeSurfaceModel(resolved.visualDocument, {
      title,
      diagnostics,
    }),
  };
}

function buildCytoscapeStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        color: 'data(textColor)',
        'background-color': 'data(color)',
        shape: 'data(shape)',
        width: 'data(size)',
        height: 'data(size)',
        'font-size': 11,
        'font-weight': 600,
        'text-wrap': 'wrap',
        'text-max-width': 120,
        'text-valign': 'center',
        'text-halign': 'center',
        'overlay-opacity': 0,
        'border-color': '#0f172a',
        'border-width': 1.5,
      },
    },
    {
      selector: '$node > node',
      style: {
        'background-opacity': 0.14,
        'text-valign': 'top',
        'text-halign': 'center',
        'padding-top': 18,
        'padding-bottom': 18,
        'padding-left': 18,
        'padding-right': 18,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(width)',
        label: 'data(label)',
        color: '#94a3b8',
        'font-size': 10,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'line-style': 'data(lineStyle)',
        'text-background-opacity': 1,
        'text-background-color': '#0f172a',
        'text-background-padding': 2,
        'overlay-opacity': 0,
      },
    },
    {
      selector: '.tf-match',
      style: {
        'border-color': '#f59e0b',
        'border-width': 3,
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
      },
    },
    {
      selector: '.tf-dim',
      style: {
        opacity: 0.18,
      },
    },
    {
      selector: '.tf-selected',
      style: {
        'border-color': '#34d399',
        'border-width': 3,
        'line-color': '#34d399',
        'target-arrow-color': '#34d399',
      },
    },
  ];
}

function createCytoscapeLayoutOptions(name) {
  switch (name) {
    case 'circle':
      return { name: 'circle', spacingFactor: 1.2 };
    case 'concentric':
      return { name: 'concentric', minNodeSpacing: 28, levelWidth: () => 2 };
    case 'grid':
      return { name: 'grid', avoidOverlap: true, spacingFactor: 1.15 };
    case 'random':
      return { name: 'random' };
    case 'cose':
      return { name: 'cose', animate: false, padding: 32, idealEdgeLength: 120, nodeOverlap: 12 };
    case 'breadthfirst':
    default:
      return { name: 'breadthfirst', directed: true, padding: 30, spacingFactor: 1.15 };
  }
}

function mapElementsForRuntime(elements) {
  return [
    ...elements.nodes.map((entry) => ({
      data: {
        ...entry.data,
        color: chooseNodeColor(entry.data),
        textColor: chooseNodeTextColor(entry.data),
        shape: chooseNodeShape(entry.data),
        size: chooseNodeSize(entry.data),
      },
    })),
    ...elements.edges.map((entry) => ({
      data: {
        ...entry.data,
        color: chooseEdgeColor(entry.data),
        width: chooseEdgeWidth(entry.data),
        lineStyle: chooseEdgeLineStyle(entry.data),
      },
    })),
  ];
}

function createSelectionEntry(target) {
  if (!target || typeof target.id !== 'function') {
    return undefined;
  }

  const data = target.data();
  return {
    id: data.id,
    label: data.label,
    kind: data.kind,
    classes: data.classes,
    tags: data.tags,
    provenance: data.provenance,
  };
}

function applySearchClasses(cy, matches) {
  const matchIds = new Set(matches.map((entry) => entry.id));
  cy.elements().removeClass('tf-match').removeClass('tf-dim');
  if (matchIds.size === 0) {
    return;
  }

  cy.elements().forEach((element) => {
    if (matchIds.has(element.id())) {
      element.addClass('tf-match');
    } else {
      element.addClass('tf-dim');
    }
  });
}

function openPrimaryProvenance(entry, execution) {
  const provenance = entry?.provenance?.find((candidate) => candidate?.sourcePath);
  if (!provenance?.sourcePath) {
    return false;
  }

  return execution.openSourceRange?.(provenance.sourcePath, provenance.sourceRange, { placement: 'main' }) ?? false;
}

function mountCytoscapeRuntime(container, model, execution) {
  container.innerHTML = createBaseRuntimeMarkup(model.title, model.diagnostics.length);
  const stage = container.querySelector('[data-runtime-stage]');
  const summary = container.querySelector('[data-runtime-summary]');
  const selectionHost = container.querySelector('[data-runtime-selection]');
  const searchStatus = container.querySelector('[data-runtime-search-status]');
  const diagnosticsLabel = container.querySelector('[data-runtime-diagnostics]');
  const layoutField = container.querySelector('[data-runtime-layout]');
  const searchField = container.querySelector('[data-runtime-search]');
  const fitButton = container.querySelector('[data-runtime-fit]');
  const zoomInButton = container.querySelector('[data-runtime-zoom-in]');
  const zoomOutButton = container.querySelector('[data-runtime-zoom-out]');
  const rerunLayoutButton = container.querySelector('[data-runtime-rerun-layout]');

  if (!stage || !summary || !selectionHost || !searchStatus || !diagnosticsLabel || !layoutField || !searchField || !fitButton || !zoomInButton || !zoomOutButton || !rerunLayoutButton) {
    container.innerHTML = createRuntimeMessageHtml(model.title, 'Cytoscape runtime UI failed to initialize.', 'error');
    return () => {
      container.innerHTML = '';
    };
  }

  summary.textContent = `${model.visualDocument.nodes.length} nodes / ${model.visualDocument.edges.length} edges`;
  diagnosticsLabel.textContent = `${model.diagnostics.length} diagnostics`;
  selectionHost.innerHTML = createEmptySelectionMarkup();
  searchStatus.innerHTML = createEmptySelectionMarkup('No active search.');

  let disposed = false;
  let cy;
  let currentSelection;
  let detachSourceButton = () => {};

  const updateSelection = (entry) => {
    currentSelection = entry;
    detachSourceButton();
    selectionHost.innerHTML = entry ? createSelectionMarkup(entry) : createEmptySelectionMarkup();
    const openSourceButton = selectionHost.querySelector('[data-runtime-open-source]');
    if (openSourceButton) {
      const handleClick = () => {
        openPrimaryProvenance(entry, execution);
      };
      openSourceButton.addEventListener('click', handleClick);
      detachSourceButton = () => {
        openSourceButton.removeEventListener('click', handleClick);
      };
    }
  };

  const updateSearch = () => {
    if (!cy) {
      return;
    }

    const matches = findCytoscapeMatches(model.visualDocument, searchField.value);
    applySearchClasses(cy, matches);
    if (matches.length === 0) {
      searchStatus.innerHTML = searchField.value.trim()
        ? createEmptySelectionMarkup('No nodes or edges matched the current search.')
        : createEmptySelectionMarkup('No active search.');
      return;
    }

    searchStatus.innerHTML = `<p class="tf-visual-runtime__caption">${matches.length} match${matches.length === 1 ? '' : 'es'} highlighted.</p>`;
    const matchCollection = cy.collection(matches.map((entry) => cy.getElementById(entry.id)).filter((entry) => entry?.length > 0));
    if (matchCollection.length > 0) {
      cy.fit(matchCollection, 40);
    }
  };

  const runLayout = () => {
    if (!cy) {
      return;
    }

    const nextLayout = createCytoscapeLayoutOptions(layoutField.value);
    cy.layout(nextLayout).run();
  };

  const bindCytoscapeEvents = () => {
    cy.on('tap', 'node, edge', (event) => {
      const target = event.target;
      cy.elements('.tf-selected').removeClass('tf-selected');
      target.addClass('tf-selected');
      updateSelection(createSelectionEntry(target));
      if (event.originalEvent?.ctrlKey || event.originalEvent?.metaKey) {
        openPrimaryProvenance(createSelectionEntry(target), execution);
      }
    });

    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.elements('.tf-selected').removeClass('tf-selected');
        updateSelection(undefined);
      }
    });
  };

  const attachDomEvent = (node, eventName, handler) => {
    node.addEventListener(eventName, handler);
    return () => node.removeEventListener(eventName, handler);
  };

  const removeListeners = [
    attachDomEvent(searchField, 'input', updateSearch),
    attachDomEvent(layoutField, 'change', runLayout),
    attachDomEvent(fitButton, 'click', () => cy?.fit(undefined, 40)),
    attachDomEvent(zoomInButton, 'click', () => cy?.zoom(Math.min((cy?.zoom() ?? 1) * 1.12, 3.5))),
    attachDomEvent(zoomOutButton, 'click', () => cy?.zoom(Math.max((cy?.zoom() ?? 1) / 1.12, 0.2))),
    attachDomEvent(rerunLayoutButton, 'click', runLayout),
  ];

  void (async () => {
    try {
      const module = await import('cytoscape');
      if (disposed) {
        return;
      }

      const cytoscape = module.default;
      cy = cytoscape({
        container: stage,
        elements: mapElementsForRuntime(model.elements),
        layout: createCytoscapeLayoutOptions(layoutField.value),
        style: buildCytoscapeStylesheet(),
        wheelSensitivity: 0.18,
        minZoom: 0.16,
        maxZoom: 4,
      });
      bindCytoscapeEvents();
      cy.fit(undefined, 40);
      updateSearch();
    } catch (error) {
      if (!disposed) {
        container.innerHTML = createRuntimeMessageHtml(
          model.title,
          error?.message ?? 'Cytoscape failed to load.',
          'error',
        );
      }
    }
  })();

  return () => {
    disposed = true;
    detachSourceButton();
    removeListeners.forEach((dispose) => dispose());
    if (cy) {
      cy.destroy();
    }
    container.innerHTML = '';
  };
}

export const cytoscapeSurfaceContribution = {
  id: cytoscapeSurfaceId,
  label: 'Cytoscape graph',
  description: 'Open ITM visual targets through the Cytoscape runtime graph surface.',
  kind: 'visual-runtime',
  localName: 'cytoscape',
  capabilities: [itmVisualCapabilityId],
  readOnly: true,
  defaultActive: true,
  documentPredicate: cytoscapeItmDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
  placements: ['main', 'popup'],
  openWithPriority: 95,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'Cytoscape graph';
    const placeholderHtml = createRuntimeMessageHtml(title, 'Resolving Visual ITM target for Cytoscape...');
    const model = createCytoscapeSurfaceModel({
      format: 'textforge.visual-itm/v1',
      origin: { mode: 'translated' },
      nodes: [],
      edges: [],
    }, {
      title,
    });

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: 'Resolving the Cytoscape runtime surface.',
      detail: 'Graph runtime loading',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'Cytoscape surface',
          rows: [
            { label: 'Nodes', value: 'resolving' },
            { label: 'Edges', value: 'resolving' },
            { label: 'Renderer', value: 'cytoscape' },
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
                : mountCytoscapeRuntime(container, resolved.model, execution);
            } catch (error) {
              if (!disposed) {
                this.model.diagnostics = createUnavailableDiagnostics(
                  execution.resource,
                  error?.message ?? 'Cytoscape surface resolution failed.',
                  'renderer-cytoscape.resolve-failed',
                );
                this.model.html = createRuntimeMessageHtml(title, error?.message ?? 'Cytoscape surface resolution failed.', 'error');
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

export function createRendererCytoscapeContributionManifest() {
  return createContributionManifest('@textforge/renderer-cytoscape', {
    surfaces: [cytoscapeSurfaceContribution],
  });
}

export const contributions = createRendererCytoscapeContributionManifest();
