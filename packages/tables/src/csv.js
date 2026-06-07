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

function parseRows(text, dialect) {
  if (text.length === 0) {
    return { ok: true, rows: [] };
  }

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;
  let offset = 0;
  let line = 1;
  let column = 1;

  function pushField() {
    row.push(field);
    field = '';
  }

  function pushRow() {
    pushField();
    rows.push(row);
    row = [];
  }

  while (offset < text.length) {
    const current = text[offset];
    const next = text[offset + 1];

    if (inQuotes) {
      if (current === dialect.escapeChar && dialect.escapeChar !== dialect.quoteChar && next !== undefined) {
        field += next;
        offset += 2;
        if (next === '\n') {
          line += 1;
          column = 1;
        } else {
          column += 2;
        }
        continue;
      }

      if (current === dialect.quoteChar) {
        if (dialect.escapeChar === dialect.quoteChar && next === dialect.quoteChar) {
          field += dialect.quoteChar;
          offset += 2;
          column += 2;
          continue;
        }
        inQuotes = false;
        afterQuote = true;
        offset += 1;
        column += 1;
        continue;
      }

      field += current;
      if (current === '\r' && next === '\n') {
        field = field.slice(0, -1) + '\n';
        offset += 2;
        line += 1;
        column = 1;
        continue;
      }
      if (current === '\n' || current === '\r') {
        field = field.slice(0, -1) + '\n';
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
      offset += 1;
      continue;
    }

    if (afterQuote) {
      if (current === dialect.delimiter) {
        pushField();
        afterQuote = false;
        offset += 1;
        column += 1;
        continue;
      }
      if (current === '\r' && next === '\n') {
        pushRow();
        afterQuote = false;
        offset += 2;
        line += 1;
        column = 1;
        continue;
      }
      if (current === '\n' || current === '\r') {
        pushRow();
        afterQuote = false;
        offset += 1;
        line += 1;
        column = 1;
        continue;
      }
      return {
        ok: false,
        error: createParseFailedDiagnostic(
          'Malformed quoted field contains trailing characters after the closing quote.',
          createSourceRange(line, column, offset),
        ),
      };
    }

    if (current === dialect.quoteChar) {
      if (field.length > 0) {
        return {
          ok: false,
          error: createParseFailedDiagnostic(
            'Malformed quoted field starts after unquoted content.',
            createSourceRange(line, column, offset),
          ),
        };
      }
      inQuotes = true;
      offset += 1;
      column += 1;
      continue;
    }

    if (current === dialect.delimiter) {
      pushField();
      offset += 1;
      column += 1;
      continue;
    }

    if (current === '\r' && next === '\n') {
      pushRow();
      offset += 2;
      line += 1;
      column = 1;
      continue;
    }

    if (current === '\n' || current === '\r') {
      pushRow();
      offset += 1;
      line += 1;
      column = 1;
      continue;
    }

    field += current;
    offset += 1;
    column += 1;
  }

  if (inQuotes) {
    return {
      ok: false,
      error: createParseFailedDiagnostic(
        'Malformed quoted field did not terminate before the end of the document.',
        createSourceRange(line, column, offset),
      ),
    };
  }

  if (afterQuote || field.length > 0 || row.length > 0) {
    pushRow();
  }

  return { ok: true, rows };
}

function scoreDelimiter(rows, delimiter, index) {
  const nonEmptyRows = rows.filter((row) => row.length > 1 || row.some((cell) => cell.length > 0));
  const widths = nonEmptyRows.map((row) => row.length);
  const maxWidth = widths.length > 0 ? Math.max(...widths) : 0;
  const widthCounts = new Map();
  for (const width of widths) {
    widthCounts.set(width, (widthCounts.get(width) ?? 0) + 1);
  }
  const dominantWidth = [...widthCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 0;
  const consistentCount = dominantWidth > 0 ? widths.filter((width) => width === dominantWidth).length : 0;
  const tabPreference = delimiter === '\t' ? 1 : 0;

  return {
    score: (maxWidth * 10_000) + (consistentCount * 100) + tabPreference - index,
    maxWidth,
    rows,
  };
}

function detectDelimiter(text, format, dialectInput) {
  if (typeof dialectInput?.delimiter === 'string' && dialectInput.delimiter.length > 0) {
    const dialect = normalizeDialect(dialectInput, format);
    const parsed = parseRows(text, dialect);
    return parsed.ok
      ? { dialect, rows: parsed.rows }
      : { dialect, error: parsed.error };
  }

  const candidateList = format === 'tsv' ? TSV_DELIMITER_CANDIDATES : CSV_DELIMITER_CANDIDATES;
  let best;

  for (const [index, delimiter] of candidateList.entries()) {
    const dialect = normalizeDialect({ ...dialectInput, delimiter }, format);
    const parsed = parseRows(text, dialect);
    if (!parsed.ok) {
      continue;
    }
    const candidate = scoreDelimiter(parsed.rows, delimiter, index);
    if (!best || candidate.score > best.score) {
      best = {
        ...candidate,
        dialect,
      };
    }
  }

  if (best) {
    return {
      dialect: best.dialect,
      rows: best.rows,
    };
  }

  const fallbackDialect = normalizeDialect({ ...dialectInput, delimiter: format === 'tsv' ? '\t' : ',' }, format);
  const fallback = parseRows(text, fallbackDialect);
  return fallback.ok
    ? { dialect: fallbackDialect, rows: fallback.rows }
    : { dialect: fallbackDialect, error: fallback.error };
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

function encodeCell(value, dialect) {
  const raw = String(value ?? '');
  const needsQuotes = raw.includes(dialect.delimiter)
    || raw.includes('\n')
    || raw.includes('\r')
    || raw.includes(dialect.quoteChar)
    || /^\s|\s$/u.test(raw);

  if (!needsQuotes) {
    return raw;
  }

  let encoded = raw;
  if (dialect.escapeChar === dialect.quoteChar) {
    encoded = encoded.replaceAll(dialect.quoteChar, `${dialect.quoteChar}${dialect.quoteChar}`);
  } else {
    encoded = encoded
      .replaceAll(dialect.escapeChar, `${dialect.escapeChar}${dialect.escapeChar}`)
      .replaceAll(dialect.quoteChar, `${dialect.escapeChar}${dialect.quoteChar}`);
  }

  return `${dialect.quoteChar}${encoded}${dialect.quoteChar}`;
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
  const lines = [];

  if (headerMode === 'header') {
    lines.push(orderedColumns.map((column, index) =>
      encodeCell(
        column.headerValue ?? column.sourceHeader ?? column.label ?? createDisplayLabel(index),
        dialect,
      )));
  }

  for (const row of model?.rows ?? []) {
    lines.push(orderedColumns.map((column) =>
      encodeCell(row.values?.[column.field] ?? '', dialect)));
  }

  return lines.map((cells) => cells.join(dialect.delimiter)).join(dialect.newline);
}
