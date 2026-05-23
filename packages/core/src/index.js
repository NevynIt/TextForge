export const severityLevels = ['hint', 'info', 'warning', 'error'];

export const resourceKinds = ['text', 'binary', 'generated', 'virtual'];

export const contributionKinds = {
  diagnostics: 'diagnostics',
  commands: 'commands',
  surfaces: 'surfaces',
  pipelines: 'pipelines',
};

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
  return {
    resourceId,
    ...overrides,
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
    ...overrides,
  };
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
    commands: overrides.commands ?? [],
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

export const defaultContributionManifest = createContributionManifest('@textforge/core');

export const contributions = {
  id: '@textforge/core',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};
