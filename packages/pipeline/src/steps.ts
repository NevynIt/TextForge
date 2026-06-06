import type { PipelineStep } from './types.js';

export declare function createPipelineStep<TInput = unknown, TOutput = unknown>(
  id: string,
  overrides?: Partial<PipelineStep<TInput, TOutput>>,
): PipelineStep<TInput, TOutput>;
