import type {
  SurfaceContribution,
  SurfaceOpenRequest,
  SurfacePlacement,
  SurfaceRegistry,
} from './types';

export declare function canOpenWithSurface(
  contribution: SurfaceContribution,
  request: SurfaceOpenRequest,
): boolean;
export declare function getDefaultSurfacePlacement(
  registry: SurfaceRegistry,
  request: SurfaceOpenRequest,
): SurfacePlacement;
