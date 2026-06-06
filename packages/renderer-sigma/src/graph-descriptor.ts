import type { VisualItmDocument } from '@textforge/visual-itm';

import type { SigmaGraphDescriptor, SigmaSearchMatch } from './types.js';

export declare function createSigmaGraphDescriptor(visualDocument: VisualItmDocument): SigmaGraphDescriptor;
export declare function findSigmaMatches(
  visualDocument: VisualItmDocument,
  query: string,
): ReadonlyArray<SigmaSearchMatch>;
