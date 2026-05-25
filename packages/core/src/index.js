export const severityLevels = ['hint', 'info', 'warning', 'error'];

export const resourceKinds = ['resource', 'generated', 'virtual'];
export const resourceRepresentations = ['text', 'bytes'];

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
};

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
  return {
    severity,
    message,
    ...overrides,
  };
}

export function createCapability(id, overrides = {}) {
  return {
    id,
    ...overrides,
  };
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
    ...overrides,
  };
}

export function createPipelineContribution(id, overrides = {}) {
  return {
    id,
    ...overrides,
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
    ...overrides,
    dependencies: overrides.dependencies ?? [],
    capabilities: overrides.capabilities ?? [],
    commands: (overrides.commands ?? []).map((command) => normalizeCommand(command, packageId)),
    surfaces: overrides.surfaces ?? [],
    pipelines: overrides.pipelines ?? [],
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

function extensionFromPath(path) {
  const fileName = path?.split(/[\\/]/).pop() ?? '';
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : '';
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

export const defaultContributionManifest = createContributionManifest('@textforge/core');

export const contributions = createContributionManifest('@textforge/core');
