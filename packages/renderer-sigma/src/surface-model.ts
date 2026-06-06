import type { Diagnostic } from '@textforge/core';
import type { VisualItmDocument } from '@textforge/visual-itm';

import type { SigmaSurfaceModel } from './types.js';

export declare function createSigmaSurfaceModel(
  visualDocument: VisualItmDocument,
  options?: {
    readonly title?: string;
    readonly diagnostics?: ReadonlyArray<Diagnostic>;
  },
): SigmaSurfaceModel;
