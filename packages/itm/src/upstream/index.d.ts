type ItmUid = string;
type ItmLocalName = string;
type ItmQualifiedName = string;
type ItmPrimitive = string | number | boolean | null;
type ItmValue = ItmPrimitive | ItmValue[] | {
    [key: string]: ItmValue;
};
type ItmSeverity = "error" | "warning" | "information" | "observation";
type ItmRelationshipKind = "explicit" | "containment" | "ordering";
type ItmSourceSyntax = "entity-line" | "inline-relationship" | "relationship-block" | "generated" | "directive" | "attribute-block" | "description-block";
type ItmSelectorExpressionKind = "all" | "entity-id" | "entity-type" | "tag" | "attribute" | "relationship-target" | "relationship-type" | "containment" | "ordering" | "view" | "viewpoint" | "and" | "or" | "xor" | "not" | "function";
type ItmValidationMode = "strict" | "tolerant";
type ItmIncludeStatus = "unresolved" | "resolved" | "missing" | "blocked" | "circular";
type ItmPatchSource = "visual-editor" | "plugin" | "manual" | "transformer";
type ItmGeneratedAssetKind = "svg" | "png" | "html" | "json" | "xml" | "text";
type ItmPluginCapability = "parser-extension" | "selector-function" | "validation-step" | "transformation-step" | "renderer" | "exporter" | "style-interpreter" | "viewpoint-engine" | "visual-editor" | "write-back-handler";
type ItmPipelineOperation = "select" | "includeEdges" | "exclude" | "validate" | "transform" | "layout" | "render" | "export" | "plugin";
type ItmStyleOrigin = "renderer-default" | "package" | "namespace" | "document" | "viewpoint" | "view" | "direct";
type ItmViewpointParameterType = "string" | "number" | "boolean" | "selector" | "enum" | "object";
type ItmOverlayPolicy = "merge" | "replace" | "append";
type ItmAttributePatchOperation = "set" | "delete" | "append" | "merge";
type ItmDescriptionPatchOperation = "append" | "replace" | "merge";
type ItmRepositoryKind = "local" | "git" | "registry" | "web" | "internal" | "offline-bundle";
type ItmPackageUsageScope = "all" | "types" | "styles" | "rules" | "viewpoints" | "pipelines";
interface ItmSourceRange {
    file?: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    startOffset?: number;
    endOffset?: number;
}
interface ItmAttributeBag {
    values: Record<string, ItmValue>;
    sourceRanges?: Record<string, ItmSourceRange>;
}
interface ItmElement {
    uid: ItmUid;
    id?: ItmLocalName;
    qualifiedId?: ItmQualifiedName;
    sourceRange?: ItmSourceRange;
    attributes?: ItmAttributeBag;
}
interface ItmEmbeddedBlock {
    language: string;
    content: string;
    source?: ItmSourceRange;
}
interface ItmDescription {
    format: "markdown";
    text: string;
    source?: ItmSourceRange;
    embeddedBlocks?: ItmEmbeddedBlock[];
}
interface ItmMetadata {
    title?: string;
    version?: string;
    description?: string;
    author?: string;
    owner?: string;
    defaultNamespace?: string;
    defaultRelationshipType?: string;
    defaultLanguageOrProfile?: string;
    created?: string;
    updated?: string;
    intendedRenderingMode?: string;
    intendedRenderingModes?: string[];
    validationMode?: ItmValidationMode;
    values?: Record<string, ItmValue>;
    source?: ItmSourceRange;
}
interface ItmDirective {
    name: string;
    argumentText?: string;
    body?: ItmValue;
    selectorSource?: ItmSourceRange;
    bodySource?: ItmSourceRange;
    rawText: string;
    known: boolean;
    handled: boolean;
    source?: ItmSourceRange;
}
interface ItmNamespace {
    prefix: string;
    uri: string;
    isDefault?: boolean;
    source?: ItmSourceRange;
}
interface ItmSelectorExpression {
    kind: ItmSelectorExpressionKind;
    value?: string;
    children?: ItmSelectorExpression[];
}
interface ItmSelector {
    raw: string;
    ast?: ItmSelectorExpression;
    source?: ItmSourceRange;
}
interface ItmSelectorContext {
    documentUid?: string;
    currentViewUid?: ItmUid;
    currentViewpointUid?: ItmUid;
}
interface ItmEntity extends ItmElement {
    kind: "entity";
    label: string;
    rawLabel?: string;
    namespacePrefix?: string;
    localId?: string;
    typeRef?: ItmQualifiedName;
    tags?: string[];
    description?: ItmDescription;
    parentId?: ItmUid;
    childIds?: ItmUid[];
    depth?: number;
    rank?: number;
    incomingRelationshipIds?: ItmUid[];
    outgoingRelationshipIds?: ItmUid[];
    overlayIds?: ItmUid[];
}
interface ItmRelationship extends ItmElement {
    kind: "relationship";
    sourceId: ItmUid;
    targetId?: ItmUid;
    sourceRef?: ItmQualifiedName;
    targetRef?: ItmQualifiedName;
    typeRef: ItmQualifiedName;
    relationshipKind: ItmRelationshipKind;
    implicit?: boolean;
    virtual?: boolean;
    sourceSyntax?: ItmSourceSyntax;
    overlayIds?: ItmUid[];
}
interface ItmStyleRule extends ItmElement {
    kind: "style-rule";
    selector: ItmSelector;
    style: ItmAttributeBag;
    origin: ItmStyleOrigin;
    priority: number;
}
interface ItmEntityType extends ItmElement {
    kind: "entity-type";
    name: ItmQualifiedName;
    namespacePrefix?: string;
    description?: string;
    requiredAttributes?: string[];
    optionalAttributes?: string[];
    superTypeRefs?: ItmQualifiedName[];
    defaultStyleUids?: ItmUid[];
}
interface ItmRelationshipType extends ItmElement {
    kind: "relationship-type";
    name: ItmQualifiedName;
    namespacePrefix?: string;
    description?: string;
    superTypeRefs?: ItmQualifiedName[];
    sourceTypeRefs?: ItmQualifiedName[];
    targetTypeRefs?: ItmQualifiedName[];
    inverseTypeRef?: ItmQualifiedName;
    requiredAttributes?: string[];
    optionalAttributes?: string[];
    defaultStyleUids?: ItmUid[];
}
interface ItmPipelineStep {
    uid: ItmUid;
    operation: ItmPipelineOperation;
    provider?: string;
    arguments: Record<string, ItmValue>;
    source?: ItmSourceRange;
}
interface ItmPipeline {
    steps: ItmPipelineStep[];
}
interface ItmValidationRule extends ItmElement {
    kind: "validation-rule";
    name: string;
    selector: ItmSelector;
    pipeline: ItmPipeline;
    severity: ItmSeverity;
    message?: string;
    enabled: boolean;
}
interface ItmPluginProvider {
    name: string;
    version: string;
    capabilities: ItmPluginCapability[];
}
interface ItmPluginRequirement {
    name: string;
    versionRange?: string;
    resolved?: boolean;
    provider?: ItmPluginProvider;
    source?: ItmSourceRange;
}
interface ItmViewpointParameter {
    name: string;
    type: ItmViewpointParameterType;
    defaultValue?: ItmValue;
    required?: boolean;
    description?: string;
    values?: ItmValue[];
}
interface ItmViewpoint extends ItmElement {
    kind: "viewpoint";
    name: string;
    title?: string;
    description?: string;
    pipeline: ItmPipeline;
    parameters?: ItmViewpointParameter[];
    styleUids?: ItmUid[];
    supportsVisualEditing: boolean;
}
interface ItmGeneratedAsset {
    kind: ItmGeneratedAssetKind;
    uri?: string;
    contentHash?: string;
    path?: string;
    hash?: string;
}
interface ItmHiddenDelta {
    kind: "hidden";
    targetKind: "entity" | "relationship";
    targetUid?: ItmUid;
    targetRef?: string;
    hidden: boolean;
}
interface ItmMovedDelta {
    kind: "moved";
    targetKind: "entity" | "relationship";
    targetUid?: ItmUid;
    targetRef?: string;
    dx?: number;
    dy?: number;
    x?: number;
    y?: number;
}
interface ItmPinnedDelta {
    kind: "pinned";
    targetKind: "entity" | "relationship";
    targetUid?: ItmUid;
    targetRef?: string;
    x: number;
    y: number;
}
interface ItmStyleOverrideDelta {
    kind: "style-override";
    selector: ItmSelector;
    style: ItmAttributeBag;
}
interface ItmLabelOverrideDelta {
    kind: "label-override";
    targetKind: "entity" | "relationship";
    targetUid?: ItmUid;
    targetRef?: string;
    label: string;
}
interface ItmExpandedCollapsedDelta {
    kind: "expanded-collapsed";
    targetUid?: ItmUid;
    targetRef?: string;
    expanded: boolean;
}
type ItmViewDelta = ItmHiddenDelta | ItmMovedDelta | ItmPinnedDelta | ItmStyleOverrideDelta | ItmLabelOverrideDelta | ItmExpandedCollapsedDelta;
interface ItmView extends ItmElement {
    kind: "view";
    name: string;
    title?: string;
    viewpointRef: string;
    parameters?: Record<string, ItmValue>;
    deltas?: ItmViewDelta[];
    generatedAssets?: ItmGeneratedAsset[];
    notes?: string[];
}
interface ItmAttributePatch {
    key: string;
    value?: ItmValue;
    operation: ItmAttributePatchOperation;
}
interface ItmDescriptionPatch {
    operation: ItmDescriptionPatchOperation;
    text: string;
}
interface ItmOverlay extends ItmElement {
    kind: "overlay";
    targetKind: "entity" | "relationship";
    targetUid?: ItmUid;
    targetRef: ItmQualifiedName;
    replacementLabel?: string;
    replacementTypeRef?: ItmQualifiedName;
    attributePatches?: ItmAttributePatch[];
    relationshipAdditions?: ItmRelationship[];
    descriptionPatch?: ItmDescriptionPatch;
    policy: ItmOverlayPolicy;
}
interface ItmInclude {
    target: string;
    resolvedDocumentUid?: string;
    status: ItmIncludeStatus;
    source?: ItmSourceRange;
}
interface ItmPackage extends ItmElement {
    kind: "package";
    name: string;
    version?: string;
    namespacePrefix?: string;
    description?: string;
    namespaces?: ItmNamespace[];
    entityTypes?: ItmEntityType[];
    relationshipTypes?: ItmRelationshipType[];
    validationRules?: ItmValidationRule[];
    styles?: ItmStyleRule[];
    viewpoints?: ItmViewpoint[];
    pluginRequirements?: ItmPluginRequirement[];
    referenceEntities?: ItmEntity[];
    pipelines?: ItmPipeline[];
}
interface ItmPackageUsage {
    packageRef: string;
    packageUid?: ItmUid;
    scope: ItmPackageUsageScope;
    source?: ItmSourceRange;
}
interface ItmRepository {
    name: string;
    location: string;
    kind?: ItmRepositoryKind;
    allowed: boolean;
    resolved?: boolean;
    source?: ItmSourceRange;
}
interface ItmDiagnostic {
    uid: ItmUid;
    source: string;
    severity: ItmSeverity;
    message: string;
    file?: string;
    range?: ItmSourceRange;
    uri?: string;
    entityUid?: ItmUid;
    relationshipUid?: ItmUid;
    directiveName?: string;
    ruleUid?: ItmUid;
    pipelineStepUid?: ItmUid;
    viewUid?: ItmUid;
    viewpointUid?: ItmUid;
    namespacePrefix?: string;
    packageUid?: ItmUid;
    includeTarget?: string;
    includeStack?: string[];
    repositoryRef?: string;
    packageRef?: string;
    usingScope?: string;
    requirementRef?: string;
    code?: string;
}
interface ItmCreateEntityPatchOperation {
    kind: "create-entity";
    parentUid?: ItmUid;
    entity: Partial<ItmEntity>;
}
interface ItmRenameEntityPatchOperation {
    kind: "rename-entity";
    entityUid: ItmUid;
    label: string;
}
interface ItmDeleteEntityPatchOperation {
    kind: "delete-entity";
    entityUid: ItmUid;
}
interface ItmSetEntityTypePatchOperation {
    kind: "set-entity-type";
    entityUid: ItmUid;
    typeRef: ItmQualifiedName;
}
interface ItmSetAttributePatchOperation {
    kind: "set-attribute";
    targetKind: "entity" | "relationship";
    targetUid: ItmUid;
    key: string;
    value: ItmValue;
}
interface ItmDeleteAttributePatchOperation {
    kind: "delete-attribute";
    targetKind: "entity" | "relationship";
    targetUid: ItmUid;
    key: string;
}
interface ItmCreateRelationshipPatchOperation {
    kind: "create-relationship";
    sourceUid: ItmUid;
    targetUid: ItmUid;
    typeRef: ItmQualifiedName;
}
interface ItmDeleteRelationshipPatchOperation {
    kind: "delete-relationship";
    relationshipUid: ItmUid;
}
interface ItmUpdateViewDeltaPatchOperation {
    kind: "update-view-delta";
    viewUid: ItmUid;
    delta: ItmViewDelta;
}
type ItmPatchOperation = ItmCreateEntityPatchOperation | ItmRenameEntityPatchOperation | ItmDeleteEntityPatchOperation | ItmSetEntityTypePatchOperation | ItmSetAttributePatchOperation | ItmDeleteAttributePatchOperation | ItmCreateRelationshipPatchOperation | ItmDeleteRelationshipPatchOperation | ItmUpdateViewDeltaPatchOperation;
interface ItmModelPatch {
    uid: ItmUid;
    source: ItmPatchSource;
    operations: ItmPatchOperation[];
    diagnostics?: ItmDiagnostic[];
}
interface ItmDocument {
    format: "itm";
    modelVersion: string;
    uri?: string;
    metadata?: ItmMetadata;
    namespaces?: ItmNamespace[];
    entities: ItmEntity[];
    relationships: ItmRelationship[];
    roots?: ItmUid[];
    entityTypes?: ItmEntityType[];
    relationshipTypes?: ItmRelationshipType[];
    selectors?: ItmSelector[];
    validationRules?: ItmValidationRule[];
    pluginRequirements?: ItmPluginRequirement[];
    styles?: ItmStyleRule[];
    viewpoints?: ItmViewpoint[];
    views?: ItmView[];
    includes?: ItmInclude[];
    packages?: ItmPackage[];
    packageUsages?: ItmPackageUsage[];
    repositories?: ItmRepository[];
    overlays?: ItmOverlay[];
    directives?: ItmDirective[];
    diagnostics?: ItmDiagnostic[];
}

interface ItmProcessingResult<TValue> {
    value: TValue;
    diagnostics: ItmDiagnostic[];
}
declare class ItmDiagnosticError<TValue = unknown> extends Error {
    readonly diagnostics: ItmDiagnostic[];
    readonly partialResult: TValue | undefined;
    constructor(message: string, diagnostics: ItmDiagnostic[], partialResult?: TValue);
}
declare function hasErrorDiagnostics(diagnostics: readonly ItmDiagnostic[] | undefined): boolean;
declare function throwOnErrorDiagnostics<TValue>(diagnostics: readonly ItmDiagnostic[] | undefined, message: string, partialResult?: TValue): void;

interface ResolvedItmDocumentIndexes {
    entitiesByUid: ReadonlyMap<ItmUid, ResolvedItmEntity>;
    entitiesByQualifiedId: ReadonlyMap<string, ResolvedItmEntity>;
    relationshipsByUid: ReadonlyMap<ItmUid, ResolvedItmRelationship>;
    relationshipsByQualifiedId: ReadonlyMap<string, ResolvedItmRelationship>;
    namespacesByPrefix: ReadonlyMap<string, ItmNamespace>;
    viewpointsByName: ReadonlyMap<string, ResolvedItmViewpoint>;
    viewsByName: ReadonlyMap<string, ResolvedItmView>;
    entityTypesByName: ReadonlyMap<string, ResolvedItmEntityType>;
    relationshipTypesByName: ReadonlyMap<string, ResolvedItmRelationshipType>;
    packagesByUid: ReadonlyMap<ItmUid, ResolvedItmPackage>;
}
interface ResolvedItmSelectorContext extends Omit<ItmSelectorContext, "documentUid" | "currentViewUid" | "currentViewpointUid"> {
    document: ResolvedItmDocument;
    currentView?: ResolvedItmView;
    currentViewpoint?: ResolvedItmViewpoint;
}
interface ResolvedItmEntity extends Omit<ItmEntity, "parentId" | "childIds" | "incomingRelationshipIds" | "outgoingRelationshipIds" | "overlayIds"> {
    parent?: ResolvedItmEntity | undefined;
    children: ResolvedItmEntity[];
    incoming: ResolvedItmRelationship[];
    outgoing: ResolvedItmRelationship[];
    overlays: ResolvedItmOverlay[];
}
interface ResolvedItmRelationship extends Omit<ItmRelationship, "overlayIds"> {
    source: ResolvedItmEntity;
    target?: ResolvedItmEntity | undefined;
    overlays: ResolvedItmOverlay[];
}
interface ResolvedItmEntityType extends Omit<ItmEntityType, "superTypeRefs" | "defaultStyleUids"> {
    superTypes: ResolvedItmEntityType[];
    defaultStyles: ResolvedItmStyleRule[];
}
interface ResolvedItmRelationshipType extends Omit<ItmRelationshipType, "superTypeRefs" | "sourceTypeRefs" | "targetTypeRefs" | "inverseTypeRef" | "defaultStyleUids"> {
    superTypes: ResolvedItmRelationshipType[];
    sourceTypes: ResolvedItmEntityType[];
    targetTypes: ResolvedItmEntityType[];
    inverseType?: ResolvedItmRelationshipType | undefined;
    defaultStyles: ResolvedItmStyleRule[];
}
type ResolvedItmStyleRule = ItmStyleRule;
type ResolvedItmValidationRule = ItmValidationRule;
interface ResolvedItmViewpoint extends Omit<ItmViewpoint, "styleUids"> {
    styles: ResolvedItmStyleRule[];
}
interface ResolvedItmView extends ItmView {
    viewpoint?: ResolvedItmViewpoint | undefined;
}
interface ResolvedItmOverlay extends Omit<ItmOverlay, "relationshipAdditions"> {
    target?: ResolvedItmEntity | ResolvedItmRelationship | undefined;
    relationshipAdditions: ResolvedItmRelationship[];
}
interface ResolvedItmInclude extends ItmInclude {
    resolvedDocument?: ResolvedItmDocument | undefined;
}
interface ResolvedItmPackage extends Omit<ItmPackage, "entityTypes" | "relationshipTypes" | "validationRules" | "styles" | "viewpoints"> {
    entityTypes: ResolvedItmEntityType[];
    relationshipTypes: ResolvedItmRelationshipType[];
    validationRules: ResolvedItmValidationRule[];
    styles: ResolvedItmStyleRule[];
    viewpoints: ResolvedItmViewpoint[];
}
interface ResolvedItmPackageUsage extends ItmPackageUsage {
    package?: ResolvedItmPackage | undefined;
}
interface ResolvedItmDiagnostic extends Omit<ItmDiagnostic, "entityUid" | "relationshipUid" | "ruleUid" | "viewUid" | "viewpointUid" | "packageUid"> {
    entity?: ResolvedItmEntity | undefined;
    relationship?: ResolvedItmRelationship | undefined;
    directive?: ItmDirective | undefined;
    rule?: ResolvedItmValidationRule | undefined;
    view?: ResolvedItmView | undefined;
    viewpoint?: ResolvedItmViewpoint | undefined;
    namespace?: ItmNamespace | undefined;
    package?: ResolvedItmPackage | undefined;
}
interface ResolvedItmDocument extends Omit<ItmDocument, "entities" | "relationships" | "entityTypes" | "relationshipTypes" | "viewpoints" | "views" | "includes" | "packages" | "packageUsages" | "overlays" | "diagnostics"> {
    entities: ResolvedItmEntity[];
    relationships: ResolvedItmRelationship[];
    entityTypes?: ResolvedItmEntityType[] | undefined;
    relationshipTypes?: ResolvedItmRelationshipType[] | undefined;
    viewpoints?: ResolvedItmViewpoint[] | undefined;
    views?: ResolvedItmView[] | undefined;
    includes?: ResolvedItmInclude[] | undefined;
    packages?: ResolvedItmPackage[] | undefined;
    packageUsages?: ResolvedItmPackageUsage[] | undefined;
    overlays?: ResolvedItmOverlay[] | undefined;
    diagnostics?: ResolvedItmDiagnostic[] | undefined;
    indexes: ResolvedItmDocumentIndexes;
}

declare function createDocumentIndexes(document: ItmDocument): ResolvedItmDocumentIndexes;
declare function resolveDocument(document: ItmDocument): ResolvedItmDocument;
declare function getEntityByUid(document: ResolvedItmDocument, uid: ItmUid): ResolvedItmEntity | undefined;
declare function getRelationshipByUid(document: ResolvedItmDocument, uid: ItmUid): ResolvedItmRelationship | undefined;
declare function isResolvedDocument(value: ItmDocument | ResolvedItmDocument): value is ResolvedItmDocument;

interface ParseItmOptions {
    uri?: string;
    generateImplicitRelationships?: boolean;
    defaultNamespace?: string;
    strict?: boolean;
    maxIncludeDepth?: number;
    sourceProvider?: ItmSourceProvider;
}
declare function parseItmResult(text: string, options?: ParseItmOptions): ItmProcessingResult<ItmDocument>;
declare function parseItm(text: string, options?: ParseItmOptions): ItmDocument;
declare function parseDocument(text: string, options?: ParseItmOptions): ItmDocument;
declare function parseDocumentResult(text: string, options?: ParseItmOptions): ItmProcessingResult<ItmDocument>;

interface ItmLoadedIncludeSource {
    text: string;
    uri?: string;
}
interface ItmSourceRequest {
    include: ItmInclude;
    sourceDocument: ItmDocument;
    fromUri?: string;
    rawTarget: string;
    target: string;
    includeStack: string[];
}
interface ItmSourceProvider {
    read(request: ItmSourceRequest): Promise<ItmLoadedIncludeSource | undefined> | ItmLoadedIncludeSource | undefined;
}
interface ItmIncludeProviderContext {
    include: ItmInclude;
    sourceDocument: ItmDocument;
    resolvedTarget: string;
}
interface ItmIncludeProvider {
    name?: string;
    load(target: string, context: ItmIncludeProviderContext): Promise<ItmLoadedIncludeSource | undefined> | ItmLoadedIncludeSource | undefined;
}
interface ComposeDocumentOptions {
    uri?: string;
    parseOptions?: ParseItmOptions;
    includeProviders?: readonly ItmIncludeProvider[];
    sourceProvider?: ItmSourceProvider;
    maxIncludeDepth?: number;
}
declare function composeDocument(document: ItmDocument, options?: ComposeDocumentOptions): Promise<ItmDocument>;
declare function composeText(text: string, options?: ComposeDocumentOptions): Promise<ItmDocument>;
declare function composeDocumentResult(document: ItmDocument, options?: ComposeDocumentOptions): Promise<ItmProcessingResult<ItmDocument>>;
declare function parseEffectiveDocument(text: string, options?: ParseItmOptions, parsed?: ItmProcessingResult<ItmDocument>): Promise<ItmProcessingResult<ItmDocument>>;
declare function parseDocumentResultAsync(text: string, options?: ParseItmOptions): Promise<ItmProcessingResult<ItmDocument>>;
declare function createBaseUrlIncludeProvider(baseUrl: string, options?: {
    fetchText?: (url: string) => Promise<string>;
}): ItmIncludeProvider;
declare function createBaseUrlSourceProvider(baseUrl: string, options?: {
    fetchText?: (url: string) => Promise<string>;
}): ItmSourceProvider;

/**
 * Draft input for creating an entity through {@link ItmDocumentBuilder.addEntity}.
 *
 * The builder accepts either a generated `uid`, a local `id`, or a fully qualified
 * `qualifiedId`. When `id` is provided and the document metadata contains a
 * `defaultNamespace`, the builder derives `qualifiedId` automatically.
 */
interface ItmEntityDraft {
    uid?: string;
    id?: string;
    qualifiedId?: string;
    namespacePrefix?: string;
    localId?: string;
    label: string;
    typeRef?: string;
    tags?: string[];
    attributes?: ItmAttributeBag | Record<string, ItmValue>;
    description?: ItmDescription | string;
    parent?: string;
    rank?: number;
}
/**
 * Update payload for {@link ItmDocumentBuilder.renameEntity}.
 */
interface ItmEntityRenameInput {
    id?: string;
    qualifiedId?: string;
    namespacePrefix?: string;
    label?: string;
    typeRef?: string;
}
/**
 * Move payload for {@link ItmDocumentBuilder.moveEntity}.
 */
interface ItmEntityMoveInput {
    parent?: string | null;
    index?: number;
}
/**
 * Draft input for creating an explicit relationship.
 *
 * `source`, `target`, and similar reference fields accept either a uid, a local id,
 * or a qualified id when that object already exists in the builder document.
 */
interface ItmRelationshipDraft {
    uid?: string;
    id?: string;
    source: string;
    target?: string;
    targetRef?: string;
    typeRef?: string;
    attributes?: ItmAttributeBag | Record<string, ItmValue>;
    sourceSyntax?: ItmSourceSyntax;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateRelationship}.
 */
interface ItmRelationshipUpdateInput {
    id?: string;
    typeRef?: string;
    target?: string;
    targetRef?: string;
    attributes?: ItmAttributeBag | Record<string, ItmValue> | null;
    sourceSyntax?: ItmSourceSyntax;
}
/**
 * Lightweight pipeline step input used by the builder authoring API.
 */
interface ItmPipelineStepDraft {
    uid?: string;
    operation?: ItmPipelineOperation;
    provider?: string;
    arguments?: Record<string, ItmValue>;
}
/**
 * Flexible pipeline input accepted by builder methods.
 *
 * Consumers can pass a fully materialized `ItmPipeline` or a concise array of step
 * drafts and plugin names. The builder normalizes both forms into canonical pipeline
 * steps with stable uids.
 */
type ItmPipelineInput = ItmPipeline | Array<string | ItmPipelineStepDraft>;
/**
 * Draft input for creating a viewpoint.
 */
interface ItmViewpointDraft {
    uid?: string;
    name: string;
    title?: string;
    description?: string;
    pipeline?: ItmPipelineInput;
    parameters?: ItmViewpointParameter[];
    supportsVisualEditing?: boolean;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateViewpoint}.
 */
interface ItmViewpointUpdateInput {
    title?: string;
    description?: string;
    pipeline?: ItmPipelineInput;
    parameters?: ItmViewpointParameter[];
    supportsVisualEditing?: boolean;
}
/**
 * Draft input for creating a view.
 */
interface ItmViewDraft {
    uid?: string;
    name: string;
    title?: string;
    viewpoint: string;
    parameters?: Record<string, ItmValue>;
    deltas?: ItmViewDelta[];
    generatedAssets?: ItmGeneratedAsset[];
    notes?: string[];
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateView}.
 */
interface ItmViewUpdateInput {
    title?: string;
    viewpoint?: string;
    parameters?: Record<string, ItmValue>;
    deltas?: ItmViewDelta[];
    generatedAssets?: ItmGeneratedAsset[];
    notes?: string[];
}
/**
 * Draft input for creating an overlay.
 */
interface ItmOverlayDraft {
    uid?: string;
    target: string;
    targetKind?: "entity" | "relationship";
    replacementLabel?: string;
    replacementTypeRef?: string;
    attributes?: ItmAttributeBag | Record<string, ItmValue>;
    description?: string;
    relationshipAdditions?: ItmRelationshipDraft[];
    policy?: ItmOverlayPolicy;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateOverlay}.
 */
interface ItmOverlayUpdateInput {
    replacementLabel?: string;
    replacementTypeRef?: string;
    attributes?: ItmAttributeBag | Record<string, ItmValue> | null;
    description?: string | null;
    relationshipAdditions?: ItmRelationshipDraft[];
    policy?: ItmOverlayPolicy;
}
/**
 * Draft input for creating an entity type definition.
 */
interface ItmEntityTypeDraft {
    uid?: string;
    name: string;
    description?: string;
    requiredAttributes?: string[];
    optionalAttributes?: string[];
    superTypeRefs?: string[];
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateEntityType}.
 */
interface ItmEntityTypeUpdateInput {
    description?: string;
    requiredAttributes?: string[];
    optionalAttributes?: string[];
    superTypeRefs?: string[];
}
/**
 * Draft input for creating a relationship type definition.
 */
interface ItmRelationshipTypeDraft {
    uid?: string;
    name: string;
    description?: string;
    superTypeRefs?: string[];
    sourceTypeRefs?: string[];
    targetTypeRefs?: string[];
    inverseTypeRef?: string;
    requiredAttributes?: string[];
    optionalAttributes?: string[];
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateRelationshipType}.
 */
interface ItmRelationshipTypeUpdateInput {
    description?: string;
    superTypeRefs?: string[];
    sourceTypeRefs?: string[];
    targetTypeRefs?: string[];
    inverseTypeRef?: string;
    requiredAttributes?: string[];
    optionalAttributes?: string[];
}
/**
 * Draft input for creating a document-level style rule.
 */
interface ItmStyleRuleDraft {
    uid?: string;
    selector: string;
    style: ItmAttributeBag | Record<string, ItmValue>;
    origin?: ItmStyleOrigin;
    priority?: number;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateStyleRule}.
 */
interface ItmStyleRuleUpdateInput {
    selector?: string;
    style?: ItmAttributeBag | Record<string, ItmValue>;
    origin?: ItmStyleOrigin;
    priority?: number;
}
/**
 * Draft input for creating a validation rule.
 */
interface ItmValidationRuleDraft {
    uid?: string;
    name: string;
    selector: string;
    pipeline?: ItmPipelineInput;
    severity?: ItmSeverity;
    message?: string;
    enabled?: boolean;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateValidationRule}.
 */
interface ItmValidationRuleUpdateInput {
    selector?: string;
    pipeline?: ItmPipelineInput;
    severity?: ItmSeverity;
    message?: string;
    enabled?: boolean;
}
/**
 * Draft input for creating a repository directive.
 */
interface ItmRepositoryDraft {
    name: string;
    location: string;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updateRepository}.
 */
interface ItmRepositoryUpdateInput {
    location?: string;
}
/**
 * Draft input for creating an include directive.
 */
interface ItmIncludeDraft {
    target: string;
}
/**
 * Draft input for creating a plugin requirement directive.
 */
interface ItmPluginRequirementDraft {
    name: string;
    versionRange?: string;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updatePluginRequirement}.
 */
interface ItmPluginRequirementUpdateInput {
    versionRange?: string;
}
/**
 * Draft input for creating a package directive.
 */
interface ItmPackageDraft {
    uid?: string;
    name: string;
    description?: string;
}
/**
 * Update payload for {@link ItmDocumentBuilder.updatePackage}.
 */
interface ItmPackageUpdateInput {
    description?: string;
}
/**
 * Draft input for creating a `%using` package usage directive.
 */
interface ItmPackageUsageDraft {
    packageRef: string;
}
/**
 * Creates a mutable authoring surface over an ITM document.
 *
 * The builder keeps parser-style derived state in sync as you mutate the model,
 * including qualified ids, root entity lists, containment and ordering links,
 * relationship back-references, and overlay attachment ids.
 */
declare class ItmDocumentBuilder {
    private document;
    constructor(document?: Partial<ItmDocument>);
    static fromDocument(document: ItmDocument): ItmDocumentBuilder;
    setMetadata(metadata: ItmMetadata | undefined): this;
    upsertNamespace(namespace: ItmNamespace): this;
    findEntity(reference: string): ItmEntity | undefined;
    findRelationship(reference: string): ItmRelationship | undefined;
    findViewpoint(reference: string): ItmViewpoint | undefined;
    findView(reference: string): ItmView | undefined;
    findOverlay(reference: string): ItmOverlay | undefined;
    findEntityType(reference: string): ItmEntityType | undefined;
    findRelationshipType(reference: string): ItmRelationshipType | undefined;
    findStyleRule(reference: string): ItmStyleRule | undefined;
    findValidationRule(reference: string): ItmValidationRule | undefined;
    findRepository(reference: string): ItmRepository | undefined;
    findInclude(reference: string): ItmInclude | undefined;
    findPluginRequirement(reference: string): ItmPluginRequirement | undefined;
    findPackage(reference: string): ItmPackage | undefined;
    findPackageUsage(reference: string): ItmPackageUsage | undefined;
    addEntity(draft: ItmEntityDraft): ItmEntity;
    renameEntity(reference: string, changes: ItmEntityRenameInput): ItmEntity;
    moveEntity(reference: string, move: ItmEntityMoveInput): ItmEntity;
    removeEntity(reference: string): ItmEntity | undefined;
    addRelationship(draft: ItmRelationshipDraft): ItmRelationship;
    updateRelationship(reference: string, changes: ItmRelationshipUpdateInput): ItmRelationship;
    removeRelationship(reference: string | ((relationship: ItmRelationship) => boolean)): number;
    addViewpoint(draft: ItmViewpointDraft): ItmViewpoint;
    updateViewpoint(reference: string, changes: ItmViewpointUpdateInput): ItmViewpoint;
    removeViewpoint(reference: string): ItmViewpoint | undefined;
    addView(draft: ItmViewDraft): ItmView;
    updateView(reference: string, changes: ItmViewUpdateInput): ItmView;
    removeView(reference: string): ItmView | undefined;
    addOverlay(draft: ItmOverlayDraft): ItmOverlay;
    updateOverlay(reference: string, changes: ItmOverlayUpdateInput): ItmOverlay;
    removeOverlay(reference: string): ItmOverlay | undefined;
    addEntityType(draft: ItmEntityTypeDraft): ItmEntityType;
    updateEntityType(reference: string, changes: ItmEntityTypeUpdateInput): ItmEntityType;
    removeEntityType(reference: string): ItmEntityType | undefined;
    addRelationshipType(draft: ItmRelationshipTypeDraft): ItmRelationshipType;
    updateRelationshipType(reference: string, changes: ItmRelationshipTypeUpdateInput): ItmRelationshipType;
    removeRelationshipType(reference: string): ItmRelationshipType | undefined;
    addStyleRule(draft: ItmStyleRuleDraft): ItmStyleRule;
    updateStyleRule(reference: string, changes: ItmStyleRuleUpdateInput): ItmStyleRule;
    removeStyleRule(reference: string): ItmStyleRule | undefined;
    addValidationRule(draft: ItmValidationRuleDraft): ItmValidationRule;
    updateValidationRule(reference: string, changes: ItmValidationRuleUpdateInput): ItmValidationRule;
    removeValidationRule(reference: string): ItmValidationRule | undefined;
    addRepository(draft: ItmRepositoryDraft): ItmRepository;
    updateRepository(reference: string, changes: ItmRepositoryUpdateInput): ItmRepository;
    removeRepository(reference: string): ItmRepository | undefined;
    addInclude(draft: ItmIncludeDraft): ItmInclude;
    removeInclude(reference: string): ItmInclude | undefined;
    addPluginRequirement(draft: ItmPluginRequirementDraft): ItmPluginRequirement;
    updatePluginRequirement(reference: string, changes: ItmPluginRequirementUpdateInput): ItmPluginRequirement;
    removePluginRequirement(reference: string): ItmPluginRequirement | undefined;
    addPackage(draft: ItmPackageDraft): ItmPackage;
    updatePackage(reference: string, changes: ItmPackageUpdateInput): ItmPackage;
    removePackage(reference: string): ItmPackage | undefined;
    addPackageUsage(draft: ItmPackageUsageDraft): ItmPackageUsage;
    removePackageUsage(reference: string): ItmPackageUsage | undefined;
    toDocument(): ItmDocument;
    private defaultNamespace;
    private defaultRelationshipType;
    private normalize;
    private normalizePipeline;
    private toAttributePatches;
    private createOverlay;
    private resolveOverlayTarget;
    private normalizeOverlayRelationshipAdditions;
    private normalizeExistingOverlayRelationshipAdditions;
    private assignDepths;
    private attachOverlay;
    private normalizeExplicitRelationship;
    private createImplicitRelationship;
    private createEntityUid;
    private createRelationshipUid;
    private resolveEntityNames;
    private requireEntity;
    private requireViewpoint;
    private requireView;
    private requireOverlay;
    private requireEntityType;
    private requireRelationshipType;
    private requireStyleRule;
    private requireValidationRule;
    private requireRepository;
    private requirePluginRequirement;
    private requirePackage;
    private findEntityInternal;
    private requireRelationship;
    private isDescendant;
}

declare function createAttributeBag(values?: Record<string, ItmValue>): ItmAttributeBag;
declare function createEntity(entity: Omit<ItmEntity, "kind">): ItmEntity;
declare function createRelationship(relationship: Omit<ItmRelationship, "kind">): ItmRelationship;
declare function createDocument(document?: Partial<ItmDocument>): ItmDocument;

interface SerializeItmOptions {
    lineEnding?: "lf" | "crlf";
}
declare function serializeDocumentResult(document: ItmDocument, options?: SerializeItmOptions): ItmProcessingResult<string>;
declare function serializeDocument(document: ItmDocument, options?: SerializeItmOptions): string;
declare function serializeItm(document: ItmDocument, options?: SerializeItmOptions): string;

interface ItmTypeHierarchy {
    entityAncestorsByName: ReadonlyMap<string, readonly string[]>;
    entityDescendantsByName: ReadonlyMap<string, readonly string[]>;
    relationshipAncestorsByName: ReadonlyMap<string, readonly string[]>;
    relationshipDescendantsByName: ReadonlyMap<string, readonly string[]>;
}
interface CanonicalGraphNode {
    id: string;
    uid: string;
    qualifiedId?: string;
    label: string;
    typeRef?: string;
    description?: string;
    parentId?: string;
    properties: Record<string, ItmValue>;
}
interface CanonicalGraphEdge {
    id: string;
    uid: string;
    relationshipId?: string;
    sourceId: string;
    targetId?: string;
    targetRelationshipId?: string;
    targetRef?: string;
    typeRef: string;
    relationshipKind: ItmRelationship["relationshipKind"];
    implicit: boolean;
    properties: Record<string, ItmValue>;
}
interface CanonicalGraphOrganization {
    id: string;
    label: string;
    children: CanonicalGraphOrganization[];
}
interface CanonicalGraphView {
    id: string;
    name: string;
    title?: string;
    viewpointRef: string;
    viewpoint?: ItmViewpoint;
    parameters?: Record<string, ItmValue>;
    notes?: string[];
}
interface CanonicalGraphModel {
    metadata?: ItmDocument["metadata"];
    nodes: CanonicalGraphNode[];
    edges: CanonicalGraphEdge[];
    organizations: CanonicalGraphOrganization[];
    views: CanonicalGraphView[];
    diagnostics: ItmDiagnostic[];
}
interface CreateCanonicalGraphOptions {
    includeImplicitRelationships?: boolean;
}
declare function createTypeHierarchy(document: ItmDocument | ResolvedItmDocument): ItmTypeHierarchy;
declare function expandEntityTypeSelection(document: ItmDocument | ResolvedItmDocument, typeRefs: readonly string[], includeSubtypes?: boolean): string[];
declare function expandRelationshipTypeSelection(document: ItmDocument | ResolvedItmDocument, typeRefs: readonly string[], includeSubtypes?: boolean): string[];
declare function isEntityOfType(document: ItmDocument | ResolvedItmDocument, entity: Pick<ItmEntity, "typeRef">, typeRef: string, includeSubtypes?: boolean): boolean;
declare function isRelationshipOfType(document: ItmDocument | ResolvedItmDocument, relationship: Pick<ItmRelationship, "typeRef">, typeRef: string, includeSubtypes?: boolean): boolean;
declare function getStableRelationshipId(relationship: Pick<ItmRelationship, "id" | "sourceRef" | "sourceId" | "targetRef" | "targetId" | "typeRef">, sequence?: number): string;
declare function createCanonicalGraph(document: ItmDocument | ResolvedItmDocument, options?: CreateCanonicalGraphOptions): CanonicalGraphModel;

interface ArchimateAllowedRelationship {
    relationshipType: string;
    sourceType: string;
    targetType: string;
    targetKind?: "entity" | "relationship";
}
interface ValidateArchimateOptions {
    matrix?: readonly ArchimateAllowedRelationship[];
}
interface ExportArchimateExchangeOptions extends ValidateArchimateOptions {
    modelIdentifier?: string;
    language?: string;
    includeOrganizations?: boolean;
    includeImplicitRelationships?: boolean;
}
interface ImportArchimateExchangeOptions {
    defaultNamespace?: string;
    namespaceUri?: string;
}
interface ImportArchimateExchangeAsItmOptions extends ImportArchimateExchangeOptions, SerializeItmOptions {
}
declare function validateArchiMateRules(document: ItmDocument | ResolvedItmDocument, options?: ValidateArchimateOptions): ItmDiagnostic[];
declare function validateArchiMateExchangeReadiness(document: ItmDocument | ResolvedItmDocument, options?: ValidateArchimateOptions): ItmDiagnostic[];
declare function exportArchiMateExchangeResult(document: ItmDocument | ResolvedItmDocument, options?: ExportArchimateExchangeOptions): ItmProcessingResult<string>;
declare function exportArchiMateExchange(document: ItmDocument | ResolvedItmDocument, options?: ExportArchimateExchangeOptions): string;
declare function importArchiMateExchangeResult(xml: string, options?: ImportArchimateExchangeOptions): ItmProcessingResult<ItmDocument>;
declare function importArchiMateExchange(xml: string, options?: ImportArchimateExchangeOptions): ItmDocument;
declare function importArchiMateExchangeAsItmResult(xml: string, options?: ImportArchimateExchangeAsItmOptions): ItmProcessingResult<string>;
declare function importArchiMateExchangeAsItm(xml: string, options?: ImportArchimateExchangeAsItmOptions): string;

interface ExportBpmnXmlOptions {
    definitionsId?: string;
    targetNamespace?: string;
}
interface ImportBpmnXmlOptions {
    defaultNamespace?: string;
    namespaceUri?: string;
}
interface ImportBpmnXmlAsItmOptions extends ImportBpmnXmlOptions, SerializeItmOptions {
}
declare function validateBpmnRules(document: ItmDocument | ResolvedItmDocument): ItmDiagnostic[];
declare function validateBpmnExportReadiness(document: ItmDocument | ResolvedItmDocument): ItmDiagnostic[];
declare function exportBpmnXmlResult(document: ItmDocument | ResolvedItmDocument, options?: ExportBpmnXmlOptions): ItmProcessingResult<string>;
declare function exportBpmnXml(document: ItmDocument | ResolvedItmDocument, options?: ExportBpmnXmlOptions): string;
declare function importBpmnXmlResult(xml: string, options?: ImportBpmnXmlOptions): ItmProcessingResult<ItmDocument>;
declare function importBpmnXml(xml: string, options?: ImportBpmnXmlOptions): ItmDocument;
declare function importBpmnXmlAsItmResult(xml: string, options?: ImportBpmnXmlAsItmOptions): ItmProcessingResult<string>;
declare function importBpmnXmlAsItm(xml: string, options?: ImportBpmnXmlAsItmOptions): string;

interface ItmStdAsset {
    key: string;
    mediaType: "text/itm";
    aliases: string[];
    relativePath: string;
}
interface LoadedItmStdAsset extends ItmStdAsset {
    text: string;
    uri: string;
}
declare function listStdAssets(): ItmStdAsset[];
declare function readStdAsset(key: string): ItmStdAsset | undefined;
declare function loadStdAsset(key: string): Promise<LoadedItmStdAsset | undefined>;
declare function createStdIncludeProvider(): ItmIncludeProvider;

export { type ArchimateAllowedRelationship, type CanonicalGraphEdge, type CanonicalGraphModel, type CanonicalGraphNode, type CanonicalGraphOrganization, type CanonicalGraphView, type ComposeDocumentOptions, type CreateCanonicalGraphOptions, type ExportArchimateExchangeOptions, type ExportBpmnXmlOptions, type ImportArchimateExchangeAsItmOptions, type ImportArchimateExchangeOptions, type ImportBpmnXmlAsItmOptions, type ImportBpmnXmlOptions, type ItmAttributeBag, type ItmAttributePatch, type ItmAttributePatchOperation, type ItmCreateEntityPatchOperation, type ItmCreateRelationshipPatchOperation, type ItmDeleteAttributePatchOperation, type ItmDeleteEntityPatchOperation, type ItmDeleteRelationshipPatchOperation, type ItmDescription, type ItmDescriptionPatch, type ItmDescriptionPatchOperation, type ItmDiagnostic, ItmDiagnosticError, type ItmDirective, type ItmDocument, ItmDocumentBuilder, type ItmElement, type ItmEmbeddedBlock, type ItmEntity, type ItmEntityDraft, type ItmEntityMoveInput, type ItmEntityRenameInput, type ItmEntityType, type ItmEntityTypeDraft, type ItmEntityTypeUpdateInput, type ItmExpandedCollapsedDelta, type ItmGeneratedAsset, type ItmGeneratedAssetKind, type ItmHiddenDelta, type ItmInclude, type ItmIncludeDraft, type ItmIncludeProvider, type ItmIncludeProviderContext, type ItmIncludeStatus, type ItmLabelOverrideDelta, type ItmLoadedIncludeSource, type ItmLocalName, type ItmMetadata, type ItmModelPatch, type ItmMovedDelta, type ItmNamespace, type ItmOverlay, type ItmOverlayDraft, type ItmOverlayPolicy, type ItmOverlayUpdateInput, type ItmPackage, type ItmPackageDraft, type ItmPackageUpdateInput, type ItmPackageUsage, type ItmPackageUsageDraft, type ItmPackageUsageScope, type ItmPatchOperation, type ItmPatchSource, type ItmPinnedDelta, type ItmPipeline, type ItmPipelineInput, type ItmPipelineOperation, type ItmPipelineStep, type ItmPipelineStepDraft, type ItmPluginCapability, type ItmPluginProvider, type ItmPluginRequirement, type ItmPluginRequirementDraft, type ItmPluginRequirementUpdateInput, type ItmPrimitive, type ItmProcessingResult, type ItmQualifiedName, type ItmRelationship, type ItmRelationshipDraft, type ItmRelationshipKind, type ItmRelationshipType, type ItmRelationshipTypeDraft, type ItmRelationshipTypeUpdateInput, type ItmRelationshipUpdateInput, type ItmRenameEntityPatchOperation, type ItmRepository, type ItmRepositoryDraft, type ItmRepositoryKind, type ItmRepositoryUpdateInput, type ItmSelector, type ItmSelectorContext, type ItmSelectorExpression, type ItmSelectorExpressionKind, type ItmSetAttributePatchOperation, type ItmSetEntityTypePatchOperation, type ItmSeverity, type ItmSourceProvider, type ItmSourceRange, type ItmSourceRequest, type ItmSourceSyntax, type ItmStdAsset, type ItmStyleOrigin, type ItmStyleOverrideDelta, type ItmStyleRule, type ItmStyleRuleDraft, type ItmStyleRuleUpdateInput, type ItmTypeHierarchy, type ItmUid, type ItmUpdateViewDeltaPatchOperation, type ItmValidationMode, type ItmValidationRule, type ItmValidationRuleDraft, type ItmValidationRuleUpdateInput, type ItmValue, type ItmView, type ItmViewDelta, type ItmViewDraft, type ItmViewUpdateInput, type ItmViewpoint, type ItmViewpointDraft, type ItmViewpointParameter, type ItmViewpointParameterType, type ItmViewpointUpdateInput, type LoadedItmStdAsset, type ParseItmOptions, type ResolvedItmDiagnostic, type ResolvedItmDocument, type ResolvedItmDocumentIndexes, type ResolvedItmEntity, type ResolvedItmEntityType, type ResolvedItmInclude, type ResolvedItmOverlay, type ResolvedItmPackage, type ResolvedItmPackageUsage, type ResolvedItmRelationship, type ResolvedItmRelationshipType, type ResolvedItmSelectorContext, type ResolvedItmStyleRule, type ResolvedItmValidationRule, type ResolvedItmView, type ResolvedItmViewpoint, type SerializeItmOptions, type ValidateArchimateOptions, composeDocument, composeDocumentResult, composeText, createAttributeBag, createBaseUrlIncludeProvider, createBaseUrlSourceProvider, createCanonicalGraph, createDocument, createDocumentIndexes, createEntity, createRelationship, createStdIncludeProvider, createTypeHierarchy, expandEntityTypeSelection, expandRelationshipTypeSelection, exportArchiMateExchange, exportArchiMateExchangeResult, exportBpmnXml, exportBpmnXmlResult, getEntityByUid, getRelationshipByUid, getStableRelationshipId, hasErrorDiagnostics, importArchiMateExchange, importArchiMateExchangeAsItm, importArchiMateExchangeAsItmResult, importArchiMateExchangeResult, importBpmnXml, importBpmnXmlAsItm, importBpmnXmlAsItmResult, importBpmnXmlResult, isEntityOfType, isRelationshipOfType, isResolvedDocument, listStdAssets, loadStdAsset, parseDocument, parseDocumentResult, parseDocumentResultAsync, parseEffectiveDocument, parseItm, parseItmResult, readStdAsset, resolveDocument, serializeDocument, serializeDocumentResult, serializeItm, throwOnErrorDiagnostics, validateArchiMateExchangeReadiness, validateArchiMateRules, validateBpmnExportReadiness, validateBpmnRules };
