import { createCommand } from '@textforge/core';

import {
  renderGraphvizToSvg,
  renderMermaidToSvg,
} from './renderers.js';

export const standaloneDiagramLanguageIds = ['mermaid', 'dot'];
export const standaloneDiagramMimeTypes = ['text/x-mermaid', 'text/vnd.graphviz'];
export const standaloneDiagramFileExtensions = ['mmd', 'mermaid', 'dot', 'gv'];
export const standaloneDiagramPreviewSurfaceId = '@textforge/diagrams/standalone-preview';

function normalizeExtension(path) {
  const fileName = String(path ?? '').split(/[\\/]/).pop() ?? '';
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : '';
}

export function getStandaloneDiagramKind(resource = {}) {
  const languageId = String(resource.languageId ?? '').toLowerCase();
  const mimeType = String(resource.mimeType ?? '').toLowerCase();
  const extension = normalizeExtension(resource.path);

  if (languageId === 'mermaid' || mimeType === 'text/x-mermaid' || extension === 'mmd' || extension === 'mermaid') {
    return 'mermaid';
  }

  if (languageId === 'dot' || mimeType === 'text/vnd.graphviz' || extension === 'dot' || extension === 'gv') {
    return 'dot';
  }

  return undefined;
}

export function isStandaloneDiagramResource(resource = {}) {
  return resource?.representation === 'text' && Boolean(getStandaloneDiagramKind(resource));
}

export async function renderStandaloneDiagramToSvg(source, options = {}) {
  const kind = options.kind ?? getStandaloneDiagramKind(options.resource);
  if (kind === 'mermaid') {
    return renderMermaidToSvg(source, {
      document: options.document,
      id: options.id,
    });
  }

  if (kind === 'dot') {
    return renderGraphvizToSvg(source);
  }

  throw new Error('Unsupported standalone diagram resource.');
}

function createPreviewMarkup(state, bodyHtml = '') {
  return `
    <section class="diagram-preview diagram-preview--${state}">
      <div class="diagram-preview__stage">
        ${bodyHtml}
      </div>
    </section>
  `;
}

function createMessageNode(ownerDocument, className, text) {
  const message = ownerDocument.createElement('p');
  message.className = className;
  message.textContent = text;
  return message;
}

export function createStandaloneDiagramPreviewSurface(source, options = {}) {
  const resource = options.resource;
  const kind = options.kind ?? getStandaloneDiagramKind(resource);
  const title = options.title ?? resource?.path ?? 'Diagram preview';
  const model = {
    id: `diagram-preview:${resource?.resourceId ?? 'virtual'}`,
    title,
    kind,
    summary: kind === 'mermaid'
      ? 'Standalone Mermaid preview rendered as SVG.'
      : 'Standalone Graphviz DOT preview rendered as SVG.',
    diagnostics: [],
  };

  return {
    id: model.id,
    contribution: standaloneDiagramPreviewSurfaceContribution,
    model,
    mount(container) {
      if (!container || typeof container.innerHTML !== 'string') {
        return () => {};
      }

      let disposed = false;
      const ownerDocument = container.ownerDocument ?? globalThis.document;
      container.innerHTML = createPreviewMarkup('loading');
      const stage = container.querySelector('.diagram-preview__stage');
      stage?.replaceChildren(createMessageNode(ownerDocument, 'diagram-preview__message', 'Rendering diagram preview...'));

      void renderStandaloneDiagramToSvg(source, {
        kind,
        resource,
        document: ownerDocument,
        id: resource?.resourceId ?? 'standalone-diagram',
      }).then((svg) => {
        if (disposed) {
          return;
        }
        container.innerHTML = createPreviewMarkup('ready', svg);
      }).catch((error) => {
        if (disposed) {
          return;
        }
        container.innerHTML = createPreviewMarkup('error');
        const nextStage = container.querySelector('.diagram-preview__stage');
        nextStage?.replaceChildren(createMessageNode(
          ownerDocument,
          'diagram-preview__message diagram-preview__message--error',
          `Diagram preview failed: ${error?.message ?? 'Unknown render error'}`,
        ));
      });

      return () => {
        disposed = true;
        container.innerHTML = '';
      };
    },
  };
}

export const standaloneDiagramPreviewSurfaceContribution = {
  id: standaloneDiagramPreviewSurfaceId,
  label: 'Diagram preview',
  description: 'Render standalone Mermaid and Graphviz DOT text resources as SVG.',
  kind: 'diagram-preview',
  localName: 'diagram-preview',
  capabilities: ['@textforge/diagrams/capability/mermaid', '@textforge/diagrams/capability/graphviz'],
  defaultActive: true,
  placements: ['main', 'popup', 'auxiliary'],
  resourceRepresentations: ['text'],
  languageIds: standaloneDiagramLanguageIds,
  openWithPriority: 110,
  open(execution = {}) {
    const workspaceResource = execution.workspaceResource;
    if (!isStandaloneDiagramResource(workspaceResource)) {
      return undefined;
    }

    const kind = getStandaloneDiagramKind(workspaceResource);
    const surface = createStandaloneDiagramPreviewSurface(workspaceResource.text, {
      kind,
      resource: execution.resource,
      title: execution.resourceTitle,
    });

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: surface.model.summary,
      detail: kind === 'mermaid' ? 'Mermaid to SVG' : 'Graphviz DOT to SVG',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Diagram',
          icon: 'fileImage',
          title: 'Standalone diagram',
          rows: [
            { label: 'Source type', value: kind === 'mermaid' ? 'Mermaid' : 'Graphviz DOT' },
            { label: 'Output', value: 'SVG preview' },
            { label: 'Export', value: 'Use Export diagram as SVG' },
          ],
        },
      ],
      surface,
    };
  },
};

export const diagramCommandContributions = [
  createCommand('diagram.export-selected-svg', 'Export diagram as SVG', {
    category: 'diagram',
    capabilities: ['@textforge/diagrams/capability/mermaid', '@textforge/diagrams/capability/graphviz'],
    description: 'Render the selected Mermaid or Graphviz DOT source resource and download the generated SVG.',
    keywords: ['diagram', 'mermaid', 'graphviz', 'dot', 'svg', 'export', 'download'],
    menu: { id: 'diagram', label: 'Diagram', groupOrder: 37, order: 10 },
    toolbar: { order: 85, kind: 'secondary' },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionRepresentations: ['text'],
      availableSurfaceIds: [standaloneDiagramPreviewSurfaceId],
    },
  }),
];
