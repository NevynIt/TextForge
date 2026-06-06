import type { PipelineValue } from '@textforge/core';
import type { PipelineValueKind } from './types.js';

export declare function createPipelineOutputValue<TValue = unknown>(
  kind: PipelineValueKind | string,
  value: TValue,
  overrides?: Partial<PipelineValue<TValue>>,
): PipelineValue<TValue>;
