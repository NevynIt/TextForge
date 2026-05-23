export const severityLevels = ['hint', 'info', 'warning', 'error'];

export const resourceKinds = ['text', 'binary', 'generated', 'virtual'];

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

export function getLanguageDefinition(languageId) {
  return languageDefinitions.find((definition) => definition.id === languageId);
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

export const contributions = {
  id: '@textforge/core',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
};
