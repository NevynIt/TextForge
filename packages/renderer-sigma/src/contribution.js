import { createContributionManifest } from '@textforge/core';

import { itmVisualCapabilityId, sigmaSurfaceId } from './constants.js';
import { sigmaItmDocumentPredicate } from './predicate.js';
import { createUnavailableDiagnostics } from './diagnostics.js';
import { createBaseRuntimeMarkup, createRuntimeMessageHtml } from './html.js';
import { mountSigmaRuntime } from './runtime.js';
import { resolveSurfaceModelFromExecution } from './surface-model.js';

export const sigmaSurfaceContribution = {
  id: sigmaSurfaceId,
  label: 'Sigma dense graph',
  description: 'Open ITM visual targets through the Sigma/Graphology runtime graph surface.',
  kind: 'visual-runtime',
  localName: 'sigma',
  capabilities: [itmVisualCapabilityId],
  readOnly: true,
  defaultActive: true,
  documentPredicate: sigmaItmDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
  placements: ['main', 'popup'],
  openWithPriority: 93,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'Sigma graph';
    const placeholderHtml = createRuntimeMessageHtml(title, 'Resolving Visual ITM target for Sigma...');

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: 'Resolving the Sigma runtime surface.',
      detail: 'Dense graph runtime loading',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'Sigma surface',
          rows: [
            { label: 'Nodes', value: 'resolving' },
            { label: 'Edges', value: 'resolving' },
            { label: 'Renderer', value: 'sigma' },
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
                : mountSigmaRuntime(container, resolved.model, execution);
            } catch (error) {
              if (!disposed) {
                this.model.diagnostics = createUnavailableDiagnostics(
                  execution.resource,
                  error?.message ?? 'Sigma surface resolution failed.',
                  'renderer-sigma.resolve-failed',
                );
                this.model.html = createRuntimeMessageHtml(title, error?.message ?? 'Sigma surface resolution failed.', 'error');
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

export function createRendererSigmaContributionManifest() {
  return createContributionManifest('@textforge/renderer-sigma', {
    surfaces: [sigmaSurfaceContribution],
  });
}

export const contributions = createRendererSigmaContributionManifest();
