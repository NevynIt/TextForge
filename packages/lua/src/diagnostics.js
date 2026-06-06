import {
  createDiagnostic,
} from '@textforge/core';

import {
  defaultLuaExecutionLimits,
  packageId,
} from './policy.js';

export function createLuaDiagnostic(code, message, severity = 'error', overrides = {}) {
  return createDiagnostic(message, severity, {
    code,
    origin: {
      packageId,
      subsystem: 'lua',
      ...overrides.origin,
    },
    ...overrides,
  });
}

export function createLuaExecutionLimits(overrides = {}) {
  return {
    ...defaultLuaExecutionLimits,
    ...overrides,
  };
}
