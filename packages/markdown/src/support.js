import { createDiagnostic } from '@textforge/core';

export const tfmdFenceAliases = ['tf-md', 'tfmd', 'textforge-md', 'textforge-markdown'];

export function createMarkdownDiagnostic(code, message, severity = 'information', overrides = {}) {
  return createDiagnostic(message, severity, {
    code,
    origin: {
      packageId: '@textforge/markdown',
      subsystem: 'tfmd',
      ...overrides.origin,
    },
    ...overrides,
  });
}

export function emitMarkdownTrace(options, label, details = {}) {
  if (typeof options?.trace === 'function') {
    options.trace(label, details);
  }
}

export function slugifyHeading(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
