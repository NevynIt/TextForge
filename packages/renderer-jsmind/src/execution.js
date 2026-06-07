import { createDiagnostic } from '@textforge/core';
import {
  createWorkspaceItmIncludeProvider,
  loadItmDocument,
  resolveItmVisualTarget,
} from '@textforge/itm';

import { jsmindSurfaceId } from './constants.js';
import { createRuntimeMessageHtml } from './html.js';
import { createJsMindSurfaceModel } from './model.js';

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

function estimateLargeVisualWork(sourceText) {
  const text = String(sourceText ?? '');
  const lineCount = text.split(/\r?\n/u).length;
  const entityCount = (text.match(/^&[A-Za-z0-9_.:-]+/gmu) ?? []).length;
  return {
    lineCount,
    entityCount,
    expensive: text.length > 750000 || lineCount > 20000 || entityCount > 1000,
  };
}

export function createUnavailableDiagnostics(resource, message, code) {
  return [
    createDiagnostic(message, 'error', {
      resource,
      code,
      origin: {
        packageId: '@textforge/renderer-jsmind',
        subsystem: 'jsmind-runtime',
        contributionId: jsmindSurfaceId,
      },
    }),
  ];
}

export async function resolveSurfaceModelFromExecution(execution, title) {
  const sourceText = execution.sourceText ?? '';
  if (!sourceText.trim()) {
    return {
      model: createJsMindSurfaceModel({
        format: 'textforge.visual-itm/v1',
        origin: { mode: 'translated' },
        nodes: [],
        edges: [],
      }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'No ITM source is available for the jsMind surface.', 'renderer-jsmind.source-missing'),
      }),
      surfaceHtml: createRuntimeMessageHtml(title, 'No ITM source is available for this surface.', 'error'),
    };
  }

  const workEstimate = estimateLargeVisualWork(sourceText);
  if (workEstimate.expensive) {
    return {
      model: createJsMindSurfaceModel({
        format: 'textforge.visual-itm/v1',
        origin: { mode: 'translated' },
        nodes: [],
        edges: [],
      }, {
        title,
        diagnostics: createUnavailableDiagnostics(execution.resource, 'Large ITM visual rendering was paused before synchronous graph resolution started.', 'renderer-jsmind.large-visual-paused'),
      }),
      surfaceHtml: createRuntimeMessageHtml(
        title,
        `Large visual rendering is paused for this ITM target (${workEstimate.entityCount} entities, ${workEstimate.lineCount} lines). Background-worker visual rendering is required before this can run without freezing the UI.`,
        'warning',
      ),
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
    projection: 'mindmap',
    title,
  });

  return {
    model: createJsMindSurfaceModel(resolved.visualDocument, {
      title,
      diagnostics: [...resolved.diagnostics, ...resolved.visualDiagnostics],
    }),
  };
}
