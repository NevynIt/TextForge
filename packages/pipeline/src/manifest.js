import { createContributionManifest } from '@textforge/core';

import { pipelineCapabilities } from './capabilities.js';
import { createPipelineStep } from './steps.js';

export function createPipelineContributionManifest(pipelines = []) {
  return createContributionManifest('@textforge/pipeline', {
    capabilities: pipelineCapabilities,
    pipelines: pipelines.map((step) => createPipelineStep(step.id, step)),
  });
}

export const contributions = createPipelineContributionManifest();
