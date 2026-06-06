export type Severity = 'observation' | 'information' | 'warning' | 'error';

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
export type ResourceCapabilityId =
  | 'resource.read'
  | 'resource.list'
  | 'resource.open'
  | 'resource.view'
  | 'resource.copy'
  | 'resource.export'
  | 'resource.create-child'
  | 'resource.write'
  | 'resource.rename'
  | 'resource.move'
  | 'resource.delete';
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
  readonly providerId?: string;
  readonly revision?: string;
  readonly capabilityIds?: ReadonlyArray<ResourceCapabilityId | string>;
  readonly ownerKind?: string;
  readonly ownerId?: string;
  readonly provenance?: ResourceProvenance;
  readonly diagnostics?: ReadonlyArray<Diagnostic>;
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

export interface ResourceGeneratedProvenance {
  readonly kind: 'generated';
  readonly pipelineId: string;
  readonly sourceResourceId: string;
  readonly sourcePath: string;
  readonly sourceUpdatedAt: string;
  readonly generatedAt: string;
  readonly blockId?: string;
  readonly blockKind?: string;
  readonly format?: 'svg' | 'png' | 'html' | string;
}

export interface ResourceBundledProvenance {
  readonly kind: 'bundled';
  readonly bundleId: string;
  readonly sourcePath: string;
  readonly bundledAt?: string;
}

export interface ResourceCopyProvenance {
  readonly kind: 'copy';
  readonly sourceProviderId: string;
  readonly sourceResourceId: string;
  readonly sourcePath: string;
  readonly copiedAt: string;
}

export type ResourceProvenance =
  | ResourceGeneratedProvenance
  | ResourceBundledProvenance
  | ResourceCopyProvenance
  | { readonly kind: string; readonly [key: string]: unknown };

export interface DiagnosticRelatedInformation {
  readonly message: string;
  readonly source?: SourceRange;
  readonly resource?: ResourceRef;
}

export interface DiagnosticOrigin {
  readonly packageId?: string;
  readonly contributionId?: string;
  readonly capabilityId?: string;
  readonly actionId?: string;
  readonly pipelineStepId?: string;
  readonly ruleId?: string;
  readonly directive?: string;
  readonly fenceName?: string;
  readonly subsystem?: string;
}

export interface Diagnostic {
  readonly severity: Severity;
  readonly message: string;
  readonly code?: string;
  readonly source?: SourceRange;
  readonly resource?: ResourceRef;
  readonly origin?: DiagnosticOrigin;
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
  readonly localName?: string;
  readonly aliases?: ReadonlyArray<string>;
  readonly resourceKinds?: ReadonlyArray<ResourceKind>;
  readonly editable?: boolean;
  readonly defaultActive?: boolean;
  readonly scope?: 'document' | 'workspace' | 'session';
  readonly documentPredicate?: ResourcePredicate;
}

export interface ContributionPackageDependency {
  readonly packageId: string;
  readonly optional?: boolean;
  readonly versionRange?: string;
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
  readonly providerId?: string;
  readonly capabilityIds?: ReadonlyArray<ResourceCapabilityId | string>;
  readonly revision?: string;
  readonly ownerKind?: string;
  readonly ownerId?: string;
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
  readonly selectionLanguageIds?: ReadonlyArray<string>;
  readonly selectionProviderIds?: ReadonlyArray<string>;
  readonly selectionCapabilityIds?: ReadonlyArray<ResourceCapabilityId | string>;
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
  readonly label?: string;
  readonly description?: string;
  readonly role?: 'main' | 'popup' | 'auxiliary';
  readonly capabilities?: ReadonlyArray<Capability['id']>;
  readonly localName?: string;
  readonly defaultActive?: boolean;
  readonly resourcePredicate?: ResourcePredicate;
  readonly open?: (execution: unknown) => unknown | Promise<unknown>;
}

export interface PipelineContribution {
  readonly id: string;
  readonly label?: string;
  readonly description?: string;
  readonly input?: string;
  readonly output?: string;
  readonly capabilities?: ReadonlyArray<Capability['id']>;
  readonly localName?: string;
  readonly defaultActive?: boolean;
  readonly run?: (execution: unknown) => unknown | Promise<unknown>;
}

export interface MarkdownFenceHandlerContribution {
  readonly id: string;
  readonly label?: string;
  readonly description?: string;
  readonly capabilities?: ReadonlyArray<Capability['id']>;
  readonly localName?: string;
  readonly defaultActive?: boolean;
  readonly provisional?: boolean;
  readonly localArtifactCompatible?: boolean;
  readonly fenceNames?: ReadonlyArray<string>;
  readonly render?: (execution: unknown) => unknown | Promise<unknown>;
}

export interface ResourceFacts {
  readonly resourceId: string;
  readonly kind?: ResourceKind;
  readonly representation?: ResourceRepresentation;
  readonly path?: string;
  readonly mimeType?: string;
  readonly languageId?: LanguageId | string;
  readonly fileExtension?: string;
  readonly providerId?: string;
  readonly revision?: string;
  readonly capabilityIds: ReadonlyArray<ResourceCapabilityId | string>;
  readonly ownerKind?: string;
  readonly ownerId?: string;
  readonly provenanceKind?: string;
  readonly diagnosticCount: number;
}

export interface ResourcePredicate {
  readonly representations?: ReadonlyArray<ResourceRepresentation>;
  readonly mimeTypes?: ReadonlyArray<string>;
  readonly languageIds?: ReadonlyArray<LanguageId | string>;
  readonly fileExtensions?: ReadonlyArray<string>;
}

export interface RegisteredCapability extends Capability {
  readonly packageId: string;
}

export interface ResolvedCapability extends Capability {
  readonly packageId?: string;
  readonly status: 'available' | 'active' | 'disabled' | 'missing' | 'failed';
}

export interface ResolvedContribution<TContribution> extends TContribution {
  readonly packageId: string;
  readonly status: 'available' | 'active' | 'disabled' | 'missing' | 'failed';
}

export interface ContributionRegistryResolvedDependency extends ContributionPackageDependency {
  readonly resolvedVersion?: string;
  readonly status: 'available' | 'missingDependency' | 'incompatibleVersion';
  readonly reasonCode?: string;
}

export interface ContributionRegistryPackage {
  readonly packageId: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly status: 'available' | 'disabled' | 'missingDependency' | 'incompatibleVersion' | 'conflict' | 'failedToInitialize';
  readonly statusReason?: string;
  readonly dependencies: ReadonlyArray<ContributionRegistryResolvedDependency>;
  readonly capabilityIds: ReadonlyArray<string>;
  readonly contributionCounts: {
    readonly commands: number;
    readonly surfaces: number;
    readonly pipelines: number;
    readonly markdownFenceHandlers: number;
  };
  readonly contributionIds: {
    readonly commands: ReadonlyArray<string>;
    readonly surfaces: ReadonlyArray<string>;
    readonly pipelines: ReadonlyArray<string>;
    readonly markdownFenceHandlers: ReadonlyArray<string>;
  };
  readonly conflicts: ReadonlyArray<string>;
}

export interface ContributionRegistryResolution {
  readonly manifests: ReadonlyArray<ContributionManifest>;
  readonly packages: ReadonlyArray<ContributionRegistryPackage>;
  readonly capabilities: ReadonlyArray<ResolvedCapability>;
  readonly commands: ReadonlyArray<ResolvedContribution<CommandContribution>>;
  readonly surfaces: ReadonlyArray<ResolvedContribution<SurfaceContribution>>;
  readonly pipelines: ReadonlyArray<ResolvedContribution<PipelineContribution>>;
  readonly markdownFenceHandlers: ReadonlyArray<ResolvedContribution<MarkdownFenceHandlerContribution>>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

export interface ContributionRegistryContext {
  readonly activeCapabilityIds?: ReadonlyArray<string>;
  readonly defaultActiveCapabilityIds?: ReadonlyArray<string>;
  readonly disabledCapabilityIds?: ReadonlyArray<string>;
  readonly failedCapabilityIds?: ReadonlyArray<string>;
  readonly packageStatuses?: Readonly<Record<string, 'available' | 'disabled' | 'failed'>>;
  readonly useLegacyDefaultActive?: boolean;
}

export interface CapabilityRequirement {
  readonly name?: string;
  readonly capabilityId?: string;
  readonly versionRange?: string;
  readonly source?: string;
}

export interface DocumentCapabilityActivation {
  readonly capabilityId: string;
  readonly source: 'explicit' | 'document' | 'workspace' | 'app' | 'core';
  readonly matchedBy?: string;
}

export interface ActiveShortNameConflict {
  readonly localName: string;
  readonly kind: 'surface' | 'pipeline' | 'markdown-fence-handler';
  readonly contributionIds: ReadonlyArray<string>;
}

export interface DocumentContributionContext {
  readonly document?: ResourceRef;
  readonly packages: ReadonlyArray<ContributionRegistryPackage>;
  readonly capabilities: ReadonlyArray<ResolvedCapability>;
  readonly activeCapabilities: ReadonlyArray<ResolvedCapability>;
  readonly inactiveCapabilities: ReadonlyArray<ResolvedCapability>;
  readonly commands: ReadonlyArray<ResolvedContribution<CommandContribution>>;
  readonly activeCommands: ReadonlyArray<ResolvedContribution<CommandContribution>>;
  readonly surfaces: ReadonlyArray<ResolvedContribution<SurfaceContribution>>;
  readonly activeSurfaces: ReadonlyArray<ResolvedContribution<SurfaceContribution>>;
  readonly pipelines: ReadonlyArray<ResolvedContribution<PipelineContribution>>;
  readonly activePipelines: ReadonlyArray<ResolvedContribution<PipelineContribution>>;
  readonly markdownFenceHandlers: ReadonlyArray<ResolvedContribution<MarkdownFenceHandlerContribution>>;
  readonly activeMarkdownFenceHandlers: ReadonlyArray<ResolvedContribution<MarkdownFenceHandlerContribution>>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly requirements: ReadonlyArray<CapabilityRequirement & {
    readonly matchedCapabilityId?: string;
    readonly status: 'active' | 'missing' | 'ambiguous' | 'available' | 'disabled' | 'failed';
  }>;
  readonly activationOrder: ReadonlyArray<DocumentCapabilityActivation>;
  readonly activeCapabilityIds: ReadonlyArray<string>;
  readonly shortNameConflicts: ReadonlyArray<ActiveShortNameConflict>;
}

export interface ContributionInspectorContributionEntry {
  readonly id: string;
  readonly packageId: string;
  readonly kind: 'commands' | 'surfaces' | 'pipelines' | 'markdownFenceHandlers';
  readonly label?: string;
  readonly localName?: string;
  readonly status: 'available' | 'active' | 'disabled' | 'missing' | 'failed';
  readonly capabilityIds: ReadonlyArray<string>;
  readonly fenceNames?: ReadonlyArray<string>;
}

export interface ContributionInspectorCapabilityEntry {
  readonly id: string;
  readonly packageId: string;
  readonly localName?: string;
  readonly aliases: ReadonlyArray<string>;
  readonly status: 'available' | 'active' | 'disabled' | 'missing' | 'failed';
  readonly activationSources: ReadonlyArray<DocumentCapabilityActivation['source']>;
  readonly matchedRequirementNames: ReadonlyArray<string>;
}

export interface ContributionInspectorPackageEntry {
  readonly packageId: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly status: ContributionRegistryPackage['status'];
  readonly statusReason?: string;
  readonly dependencies: ReadonlyArray<ContributionRegistryResolvedDependency>;
  readonly conflicts: ReadonlyArray<string>;
  readonly capabilities: ReadonlyArray<ContributionInspectorCapabilityEntry>;
  readonly contributions: {
    readonly commands: ReadonlyArray<ContributionInspectorContributionEntry>;
    readonly surfaces: ReadonlyArray<ContributionInspectorContributionEntry>;
    readonly pipelines: ReadonlyArray<ContributionInspectorContributionEntry>;
    readonly markdownFenceHandlers: ReadonlyArray<ContributionInspectorContributionEntry>;
  };
  readonly activeCapabilityCount: number;
  readonly activeContributionCounts: {
    readonly commands: number;
    readonly surfaces: number;
    readonly pipelines: number;
    readonly markdownFenceHandlers: number;
  };
  readonly diagnostics: ReadonlyArray<Pick<Diagnostic, 'code' | 'severity' | 'message'>>;
}

export interface ContributionInspectorModel {
  readonly summary: {
    readonly packageCount: number;
    readonly availablePackageCount: number;
    readonly blockedPackageCount: number;
    readonly capabilityCount: number;
    readonly activeCapabilityCount: number;
    readonly activeSurfaceCount: number;
    readonly activePipelineCount: number;
    readonly activeMarkdownFenceHandlerCount: number;
    readonly diagnosticCount: number;
  };
  readonly document?: {
    readonly resource?: ResourceRef;
    readonly requirements: ReadonlyArray<DocumentContributionContext['requirements'][number]>;
    readonly activationOrder: ReadonlyArray<DocumentCapabilityActivation>;
    readonly shortNameConflicts: ReadonlyArray<ActiveShortNameConflict>;
    readonly diagnostics: ReadonlyArray<Diagnostic>;
  };
  readonly packages: ReadonlyArray<ContributionInspectorPackageEntry>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

export interface DocumentContributionResolverOptions extends ContributionRegistryContext {
  readonly document?: Partial<ResourceRef> & { readonly id?: string };
  readonly explicitRequirements?: ReadonlyArray<string | CapabilityRequirement>;
  readonly workspaceDefaultCapabilityIds?: ReadonlyArray<string | CapabilityRequirement>;
  readonly appDefaultCapabilityIds?: ReadonlyArray<string | CapabilityRequirement>;
}

export interface ContributionRegistry {
  registerManifest(manifest: ContributionManifest | { readonly id?: string; readonly packageId?: string }): ContributionRegistry;
  listManifests(): ReadonlyArray<ContributionManifest>;
  listCapabilities(): ReadonlyArray<RegisteredCapability>;
  listCommands(): ReadonlyArray<CommandContribution>;
  listSurfaces(): ReadonlyArray<SurfaceContribution>;
  listPipelines(): ReadonlyArray<PipelineContribution>;
  listMarkdownFenceHandlers(): ReadonlyArray<MarkdownFenceHandlerContribution>;
  resolve(context?: ContributionRegistryContext): ContributionRegistryResolution;
  resolveDocumentContext(options?: DocumentContributionResolverOptions): DocumentContributionContext;
  createMarkdownFenceHandlerMap(context?: ContributionRegistryContext): {
    readonly diagnostics: ReadonlyArray<Diagnostic>;
    readonly handlers: Readonly<Record<string, ResolvedContribution<MarkdownFenceHandlerContribution>>>;
  };
}

export interface ContributionManifest {
  readonly id?: string;
  readonly packageId: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly dependencies?: ReadonlyArray<string | ContributionPackageDependency>;
  readonly capabilities?: ReadonlyArray<Capability>;
  readonly commands?: ReadonlyArray<CommandContribution>;
  readonly surfaces?: ReadonlyArray<SurfaceContribution>;
  readonly pipelines?: ReadonlyArray<PipelineContribution>;
  readonly markdownFenceHandlers?: ReadonlyArray<MarkdownFenceHandlerContribution>;
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
