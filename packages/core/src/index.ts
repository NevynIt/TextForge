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

export interface ResourceRef {
  readonly resourceId: string;
  readonly path?: string;
  readonly kind?: ResourceKind;
  readonly mimeType?: string;
  readonly languageId?: string;
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

export const contributions = {
  id: '@textforge/core',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;
