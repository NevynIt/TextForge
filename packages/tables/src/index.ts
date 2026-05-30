import type {
  Capability,
  ContributionManifest,
  Diagnostic,
  ResourcePredicate,
  SurfaceContribution,
} from '@textforge/core';
import type { ItmProjectedDocument } from '@textforge/itm';

export interface DelimitedTableColumn {
  readonly id: string;
  readonly label: string;
}

export interface DelimitedTableRow {
  readonly id: string;
  readonly cells: ReadonlyArray<string>;
}

export interface DelimitedTableState {
  readonly dialect: string;
  readonly delimiter: string;
  readonly hasHeader: boolean;
  readonly columns: ReadonlyArray<DelimitedTableColumn>;
  readonly rows: ReadonlyArray<DelimitedTableRow>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

export interface DelimitedPatchSummary {
  readonly changedCellCount: number;
  readonly changedHeaderCount: number;
  readonly addedRowCount: number;
  readonly removedRowCount: number;
  readonly addedColumnCount: number;
  readonly removedColumnCount: number;
  readonly nextText: string;
}

export interface ItmCatalogueTableSectionRow {
  readonly id: string;
  readonly searchText: string;
  readonly [key: string]: unknown;
}

export interface ItmCatalogueTableSection {
  readonly id: string;
  readonly label: string;
  readonly emptyLabel: string;
  readonly columns: ReadonlyArray<{
    readonly id: string;
    readonly header: string;
    readonly accessorKey?: string;
    readonly enableSorting?: boolean;
    readonly accessorFn?: (row: Record<string, unknown>) => unknown;
    readonly cell?: (context: { getValue(): unknown }) => unknown;
  }>;
  readonly rows: ReadonlyArray<ItmCatalogueTableSectionRow>;
}

export interface ItmMatrixTableModel {
  readonly showEmptyRows: boolean;
  readonly showEmptyColumns: boolean;
  readonly visibleColumns: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly typeRef?: string;
  }>;
  readonly rows: ReadonlyArray<{
    readonly id: string;
    readonly rowLabel: string;
    readonly rowTypeRef: string;
    readonly totalCount: number;
    readonly counts: Readonly<Record<string, number>>;
    readonly searchText: string;
  }>;
  readonly cellRows: ReadonlyArray<{
    readonly id: string;
    readonly sourceLabel: string;
    readonly sourceTypeRef: string;
    readonly targetLabel: string;
    readonly targetTypeRef: string;
    readonly count: number;
    readonly relationshipTypes: string;
    readonly relationshipKinds: string;
    readonly edgeIds: string;
    readonly searchText: string;
  }>;
  readonly nonEmptyCellCount: number;
  readonly totalRowCount: number;
  readonly totalColumnCount: number;
}

export interface DiagnosticsTableModel {
  readonly title: string;
  readonly columns: ReadonlyArray<{
    readonly id: string;
    readonly header: string;
    readonly accessorKey?: string;
    readonly enableSorting?: boolean;
  }>;
  readonly rows: ReadonlyArray<{
    readonly id: string;
    readonly severity: string;
    readonly code: string;
    readonly message: string;
    readonly resourcePath: string;
    readonly location: string;
    readonly origin: string;
    readonly searchText: string;
  }>;
}

export declare const tablesSurfaceCapabilityId: string;
export declare const tablesStructuredEditCapabilityId: string;
export declare const tablesDiagnosticsCapabilityId: string;
export declare const tablesDelimitedSurfaceId: string;
export declare const tablesCatalogueSurfaceId: string;
export declare const tablesMatrixSurfaceId: string;
export declare const tablesDiagnosticsSurfaceId: string;
export declare const csvDocumentPredicate: ResourcePredicate;
export declare const tsvDocumentPredicate: ResourcePredicate;
export declare const delimitedDocumentPredicate: ResourcePredicate;
export declare const itmDocumentPredicate: ResourcePredicate;
export declare const tablesCapabilities: ReadonlyArray<Capability>;
export declare const tableCommandContributions: ReadonlyArray<unknown>;
export declare const tableSurfaceContributions: ReadonlyArray<SurfaceContribution>;

export declare function inferDelimitedDialect(resource?: {
  readonly path?: string;
  readonly languageId?: string;
  readonly mimeType?: string;
}): {
  readonly id: string;
  readonly delimiter: string;
  readonly label: string;
  readonly fileExtension: string;
};
export declare function createEmptyDelimitedTableState(options?: {
  readonly dialect?: string;
  readonly delimiter?: string;
  readonly hasHeader?: boolean;
  readonly columnCount?: number;
}): DelimitedTableState;
export declare function parseDelimitedText(source: string, options?: {
  readonly delimiter?: string;
  readonly dialect?: string;
  readonly hasHeader?: boolean;
  readonly columnCount?: number;
}): DelimitedTableState;
export declare function serializeDelimitedText(input: DelimitedTableState, options?: {
  readonly delimiter?: string;
  readonly dialect?: string;
}): string;
export declare function addDelimitedRow(input: DelimitedTableState, options?: {
  readonly minimumColumns?: number;
}): DelimitedTableState;
export declare function addDelimitedColumn(input: DelimitedTableState, label?: string): DelimitedTableState;
export declare function removeDelimitedRow(input: DelimitedTableState, rowIndex: number): DelimitedTableState;
export declare function removeDelimitedColumn(input: DelimitedTableState, columnIndex: number): DelimitedTableState;
export declare function updateDelimitedCell(
  input: DelimitedTableState,
  rowIndex: number,
  columnIndex: number,
  value: string,
): DelimitedTableState;
export declare function updateDelimitedColumnLabel(
  input: DelimitedTableState,
  columnIndex: number,
  label: string,
): DelimitedTableState;
export declare function createDelimitedPatchSummary(
  baselineInput: DelimitedTableState,
  currentInput: DelimitedTableState,
  options?: {
    readonly delimiter?: string;
    readonly dialect?: string;
  },
): DelimitedPatchSummary;
export declare function buildItmCatalogueTableSections(projected: ItmProjectedDocument): ReadonlyArray<ItmCatalogueTableSection>;
export declare function buildItmMatrixTableModel(projected: ItmProjectedDocument, options?: {
  readonly showEmptyRows?: boolean;
  readonly showEmptyColumns?: boolean;
}): ItmMatrixTableModel;
export declare function buildDiagnosticsTableModel(
  diagnosticsInput?: ReadonlyArray<Diagnostic>,
  options?: { readonly title?: string },
): DiagnosticsTableModel;
export declare function createTablesContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
