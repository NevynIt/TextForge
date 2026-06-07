export type TableFormat = 'csv' | 'tsv';
export type TableHeaderMode = 'auto' | 'header' | 'no-header';
export type TableResolvedHeaderMode = 'header' | 'no-header';

export interface TableDialect {
  readonly delimiter: string;
  readonly newline: string;
  readonly quoteChar: string;
  readonly escapeChar: string;
}

export interface TableDiagnostic {
  readonly severity: 'information' | 'warning' | 'error';
  readonly message: string;
  readonly code?: string;
  readonly blocking?: boolean;
  readonly origin?: {
    readonly packageId?: string;
    readonly subsystem?: string;
    readonly ruleId?: string;
  };
  readonly source?: {
    readonly start: {
      readonly line: number;
      readonly column: number;
      readonly offset?: number;
    };
    readonly end: {
      readonly line: number;
      readonly column: number;
      readonly offset?: number;
    };
  };
  readonly facts?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface TableColumn {
  readonly field: string;
  readonly index: number;
  readonly label: string;
  readonly headerValue?: string;
  readonly sourceHeader?: string;
  readonly generated?: boolean;
}

export interface TableRow {
  readonly index: number;
  readonly sourceRowNumber: number;
  readonly values: Readonly<Record<string, string>>;
}

export interface TableMetadata {
  readonly format: TableFormat;
  readonly headerMode: TableHeaderMode;
  readonly resolvedHeaderMode: TableResolvedHeaderMode;
  readonly dialect: TableDialect;
  readonly source: {
    readonly byteLength: number;
    readonly parsedRowCount: number;
    readonly parsedColumnCount: number;
    readonly dataRowCount: number;
    readonly dataColumnCount: number;
    readonly blocked: boolean;
    readonly warnings: ReadonlyArray<string>;
  };
  readonly sourceHeaders?: ReadonlyArray<string | undefined>;
}

export interface TableModel {
  readonly columns: ReadonlyArray<TableColumn>;
  readonly rows: ReadonlyArray<TableRow>;
  readonly metadata: TableMetadata;
  readonly diagnostics: ReadonlyArray<TableDiagnostic>;
}
