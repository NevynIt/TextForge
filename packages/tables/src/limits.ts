import type { TableDiagnostic } from './contracts';

export declare const tableWarnLimits: {
  readonly byteLength: number;
  readonly rowCount: number;
  readonly columnCount: number;
};

export declare const tableBlockLimits: {
  readonly byteLength: number;
  readonly rowCount: number;
  readonly columnCount: number;
};

export declare function evaluateTableSize(input?: {
  readonly byteLength?: number;
  readonly rowCount?: number;
  readonly columnCount?: number;
}): ReadonlyArray<TableDiagnostic>;
