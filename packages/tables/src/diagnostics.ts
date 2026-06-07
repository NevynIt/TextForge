import type { TableDiagnostic } from './contracts';

export declare const tableDiagnosticCodes: {
  readonly parseFailed: 'tables.parse.failed';
  readonly headerDuplicate: 'tables.header.duplicate';
  readonly headerEmpty: 'tables.header.empty';
  readonly headerAutoAmbiguous: 'tables.header.auto-ambiguous';
  readonly rowsRagged: 'tables.rows.ragged';
  readonly sizeWarn: 'tables.size.warn';
  readonly sizeBlock: 'tables.size.block';
};

export declare function createParseFailedDiagnostic(message: string, source?: TableDiagnostic['source']): TableDiagnostic;
export declare function createDuplicateHeaderDiagnostic(header: string, columnIndexes: ReadonlyArray<number>): TableDiagnostic;
export declare function createEmptyHeaderDiagnostic(columnIndex: number): TableDiagnostic;
export declare function createAutoHeaderAmbiguousDiagnostic(): TableDiagnostic;
export declare function createRaggedRowsDiagnostic(rowNumbers: ReadonlyArray<number>, expectedColumns: number, actualColumns: number): TableDiagnostic;
export declare function createSizeDiagnostic(
  code: TableDiagnostic['code'],
  message: string,
  blocking: boolean,
  facts?: TableDiagnostic['facts'],
): TableDiagnostic;
