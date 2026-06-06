import type { Diagnostic } from '@textforge/core';
import type { VisualItmDocument } from '@textforge/visual-itm';

import type {
  CytoscapeEdgeElement,
  CytoscapeNodeElement,
  CytoscapeSearchMatch,
  CytoscapeSurfaceModel,
} from './types.js';

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
