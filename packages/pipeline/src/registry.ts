import type { PipelineContribution } from '@textforge/core';
import type { PipelineRegistry, PipelineStep } from './types.js';

export declare function createPipelineRegistry(initialSteps?: ReadonlyArray<PipelineStep>): PipelineRegistry;
export declare function createPipelineRegistryFromContributions(
  contributions?: ReadonlyArray<PipelineContribution>,
): PipelineRegistry;
