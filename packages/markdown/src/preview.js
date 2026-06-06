import { markdownPreviewSurfaceContribution } from './contributions.js';

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

      const handleLinkClick = (event) => {
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
      };

      if (typeof container.ownerDocument?.createElement === 'function') {
        const template = container.ownerDocument.createElement('template');
        template.innerHTML = model.html;
        const cspNonce = readCspNonce(container.ownerDocument);
        if (cspNonce) {
          for (const styleElement of template.content.querySelectorAll('style')) {
            styleElement.setAttribute('nonce', cspNonce);
          }
        }
        container.replaceChildren(template.content.cloneNode(true));
      } else {
        container.innerHTML = model.html;
      }
      if (typeof container.addEventListener === 'function') {
        container.addEventListener('click', handleLinkClick);
      }
      return () => {
        if (typeof container.removeEventListener === 'function') {
          container.removeEventListener('click', handleLinkClick);
        }
        container.innerHTML = '';
      };
    },
  };
}

function readCspNonce(targetDocument) {
  if (!targetDocument?.querySelector) {
    return undefined;
  }

  const meta = targetDocument.querySelector('meta[name="textforge-csp-nonce"]');
  const nonce = meta?.getAttribute('content')?.trim();
  return nonce || undefined;
}
