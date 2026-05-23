import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createContributionManifest,
  createDiagnostic,
  createResourceRef,
  createSourcePosition,
  createSourceRange,
} from '../src/index.js';

test('core constructors build stable value objects', () => {
  const ref = createResourceRef('resource-1', { path: '/docs/note.md' });
  const range = createSourceRange(createSourcePosition(1, 1), createSourcePosition(1, 4, 3));
  const diagnostic = createDiagnostic('Missing heading', 'warning', { resource: ref, source: range });
  const manifest = createContributionManifest('@textforge/core');

  assert.equal(ref.resourceId, 'resource-1');
  assert.equal(diagnostic.source?.end.offset, 3);
  assert.equal(manifest.packageId, '@textforge/core');
});
