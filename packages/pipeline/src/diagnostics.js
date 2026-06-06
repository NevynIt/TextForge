import { createDiagnostic } from '@textforge/core';

export function createPipelineDiagnostic(code, message, severity = 'information', overrides = {}) {
  return createDiagnostic(message, severity, {
    code,
    origin: {
      packageId: '@textforge/pipeline',
      subsystem: 'pipeline',
      ...overrides.origin,
    },
    ...overrides,
  });
}
