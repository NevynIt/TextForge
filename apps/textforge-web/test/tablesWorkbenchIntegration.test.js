import assert from 'node:assert/strict';
import test from 'node:test';

import { createOpenWithSelection } from '@textforge/surfaces';
import { createWorkbenchRegistries } from '../src/workbench/controller/registries.js';

function createTextResource(path, languageId, mimeType) {
  return {
    resourceId: path,
    kind: 'resource',
    representation: 'text',
    path,
    languageId,
    mimeType,
  };
}

test('workbench registry includes tables package and exposes CSV/TSV open-with ordering', () => {
  const { contributionRegistry, surfaceRegistry } = createWorkbenchRegistries();

  assert.equal(
    contributionRegistry.listManifests().some((manifest) => manifest.packageId === '@textforge/tables'),
    true,
  );

  const csvSelection = createOpenWithSelection(surfaceRegistry, {
    resource: createTextResource('/docs/sample.csv', 'csv', 'text/csv'),
  });
  assert.deepEqual(
    csvSelection.candidates.map((candidate) => candidate.surfaceId),
    [
      '@textforge/tables/csv-grid',
      '@textforge/tables/csv-grid-ag-fallback',
      '@textforge/editors/code-mirror-text',
    ],
  );
  assert.equal(csvSelection.selectedSurfaceId, '@textforge/tables/csv-grid');

  const tsvSelection = createOpenWithSelection(surfaceRegistry, {
    resource: createTextResource('/docs/sample.tsv', 'tsv', 'text/tab-separated-values'),
  });
  assert.deepEqual(
    tsvSelection.candidates.map((candidate) => candidate.surfaceId),
    [
      '@textforge/tables/csv-grid',
      '@textforge/tables/csv-grid-ag-fallback',
      '@textforge/editors/code-mirror-text',
    ],
  );
});
