import { tableDiagnosticCodes, createSizeDiagnostic } from './diagnostics.js';

export const tableWarnLimits = Object.freeze({
  byteLength: 10 * 1024 * 1024,
  rowCount: 50_000,
  columnCount: 200,
});

export const tableBlockLimits = Object.freeze({
  byteLength: 50 * 1024 * 1024,
  rowCount: 250_000,
  columnCount: 1_000,
});

export function evaluateTableSize({ byteLength = 0, rowCount = 0, columnCount = 0 } = {}) {
  const diagnostics = [];

  if (
    byteLength > tableBlockLimits.byteLength
    || rowCount > tableBlockLimits.rowCount
    || columnCount > tableBlockLimits.columnCount
  ) {
    diagnostics.push(createSizeDiagnostic(
      tableDiagnosticCodes.sizeBlock,
      'The table exceeds the supported block threshold for grid mode.',
      true,
      { byteLength, rowCount, columnCount },
    ));
    return diagnostics;
  }

  if (
    byteLength > tableWarnLimits.byteLength
    || rowCount > tableWarnLimits.rowCount
    || columnCount > tableWarnLimits.columnCount
  ) {
    diagnostics.push(createSizeDiagnostic(
      tableDiagnosticCodes.sizeWarn,
      'The table exceeds the recommended size threshold for grid mode.',
      false,
      { byteLength, rowCount, columnCount },
    ));
  }

  return diagnostics;
}
