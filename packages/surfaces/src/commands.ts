import type {
  CommandContribution,
  ContributionManifest,
} from '@textforge/core';

import type {
  SurfaceContribution,
} from './types';

export declare const surfaceCommandContributions: ReadonlyArray<CommandContribution>;
export declare function createSurfaceOpenWithCommands(
  surfaceContributions?: ReadonlyArray<SurfaceContribution>,
): ReadonlyArray<CommandContribution>;
export declare function createSurfaceCommandContributions(
  surfaceContributions?: ReadonlyArray<SurfaceContribution>,
): ReadonlyArray<CommandContribution>;
export declare function createSurfaceContributionManifest(
  surfaceContributions?: ReadonlyArray<SurfaceContribution>,
): ContributionManifest;
export declare const contributions: ContributionManifest;
