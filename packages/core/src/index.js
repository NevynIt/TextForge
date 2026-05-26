export const severityLevels = ['observation', 'information', 'warning', 'error'];

export const legacySeverityAliases = {
  hint: 'observation',
  info: 'information',
};

export const resourceKinds = ['resource', 'generated', 'virtual'];
export const resourceRepresentations = ['text', 'bytes'];
export const capabilityStates = ['available', 'active', 'disabled', 'missing', 'failed'];
export const contributionRegistryPackageStatuses = [
  'available',
  'disabled',
  'missingDependency',
  'incompatibleVersion',
  'conflict',
  'failedToInitialize',
];

export const resourceBadgePlacements = ['center', 'top', 'right', 'bottom', 'left'];

export const languageDefinitions = [
  { id: 'plaintext', label: 'Plain text', mimeTypes: ['text/plain'], extensions: ['txt', 'text'], sourceEditor: true },
  { id: 'markdown', label: 'Markdown', mimeTypes: ['text/markdown', 'text/x-markdown'], extensions: ['md', 'markdown'], sourceEditor: true },
  { id: 'itm', label: 'ITM', mimeTypes: ['text/x-itm'], extensions: ['itm'], sourceEditor: true },
  { id: 'lua', label: 'Lua', mimeTypes: ['text/x-lua', 'application/x-lua'], extensions: ['lua'], sourceEditor: true },
  { id: 'json', label: 'JSON', mimeTypes: ['application/json', 'text/json'], extensions: ['json'], sourceEditor: true },
  { id: 'xml', label: 'XML', mimeTypes: ['application/xml', 'text/xml'], extensions: ['xml'], sourceEditor: true },
  { id: 'bpmn-xml', label: 'BPMN XML', mimeTypes: ['application/bpmn+xml'], extensions: ['bpmn'], sourceEditor: true },
  { id: 'archimate-exchange-xml', label: 'ArchiMate exchange XML', mimeTypes: ['application/vnd.opengroup.archimate+xml'], extensions: ['archimate', 'xml'], sourceEditor: true },
  { id: 'csv', label: 'CSV', mimeTypes: ['text/csv'], extensions: ['csv'], sourceEditor: true },
  { id: 'tsv', label: 'TSV', mimeTypes: ['text/tab-separated-values'], extensions: ['tsv'], sourceEditor: true },
  { id: 'mermaid', label: 'Mermaid', mimeTypes: ['text/x-mermaid'], extensions: ['mmd', 'mermaid'], sourceEditor: true },
  { id: 'dot', label: 'DOT', mimeTypes: ['text/vnd.graphviz'], extensions: ['dot', 'gv'], sourceEditor: true },
  { id: 'svg', label: 'SVG', mimeTypes: ['image/svg+xml'], extensions: ['svg'], sourceEditor: true },
  { id: 'yaml', label: 'YAML', mimeTypes: ['application/yaml', 'text/yaml', 'text/x-yaml'], extensions: ['yaml', 'yml'], sourceEditor: true },
];

export const editorCapabilityIds = {
  source: 'editor.source',
  sourceRange: 'editor.source-range',
  diagnostics: 'editor.diagnostics',
  languageMode: 'editor.language-mode',
  sourceFallback: 'editor.source-fallback',
};

export const contributionKinds = {
  diagnostics: 'diagnostics',
  commands: 'commands',
  surfaces: 'surfaces',
  pipelines: 'pipelines',
  markdownFenceHandlers: 'markdown-fence-handlers',
};

function normalizeSeverity(severity = 'information') {
  const normalized = legacySeverityAliases[severity] ?? severity;
  return severityLevels.includes(normalized) ? normalized : 'information';
}

function extensionFromPath(path) {
  const fileName = path?.split(/[\\/]/).pop() ?? '';
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : '';
}

function normalizeContributionCapabilities(contribution) {
  return contribution.capabilities ?? contribution.capabilityIds ?? [];
}

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

function normalizeManifestDependency(dependency) {
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

function normalizeContributionIdentity(packageId, contribution) {
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

function normalizeIdSet(values = []) {
  return new Set(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  );
}

function normalizePackageId(packageId, fallback = '@textforge/unknown') {
  const normalized = String(packageId ?? '').trim();
  return normalized || fallback;
}

function normalizeLocalName(localName) {
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

function compareByStringId(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''));
}

function compareManifestEntries(left, right) {
  return compareByStringId(left.packageId, right.packageId);
}

function compareContributionEntries(left, right) {
  const packageComparison = compareByStringId(left.packageId, right.packageId);
  if (packageComparison !== 0) {
    return packageComparison;
  }
  return compareByStringId(left.id, right.id);
}

function sortByCanonicalId(items = []) {
  return [...items].sort(compareContributionEntries);
}

function sortDependenciesByPackageId(items = []) {
  return [...items].sort((left, right) => compareByStringId(left.packageId, right.packageId));
}

function cloneCommandArrays(command) {
  return {
    keywords: command.keywords ?? [],
    capabilities: command.capabilities ?? [],
    when: command.when
      ? {
        ...command.when,
        runtimeStatuses: command.when.runtimeStatuses ?? [],
        selectionKinds: command.when.selectionKinds ?? [],
        selectionRepresentations: command.when.selectionRepresentations ?? [],
        activeSurfacePlacements: command.when.activeSurfacePlacements ?? [],
        activeSurfaceResourceKinds: command.when.activeSurfaceResourceKinds ?? [],
        activeSurfaceResourceRepresentations: command.when.activeSurfaceResourceRepresentations ?? [],
        activeSurfaceContributionIds: command.when.activeSurfaceContributionIds ?? [],
        availableSurfaceIds: command.when.availableSurfaceIds ?? [],
      }
      : undefined,
  };
}

function normalizeCommand(command, packageId) {
  const normalized = {
    ...command,
    packageId,
  };
  const arrays = cloneCommandArrays(normalized);
  normalized.keywords = arrays.keywords;
  normalized.capabilities = arrays.capabilities;
  if (arrays.when) {
    normalized.when = arrays.when;
  }
  return normalized;
}

function compareCommands(left, right) {
  const leftToolbarOrder = left.toolbar?.order ?? Number.POSITIVE_INFINITY;
  const rightToolbarOrder = right.toolbar?.order ?? Number.POSITIVE_INFINITY;
  if (leftToolbarOrder !== rightToolbarOrder) {
    return leftToolbarOrder - rightToolbarOrder;
  }

  const leftMenuOrder = left.menu?.order ?? Number.POSITIVE_INFINITY;
  const rightMenuOrder = right.menu?.order ?? Number.POSITIVE_INFINITY;
  if (leftMenuOrder !== rightMenuOrder) {
    return leftMenuOrder - rightMenuOrder;
  }

  return left.label.localeCompare(right.label);
}

function normalizeManifest(manifest) {
  return createCommandManifest(
    manifest.packageId ?? manifest.id ?? '@textforge/unknown',
    manifest.commands ?? [],
  );
}

function groupCommandsByMenu(commands) {
  const groups = new Map();

  for (const command of commands) {
    if (!command.menu) {
      continue;
    }

    const current = groups.get(command.menu.id) ?? {
      id: command.menu.id,
      label: command.menu.label,
      groupOrder: command.menu.groupOrder ?? Number.POSITIVE_INFINITY,
      commands: [],
    };
    current.commands.push(command);
    groups.set(command.menu.id, current);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      commands: [...group.commands].sort(compareCommands),
    }))
    .sort((left, right) => {
      if (left.groupOrder !== right.groupOrder) {
        return left.groupOrder - right.groupOrder;
      }
      return left.label.localeCompare(right.label);
    });
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

export function createCapability(id, overrides = {}) {
  return normalizeCapability({
    id,
    ...overrides,
  });
}

export function createCommand(id, label, overrides = {}) {
  return {
    id,
    label,
    description: undefined,
    hotkey: undefined,
    capabilities: [],
    category: undefined,
    keywords: [],
    toolbar: undefined,
    menu: undefined,
    when: undefined,
    ...overrides,
    capabilities: overrides.capabilities ?? [],
    keywords: overrides.keywords ?? [],
  };
}

export function createCommandManifest(packageId, commands = []) {
  return {
    packageId,
    commands: commands.map((command) => normalizeCommand(command, packageId)),
  };
}

export function createCommandContext(overrides = {}) {
  const selection = overrides.selection
    ? createResourceRef(overrides.selection.resourceId ?? '', overrides.selection)
    : undefined;
  const activeSurface = overrides.activeSurface
    ? {
      ...overrides.activeSurface,
      resourceKind: overrides.activeSurface.resourceKind === 'text' || overrides.activeSurface.resourceKind === 'binary'
        ? 'resource'
        : overrides.activeSurface.resourceKind,
      resourceRepresentation: overrides.activeSurface.resourceRepresentation
        ?? (overrides.activeSurface.resourceKind === 'text' ? 'text' : undefined)
        ?? (overrides.activeSurface.resourceKind === 'binary' ? 'bytes' : undefined),
    }
    : undefined;
  return {
    runtimeStatus: overrides.runtimeStatus ?? 'ready',
    workspaceReady: overrides.workspaceReady ?? (overrides.runtimeStatus ? overrides.runtimeStatus === 'ready' : true),
    selection,
    activeSurface,
    target: overrides.target
      ? {
        selection: overrides.target.selection
          ? createResourceRef(overrides.target.selection.resourceId ?? '', overrides.target.selection)
          : undefined,
        activeSurface: overrides.target.activeSurface
          ? {
            ...overrides.target.activeSurface,
            resourceKind: overrides.target.activeSurface.resourceKind === 'text'
              || overrides.target.activeSurface.resourceKind === 'binary'
              ? 'resource'
              : overrides.target.activeSurface.resourceKind,
            resourceRepresentation: overrides.target.activeSurface.resourceRepresentation
              ?? (overrides.target.activeSurface.resourceKind === 'text' ? 'text' : undefined)
              ?? (overrides.target.activeSurface.resourceKind === 'binary' ? 'bytes' : undefined),
          }
          : undefined,
        availableSurfaceIds: overrides.target.availableSurfaceIds ?? [],
      }
      : undefined,
    availableSurfaceIds: overrides.availableSurfaceIds ?? [],
  };
}

export function matchesCommandContext(command, context = {}) {
  const normalizedContext = createCommandContext(context);
  const when = command.when;
  const effectiveSelection = normalizedContext.target?.selection ?? normalizedContext.selection;
  const effectiveActiveSurface = normalizedContext.target?.activeSurface ?? normalizedContext.activeSurface;
  const effectiveAvailableSurfaceIds = normalizedContext.target?.availableSurfaceIds?.length
    ? normalizedContext.target.availableSurfaceIds
    : normalizedContext.availableSurfaceIds;
  if (!when) {
    return true;
  }

  if (when.runtimeStatuses?.length > 0 && !when.runtimeStatuses.includes(normalizedContext.runtimeStatus)) {
    return false;
  }

  if (when.workspaceReady !== undefined && when.workspaceReady !== normalizedContext.workspaceReady) {
    return false;
  }

  if (when.selectionRequired && !effectiveSelection) {
    return false;
  }

  if (when.selectionKinds?.length > 0) {
    const selectedKind = effectiveSelection?.kind;
    if (!selectedKind || !when.selectionKinds.includes(selectedKind)) {
      return false;
    }
  }

  if (when.selectionRepresentations?.length > 0) {
    const selectedRepresentation = getResourceRepresentation(effectiveSelection);
    if (!selectedRepresentation || !when.selectionRepresentations.includes(selectedRepresentation)) {
      return false;
    }
  }

  if (when.activeSurfaceRequired && !effectiveActiveSurface) {
    return false;
  }

  if (when.activeSurfacePlacements?.length > 0) {
    const placement = effectiveActiveSurface?.placement;
    if (!placement || !when.activeSurfacePlacements.includes(placement)) {
      return false;
    }
  }

  if (when.activeSurfaceResourceKinds?.length > 0) {
    const resourceKind = effectiveActiveSurface?.resourceKind;
    if (!resourceKind || !when.activeSurfaceResourceKinds.includes(resourceKind)) {
      return false;
    }
  }

  if (when.activeSurfaceResourceRepresentations?.length > 0) {
    const representation = effectiveActiveSurface?.resourceRepresentation;
    if (!representation || !when.activeSurfaceResourceRepresentations.includes(representation)) {
      return false;
    }
  }

  if (when.activeSurfaceContributionIds?.length > 0) {
    const contributionId = effectiveActiveSurface?.contributionId;
    if (!contributionId || !when.activeSurfaceContributionIds.includes(contributionId)) {
      return false;
    }
  }

  if (when.availableSurfaceIds?.length > 0) {
    const availableSurfaceIds = new Set(effectiveAvailableSurfaceIds ?? []);
    if (!when.availableSurfaceIds.every((surfaceId) => availableSurfaceIds.has(surfaceId))) {
      return false;
    }
  }

  return true;
}

export function resolveCommandState(command, context = {}) {
  const visible = matchesCommandContext(command, context);
  return {
    ...command,
    visible,
    enabled: visible,
  };
}

export function createCommandRegistry(initialManifests = []) {
  const manifests = new Map();
  const commands = new Map();

  const registry = {
    registerManifest(manifest) {
      const normalizedManifest = normalizeManifest(manifest);
      manifests.set(normalizedManifest.packageId, normalizedManifest);

      for (const command of normalizedManifest.commands) {
        commands.set(command.id, command);
      }

      return registry;
    },
    registerCommands(packageId, commandList = []) {
      return registry.registerManifest(createCommandManifest(packageId, commandList));
    },
    get(commandId) {
      return commands.get(commandId);
    },
    list() {
      return [...commands.values()].sort(compareCommands);
    },
    listManifests() {
      return [...manifests.values()];
    },
    resolve(context = {}) {
      return registry.list().map((command) => resolveCommandState(command, context));
    },
    listToolbar(context = {}) {
      return registry.resolve(context)
        .filter((command) => command.visible && command.toolbar)
        .sort(compareCommands);
    },
    listMenus(context = {}) {
      return groupCommandsByMenu(
        registry.resolve(context).filter((command) => command.visible && command.menu),
      );
    },
  };

  for (const manifest of initialManifests) {
    registry.registerManifest(manifest);
  }

  return registry;
}

export function createCommandDispatcher(options = {}) {
  const handlers = new Map(Object.entries(options.handlers ?? {}));

  const dispatcher = {
    register(commandId, handler) {
      handlers.set(commandId, handler);
      return dispatcher;
    },
    get(commandId) {
      return handlers.get(commandId);
    },
    listHandlers() {
      return [...handlers.keys()].sort();
    },
    async execute(commandId, execution = {}) {
      const command = options.registry?.get(commandId);
      if (!command) {
        return {
          handled: false,
          command: undefined,
          context: createCommandContext(execution.context),
        };
      }

      const context = createCommandContext(execution.context ?? options.getContext?.());
      const resolvedCommand = resolveCommandState(command, context);
      const handler = handlers.get(commandId);
      if (!resolvedCommand.enabled || typeof handler !== 'function') {
        return {
          handled: false,
          command: resolvedCommand,
          context,
        };
      }

      const value = await handler({
        command: resolvedCommand,
        context,
      });

      return {
        handled: true,
        command: resolvedCommand,
        context,
        value,
      };
    },
  };

  return dispatcher;
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
    fileExtension: extensionFromPath(input.path),
  };
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
