import {
  createCapability,
  createContributionManifest,
} from '@textforge/core';

export const tablesGridCapabilityId = '@textforge/tables/capability/csv-grid';
export const tablesGridSurfaceId = '@textforge/tables/csv-grid';

export const csvTsvGridSurfaceContribution = {
  id: tablesGridSurfaceId,
  label: 'Table grid',
  description: 'CSV and TSV grid surface.',
  kind: 'table-grid',
  localName: 'csv-grid',
  capabilities: [tablesGridCapabilityId],
  resourceRepresentations: ['text'],
  languageIds: ['csv', 'tsv'],
  fileExtensions: ['csv', 'tsv'],
  placements: ['main', 'popup', 'auxiliary'],
  openWithPriority: 80,
};

export function createTablesContributionManifest(overrides = {}) {
  return createContributionManifest('@textforge/tables', {
    capabilities: [
      createCapability(tablesGridCapabilityId, {
        localName: 'csv-grid',
        documentPredicate: {
          representations: ['text'],
          languageIds: ['csv', 'tsv'],
          fileExtensions: ['csv', 'tsv'],
        },
      }),
    ],
    surfaces: [csvTsvGridSurfaceContribution],
    ...overrides,
  });
}

export const contributions = createTablesContributionManifest();
