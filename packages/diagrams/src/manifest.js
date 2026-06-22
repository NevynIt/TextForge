import { createContributionManifest } from '@textforge/core';

import { diagramCapabilities } from './capabilities.js';
import { diagramFenceHandlerContributions } from './fence-handlers.js';
import { diagramPipelineContributions } from './pipelines.js';
import {
  diagramCommandContributions,
  standaloneDiagramPreviewSurfaceContribution,
} from './standalone.js';

export function createDiagramContributionManifest() {
  return createContributionManifest('@textforge/diagrams', {
    capabilities: diagramCapabilities,
    commands: diagramCommandContributions,
    surfaces: [standaloneDiagramPreviewSurfaceContribution],
    pipelines: diagramPipelineContributions,
    markdownFenceHandlers: diagramFenceHandlerContributions,
  });
}

export const contributions = createDiagramContributionManifest();
