import {
  visualItmDerivedTargetKinds,
  visualItmDiagnosticSeverities,
  visualItmOriginModes,
  visualItmProvenanceKinds,
  visualItmRendererSources,
} from './constants.js';

export function normalizeDiagnosticSeverity(severity) {
  return visualItmDiagnosticSeverities.includes(severity) ? severity : 'warning';
}

export function normalizeOriginMode(mode) {
  return visualItmOriginModes.includes(mode) ? mode : 'derived-itm';
}

export function normalizeDerivedTargetKind(kind) {
  return visualItmDerivedTargetKinds.includes(kind) ? kind : 'raw-model';
}

export function normalizeRendererSource(source) {
  return visualItmRendererSources.includes(source) ? source : 'derived';
}

export function normalizeProvenanceKind(kind) {
  return visualItmProvenanceKinds.includes(kind) ? kind : 'translated';
}
