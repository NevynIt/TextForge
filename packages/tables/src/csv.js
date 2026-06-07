import Papa from 'papaparse';

import {
  createDisplayLabel,
  createFieldId,
  createTableColumn,
  createTableModel,
  createTableRow,
  normalizeDialect,
  normalizeHeaderMode,
  normalizeResolvedHeaderMode,
  normalizeTableFormat,
} from './contracts.js';
import {
  createAutoHeaderAmbiguousDiagnostic,
  createDuplicateHeaderDiagnostic,
  createEmptyHeaderDiagnostic,
  createParseFailedDiagnostic,
  createRaggedRowsDiagnostic,
} from './diagnostics.js';
import { evaluateTableSize } from './limits.js';

const CSV_DELIMITER_CANDIDATES = Object.freeze([',', ';', '|', '\t']);
const TSV_DELIMITER_CANDIDATES = Object.freeze(['\t', ',', ';', '|']);

function byteLengthOf(text) {
  return new TextEncoder().encode(text).length;
}

function detectNewline(text, fallback = '\n') {
  const match = text.match(/\r\n|\n|\r/u);
  if (!match) {
    return fallback;
  }
  return match[0] === '\r\n' ? '\r\n' : '\n';
}

function createSourceRange(line, column, offset) {
  return {
    start: { line, column, offset },
    end: { line, column: column + 1, offset: offset + 1 },
  };
}

function normalizeCellValue(value) {
  return String(value ?? '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n');
}

function isEmptyRow(row) {
  return Array.isArray(row) && row.every((value) => String(value ?? '') === '');
}

function trimTerminalEmptyRows(text, rows) {
  if (!/\r\n|\n|\r$/u.test(String(text ?? ''))) {
    return rows;
  }

  const trimmed = [...rows];
  while (trimmed.length > 0 && isEmptyRow(trimmed[trimmed.length - 1])) {
    trimmed.pop();
  }
  return trimmed;
}

function inferErrorRange(text, error) {
  const row = Number.isFinite(error?.row) ? Number(error.row) : 0;
  const line = Math.max(1, row + 1);
  const lines = String(text ?? '').replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const safeLineIndex = Math.min(Math.max(0, line - 1), Math.max(0, lines.length - 1));
  const prefixLength = lines.slice(0, safeLineIndex).reduce((total, value) => total + value.length + 1, 0);
  const lineText = lines[safeLineIndex] ?? '';
  const column = Math.min(
    Math.max(1, Number.isFinite(error?.index) ? (Number(error.index) - prefixLength + 1) : 1),
    Math.max(1, lineText.length + 1),
  );
  const offset = prefixLength + column - 1;
  return createSourceRange(line, column, offset);
}

function mapPapaError(text, error) {
  return createParseFailedDiagnostic(
    error?.message ?? 'CSV or TSV parsing failed.',
    inferErrorRange(text, error),
  );
}

function isIgnorablePapaError(error) {
  return String(error?.code ?? '') === 'UndetectableDelimiter';
}

function parseRows(text, format, dialectInput) {
  const candidateList = format === 'tsv' ? TSV_DELIMITER_CANDIDATES : CSV_DELIMITER_CANDIDATES;
  const hasExplicitDelimiter = typeof dialectInput?.delimiter === 'string' && dialectInput.delimiter.length > 0;
  const baseDialect = normalizeDialect(dialectInput, format);
  const result = Papa.parse(text, {
    delimiter: hasExplicitDelimiter ? baseDialect.delimiter : '',
    delimitersToGuess: hasExplicitDelimiter ? undefined : candidateList,
    newline: '',
    quoteChar: baseDialect.quoteChar,
    escapeChar: baseDialect.escapeChar,
    header: false,
    skipEmptyLines: false,
  });

  const errors = Array.isArray(result.errors) ? result.errors : [];
  const blockingErrors = errors.filter((error) => !isIgnorablePapaError(error));
  if (blockingErrors.length > 0) {
    return {
      ok: false,
      dialect: normalizeDialect({
        ...dialectInput,
        delimiter: result.meta?.delimiter || baseDialect.delimiter,
        newline: result.meta?.linebreak || dialectInput?.newline || '\n',
      }, format),
      error: mapPapaError(text, blockingErrors[0]),
    };
  }

  const rows = Array.isArray(result.data)
    ? result.data.map((row) => Array.isArray(row) ? row.map(normalizeCellValue) : [normalizeCellValue(row)])
    : [];
  const normalizedRows = trimTerminalEmptyRows(text, rows);
  const dialect = normalizeDialect({
    ...dialectInput,
    delimiter: result.meta?.delimiter || baseDialect.delimiter,
    newline: result.meta?.linebreak || dialectInput?.newline || '\n',
  }, format);

  return {
    ok: true,
    dialect,
    rows: normalizedRows,
  };
}

function detectDelimiter(text, format, dialectInput) {
  const parsed = parseRows(text, format, dialectInput);
  if (parsed.ok) {
    return {
      dialect: parsed.dialect,
      rows: parsed.rows,
    };
  }
  return {
    dialect: parsed.dialect,
    error: parsed.error,
  };
}

function resolveFormat(options = {}) {
  if (options.format) {
    return normalizeTableFormat(options.format, 'csv');
  }
  if (options.languageId === 'csv' || options.resource?.languageId === 'csv') {
    return 'csv';
  }
  if (options.languageId === 'tsv' || options.resource?.languageId === 'tsv') {
    return 'tsv';
  }
  if (options.dialect?.delimiter === '\t') {
    return 'tsv';
  }
  const path = String(options.resource?.path ?? '').toLowerCase();
  if (path.endsWith('.tsv')) {
    return 'tsv';
  }
  return 'csv';
}

function hasAmbiguousAutoHeader(rows) {
  if (rows.length < 2) {
    return false;
  }
  const firstRow = rows[0] ?? [];
  const trimmed = firstRow.map((value) => value.trim());
  const allNonEmpty = trimmed.length > 0 && trimmed.every(Boolean);
  const unique = new Set(trimmed).size === trimmed.length;
  const structurallyConsistent = rows.slice(1).every((row) => row.length === firstRow.length);
  return firstRow.some((value) => value.length > 0) && (!allNonEmpty || !unique || !structurallyConsistent);
}

function resolveHeaderMode(rows, headerMode) {
  const normalized = normalizeHeaderMode(headerMode, 'auto');
  if (normalized === 'header') {
    return 'header';
  }
  if (normalized === 'no-header' || rows.length === 0) {
    return 'no-header';
  }

  const firstRow = rows[0] ?? [];
  const trimmed = firstRow.map((value) => value.trim());
  const allNonEmpty = trimmed.length > 0 && trimmed.every(Boolean);
  const unique = new Set(trimmed).size === trimmed.length;
  const structurallyConsistent = rows.slice(1).every((row) => row.length === firstRow.length);
  return allNonEmpty && unique && structurallyConsistent ? 'header' : 'no-header';
}

function collectHeaderDiagnostics(headerRow) {
  const diagnostics = [];
  const duplicates = new Map();

  for (const [index, header] of headerRow.entries()) {
    const trimmed = header.trim();
    if (!trimmed) {
      diagnostics.push(createEmptyHeaderDiagnostic(index));
      continue;
    }
    const matches = duplicates.get(trimmed) ?? [];
    matches.push(index);
    duplicates.set(trimmed, matches);
  }

  for (const [header, indexes] of duplicates.entries()) {
    if (indexes.length > 1) {
      diagnostics.push(createDuplicateHeaderDiagnostic(header, indexes));
    }
  }

  return diagnostics;
}

function buildColumns(columnCount, resolvedHeaderMode, headerRow = []) {
  const columns = [];
  const sourceHeaders = [];

  for (let index = 0; index < columnCount; index += 1) {
    const field = createFieldId(index);
    const sourceHeader = headerRow[index];
    sourceHeaders.push(sourceHeader);

    if (resolvedHeaderMode === 'header') {
      const hasHeader = index < headerRow.length;
      const headerValue = hasHeader ? sourceHeader : createDisplayLabel(index);
      columns.push(createTableColumn({
        field,
        index,
        label: hasHeader && sourceHeader.length > 0 ? sourceHeader : createDisplayLabel(index),
        headerValue,
        ...(hasHeader ? { sourceHeader } : {}),
        generated: !hasHeader,
      }));
      continue;
    }

    columns.push(createTableColumn({
      field,
      index,
      label: createDisplayLabel(index),
      generated: true,
    }));
  }

  return { columns, sourceHeaders };
}

function buildRows(inputRows, columns, sourceRowOffset) {
  return inputRows.map((inputRow, rowIndex) => {
    const values = {};
    for (const column of columns) {
      values[column.field] = String(inputRow[column.index] ?? '');
    }
    return createTableRow({
      index: rowIndex,
      sourceRowNumber: rowIndex + sourceRowOffset,
      values,
    });
  });
}

function collectRaggedRows(rows, expectedColumns) {
  const rowNumbers = [];
  let actualColumns = expectedColumns;

  rows.forEach((row, index) => {
    if (row.length !== expectedColumns) {
      rowNumbers.push(index + 1);
      actualColumns = Math.max(actualColumns, row.length);
    }
  });

  if (rowNumbers.length === 0) {
    return undefined;
  }

  return createRaggedRowsDiagnostic(rowNumbers, expectedColumns, actualColumns);
}

function createBlockedModel({ format, headerMode, dialect, byteLength, parsedRowCount, parsedColumnCount, diagnostics }) {
  return createTableModel({
    columns: [],
    rows: [],
    diagnostics,
    metadata: {
      format,
      headerMode,
      resolvedHeaderMode: 'no-header',
      dialect,
      source: {
        byteLength,
        parsedRowCount,
        parsedColumnCount,
        dataRowCount: 0,
        dataColumnCount: 0,
        blocked: true,
        warnings: diagnostics
          .filter((diagnostic) => diagnostic.severity === 'warning')
          .map((diagnostic) => diagnostic.code)
          .filter(Boolean),
      },
    },
  });
}

function normalizeSerializeHeaderMode(model, options) {
  const requested = options.headerMode;
  if (requested === 'header' || requested === 'no-header') {
    return requested;
  }
  if (requested === 'auto') {
    return normalizeResolvedHeaderMode(model.metadata?.resolvedHeaderMode, 'no-header');
  }
  return normalizeResolvedHeaderMode(model.metadata?.resolvedHeaderMode, 'no-header');
}

export function parseDelimitedTable(sourceText, options = {}) {
  const text = String(sourceText ?? '');
  const format = resolveFormat(options);
  const headerMode = normalizeHeaderMode(options.headerMode, 'auto');
  const byteLength = byteLengthOf(text);
  const initialDialect = normalizeDialect(
    { ...options.dialect, newline: detectNewline(text, options.dialect?.newline ?? '\n') },
    format,
  );

  const sizeDiagnostics = evaluateTableSize({ byteLength, rowCount: 0, columnCount: 0 });
  if (sizeDiagnostics.some((diagnostic) => diagnostic.blocking)) {
    return createBlockedModel({
      format,
      headerMode,
      dialect: initialDialect,
      byteLength,
      parsedRowCount: 0,
      parsedColumnCount: 0,
      diagnostics: sizeDiagnostics,
    });
  }

  const detected = detectDelimiter(text, format, {
    ...options.dialect,
    newline: initialDialect.newline,
  });
  if (detected.error) {
    return createBlockedModel({
      format,
      headerMode,
      dialect: detected.dialect,
      byteLength,
      parsedRowCount: 0,
      parsedColumnCount: 0,
      diagnostics: [detected.error],
    });
  }

  const parsedRows = detected.rows;
  const parsedColumnCount = parsedRows.length > 0 ? Math.max(...parsedRows.map((row) => row.length)) : 0;
  const postParseSizeDiagnostics = evaluateTableSize({
    byteLength,
    rowCount: parsedRows.length,
    columnCount: parsedColumnCount,
  });
  if (postParseSizeDiagnostics.some((diagnostic) => diagnostic.blocking)) {
    return createBlockedModel({
      format,
      headerMode,
      dialect: detected.dialect,
      byteLength,
      parsedRowCount: parsedRows.length,
      parsedColumnCount,
      diagnostics: postParseSizeDiagnostics,
    });
  }

  const diagnostics = [...postParseSizeDiagnostics];
  const resolvedHeaderMode = resolveHeaderMode(parsedRows, headerMode);
  if (headerMode === 'auto' && resolvedHeaderMode === 'no-header' && hasAmbiguousAutoHeader(parsedRows)) {
    diagnostics.push(createAutoHeaderAmbiguousDiagnostic());
  }

  const headerRow = resolvedHeaderMode === 'header' ? (parsedRows[0] ?? []) : [];
  const dataRows = resolvedHeaderMode === 'header' ? parsedRows.slice(1) : parsedRows;
  const expectedColumns = resolvedHeaderMode === 'header'
    ? headerRow.length
    : (dataRows[0]?.length ?? parsedColumnCount);
  const dataColumnCount = Math.max(
    resolvedHeaderMode === 'header' ? headerRow.length : 0,
    dataRows.length > 0 ? Math.max(...dataRows.map((row) => row.length)) : 0,
  );
  const finalColumnCount = Math.max(expectedColumns, dataColumnCount);

  if (resolvedHeaderMode === 'header') {
    diagnostics.push(...collectHeaderDiagnostics(headerRow));
  }

  const raggedRows = collectRaggedRows(dataRows, expectedColumns || finalColumnCount);
  if (raggedRows) {
    diagnostics.push(raggedRows);
  }

  const { columns, sourceHeaders } = buildColumns(finalColumnCount, resolvedHeaderMode, headerRow);
  const rows = buildRows(dataRows, columns, resolvedHeaderMode === 'header' ? 2 : 1);

  return createTableModel({
    columns,
    rows,
    diagnostics,
    metadata: {
      format,
      headerMode,
      resolvedHeaderMode,
      dialect: detected.dialect,
      sourceHeaders,
      source: {
        byteLength,
        parsedRowCount: parsedRows.length,
        parsedColumnCount,
        dataRowCount: rows.length,
        dataColumnCount: columns.length,
        blocked: false,
        warnings: diagnostics
          .filter((diagnostic) => diagnostic.severity === 'warning')
          .map((diagnostic) => diagnostic.code)
          .filter(Boolean),
      },
    },
  });
}

export function serializeDelimitedTable(model, options = {}) {
  const format = normalizeTableFormat(options.format ?? model?.metadata?.format, 'csv');
  const headerMode = normalizeSerializeHeaderMode(model, options);
  const dialect = normalizeDialect(
    {
      ...model?.metadata?.dialect,
      ...options.dialect,
    },
    format,
  );
  const orderedColumns = [...(model?.columns ?? [])].sort((left, right) => left.index - right.index);
  const rows = [];

  if (headerMode === 'header') {
    rows.push(orderedColumns.map((column, index) =>
      String(column.headerValue ?? column.sourceHeader ?? column.label ?? createDisplayLabel(index))));
  }

  for (const row of model?.rows ?? []) {
    rows.push(orderedColumns.map((column) =>
      String(row.values?.[column.field] ?? '')));
  }

  return Papa.unparse(rows, {
    delimiter: dialect.delimiter,
    newline: dialect.newline,
    quoteChar: dialect.quoteChar,
    escapeChar: dialect.escapeChar,
    header: false,
    skipEmptyLines: false,
  });
}
