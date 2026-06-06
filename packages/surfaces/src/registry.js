import {
  createDiagnostic,
} from '@textforge/core';

import {
  canOpenWithSurface,
  getDefaultSurfacePlacement,
  matchesPlacement,
} from './matching.js';

function chooseBestContribution(contributionsList, request) {
  const matching = contributionsList.filter((contribution) => canOpenWithSurface(contribution, request));
  const preferred = request.preferredSurfaceIds?.map((surfaceId) =>
    matching.find((contribution) => contribution.id === surfaceId),
  );
  const preferredMatch = preferred?.find((contribution) => Boolean(contribution));
  if (preferredMatch) {
    return preferredMatch;
  }

  if (matching.length > 0) {
    return matching.sort((left, right) => (right.openWithPriority ?? 0) - (left.openWithPriority ?? 0))[0];
  }

  return contributionsList[0];
}

export function createOpenWithSelection(registry, request) {
  const placement = request.placement ?? getDefaultSurfacePlacement(registry, request);
  const candidates = registry.list()
    .filter((contribution) => canOpenWithSurface(contribution, { ...request, placement }))
    .sort((left, right) => (right.openWithPriority ?? 0) - (left.openWithPriority ?? 0));
  const selectedSurfaceId = request.preferredSurfaceIds?.find((surfaceId) =>
    candidates.some((candidate) => candidate.id === surfaceId),
  ) ?? candidates[0]?.id;

  return {
    resource: request.resource,
    placement,
    diagnostics: candidates.length === 0
      ? [
        createDiagnostic(
          `No registered surface can open ${request.resource.path ?? request.resource.resourceId}.`,
          'warning',
          {
            code: 'surface.unavailable',
            origin: {
              packageId: '@textforge/surfaces',
              subsystem: 'open-with',
            },
            resource: request.resource,
          },
        ),
      ]
      : [],
    candidates: candidates.map((contribution) => ({
      surfaceId: contribution.id,
      label: contribution.label ?? contribution.id,
      description: contribution.description,
      placement,
      priority: contribution.openWithPriority ?? 0,
      selected: contribution.id === selectedSurfaceId,
    })),
    selectedSurfaceId,
  };
}

export function createSurfaceRegistry(initialContributions = []) {
  const items = [...initialContributions];
  const registry = {
    get contributions() {
      return [...items];
    },
    register(contribution) {
      const existingIndex = items.findIndex((candidate) => candidate.id === contribution.id);
      if (existingIndex >= 0) {
        items.splice(existingIndex, 1, contribution);
      } else {
        items.push(contribution);
      }
      return registry;
    },
    get(surfaceId) {
      return items.find((contribution) => contribution.id === surfaceId);
    },
    list() {
      return [...items];
    },
    listByPlacement(placement) {
      return items.filter((contribution) => matchesPlacement(contribution, placement));
    },
    chooseForResource(request) {
      const placement = request.placement ?? getDefaultSurfacePlacement(registry, request);
      return chooseBestContribution(items, { ...request, placement });
    },
  };

  return registry;
}
