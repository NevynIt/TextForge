import type {
  Diagnostic,
  DocumentContributionContext,
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

export interface MdppResourceResult {
  readonly text?: string;
  readonly path?: string;
  readonly mimeType?: string;
  readonly diagnostics?: ReadonlyArray<Diagnostic>;
}

export interface MdppRenderMetadata {
  readonly directives: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly repositories: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly includedResources: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly stylesheets: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly themes: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly layouts: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly models: ReadonlyArray<Readonly<Record<string, unknown>>>;
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
  readonly contributionRegistry?: import('@textforge/core').ContributionRegistry;
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
  readonly contributionRegistry?: import('@textforge/core').ContributionRegistry;
  readonly contributionContext?: DocumentContributionContext;
  readonly pipelineRunner?: PipelineRunner;
  readonly now?: () => string;
  readonly resolveAssetReference?: (input: {
    readonly sourceResource?: ResourceRef;
    readonly href: string;
  }) => MarkdownReferencedAsset | undefined;
  readonly resolveTextResource?: (input: {
    readonly ref: string;
    readonly basePath?: string;
    readonly role: 'include' | 'theme' | 'stylesheet' | string;
    readonly sourceResource?: ResourceRef;
    readonly repositoryAliases?: Readonly<Record<string, string>>;
  }) => MdppResourceResult | undefined | Promise<MdppResourceResult | undefined>;
  readonly fenceHandlers?: Readonly<Partial<Record<'mermaid' | 'dot' | 'graphviz', MarkdownFenceHandler>>>;
}

export interface MarkdownRenderResult {
  readonly html: string;
  readonly bodyHtml: string;
  readonly printHtml: string;
  readonly resolvedSource: string;
  readonly profile: 'markdown' | 'tfmd' | 'mdpp';
  readonly metadata: TfmdMetadata;
  readonly mdpp?: MdppRenderMetadata;
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

export interface MarkdownPreviewLinkActivation {
  readonly href: string;
  readonly link: HTMLAnchorElement;
  readonly event: MouseEvent;
  readonly resource?: ResourceRef;
}

export interface MarkdownPreviewSurface {
  readonly id: string;
  readonly contribution: SurfaceContribution;
  readonly model: MarkdownPreviewModel;
  mount(container: HTMLElement): () => void;
  update?(
    container: HTMLElement,
    nextSurface: Pick<MarkdownPreviewSurface, 'model'>,
    options?: {
      readonly scrollHost?: HTMLElement;
      readonly onAfterSwap?: () => void;
    },
  ): boolean;
}
