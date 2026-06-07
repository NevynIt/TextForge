import { createCapability, createContributionManifest } from '@textforge/core';

import { parseDelimitedTable, serializeDelimitedTable } from './csv.js';
import { createCsvTsvGridSurfaceContribution } from './grid-surface.js';
import {
  tablesGridCapabilityId,
  tablesGridSurfaceId,
  tablesTextDocumentPredicate,
} from './ids.js';

export {
  tablesGridCapabilityId,
  tablesGridSurfaceId,
  tablesTextDocumentPredicate,
};

function createTablesCapabilities() {
  return [
    createCapability(tablesGridCapabilityId, {
      description: 'Open CSV and TSV text resources in the package-owned AG Grid surface.',
      localName: 'csv-grid',
      aliases: ['tables', 'csv', 'tsv', 'grid'],
      defaultActive: true,
      scope: 'document',
      documentPredicate: tablesTextDocumentPredicate,
    }),
  ];
}

export function createTablesContributionManifest(overrides = {}) {
  const parseDelimitedTableDependency = overrides.parseDelimitedTable ?? parseDelimitedTable;
  const serializeDelimitedTableDependency = overrides.serializeDelimitedTable ?? serializeDelimitedTable;
  const dependencies = overrides.dependencies ?? [];
  return createContributionManifest('@textforge/tables', {
    name: '@textforge/tables',
    version: '0.1.0',
    description: 'CSV and TSV table grid surface for TextForge.',
    dependencies: [
      '@textforge/core',
      ...dependencies,
    ],
    capabilities: overrides.capabilities ?? createTablesCapabilities(),
    surfaces: overrides.surfaces ?? [
      createCsvTsvGridSurfaceContribution({
        parseDelimitedTable: parseDelimitedTableDependency,
        serializeDelimitedTable: serializeDelimitedTableDependency,
      }),
    ],
  });
}

export const contributions = createTablesContributionManifest();
