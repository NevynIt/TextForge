import { cloneScalarRecord, cloneSourceRange, cloneStringArray } from './clone.js';
import { visualItmFormatId } from './constants.js';
import {
  normalizeDerivedTargetKind,
  normalizeDiagnosticSeverity,
  normalizeOriginMode,
  normalizeProvenanceKind,
  normalizeRendererSource,
} from './normalize.js';

export function createVisualItmProvenance(overrides) {
  return {
    sourceKind: normalizeProvenanceKind(overrides?.sourceKind),
    sourceId: typeof overrides?.sourceId === 'string' ? overrides.sourceId : undefined,
    sourcePath: typeof overrides?.sourcePath === 'string' ? overrides.sourcePath : undefined,
    sourceRange: cloneSourceRange(overrides?.sourceRange),
  };
}

export function createVisualItmDiagnostic(overrides) {
  return {
    severity: normalizeDiagnosticSeverity(overrides?.severity),
    code: String(overrides?.code ?? 'visual-itm.unknown').trim() || 'visual-itm.unknown',
    message: String(overrides?.message ?? 'Visual ITM diagnostic.').trim() || 'Visual ITM diagnostic.',
    subjectId: typeof overrides?.subjectId === 'string' ? overrides.subjectId : undefined,
    provenance: Array.isArray(overrides?.provenance)
      ? overrides.provenance.map((entry) => createVisualItmProvenance(entry))
      : undefined,
  };
}

export function createVisualItmNode(overrides) {
  return {
    id: String(overrides?.id ?? '').trim(),
    label: typeof overrides?.label === 'string' ? overrides.label : undefined,
    kind: typeof overrides?.kind === 'string' ? overrides.kind : undefined,
    classes: cloneStringArray(overrides?.classes),
    tags: cloneStringArray(overrides?.tags),
    parentId: typeof overrides?.parentId === 'string' ? overrides.parentId : undefined,
    style: cloneScalarRecord(overrides?.style),
    layout: cloneScalarRecord(overrides?.layout),
    provenance: Array.isArray(overrides?.provenance)
      ? overrides.provenance.map((entry) => createVisualItmProvenance(entry))
      : undefined,
  };
}

export function createVisualItmEdge(overrides) {
  return {
    id: String(overrides?.id ?? '').trim(),
    sourceId: String(overrides?.sourceId ?? '').trim(),
    targetId: String(overrides?.targetId ?? '').trim(),
    label: typeof overrides?.label === 'string' ? overrides.label : undefined,
    kind: typeof overrides?.kind === 'string' ? overrides.kind : undefined,
    classes: cloneStringArray(overrides?.classes),
    tags: cloneStringArray(overrides?.tags),
    style: cloneScalarRecord(overrides?.style),
    layout: cloneScalarRecord(overrides?.layout),
    provenance: Array.isArray(overrides?.provenance)
      ? overrides.provenance.map((entry) => createVisualItmProvenance(entry))
      : undefined,
  };
}

export function createVisualItmDocument(overrides) {
  const origin = overrides?.origin ?? {};
  const renderer = overrides?.renderer;

  return {
    format: visualItmFormatId,
    origin: {
      mode: normalizeOriginMode(origin.mode),
      sourceResource: typeof origin.sourceResource === 'string' ? origin.sourceResource : undefined,
      sourceHash: typeof origin.sourceHash === 'string' ? origin.sourceHash : undefined,
      derivedTarget: origin.derivedTarget
        ? {
          kind: normalizeDerivedTargetKind(origin.derivedTarget.kind),
          id: typeof origin.derivedTarget.id === 'string' ? origin.derivedTarget.id : undefined,
          viewpointId: typeof origin.derivedTarget.viewpointId === 'string' ? origin.derivedTarget.viewpointId : undefined,
        }
        : undefined,
    },
    renderer: renderer
      ? {
        value: typeof renderer.value === 'string' ? renderer.value : undefined,
        source: normalizeRendererSource(renderer.source),
        hints: cloneScalarRecord(renderer.hints),
      }
      : undefined,
    diagnostics: Array.isArray(overrides?.diagnostics)
      ? overrides.diagnostics.map((entry) => createVisualItmDiagnostic(entry))
      : undefined,
    nodes: Array.isArray(overrides?.nodes)
      ? overrides.nodes.map((entry) => createVisualItmNode(entry))
      : [],
    edges: Array.isArray(overrides?.edges)
      ? overrides.edges.map((entry) => createVisualItmEdge(entry))
      : [],
  };
}
