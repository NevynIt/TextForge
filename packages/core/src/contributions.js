import {
  normalizeCommand,
} from './commands.js';
import {
  createDiagnostic,
  createResourceFacts,
  createResourcePredicate,
  createResourceRef,
  matchesResourcePredicate,
} from './resources.js';
import {
  compareByStringId,
  compareContributionEntries,
  compareManifestEntries,
  deriveCapabilityLocalName,
  deriveContributionLocalName,
  normalizeContributionCapabilities,
  normalizeContributionIdentity,
  normalizeIdSet,
  normalizeLocalName,
  normalizeManifestDependency,
  normalizePackageId,
  sortByCanonicalId,
  sortDependenciesByPackageId,
} from './identity.js';

function normalizeResourcePredicate(input = {}) {
  return {
    representations: input.representations ?? input.resourceRepresentations ?? [],
    mimeTypes: input.mimeTypes ?? [],
    languageIds: input.languageIds ?? [],
    fileExtensions: input.fileExtensions ?? [],
  };
}

function normalizeCapability(capability) {
  const normalizedLocalName = normalizeLocalName(capability?.localName)
    ?? deriveCapabilityLocalName(capability?.id);
  const aliases = [...new Set(
    (capability?.aliases ?? [])
      .map((alias) => normalizeLocalName(alias))
      .filter(Boolean),
  )].sort(compareByStringId);
  return {
    defaultActive: false,
    scope: 'document',
    localName: normalizedLocalName,
    aliases,
    documentPredicate: normalizeResourcePredicate(capability?.documentPredicate ?? {}),
    ...capability,
    localName: normalizedLocalName,
    aliases,
    documentPredicate: normalizeResourcePredicate(capability?.documentPredicate ?? {}),
  };
}

export function createCapability(id, overrides = {}) {
  return normalizeCapability({
    id,
    ...overrides,
  });
}

export function createSurfaceContribution(id, overrides = {}) {
  return {
    id,
    capabilities: normalizeContributionCapabilities(overrides),
    localName: normalizeLocalName(overrides.localName) ?? deriveContributionLocalName(overrides.packageId, id),
    defaultActive: overrides.defaultActive ?? false,
    resourcePredicate: normalizeResourcePredicate({
      ...overrides.resourcePredicate,
      resourceRepresentations: overrides.resourceRepresentations,
      mimeTypes: overrides.mimeTypes,
      languageIds: overrides.languageIds,
      fileExtensions: overrides.fileExtensions,
    }),
    ...overrides,
  };
}

export function createPipelineContribution(id, overrides = {}) {
  return {
    id,
    capabilities: normalizeContributionCapabilities(overrides),
    localName: normalizeLocalName(overrides.localName) ?? deriveContributionLocalName(overrides.packageId, id),
    defaultActive: overrides.defaultActive ?? false,
    ...overrides,
  };
}

export function createMarkdownFenceHandlerContribution(id, overrides = {}) {
  return {
    id,
    label: overrides.label ?? id,
    description: overrides.description,
    capabilities: normalizeContributionCapabilities(overrides),
    localName: normalizeLocalName(overrides.localName) ?? deriveContributionLocalName(overrides.packageId, id),
    defaultActive: overrides.defaultActive ?? false,
    provisional: overrides.provisional ?? false,
    localArtifactCompatible: overrides.localArtifactCompatible !== false,
    fenceNames: [...(overrides.fenceNames ?? [])],
    render: overrides.render,
  };
}

export function createContributionManifest(packageId, overrides = {}) {
  const normalizedPackageId = normalizePackageId(packageId);
  return {
    id: normalizedPackageId,
    packageId: normalizedPackageId,
    name: undefined,
    version: undefined,
    description: undefined,
    dependencies: [],
    capabilities: [],
    commands: [],
    surfaces: [],
    pipelines: [],
    markdownFenceHandlers: [],
    ...overrides,
    id: normalizedPackageId,
    packageId: normalizedPackageId,
    dependencies: sortDependenciesByPackageId((overrides.dependencies ?? []).map((dependency) =>
      normalizeManifestDependency(dependency))),
    capabilities: [...(overrides.capabilities ?? [])]
      .map((capability) => normalizeCapability(capability))
      .sort((left, right) => compareByStringId(left.id, right.id)),
    commands: (overrides.commands ?? []).map((command) => normalizeCommand(command, normalizedPackageId)),
    surfaces: sortByCanonicalId((overrides.surfaces ?? []).map((contribution) =>
      normalizeContributionIdentity(
        normalizedPackageId,
        createSurfaceContribution(contribution.id, { ...contribution, packageId: normalizedPackageId }),
      ))),
    pipelines: sortByCanonicalId((overrides.pipelines ?? []).map((contribution) =>
      normalizeContributionIdentity(
        normalizedPackageId,
        createPipelineContribution(contribution.id, { ...contribution, packageId: normalizedPackageId }),
      ))),
    markdownFenceHandlers: sortByCanonicalId((overrides.markdownFenceHandlers ?? []).map((contribution) =>
      normalizeContributionIdentity(
        normalizedPackageId,
        createMarkdownFenceHandlerContribution(contribution.id, { ...contribution, packageId: normalizedPackageId }),
      ))),
  };
}

function collectManifestContributions(manifests, propertyName) {
  return sortByCanonicalId(manifests.flatMap((manifest) =>
    (manifest[propertyName] ?? []).map((contribution) =>
      normalizeContributionIdentity(manifest.packageId, contribution))));
}

function collectManifestCapabilities(manifests) {
  return manifests.flatMap((manifest) =>
    (manifest.capabilities ?? []).map((capability) => ({
      ...capability,
      packageId: manifest.packageId,
    })))
    .sort((left, right) => {
      const idComparison = compareByStringId(left.id, right.id);
      if (idComparison !== 0) {
        return idComparison;
      }
      return compareByStringId(left.packageId, right.packageId);
    });
}

function parseVersionParts(version) {
  const normalized = String(version ?? '').trim().replace(/^[=v]/, '');
  if (!normalized) {
    return undefined;
  }

  const [majorText, minorText = '0', patchText = '0'] = normalized.split(/[.-]/);
  const major = Number.parseInt(majorText, 10);
  const minor = Number.parseInt(minorText, 10);
  const patch = Number.parseInt(patchText, 10);
  if ([major, minor, patch].some((value) => Number.isNaN(value))) {
    return undefined;
  }

  return [major, minor, patch];
}

function compareVersionParts(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function isVersionRangeSatisfied(version, versionRange) {
  const normalizedRange = String(versionRange ?? '').trim();
  if (!normalizedRange || normalizedRange === '*') {
    return true;
  }

  const normalizedVersion = String(version ?? '').trim();
  if (!normalizedVersion) {
    return false;
  }

  const comparisonOperators = ['>=', '<=', '>', '<'];
  for (const operator of comparisonOperators) {
    if (!normalizedRange.startsWith(operator)) {
      continue;
    }

    const parsedVersion = parseVersionParts(normalizedVersion);
    const parsedExpected = parseVersionParts(normalizedRange.slice(operator.length));
    if (!parsedVersion || !parsedExpected) {
      return normalizedVersion === normalizedRange.slice(operator.length).trim();
    }

    const comparison = compareVersionParts(parsedVersion, parsedExpected);
    if (operator === '>=') {
      return comparison >= 0;
    }
    if (operator === '<=') {
      return comparison <= 0;
    }
    if (operator === '>') {
      return comparison > 0;
    }
    return comparison < 0;
  }

  const rangePrefix = normalizedRange[0];
  const parsedVersion = parseVersionParts(normalizedVersion);
  const parsedExpected = parseVersionParts(rangePrefix === '^' || rangePrefix === '~'
    ? normalizedRange.slice(1)
    : normalizedRange);
  if (!parsedVersion || !parsedExpected) {
    return normalizedVersion === normalizedRange;
  }

  if (rangePrefix === '^') {
    return parsedVersion[0] === parsedExpected[0]
      && compareVersionParts(parsedVersion, parsedExpected) >= 0;
  }

  if (rangePrefix === '~') {
    return parsedVersion[0] === parsedExpected[0]
      && parsedVersion[1] === parsedExpected[1]
      && compareVersionParts(parsedVersion, parsedExpected) >= 0;
  }

  return compareVersionParts(parsedVersion, parsedExpected) === 0;
}

function createRegistryDiagnostic(code, message, overrides = {}) {
  return createDiagnostic(message, overrides.severity ?? 'error', {
    ...overrides,
    code,
    origin: {
      packageId: '@textforge/core',
      subsystem: 'contribution-registry',
      ...overrides.origin,
    },
  });
}

function collectDuplicateEntries(items, keySelector) {
  const grouped = new Map();
  for (const item of items) {
    const key = normalizeLocalName(keySelector(item));
    if (!key) {
      continue;
    }

    const owners = grouped.get(key) ?? [];
    owners.push(item);
    grouped.set(key, owners);
  }

  return [...grouped.entries()]
    .filter(([, owners]) => owners.length > 1)
    .sort((left, right) => compareByStringId(left[0], right[0]));
}

function createPackageConflictMap(entriesByKey) {
  const conflictsByPackageId = new Map();
  for (const [key, owners] of entriesByKey) {
    for (const owner of owners) {
      const existing = conflictsByPackageId.get(owner.packageId) ?? [];
      existing.push(key);
      conflictsByPackageId.set(owner.packageId, existing);
    }
  }
  return conflictsByPackageId;
}

function createDuplicateEntryDiagnostics(entriesByKey, label, idSelector = (item) => item.id) {
  return entriesByKey.map(([key, owners]) =>
    createRegistryDiagnostic(
      'registry.id-conflict',
      `Registered ${label} entries conflict on canonical ID "${key}".`,
      {
        origin: {
          ruleId: `${label}:${key}`,
        },
        related: owners.map((owner) => ({
          message: `${idSelector(owner)} from ${owner.packageId}`,
        })),
      },
    ));
}

function createDuplicateCapabilityDiagnostics(entriesByKey) {
  return entriesByKey.map(([key, owners]) =>
    createRegistryDiagnostic(
      'registry.capability-conflict',
      `Registered capabilities conflict on canonical ID "${key}".`,
      {
        origin: {
          ruleId: `capability:${key}`,
        },
        related: owners.map((owner) => ({
          message: `${owner.id} from ${owner.packageId}`,
        })),
      },
    ));
}

function resolveRegistryDependency(dependency, manifestsByPackageId, packageStatesById) {
  const dependencyManifest = manifestsByPackageId.get(dependency.packageId);
  if (!dependencyManifest) {
    return {
      ...dependency,
      resolvedVersion: undefined,
      status: 'missingDependency',
      reasonCode: 'missing-package',
    };
  }

  const dependencyPackageState = packageStatesById.get(dependency.packageId);
  if (dependencyPackageState?.status === 'disabled') {
    return {
      ...dependency,
      resolvedVersion: dependencyManifest.version,
      status: 'missingDependency',
      reasonCode: 'dependency-disabled',
    };
  }

  if (dependencyPackageState?.status === 'failedToInitialize') {
    return {
      ...dependency,
      resolvedVersion: dependencyManifest.version,
      status: 'missingDependency',
      reasonCode: 'dependency-failed',
    };
  }

  if (dependencyPackageState && dependencyPackageState.status !== 'available') {
    return {
      ...dependency,
      resolvedVersion: dependencyManifest.version,
      status: 'missingDependency',
      reasonCode: 'dependency-blocked',
    };
  }

  if (dependency.versionRange && !isVersionRangeSatisfied(dependencyManifest.version, dependency.versionRange)) {
    return {
      ...dependency,
      resolvedVersion: dependencyManifest.version,
      status: 'incompatibleVersion',
      reasonCode: 'version-mismatch',
    };
  }

  return {
    ...dependency,
    resolvedVersion: dependencyManifest.version,
    status: 'available',
    reasonCode: undefined,
  };
}

function resolveCapabilityState(capability, context = {}, packageStateById = new Map()) {
  const packageState = packageStateById.get(capability.packageId);
  if (packageState?.status === 'disabled') {
    return 'disabled';
  }

  if (packageState && packageState.status !== 'available') {
    return 'failed';
  }

  const disabledCapabilityIds = normalizeIdSet(context.disabledCapabilityIds);
  const failedCapabilityIds = normalizeIdSet(context.failedCapabilityIds);
  const activeCapabilityIds = new Set([
    ...(context.activeCapabilityIds ?? []),
    ...(context.defaultActiveCapabilityIds ?? []),
    ...(context.useLegacyDefaultActive === false
      ? []
      : capability.defaultActive
        ? [capability.id]
        : []),
  ]);

  if (failedCapabilityIds.has(capability.id)) {
    return 'failed';
  }

  if (disabledCapabilityIds.has(capability.id)) {
    return 'disabled';
  }

  if (activeCapabilityIds.has(capability.id)) {
    return 'active';
  }

  return 'available';
}

function resolveContributionState(contribution, capabilityStateById, context = {}, packageStateById = new Map()) {
  const explicitPackageStatus = context.packageStatuses?.[contribution.packageId] ?? 'available';
  if (explicitPackageStatus === 'failed') {
    return 'failed';
  }

  if (explicitPackageStatus === 'disabled') {
    return 'disabled';
  }

  const packageState = packageStateById.get(contribution.packageId);
  if (packageState?.status === 'disabled') {
    return 'disabled';
  }

  if (packageState && packageState.status !== 'available') {
    return 'failed';
  }

  const capabilityIds = normalizeContributionCapabilities(contribution);
  if (capabilityIds.length === 0) {
    return contribution.defaultActive === false ? 'available' : 'active';
  }

  if (capabilityIds.some((capabilityId) => capabilityStateById.get(capabilityId)?.status === 'failed')) {
    return 'failed';
  }

  if (capabilityIds.some((capabilityId) => capabilityStateById.get(capabilityId)?.status === 'disabled')) {
    return 'disabled';
  }

  if (capabilityIds.some((capabilityId) => capabilityStateById.get(capabilityId)?.status === 'active')) {
    return 'active';
  }

  return 'available';
}

function createRegistryConflictDiagnostic(name, contributions, kind) {
  return createRegistryDiagnostic(
    'registry.active-conflict',
    `Active ${kind} contributions conflict on short name "${name}".`,
    {
      origin: {
        ruleId: `${kind}:${name}`,
      },
      related: contributions.map((contribution) => ({
        message: `${contribution.id} from ${contribution.packageId}`,
      })),
    },
  );
}

function createResolverDiagnostic(code, message, overrides = {}) {
  return createDiagnostic(message, overrides.severity ?? 'error', {
    ...overrides,
    code,
    origin: {
      packageId: '@textforge/core',
      subsystem: 'document-capability-resolver',
      ...overrides.origin,
    },
  });
}

function normalizeCapabilityRequirement(requirement) {
  if (typeof requirement === 'string') {
    const [name, versionRange] = String(requirement).trim().split(/\s+/, 2);
    return {
      name: normalizeLocalName(name),
      versionRange: normalizeLocalName(versionRange),
      source: 'document',
    };
  }

  return {
    name: normalizeLocalName(requirement?.name ?? requirement?.localName ?? requirement?.id),
    capabilityId: normalizeLocalName(requirement?.capabilityId),
    versionRange: normalizeLocalName(requirement?.versionRange ?? requirement?.version ?? requirement?.range),
    source: requirement?.source ?? 'document',
  };
}

function normalizeCapabilityRequirementList(requirements = []) {
  return requirements
    .map((requirement) => normalizeCapabilityRequirement(requirement))
    .filter((requirement) => requirement.name || requirement.capabilityId);
}

function normalizeCapabilitySelectors(values = []) {
  return values
    .map((value) => normalizeCapabilityRequirement(value))
    .filter((value) => value.name || value.capabilityId);
}

function listCapabilityLookupNames(capability) {
  return [
    capability.id,
    capability.localName,
    ...(capability.aliases ?? []),
  ]
    .map((value) => normalizeLocalName(value))
    .filter(Boolean);
}

function matchCapabilityRequirement(requirement, capabilities) {
  if (requirement.capabilityId) {
    const byId = capabilities.filter((capability) => capability.id === requirement.capabilityId);
    if (byId.length > 0) {
      return byId;
    }
  }

  if (!requirement.name) {
    return [];
  }

  return capabilities.filter((capability) =>
    listCapabilityLookupNames(capability).includes(requirement.name));
}

function resolveCapabilitySelectorIds(selectors, capabilities, diagnostics, options = {}) {
  const resolvedIds = [];
  for (const selector of normalizeCapabilitySelectors(selectors)) {
    const matches = matchCapabilityRequirement(selector, capabilities);
    if (matches.length === 1) {
      resolvedIds.push(matches[0].id);
      continue;
    }

    if (options.silent === true) {
      continue;
    }

    if (matches.length === 0) {
      diagnostics.push(createResolverDiagnostic(
        'resolver.capability-selector.missing',
        `No bundled capability matches "${selector.capabilityId ?? selector.name}".`,
        {
          severity: 'warning',
          origin: {
            ruleId: `selector:${selector.capabilityId ?? selector.name}`,
          },
        },
      ));
      continue;
    }

    diagnostics.push(createResolverDiagnostic(
      'resolver.capability-selector.ambiguous',
      `Multiple bundled capabilities match "${selector.capabilityId ?? selector.name}".`,
      {
        origin: {
          ruleId: `selector:${selector.capabilityId ?? selector.name}`,
        },
        related: matches.map((capability) => ({
          message: `${capability.id} from ${capability.packageId}`,
        })),
      },
    ));
  }

  return [...new Set(resolvedIds)].sort(compareByStringId);
}

function resolveExplicitRequirements(requirements, capabilities, diagnostics) {
  const activations = [];
  const requirementStatuses = [];
  for (const requirement of normalizeCapabilityRequirementList(requirements)) {
    const identifier = requirement.capabilityId ?? requirement.name;
    const matches = matchCapabilityRequirement(requirement, capabilities);
    if (matches.length === 0) {
      diagnostics.push(createResolverDiagnostic(
        'resolver.requirement.missing',
        `Required capability "${identifier}" is not available in the bundled registry.`,
        {
          severity: 'warning',
          origin: {
            capabilityId: identifier,
            directive: 'require',
            ruleId: `require:${identifier}`,
          },
        },
      ));
      requirementStatuses.push({
        ...requirement,
        matchedCapabilityId: undefined,
        status: 'missing',
      });
      continue;
    }

    if (matches.length > 1) {
      diagnostics.push(createResolverDiagnostic(
        'resolver.requirement.ambiguous',
        `Required capability "${identifier}" is ambiguous across the bundled registry.`,
        {
          origin: {
            capabilityId: identifier,
            directive: 'require',
            ruleId: `require:${identifier}`,
          },
          related: matches.map((capability) => ({
            message: `${capability.id} from ${capability.packageId}`,
          })),
        },
      ));
      requirementStatuses.push({
        ...requirement,
        matchedCapabilityId: undefined,
        status: 'ambiguous',
      });
      continue;
    }

    const match = matches[0];
    if (match.status !== 'available' && match.status !== 'active') {
      diagnostics.push(createResolverDiagnostic(
        'resolver.requirement.unavailable',
        `Required capability "${identifier}" is registered as ${match.status}.`,
        {
          severity: 'warning',
          origin: {
            capabilityId: match.id,
            directive: 'require',
            ruleId: `require:${identifier}`,
          },
        },
      ));
      requirementStatuses.push({
        ...requirement,
        matchedCapabilityId: match.id,
        status: match.status,
      });
      continue;
    }

    activations.push({
      capabilityId: match.id,
      source: 'explicit',
      matchedBy: requirement.capabilityId ? 'capabilityId' : 'name',
    });
    requirementStatuses.push({
      ...requirement,
      matchedCapabilityId: match.id,
      status: 'active',
    });
  }

  return {
    activations: activations.sort((left, right) => compareByStringId(left.capabilityId, right.capabilityId)),
    requirementStatuses,
  };
}

function createActivationEntries(capabilityIds, source) {
  return capabilityIds.map((capabilityId) => ({
    capabilityId,
    source,
    matchedBy: source,
  }));
}

function buildActivationPlan(options, capabilities, diagnostics) {
  const explicit = resolveExplicitRequirements(options.explicitRequirements, capabilities, diagnostics);
  const documentDefaults = capabilities
    .filter((capability) =>
      capability.defaultActive === true
      && capability.status === 'available'
      && matchesResourcePredicate(capability.documentPredicate ?? {}, options.document ?? {}))
    .map((capability) => capability.id)
    .sort(compareByStringId);
  const workspaceDefaults = resolveCapabilitySelectorIds(
    options.workspaceDefaultCapabilityIds,
    capabilities,
    diagnostics,
  );
  const appDefaults = resolveCapabilitySelectorIds(
    options.appDefaultCapabilityIds,
    capabilities,
    diagnostics,
  );
  const coreDefaults = capabilities
    .filter((capability) =>
      capability.defaultActive === true
      && capability.status === 'available'
      && !matchesResourcePredicate(capability.documentPredicate ?? {}, options.document ?? {}))
    .map((capability) => capability.id)
    .sort(compareByStringId);

  const activationOrder = [
    ...explicit.activations,
    ...createActivationEntries(documentDefaults, 'document'),
    ...createActivationEntries(workspaceDefaults, 'workspace'),
    ...createActivationEntries(appDefaults, 'app'),
    ...createActivationEntries(coreDefaults, 'core'),
  ];
  const activeCapabilityIds = [];
  const seenCapabilityIds = new Set();
  for (const activation of activationOrder) {
    if (seenCapabilityIds.has(activation.capabilityId)) {
      continue;
    }
    seenCapabilityIds.add(activation.capabilityId);
    activeCapabilityIds.push(activation.capabilityId);
  }

  return {
    activationOrder,
    activeCapabilityIds,
    requirements: explicit.requirementStatuses,
  };
}

function collectActiveShortNameConflicts(entries, kind, diagnostics) {
  const ownersByLocalName = new Map();
  for (const entry of entries) {
    const localName = normalizeLocalName(entry.localName);
    if (!localName) {
      continue;
    }

    const existing = ownersByLocalName.get(localName) ?? [];
    existing.push(entry);
    ownersByLocalName.set(localName, existing);
  }

  return [...ownersByLocalName.entries()]
    .filter(([, owners]) => owners.length > 1)
    .sort((left, right) => compareByStringId(left[0], right[0]))
    .map(([localName, owners]) => {
      diagnostics.push(createResolverDiagnostic(
        'resolver.active-short-name-conflict',
        `Active ${kind} contributions conflict on short name "${localName}".`,
        {
          origin: {
            ruleId: `${kind}:${localName}`,
          },
          related: owners.map((owner) => ({
            message: `${owner.id} from ${owner.packageId}`,
          })),
        },
      ));
      return {
        localName,
        kind,
        contributionIds: owners.map((owner) => owner.id).sort(compareByStringId),
      };
    });
}

export function resolveDocumentContributionContext(input = {}) {
  const registry = input.registry;
  if (!registry?.resolve || typeof registry.resolve !== 'function') {
    throw new Error('resolveDocumentContributionContext requires a contribution registry instance.');
  }

  const baseResolution = registry.resolve({
    packageStatuses: input.packageStatuses,
    disabledCapabilityIds: input.disabledCapabilityIds,
    failedCapabilityIds: input.failedCapabilityIds,
    activeCapabilityIds: [],
    defaultActiveCapabilityIds: [],
    useLegacyDefaultActive: false,
  });
  const diagnostics = [...baseResolution.diagnostics];
  const activationPlan = buildActivationPlan({
    document: input.document,
    explicitRequirements: input.explicitRequirements,
    workspaceDefaultCapabilityIds: input.workspaceDefaultCapabilityIds,
    appDefaultCapabilityIds: input.appDefaultCapabilityIds,
  }, baseResolution.capabilities, diagnostics);
  const resolved = registry.resolve({
    packageStatuses: input.packageStatuses,
    disabledCapabilityIds: input.disabledCapabilityIds,
    failedCapabilityIds: input.failedCapabilityIds,
    activeCapabilityIds: activationPlan.activeCapabilityIds,
    defaultActiveCapabilityIds: [],
    useLegacyDefaultActive: false,
  });
  const activeCapabilities = resolved.capabilities.filter((capability) => capability.status === 'active');
  const inactiveCapabilities = resolved.capabilities.filter((capability) => capability.status !== 'active');
  const activeCommands = resolved.commands.filter((command) => command.status === 'active');
  const activeSurfaces = resolved.surfaces.filter((surface) => surface.status === 'active');
  const activePipelines = resolved.pipelines.filter((pipeline) => pipeline.status === 'active');
  const activeMarkdownFenceHandlers = resolved.markdownFenceHandlers.filter((handler) => handler.status === 'active');
  const shortNameConflicts = [
    ...collectActiveShortNameConflicts(activeSurfaces, 'surface', diagnostics),
    ...collectActiveShortNameConflicts(activePipelines, 'pipeline', diagnostics),
    ...collectActiveShortNameConflicts(activeMarkdownFenceHandlers, 'markdown-fence-handler', diagnostics),
  ];

  return {
    document: input.document ? createResourceRef(input.document.resourceId ?? input.document.id ?? '', input.document) : undefined,
    packages: resolved.packages,
    capabilities: resolved.capabilities,
    activeCapabilities,
    inactiveCapabilities,
    commands: resolved.commands,
    activeCommands,
    surfaces: resolved.surfaces,
    activeSurfaces,
    pipelines: resolved.pipelines,
    activePipelines,
    markdownFenceHandlers: resolved.markdownFenceHandlers,
    activeMarkdownFenceHandlers,
    diagnostics,
    requirements: activationPlan.requirements,
    activationOrder: activationPlan.activationOrder,
    activeCapabilityIds: activationPlan.activeCapabilityIds,
    shortNameConflicts,
  };
}

function sortActivationSources(sources = []) {
  const activationSourceOrder = new Map([
    ['explicit', 0],
    ['document', 1],
    ['workspace', 2],
    ['app', 3],
    ['core', 4],
  ]);
  return [...new Set(sources)].sort((left, right) =>
    (activationSourceOrder.get(left) ?? Number.POSITIVE_INFINITY)
      - (activationSourceOrder.get(right) ?? Number.POSITIVE_INFINITY));
}

function createInspectorContributionEntry(contribution, kind) {
  return {
    id: contribution.id,
    packageId: contribution.packageId,
    kind,
    label: contribution.label,
    localName: contribution.localName,
    status: contribution.status,
    capabilityIds: normalizeContributionCapabilities(contribution).sort(compareByStringId),
    ...(kind === 'markdownFenceHandlers'
      ? {
        fenceNames: [...new Set((contribution.fenceNames ?? []).map((name) => String(name).trim()).filter(Boolean))]
          .sort(compareByStringId),
      }
      : {}),
  };
}

function collectInspectorPackageDiagnostics(packageId, diagnostics = []) {
  return diagnostics
    .filter((diagnostic) =>
      diagnostic.origin?.packageId === packageId
      || diagnostic.related?.some((related) => related.message?.includes(packageId)))
    .map((diagnostic) => ({
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
    }))
    .sort((left, right) => {
      const severityComparison = compareByStringId(left.severity, right.severity);
      if (severityComparison !== 0) {
        return severityComparison;
      }
      const codeComparison = compareByStringId(left.code, right.code);
      if (codeComparison !== 0) {
        return codeComparison;
      }
      return compareByStringId(left.message, right.message);
    });
}

export function createContributionInspectorModel(input = {}) {
  const resolution = input.resolution;
  if (!resolution?.packages || !resolution?.capabilities) {
    throw new Error('createContributionInspectorModel requires a contribution registry resolution.');
  }

  const documentContext = input.documentContext;
  const packageEntries = documentContext?.packages ?? resolution.packages;
  const capabilities = documentContext?.capabilities ?? resolution.capabilities;
  const commands = documentContext?.commands ?? resolution.commands;
  const surfaces = documentContext?.surfaces ?? resolution.surfaces;
  const pipelines = documentContext?.pipelines ?? resolution.pipelines;
  const markdownFenceHandlers = documentContext?.markdownFenceHandlers ?? resolution.markdownFenceHandlers;
  const diagnostics = documentContext?.diagnostics ?? resolution.diagnostics;
  const activationSourcesByCapabilityId = new Map();
  const requirementNamesByCapabilityId = new Map();

  for (const activation of documentContext?.activationOrder ?? []) {
    const currentSources = activationSourcesByCapabilityId.get(activation.capabilityId) ?? [];
    currentSources.push(activation.source);
    activationSourcesByCapabilityId.set(
      activation.capabilityId,
      sortActivationSources(currentSources),
    );
  }

  for (const requirement of documentContext?.requirements ?? []) {
    if (!requirement.matchedCapabilityId) {
      continue;
    }

    const currentNames = requirementNamesByCapabilityId.get(requirement.matchedCapabilityId) ?? [];
    const requirementLabel = requirement.name ?? requirement.capabilityId;
    if (requirementLabel) {
      currentNames.push(requirementLabel);
      requirementNamesByCapabilityId.set(
        requirement.matchedCapabilityId,
        [...new Set(currentNames)].sort(compareByStringId),
      );
    }
  }

  const contributionsByKind = {
    commands: commands.map((command) => createInspectorContributionEntry(command, 'commands')),
    surfaces: surfaces.map((surface) => createInspectorContributionEntry(surface, 'surfaces')),
    pipelines: pipelines.map((pipeline) => createInspectorContributionEntry(pipeline, 'pipelines')),
    markdownFenceHandlers: markdownFenceHandlers.map((handler) => createInspectorContributionEntry(handler, 'markdownFenceHandlers')),
  };

  const packages = packageEntries.map((entry) => {
    const packageCapabilities = capabilities
      .filter((capability) => capability.packageId === entry.packageId)
      .map((capability) => ({
        id: capability.id,
        packageId: capability.packageId,
        localName: capability.localName,
        aliases: [...(capability.aliases ?? [])].sort(compareByStringId),
        status: capability.status,
        activationSources: activationSourcesByCapabilityId.get(capability.id) ?? [],
        matchedRequirementNames: requirementNamesByCapabilityId.get(capability.id) ?? [],
      }))
      .sort(compareContributionEntries);
    const packageContributions = {
      commands: contributionsByKind.commands
        .filter((contribution) => contribution.packageId === entry.packageId)
        .sort(compareContributionEntries),
      surfaces: contributionsByKind.surfaces
        .filter((contribution) => contribution.packageId === entry.packageId)
        .sort(compareContributionEntries),
      pipelines: contributionsByKind.pipelines
        .filter((contribution) => contribution.packageId === entry.packageId)
        .sort(compareContributionEntries),
      markdownFenceHandlers: contributionsByKind.markdownFenceHandlers
        .filter((contribution) => contribution.packageId === entry.packageId)
        .sort(compareContributionEntries),
    };

    return {
      packageId: entry.packageId,
      name: entry.name,
      version: entry.version,
      description: entry.description,
      status: entry.status,
      statusReason: entry.statusReason,
      dependencies: entry.dependencies,
      conflicts: entry.conflicts,
      capabilities: packageCapabilities,
      contributions: packageContributions,
      activeCapabilityCount: packageCapabilities.filter((capability) => capability.status === 'active').length,
      activeContributionCounts: {
        commands: packageContributions.commands.filter((contribution) => contribution.status === 'active').length,
        surfaces: packageContributions.surfaces.filter((contribution) => contribution.status === 'active').length,
        pipelines: packageContributions.pipelines.filter((contribution) => contribution.status === 'active').length,
        markdownFenceHandlers: packageContributions.markdownFenceHandlers.filter((contribution) => contribution.status === 'active').length,
      },
      diagnostics: collectInspectorPackageDiagnostics(entry.packageId, diagnostics),
    };
  });

  return {
    summary: {
      packageCount: packages.length,
      availablePackageCount: packages.filter((entry) => entry.status === 'available').length,
      blockedPackageCount: packages.filter((entry) => entry.status !== 'available').length,
      capabilityCount: capabilities.length,
      activeCapabilityCount: capabilities.filter((capability) => capability.status === 'active').length,
      activeSurfaceCount: surfaces.filter((surface) => surface.status === 'active').length,
      activePipelineCount: pipelines.filter((pipeline) => pipeline.status === 'active').length,
      activeMarkdownFenceHandlerCount: markdownFenceHandlers.filter((handler) => handler.status === 'active').length,
      diagnosticCount: diagnostics.length,
    },
    document: documentContext
      ? {
        resource: documentContext.document,
        requirements: documentContext.requirements,
        activationOrder: documentContext.activationOrder,
        shortNameConflicts: documentContext.shortNameConflicts,
        diagnostics: documentContext.diagnostics,
      }
      : undefined,
    packages,
    diagnostics,
  };
}

export function createContributionRegistry(initialManifests = []) {
  const manifests = new Map();

  const registry = {
    registerManifest(manifest) {
      const normalizedManifest = createContributionManifest(
        manifest.packageId ?? manifest.id ?? '@textforge/unknown',
        manifest,
      );
      manifests.set(normalizedManifest.packageId, normalizedManifest);
      return registry;
    },
    listManifests() {
      return [...manifests.values()].sort(compareManifestEntries);
    },
    listCapabilities() {
      return collectManifestCapabilities(registry.listManifests()).map((capability) => ({
        ...capability,
      }));
    },
    listCommands() {
      return collectManifestContributions(registry.listManifests(), 'commands');
    },
    listSurfaces() {
      return collectManifestContributions(registry.listManifests(), 'surfaces');
    },
    listPipelines() {
      return collectManifestContributions(registry.listManifests(), 'pipelines');
    },
    listMarkdownFenceHandlers() {
      return collectManifestContributions(registry.listManifests(), 'markdownFenceHandlers');
    },
    resolve(context = {}) {
      const manifestsList = registry.listManifests();
      const manifestsByPackageId = new Map(manifestsList.map((manifest) => [manifest.packageId, manifest]));
      const externalPackageStatuses = context.packageStatuses ?? {};
      const capabilitiesWithPackage = collectManifestCapabilities(manifestsList);
      const duplicateCapabilities = collectDuplicateEntries(capabilitiesWithPackage, (capability) => capability.id);
      const duplicateCommands = collectDuplicateEntries(registry.listCommands(), (command) => command.id);
      const duplicateSurfaces = collectDuplicateEntries(registry.listSurfaces(), (surface) => surface.id);
      const duplicatePipelines = collectDuplicateEntries(registry.listPipelines(), (pipeline) => pipeline.id);
      const duplicateMarkdownFenceHandlers = collectDuplicateEntries(registry.listMarkdownFenceHandlers(), (handler) => handler.id);
      const packageConflictKeysById = new Map();
      for (const conflictMap of [
        createPackageConflictMap(duplicateCapabilities),
        createPackageConflictMap(duplicateCommands),
        createPackageConflictMap(duplicateSurfaces),
        createPackageConflictMap(duplicatePipelines),
        createPackageConflictMap(duplicateMarkdownFenceHandlers),
      ]) {
        for (const [packageId, keys] of conflictMap) {
          const existing = packageConflictKeysById.get(packageId) ?? [];
          existing.push(...keys);
          packageConflictKeysById.set(packageId, existing);
        }
      }

      const packageStateById = new Map();
      for (const manifest of manifestsList) {
        let status = 'available';
        let statusReason;
        const explicitStatus = externalPackageStatuses[manifest.packageId];
        if (explicitStatus === 'disabled') {
          status = 'disabled';
          statusReason = 'package-disabled';
        } else if (explicitStatus === 'failed') {
          status = 'failedToInitialize';
          statusReason = 'package-failed';
        } else if ((packageConflictKeysById.get(manifest.packageId) ?? []).length > 0) {
          status = 'conflict';
          statusReason = 'duplicate-canonical-id';
        }

        packageStateById.set(manifest.packageId, {
          packageId: manifest.packageId,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          status,
          statusReason,
          dependencies: [],
          capabilityIds: (manifest.capabilities ?? []).map((capability) => capability.id).sort(compareByStringId),
          contributionCounts: {
            commands: manifest.commands?.length ?? 0,
            surfaces: manifest.surfaces?.length ?? 0,
            pipelines: manifest.pipelines?.length ?? 0,
            markdownFenceHandlers: manifest.markdownFenceHandlers?.length ?? 0,
          },
          contributionIds: {
            commands: (manifest.commands ?? []).map((command) => command.id).sort(compareByStringId),
            surfaces: (manifest.surfaces ?? []).map((surface) => surface.id).sort(compareByStringId),
            pipelines: (manifest.pipelines ?? []).map((pipeline) => pipeline.id).sort(compareByStringId),
            markdownFenceHandlers: (manifest.markdownFenceHandlers ?? []).map((handler) => handler.id).sort(compareByStringId),
          },
          conflicts: [...new Set((packageConflictKeysById.get(manifest.packageId) ?? []).sort(compareByStringId))],
        });
      }

      for (let pass = 0; pass < manifestsList.length; pass += 1) {
        let changed = false;
        for (const manifest of manifestsList) {
          const packageState = packageStateById.get(manifest.packageId);
          const dependencies = (manifest.dependencies ?? []).map((dependency) =>
            resolveRegistryDependency(dependency, manifestsByPackageId, packageStateById));
          packageState.dependencies = dependencies;
          if (packageState.status === 'available') {
            const blockingDependency = dependencies.find((dependency) =>
              dependency.optional !== true && dependency.status !== 'available');
            if (blockingDependency) {
              packageState.status = blockingDependency.status;
              packageState.statusReason = blockingDependency.reasonCode;
              changed = true;
            }
          }
        }
        if (!changed) {
          break;
        }
      }

      const packages = manifestsList.map((manifest) => packageStateById.get(manifest.packageId));
      const capabilities = capabilitiesWithPackage.map((capability) => ({
        ...capability,
        status: resolveCapabilityState(capability, context, packageStateById),
      }));
      const capabilityStateById = new Map(capabilities.map((capability) => [capability.id, capability]));
      const resolvedCommands = registry.listCommands().map((command) => ({
        ...command,
        status: resolveContributionState(command, capabilityStateById, context, packageStateById),
      }));
      const resolvedSurfaces = registry.listSurfaces().map((surface) => ({
        ...surface,
        status: resolveContributionState(surface, capabilityStateById, context, packageStateById),
      }));
      const resolvedPipelines = registry.listPipelines().map((pipeline) => ({
        ...pipeline,
        status: resolveContributionState(pipeline, capabilityStateById, context, packageStateById),
      }));
      const resolvedMarkdownFenceHandlers = registry.listMarkdownFenceHandlers().map((handler) => ({
        ...handler,
        status: resolveContributionState(handler, capabilityStateById, context, packageStateById),
      }));

      const diagnostics = [
        ...createDuplicateCapabilityDiagnostics(duplicateCapabilities),
        ...createDuplicateEntryDiagnostics(duplicateCommands, 'command'),
        ...createDuplicateEntryDiagnostics(duplicateSurfaces, 'surface'),
        ...createDuplicateEntryDiagnostics(duplicatePipelines, 'pipeline'),
        ...createDuplicateEntryDiagnostics(duplicateMarkdownFenceHandlers, 'markdown-fence-handler'),
      ];
      for (const packageState of packages) {
        for (const dependency of packageState.dependencies) {
          if (dependency.status === 'available' || dependency.optional === true) {
            continue;
          }

          diagnostics.push(createRegistryDiagnostic(
            dependency.status === 'incompatibleVersion'
              ? 'registry.package.incompatible-dependency'
              : 'registry.package.missing-dependency',
            dependency.status === 'incompatibleVersion'
              ? `Package ${packageState.packageId} requires ${dependency.packageId} ${dependency.versionRange}, but ${dependency.resolvedVersion ?? 'an incompatible version'} is registered.`
              : `Package ${packageState.packageId} requires ${dependency.packageId}, but it is not available to the bundled registry.`,
            {
              origin: {
                packageId: packageState.packageId,
                ruleId: `dependency:${dependency.packageId}`,
              },
            },
          ));
        }
      }

      const activeFenceHandlers = resolvedMarkdownFenceHandlers.filter((handler) => handler.status === 'active');
      const fenceNameOwners = new Map();
      for (const handler of activeFenceHandlers) {
        for (const fenceName of handler.fenceNames ?? []) {
          const normalizedFenceName = String(fenceName).trim().toLowerCase();
          if (!normalizedFenceName) {
            continue;
          }

          const currentOwners = fenceNameOwners.get(normalizedFenceName) ?? [];
          currentOwners.push(handler);
          fenceNameOwners.set(normalizedFenceName, currentOwners);
        }
      }

      for (const [fenceName, owners] of fenceNameOwners.entries()) {
        if (owners.length > 1) {
          diagnostics.push(createRegistryConflictDiagnostic(fenceName, owners, 'markdown fence handler'));
        }
      }

      const conflictingFenceNames = new Set(
        [...fenceNameOwners.entries()]
          .filter(([, owners]) => owners.length > 1)
          .map(([fenceName]) => fenceName),
      );
      const markdownFenceHandlers = activeFenceHandlers.filter((handler) =>
        !(handler.fenceNames ?? []).some((fenceName) => conflictingFenceNames.has(String(fenceName).trim().toLowerCase())));

      return {
        manifests: registry.listManifests(),
        packages,
        capabilities,
        commands: resolvedCommands,
        surfaces: resolvedSurfaces,
        pipelines: resolvedPipelines,
        markdownFenceHandlers,
        diagnostics,
      };
    },
    createMarkdownFenceHandlerMap(context = {}) {
      const resolved = registry.resolve(context);
      const handlers = {};
      const knownFenceNames = new Set();
      for (const contribution of registry.listMarkdownFenceHandlers()) {
        for (const fenceName of contribution.fenceNames ?? []) {
          knownFenceNames.add(String(fenceName).trim().toLowerCase());
        }
      }
      for (const contribution of resolved.markdownFenceHandlers) {
        for (const fenceName of contribution.fenceNames ?? []) {
          handlers[String(fenceName).trim().toLowerCase()] = contribution;
        }
      }
      return {
        diagnostics: resolved.diagnostics,
        knownFenceNames,
        handlers,
      };
    },
    resolveDocumentContext(options = {}) {
      return resolveDocumentContributionContext({
        registry,
        ...options,
      });
    },
  };

  for (const manifest of initialManifests) {
    registry.registerManifest(manifest);
  }

  return registry;
}

export const defaultContributionManifest = createContributionManifest('@textforge/core');

export const contributions = createContributionManifest('@textforge/core');
