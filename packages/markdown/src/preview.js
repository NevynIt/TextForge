import { markdownPreviewSurfaceContribution } from './contributions.js';

const markdownPreviewMountStateKey = '__textforgeMarkdownPreviewMountState';

export function createMarkdownPreviewModel(source, result, options = {}) {
  const resourceTitle = options.resource?.path ?? 'Markdown preview';
  return {
    id: `markdown-preview:${options.resource?.resourceId ?? 'virtual'}`,
    title: resourceTitle,
    summary: `Markdown preview with ${result.diagnostics.length} diagnostics and ${result.generatedResources.length} generated diagram artifacts.`,
    html: result.html,
    diagnostics: result.diagnostics,
    metadata: result.metadata,
    referencedAssets: result.referencedAssets,
    generatedResources: result.generatedResources,
  };
}

export function createMarkdownPreviewSurface(source, result, options = {}) {
  const model = createMarkdownPreviewModel(source, result, options);
  return {
    id: model.id,
    contribution: markdownPreviewSurfaceContribution,
    model,
    mount(container) {
      if (!container || typeof container.innerHTML !== 'string') {
        return () => {};
      }

      const state = createMarkdownPreviewMountState(container, options);
      container[markdownPreviewMountStateKey] = state;
      renderMarkdownPreviewHtml(container, model.html);
      if (typeof container.addEventListener === 'function') {
        container.addEventListener('click', state.handleLinkClick);
      }
      return () => {
        state.dispose();
        if (typeof container.removeEventListener === 'function') {
          container.removeEventListener('click', state.handleLinkClick);
        }
        container.innerHTML = '';
        delete container[markdownPreviewMountStateKey];
      };
    },
    update(container, nextSurface, updateOptions = {}) {
      const nextHtml = nextSurface?.model?.html;
      if (!container || typeof nextHtml !== 'string') {
        return false;
      }

      const state = container[markdownPreviewMountStateKey] ?? createMarkdownPreviewMountState(container, options);
      container[markdownPreviewMountStateKey] = state;
      state.scheduleBufferedSwap(nextHtml, updateOptions);
      return true;
    },
  };
}

function createMarkdownPreviewMountState(container, options = {}) {
  const scheduler = options.scheduler ?? globalThis;
  let disposed = false;
  let updateVersion = 0;
  let pendingFrameId;
  let pendingStaged;

  function cancelPendingSwap() {
    if (pendingFrameId !== undefined && typeof scheduler.cancelAnimationFrame === 'function') {
      scheduler.cancelAnimationFrame(pendingFrameId);
    }
    pendingFrameId = undefined;
    pendingStaged?.remove?.();
    pendingStaged = undefined;
  }

  function scheduleFrame(callback) {
    if (typeof scheduler.requestAnimationFrame === 'function') {
      pendingFrameId = scheduler.requestAnimationFrame(callback);
      return;
    }

    pendingFrameId = undefined;
    callback();
  }

  function handleLinkClick(event) {
    if (!options.onLinkActivate || event?.defaultPrevented || event?.button > 0) {
      return;
    }
    if (event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey) {
      return;
    }

    const target = event?.target;
    const link = typeof target?.closest === 'function'
      ? target.closest('a[href]')
      : undefined;
    if (!link || typeof link.getAttribute !== 'function') {
      return;
    }
    if (typeof container.contains === 'function' && !container.contains(link)) {
      return;
    }

    const href = String(link.getAttribute('href') ?? '').trim();
    if (!href || href.startsWith('#')) {
      return;
    }

    if (options.onLinkActivate({
      href,
      link,
      event,
      resource: options.resource,
    })) {
      event.preventDefault();
    }
  }

  function scheduleBufferedSwap(nextHtml, updateOptions = {}) {
    const version = updateVersion + 1;
    updateVersion = version;
    cancelPendingSwap();
    const scrollHost = updateOptions.scrollHost ?? findPreviewScrollHost(container);
    const scrollPosition = readScrollPosition(scrollHost);
    const staged = createStagedPreviewContent(container, nextHtml);
    pendingStaged = staged;
    if (!staged) {
      renderMarkdownPreviewHtml(container, nextHtml);
      restoreScrollPosition(scrollHost, scrollPosition);
      updateOptions.onAfterSwap?.();
      return;
    }

    scheduleFrame(() => {
      pendingFrameId = undefined;
      if (disposed || version !== updateVersion) {
        staged.remove?.();
        return;
      }

      pendingStaged = undefined;
      replaceContainerChildren(container, staged);
      restoreScrollPosition(scrollHost, scrollPosition);
      updateOptions.onAfterSwap?.();
    });
  }

  function dispose() {
    disposed = true;
    cancelPendingSwap();
  }

  return {
    handleLinkClick,
    scheduleBufferedSwap,
    dispose,
  };
}

function createStagedPreviewContent(container, html) {
  if (typeof container.ownerDocument?.createElement !== 'function') {
    return undefined;
  }

  const staged = container.ownerDocument.createElement('div');
  staged.setAttribute?.('aria-hidden', 'true');
  staged.style.position = 'absolute';
  staged.style.inset = '0';
  staged.style.visibility = 'hidden';
  staged.style.pointerEvents = 'none';
  staged.style.overflow = 'hidden';
  renderMarkdownPreviewHtml(staged, html);
  if (typeof container.appendChild === 'function') {
    container.appendChild(staged);
  }
  return staged;
}

function renderMarkdownPreviewHtml(container, html) {
  if (typeof container.ownerDocument?.createElement === 'function') {
    const template = container.ownerDocument.createElement('template');
    template.innerHTML = html;
    const cspNonce = readCspNonce(container.ownerDocument);
    if (cspNonce) {
      for (const styleElement of template.content.querySelectorAll('style')) {
        styleElement.setAttribute('nonce', cspNonce);
      }
    }
    container.replaceChildren(template.content.cloneNode(true));
    return;
  }

  container.innerHTML = html;
}

function replaceContainerChildren(container, staged) {
  const nextChildren = Array.from(staged.childNodes ?? []);
  if (typeof container.replaceChildren === 'function') {
    container.replaceChildren(...nextChildren);
    return;
  }

  container.innerHTML = staged.innerHTML ?? '';
}

function findPreviewScrollHost(container) {
  if (typeof container.closest !== 'function') {
    return undefined;
  }
  return container.closest('.tf-surface-frame__viewport, .tf-popup-host__body');
}

function readScrollPosition(scrollHost) {
  if (!scrollHost) {
    return { top: 0, left: 0 };
  }
  return {
    top: scrollHost.scrollTop ?? 0,
    left: scrollHost.scrollLeft ?? 0,
  };
}

function restoreScrollPosition(scrollHost, position) {
  if (!scrollHost || !position) {
    return;
  }
  const maxTop = typeof scrollHost.scrollHeight === 'number' && typeof scrollHost.clientHeight === 'number'
    ? Math.max(0, scrollHost.scrollHeight - scrollHost.clientHeight)
    : Number.POSITIVE_INFINITY;
  const maxLeft = typeof scrollHost.scrollWidth === 'number' && typeof scrollHost.clientWidth === 'number'
    ? Math.max(0, scrollHost.scrollWidth - scrollHost.clientWidth)
    : Number.POSITIVE_INFINITY;
  const top = Math.min(Math.max(0, position.top ?? 0), maxTop);
  const left = Math.min(Math.max(0, position.left ?? 0), maxLeft);
  if (typeof scrollHost.scrollTo === 'function') {
    scrollHost.scrollTo({ top, left });
    return;
  }
  scrollHost.scrollTop = top;
  scrollHost.scrollLeft = left;
}

function readCspNonce(targetDocument) {
  if (!targetDocument?.querySelector) {
    return undefined;
  }

  const meta = targetDocument.querySelector('meta[name="textforge-csp-nonce"]');
  const nonce = meta?.getAttribute('content')?.trim();
  return nonce || undefined;
}
