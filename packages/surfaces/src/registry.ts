import type {
  OpenWithSelection,
  SurfaceOpenRequest,
  SurfaceRegistry,
  SurfaceContribution,
} from './types';

export declare function createOpenWithSelection(
  registry: SurfaceRegistry,
  request: SurfaceOpenRequest,
): OpenWithSelection;
export declare function createSurfaceRegistry(
  initialContributions?: ReadonlyArray<SurfaceContribution>,
): SurfaceRegistry;
