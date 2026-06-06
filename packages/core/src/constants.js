export const severityLevels = ['observation', 'information', 'warning', 'error'];

export const legacySeverityAliases = {
  hint: 'observation',
  info: 'information',
};

export const resourceKinds = ['resource', 'generated', 'virtual'];
export const resourceRepresentations = ['text', 'bytes'];
export const resourceCapabilityIds = [
  'resource.read',
  'resource.list',
  'resource.open',
  'resource.view',
  'resource.copy',
  'resource.export',
  'resource.create-child',
  'resource.write',
  'resource.rename',
  'resource.move',
  'resource.delete',
];
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
