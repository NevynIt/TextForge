import {
  createBaseRuntimeMarkup,
  createEmptySelectionMarkup,
  createRuntimeMessageHtml,
  createSelectionMarkup,
} from './html.js';
import { findJsMindMatches } from './model.js';
import {
  attachViewportPanning,
  centerMindMapNode,
  fitMindMap,
  jsMindNodeId,
  mindMapZoom,
  setNativeMindMapZoom,
} from './runtime-dom.js';
import { applyExpansionMode, buildHierarchy } from './runtime-hierarchy.js';

function openPrimaryProvenance(node, execution) {
  const provenance = node?.provenance?.find((candidate) => candidate?.sourcePath);
  if (!provenance?.sourcePath) {
    return false;
  }

  return execution.openSourceRange?.(provenance.sourcePath, provenance.sourceRange, { placement: 'main' }) ?? false;
}

export function mountJsMindRuntime(container, model, execution) {
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
