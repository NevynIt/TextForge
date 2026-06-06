export function normalizeCapabilityIdArray(values = []) {
  return [...new Set(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  )].sort(compareByStringId);
}

export function normalizeContributionCapabilities(contribution) {
  return contribution.capabilities ?? contribution.capabilityIds ?? [];
}

export function normalizeManifestDependency(dependency) {
  if (typeof dependency === 'string') {
    return {
      packageId: normalizePackageId(dependency),
      optional: false,
      versionRange: undefined,
    };
  }

  return {
    packageId: normalizePackageId(dependency?.packageId ?? dependency?.id),
    optional: dependency?.optional === true,
    versionRange: normalizeLocalName(dependency?.versionRange ?? dependency?.version ?? dependency?.range),
  };
}

export function normalizeContributionIdentity(packageId, contribution) {
  const normalizedPackageId = normalizePackageId(packageId);
  const localName = normalizeLocalName(contribution.localName)
    ?? deriveContributionLocalName(normalizedPackageId, contribution.id);
  const id = normalizeLocalName(contribution.id)
    ?? createCanonicalContributionId(normalizedPackageId, localName);
  return {
    ...contribution,
    id,
    localName,
    packageId: normalizedPackageId,
  };
}

export function normalizeIdSet(values = []) {
  return new Set(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  );
}

export function normalizePackageId(packageId, fallback = '@textforge/unknown') {
  const normalized = String(packageId ?? '').trim();
  return normalized || fallback;
}

export function normalizeLocalName(localName) {
  const normalized = String(localName ?? '').trim();
  return normalized || undefined;
}

export function createCanonicalContributionId(packageId, localName) {
  const normalizedPackageId = normalizePackageId(packageId);
  const normalizedLocalName = normalizeLocalName(localName);
  if (!normalizedLocalName) {
    throw new Error(`Cannot derive a canonical contribution ID for ${normalizedPackageId} without a local contribution name.`);
  }
  return `${normalizedPackageId}/${normalizedLocalName}`;
}

export function deriveContributionLocalName(packageId, contributionId) {
  const normalizedPackageId = normalizePackageId(packageId);
  const normalizedContributionId = String(contributionId ?? '').trim();
  const prefix = `${normalizedPackageId}/`;
  if (normalizedContributionId.startsWith(prefix)) {
    return normalizedContributionId.slice(prefix.length) || undefined;
  }
  return undefined;
}

export function deriveCapabilityLocalName(capabilityId) {
  const normalizedCapabilityId = String(capabilityId ?? '').trim();
  if (!normalizedCapabilityId) {
    return undefined;
  }

  const capabilityMarker = '/capability/';
  const markerIndex = normalizedCapabilityId.indexOf(capabilityMarker);
  if (markerIndex >= 0) {
    return normalizeLocalName(normalizedCapabilityId.slice(markerIndex + capabilityMarker.length));
  }

  const lastSlashIndex = normalizedCapabilityId.lastIndexOf('/');
  if (lastSlashIndex >= 0) {
    return normalizeLocalName(normalizedCapabilityId.slice(lastSlashIndex + 1));
  }

  return normalizeLocalName(normalizedCapabilityId);
}

export function compareByStringId(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''));
}

export function compareManifestEntries(left, right) {
  return compareByStringId(left.packageId, right.packageId);
}

export function compareContributionEntries(left, right) {
  const packageComparison = compareByStringId(left.packageId, right.packageId);
  if (packageComparison !== 0) {
    return packageComparison;
  }
  return compareByStringId(left.id, right.id);
}

export function sortByCanonicalId(items = []) {
  return [...items].sort(compareContributionEntries);
}

export function sortDependenciesByPackageId(items = []) {
  return [...items].sort((left, right) => compareByStringId(left.packageId, right.packageId));
}
