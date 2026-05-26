import type {
  CapabilityRequirement,
  CommandContribution,
  ContributionManifest,
  ContributionRegistry,
  Diagnostic,
  DocumentContributionContext,
  ResourcePredicate,
  ResourceRef,
} from '@textforge/core';
import type {
  GeneratedResourceDescriptor,
  PipelineRunner,
} from '@textforge/pipeline';
import type { SurfaceContribution } from '@textforge/surfaces';

export interface TfmdStyleMap {
  readonly [styleName: string]: Readonly<Record<string, string | number | boolean>>;
}

export interface TfmdMetadata {
  readonly [key: string]: string | number | boolean | null | undefined;
}

export interface MarkdownReferencedAsset {
  readonly resourceId?: string;
  readonly path?: string;
  readonly href: string;
  readonly resolvedSrc?: string;
}

export interface MarkdownFenceExecution {
  readonly content: string;
  readonly blockId: string;
  readonly blockKind: string;
  readonly fence?: {
    readonly rawInfo: string;
    readonly kind: string;
    readonly parameters: Readonly<Record<string, string | boolean>>;
  };
  readonly contributionContext?: DocumentContributionContext;
  readonly sourceResource?: ResourceRef;
  readonly sourceUpdatedAt?: string;
  readonly generatedAssetBasePath?: string;
  readonly includePng?: boolean;
  readonly document?: Document;
  readonly hostServices?: Readonly<Record<string, unknown>>;
  readonly sharedState?: Record<string, unknown>;
  readonly pipelineRunner?: PipelineRunner;
}

export interface MarkdownFenceResult {
  readonly html: string;
  readonly svg?: string;
  readonly diagnostics?: ReadonlyArray<Diagnostic>;
  readonly generatedResources?: ReadonlyArray<GeneratedResourceDescriptor>;
}

export type MarkdownFenceHandler = (execution: MarkdownFenceExecution) => Promise<MarkdownFenceResult>;

export interface MarkdownRenderOptions {
  readonly resource?: ResourceRef;
  readonly sourceUpdatedAt?: string;
  readonly fenceExecutionOptions?: Pick<MarkdownFenceExecution, 'generatedAssetBasePath' | 'includePng' | 'document' | 'hostServices'>;
  readonly contributionRegistry?: ContributionRegistry;
  readonly contributionContext?: DocumentContributionContext;
  readonly pipelineRunner?: PipelineRunner;
  readonly now?: () => string;
  readonly resolveAssetReference?: (input: {
    readonly sourceResource?: ResourceRef;
    readonly href: string;
  }) => MarkdownReferencedAsset | undefined;
  readonly fenceHandlers?: Readonly<Partial<Record<'mermaid' | 'dot' | 'graphviz', MarkdownFenceHandler>>>;
}

export interface MarkdownRenderResult {
  readonly html: string;
  readonly bodyHtml: string;
  readonly printHtml: string;
  readonly resolvedSource: string;
  readonly metadata: TfmdMetadata;
  readonly styles: TfmdStyleMap;
  readonly styleSheet: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly referencedAssets: ReadonlyArray<MarkdownReferencedAsset>;
  readonly generatedResources: ReadonlyArray<GeneratedResourceDescriptor>;
  readonly capabilityContext?: DocumentContributionContext;
}

export interface MarkdownPreviewModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly html: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly metadata: TfmdMetadata;
  readonly referencedAssets: ReadonlyArray<MarkdownReferencedAsset>;
  readonly generatedResources: ReadonlyArray<GeneratedResourceDescriptor>;
}

export interface MarkdownPreviewSurface {
  readonly id: string;
  readonly contribution: SurfaceContribution;
  readonly model: MarkdownPreviewModel;
  mount(container: HTMLElement): () => void;
}

export declare const tfmdFenceAliases: ReadonlyArray<string>;
export declare const markdownDocumentPredicate: ResourcePredicate;
export declare const markdownPreviewSurfaceContribution: SurfaceContribution;
export declare const markdownCommandContributions: ReadonlyArray<CommandContribution>;
export declare function createMarkdownContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
export declare function parseMarkdownCapabilityRequirements(source?: string): ReadonlyArray<CapabilityRequirement>;
export declare function createMarkdownSnippet(kind: 'image' | 'mermaid' | 'graphviz', options?: {
  readonly href?: string;
  readonly alt?: string;
}): string;
export declare function renderMarkdownDocument(source: string, options?: MarkdownRenderOptions): Promise<MarkdownRenderResult>;
export declare function createPrintOptimizedHtmlDocument(result: Pick<MarkdownRenderResult, 'bodyHtml' | 'metadata' | 'styleSheet'>, options?: {
  readonly title?: string;
}): string;
export declare function createMarkdownPreviewModel(source: string, result: MarkdownRenderResult, options?: {
  readonly resource?: ResourceRef;
}): MarkdownPreviewModel;
export declare function createMarkdownPreviewSurface(source: string, result: MarkdownRenderResult, options?: {
  readonly resource?: ResourceRef;
}): MarkdownPreviewSurface;
