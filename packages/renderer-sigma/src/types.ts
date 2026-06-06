import type { Diagnostic } from '@textforge/core';
import type { VisualItmDocument, VisualItmEdge, VisualItmNode } from '@textforge/visual-itm';

export interface SigmaGraphNodeDescriptor {
  readonly id: string;
  readonly label: string;
  readonly kind?: string;
  readonly classes: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly style?: VisualItmNode['style'];
  readonly provenance?: VisualItmNode['provenance'];
}

export interface SigmaGraphEdgeDescriptor {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label: string;
  readonly kind?: string;
  readonly classes: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly style?: VisualItmEdge['style'];
  readonly provenance?: VisualItmEdge['provenance'];
}

export interface SigmaSearchMatch {
  readonly id: string;
  readonly kind: 'node' | 'edge';
  readonly label: string;
}

export interface SigmaGraphDescriptor {
  readonly nodes: ReadonlyArray<SigmaGraphNodeDescriptor>;
  readonly edges: ReadonlyArray<SigmaGraphEdgeDescriptor>;
}

export interface SigmaSurfaceModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly visualDocument: VisualItmDocument;
  readonly graph: SigmaGraphDescriptor;
}
