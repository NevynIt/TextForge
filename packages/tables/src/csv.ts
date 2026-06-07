import type {
  TableDialect,
  TableHeaderMode,
  TableModel,
  TableResolvedHeaderMode,
} from './contracts';

export interface ParseDelimitedTableOptions {
  readonly format?: 'csv' | 'tsv';
  readonly languageId?: string;
  readonly resource?: {
    readonly path?: string;
    readonly languageId?: string;
  };
  readonly headerMode?: TableHeaderMode;
  readonly dialect?: Partial<TableDialect>;
}

export interface SerializeDelimitedTableOptions {
  readonly format?: 'csv' | 'tsv';
  readonly headerMode?: TableHeaderMode | TableResolvedHeaderMode;
  readonly dialect?: Partial<TableDialect>;
}

export declare function parseDelimitedTable(sourceText: string, options?: ParseDelimitedTableOptions): TableModel;
export declare function serializeDelimitedTable(model: TableModel, options?: SerializeDelimitedTableOptions): string;
