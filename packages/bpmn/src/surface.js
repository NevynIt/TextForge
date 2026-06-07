import { createBpmnSurfaceDiagnostic } from './shared.js';
import {
  createBpmnViewerFailureHtml,
  createBpmnViewerRuntimeMarkup,
  mountBpmnViewerRuntime,
  resolveBpmnViewerSurfaceModel,
} from './viewer-runtime.js';
import {
  bpmnViewerCapabilityId,
  bpmnViewerSurfaceDocumentPredicate,
  bpmnViewerSurfaceId,
} from './ids.js';

export const bpmnViewerSurfaceContribution = {
  id: bpmnViewerSurfaceId,
  label: 'BPMN viewer',
  description: 'Open BPMN XML in a read-only BPMN.io viewer surface.',
  kind: 'visual-runtime',
  localName: 'bpmn',
  capabilities: [bpmnViewerCapabilityId],
  readOnly: true,
  defaultActive: true,
  resourcePredicate: bpmnViewerSurfaceDocumentPredicate,
  documentPredicate: bpmnViewerSurfaceDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['bpmn-xml', 'itm'],
  mimeTypes: ['application/bpmn+xml', 'text/itm', 'text/x-itm'],
  fileExtensions: ['bpmn', 'itm'],
  placements: ['main', 'popup'],
  openWithPriority: 92,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'BPMN viewer';
    const placeholderHtml = createBpmnViewerFailureHtml(title, 'Resolving BPMN XML...');

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: 'Resolving the BPMN.io viewer surface.',
      detail: 'Read-only BPMN XML viewer',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'BPMN surface',
          rows: [
            { label: 'Renderer', value: 'bpmn-js' },
            { label: 'Mode', value: 'Read-only' },
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
              const model = await resolveBpmnViewerSurfaceModel(execution, title);
              if (disposed) {
                return;
              }
              this.model.diagnostics = model.diagnostics;
              this.model.html = createBpmnViewerRuntimeMarkup(model);
              disposeRuntime = await mountBpmnViewerRuntime(container, model);
            } catch (error) {
              if (!disposed) {
                this.model.diagnostics = [
                  createBpmnSurfaceDiagnostic(
                    execution.resource,
                    error?.message ?? 'BPMN viewer resolution failed.',
                    'bpmn.viewer.resolve-failed',
                  ),
                ];
                this.model.html = createBpmnViewerFailureHtml(title, error?.message ?? 'BPMN viewer resolution failed.');
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
