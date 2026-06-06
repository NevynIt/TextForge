import {
  createOpenWithSelection,
} from './registry.js';

export function createPipelineValueResource(value, overrides = {}) {
  if (value?.resource) {
    return {
      ...value.resource,
      resourceId: overrides.resourceId ?? value.resource.resourceId,
      path: overrides.path ?? value.resource.path,
    };
  }

  const resourceId = overrides.resourceId ?? `pipeline:${String(value?.kind ?? 'value').trim() || 'value'}`;
  const normalizedKind = String(value?.kind ?? '').trim().toLowerCase();
  const textResource = (path, languageId, mimeType) => ({
    resourceId,
    kind: 'virtual',
    representation: 'text',
    path: overrides.path ?? path,
    languageId,
    mimeType,
  });

  switch (normalizedKind) {
    case 'svg':
      return textResource('/virtual/pipeline/output.svg', 'svg', 'image/svg+xml');
    case 'json':
      return textResource('/virtual/pipeline/output.json', 'json', 'application/json');
    case 'yaml':
      return textResource('/virtual/pipeline/output.yaml', 'yaml', 'application/yaml');
    case 'html':
      return textResource('/virtual/pipeline/output.html', undefined, 'text/html');
    case 'diagnostics':
      return textResource('/virtual/pipeline/diagnostics.txt', 'plaintext', 'text/plain');
    case 'png':
      return {
        resourceId,
        kind: 'virtual',
        representation: 'bytes',
        path: overrides.path ?? '/virtual/pipeline/output.png',
        mimeType: 'image/png',
      };
    case 'workspace-resource':
      return {
        resourceId,
        kind: 'virtual',
        representation: 'text',
        path: overrides.path ?? '/virtual/pipeline/resource.txt',
        mimeType: 'text/plain',
      };
    case 'text':
    default:
      return textResource('/virtual/pipeline/output.txt', 'plaintext', 'text/plain');
  }
}

export function createPipelineValueOpenWithSelection(registry, request) {
  return createOpenWithSelection(registry, {
    resource: createPipelineValueResource(request.value, {
      resourceId: request.resourceId,
      path: request.path,
    }),
    placement: request.placement,
    allowPopup: request.allowPopup,
    activeCapabilityIds: request.activeCapabilityIds,
    activeContributionIds: request.activeContributionIds,
    preferredSurfaceIds: request.preferredSurfaceIds,
  });
}
