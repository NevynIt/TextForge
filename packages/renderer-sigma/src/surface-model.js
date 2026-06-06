import { createWorkspaceItmIncludeProvider, loadItmDocument, resolveItmVisualTarget } from '@textforge/itm';
import { isVisualItmDocument, validateVisualItmDocument } from '@textforge/visual-itm';

import { createSigmaGraphDescriptor } from './graph-descriptor.js';
import { createUnavailableDiagnostics } from './diagnostics.js';
import { createRuntimeMessageHtml } from './html.js';

function createSurfaceIncludeProviders(execution) {
  const includeProviders = [];
  if (execution.workspaceService?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(execution.workspaceService, {
      basePath: execution.resource?.path,
      ...(execution.repositoryResolution ?? {}),
    }));
  }
  return includeProviders;
}

export function createSigmaSurfaceModel(visualDocument, options = {}) {
  const diagnostics = [
    ...(options.diagnostics ?? []),
    ...validateVisualItmDocument(visualDocument),
  ];
  const valid = isVisualItmDocument(visualDocument)
    ? visualDocument
    : {
      format: 'textforge.visual-itm/v1',
      origin: { mode: 'translated' },
      nodes: [],
      edges: [],
    };

  return {
    id: `sigma:${options.title ?? 'visual-itm'}`,
    title: options.title ?? 'Sigma graph',
    summary: `Interactive Sigma graph for ${valid.nodes.length} nodes and ${valid.edges.length} edges.`,
    detail: `${valid.nodes.length} nodes / ${valid.edges.length} edges`,
    diagnostics,
    visualDocument: valid,
    graph: createSigmaGraphDescriptor(valid),
  };
}

export async function resolveSurfaceModelFromExecution(execution, title) {
  const sourceText = execution.sourceText ?? '';
  if (!sourceText.trim()) {
    return {
      model: createSigmaSurfaceModel({
        format: 'textforge.visual-itm/v1',
        origin: { mode: 'translated' },
        nodes: [],
        edges: [],
      }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'No ITM source is available for the Sigma surface.', 'renderer-sigma.source-missing'),
      }),
      surfaceHtml: createRuntimeMessageHtml(title, 'No ITM source is available for this surface.', 'error'),
    };
  }

  const loaded = await loadItmDocument(sourceText, {
    strict: false,
    uri: execution.resource?.path,
    includeProviders: createSurfaceIncludeProviders(execution),
    repositoryResolution: execution.repositoryResolution,
    contributionRegistry: execution.contributionRegistry,
    documentResource: {
      path: execution.resource?.path,
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: execution.resource?.mimeType ?? 'text/x-itm',
    },
  });
  const requestedTarget = execution.session?.surfaceState?.itmVisualTarget;
  const resolved = resolveItmVisualTarget(loaded, {
    target: requestedTarget,
    projection: 'graph',
    title,
  });

  return {
    model: createSigmaSurfaceModel(resolved.visualDocument, {
      title,
      diagnostics: [...resolved.diagnostics, ...resolved.visualDiagnostics],
    }),
  };
}
