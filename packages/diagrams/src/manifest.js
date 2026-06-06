import { createContributionManifest } from '@textforge/core';

import { diagramCapabilities } from './capabilities.js';
import { diagramFenceHandlerContributions } from './fence-handlers.js';
import { diagramPipelineContributions } from './pipelines.js';

export function createDiagramContributionManifest() {
  return createContributionManifest('@textforge/diagrams', {
    capabilities: diagramCapabilities,
    pipelines: diagramPipelineContributions,
    markdownFenceHandlers: diagramFenceHandlerContributions,
  });
}

export const contributions = createDiagramContributionManifest();
