import {
  importBpmnXmlResult,
  loadItmDocument,
  resolveItmVisualTarget,
} from '@textforge/itm';
import {
  applyBpmnDiagramInterchangeToXml,
  extractBpmnDiagramInterchangeView,
  validateBpmnDiagramInterchangeView,
} from './diagram-interchange.js';
import {
  bpmnSemanticProfileText,
} from './fixtures.js';
import {
  appendUniqueDiagnostics,
  bpmnModdle,
  collectProcessSummaries,
  createBpmnSurfaceDiagnostic,
  createBpmnSurfaceIncludeProviders,
  joinLikePath,
  readWorkspaceTextResource,
  resolveSiblingResourcePath,
  stringifyBpmnWarning,
} from './shared.js';

export async function createBpmnViewerModelFromXml(xml, options = {}) {
  const diagnostics = [];
  const trimmed = String(xml ?? '').trim();
  if (!trimmed) {
    diagnostics.push(createBpmnSurfaceDiagnostic(
      options.resource,
      'No BPMN XML source is available for this surface.',
      'bpmn.viewer.source-missing',
    ));
    return {
      id: 'bpmn-viewer:empty',
      title: options.title ?? 'BPMN viewer',
      summary: '0 processes / 0 diagrams',
      detail: 'Read-only BPMN XML surface.',
      diagnostics,
      xml: '',
      definitions: undefined,
      processes: [],
      diagramCount: 0,
    };
  }

  try {
    const parsed = await bpmnModdle.fromXML(trimmed);
    const warnings = (parsed.warnings ?? []).map((warning, index) =>
      createBpmnSurfaceDiagnostic(
        options.resource,
        stringifyBpmnWarning(warning),
        `bpmn.viewer.parse-warning-${index + 1}`,
        'warning',
      ));
    appendUniqueDiagnostics(diagnostics, warnings);
    const definitions = parsed.rootElement;
    const processes = collectProcessSummaries(definitions);
    const diagrams = Array.isArray(definitions?.diagrams) ? definitions.diagrams : [];

    return {
      id: `bpmn-viewer:${options.title ?? 'document'}`,
      title: options.title ?? 'BPMN viewer',
      summary: `${processes.length} process${processes.length === 1 ? '' : 'es'} / ${diagrams.length} diagram${diagrams.length === 1 ? '' : 's'}`,
      detail: 'Read-only BPMN XML surface.',
      diagnostics,
      xml: trimmed,
      definitions,
      processes,
      diagramCount: diagrams.length,
    };
  } catch (error) {
    diagnostics.push(createBpmnSurfaceDiagnostic(
      options.resource,
      error?.message ?? 'BPMN XML could not be parsed.',
      'bpmn.viewer.parse-failed',
    ));
    return {
      id: `bpmn-viewer:${options.title ?? 'document'}`,
      title: options.title ?? 'BPMN viewer',
      summary: '0 processes / 0 diagrams',
      detail: 'Read-only BPMN XML surface.',
      diagnostics,
      xml: trimmed,
      definitions: undefined,
      processes: [],
      diagramCount: 0,
    };
  }
}

function mergeBpmnViewerDiagnostics(model, diagnostics, detail) {
  return {
    ...model,
    detail: detail ?? model.detail,
    diagnostics: appendUniqueDiagnostics([...(model.diagnostics ?? [])], diagnostics),
  };
}

function findCandidateBpmnDiView(loaded, resolved, requestedTarget) {
  if (resolved?.projectedDocument?.view?.name) {
    return resolved.projectedDocument.view;
  }

  const viewpointId = String(requestedTarget?.viewpointId ?? resolved?.target?.viewpointId ?? resolved?.target?.id ?? '').trim();
  if (!viewpointId) {
    return undefined;
  }

  const views = [
    ...(loaded?.effectiveResolvedDocument?.views ?? []),
    ...(loaded?.resolvedDocument?.views ?? []),
  ];
  return views.find((view) => view?.viewpointRef === viewpointId);
}

export async function createBpmnViewerModelFromItmSource(sourceText, options = {}) {
  const title = options.title ?? 'BPMN viewer';
  if (!String(sourceText ?? '').trim()) {
    return createBpmnViewerModelFromXml('', {
      title,
      resource: options.resource,
    });
  }

  const loaded = await loadItmDocument(sourceText, {
    strict: false,
    uri: options.resource?.path,
    includeProviders: createBpmnSurfaceIncludeProviders(options),
    repositoryResolution: options.repositoryResolution,
    contributionRegistry: options.contributionRegistry,
    documentResource: {
      path: options.resource?.path,
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: options.resource?.mimeType ?? 'text/x-itm',
    },
  });
  const requestedTarget = options.session?.surfaceState?.itmVisualTarget ?? options.target;
  const resolved = resolveItmVisualTarget(loaded, {
    target: requestedTarget,
    projection: requestedTarget?.projection ?? 'graph',
    title,
  });
  const diagnostics = [...loaded.diagnostics, ...resolved.diagnostics, ...resolved.visualDiagnostics];

  if (resolved.target.available === false) {
    return mergeBpmnViewerDiagnostics(await createBpmnViewerModelFromXml('', {
      title,
      resource: options.resource,
    }), diagnostics, 'BPMN ITM visual target is unavailable.');
  }

  const sourceFile = String(
    loaded.effectiveResolvedDocument?.metadata?.values?.sourceFile
      ?? loaded.effectiveResolvedDocument?.metadata?.sourceFile
      ?? loaded.resolvedDocument?.metadata?.values?.sourceFile
      ?? loaded.resolvedDocument?.metadata?.sourceFile
      ?? loaded.document?.metadata?.values?.sourceFile
      ?? loaded.document?.metadata?.sourceFile
      ?? '',
  ).trim();
  const sourcePath = resolveSiblingResourcePath(options.resource?.path, sourceFile);
  const sourceXml = sourcePath
    ? readWorkspaceTextResource(options.workspaceService, sourcePath)
    : undefined;
  if (!sourceXml) {
    diagnostics.push(createBpmnSurfaceDiagnostic(
      options.resource,
      sourceFile
        ? `Referenced BPMN source '${sourceFile}' could not be loaded for this ITM target.`
        : 'This ITM BPMN target does not declare a sourceFile BPMN XML reference.',
      'bpmn.viewer.source-file-missing',
    ));
  }

  const selectedView = findCandidateBpmnDiView(loaded, resolved, requestedTarget);
  let appliedXml = sourceXml ?? '';
  let provenanceDetail = sourcePath
    ? `Read-only BPMN view sourced from ${sourcePath}.`
    : 'Read-only BPMN view sourced from ITM target metadata.';

  if (selectedView?.name) {
    try {
      const diView = extractBpmnDiagramInterchangeView(sourceText, {
        viewName: selectedView.name,
        startLine: selectedView.sourceRange?.startLine,
      });
      appendUniqueDiagnostics(diagnostics, validateBpmnDiagramInterchangeView(
        diView,
        loaded.effectiveResolvedDocument,
        { resource: options.resource },
      ));
      provenanceDetail = sourcePath
        ? `View ${diView.viewName} via viewpoint ${diView.viewpointRef ?? selectedView.viewpointRef} from ${sourcePath}.`
        : `View ${diView.viewName} via viewpoint ${diView.viewpointRef ?? selectedView.viewpointRef}.`;

      if (appliedXml) {
        const applied = await applyBpmnDiagramInterchangeToXml(appliedXml, diView, {
          resource: options.resource,
        });
        appliedXml = applied.xml;
        appendUniqueDiagnostics(diagnostics, applied.diagnostics);
      }
    } catch (error) {
      diagnostics.push(createBpmnSurfaceDiagnostic(
        options.resource,
        error?.message ?? 'BPMN Diagram Interchange could not be extracted from the ITM view.',
        'bpmn.viewer.di-extraction-failed',
      ));
    }
  } else if (requestedTarget?.kind === 'viewpoint') {
    provenanceDetail = sourcePath
      ? `Viewpoint ${requestedTarget.id} from ${sourcePath}.`
      : `Viewpoint ${requestedTarget.id}.`;
  }

  const model = await createBpmnViewerModelFromXml(appliedXml, {
    title,
    resource: options.resource,
  });
  return mergeBpmnViewerDiagnostics(model, diagnostics, provenanceDetail);
}
