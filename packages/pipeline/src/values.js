import { createPipelineValue } from '@textforge/core';

export function createPipelineOutputValue(kind, value, overrides = {}) {
  return createPipelineValue(kind, value, overrides);
}
