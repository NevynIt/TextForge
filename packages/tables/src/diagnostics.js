import { createTableDiagnostic } from './contracts.js';

export const tableDiagnosticCodes = Object.freeze({
  parseFailed: 'tables.parse.failed',
  headerDuplicate: 'tables.header.duplicate',
  headerEmpty: 'tables.header.empty',
  headerAutoAmbiguous: 'tables.header.auto-ambiguous',
  rowsRagged: 'tables.rows.ragged',
  sizeWarn: 'tables.size.warn',
  sizeBlock: 'tables.size.block',
});

export function createParseFailedDiagnostic(message, source) {
  return createTableDiagnostic(message, {
    code: tableDiagnosticCodes.parseFailed,
    severity: 'error',
    blocking: true,
    source,
  });
}

export function createDuplicateHeaderDiagnostic(header, columnIndexes) {
  const normalizedHeader = String(header ?? '').trim();
  const label = normalizedHeader || '(blank)';
  return createTableDiagnostic(
    `Header "${label}" is duplicated across columns ${columnIndexes.map((value) => value + 1).join(', ')}.`,
    {
      code: tableDiagnosticCodes.headerDuplicate,
      severity: 'warning',
      blocking: false,
      facts: {
        header: label,
        columnCount: columnIndexes.length,
      },
    },
  );
}

export function createEmptyHeaderDiagnostic(columnIndex) {
  return createTableDiagnostic(
    `Header column ${columnIndex + 1} is empty.`,
    {
      code: tableDiagnosticCodes.headerEmpty,
      severity: 'warning',
      blocking: false,
      facts: {
        columnIndex: columnIndex + 1,
      },
    },
  );
}

export function createAutoHeaderAmbiguousDiagnostic() {
  return createTableDiagnostic(
    'Automatic header detection was ambiguous, so the first row was treated as data.',
    {
      code: tableDiagnosticCodes.headerAutoAmbiguous,
      severity: 'warning',
      blocking: false,
    },
  );
}

export function createRaggedRowsDiagnostic(rowNumbers, expectedColumns, actualColumns) {
  return createTableDiagnostic(
    `Rows ${rowNumbers.join(', ')} do not match the expected column structure.`,
    {
      code: tableDiagnosticCodes.rowsRagged,
      severity: 'warning',
      blocking: false,
      facts: {
        expectedColumns,
        actualColumns,
      },
    },
  );
}

export function createSizeDiagnostic(code, message, blocking, facts) {
  return createTableDiagnostic(message, {
    code,
    severity: blocking ? 'error' : 'warning',
    blocking,
    facts,
  });
}
