import type { CommandContribution, ResourceRef, SurfaceContribution } from '@textforge/core';

export declare const standaloneDiagramLanguageIds: ReadonlyArray<'mermaid' | 'dot'>;
export declare const standaloneDiagramMimeTypes: ReadonlyArray<'text/x-mermaid' | 'text/vnd.graphviz'>;
export declare const standaloneDiagramFileExtensions: ReadonlyArray<'mmd' | 'mermaid' | 'dot' | 'gv'>;
export declare const standaloneDiagramPreviewSurfaceId = '@textforge/diagrams/standalone-preview';

export declare function getStandaloneDiagramKind(resource?: {
  readonly languageId?: string;
  readonly mimeType?: string;
  readonly path?: string;
}): 'mermaid' | 'dot' | undefined;

export declare function isStandaloneDiagramResource(resource?: {
  readonly representation?: string;
  readonly languageId?: string;
  readonly mimeType?: string;
  readonly path?: string;
}): boolean;

export declare function renderStandaloneDiagramToSvg(
  source: string,
  options?: {
    readonly kind?: 'mermaid' | 'dot';
    readonly resource?: {
      readonly languageId?: string;
      readonly mimeType?: string;
      readonly path?: string;
    };
    readonly document?: Document;
    readonly id?: string;
  },
): Promise<string>;

export declare function createStandaloneDiagramPreviewSurface(
  source: string,
  options?: {
    readonly kind?: 'mermaid' | 'dot';
    readonly resource?: ResourceRef;
    readonly title?: string;
  },
): {
  readonly id: string;
  readonly contribution: SurfaceContribution;
  readonly model: {
    readonly id: string;
    readonly title: string;
    readonly kind?: 'mermaid' | 'dot';
    readonly summary: string;
    readonly diagnostics: readonly [];
  };
  readonly mount: (container: Element) => () => void;
};

export declare const standaloneDiagramPreviewSurfaceContribution: SurfaceContribution;
export declare const diagramCommandContributions: ReadonlyArray<CommandContribution>;
