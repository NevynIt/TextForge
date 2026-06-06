import type {
  ResourceRef,
} from '@textforge/core';

import type {
  OpenWithSelection,
  PipelineValueSurfaceSelectionRequest,
  SurfaceRegistry,
} from './types';

export declare function createPipelineValueResource(
  value: PipelineValueSurfaceSelectionRequest['value'],
  overrides?: {
    readonly resourceId?: string;
    readonly path?: string;
  },
): ResourceRef;
export declare function createPipelineValueOpenWithSelection(
  registry: SurfaceRegistry,
  request: PipelineValueSurfaceSelectionRequest,
): OpenWithSelection;
