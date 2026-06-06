import { createDiagnostic } from '@textforge/core';
import {
  createWorkspaceItmIncludeProvider,
  loadItmDocument,
  resolveItmVisualTarget,
} from '@textforge/itm';

import { cytoscapeSurfaceId } from './constants.js';
import { createRuntimeMessageHtml } from './html.js';
import { createCytoscapeSurfaceModel } from './model.js';

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

export function createUnavailableDiagnostics(resource, message, code) {
  return [
    createDiagnostic(message, 'error', {
      resource,
      code,
      origin: {
        packageId: '@textforge/renderer-cytoscape',
        subsystem: 'cytoscape-runtime',
        contributionId: cytoscapeSurfaceId,
      },
    }),
  ];
}

export async function resolveSurfaceModelFromExecution(execution, title) {
  const sourceText = execution.sourceText ?? '';
  if (!sourceText.trim()) {
    return {
      model: createCytoscapeSurfaceModel({ format: 'textforge.visual-itm/v1', origin: { mode: 'translated' }, nodes: [], edges: [] }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'No ITM source is available for the Cytoscape surface.', 'renderer-cytoscape.source-missing'),
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
  const diagnostics = [...resolved.diagnostics, ...resolved.visualDiagnostics];

  return {
    model: createCytoscapeSurfaceModel(resolved.visualDocument, {
      title,
      diagnostics,
    }),
  };
}
