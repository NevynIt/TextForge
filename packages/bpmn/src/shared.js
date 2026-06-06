import { createDiagnostic } from '@textforge/core';
import BpmnModdle from 'bpmn-moddle';
import {
  createWorkspaceItmIncludeProvider,
  isResolvedDocument,
  resolveDocument,
} from '@textforge/itm';
import { bpmnViewerSurfaceId } from './ids.js';

export const supportedEntityTypes = new Set([
  'bpmn::Definitions',
  'bpmn::Process',
  'bpmn::Task',
  'bpmn::SubProcess',
  'bpmn::StartEvent',
  'bpmn::EndEvent',
  'bpmn::ExclusiveGateway',
  'bpmn::DataObject',
  'bpmn::DataObjectReference',
  'bpmn::DataStore',
  'bpmn::DataStoreReference',
]);

export const supportedRelationshipTypes = new Set([
  'bpmn::sequenceFlow',
  'bpmn::association',
  'bpmn::dataObjectRef',
  'bpmn::dataStoreRef',
]);

export const bpmnModdle = new BpmnModdle();

export function normalizeMultilineText(source) {
  return String(source ?? '').replace(/\r\n?/gu, '\n');
}

export function countBraceDelta(line) {
  let delta = 0;
  let quote = '';
  let escaped = false;

  for (const character of String(line ?? '')) {
    if (quote) {
      if (!escaped && character === quote) {
        quote = '';
      }
      escaped = !escaped && character === '\\';
      continue;
    }

    if (character === '"' || character === '\'') {
      quote = character;
      escaped = false;
      continue;
    }

    if (character === '{') {
      delta += 1;
    } else if (character === '}') {
      delta -= 1;
    }
  }

  return delta;
}

export function readRecordString(record, key) {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function readFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function coerceRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

export function collectSemanticElementIdentifiers(document) {
  const resolved = toResolvedDocument(document);
  const entityIds = new Set();
  const relationshipIds = new Set();

  for (const entity of resolved.entities ?? []) {
    for (const candidate of [
      entity?.uid,
      entity?.id,
      entity?.localId,
      entity?.qualifiedId,
      entity?.attributes?.values?.id,
    ]) {
      const normalized = String(candidate ?? '').trim();
      if (normalized) {
        entityIds.add(normalized);
      }
    }
  }

  for (const relationship of resolved.relationships ?? []) {
    for (const candidate of [
      relationship?.uid,
      relationship?.id,
      relationship?.attributes?.values?.id,
    ]) {
      const normalized = String(candidate ?? '').trim();
      if (normalized) {
        relationshipIds.add(normalized);
      }
    }
  }

  return { entityIds, relationshipIds };
}

export function collectModdleElementsById(value, byId, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return;
  }
  seen.add(value);

  if (typeof value.id === 'string' && value.id.trim()) {
    byId.set(value.id, value);
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === '$parent') {
      continue;
    }
    if (Array.isArray(child)) {
      for (const item of child) {
        collectModdleElementsById(item, byId, seen);
      }
      continue;
    }
    collectModdleElementsById(child, byId, seen);
  }
}

export function createModdleBounds(bounds) {
  return bpmnModdle.create('dc:Bounds', {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });
}

export function createModdleWaypoint(waypoint) {
  return bpmnModdle.create('dc:Point', {
    x: waypoint.x,
    y: waypoint.y,
  });
}

export function ensurePlaneElements(plane) {
  if (!Array.isArray(plane.planeElement)) {
    plane.planeElement = [];
  }
  return plane.planeElement;
}

export function findPlaneElement(planeElements, diElementId, bpmnElementId) {
  return planeElements.find((entry) =>
    (diElementId && entry?.id === diElementId)
    || (bpmnElementId && entry?.bpmnElement?.id === bpmnElementId));
}

export function createBpmnSurfaceIncludeProviders(execution) {
  const includeProviders = [];
  if (execution.workspaceService?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(execution.workspaceService, {
      basePath: execution.resource?.path,
      ...(execution.repositoryResolution ?? {}),
    }));
  }
  return includeProviders;
}

export function isWindowsAbsolutePath(value) {
  return /^[A-Za-z]:[\\/]/u.test(String(value ?? ''));
}

export function normalizePathSegments(segments) {
  const normalized = [];
  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
        normalized.pop();
      }
      continue;
    }
    normalized.push(segment);
  }
  return normalized;
}

export function dirnameLikePath(path) {
  const normalized = String(path ?? '').trim();
  if (!normalized) {
    return '';
  }
  const separatorIndex = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  if (separatorIndex < 0) {
    return '';
  }
  if (separatorIndex === 0 && normalized.startsWith('/')) {
    return '/';
  }
  if (separatorIndex === 2 && isWindowsAbsolutePath(normalized)) {
    return normalized.slice(0, 3);
  }
  return normalized.slice(0, separatorIndex);
}

export function joinLikePath(basePath, relativePath) {
  const normalizedRelative = String(relativePath ?? '').replaceAll('\\', '/');
  if (basePath.startsWith('/')) {
    const joined = `${basePath.replace(/\/+$/u, '')}/${normalizedRelative}`;
    return `/${normalizePathSegments(joined.split('/')).join('/')}`.replace(/^\/{2,}/u, '/');
  }

  if (isWindowsAbsolutePath(basePath) || basePath.includes('\\')) {
    const normalizedBase = String(basePath ?? '').replaceAll('/', '\\');
    const drivePrefix = normalizedBase.slice(0, 2);
    const baseSegments = normalizedBase.slice(isWindowsAbsolutePath(normalizedBase) ? 2 : 0).split('\\');
    const relativeSegments = normalizedRelative.split('/');
    const combined = normalizePathSegments([...baseSegments, ...relativeSegments]);
    const suffix = combined.join('\\');
    return drivePrefix
      ? `${drivePrefix}\\${suffix}`.replace(/\\{2,}/gu, '\\')
      : suffix;
  }

  return normalizePathSegments(`${basePath}/${normalizedRelative}`.split('/')).join('/');
}

export function resolveSiblingResourcePath(basePath, targetPath) {
  const normalizedTarget = String(targetPath ?? '').trim();
  if (!normalizedTarget) {
    return undefined;
  }
  if (normalizedTarget.startsWith('/') || isWindowsAbsolutePath(normalizedTarget)) {
    return normalizedTarget;
  }

  const normalizedBase = String(basePath ?? '').trim();
  if (!normalizedBase) {
    return normalizedTarget;
  }

  return joinLikePath(dirnameLikePath(normalizedBase), normalizedTarget);
}

export function readWorkspaceTextResource(workspaceService, path) {
  const entry = workspaceService?.getEntryByPath?.(path);
  if (!entry || entry.kind !== 'resource' || entry.representation !== 'text') {
    return undefined;
  }
  return entry.text;
}

export function toResolvedDocument(document) {
  return isResolvedDocument(document) ? document : resolveDocument(document);
}

export function appendUniqueDiagnostics(target, diagnostics) {
  const seen = new Set(target.map((diagnostic) =>
    `${diagnostic.code ?? ''}|${diagnostic.severity}|${diagnostic.message}|${diagnostic.entityUid ?? ''}|${diagnostic.relationshipUid ?? ''}`));
  for (const diagnostic of diagnostics) {
    const fingerprint = `${diagnostic.code ?? ''}|${diagnostic.severity}|${diagnostic.message}|${diagnostic.entityUid ?? ''}|${diagnostic.relationshipUid ?? ''}`;
    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    target.push(diagnostic);
  }
  return target;
}

export function createBpmnSurfaceDiagnostic(resource, message, code, severity = 'error') {
  return createDiagnostic(message, severity, {
    code,
    resource,
    origin: {
      packageId: '@textforge/bpmn',
      contributionId: bpmnViewerSurfaceId,
      subsystem: 'bpmn-viewer',
    },
  });
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function stringifyBpmnWarning(warning) {
  if (!warning) {
    return 'Unknown BPMN XML warning.';
  }
  if (typeof warning === 'string') {
    return warning;
  }
  if (typeof warning.message === 'string' && warning.message.trim()) {
    return warning.message;
  }
  return String(warning);
}

export function collectProcessSummaries(definitions) {
  const rootElements = Array.isArray(definitions?.rootElements) ? definitions.rootElements : [];
  return rootElements
    .filter((element) => element?.$type === 'bpmn:Process')
    .map((process) => ({
      id: process.id,
      name: process.name,
      flowElementCount: Array.isArray(process.flowElements) ? process.flowElements.length : 0,
    }));
}
