import {
  createBaseRuntimeMarkup,
  createEmptySelectionMarkup,
  createRuntimeMessageHtml,
  createSelectionMarkup,
} from './html.js';
import { findCytoscapeMatches } from './model.js';
import {
  buildCytoscapeStylesheet,
  createCytoscapeLayoutOptions,
  mapElementsForRuntime,
} from './runtime-style.js';

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

export function mountCytoscapeRuntime(container, model, execution) {
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
  let detachSourceButton = () => {};

  const updateSelection = (entry) => {
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
