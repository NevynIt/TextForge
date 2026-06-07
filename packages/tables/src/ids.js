import { createResourcePredicate } from '@textforge/core';

export const tablesGridCapabilityId = '@textforge/tables/capability/csv-grid';
export const tablesGridSurfaceId = '@textforge/tables/csv-grid';
export const tablesAgGridFallbackSurfaceId = '@textforge/tables/csv-grid-ag-fallback';

export const tablesTextDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['csv', 'tsv'],
  fileExtensions: ['csv', 'tsv'],
});
