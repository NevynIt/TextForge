import {
  languageDefinitions,
  legacySeverityAliases,
  resourceBadgePlacements,
  severityLevels,
} from './constants.js';
import { compareByStringId, normalizeCapabilityIdArray } from './identity.js';

function normalizeSeverity(severity = 'information') {
  const normalized = legacySeverityAliases[severity] ?? severity;
  return severityLevels.includes(normalized) ? normalized : 'information';
}

function extensionFromPath(path) {
  const fileName = path?.split(/[\\/]/).pop() ?? '';
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : '';
}

function normalizeResourcePredicate(input = {}) {
  return {
    representations: input.representations ?? input.resourceRepresentations ?? [],
    mimeTypes: input.mimeTypes ?? [],
    languageIds: input.languageIds ?? [],
    fileExtensions: input.fileExtensions ?? [],
  };
}

export function createSourcePosition(line, column, offset) {
  return {
    line,
    column,
    ...(offset === undefined ? {} : { offset }),
  };
}

export function createSourceRange(start, end) {
  return { start, end };
}

export function createResourceRef(resourceId, overrides = {}) {
  const kind = overrides.kind === 'text' || overrides.kind === 'binary'
    ? 'resource'
    : overrides.kind;
  const representation = overrides.representation
    ?? (overrides.kind === 'text' ? 'text' : undefined)
    ?? (overrides.kind === 'binary' ? 'bytes' : undefined);
  return {
    resourceId,
    ...overrides,
    kind,
    representation,
    capabilityIds: normalizeCapabilityIdArray(overrides.capabilityIds),
    diagnostics: overrides.diagnostics ?? [],
  };
}

function normalizeResourceBadgePlacement(placement) {
  if (resourceBadgePlacements.includes(placement)) {
    return placement;
  }
  return 'center';
}

export function createResourceBadgeToken(overrides = {}) {
  const placement = normalizeResourceBadgePlacement(overrides.placement);
  const shape = overrides.shape ?? 'square';
  const accent = overrides.accent ?? 'teal';
  const mark = overrides.mark ?? 'dot';
  return {
    key: overrides.key ?? `${shape}-${accent}-${mark}-${placement}`,
    fingerprint: overrides.fingerprint ?? '',
    shape,
    accent,
    mark,
    placement,
    variant: Number.isInteger(overrides.variant) ? overrides.variant : 0,
    label: overrides.label ?? 'Resource badge',
    description: overrides.description,
    repairedFromKey: overrides.repairedFromKey,
  };
}

export function createDiagnostic(message, severity = 'info', overrides = {}) {
  const normalizedSeverity = normalizeSeverity(overrides.severity ?? severity);
  return {
    message,
    ...overrides,
    severity: normalizedSeverity,
    origin: overrides.origin
      ? {
        ...overrides.origin,
      }
      : undefined,
    related: overrides.related
      ? overrides.related.map((entry) => ({
        ...entry,
      }))
      : undefined,
  };
}

export function createPipelineValue(kind, value, overrides = {}) {
  return {
    kind,
    value,
    ...overrides,
  };
}

export function createCanonicalPatch(target, operations, overrides = {}) {
  return {
    target,
    operations,
    ...overrides,
  };
}

export function getLanguageDefinition(languageId) {
  return languageDefinitions.find((definition) => definition.id === languageId);
}

export function listResourceTypeOptions(definitions = languageDefinitions) {
  return definitions
    .filter((definition) => definition?.sourceEditor && definition.id)
    .map((definition) => ({
      id: definition.id,
      languageId: definition.id,
      label: definition.label ?? definition.id,
      mimeType: definition.mimeTypes[0] ?? 'text/plain',
      mimeTypes: [...(definition.mimeTypes ?? [])],
      extensions: [...(definition.extensions ?? [])],
      representation: 'text',
    }));
}

export function getResourceTypeOption(languageId, definitions = languageDefinitions) {
  return listResourceTypeOptions(definitions).find((option) => option.languageId === languageId);
}

export function applyResourceTypeOverride(resource, override) {
  if (!resource || resource.representation !== 'text' || !override?.languageId) {
    return resource;
  }

  const option = getResourceTypeOption(override.languageId) ?? override;
  return {
    ...resource,
    languageId: option.languageId,
    mimeType: option.mimeType ?? resource.mimeType,
    fileExtension: option.extensions?.[0] ?? extensionFromPath(resource.path),
  };
}

export function getResourceRepresentation(resource) {
  if (!resource) {
    return undefined;
  }

  if (resource.representation === 'text' || resource.representation === 'bytes') {
    return resource.representation;
  }

  if (resource.kind === 'text') {
    return 'text';
  }

  if (resource.kind === 'binary') {
    return 'bytes';
  }

  return undefined;
}

export function createResourceFacts(input = {}) {
  const resourceId = input.resourceId ?? input.id ?? '';
  return {
    resourceId,
    kind: input.kind === 'text' || input.kind === 'binary' ? 'resource' : input.kind,
    representation: getResourceRepresentation(input),
    path: input.path,
    mimeType: input.mimeType,
    languageId: input.languageId,
    fileExtension: input.fileExtension ?? extensionFromPath(input.path),
    providerId: input.providerId,
    revision: input.revision,
    capabilityIds: normalizeCapabilityIdArray(input.capabilityIds),
    ownerKind: input.ownerKind,
    ownerId: input.ownerId,
    provenanceKind: input.provenance?.kind,
    diagnosticCount: Array.isArray(input.diagnostics) ? input.diagnostics.length : 0,
  };
}

export function hasResourceCapability(resource, capabilityId) {
  const normalizedCapabilityId = String(capabilityId ?? '').trim();
  if (!normalizedCapabilityId) {
    return false;
  }

  return normalizeCapabilityIdArray(resource?.capabilityIds).includes(normalizedCapabilityId);
}

export function createResourcePredicate(overrides = {}) {
  return normalizeResourcePredicate(overrides);
}

export function matchesResourcePredicate(predicate = {}, input = {}) {
  const normalizedPredicate = normalizeResourcePredicate(predicate);
  const resourceFacts = createResourceFacts(input);

  if (normalizedPredicate.representations.length > 0) {
    if (!resourceFacts.representation || !normalizedPredicate.representations.includes(resourceFacts.representation)) {
      return false;
    }
  }

  if (normalizedPredicate.mimeTypes.length > 0) {
    const normalizedMimeType = resourceFacts.mimeType?.toLowerCase();
    if (!normalizedMimeType || !normalizedPredicate.mimeTypes.some((candidate) => candidate.toLowerCase() === normalizedMimeType)) {
      return false;
    }
  }

  if (normalizedPredicate.languageIds.length > 0) {
    if (!resourceFacts.languageId || !normalizedPredicate.languageIds.includes(resourceFacts.languageId)) {
      return false;
    }
  }

  if (normalizedPredicate.fileExtensions.length > 0) {
    if (!resourceFacts.fileExtension || !normalizedPredicate.fileExtensions.includes(resourceFacts.fileExtension)) {
      return false;
    }
  }

  return true;
}

function canDecodeUtf8(bytes) {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return !text.includes('\u0000');
  } catch {
    return false;
  }
}

export function inferResourceRepresentation({ path, mimeType, bytes, fallback = 'bytes' } = {}) {
  const normalizedMimeType = mimeType?.toLowerCase();
  const languageId = inferLanguageId({ path, mimeType, fallback: undefined });
  const opaqueMimeTypes = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/avif',
  ]);

  if (normalizedMimeType === 'image/svg+xml' || languageId === 'svg') {
    return 'text';
  }

  if (opaqueMimeTypes.has(normalizedMimeType)) {
    return 'bytes';
  }

  if (languageId) {
    return 'text';
  }

  if (normalizedMimeType?.startsWith('text/')) {
    return 'text';
  }

  if (bytes instanceof Uint8Array && canDecodeUtf8(bytes)) {
    return 'text';
  }

  return fallback;
}

export function inferLanguageId({ path, mimeType, fallback = 'plaintext' } = {}) {
  const normalizedMimeType = mimeType?.toLowerCase();
  const byMime = languageDefinitions.find((definition) =>
    definition.mimeTypes.some((candidate) => candidate.toLowerCase() === normalizedMimeType),
  );
  if (byMime) {
    return byMime.id;
  }

  const extension = extensionFromPath(path);
  const byExtension = languageDefinitions.find((definition) => definition.extensions.includes(extension));
  return byExtension?.id ?? fallback;
}
