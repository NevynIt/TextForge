function instanceView(instance) {
  return instance?.view;
}

export function mindMapPanel(host) {
  return host?.querySelector('.jsmind-inner') ?? null;
}

function jsMindElementById(host, id) {
  return Array.from(host.querySelectorAll('jmnode')).find((element) => element.getAttribute('nodeid') === id) ?? null;
}

export function jsMindNodeId(instance, target) {
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

export function centerMindMapNode(viewport, host, id) {
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

export function setNativeMindMapZoom(instance, zoom, anchor) {
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

export function mindMapZoom(instance) {
  const zoom = instanceView(instance)?.zoom_current;
  return typeof zoom === 'number' && Number.isFinite(zoom) ? zoom : 1;
}

export function fitMindMap(instance, viewport, host) {
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

export function attachViewportPanning(viewport, stageHost) {
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
