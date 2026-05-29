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

const jsmindSurfaceId = '@textforge/renderer-jsmind/runtime';
const itmVisualCapabilityId = '@textforge/itm/capability/view';
const syntheticRootId = '__textforge_jsmind_root__';

export const jsmindItmDocumentPredicate = createResourcePredicate({
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
          <span class="tf-visual-runtime__eyebrow">jsMind runtime</span>
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
    <section class="tf-visual-runtime tf-visual-runtime--jsmind">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">jsMind runtime</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
        <div class="tf-visual-runtime__meta">
          <span data-runtime-summary>0 topics</span>
          <span data-runtime-diagnostics>${diagnosticsCount} diagnostics</span>
        </div>
      </header>
      <div class="tf-visual-runtime__toolbar">
        <label class="tf-visual-runtime__field">
          <span>Expansion</span>
          <select data-runtime-expansion>
            <option value="depth2">Depth 2</option>
            <option value="full">Full</option>
            <option value="collapsed">Collapsed</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field tf-visual-runtime__field--search">
          <span>Search</span>
          <input type="search" data-runtime-search placeholder="Topic, type, tag" />
        </label>
        <div class="tf-visual-runtime__actions">
          <button type="button" data-runtime-fit>Fit</button>
          <button type="button" data-runtime-center>Center</button>
          <button type="button" data-runtime-fold-all>Fold all</button>
          <button type="button" data-runtime-unfold-all>Unfold all</button>
          <button type="button" data-runtime-zoom-in>Zoom in</button>
          <button type="button" data-runtime-zoom-out>Zoom out</button>
        </div>
      </div>
      <div class="tf-visual-runtime__body">
        <div class="tf-visual-runtime__stage tf-visual-runtime__stage--mindmap">
          <div class="tf-visual-runtime__mindmap-viewport" data-runtime-viewport>
            <div class="tf-visual-runtime__mindmap-host" data-runtime-stage></div>
          </div>
        </div>
        <aside class="tf-visual-runtime__sidebar">
          <section class="tf-visual-runtime__panel">
            <h5>Selection</h5>
            <div data-runtime-selection class="tf-visual-runtime__empty">Select a topic.</div>
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

function createEmptySelectionMarkup(message = 'Select a topic.') {
  return `<p class="tf-visual-runtime__empty">${escapeHtml(message)}</p>`;
}

function createSelectionMarkup(node) {
  const primaryProvenance = node.provenance?.[0];
  const secondaryProvenance = node.provenance?.slice(1) ?? [];
  return `
    <dl class="tf-visual-runtime__detail-list">
      <div><dt>Label</dt><dd>${escapeHtml(node.label ?? node.id)}</dd></div>
      <div><dt>ID</dt><dd>${escapeHtml(node.id)}</dd></div>
      <div><dt>Kind</dt><dd>${escapeHtml(node.kind ?? 'n/a')}</dd></div>
      <div><dt>Classes</dt><dd>${escapeHtml((node.classes ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Tags</dt><dd>${escapeHtml((node.tags ?? []).join(', ') || 'none')}</dd></div>
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
        packageId: '@textforge/renderer-jsmind',
        subsystem: 'jsmind-runtime',
        contributionId: jsmindSurfaceId,
      },
    }),
  ];
}

function buildNodeChildrenMap(visualDocument) {
  const nodeMap = new Map();
  const childrenMap = new Map();
  for (const node of visualDocument.nodes) {
    nodeMap.set(node.id, node);
    if (!childrenMap.has(node.id)) {
      childrenMap.set(node.id, []);
    }
  }

  const roots = [];
  for (const node of visualDocument.nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      if (!childrenMap.has(node.parentId)) {
        childrenMap.set(node.parentId, []);
      }
      childrenMap.get(node.parentId).push(node);
    } else {
      roots.push(node);
    }
  }

  return {
    nodeMap,
    childrenMap,
    roots,
  };
}

function buildSyntheticRootLabel(visualDocument) {
  return visualDocument.origin?.derivedTarget?.id
    ?? visualDocument.origin?.sourceResource
    ?? 'Visual ITM mindmap';
}

export function createJsMindNodeArray(visualDocument) {
  const { nodeMap, childrenMap, roots } = buildNodeChildrenMap(visualDocument);
  const output = [];
  const rootId = roots.length === 1 ? roots[0].id : syntheticRootId;

  if (roots.length !== 1) {
    output.push({
      id: syntheticRootId,
      topic: buildSyntheticRootLabel(visualDocument),
      isroot: true,
      expanded: true,
    });
  }

  const visit = (node, parentId, index) => {
    output.push({
      id: node.id,
      topic: node.label ?? node.id,
      isroot: !parentId,
      parentid: parentId,
      expanded: true,
      direction: node.layout?.['jsmind.side'] === 'left'
        ? 'left'
        : node.layout?.['jsmind.side'] === 'right'
          ? 'right'
          : (parentId === rootId && index % 2 === 0 ? 'left' : 'right'),
    });

    const children = childrenMap.get(node.id) ?? [];
    children.forEach((child, childIndex) => visit(child, node.id, childIndex));
  };

  if (roots.length === 1) {
    visit(roots[0], undefined, 0);
  } else {
    roots.forEach((node, index) => visit(node, syntheticRootId, index));
  }

  if (output.length === 0 && visualDocument.nodes[0]) {
    const first = visualDocument.nodes[0];
    output.push({
      id: first.id,
      topic: first.label ?? first.id,
      isroot: true,
      expanded: true,
    });
  }

  return {
    rootId,
    nodes: output,
  };
}

export function findJsMindMatches(visualDocument, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return visualDocument.nodes
    .filter((node) => normalizeSearchText([
      node.id,
      node.label,
      node.kind,
      node.classes,
      node.tags,
    ]).some((value) => value.includes(normalizedQuery)))
    .map((node) => ({
      id: node.id,
      label: node.label ?? node.id,
    }));
}

export function createJsMindSurfaceModel(visualDocument, options = {}) {
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
  const tree = createJsMindNodeArray(valid);

  return {
    id: `jsmind:${options.title ?? 'visual-itm'}`,
    title: options.title ?? 'jsMind mindmap',
    summary: `Interactive jsMind surface for ${valid.nodes.length} topics.`,
    detail: `${valid.nodes.length} topics / ${valid.edges.length} cross-links`,
    diagnostics,
    visualDocument: valid,
    rootId: tree.rootId,
    nodes: tree.nodes,
  };
}

async function resolveSurfaceModelFromExecution(execution, title) {
  const sourceText = execution.sourceText ?? '';
  if (!sourceText.trim()) {
    return {
      model: createJsMindSurfaceModel({
        format: 'textforge.visual-itm/v1',
        origin: { mode: 'translated' },
        nodes: [],
        edges: [],
      }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'No ITM source is available for the jsMind surface.', 'renderer-jsmind.source-missing'),
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
    projection: 'mindmap',
    title,
  });

  return {
    model: createJsMindSurfaceModel(resolved.visualDocument, {
      title,
      diagnostics: [...resolved.diagnostics, ...resolved.visualDiagnostics],
    }),
  };
}

function instanceView(instance) {
  return instance?.view;
}

function mindMapPanel(host) {
  return host?.querySelector('.jsmind-inner') ?? null;
}

function jsMindElementById(host, id) {
  return Array.from(host.querySelectorAll('jmnode')).find((element) => element.getAttribute('nodeid') === id) ?? null;
}

function jsMindNodeId(instance, target) {
  const view = instanceView(instance);
  if (view?.get_binded_nodeid && target instanceof Element) {
    return String(view.get_binded_nodeid(target) || '');
  }
  return target instanceof Element
    ? String(target.closest('jmnode,jmexpander')?.getAttribute('nodeid') || '')
    : '';
}

function visibleJsMindNodes(host) {
  return Array.from(host.querySelectorAll('jmnode')).filter((element) => element.offsetParent !== null);
}

function elementBounds(elements) {
  const rects = elements.map((element) => element.getBoundingClientRect());
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function centerMindMapBounds(host, elements) {
  const panel = mindMapPanel(host);
  if (!panel || !elements.length) {
    return;
  }
  const panelRect = panel.getBoundingClientRect();
  const bounds = elementBounds(elements);
  panel.scrollBy({
    left: bounds.left + bounds.width / 2 - (panelRect.left + panelRect.width / 2),
    top: bounds.top + bounds.height / 2 - (panelRect.top + panelRect.height / 2),
    behavior: 'smooth',
  });
}

function centerMindMapNode(viewport, host, id) {
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
    behavior: 'smooth',
  });
}

function ensureMindMapZoomSpace(view, zoom) {
  const panel = view?.e_panel;
  if (!panel || !view?.size) {
    return;
  }

  const rect = panel.getBoundingClientRect();
  const minWidth = Math.ceil(rect.width / Math.max(0.1, zoom)) + 1600;
  const minHeight = Math.ceil(rect.height / Math.max(0.1, zoom)) + 1200;
  view.size.w = Math.max(view.size.w, minWidth);
  view.size.h = Math.max(view.size.h, minHeight);
}

function setNativeMindMapZoom(instance, zoom, anchor) {
  const view = instanceView(instance);
  const nextZoom = Math.min(Math.max(zoom, 0.1), 5);
  if (!view?.set_zoom) {
    return false;
  }
  if (view.set_zoom(nextZoom, anchor)) {
    return true;
  }
  ensureMindMapZoomSpace(view, nextZoom);
  return view.set_zoom(nextZoom, anchor);
}

function mindMapZoom(instance) {
  const zoom = instanceView(instance)?.zoom_current;
  return typeof zoom === 'number' && Number.isFinite(zoom) ? zoom : 1;
}

function fitMindMap(instance, viewport, host) {
  const visibleNodes = visibleJsMindNodes(host);
  if (!visibleNodes.length) {
    centerMindMapNode(viewport, host, 'root');
    return;
  }

  const bounds = elementBounds(visibleNodes);
  const availableWidth = Math.max(120, viewport.clientWidth - 80);
  const availableHeight = Math.max(120, viewport.clientHeight - 80);
  const currentZoom = mindMapZoom(instance);
  const nextZoom = Math.min(
    Math.max(currentZoom * Math.min(availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height), 1.6), 0.1),
    2.1,
  );
  setNativeMindMapZoom(instance, nextZoom);
  window.requestAnimationFrame(() => centerMindMapBounds(host, visibleJsMindNodes(host)));
}

function buildHierarchy(visualDocument, rootId) {
  const byId = new Map(visualDocument.nodes.map((node) => [node.id, { ...node, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else if (node.id !== syntheticRootId) {
      roots.push(node);
    }
  }

  if (rootId === syntheticRootId) {
    return {
      id: syntheticRootId,
      children: roots,
    };
  }

  return byId.get(rootId) ?? { id: rootId, children: [] };
}

function walkHierarchy(node, visitor, depth = 0) {
  visitor(node, depth);
  for (const child of node.children ?? []) {
    walkHierarchy(child, visitor, depth + 1);
  }
}

function applyExpansionMode(instance, hierarchy, rootId, mode) {
  if (!instance) {
    return;
  }

  if (mode === 'full') {
    instance.expand_all?.();
    return;
  }

  instance.collapse_all?.();
  instance.expand_node?.(rootId);

  if (mode === 'depth2') {
    walkHierarchy(hierarchy, (node, depth) => {
      if (depth < 2 && node.id && node.id !== rootId) {
        instance.expand_node?.(node.id);
      }
    });
  }
}

function attachViewportPanning(viewport, stageHost) {
  let drag = null;
  const start = (event) => {
    if (event.button !== 0 || event.target instanceof Element && event.target.closest('button,a,input,select,textarea,jmnode,jmexpander')) {
      return;
    }

    const panel = mindMapPanel(stageHost);
    if (!panel) {
      return;
    }
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: panel.scrollLeft,
      top: panel.scrollTop,
    };
    viewport.setPointerCapture?.(event.pointerId);
    viewport.classList.add('is-panning');
  };

  const move = (event) => {
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    const panel = mindMapPanel(stageHost);
    if (!panel) {
      return;
    }
    panel.scrollLeft = drag.left - (event.clientX - drag.x);
    panel.scrollTop = drag.top - (event.clientY - drag.y);
  };

  const stop = (event) => {
    if (!drag || drag.id !== event.pointerId) {
      return;
    }
    viewport.releasePointerCapture?.(event.pointerId);
    viewport.classList.remove('is-panning');
    drag = null;
  };

  viewport.addEventListener('pointerdown', start);
  viewport.addEventListener('pointermove', move);
  viewport.addEventListener('pointerup', stop);
  viewport.addEventListener('pointercancel', stop);
  return () => {
    viewport.removeEventListener('pointerdown', start);
    viewport.removeEventListener('pointermove', move);
    viewport.removeEventListener('pointerup', stop);
    viewport.removeEventListener('pointercancel', stop);
  };
}

function openPrimaryProvenance(node, execution) {
  const provenance = node?.provenance?.find((candidate) => candidate?.sourcePath);
  if (!provenance?.sourcePath) {
    return false;
  }

  return execution.openSourceRange?.(provenance.sourcePath, provenance.sourceRange, { placement: 'main' }) ?? false;
}

function mountJsMindRuntime(container, model, execution) {
  container.innerHTML = createBaseRuntimeMarkup(model.title, model.diagnostics.length);
  const viewport = container.querySelector('[data-runtime-viewport]');
  const stage = container.querySelector('[data-runtime-stage]');
  const summary = container.querySelector('[data-runtime-summary]');
  const selectionHost = container.querySelector('[data-runtime-selection]');
  const searchStatus = container.querySelector('[data-runtime-search-status]');
  const diagnosticsLabel = container.querySelector('[data-runtime-diagnostics]');
  const expansionField = container.querySelector('[data-runtime-expansion]');
  const searchField = container.querySelector('[data-runtime-search]');
  const fitButton = container.querySelector('[data-runtime-fit]');
  const centerButton = container.querySelector('[data-runtime-center]');
  const foldAllButton = container.querySelector('[data-runtime-fold-all]');
  const unfoldAllButton = container.querySelector('[data-runtime-unfold-all]');
  const zoomInButton = container.querySelector('[data-runtime-zoom-in]');
  const zoomOutButton = container.querySelector('[data-runtime-zoom-out]');

  if (!viewport || !stage || !summary || !selectionHost || !searchStatus || !diagnosticsLabel || !expansionField || !searchField || !fitButton || !centerButton || !foldAllButton || !unfoldAllButton || !zoomInButton || !zoomOutButton) {
    container.innerHTML = createRuntimeMessageHtml(model.title, 'jsMind runtime UI failed to initialize.', 'error');
    return () => {
      container.innerHTML = '';
    };
  }

  summary.textContent = `${model.visualDocument.nodes.length} topics / ${model.visualDocument.edges.length} cross-links`;
  diagnosticsLabel.textContent = `${model.diagnostics.length} diagnostics`;
  selectionHost.innerHTML = createEmptySelectionMarkup();
  searchStatus.innerHTML = createEmptySelectionMarkup('No active search.');

  const stageId = `jsmind-${Math.random().toString(36).slice(2)}`;
  stage.id = stageId;

  let disposed = false;
  let instance;
  let detachSourceButton = () => {};
  let detachViewportPanning = () => {};
  const nodeById = new Map(model.visualDocument.nodes.map((node) => [node.id, node]));
  const hierarchy = buildHierarchy(model.visualDocument, model.rootId);

  const updateSelection = (node) => {
    detachSourceButton();
    selectionHost.innerHTML = node ? createSelectionMarkup(node) : createEmptySelectionMarkup();
    const button = selectionHost.querySelector('[data-runtime-open-source]');
    if (button) {
      const handleClick = () => {
        openPrimaryProvenance(node, execution);
      };
      button.addEventListener('click', handleClick);
      detachSourceButton = () => {
        button.removeEventListener('click', handleClick);
      };
    }
  };

  const highlightMatches = () => {
    const matches = findJsMindMatches(model.visualDocument, searchField.value);
    const matchedIds = new Set(matches.map((entry) => entry.id));
    for (const element of stage.querySelectorAll('jmnode')) {
      const id = element.getAttribute('nodeid') || '';
      element.classList.toggle('mindmap-search-match', matchedIds.has(id));
      element.classList.toggle('mindmap-search-active', matches[0]?.id === id);
    }

    if (matches.length === 0) {
      searchStatus.innerHTML = searchField.value.trim()
        ? createEmptySelectionMarkup('No topics matched the current search.')
        : createEmptySelectionMarkup('No active search.');
      return;
    }

    searchStatus.innerHTML = `<p class="tf-visual-runtime__caption">${matches.length} match${matches.length === 1 ? '' : 'es'} highlighted.</p>`;
    const active = matches[0];
    if (active) {
      centerMindMapNode(viewport, stage, active.id);
      updateSelection(nodeById.get(active.id));
      applyExpansionMode(instance, hierarchy, model.rootId, expansionField.value);
      instance.select_node?.(active.id);
    }
  };

  const attachDomEvent = (node, eventName, handler) => {
    node.addEventListener(eventName, handler);
    return () => node.removeEventListener(eventName, handler);
  };

  const removeListeners = [
    attachDomEvent(searchField, 'input', highlightMatches),
    attachDomEvent(expansionField, 'change', () => {
      if (!instance) {
        return;
      }
      applyExpansionMode(instance, hierarchy, model.rootId, expansionField.value);
      highlightMatches();
    }),
    attachDomEvent(fitButton, 'click', () => {
      if (instance) {
        fitMindMap(instance, viewport, stage);
      }
    }),
    attachDomEvent(centerButton, 'click', () => centerMindMapNode(viewport, stage, model.rootId)),
    attachDomEvent(foldAllButton, 'click', () => instance?.collapse_all?.()),
    attachDomEvent(unfoldAllButton, 'click', () => instance?.expand_all?.()),
    attachDomEvent(zoomInButton, 'click', () => instance && setNativeMindMapZoom(instance, mindMapZoom(instance) * 1.12)),
    attachDomEvent(zoomOutButton, 'click', () => instance && setNativeMindMapZoom(instance, mindMapZoom(instance) / 1.12)),
  ];

  void (async () => {
    try {
      await import('jsmind/style/jsmind.css');
      const module = await import('jsmind');
      if (disposed) {
        return;
      }

      const jsMind = module.default;
      instance = new jsMind({
        container: stageId,
        editable: false,
        theme: 'primary',
        mode: 'side',
        support_html: false,
        log_level: 'error',
        view: {
          engine: 'svg',
          draggable: false,
          hide_scrollbars_when_draggable: false,
          hmargin: 8000,
          vmargin: 6000,
          line_width: 2,
          line_color: '#78909c',
          line_style: 'curved',
          node_overflow: 'wrap',
          zoom: {
            min: 0.1,
            max: 5,
            step: 0.15,
            mask_key: 0,
          },
        },
        layout: {
          hspace: 140,
          vspace: 52,
          pspace: 22,
          cousin_space: 22,
        },
        default_event_handle: {
          enable_mousedown_handle: true,
          enable_click_handle: true,
          enable_dblclick_handle: false,
          enable_mousewheel_handle: false,
        },
        shortcut: { enable: false },
      });
      instance.show({
        meta: {
          name: model.title,
          author: 'TextForge',
          version: '1.0',
        },
        format: 'node_array',
        data: model.nodes,
      });
      applyExpansionMode(instance, hierarchy, model.rootId, expansionField.value);
      setNativeMindMapZoom(instance, 1);
      detachViewportPanning = attachViewportPanning(viewport, stage);

      const handleDblClick = (event) => {
        const id = jsMindNodeId(instance, event.target);
        if (!id) {
          return;
        }
        event.preventDefault();
        const node = instance.get_node?.(id);
        if (!node || node.isroot || !node.children?.length) {
          return;
        }
        if (node.expanded) {
          instance.collapse_node?.(id);
        } else {
          instance.expand_node?.(id);
        }
      };
      const handleClick = (event) => {
        const id = jsMindNodeId(instance, event.target);
        if (!id) {
          return;
        }
        const node = nodeById.get(id);
        if (!node) {
          return;
        }
        updateSelection(node);
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          openPrimaryProvenance(node, execution);
        } else {
          centerMindMapNode(viewport, stage, id);
        }
      };

      stage.addEventListener('dblclick', handleDblClick);
      stage.addEventListener('click', handleClick);
      removeListeners.push(() => stage.removeEventListener('dblclick', handleDblClick));
      removeListeners.push(() => stage.removeEventListener('click', handleClick));

      fitMindMap(instance, viewport, stage);
      highlightMatches();
    } catch (error) {
      if (!disposed) {
        container.innerHTML = createRuntimeMessageHtml(model.title, error?.message ?? 'jsMind failed to load.', 'error');
      }
    }
  })();

  return () => {
    disposed = true;
    detachSourceButton();
    detachViewportPanning();
    removeListeners.forEach((dispose) => dispose());
    if (instance) {
      instance.clear?.();
    }
    container.innerHTML = '';
  };
}

export const jsmindSurfaceContribution = {
  id: jsmindSurfaceId,
  label: 'jsMind mindmap',
  description: 'Open ITM visual targets through the jsMind runtime surface.',
  kind: 'visual-runtime',
  localName: 'jsmind',
  capabilities: [itmVisualCapabilityId],
  readOnly: true,
  defaultActive: true,
  documentPredicate: jsmindItmDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
  placements: ['main', 'popup'],
  openWithPriority: 94,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'jsMind mindmap';
    const placeholderHtml = createRuntimeMessageHtml(title, 'Resolving Visual ITM target for jsMind...');

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: 'Resolving the jsMind runtime surface.',
      detail: 'Mindmap runtime loading',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'jsMind surface',
          rows: [
            { label: 'Topics', value: 'resolving' },
            { label: 'Renderer', value: 'jsmind' },
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
                : mountJsMindRuntime(container, resolved.model, execution);
            } catch (error) {
              if (!disposed) {
                this.model.diagnostics = createUnavailableDiagnostics(
                  execution.resource,
                  error?.message ?? 'jsMind surface resolution failed.',
                  'renderer-jsmind.resolve-failed',
                );
                this.model.html = createRuntimeMessageHtml(title, error?.message ?? 'jsMind surface resolution failed.', 'error');
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

export function createRendererJsMindContributionManifest() {
  return createContributionManifest('@textforge/renderer-jsmind', {
    surfaces: [jsmindSurfaceContribution],
  });
}

export const contributions = createRendererJsMindContributionManifest();
