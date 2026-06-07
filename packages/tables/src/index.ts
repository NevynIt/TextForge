export type {
  TableColumn,
  TableDiagnostic,
  TableDialect,
  TableFormat,
  TableHeaderMode,
  TableMetadata,
  TableModel,
  TableResolvedHeaderMode,
  TableRow,
} from './contracts';
export type {
  ParseDelimitedTableOptions,
  SerializeDelimitedTableOptions,
} from './csv';
export {
  parseDelimitedTable,
  serializeDelimitedTable,
} from './csv';
export {
  renderReadonlyTableModel,
} from './readonly-render';
export declare const tablesGridCapabilityId: '@textforge/tables/capability/csv-grid';
export declare const tablesGridSurfaceId: '@textforge/tables/csv-grid';
export declare const csvTsvGridSurfaceContribution: {
  readonly id: '@textforge/tables/csv-grid';
  readonly label: 'Table grid';
  readonly description: 'CSV and TSV grid surface.';
  readonly kind: 'table-grid';
  readonly localName: 'csv-grid';
  readonly capabilities: readonly ['@textforge/tables/capability/csv-grid'];
  readonly resourceRepresentations: readonly ['text'];
  readonly languageIds: readonly ['csv', 'tsv'];
  readonly fileExtensions: readonly ['csv', 'tsv'];
  readonly placements: readonly ['main', 'popup', 'auxiliary'];
  readonly openWithPriority: 80;
};
export declare function createTablesContributionManifest(overrides?: Record<string, unknown>): unknown;
export declare const contributions: unknown;
