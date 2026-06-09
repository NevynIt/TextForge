import type {
  Capability,
  CapabilityRequirement,
  CommandContribution,
  ContributionManifest,
  MarkdownFenceHandlerContribution,
  ResourcePredicate,
  ResourceRef,
} from '@textforge/core';
import type { SurfaceContribution } from '@textforge/surfaces';
import type {
  MarkdownPreviewLinkActivation,
  MarkdownPreviewModel,
  MarkdownPreviewSurface,
  MarkdownRenderOptions,
  MarkdownRenderResult,
} from './types.js';

export declare const tfmdFenceAliases: ReadonlyArray<string>;
export declare const markdownDocumentPredicate: ResourcePredicate;
export declare const markdownCapabilities: ReadonlyArray<Capability>;
export declare const markdownPreviewSurfaceContribution: SurfaceContribution;
export declare const markdownCommandContributions: ReadonlyArray<CommandContribution>;
export declare const markdownFenceHandlerContributions: ReadonlyArray<MarkdownFenceHandlerContribution>;
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
  readonly onLinkActivate?: (activation: MarkdownPreviewLinkActivation) => boolean | void;
  readonly scheduler?: {
    requestAnimationFrame?(callback: () => void): number;
    cancelAnimationFrame?(handle: number): void;
  };
}): MarkdownPreviewSurface;
