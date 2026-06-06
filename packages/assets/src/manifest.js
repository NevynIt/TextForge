import { createContributionManifest } from '@textforge/core';

import { assetCapabilities } from './capabilities.js';
import { assetCommandContributions } from './commands.js';
import { assetSurfaceContributions } from './surfaces.js';

export function createAssetContributionManifest() {
  return createContributionManifest('@textforge/assets', {
    capabilities: assetCapabilities,
    commands: assetCommandContributions,
    surfaces: assetSurfaceContributions,
  });
}

export const contributions = createAssetContributionManifest();
