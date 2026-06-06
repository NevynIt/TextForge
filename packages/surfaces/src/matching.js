import {
  matchesResourcePredicate,
} from '@textforge/core';

export function matchesPlacement(contribution, placement) {
  const placements = contribution.placements ?? ['main', 'popup', 'auxiliary'];
  return placements.includes(placement);
}

function matchesCapabilityScope(contribution, request) {
  const activeContributionIds = new Set(request.activeContributionIds ?? []);
  if (activeContributionIds.size > 0 && !activeContributionIds.has(contribution.id)) {
    return false;
  }

  const activeCapabilityIds = new Set(request.activeCapabilityIds ?? []);
  if (activeCapabilityIds.size === 0) {
    return true;
  }

  const contributionCapabilities = contribution.capabilities ?? [];
  if (contributionCapabilities.length === 0) {
    return false;
  }

  return contributionCapabilities.some((capabilityId) => activeCapabilityIds.has(capabilityId));
}

export function canOpenWithSurface(contribution, request) {
  const requestedPlacement = request.placement ?? 'main';
  if (!matchesPlacement(contribution, requestedPlacement)) {
    return false;
  }

  if (!matchesCapabilityScope(contribution, request)) {
    return false;
  }

  if (!matchesResourcePredicate(contribution.resourcePredicate ?? contribution, request.resource)) {
    return false;
  }

  if (contribution.documentPredicate && !matchesResourcePredicate(contribution.documentPredicate, request.resource)) {
    return false;
  }

  if (requestedPlacement === 'popup' && request.allowPopup === false) {
    return false;
  }

  if (requestedPlacement === 'popup' && contribution.allowPopup === false) {
    return false;
  }

  return true;
}

export function getDefaultSurfacePlacement(registry, request) {
  for (const placement of ['main', 'popup', 'auxiliary']) {
    const candidate = registry.list().some((contribution) =>
      canOpenWithSurface(contribution, { ...request, placement }),
    );
    if (candidate) {
      return placement;
    }
  }

  return request.placement ?? 'main';
}
