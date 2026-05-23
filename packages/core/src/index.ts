export type Severity = 'hint' | 'info' | 'warning' | 'error';

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export type ResourceKind = 'text' | 'binary' | 'generated' | 'virtual';
export type LanguageId =
  | 'plaintext'
  | 'markdown'
  | 'itm'
  | 'lua'
  | 'json'
  | 'xml'
  | 'bpmn-xml'
  | 'archimate-exchange-xml'
  | 'csv'
  | 'tsv'
  | 'mermaid'
  | 'dot'
  | 'svg'
  | 'yaml';

export type EditorCapabilityId =
  | 'editor.source'
  | 'editor.source-range'
  | 'editor.diagnostics'
  | 'editor.language-mode'
  | 'editor.source-fallback';

export interface ResourceRef {
  readonly resourceId: string;
  readonly path?: string;
  readonly kind?: ResourceKind;
  readonly mimeType?: string;
  readonly languageId?: LanguageId | string;
  readonly parentResourceId?: string;
}

export interface DiagnosticRelatedInformation {
  readonly message: string;
  readonly source?: SourceRange;
  readonly resource?: ResourceRef;
}

export interface Diagnostic {
  readonly severity: Severity;
  readonly message: string;
  readonly code?: string;
  readonly source?: SourceRange;
  readonly resource?: ResourceRef;
  readonly related?: ReadonlyArray<DiagnosticRelatedInformation>;
}

export interface LanguageDefinition {
  readonly id: LanguageId;
  readonly label: string;
  readonly mimeTypes: ReadonlyArray<string>;
  readonly extensions: ReadonlyArray<string>;
  readonly sourceEditor: true;
}

export interface EditorDiagnosticBridge {
  readonly id: string;
  readonly languageIds: ReadonlyArray<LanguageId>;
  lint(resource: ResourceRef, text: string): ReadonlyArray<Diagnostic>;
}

export interface Capability {
  readonly id: string;
  readonly description?: string;
  readonly resourceKinds?: ReadonlyArray<ResourceKind>;
  readonly editable?: boolean;
}

export interface Command {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly hotkey?: string;
  readonly capabilities?: ReadonlyArray<Capability['id']>;
}

export interface SurfaceContribution {
  readonly id: string;
  readonly role?: 'main' | 'popup' | 'auxiliary';
  readonly capabilities?: ReadonlyArray<Capability['id']>;
}

export interface PipelineContribution {
  readonly id: string;
  readonly input?: string;
  readonly output?: string;
}

export interface ContributionManifest {
  readonly packageId: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly dependencies?: ReadonlyArray<string>;
  readonly capabilities?: ReadonlyArray<Capability>;
  readonly commands?: ReadonlyArray<Command>;
  readonly surfaces?: ReadonlyArray<SurfaceContribution>;
  readonly pipelines?: ReadonlyArray<PipelineContribution>;
}

export interface PipelineValue<TValue = unknown> {
  readonly kind: string;
  readonly value: TValue;
  readonly resource?: ResourceRef;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface CanonicalPatchOperation {
  readonly op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  readonly path: string;
  readonly from?: string;
  readonly value?: unknown;
}

export interface CanonicalPatch {
  readonly target: ResourceRef;
  readonly operations: ReadonlyArray<CanonicalPatchOperation>;
  readonly source?: string;
  readonly summary?: string;
}

export const contributionKinds = {
  diagnostics: 'diagnostics',
  commands: 'commands',
  surfaces: 'surfaces',
  pipelines: 'pipelines',
} as const;

export const languageDefinitions: ReadonlyArray<LanguageDefinition> = [
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
} as const;

export declare function getLanguageDefinition(languageId: LanguageId | string | undefined): LanguageDefinition | undefined;
export declare function inferLanguageId(input: {
  readonly path?: string;
  readonly mimeType?: string;
  readonly fallback?: LanguageId;
}): LanguageId;

export const contributions = {
  id: '@textforge/core',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;
