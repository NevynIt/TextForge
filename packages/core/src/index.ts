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

export type ResourceKind = 'resource' | 'generated' | 'virtual';
export type ResourceRepresentation = 'text' | 'bytes';
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
  readonly representation?: ResourceRepresentation;
  readonly mimeType?: string;
  readonly languageId?: LanguageId | string;
  readonly parentResourceId?: string;
  readonly badge?: ResourceBadgeToken;
}

export interface ResourceBadgeToken {
  readonly key: string;
  readonly fingerprint: string;
  readonly shape: string;
  readonly accent: string;
  readonly mark: string;
  readonly placement: 'center' | 'top' | 'right' | 'bottom' | 'left';
  readonly variant: number;
  readonly label: string;
  readonly description?: string;
  readonly repairedFromKey?: string;
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

export interface CommandToolbarPresentation {
  readonly order?: number;
  readonly kind?: 'primary' | 'secondary';
}

export interface CommandMenuPresentation {
  readonly id: string;
  readonly label: string;
  readonly groupOrder?: number;
  readonly order?: number;
}

export interface CommandContextSelection {
  readonly resourceId?: string;
  readonly kind?: string;
  readonly representation?: ResourceRepresentation | string;
  readonly path?: string;
  readonly mimeType?: string;
  readonly languageId?: string;
}

export interface CommandContextSurface {
  readonly sessionId?: string;
  readonly contributionId?: string;
  readonly placement?: string;
  readonly resourceId?: string;
  readonly resourceKind?: ResourceKind | string;
  readonly resourceRepresentation?: ResourceRepresentation | string;
  readonly freshness?: string;
}

export interface CommandContextTarget {
  readonly selection?: CommandContextSelection;
  readonly activeSurface?: CommandContextSurface;
  readonly availableSurfaceIds?: ReadonlyArray<string>;
}

export interface CommandContext {
  readonly runtimeStatus?: string;
  readonly workspaceReady?: boolean;
  readonly selection?: CommandContextSelection;
  readonly activeSurface?: CommandContextSurface;
  readonly target?: CommandContextTarget;
  readonly availableSurfaceIds?: ReadonlyArray<string>;
}

export interface CommandWhen {
  readonly runtimeStatuses?: ReadonlyArray<string>;
  readonly workspaceReady?: boolean;
  readonly selectionRequired?: boolean;
  readonly selectionKinds?: ReadonlyArray<string>;
  readonly selectionRepresentations?: ReadonlyArray<string>;
  readonly activeSurfaceRequired?: boolean;
  readonly activeSurfacePlacements?: ReadonlyArray<string>;
  readonly activeSurfaceResourceKinds?: ReadonlyArray<string>;
  readonly activeSurfaceResourceRepresentations?: ReadonlyArray<string>;
  readonly activeSurfaceContributionIds?: ReadonlyArray<string>;
  readonly availableSurfaceIds?: ReadonlyArray<string>;
}

export interface CommandContribution extends Command {
  readonly packageId?: string;
  readonly category?: string;
  readonly keywords?: ReadonlyArray<string>;
  readonly toolbar?: CommandToolbarPresentation;
  readonly menu?: CommandMenuPresentation;
  readonly when?: CommandWhen;
}

export interface CommandManifest {
  readonly packageId: string;
  readonly commands: ReadonlyArray<CommandContribution>;
}

export interface ResolvedCommand extends CommandContribution {
  readonly packageId: string;
  readonly visible: boolean;
  readonly enabled: boolean;
}

export interface CommandMenuGroup {
  readonly id: string;
  readonly label: string;
  readonly groupOrder?: number;
  readonly commands: ReadonlyArray<ResolvedCommand>;
}

export interface CommandDispatcherExecution {
  readonly context?: CommandContext;
}

export interface CommandHandlerExecution {
  readonly command: ResolvedCommand;
  readonly context: CommandContext;
}

export type CommandHandler<TResult = unknown> = (execution: CommandHandlerExecution) => TResult | Promise<TResult>;

export interface CommandDispatcherResult<TResult = unknown> {
  readonly handled: boolean;
  readonly command?: ResolvedCommand;
  readonly context: CommandContext;
  readonly value?: TResult;
}

export interface CommandRegistry {
  registerManifest(manifest: CommandManifest | Pick<ContributionManifest, 'packageId' | 'commands'> | { readonly id: string; readonly commands?: ReadonlyArray<CommandContribution> }): CommandRegistry;
  registerCommands(packageId: string, commands?: ReadonlyArray<CommandContribution>): CommandRegistry;
  get(commandId: string): CommandContribution | undefined;
  list(): ReadonlyArray<CommandContribution>;
  listManifests(): ReadonlyArray<CommandManifest>;
  resolve(context?: CommandContext): ReadonlyArray<ResolvedCommand>;
  listToolbar(context?: CommandContext): ReadonlyArray<ResolvedCommand>;
  listMenus(context?: CommandContext): ReadonlyArray<CommandMenuGroup>;
}

export interface CommandDispatcher {
  register(commandId: string, handler: CommandHandler): CommandDispatcher;
  get(commandId: string): CommandHandler | undefined;
  listHandlers(): ReadonlyArray<string>;
  execute(commandId: string, execution?: CommandDispatcherExecution): Promise<CommandDispatcherResult>;
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
  readonly id?: string;
  readonly packageId: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly dependencies?: ReadonlyArray<string>;
  readonly capabilities?: ReadonlyArray<Capability>;
  readonly commands?: ReadonlyArray<CommandContribution>;
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

export const contributionKinds: {
  readonly diagnostics: 'diagnostics';
  readonly commands: 'commands';
  readonly surfaces: 'surfaces';
  readonly pipelines: 'pipelines';
};

export const languageDefinitions: ReadonlyArray<LanguageDefinition>;
export const resourceKinds: ReadonlyArray<ResourceKind>;
export const resourceRepresentations: ReadonlyArray<ResourceRepresentation>;
export const resourceBadgePlacements: ReadonlyArray<'center' | 'top' | 'right' | 'bottom' | 'left'>;

export const editorCapabilityIds: {
  readonly source: 'editor.source';
  readonly sourceRange: 'editor.source-range';
  readonly diagnostics: 'editor.diagnostics';
  readonly languageMode: 'editor.language-mode';
  readonly sourceFallback: 'editor.source-fallback';
};

export declare function createSourcePosition(line: number, column: number, offset?: number): SourcePosition;
export declare function createSourceRange(start: SourcePosition, end: SourcePosition): SourceRange;
export declare function createResourceRef(resourceId: string, overrides?: Partial<ResourceRef>): ResourceRef;
export declare function createResourceBadgeToken(overrides?: Partial<ResourceBadgeToken>): ResourceBadgeToken;
export declare function createDiagnostic(message: string, severity?: Severity, overrides?: Partial<Diagnostic>): Diagnostic;
export declare function createCapability(id: string, overrides?: Partial<Capability>): Capability;
export declare function createCommand(
  id: string,
  label: string,
  overrides?: Partial<CommandContribution>,
): CommandContribution;
export declare function createCommandManifest(
  packageId: string,
  commands?: ReadonlyArray<CommandContribution>,
): CommandManifest;
export declare function createCommandContext(overrides?: CommandContext): CommandContext;
export declare function matchesCommandContext(command: CommandContribution, context?: CommandContext): boolean;
export declare function resolveCommandState(
  command: CommandContribution,
  context?: CommandContext,
): ResolvedCommand;
export declare function createCommandRegistry(
  initialManifests?: ReadonlyArray<CommandManifest | Pick<ContributionManifest, 'packageId' | 'commands'> | { readonly id: string; readonly commands?: ReadonlyArray<CommandContribution> }>,
): CommandRegistry;
export declare function createCommandDispatcher(options?: {
  readonly registry?: CommandRegistry;
  readonly getContext?: () => CommandContext;
  readonly handlers?: Readonly<Record<string, CommandHandler>>;
}): CommandDispatcher;
export declare function createSurfaceContribution(id: string, overrides?: Partial<SurfaceContribution>): SurfaceContribution;
export declare function createPipelineContribution(id: string, overrides?: Partial<PipelineContribution>): PipelineContribution;
export declare function createContributionManifest(
  packageId: string,
  overrides?: Partial<ContributionManifest>,
): ContributionManifest;
export declare function createPipelineValue<TValue = unknown>(
  kind: string,
  value: TValue,
  overrides?: Partial<PipelineValue<TValue>>,
): PipelineValue<TValue>;
export declare function createCanonicalPatch(
  target: ResourceRef,
  operations: ReadonlyArray<CanonicalPatchOperation>,
  overrides?: Partial<CanonicalPatch>,
): CanonicalPatch;
export declare function getLanguageDefinition(languageId: LanguageId | string | undefined): LanguageDefinition | undefined;
export declare function getResourceRepresentation(resource?: Partial<ResourceRef> & { readonly kind?: string }): ResourceRepresentation | undefined;
export declare function inferLanguageId(input: {
  readonly path?: string;
  readonly mimeType?: string;
  readonly fallback?: LanguageId;
}): LanguageId;
export declare function inferResourceRepresentation(input: {
  readonly path?: string;
  readonly mimeType?: string;
  readonly bytes?: Uint8Array;
  readonly fallback?: ResourceRepresentation;
}): ResourceRepresentation;

export declare const defaultContributionManifest: ContributionManifest;

export declare const contributions: ContributionManifest;
