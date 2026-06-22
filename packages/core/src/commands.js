import { createResourceRef, getResourceRepresentation } from './resources.js';
import {
  compareByStringId,
  normalizeCapabilityIdArray,
} from './identity.js';

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

export function normalizeCommand(command, packageId) {
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
        generatedDiagram: overrides.target.generatedDiagram
          ? {
            blockId: overrides.target.generatedDiagram.blockId,
            blockKind: overrides.target.generatedDiagram.blockKind,
            svgText: overrides.target.generatedDiagram.svgText,
            path: overrides.target.generatedDiagram.path,
            title: overrides.target.generatedDiagram.title,
            sourceResourceId: overrides.target.generatedDiagram.sourceResourceId,
            sourcePath: overrides.target.generatedDiagram.sourcePath,
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

  if (when.selectionLanguageIds?.length > 0) {
    const selectedLanguageId = effectiveSelection?.languageId;
    if (!selectedLanguageId || !when.selectionLanguageIds.includes(selectedLanguageId)) {
      return false;
    }
  }

  if (when.selectionProviderIds?.length > 0) {
    const selectedProviderId = effectiveSelection?.providerId;
    if (!selectedProviderId || !when.selectionProviderIds.includes(selectedProviderId)) {
      return false;
    }
  }

  if (when.selectionCapabilityIds?.length > 0) {
    const selectedCapabilities = new Set(normalizeCapabilityIdArray(effectiveSelection?.capabilityIds));
    if (!when.selectionCapabilityIds.every((capabilityId) => selectedCapabilities.has(capabilityId))) {
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
