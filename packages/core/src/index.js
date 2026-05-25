export const severityLevels = ['observation', 'information', 'warning', 'error'];

export const legacySeverityAliases = {
  hint: 'observation',
  info: 'information',
};

export const resourceKinds = ['resource', 'generated', 'virtual'];
export const resourceRepresentations = ['text', 'bytes'];
export const capabilityStates = ['available', 'active', 'disabled', 'missing', 'failed'];

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
  return {
    defaultActive: false,
    scope: 'document',
    ...capability,
  };
}

function normalizeIdSet(values = []) {
  return new Set(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  );
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
    localName: overrides.localName,
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
    localName: overrides.localName,
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
    localName: overrides.localName,
    defaultActive: overrides.defaultActive ?? false,
    provisional: overrides.provisional ?? false,
    localArtifactCompatible: overrides.localArtifactCompatible !== false,
    fenceNames: [...(overrides.fenceNames ?? [])],
    render: overrides.render,
  };
}

export function createContributionManifest(packageId, overrides = {}) {
  return {
    id: packageId,
    packageId,
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
    dependencies: [...(overrides.dependencies ?? [])],
    capabilities: (overrides.capabilities ?? []).map((capability) => normalizeCapability(capability)),
    commands: (overrides.commands ?? []).map((command) => normalizeCommand(command, packageId)),
    surfaces: (overrides.surfaces ?? []).map((contribution) =>
      createSurfaceContribution(contribution.id, contribution)),
    pipelines: (overrides.pipelines ?? []).map((contribution) =>
      createPipelineContribution(contribution.id, contribution)),
    markdownFenceHandlers: (overrides.markdownFenceHandlers ?? []).map((contribution) =>
      createMarkdownFenceHandlerContribution(contribution.id, contribution)),
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
  return manifests.flatMap((manifest) =>
    (manifest[propertyName] ?? []).map((contribution) => ({
      ...contribution,
      packageId: contribution.packageId ?? manifest.packageId,
    })));
}

function resolveCapabilityState(capability, context = {}) {
  const disabledCapabilityIds = normalizeIdSet(context.disabledCapabilityIds);
  const failedCapabilityIds = normalizeIdSet(context.failedCapabilityIds);
  const activeCapabilityIds = new Set([
    ...(context.activeCapabilityIds ?? []),
    ...(capability.defaultActive ? [capability.id] : []),
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

function resolveContributionState(contribution, capabilityStateById, context = {}) {
  const packageStatus = context.packageStatuses?.[contribution.packageId] ?? 'available';
  if (packageStatus === 'failed') {
    return 'failed';
  }

  if (packageStatus === 'disabled') {
    return 'disabled';
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
  return createDiagnostic(
    `Active ${kind} contributions conflict on short name "${name}".`,
    'error',
    {
      code: 'registry.active-conflict',
      origin: {
        packageId: '@textforge/core',
        subsystem: 'contribution-registry',
        ruleId: `${kind}:${name}`,
      },
      related: contributions.map((contribution) => ({
        message: `${contribution.id} from ${contribution.packageId}`,
      })),
    },
  );
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
      return [...manifests.values()];
    },
    listCapabilities() {
      return registry.listManifests().flatMap((manifest) => manifest.capabilities ?? []);
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
      const capabilities = registry.listCapabilities().map((capability) => ({
        ...capability,
        status: resolveCapabilityState(capability, context),
      }));
      const capabilityStateById = new Map(capabilities.map((capability) => [capability.id, capability]));
      const resolvedCommands = registry.listCommands().map((command) => ({
        ...command,
        status: resolveContributionState(command, capabilityStateById, context),
      }));
      const resolvedSurfaces = registry.listSurfaces().map((surface) => ({
        ...surface,
        status: resolveContributionState(surface, capabilityStateById, context),
      }));
      const resolvedPipelines = registry.listPipelines().map((pipeline) => ({
        ...pipeline,
        status: resolveContributionState(pipeline, capabilityStateById, context),
      }));
      const resolvedMarkdownFenceHandlers = registry.listMarkdownFenceHandlers().map((handler) => ({
        ...handler,
        status: resolveContributionState(handler, capabilityStateById, context),
      }));

      const diagnostics = [];
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
  };

  for (const manifest of initialManifests) {
    registry.registerManifest(manifest);
  }

  return registry;
}

export const defaultContributionManifest = createContributionManifest('@textforge/core');

export const contributions = createContributionManifest('@textforge/core');
