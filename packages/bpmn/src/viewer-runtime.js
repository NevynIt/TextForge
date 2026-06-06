import { createDiagnostic } from '@textforge/core';
import {
  createBpmnViewerModelFromItmSource,
  createBpmnViewerModelFromXml,
} from './viewer-model.js';
import { escapeHtml } from './shared.js';

function createBpmnViewerRuntimeMarkup(model) {
  return `
    <section
      class="tf-bpmn-viewer"
      style="position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;width:100%;height:100%;min-width:0;min-height:0;background:#ffffff;color:#111827;padding:12px;box-sizing:border-box;"
    >
      <div
        class="tf-bpmn-viewer__toolbar"
        style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 0 4px;border-bottom:1px solid #e5e7eb;"
      >
        <button type="button" data-bpmn-fit>Fit</button>
        <button type="button" data-bpmn-reset>Reset zoom</button>
      </div>
      <div
        class="tf-bpmn-viewer__body"
        style="display:flex;flex:1 1 auto;width:100%;min-width:0;min-height:0;"
      >
        <div
          class="tf-bpmn-viewer__stage"
          data-bpmn-stage
          style="display:block;flex:1 1 auto;width:100%;min-width:0;min-height:0;height:100%;background:#ffffff;border:1px solid #d1d5db;border-radius:10px;overflow:hidden;position:relative;"
        ></div>
      </div>
    </section>
  `;
}

export function createBpmnViewerFailureHtml(title, message) {
  return `
    <section
      class="tf-bpmn-viewer tf-bpmn-viewer--error"
      style="display:flex;flex-direction:column;justify-content:center;gap:12px;height:100%;min-height:0;background:#ffffff;color:#111827;padding:24px;box-sizing:border-box;"
    >
      <div class="tf-bpmn-viewer__body tf-bpmn-viewer__body--message">
        <p style="margin:0;font-weight:600;">${escapeHtml(title)}</p>
        <p class="tf-bpmn-viewer__message" style="margin:8px 0 0;">${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

export async function mountBpmnViewerRuntime(container, model) {
  const viewport = container.closest('.tf-surface-frame__viewport, .tf-popup-host__body');
  const previousViewportStyle = viewport
    ? {
      display: viewport.style.display,
      flexDirection: viewport.style.flexDirection,
      minHeight: viewport.style.minHeight,
    }
    : undefined;
  const previousContainerStyle = {
    display: container.style.display,
    position: container.style.position,
    flexDirection: container.style.flexDirection,
    flex: container.style.flex,
    width: container.style.width,
    height: container.style.height,
    minWidth: container.style.minWidth,
    minHeight: container.style.minHeight,
    overflow: container.style.overflow,
  };

  if (viewport instanceof HTMLElement) {
    viewport.style.display = 'flex';
    viewport.style.flexDirection = 'column';
    viewport.style.minHeight = '0';
  }
  container.style.display = 'flex';
  container.style.position = 'relative';
  container.style.flexDirection = 'column';
  container.style.flex = '1 1 auto';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.minWidth = '0';
  container.style.minHeight = '0';
  container.style.overflow = 'hidden';
  container.innerHTML = createBpmnViewerRuntimeMarkup(model);
  const stage = container.querySelector('[data-bpmn-stage]');
  const fitButton = container.querySelector('[data-bpmn-fit]');
  const resetButton = container.querySelector('[data-bpmn-reset]');

  if (!stage || !fitButton || !resetButton) {
    container.innerHTML = createBpmnViewerFailureHtml(model.title, 'BPMN viewer UI failed to initialize.');
    return () => {
      if (viewport instanceof HTMLElement && previousViewportStyle) {
        viewport.style.display = previousViewportStyle.display;
        viewport.style.flexDirection = previousViewportStyle.flexDirection;
        viewport.style.minHeight = previousViewportStyle.minHeight;
      }
      container.style.display = previousContainerStyle.display;
      container.style.position = previousContainerStyle.position;
      container.style.flexDirection = previousContainerStyle.flexDirection;
      container.style.flex = previousContainerStyle.flex;
      container.style.width = previousContainerStyle.width;
      container.style.height = previousContainerStyle.height;
      container.style.minWidth = previousContainerStyle.minWidth;
      container.style.minHeight = previousContainerStyle.minHeight;
      container.style.overflow = previousContainerStyle.overflow;
      container.innerHTML = '';
    };
  }

  try {
    await import('bpmn-js/dist/assets/diagram-js.css');
    await import('bpmn-js/dist/assets/bpmn-js.css');
    await import('bpmn-js/dist/assets/bpmn-font/css/bpmn.css');
    const { default: NavigatedViewer } = await import('bpmn-js/lib/NavigatedViewer');
    const viewer = new NavigatedViewer({
      container: stage,
      additionalModules: [],
    });
    await viewer.importXML(model.xml);
    const root = container.querySelector('.tf-bpmn-viewer');
    const toolbar = container.querySelector('.tf-bpmn-viewer__toolbar');
    const body = container.querySelector('.tf-bpmn-viewer__body');
    stage.style.background = '#ffffff';
    const innerContainer = stage.querySelector('.djs-container');
    if (innerContainer instanceof HTMLElement) {
      innerContainer.style.background = '#ffffff';
      innerContainer.style.width = '100%';
      innerContainer.style.height = '100%';
    }
    const canvasContainer = stage.querySelector('.djs-canvas');
    if (canvasContainer instanceof HTMLElement) {
      canvasContainer.style.background = '#ffffff';
      canvasContainer.style.width = '100%';
      canvasContainer.style.height = '100%';
    }
    const canvas = viewer.get('canvas');
    const syncLayout = () => {
      if (!(root instanceof HTMLElement) || !(toolbar instanceof HTMLElement) || !(body instanceof HTMLElement)) {
        return;
      }
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;
      const toolbarHeight = toolbar.offsetHeight;
      const availableBodyHeight = Math.max(160, containerHeight - toolbarHeight - 36);
      root.style.width = `${containerWidth}px`;
      root.style.height = `${containerHeight}px`;
      body.style.flex = '0 0 auto';
      body.style.height = `${availableBodyHeight}px`;
      stage.style.height = `${availableBodyHeight}px`;
      canvas?.resized?.();
    };
    syncLayout();
    viewer.get('canvas')?.zoom('fit-viewport', 'auto');
    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
        syncLayout();
      })
      : undefined;
    resizeObserver?.observe(container);
    if (root instanceof HTMLElement) {
      resizeObserver?.observe(root);
    }

    const handleFit = () => viewer.get('canvas')?.zoom('fit-viewport', 'auto');
    const handleReset = () => viewer.get('canvas')?.zoom(1);
    fitButton.addEventListener('click', handleFit);
    resetButton.addEventListener('click', handleReset);

    return () => {
      resizeObserver?.disconnect();
      fitButton.removeEventListener('click', handleFit);
      resetButton.removeEventListener('click', handleReset);
      viewer.destroy();
      if (viewport instanceof HTMLElement && previousViewportStyle) {
        viewport.style.display = previousViewportStyle.display;
        viewport.style.flexDirection = previousViewportStyle.flexDirection;
        viewport.style.minHeight = previousViewportStyle.minHeight;
      }
      container.style.display = previousContainerStyle.display;
      container.style.position = previousContainerStyle.position;
      container.style.flexDirection = previousContainerStyle.flexDirection;
      container.style.flex = previousContainerStyle.flex;
      container.style.width = previousContainerStyle.width;
      container.style.height = previousContainerStyle.height;
      container.style.minWidth = previousContainerStyle.minWidth;
      container.style.minHeight = previousContainerStyle.minHeight;
      container.style.overflow = previousContainerStyle.overflow;
      container.innerHTML = '';
    };
  } catch (error) {
    container.innerHTML = createBpmnViewerFailureHtml(model.title, error?.message ?? 'BPMN.io failed to load.');
    return () => {
      if (viewport instanceof HTMLElement && previousViewportStyle) {
        viewport.style.display = previousViewportStyle.display;
        viewport.style.flexDirection = previousViewportStyle.flexDirection;
        viewport.style.minHeight = previousViewportStyle.minHeight;
      }
      container.style.display = previousContainerStyle.display;
      container.style.position = previousContainerStyle.position;
      container.style.flexDirection = previousContainerStyle.flexDirection;
      container.style.flex = previousContainerStyle.flex;
      container.style.width = previousContainerStyle.width;
      container.style.height = previousContainerStyle.height;
      container.style.minWidth = previousContainerStyle.minWidth;
      container.style.minHeight = previousContainerStyle.minHeight;
      container.style.overflow = previousContainerStyle.overflow;
      container.innerHTML = '';
    };
  }
}

export async function renderBpmnPublicationSvg(xml, options = {}) {
  const targetDocument = options.document ?? globalThis.document;
  if (!targetDocument?.createElement) {
    throw new Error('BPMN publication rendering requires a browser document.');
  }

  const host = targetDocument.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '1600px';
  host.style.height = '1200px';
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  (targetDocument.body ?? targetDocument.documentElement)?.appendChild(host);

  try {
    const { default: NavigatedViewer } = await import('bpmn-js/lib/NavigatedViewer');
    const viewer = new NavigatedViewer({
      container: host,
      additionalModules: [],
    });
    try {
      await viewer.importXML(xml);
      viewer.get('canvas')?.zoom('fit-viewport', 'auto');
      const exported = await viewer.saveSVG();
      return typeof exported?.svg === 'string' ? exported.svg : String(exported ?? '');
    } finally {
      viewer.destroy();
    }
  } finally {
    host.remove();
  }
}

export async function resolveBpmnViewerSurfaceModel(execution, title) {
  const isItmResource = execution.resource?.languageId === 'itm'
    || execution.resource?.mimeType === 'text/itm'
    || execution.resource?.mimeType === 'text/x-itm';
  if (isItmResource) {
    return createBpmnViewerModelFromItmSource(execution.sourceText ?? '', {
      title,
      resource: execution.resource,
      workspaceService: execution.workspaceService,
      repositoryResolution: execution.repositoryResolution,
      contributionRegistry: execution.contributionRegistry,
      session: execution.session,
    });
  }

  return createBpmnViewerModelFromXml(execution.sourceText ?? '', {
    title,
    resource: execution.resource,
  });
}
