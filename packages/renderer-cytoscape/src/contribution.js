import { createContributionManifest } from '@textforge/core';

import {
  cytoscapeSurfaceId,
  itmVisualCapabilityId,
} from './constants.js';
import {
  createBaseRuntimeMarkup,
  createRuntimeMessageHtml,
} from './html.js';
import { createCytoscapeSurfaceModel } from './model.js';
import { cytoscapeItmDocumentPredicate } from './predicate.js';
import { mountCytoscapeRuntime } from './runtime-dom.js';
import {
  createUnavailableDiagnostics,
  resolveSurfaceModelFromExecution,
} from './resolver.js';

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
