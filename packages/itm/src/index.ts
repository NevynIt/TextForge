import type {
  Capability,
  ContributionManifest,
  MarkdownFenceHandlerContribution,
} from '@textforge/core';
import type { WorkspaceService } from '@textforge/workspace';

export * from './upstream/index.js';

export interface ItmLoadDocumentResult {
  readonly document: ItmDocument;
  readonly resolvedDocument: ResolvedItmDocument;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic>;
}

export interface LoadItmDocumentOptions {
  readonly strict?: boolean;
  readonly uri?: string;
  readonly includeProviders?: ReadonlyArray<ItmIncludeProvider>;
  readonly includeStdProfiles?: boolean;
  readonly sourceProvider?: ItmSourceProvider;
  readonly maxIncludeDepth?: number;
}

export interface CreateWorkspaceItmIncludeProviderOptions {
  readonly name?: string;
  readonly basePath?: string;
}

export interface ProjectItmDocumentOptions {
  readonly view?: string;
  readonly viewpoint?: string;
  readonly select?: string;
  readonly title?: string;
  readonly includeImplicitRelationships?: boolean;
  readonly includeAncestors?: boolean;
}

export declare const itmCapabilities: ReadonlyArray<Capability>;
export declare function createWorkspaceItmIncludeProvider(
  workspace: Pick<WorkspaceService, 'getEntryByPath'>,
  options?: CreateWorkspaceItmIncludeProviderOptions,
): ItmIncludeProvider;
export declare const createWorkspaceItmResolver: typeof createWorkspaceItmIncludeProvider;
export declare function loadItmDocument(source: string, options?: LoadItmDocumentOptions): Promise<ItmLoadDocumentResult>;
export declare function validateItmDocument(document: ItmDocument | ResolvedItmDocument): ReadonlyArray<ItmDiagnostic>;
export declare function projectItmDocument(
  input: ItmDocument | ResolvedItmDocument,
  options?: ProjectItmDocumentOptions,
): {
  readonly document: ItmDocument;
  readonly resolvedDocument: ResolvedItmDocument;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic>;
  readonly nodes: ReadonlyArray<CanonicalGraphNode>;
  readonly edges: ReadonlyArray<CanonicalGraphEdge & {
    readonly style?: Readonly<Record<string, ItmValue>>;
  }>;
  readonly views: ReadonlyArray<CanonicalGraphView>;
  readonly view?: ItmView;
  readonly viewpoint?: ItmViewpoint;
};
export declare function renderItmPublicationHtml(
  input: ItmDocument | ResolvedItmDocument | ReadonlyArray<ItmLoadDocumentResult>,
  options?: ProjectItmDocumentOptions,
): string;
export declare const itmMarkdownFenceHandlerContributions: ReadonlyArray<MarkdownFenceHandlerContribution>;
export declare function createItmContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
