import type { ContributionManifest, Diagnostic, ResourcePredicate, SourceRange, SurfaceContribution } from '@textforge/core';
import type { VisualItmDocument, VisualItmEdge, VisualItmNode } from '@textforge/visual-itm';

export interface CytoscapeNodeElement {
  readonly data: {
    readonly id: string;
    readonly label: string;
    readonly kind?: string;
    readonly classes: ReadonlyArray<string>;
    readonly tags: ReadonlyArray<string>;
    readonly parent?: string;
    readonly style?: Readonly<Record<string, string | number | boolean>>;
    readonly layout?: Readonly<Record<string, string | number | boolean>>;
    readonly provenance?: VisualItmNode['provenance'];
  };
}

export interface CytoscapeEdgeElement {
  readonly data: {
    readonly id: string;
    readonly source: string;
    readonly target: string;
    readonly label: string;
    readonly kind?: string;
    readonly classes: ReadonlyArray<string>;
    readonly tags: ReadonlyArray<string>;
    readonly style?: Readonly<Record<string, string | number | boolean>>;
    readonly layout?: Readonly<Record<string, string | number | boolean>>;
    readonly provenance?: VisualItmEdge['provenance'];
  };
}

export interface CytoscapeSearchMatch {
  readonly id: string;
  readonly kind: 'node' | 'edge';
  readonly label: string;
}

export interface CytoscapeSurfaceModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly visualDocument: VisualItmDocument;
  readonly elements: {
    readonly nodes: ReadonlyArray<CytoscapeNodeElement>;
    readonly edges: ReadonlyArray<CytoscapeEdgeElement>;
  };
}

export declare const cytoscapeItmDocumentPredicate: ResourcePredicate;
export declare const cytoscapeSurfaceContribution: SurfaceContribution;
export declare function createCytoscapeElements(visualDocument: VisualItmDocument): {
  readonly nodes: ReadonlyArray<CytoscapeNodeElement>;
  readonly edges: ReadonlyArray<CytoscapeEdgeElement>;
};
export declare function findCytoscapeMatches(
  visualDocument: VisualItmDocument,
  query: string,
): ReadonlyArray<CytoscapeSearchMatch>;
export declare function createCytoscapeSurfaceModel(
  visualDocument: VisualItmDocument,
  options?: {
    readonly title?: string;
    readonly diagnostics?: ReadonlyArray<Diagnostic>;
  },
): CytoscapeSurfaceModel;
export declare function createRendererCytoscapeContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
