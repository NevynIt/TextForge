import { createContributionManifest } from '@textforge/core';

import { itmVisualCapabilityId, jsmindSurfaceId } from './constants.js';
import { createUnavailableDiagnostics, resolveSurfaceModelFromExecution } from './execution.js';
import { createBaseRuntimeMarkup, createRuntimeMessageHtml } from './html.js';
import { jsmindItmDocumentPredicate } from './predicate.js';
import { mountJsMindRuntime } from './runtime-mount.js';

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
