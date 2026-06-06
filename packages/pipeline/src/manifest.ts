import type { ContributionManifest } from '@textforge/core';
import type { PipelineStep } from './types.js';

export declare function createPipelineContributionManifest(
  pipelines?: ReadonlyArray<PipelineStep>,
): ContributionManifest;
export declare const contributions: ContributionManifest;
