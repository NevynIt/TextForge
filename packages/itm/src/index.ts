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
export declare function createItmCodeMirrorLanguageExtension(): unknown;
export declare const itmMarkdownFenceHandlerContributions: ReadonlyArray<MarkdownFenceHandlerContribution>;
export declare function createItmContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
