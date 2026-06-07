export const TABLES_PACKAGE_ID = '@textforge/tables';

export const tableFormats = Object.freeze(['csv', 'tsv']);
export const tableHeaderModes = Object.freeze(['auto', 'header', 'no-header']);
export const tableResolvedHeaderModes = Object.freeze(['header', 'no-header']);

export function normalizeTableFormat(value, fallback = 'csv') {
  return tableFormats.includes(value) ? value : fallback;
}

export function normalizeHeaderMode(value, fallback = 'auto') {
  return tableHeaderModes.includes(value) ? value : fallback;
}

export function normalizeResolvedHeaderMode(value, fallback = 'no-header') {
  return tableResolvedHeaderModes.includes(value) ? value : fallback;
}

export function normalizeNewline(value, fallback = '\n') {
  if (value === '\r\n' || value === '\n') {
    return value;
  }
  if (value === '\r') {
    return '\n';
  }
  return fallback;
}

export function normalizeDialect(input = {}, format = 'csv') {
  const normalizedFormat = normalizeTableFormat(format);
  const delimiter = typeof input.delimiter === 'string' && input.delimiter.length > 0
    ? input.delimiter
    : normalizedFormat === 'tsv'
      ? '\t'
      : ',';
  const quoteChar = typeof input.quoteChar === 'string' && input.quoteChar.length > 0
    ? input.quoteChar[0]
    : '"';
  const escapeChar = typeof input.escapeChar === 'string' && input.escapeChar.length > 0
    ? input.escapeChar[0]
    : quoteChar;

  return {
    delimiter,
    newline: normalizeNewline(input.newline, '\n'),
    quoteChar,
    escapeChar,
  };
}

export function createFieldId(index) {
  return `column_${index + 1}`;
}

export function createDisplayLabel(index) {
  return `Column ${index + 1}`;
}

export function createTableDiagnostic(message, overrides = {}) {
  return {
    severity: overrides.severity ?? 'warning',
    message,
    code: overrides.code,
    blocking: overrides.blocking ?? (overrides.severity === 'error'),
    origin: {
      packageId: TABLES_PACKAGE_ID,
      subsystem: 'tables',
      ...overrides.origin,
    },
    ...(overrides.source ? { source: overrides.source } : {}),
    ...(overrides.facts ? { facts: { ...overrides.facts } } : {}),
  };
}

export function createTableColumn(overrides = {}) {
  return {
    field: overrides.field ?? createFieldId(overrides.index ?? 0),
    index: overrides.index ?? 0,
    label: overrides.label ?? createDisplayLabel(overrides.index ?? 0),
    ...(overrides.headerValue === undefined ? {} : { headerValue: String(overrides.headerValue) }),
    ...(overrides.sourceHeader === undefined ? {} : { sourceHeader: String(overrides.sourceHeader) }),
    ...(overrides.generated === undefined ? {} : { generated: Boolean(overrides.generated) }),
  };
}

export function createTableRow(overrides = {}) {
  return {
    index: overrides.index ?? 0,
    sourceRowNumber: overrides.sourceRowNumber ?? (overrides.index ?? 0) + 1,
    values: { ...(overrides.values ?? {}) },
  };
}

export function createTableModel(overrides = {}) {
  return {
    columns: [...(overrides.columns ?? [])],
    rows: [...(overrides.rows ?? [])],
    diagnostics: [...(overrides.diagnostics ?? [])],
    metadata: {
      format: normalizeTableFormat(overrides.metadata?.format, 'csv'),
      headerMode: normalizeHeaderMode(overrides.metadata?.headerMode, 'auto'),
      resolvedHeaderMode: normalizeResolvedHeaderMode(overrides.metadata?.resolvedHeaderMode, 'no-header'),
      dialect: normalizeDialect(overrides.metadata?.dialect, overrides.metadata?.format),
      source: {
        byteLength: overrides.metadata?.source?.byteLength ?? 0,
        parsedRowCount: overrides.metadata?.source?.parsedRowCount ?? 0,
        parsedColumnCount: overrides.metadata?.source?.parsedColumnCount ?? 0,
        dataRowCount: overrides.metadata?.source?.dataRowCount ?? 0,
        dataColumnCount: overrides.metadata?.source?.dataColumnCount ?? 0,
        blocked: overrides.metadata?.source?.blocked ?? false,
        warnings: [...(overrides.metadata?.source?.warnings ?? [])],
      },
      ...(overrides.metadata?.sourceHeaders
        ? { sourceHeaders: [...overrides.metadata.sourceHeaders] }
        : {}),
    },
  };
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
