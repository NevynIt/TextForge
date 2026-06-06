import { createCapability, createContributionManifest } from '@textforge/core';

import {
  eaDashboardJsonDocumentPredicate,
  eaViewerCapabilityId,
} from './ids.js';
import { eaViewerSurfaceContribution } from './viewer-surface.js';
export function createEaViewerContributionManifest(overrides = {}) {
  return createContributionManifest('@textforge/ea-viewer', {
    name: '@textforge/ea-viewer',
    version: '0.1.0',
    description: 'Local EA Dashboard JSON fixture viewer for TextForge.',
    dependencies: [
      '@textforge/core',
      ...(overrides.dependencies ?? []),
    ],
    capabilities: overrides.capabilities ?? [
      createCapability(eaViewerCapabilityId, {
        localName: 'ea-dashboard',
        aliases: ['ea', 'enterprise-architecture'],
        description: 'Open EA Dashboard JSON fixture exports in a local read-only viewer.',
        defaultActive: true,
        documentPredicate: eaDashboardJsonDocumentPredicate,
      }),
    ],
    surfaces: overrides.surfaces ?? [eaViewerSurfaceContribution],
  });
}

export const contributions = createEaViewerContributionManifest();
