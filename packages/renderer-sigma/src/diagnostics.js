import { createDiagnostic } from '@textforge/core';

import { sigmaSurfaceId } from './constants.js';

export function createUnavailableDiagnostics(resource, message, code) {
  return [
    createDiagnostic(message, 'error', {
      resource,
      code,
      origin: {
        packageId: '@textforge/renderer-sigma',
        subsystem: 'sigma-runtime',
        contributionId: sigmaSurfaceId,
      },
    }),
  ];
}
