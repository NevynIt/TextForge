import type {
  Capability,
  ContributionManifest,
  ContributionRegistry,
  DocumentContributionContext,
  MarkdownFenceHandlerContribution,
  ResourceRef,
} from '@textforge/core';
import type {
  WorkspaceRepositoryResolverOptions,
  WorkspaceService,
} from '@textforge/workspace';
import type {
  VisualItmDiagnostic,
  VisualItmDocument,
} from '@textforge/visual-itm';

export * from './upstream/index.js';

export interface ItmLoadDocumentResult {
  readonly document: ItmDocument;
  readonly resolvedDocument: ResolvedItmDocument;
  readonly effectiveDocument: ItmDocument;
  readonly effectiveResolvedDocument: ResolvedItmDocument;
  readonly capabilityContext?: DocumentContributionContext;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic>;
}

export interface ItmDocumentEvaluationOptions {
  readonly contributionRegistry?: ContributionRegistry;
  readonly capabilityContext?: DocumentContributionContext;
  readonly documentResource?: Partial<ResourceRef> & { readonly id?: string };
}

export interface LoadItmDocumentOptions extends ItmDocumentEvaluationOptions {
  readonly strict?: boolean;
  readonly uri?: string;
  readonly includeProviders?: ReadonlyArray<ItmIncludeProvider>;
  readonly includeStdProfiles?: boolean;
  readonly sourceProvider?: ItmSourceProvider;
  readonly maxIncludeDepth?: number;
  readonly repositoryResolution?: ItmRepositoryResolutionOptions;
}

export interface ItmRepositoryResolutionOptions extends WorkspaceRepositoryResolverOptions {}

export interface CreateWorkspaceItmIncludeProviderOptions extends ItmRepositoryResolutionOptions {
  readonly name?: string;
  readonly basePath?: string;
}

export interface ValidateItmDocumentOptions extends ItmDocumentEvaluationOptions {
  readonly repositoryResolution?: ItmRepositoryResolutionOptions;
}

export interface ProjectItmDocumentOptions extends ItmDocumentEvaluationOptions {
  readonly view?: string;
  readonly viewpoint?: string;
  readonly select?: string;
  readonly title?: string;
  readonly projection?: ItmProjectionKind;
  readonly includeImplicitRelationships?: boolean;
  readonly includeAncestors?: boolean;
}

export type ItmProjectionKind = 'tree' | 'graph' | 'mindmap' | 'catalogue' | 'matrix' | 'report';

export interface ItmProjectedTreeNode {
  readonly id: string;
  readonly uid: string;
  readonly label: string;
  readonly typeRef?: string;
  readonly description?: string;
  readonly tags: ReadonlyArray<string>;
  readonly parentId?: string;
  readonly depth: number;
  readonly path: ReadonlyArray<string>;
  readonly childCount: number;
  readonly style: Readonly<Record<string, ItmValue>>;
  readonly children: ReadonlyArray<ItmProjectedTreeNode>;
}

export interface ItmTreeProjection {
  readonly roots: ReadonlyArray<ItmProjectedTreeNode>;
  readonly maxDepth: number;
  readonly nodeCount: number;
}

export interface ItmProjectedGraphNode extends CanonicalGraphNode {
  readonly description?: string;
  readonly tags: ReadonlyArray<string>;
  readonly childCount: number;
  readonly depth: number;
  readonly inDegree: number;
  readonly outDegree: number;
  readonly style: Readonly<Record<string, ItmValue>>;
}

export interface ItmProjectedGraphEdge extends CanonicalGraphEdge {
  readonly style?: Readonly<Record<string, ItmValue>>;
  readonly label: string;
  readonly sourceLabel: string;
  readonly targetLabel?: string;
}

export interface ItmGraphProjection {
  readonly nodes: ReadonlyArray<ItmProjectedGraphNode>;
  readonly edges: ReadonlyArray<ItmProjectedGraphEdge>;
  readonly rootNodeIds: ReadonlyArray<string>;
  readonly relationshipTypeCounts: ReadonlyArray<{
    readonly typeRef: string;
    readonly count: number;
  }>;
}

export interface ItmMindmapNode {
  readonly id: string;
  readonly uid?: string;
  readonly label: string;
  readonly typeRef?: string;
  readonly description?: string;
  readonly side: 'left' | 'right' | 'center';
  readonly depth: number;
  readonly children: ReadonlyArray<ItmMindmapNode>;
}

export interface ItmMindmapProjection {
  readonly root: ItmMindmapNode;
  readonly nodeCount: number;
}

export interface ItmCatalogueProjection {
  readonly entities: ReadonlyArray<{
    readonly id: string;
    readonly uid: string;
    readonly label: string;
    readonly typeRef?: string;
    readonly parentLabel?: string;
    readonly tags: ReadonlyArray<string>;
    readonly description?: string;
    readonly attributes: Readonly<Record<string, ItmValue>>;
  }>;
  readonly relationships: ReadonlyArray<{
    readonly id: string;
    readonly uid: string;
    readonly label: string;
    readonly typeRef?: string;
    readonly relationshipKind: ItmRelationship['relationshipKind'];
    readonly sourceLabel: string;
    readonly targetLabel?: string;
    readonly implicit: boolean;
    readonly attributes: Readonly<Record<string, ItmValue>>;
  }>;
  readonly views: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly title?: string;
    readonly viewpointRef: string;
    readonly parameters: Readonly<Record<string, ItmValue>>;
    readonly notes: ReadonlyArray<string>;
  }>;
  readonly viewpoints: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly title?: string;
    readonly supportsVisualEditing: boolean;
    readonly stepCount: number;
  }>;
}

export interface ItmMatrixProjection {
  readonly rows: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly typeRef?: string;
  }>;
  readonly columns: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly typeRef?: string;
  }>;
  readonly cells: ReadonlyArray<{
    readonly rowId: string;
    readonly columnId: string;
    readonly count: number;
    readonly relationshipTypes: ReadonlyArray<string>;
    readonly relationshipKinds: ReadonlyArray<ItmRelationship['relationshipKind']>;
    readonly edgeIds: ReadonlyArray<string>;
  }>;
  readonly nonEmptyCellCount: number;
}

export interface ItmReportProjection {
  readonly title: string;
  readonly summary: {
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly rootCount: number;
    readonly viewCount: number;
    readonly viewpointCount: number;
    readonly diagnosticCount: number;
    readonly relationshipTypeCount: number;
    readonly nonEmptyMatrixCellCount: number;
  };
  readonly sections: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly items: ReadonlyArray<string>;
  }>;
}

export interface ItmProjectedDocument {
  readonly document: ItmDocument;
  readonly resolvedDocument: ResolvedItmDocument;
  readonly sourceDocument?: ItmDocument;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic>;
  readonly nodes: ReadonlyArray<CanonicalGraphNode>;
  readonly edges: ReadonlyArray<CanonicalGraphEdge & {
    readonly style?: Readonly<Record<string, ItmValue>>;
  }>;
  readonly views: ReadonlyArray<CanonicalGraphView>;
  readonly view?: ItmView;
  readonly viewpoint?: ItmViewpoint;
  readonly tree: ItmTreeProjection;
  readonly graph: ItmGraphProjection;
  readonly mindmap: ItmMindmapProjection;
  readonly catalogues: ItmCatalogueProjection;
  readonly matrix: ItmMatrixProjection;
  readonly report: ItmReportProjection;
  readonly graphvizSource: string;
  readonly mermaidMindmapSource: string;
}

export type ItmVisualTargetKind = 'view' | 'viewpoint' | 'raw-model';

export interface ItmVisualTargetDescriptor {
  readonly kind: ItmVisualTargetKind;
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly viewpointId?: string;
  readonly projection: ItmProjectionKind;
  readonly rendererValue?: string;
  readonly rendererSource: 'derived' | 'local';
  readonly preferredSurfaceId?: string;
  readonly sessionKey: string;
  readonly available: boolean;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic>;
}

export interface ResolveItmVisualTargetOptions {
  readonly target?: Partial<ItmVisualTargetDescriptor> & {
    readonly kind?: ItmVisualTargetKind;
    readonly id?: string;
  };
  readonly view?: string;
  readonly viewpoint?: string;
  readonly projection?: ItmProjectionKind;
  readonly title?: string;
  readonly includeImplicitRelationships?: boolean;
  readonly includeAncestors?: boolean;
}

export interface ResolvedItmVisualTarget {
  readonly target: ItmVisualTargetDescriptor;
  readonly projectedDocument: ItmProjectedDocument;
  readonly visualDocument: VisualItmDocument;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic>;
  readonly visualDiagnostics: ReadonlyArray<VisualItmDiagnostic>;
}

export type ItmResolverDiagnosticCategory =
  | 'unresolved'
  | 'unsupported'
  | 'unauthorized'
  | 'unavailable'
  | 'conflictingAlias'
  | 'versionMismatch'
  | 'capabilityMismatch'
  | 'blocked'
  | 'circular';

export interface CreateItmResolverDiagnosticOptions {
  readonly severity?: ItmSeverity;
  readonly code?: string;
  readonly file?: string;
  readonly uri?: string;
  readonly range?: ItmSourceRange;
  readonly includeTarget?: string;
  readonly includeStack?: ReadonlyArray<string>;
  readonly repositoryRef?: string;
  readonly requirementRef?: string;
  readonly packageRef?: string;
  readonly usingScope?: string;
  readonly origin?: Readonly<Record<string, unknown>>;
}

export declare const itmCapabilities: ReadonlyArray<Capability>;
export declare const itmProjectionKinds: ReadonlyArray<ItmProjectionKind>;
export declare const itmResolverDiagnosticCodes: Readonly<{
  readonly unresolved: 'itm.resolve.unresolved';
  readonly unsupported: 'itm.resolve.unsupported';
  readonly unauthorized: 'itm.resolve.unauthorized';
  readonly unavailable: 'itm.resolve.unavailable';
  readonly conflictingAlias: 'itm.resolve.conflicting-alias';
  readonly versionMismatch: 'itm.resolve.version-mismatch';
  readonly capabilityMismatch: 'itm.resolve.capability-mismatch';
  readonly blocked: 'itm.resolve.blocked';
  readonly circular: 'itm.resolve.circular';
}>;
export declare function createItmResolverDiagnostic(
  category: ItmResolverDiagnosticCategory,
  message: string,
  options?: CreateItmResolverDiagnosticOptions,
): ItmDiagnostic;
export declare function createWorkspaceItmIncludeProvider(
  workspace: Pick<WorkspaceService, 'getEntryByPath'>,
  options?: CreateWorkspaceItmIncludeProviderOptions,
): ItmIncludeProvider;
export declare const createWorkspaceItmResolver: typeof createWorkspaceItmIncludeProvider;
export declare function loadItmDocument(source: string, options?: LoadItmDocumentOptions): Promise<ItmLoadDocumentResult>;
export declare function validateItmDocument(
  document: ItmDocument | ResolvedItmDocument,
  options?: ValidateItmDocumentOptions,
): ReadonlyArray<ItmDiagnostic>;
export declare function projectItmDocument(
  input: ItmDocument | ResolvedItmDocument,
  options?: ProjectItmDocumentOptions,
): ItmProjectedDocument;
export declare function listItmVisualTargets(
  input: ItmLoadDocumentResult | ItmDocument | ResolvedItmDocument,
): ReadonlyArray<ItmVisualTargetDescriptor>;
export declare function resolveItmVisualTarget(
  input: ItmLoadDocumentResult | ItmDocument | ResolvedItmDocument,
  options?: ResolveItmVisualTargetOptions,
): ResolvedItmVisualTarget;
export declare function createItmGraphvizDiagramSource(
  input: ItmDocument | ResolvedItmDocument | ItmProjectedDocument,
  options?: ProjectItmDocumentOptions,
): string;
export declare function createItmMermaidMindmapSource(
  input: ItmDocument | ResolvedItmDocument | ItmProjectedDocument,
  options?: ProjectItmDocumentOptions,
): string;
export declare function renderItmPublicationHtml(
  input: ItmDocument | ResolvedItmDocument | ReadonlyArray<ItmLoadDocumentResult>,
  options?: ProjectItmDocumentOptions,
): string;
export declare function createItmCodeMirrorLanguageExtension(): unknown;
export declare const itmMarkdownFenceHandlerContributions: ReadonlyArray<MarkdownFenceHandlerContribution>;
export declare function createItmContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
