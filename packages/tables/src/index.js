import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createResourcePredicate,
} from '@textforge/core';
import {
  createWorkspaceItmIncludeProvider,
  loadItmDocument,
  resolveItmVisualTarget,
} from '@textforge/itm';

const element = React.createElement;

export const tablesSurfaceCapabilityId = '@textforge/tables/capability/surface';
export const tablesStructuredEditCapabilityId = '@textforge/tables/capability/structured-edit';
export const tablesDiagnosticsCapabilityId = '@textforge/tables/capability/diagnostics';

export const tablesDelimitedSurfaceId = '@textforge/tables/delimited-grid';
export const tablesCatalogueSurfaceId = '@textforge/tables/catalogue';
export const tablesMatrixSurfaceId = '@textforge/tables/matrix';
export const tablesDiagnosticsSurfaceId = '@textforge/tables/diagnostics';

export const csvDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['csv'],
  mimeTypes: ['text/csv'],
  fileExtensions: ['csv'],
});

export const tsvDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['tsv'],
  mimeTypes: ['text/tab-separated-values'],
  fileExtensions: ['tsv'],
});

export const delimitedDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['csv', 'tsv'],
  mimeTypes: ['text/csv', 'text/tab-separated-values'],
  fileExtensions: ['csv', 'tsv'],
});

export const itmDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
});

const genericResourcePredicate = createResourcePredicate({
  representations: ['text', 'bytes'],
});

const defaultDelimitedColumnCount = 3;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeDelimitedField(value, delimiter) {
  const text = String(value ?? '');
  if (
    text.includes('"')
    || text.includes('\n')
    || text.includes('\r')
    || text.includes(delimiter)
    || /^\s|\s$/u.test(text)
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function createSlug(value, fallback) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return normalized || fallback;
}

function createDelimitedColumnLabel(index) {
  return `Column ${index + 1}`;
}

function normalizeLineEndings(text) {
  return String(text ?? '').replace(/\r\n?/gu, '\n');
}

function coerceSearchText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function formatValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const pairs = Object.entries(value)
      .map(([key, item]) => `${key}: ${formatValue(item)}`)
      .filter((entry) => !entry.endsWith(': '));
    return pairs.join('; ');
  }
  return String(value);
}

function joinSearchFragments(...fragments) {
  return fragments
    .flatMap((fragment) => Array.isArray(fragment) ? fragment : [fragment])
    .map((fragment) => formatValue(fragment))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function deduplicateDiagnostics(diagnostics = []) {
  const seen = new Set();
  const next = [];
  for (const diagnostic of diagnostics) {
    const key = [
      diagnostic?.severity,
      diagnostic?.code,
      diagnostic?.message,
      diagnostic?.resource?.path,
      diagnostic?.source?.start?.line,
      diagnostic?.source?.start?.column,
    ].join('|');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push(diagnostic);
  }
  return next;
}

function createTablesDiagnostic(message, severity = 'warning', overrides = {}) {
  return createDiagnostic(message, severity, {
    origin: {
      packageId: '@textforge/tables',
      subsystem: 'tables',
      ...overrides.origin,
    },
    ...overrides,
  });
}

export function inferDelimitedDialect(resource = {}) {
  const languageId = String(resource.languageId ?? '').trim().toLowerCase();
  const mimeType = String(resource.mimeType ?? '').trim().toLowerCase();
  const path = String(resource.path ?? '').trim().toLowerCase();
  if (languageId === 'tsv' || mimeType === 'text/tab-separated-values' || path.endsWith('.tsv')) {
    return {
      id: 'tsv',
      delimiter: '\t',
      label: 'TSV',
      fileExtension: 'tsv',
    };
  }
  return {
    id: 'csv',
    delimiter: ',',
    label: 'CSV',
    fileExtension: 'csv',
  };
}

export function createEmptyDelimitedTableState(options = {}) {
  const columnCount = Math.max(0, Number(options.columnCount ?? defaultDelimitedColumnCount));
  const hasHeader = options.hasHeader !== false;
  const columns = Array.from({ length: columnCount }, (_, index) => ({
    id: `column-${index}`,
    label: createDelimitedColumnLabel(index),
  }));
  return {
    dialect: options.dialect ?? 'csv',
    delimiter: options.delimiter ?? ',',
    hasHeader,
    columns,
    rows: [],
    diagnostics: [],
  };
}

export function parseDelimitedText(source, options = {}) {
  const delimiter = String(options.delimiter ?? ',');
  const dialect = String(options.dialect ?? (delimiter === '\t' ? 'tsv' : 'csv'));
  const hasHeader = options.hasHeader !== false;
  const diagnostics = [];
  const text = String(source ?? '');
  if (text === '') {
    return createEmptyDelimitedTableState({
      delimiter,
      dialect,
      hasHeader,
      columnCount: options.columnCount ?? defaultDelimitedColumnCount,
    });
  }

  const rows = [];
  let row = [];
  let field = '';
  let index = 0;
  let insideQuotes = false;

  while (index < text.length) {
    const character = text[index];
    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        insideQuotes = false;
        index += 1;
        continue;
      }
      field += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      index += 1;
      continue;
    }

    if (character === delimiter) {
      row.push(field);
      field = '';
      index += 1;
      continue;
    }

    if (character === '\r') {
      if (text[index + 1] === '\n') {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      index += 1;
      continue;
    }

    if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      index += 1;
      continue;
    }

    field += character;
    index += 1;
  }

  if (insideQuotes) {
    diagnostics.push(createTablesDiagnostic(
      'Delimited text ended with an unterminated quoted field; the final field was recovered best-effort.',
      'warning',
      {
        code: 'tables.delimited.unterminated-quote',
      },
    ));
  }

  if (
    field.length > 0
    || row.length > 0
    || text.endsWith(delimiter)
    || text.endsWith('\n')
    || text.endsWith('\r')
  ) {
    row.push(field);
    rows.push(row);
  }

  const width = rows.reduce((max, current) => Math.max(max, current.length), 0);
  const normalizedRows = rows.map((current) => {
    const next = current.slice();
    while (next.length < width) {
      next.push('');
    }
    return next;
  });

  const headerCells = hasHeader && normalizedRows.length > 0
    ? normalizedRows[0]
    : Array.from({ length: width }, (_, columnIndex) => createDelimitedColumnLabel(columnIndex));
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;
  const columns = headerCells.map((header, columnIndex) => ({
    id: `column-${columnIndex}`,
    label: String(header ?? '').trim() || createDelimitedColumnLabel(columnIndex),
  }));

  return {
    dialect,
    delimiter,
    hasHeader,
    columns,
    rows: dataRows.map((cells, rowIndex) => ({
      id: `row-${rowIndex}`,
      cells: cells.slice(0, columns.length),
    })),
    diagnostics,
  };
}

function normalizeDelimitedState(input, options = {}) {
  const delimiter = String(input?.delimiter ?? options.delimiter ?? ',');
  const dialect = String(input?.dialect ?? options.dialect ?? (delimiter === '\t' ? 'tsv' : 'csv'));
  const hasHeader = input?.hasHeader !== false;
  const requestedWidth = Math.max(
    Array.isArray(input?.columns) ? input.columns.length : 0,
    ...(Array.isArray(input?.rows)
      ? input.rows.map((row) => Array.isArray(row?.cells) ? row.cells.length : 0)
      : [0]),
  );
  const width = Math.max(0, requestedWidth);
  const columns = Array.from({ length: width }, (_, columnIndex) => ({
    id: input?.columns?.[columnIndex]?.id ?? `column-${columnIndex}`,
    label: String(input?.columns?.[columnIndex]?.label ?? '').trim() || createDelimitedColumnLabel(columnIndex),
  }));
  const rows = (input?.rows ?? []).map((row, rowIndex) => {
    const cells = Array.isArray(row?.cells) ? row.cells.slice(0, width) : [];
    while (cells.length < width) {
      cells.push('');
    }
    return {
      id: row?.id ?? `row-${rowIndex}`,
      cells,
    };
  });
  return {
    dialect,
    delimiter,
    hasHeader,
    columns,
    rows,
    diagnostics: Array.isArray(input?.diagnostics) ? input.diagnostics : [],
  };
}

export function serializeDelimitedText(input, options = {}) {
  const state = normalizeDelimitedState(input, options);
  const lines = [];
  if (state.hasHeader && state.columns.length > 0) {
    lines.push(state.columns.map((column) => escapeDelimitedField(column.label, state.delimiter)).join(state.delimiter));
  }
  for (const row of state.rows) {
    lines.push(
      state.columns
        .map((_, columnIndex) => escapeDelimitedField(row.cells[columnIndex] ?? '', state.delimiter))
        .join(state.delimiter),
    );
  }
  return lines.join('\n');
}

export function addDelimitedRow(input, options = {}) {
  const state = normalizeDelimitedState(input);
  const width = state.columns.length || Math.max(1, Number(options.minimumColumns ?? defaultDelimitedColumnCount));
  if (state.columns.length === 0) {
    state.columns = Array.from({ length: width }, (_, columnIndex) => ({
      id: `column-${columnIndex}`,
      label: createDelimitedColumnLabel(columnIndex),
    }));
  }
  state.rows.push({
    id: `row-${state.rows.length}`,
    cells: Array.from({ length: state.columns.length }, () => ''),
  });
  return normalizeDelimitedState(state);
}

export function addDelimitedColumn(input, label) {
  const state = normalizeDelimitedState(input);
  const columnIndex = state.columns.length;
  state.columns.push({
    id: `column-${columnIndex}`,
    label: String(label ?? '').trim() || createDelimitedColumnLabel(columnIndex),
  });
  for (const row of state.rows) {
    row.cells.push('');
  }
  return normalizeDelimitedState(state);
}

export function removeDelimitedRow(input, rowIndex) {
  const state = normalizeDelimitedState(input);
  if (rowIndex < 0 || rowIndex >= state.rows.length) {
    return state;
  }
  state.rows.splice(rowIndex, 1);
  return normalizeDelimitedState(state);
}

export function removeDelimitedColumn(input, columnIndex) {
  const state = normalizeDelimitedState(input);
  if (columnIndex < 0 || columnIndex >= state.columns.length) {
    return state;
  }
  state.columns.splice(columnIndex, 1);
  for (const row of state.rows) {
    row.cells.splice(columnIndex, 1);
  }
  return normalizeDelimitedState(state);
}

export function updateDelimitedCell(input, rowIndex, columnIndex, value) {
  const state = normalizeDelimitedState(input);
  if (rowIndex < 0 || rowIndex >= state.rows.length) {
    return state;
  }
  if (columnIndex < 0 || columnIndex >= state.columns.length) {
    return state;
  }
  state.rows[rowIndex].cells[columnIndex] = String(value ?? '');
  return normalizeDelimitedState(state);
}

export function updateDelimitedColumnLabel(input, columnIndex, label) {
  const state = normalizeDelimitedState(input);
  if (columnIndex < 0 || columnIndex >= state.columns.length) {
    return state;
  }
  state.columns[columnIndex].label = String(label ?? '').trim() || createDelimitedColumnLabel(columnIndex);
  return normalizeDelimitedState(state);
}

export function createDelimitedPatchSummary(baselineInput, currentInput, options = {}) {
  const baseline = normalizeDelimitedState(baselineInput, options);
  const current = normalizeDelimitedState(currentInput, options);
  const sharedRowCount = Math.min(baseline.rows.length, current.rows.length);
  const sharedColumnCount = Math.min(baseline.columns.length, current.columns.length);
  let changedCellCount = 0;
  let changedHeaderCount = 0;

  for (let columnIndex = 0; columnIndex < sharedColumnCount; columnIndex += 1) {
    if (baseline.columns[columnIndex].label !== current.columns[columnIndex].label) {
      changedHeaderCount += 1;
    }
  }
  for (let rowIndex = 0; rowIndex < sharedRowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < sharedColumnCount; columnIndex += 1) {
      if ((baseline.rows[rowIndex].cells[columnIndex] ?? '') !== (current.rows[rowIndex].cells[columnIndex] ?? '')) {
        changedCellCount += 1;
      }
    }
  }

  return {
    changedCellCount,
    changedHeaderCount,
    addedRowCount: Math.max(0, current.rows.length - baseline.rows.length),
    removedRowCount: Math.max(0, baseline.rows.length - current.rows.length),
    addedColumnCount: Math.max(0, current.columns.length - baseline.columns.length),
    removedColumnCount: Math.max(0, baseline.columns.length - current.columns.length),
    nextText: serializeDelimitedText(current, options),
  };
}

function createItmTableIncludeProviders(execution) {
  const includeProviders = [];
  if (execution.workspaceService?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(execution.workspaceService, {
      basePath: execution.resource?.path,
      ...(execution.repositoryResolution ?? {}),
    }));
  }
  return includeProviders;
}

export function buildItmCatalogueTableSections(projected) {
  const catalogue = projected?.catalogues ?? {};
  return [
    {
      id: 'entities',
      label: 'Entities',
      emptyLabel: 'No entities matched the selected ITM target.',
      columns: [
        { id: 'label', header: 'Label', accessorKey: 'label', enableSorting: true },
        { id: 'typeRef', header: 'Type', accessorKey: 'typeRef', enableSorting: true },
        { id: 'parentLabel', header: 'Parent', accessorKey: 'parentLabel', enableSorting: true },
        { id: 'tags', header: 'Tags', accessorKey: 'tags', enableSorting: true },
        { id: 'description', header: 'Description', accessorKey: 'description', enableSorting: true },
        { id: 'attributes', header: 'Attributes', accessorKey: 'attributes', enableSorting: false },
        { id: 'id', header: 'ID', accessorKey: 'id', enableSorting: true },
      ],
      rows: (catalogue.entities ?? []).map((entry) => ({
        id: entry.id,
        label: entry.label ?? '',
        typeRef: entry.typeRef ?? '',
        parentLabel: entry.parentLabel ?? '',
        tags: formatValue(entry.tags),
        description: entry.description ?? '',
        attributes: formatValue(entry.attributes),
        searchText: joinSearchFragments(
          entry.label,
          entry.typeRef,
          entry.parentLabel,
          entry.tags,
          entry.description,
          entry.attributes,
          entry.id,
        ),
      })),
    },
    {
      id: 'relationships',
      label: 'Relationships',
      emptyLabel: 'No relationships matched the selected ITM target.',
      columns: [
        { id: 'label', header: 'Label', accessorKey: 'label', enableSorting: true },
        { id: 'typeRef', header: 'Type', accessorKey: 'typeRef', enableSorting: true },
        { id: 'relationshipKind', header: 'Kind', accessorKey: 'relationshipKind', enableSorting: true },
        { id: 'sourceLabel', header: 'Source', accessorKey: 'sourceLabel', enableSorting: true },
        { id: 'targetLabel', header: 'Target', accessorKey: 'targetLabel', enableSorting: true },
        { id: 'implicit', header: 'Implicit', accessorKey: 'implicitLabel', enableSorting: true },
        { id: 'attributes', header: 'Attributes', accessorKey: 'attributes', enableSorting: false },
        { id: 'id', header: 'ID', accessorKey: 'id', enableSorting: true },
      ],
      rows: (catalogue.relationships ?? []).map((entry) => ({
        id: entry.id,
        label: entry.label ?? '',
        typeRef: entry.typeRef ?? '',
        relationshipKind: entry.relationshipKind ?? '',
        sourceLabel: entry.sourceLabel ?? '',
        targetLabel: entry.targetLabel ?? '',
        implicitLabel: entry.implicit ? 'Yes' : 'No',
        attributes: formatValue(entry.attributes),
        searchText: joinSearchFragments(
          entry.label,
          entry.typeRef,
          entry.relationshipKind,
          entry.sourceLabel,
          entry.targetLabel,
          entry.implicit,
          entry.attributes,
          entry.id,
        ),
      })),
    },
    {
      id: 'views',
      label: 'Views',
      emptyLabel: 'The selected ITM target does not declare any concrete views.',
      columns: [
        { id: 'name', header: 'Name', accessorKey: 'name', enableSorting: true },
        { id: 'title', header: 'Title', accessorKey: 'title', enableSorting: true },
        { id: 'viewpointRef', header: 'Viewpoint', accessorKey: 'viewpointRef', enableSorting: true },
        { id: 'parameters', header: 'Parameters', accessorKey: 'parameters', enableSorting: false },
        { id: 'notes', header: 'Notes', accessorKey: 'notes', enableSorting: false },
        { id: 'id', header: 'ID', accessorKey: 'id', enableSorting: true },
      ],
      rows: (catalogue.views ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name ?? '',
        title: entry.title ?? '',
        viewpointRef: entry.viewpointRef ?? '',
        parameters: formatValue(entry.parameters),
        notes: formatValue(entry.notes),
        searchText: joinSearchFragments(
          entry.id,
          entry.name,
          entry.title,
          entry.viewpointRef,
          entry.parameters,
          entry.notes,
        ),
      })),
    },
    {
      id: 'viewpoints',
      label: 'Viewpoints',
      emptyLabel: 'The selected ITM target does not declare any viewpoints.',
      columns: [
        { id: 'name', header: 'Name', accessorKey: 'name', enableSorting: true },
        { id: 'title', header: 'Title', accessorKey: 'title', enableSorting: true },
        { id: 'supportsVisualEditing', header: 'Visual editing', accessorKey: 'supportsVisualEditingLabel', enableSorting: true },
        { id: 'stepCount', header: 'Steps', accessorKey: 'stepCount', enableSorting: true },
        { id: 'id', header: 'ID', accessorKey: 'id', enableSorting: true },
      ],
      rows: (catalogue.viewpoints ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name ?? '',
        title: entry.title ?? '',
        supportsVisualEditingLabel: entry.supportsVisualEditing ? 'Yes' : 'No',
        stepCount: Number(entry.stepCount ?? 0),
        searchText: joinSearchFragments(
          entry.id,
          entry.name,
          entry.title,
          entry.supportsVisualEditing,
          entry.stepCount,
        ),
      })),
    },
  ];
}

export function buildItmMatrixTableModel(projected, options = {}) {
  const matrix = projected?.matrix ?? { rows: [], columns: [], cells: [], nonEmptyCellCount: 0 };
  const showEmptyRows = options.showEmptyRows === true;
  const showEmptyColumns = options.showEmptyColumns === true;
  const cellByKey = new Map(
    (matrix.cells ?? []).map((cell) => [`${cell.rowId}=>${cell.columnId}`, cell]),
  );
  const nonEmptyRowIds = new Set((matrix.cells ?? []).filter((cell) => Number(cell.count ?? 0) > 0).map((cell) => cell.rowId));
  const nonEmptyColumnIds = new Set((matrix.cells ?? []).filter((cell) => Number(cell.count ?? 0) > 0).map((cell) => cell.columnId));
  const visibleColumns = (matrix.columns ?? []).filter((column) => showEmptyColumns || nonEmptyColumnIds.has(column.id));
  const visibleRows = (matrix.rows ?? []).filter((row) => showEmptyRows || nonEmptyRowIds.has(row.id));

  const rows = visibleRows.map((row) => {
    const counts = {};
    let totalCount = 0;
    for (const column of visibleColumns) {
      const cell = cellByKey.get(`${row.id}=>${column.id}`);
      const count = Number(cell?.count ?? 0);
      counts[column.id] = count;
      totalCount += count;
    }
    return {
      id: row.id,
      rowLabel: row.label ?? '',
      rowTypeRef: row.typeRef ?? '',
      totalCount,
      counts,
      searchText: joinSearchFragments(row.id, row.label, row.typeRef, totalCount),
    };
  });

  const cellRows = (matrix.cells ?? [])
    .filter((cell) => Number(cell.count ?? 0) > 0)
    .map((cell) => {
      const row = (matrix.rows ?? []).find((candidate) => candidate.id === cell.rowId);
      const column = (matrix.columns ?? []).find((candidate) => candidate.id === cell.columnId);
      return {
        id: `${cell.rowId}=>${cell.columnId}`,
        sourceLabel: row?.label ?? cell.rowId,
        sourceTypeRef: row?.typeRef ?? '',
        targetLabel: column?.label ?? cell.columnId,
        targetTypeRef: column?.typeRef ?? '',
        count: Number(cell.count ?? 0),
        relationshipTypes: formatValue(cell.relationshipTypes),
        relationshipKinds: formatValue(cell.relationshipKinds),
        edgeIds: formatValue(cell.edgeIds),
        searchText: joinSearchFragments(
          row?.label,
          row?.typeRef,
          column?.label,
          column?.typeRef,
          cell.relationshipTypes,
          cell.relationshipKinds,
          cell.edgeIds,
          cell.count,
        ),
      };
    });

  return {
    showEmptyRows,
    showEmptyColumns,
    visibleColumns,
    rows,
    cellRows,
    nonEmptyCellCount: Number(matrix.nonEmptyCellCount ?? 0),
    totalRowCount: (matrix.rows ?? []).length,
    totalColumnCount: (matrix.columns ?? []).length,
  };
}

export function buildDiagnosticsTableModel(diagnosticsInput = [], options = {}) {
  const diagnostics = deduplicateDiagnostics(diagnosticsInput);
  const title = String(options.title ?? 'Diagnostics');
  return {
    title,
    columns: [
      { id: 'severity', header: 'Severity', accessorKey: 'severity', enableSorting: true },
      { id: 'code', header: 'Code', accessorKey: 'code', enableSorting: true },
      { id: 'message', header: 'Message', accessorKey: 'message', enableSorting: true },
      { id: 'resourcePath', header: 'Resource', accessorKey: 'resourcePath', enableSorting: true },
      { id: 'location', header: 'Location', accessorKey: 'location', enableSorting: true },
      { id: 'origin', header: 'Origin', accessorKey: 'origin', enableSorting: true },
    ],
    rows: diagnostics.map((diagnostic, index) => ({
      id: `${createSlug(diagnostic.code ?? diagnostic.message, 'diagnostic')}-${index}`,
      severity: diagnostic.severity ?? 'warning',
      code: diagnostic.code ?? '',
      message: diagnostic.message ?? '',
      resourcePath: diagnostic.resource?.path ?? diagnostic.resource?.resourceId ?? '',
      location: diagnostic.source?.start?.line
        ? `L${diagnostic.source.start.line}:${diagnostic.source.start.column ?? 1}`
        : '',
      origin: [
        diagnostic.origin?.packageId,
        diagnostic.origin?.subsystem,
        diagnostic.origin?.contributionId,
      ].filter(Boolean).join(' / '),
      searchText: joinSearchFragments(
        diagnostic.severity,
        diagnostic.code,
        diagnostic.message,
        diagnostic.resource?.path,
        diagnostic.resource?.resourceId,
        diagnostic.source?.start?.line,
        diagnostic.source?.start?.column,
        diagnostic.origin?.packageId,
        diagnostic.origin?.subsystem,
        diagnostic.origin?.contributionId,
      ),
    })),
  };
}

function filterRows(rows, searchText) {
  const normalized = coerceSearchText(searchText);
  if (!normalized) {
    return rows;
  }
  return rows.filter((row) => String(row?.searchText ?? '').includes(normalized));
}

function readSurfaceTheme() {
  return {
    shell: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      height: '100%',
      minHeight: 0,
      padding: '16px',
      boxSizing: 'border-box',
      background: 'linear-gradient(180deg, rgba(8, 17, 32, 0.98), rgba(10, 21, 39, 0.98))',
      color: '#d9e4f2',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      alignItems: 'flex-start',
      padding: '16px 18px',
      borderRadius: '18px',
      background: 'linear-gradient(135deg, rgba(20, 33, 53, 0.96), rgba(11, 20, 35, 0.98))',
      border: '1px solid rgba(110, 141, 188, 0.18)',
      boxShadow: '0 18px 44px rgba(3, 10, 24, 0.28)',
    },
    eyebrow: {
      margin: 0,
      fontSize: '0.76rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#8fb6ff',
    },
    title: {
      margin: '6px 0 0',
      fontSize: '1.18rem',
      fontWeight: 700,
    },
    subtitle: {
      margin: '8px 0 0',
      color: '#9fb3d4',
      fontSize: '0.92rem',
      lineHeight: 1.5,
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
      gap: '10px',
      minWidth: '260px',
    },
    statCard: {
      padding: '10px 12px',
      borderRadius: '14px',
      background: 'rgba(7, 15, 28, 0.66)',
      border: '1px solid rgba(109, 137, 183, 0.14)',
    },
    statLabel: {
      margin: 0,
      fontSize: '0.72rem',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#7d95bb',
    },
    statValue: {
      margin: '6px 0 0',
      fontSize: '1rem',
      fontWeight: 700,
      color: '#e8f1ff',
    },
    toolbar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
      padding: '12px 14px',
      borderRadius: '16px',
      background: 'rgba(6, 13, 26, 0.74)',
      border: '1px solid rgba(109, 137, 183, 0.14)',
    },
    search: {
      flex: '1 1 220px',
      minWidth: '200px',
      padding: '10px 12px',
      borderRadius: '12px',
      border: '1px solid rgba(117, 146, 192, 0.2)',
      background: 'rgba(9, 18, 33, 0.92)',
      color: '#e8f1ff',
    },
    button: {
      border: '1px solid rgba(117, 146, 192, 0.26)',
      background: 'linear-gradient(180deg, rgba(34, 49, 75, 0.98), rgba(17, 27, 44, 0.98))',
      color: '#e8f1ff',
      borderRadius: '12px',
      minHeight: '38px',
      padding: '0 14px',
      cursor: 'pointer',
      fontWeight: 600,
    },
    buttonMuted: {
      border: '1px solid rgba(117, 146, 192, 0.16)',
      background: 'rgba(10, 18, 31, 0.7)',
      color: '#bac9e2',
      borderRadius: '12px',
      minHeight: '38px',
      padding: '0 12px',
      cursor: 'pointer',
    },
    buttonDanger: {
      border: '1px solid rgba(245, 158, 11, 0.28)',
      background: 'linear-gradient(180deg, rgba(89, 44, 14, 0.96), rgba(63, 29, 10, 0.98))',
      color: '#ffe9ca',
      borderRadius: '12px',
      minHeight: '36px',
      padding: '0 12px',
      cursor: 'pointer',
    },
    sectionTabs: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    tableFrame: {
      flex: '1 1 auto',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '12px',
      borderRadius: '18px',
      background: 'rgba(6, 13, 25, 0.84)',
      border: '1px solid rgba(109, 137, 183, 0.14)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
    },
    scroll: {
      overflow: 'auto',
      minHeight: 0,
      borderRadius: '14px',
      border: '1px solid rgba(109, 137, 183, 0.14)',
      background: 'rgba(7, 14, 27, 0.72)',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      fontSize: '0.92rem',
    },
    th: {
      position: 'sticky',
      top: 0,
      zIndex: 1,
      background: 'rgba(11, 22, 40, 0.98)',
      color: '#dfe9fb',
      textAlign: 'left',
      padding: '12px 14px',
      borderBottom: '1px solid rgba(109, 137, 183, 0.16)',
      whiteSpace: 'nowrap',
      fontWeight: 700,
    },
    td: {
      padding: '11px 14px',
      borderBottom: '1px solid rgba(109, 137, 183, 0.1)',
      color: '#d3def2',
      verticalAlign: 'top',
    },
    subtle: {
      color: '#8ea6ca',
      fontSize: '0.82rem',
    },
    mono: {
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: '0.84rem',
    },
    empty: {
      margin: 0,
      padding: '32px 18px',
      textAlign: 'center',
      color: '#8ea6ca',
    },
    input: {
      width: '100%',
      minHeight: '34px',
      borderRadius: '10px',
      border: '1px solid rgba(117, 146, 192, 0.2)',
      background: 'rgba(9, 18, 33, 0.96)',
      color: '#f8fbff',
      padding: '8px 10px',
      boxSizing: 'border-box',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: '28px',
      padding: '0 10px',
      borderRadius: '999px',
      background: 'rgba(37, 99, 235, 0.15)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      color: '#b8d7ff',
      fontSize: '0.78rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    warning: {
      padding: '10px 12px',
      borderRadius: '12px',
      background: 'rgba(107, 49, 16, 0.26)',
      border: '1px solid rgba(245, 158, 11, 0.24)',
      color: '#ffd9b0',
      fontSize: '0.86rem',
    },
    checkboxLabel: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#c4d5f3',
      fontSize: '0.88rem',
    },
    textareaCell: {
      width: '100%',
      minHeight: '34px',
      borderRadius: '10px',
      border: '1px solid rgba(117, 146, 192, 0.2)',
      background: 'rgba(9, 18, 33, 0.96)',
      color: '#f8fbff',
      padding: '8px 10px',
      boxSizing: 'border-box',
      resize: 'vertical',
    },
  };
}

function SurfaceShell({ title, subtitle, eyebrow, stats, toolbarChildren, children, warning }) {
  const theme = readSurfaceTheme();
  return element(
    'section',
    { style: theme.shell },
    element(
      'header',
      { style: theme.header },
      element(
        'div',
        { style: { flex: '1 1 auto', minWidth: 0 } },
        element('p', { style: theme.eyebrow }, eyebrow),
        element('h3', { style: theme.title }, title),
        subtitle ? element('p', { style: theme.subtitle }, subtitle) : null,
      ),
      stats?.length
        ? element(
          'div',
          { style: theme.stats },
          ...stats.map((stat) =>
            element(
              'div',
              { key: stat.label, style: theme.statCard },
              element('p', { style: theme.statLabel }, stat.label),
              element('p', { style: theme.statValue }, stat.value),
            )),
        )
        : null,
    ),
    warning ? element('div', { style: theme.warning }, warning) : null,
    toolbarChildren
      ? element('div', { style: theme.toolbar }, toolbarChildren)
      : null,
    children,
  );
}

function SortableHeader({ header, theme }) {
  const canSort = header.column.getCanSort();
  const direction = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!canSort) {
    return element('span', null, label);
  }
  return element(
    'button',
    {
      type: 'button',
      style: {
        ...theme.buttonMuted,
        minHeight: '30px',
        padding: '0 8px',
        fontWeight: 700,
      },
      onClick: header.column.getToggleSortingHandler(),
    },
    `${label}${direction === 'asc' ? ' ↑' : direction === 'desc' ? ' ↓' : ''}`,
  );
}

function ReadOnlyDataTable({ title, subtitle, rows, columns, emptyLabel, searchPlaceholder }) {
  const theme = readSurfaceTheme();
  const [searchText, setSearchText] = React.useState('');
  const [sorting, setSorting] = React.useState([]);
  const deferredSearchText = React.useDeferredValue(searchText);
  const filteredRows = filterRows(rows, deferredSearchText);
  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return element(
    SurfaceShell,
    {
      eyebrow: 'TanStack table',
      title,
      subtitle,
      stats: [
        { label: 'Rows', value: String(rows.length) },
        { label: 'Visible', value: String(filteredRows.length) },
        { label: 'Columns', value: String(columns.length) },
      ],
      toolbarChildren: [
        element('input', {
          key: 'search',
          type: 'search',
          value: searchText,
          placeholder: searchPlaceholder,
          onChange(event) {
            React.startTransition(() => {
              setSearchText(event.target.value);
            });
          },
          style: theme.search,
        }),
        element('span', { key: 'badge', style: theme.badge }, 'Read only'),
      ],
    },
    element(
      'div',
      { style: theme.tableFrame },
      element(
        'div',
        { style: theme.scroll },
        filteredRows.length === 0
          ? element('p', { style: theme.empty }, emptyLabel)
          : element(
            'table',
            { style: theme.table },
            element(
              'thead',
              null,
              ...table.getHeaderGroups().map((headerGroup) =>
                element(
                  'tr',
                  { key: headerGroup.id },
                  ...headerGroup.headers.map((header) =>
                    element(
                      'th',
                      { key: header.id, style: theme.th },
                      header.isPlaceholder
                        ? null
                        : element(SortableHeader, { header, theme }),
                    )),
                )),
            ),
            element(
              'tbody',
              null,
              ...table.getRowModel().rows.map((row) =>
                element(
                  'tr',
                  { key: row.id },
                  ...row.getVisibleCells().map((cell) =>
                    element(
                      'td',
                      { key: cell.id, style: theme.td },
                      flexRender(cell.column.columnDef.cell ?? cell.column.columnDef.accessorKey, cell.getContext()),
                    )),
                )),
            ),
          ),
      ),
    ),
  );
}

function CatalogueSurfaceApp({ projected, target }) {
  const sections = buildItmCatalogueTableSections(projected);
  const [activeSectionId, setActiveSectionId] = React.useState(sections.find((section) => section.rows.length > 0)?.id ?? sections[0]?.id ?? 'entities');
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const theme = readSurfaceTheme();

  return element(
    SurfaceShell,
    {
      eyebrow: 'Catalogue surface',
      title: target?.label ?? 'ITM catalogue',
      subtitle: projected?.view
        ? `View ${projected.view.name} through ${projected.view.viewpointRef}`
        : projected?.viewpoint
          ? `Viewpoint ${projected.viewpoint.name}`
          : 'Unconstrained model catalogue',
      stats: [
        { label: 'Entities', value: String(projected?.catalogues?.entities?.length ?? 0) },
        { label: 'Relationships', value: String(projected?.catalogues?.relationships?.length ?? 0) },
        { label: 'Views', value: String(projected?.catalogues?.views?.length ?? 0) },
        { label: 'Viewpoints', value: String(projected?.catalogues?.viewpoints?.length ?? 0) },
      ],
      toolbarChildren: [
        element(
          'div',
          { key: 'tabs', style: theme.sectionTabs },
          ...sections.map((section) =>
            element(
              'button',
              {
                key: section.id,
                type: 'button',
                style: section.id === activeSectionId ? theme.button : theme.buttonMuted,
                onClick() {
                  React.startTransition(() => {
                    setActiveSectionId(section.id);
                  });
                },
              },
              `${section.label} (${section.rows.length})`,
            )),
        ),
      ],
    },
    activeSection
      ? element(ReadOnlyDataTable, {
        title: activeSection.label,
        subtitle: `Filter and sort ${activeSection.label.toLowerCase()} without leaving the workbench.`,
        rows: activeSection.rows,
        columns: activeSection.columns,
        emptyLabel: activeSection.emptyLabel,
        searchPlaceholder: `Filter ${activeSection.label.toLowerCase()}...`,
      })
      : element('p', { style: theme.empty }, 'No catalogue sections are available.'),
  );
}

function MatrixGridTable({ model }) {
  const theme = readSurfaceTheme();
  const columns = [
    { id: 'rowLabel', header: 'Source', accessorKey: 'rowLabel', enableSorting: true },
    { id: 'rowTypeRef', header: 'Type', accessorKey: 'rowTypeRef', enableSorting: true },
    { id: 'totalCount', header: 'Total', accessorKey: 'totalCount', enableSorting: true },
    ...model.visibleColumns.map((column) => ({
      id: column.id,
      header: column.label,
      accessorFn: (row) => row.counts[column.id] ?? 0,
      enableSorting: true,
      cell(context) {
        const count = Number(context.getValue() ?? 0);
        return count > 0 ? String(count) : '';
      },
    })),
  ];
  return element(ReadOnlyDataTable, {
    title: 'Relationship matrix',
    subtitle: 'Sort by source or by target-column counts; hidden empty axes keep the matrix readable.',
    rows: model.rows,
    columns,
    emptyLabel: 'No non-empty relationship cells matched the current matrix view.',
    searchPlaceholder: 'Filter source rows...',
  });
}

function MatrixCellTable({ model }) {
  return element(ReadOnlyDataTable, {
    title: 'Relationship cells',
    subtitle: 'Non-empty matrix cells flattened for easier filtering and severity triage.',
    rows: model.cellRows,
    columns: [
      { id: 'sourceLabel', header: 'Source', accessorKey: 'sourceLabel', enableSorting: true },
      { id: 'sourceTypeRef', header: 'Source type', accessorKey: 'sourceTypeRef', enableSorting: true },
      { id: 'targetLabel', header: 'Target', accessorKey: 'targetLabel', enableSorting: true },
      { id: 'targetTypeRef', header: 'Target type', accessorKey: 'targetTypeRef', enableSorting: true },
      { id: 'count', header: 'Count', accessorKey: 'count', enableSorting: true },
      { id: 'relationshipTypes', header: 'Relationship types', accessorKey: 'relationshipTypes', enableSorting: false },
      { id: 'relationshipKinds', header: 'Kinds', accessorKey: 'relationshipKinds', enableSorting: false },
      { id: 'edgeIds', header: 'Edge IDs', accessorKey: 'edgeIds', enableSorting: false },
    ],
    emptyLabel: 'No populated relationship cells are available.',
    searchPlaceholder: 'Filter relationship cells...',
  });
}

function MatrixSurfaceApp({ projected, target }) {
  const theme = readSurfaceTheme();
  const [showEmptyRows, setShowEmptyRows] = React.useState(false);
  const [showEmptyColumns, setShowEmptyColumns] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('grid');
  const model = buildItmMatrixTableModel(projected, { showEmptyRows, showEmptyColumns });

  return element(
    SurfaceShell,
    {
      eyebrow: 'Matrix surface',
      title: target?.label ?? 'Relationship matrix',
      subtitle: projected?.view
        ? `View ${projected.view.name} relationship matrix`
        : projected?.viewpoint
          ? `Viewpoint ${projected.viewpoint.name} relationship matrix`
          : 'Unconstrained model relationship matrix',
      stats: [
        { label: 'Rows', value: `${model.rows.length}/${model.totalRowCount}` },
        { label: 'Columns', value: `${model.visibleColumns.length}/${model.totalColumnCount}` },
        { label: 'Non-empty cells', value: String(model.nonEmptyCellCount) },
      ],
      toolbarChildren: [
        element(
          'div',
          { key: 'tabs', style: theme.sectionTabs },
          element(
            'button',
            {
              type: 'button',
              style: activeTab === 'grid' ? theme.button : theme.buttonMuted,
              onClick() {
                setActiveTab('grid');
              },
            },
            'Grid view',
          ),
          element(
            'button',
            {
              type: 'button',
              style: activeTab === 'cells' ? theme.button : theme.buttonMuted,
              onClick() {
                setActiveTab('cells');
              },
            },
            `Cell list (${model.cellRows.length})`,
          ),
        ),
        element(
          'label',
          { key: 'empty-rows', style: theme.checkboxLabel },
          element('input', {
            type: 'checkbox',
            checked: showEmptyRows,
            onChange(event) {
              setShowEmptyRows(event.target.checked);
            },
          }),
          'Show empty rows',
        ),
        element(
          'label',
          { key: 'empty-columns', style: theme.checkboxLabel },
          element('input', {
            type: 'checkbox',
            checked: showEmptyColumns,
            onChange(event) {
              setShowEmptyColumns(event.target.checked);
            },
          }),
          'Show empty columns',
        ),
      ],
    },
    activeTab === 'cells'
      ? element(MatrixCellTable, { model })
      : element(MatrixGridTable, { model }),
  );
}

function DelimitedSurfaceApp({ resourceTitle, dialectLabel, initialState, onApply }) {
  const theme = readSurfaceTheme();
  const [baselineState, setBaselineState] = React.useState(initialState);
  const [gridState, setGridState] = React.useState(initialState.rows.length > 0 ? initialState : addDelimitedRow(initialState));
  const patchSummary = createDelimitedPatchSummary(baselineState, gridState);
  const dirty = patchSummary.changedCellCount > 0
    || patchSummary.changedHeaderCount > 0
    || patchSummary.addedRowCount > 0
    || patchSummary.removedRowCount > 0
    || patchSummary.addedColumnCount > 0
    || patchSummary.removedColumnCount > 0;

  const headerRow = element(
    'tr',
    { key: 'header-row' },
    ...gridState.columns.map((column, columnIndex) =>
      element(
        'th',
        { key: column.id, style: theme.th },
        element('input', {
          type: 'text',
          value: column.label,
          style: theme.input,
          onChange(event) {
            setGridState((current) => updateDelimitedColumnLabel(current, columnIndex, event.target.value));
          },
          'aria-label': `Column ${columnIndex + 1} label`,
        }),
        element(
          'div',
          { style: { marginTop: '8px', display: 'flex', justifyContent: 'space-between', gap: '8px' } },
          element('span', { style: theme.subtle }, column.id),
          element(
            'button',
            {
              type: 'button',
              style: theme.buttonDanger,
              disabled: gridState.columns.length <= 1,
              onClick() {
                setGridState((current) => removeDelimitedColumn(current, columnIndex));
              },
            },
            'Remove',
          ),
        ),
      )),
    element('th', { key: 'row-actions-header', style: theme.th }, 'Row actions'),
  );

  const rowElements = gridState.rows.map((row, rowIndex) =>
    element(
      'tr',
      { key: row.id },
      ...gridState.columns.map((column, columnIndex) =>
        element(
          'td',
          { key: `${row.id}:${column.id}`, style: theme.td },
          element('textarea', {
            value: row.cells[columnIndex] ?? '',
            style: theme.textareaCell,
            rows: 1,
            onChange(event) {
              setGridState((current) => updateDelimitedCell(current, rowIndex, columnIndex, event.target.value));
            },
            'aria-label': `${column.label} row ${rowIndex + 1}`,
          }),
        )),
      element(
        'td',
        { key: `${row.id}:actions`, style: theme.td },
        element(
          'button',
          {
            type: 'button',
            style: theme.buttonDanger,
            disabled: gridState.rows.length <= 1,
            onClick() {
              setGridState((current) => removeDelimitedRow(current, rowIndex));
            },
          },
          'Delete row',
        ),
      ),
    ));

  async function applyChanges() {
    const nextState = normalizeDelimitedState(gridState);
    await onApply(nextState, patchSummary);
    setBaselineState(nextState);
    setGridState(nextState);
  }

  return element(
    SurfaceShell,
    {
      eyebrow: 'Structured editor',
      title: resourceTitle,
      subtitle: 'Edit grid-native state, then explicitly regenerate and apply the canonical delimited source.',
      stats: [
        { label: 'Format', value: dialectLabel },
        { label: 'Rows', value: String(gridState.rows.length) },
        { label: 'Columns', value: String(gridState.columns.length) },
        { label: 'Dirty', value: dirty ? 'Yes' : 'No' },
      ],
      warning: initialState.diagnostics[0]?.message,
      toolbarChildren: [
        element(
          'button',
          {
            key: 'add-row',
            type: 'button',
            style: theme.button,
            onClick() {
              setGridState((current) => addDelimitedRow(current));
            },
          },
          'Add row',
        ),
        element(
          'button',
          {
            key: 'add-column',
            type: 'button',
            style: theme.button,
            onClick() {
              setGridState((current) => addDelimitedColumn(current));
            },
          },
          'Add column',
        ),
        element(
          'label',
          { key: 'header-toggle', style: theme.checkboxLabel },
          element('input', {
            type: 'checkbox',
            checked: gridState.hasHeader,
            onChange(event) {
              setGridState((current) => normalizeDelimitedState({
                ...current,
                hasHeader: event.target.checked,
              }));
            },
          }),
          'Header row',
        ),
        element(
          'span',
          { key: 'summary', style: theme.subtle },
          `${patchSummary.changedCellCount} cell edits, ${patchSummary.changedHeaderCount} header edits, +${patchSummary.addedRowCount}/-${patchSummary.removedRowCount} rows, +${patchSummary.addedColumnCount}/-${patchSummary.removedColumnCount} columns`,
        ),
        element(
          'button',
          {
            key: 'discard',
            type: 'button',
            style: theme.buttonMuted,
            disabled: !dirty,
            onClick() {
              setGridState(baselineState);
            },
          },
          'Discard',
        ),
        element(
          'button',
          {
            key: 'apply',
            type: 'button',
            style: theme.button,
            disabled: !dirty,
            onClick() {
              void applyChanges();
            },
          },
          'Apply source update',
        ),
      ],
    },
    element(
      'div',
      { style: theme.tableFrame },
      element(
        'div',
        { style: theme.scroll },
        element(
          'table',
          { style: theme.table },
          element('thead', null, headerRow),
          element('tbody', null, ...rowElements),
        ),
      ),
    ),
  );
}

function DiagnosticsSurfaceApp({ title, diagnostics }) {
  const model = buildDiagnosticsTableModel(diagnostics, { title });
  return element(ReadOnlyDataTable, {
    title,
    subtitle: 'Document-capability and resource diagnostics collected through the active registry and workspace descriptors.',
    rows: model.rows,
    columns: model.columns,
    emptyLabel: 'No diagnostics are currently attached to this resource.',
    searchPlaceholder: 'Filter diagnostics...',
  });
}

function mountReactSurface(container, render) {
  const root = createRoot(container);
  root.render(render);
  return () => {
    root.unmount();
    container.innerHTML = '';
  };
}

async function resolveItmProjectionTable(execution, projectionKind) {
  const loaded = await loadItmDocument(execution.sourceText ?? '', {
    strict: false,
    uri: execution.resource?.path,
    includeProviders: createItmTableIncludeProviders(execution),
    repositoryResolution: execution.repositoryResolution,
    contributionRegistry: execution.contributionRegistry,
    documentResource: {
      path: execution.resource?.path,
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: 'text/x-itm',
    },
  });
  const requestedTarget = execution.session?.surfaceState?.itmVisualTarget;
  return resolveItmVisualTarget(loaded, {
    target: requestedTarget,
    projection: requestedTarget?.projection ?? projectionKind,
    title: requestedTarget?.label ?? execution.resourceTitle,
  });
}

function createDelimitedGridSurfaceContribution() {
  return {
    id: tablesDelimitedSurfaceId,
    label: 'Delimited grid',
    description: 'Edit CSV and TSV resources through a structured grid with explicit apply/discard controls.',
    kind: 'structured-editor',
    localName: 'delimited-grid',
    capabilities: [tablesSurfaceCapabilityId, tablesStructuredEditCapabilityId],
    editable: true,
    defaultActive: true,
    documentPredicate: delimitedDocumentPredicate,
    resourcePredicate: delimitedDocumentPredicate,
    placements: ['main', 'popup'],
    openWithPriority: 108,
    open(execution = {}) {
      const dialect = inferDelimitedDialect(execution.resource);
      const resourceTitle = execution.resourceTitle ?? execution.resource?.path ?? 'Delimited grid';
      const parsed = parseDelimitedText(execution.sourceText ?? '', {
        delimiter: dialect.delimiter,
        dialect: dialect.id,
        hasHeader: true,
      });
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
        summary: `Structured ${dialect.label} grid editor with explicit source regeneration.`,
        detail: dialect.label,
        readOnly: false,
        inspectorSections: [
          {
            eyebrow: 'Structured editor',
            icon: 'status',
            title: 'Grid boundary',
            rows: [
              { label: 'Format', value: dialect.label },
              { label: 'Delimiter', value: dialect.delimiter === '\t' ? 'Tab' : 'Comma' },
              { label: 'Apply mode', value: 'Explicit regenerate/apply' },
            ],
          },
        ],
        surface: {
          model: {
            diagnostics: parsed.diagnostics,
            html: '',
          },
          mount(container) {
            return mountReactSurface(container, element(DelimitedSurfaceApp, {
              resourceTitle,
              dialectLabel: dialect.label,
              initialState: parsed,
              async onApply(nextState) {
                const nextText = serializeDelimitedText(nextState, {
                  delimiter: dialect.delimiter,
                });
                execution.workspaceService?.saveTextResource?.({
                  resourceId: execution.workspaceResource?.id ?? execution.resource?.resourceId,
                  text: nextText,
                  languageId: execution.workspaceResource?.languageId ?? execution.resource?.languageId,
                  mimeType: execution.workspaceResource?.mimeType ?? execution.resource?.mimeType,
                });
                execution.markSessionCurrent?.();
              },
            }));
          },
        },
      };
    },
  };
}

function createItmCatalogueSurfaceContribution() {
  return {
    id: tablesCatalogueSurfaceId,
    label: 'ITM catalogue table',
    description: 'Open ITM catalogue projections through a sortable TanStack table surface.',
    kind: 'structured-table',
    localName: 'catalogue',
    capabilities: [tablesSurfaceCapabilityId],
    readOnly: true,
    defaultActive: true,
    documentPredicate: itmDocumentPredicate,
    resourcePredicate: itmDocumentPredicate,
    placements: ['main', 'popup'],
    openWithPriority: 96,
    open(execution = {}) {
      const resourceTitle = execution.resourceTitle ?? execution.resource?.path ?? 'ITM catalogue';
      const surfaceModel = {
        diagnostics: [],
        html: `<section><p>${escapeHtml(resourceTitle)}</p></section>`,
      };
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
        summary: 'Richer package-owned ITM catalogue surface built on TanStack Table.',
        detail: 'Catalogue',
        readOnly: true,
        inspectorSections: [],
        surface: {
          model: surfaceModel,
          mount(container) {
            let disposed = false;
            container.innerHTML = '<p style="padding:16px;color:#d9e4f2;">Resolving ITM catalogue...</p>';
            void (async () => {
              try {
                const resolved = await resolveItmProjectionTable(execution, 'catalogue');
                surfaceModel.diagnostics = [...resolved.diagnostics, ...resolved.visualDiagnostics];
                if (!disposed) {
                  mountReactSurface(container, element(CatalogueSurfaceApp, {
                    projected: resolved.projectedDocument,
                    target: resolved.target,
                  }));
                }
              } catch (error) {
                surfaceModel.diagnostics = [
                  createTablesDiagnostic(error?.message ?? 'ITM catalogue resolution failed.', 'error', {
                    code: 'tables.catalogue.resolve-failed',
                    resource: execution.resource,
                  }),
                ];
                if (!disposed) {
                  container.innerHTML = `<p style="padding:16px;color:#ffd9b0;">${escapeHtml(error?.message ?? 'ITM catalogue resolution failed.')}</p>`;
                }
              }
            })();
            return () => {
              disposed = true;
              container.innerHTML = '';
            };
          },
        },
      };
    },
  };
}

function createItmMatrixSurfaceContribution() {
  return {
    id: tablesMatrixSurfaceId,
    label: 'ITM matrix table',
    description: 'Open ITM relationship matrices through a richer TanStack-based table surface.',
    kind: 'structured-table',
    localName: 'matrix',
    capabilities: [tablesSurfaceCapabilityId],
    readOnly: true,
    defaultActive: true,
    documentPredicate: itmDocumentPredicate,
    resourcePredicate: itmDocumentPredicate,
    placements: ['main', 'popup'],
    openWithPriority: 96,
    open(execution = {}) {
      const surfaceModel = {
        diagnostics: [],
        html: '',
      };
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
        summary: 'Package-owned ITM relationship matrix surface with grid and flattened-cell views.',
        detail: 'Matrix',
        readOnly: true,
        inspectorSections: [],
        surface: {
          model: surfaceModel,
          mount(container) {
            let disposed = false;
            container.innerHTML = '<p style="padding:16px;color:#d9e4f2;">Resolving ITM relationship matrix...</p>';
            void (async () => {
              try {
                const resolved = await resolveItmProjectionTable(execution, 'matrix');
                surfaceModel.diagnostics = [...resolved.diagnostics, ...resolved.visualDiagnostics];
                if (!disposed) {
                  mountReactSurface(container, element(MatrixSurfaceApp, {
                    projected: resolved.projectedDocument,
                    target: resolved.target,
                  }));
                }
              } catch (error) {
                surfaceModel.diagnostics = [
                  createTablesDiagnostic(error?.message ?? 'ITM matrix resolution failed.', 'error', {
                    code: 'tables.matrix.resolve-failed',
                    resource: execution.resource,
                  }),
                ];
                if (!disposed) {
                  container.innerHTML = `<p style="padding:16px;color:#ffd9b0;">${escapeHtml(error?.message ?? 'ITM matrix resolution failed.')}</p>`;
                }
              }
            })();
            return () => {
              disposed = true;
              container.innerHTML = '';
            };
          },
        },
      };
    },
  };
}

function createDiagnosticsSurfaceContribution() {
  return {
    id: tablesDiagnosticsSurfaceId,
    label: 'Diagnostics table',
    description: 'Open grouped resource and document-context diagnostics through a sortable table surface.',
    kind: 'diagnostics',
    localName: 'diagnostics',
    capabilities: [tablesSurfaceCapabilityId, tablesDiagnosticsCapabilityId],
    readOnly: true,
    defaultActive: true,
    resourcePredicate: genericResourcePredicate,
    placements: ['main', 'popup'],
    openWithPriority: 18,
    open(execution = {}) {
      const resourceTitle = execution.resourceTitle ?? execution.resource?.path ?? 'Diagnostics';
      const diagnostics = deduplicateDiagnostics([
        ...(execution.resource?.diagnostics ?? []),
        ...(execution.workspaceResource?.metadata?.diagnostics ?? []),
        ...(execution.documentContext?.diagnostics ?? []),
      ]);
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
        summary: 'Grouped diagnostics table for the active resource and document contribution context.',
        detail: 'Diagnostics',
        readOnly: true,
        inspectorSections: [
          {
            eyebrow: 'Issues',
            icon: 'status',
            title: 'Diagnostics',
            rows: [
              { label: 'Entries', value: String(diagnostics.length) },
              { label: 'Source', value: execution.documentContext ? 'Document context + resource metadata' : 'Resource metadata' },
            ],
          },
        ],
        surface: {
          model: {
            diagnostics,
            html: '',
          },
          mount(container) {
            return mountReactSurface(container, element(DiagnosticsSurfaceApp, {
              title: resourceTitle,
              diagnostics,
            }));
          },
        },
      };
    },
  };
}

export const tablesCapabilities = Object.freeze([
  createCapability(tablesSurfaceCapabilityId, {
    description: 'Open richer package-owned table surfaces for ITM, delimited resources, and diagnostics.',
    localName: 'table',
    aliases: ['tables', 'catalogue.table', 'matrix.table'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: createResourcePredicate({
      representations: ['text'],
      languageIds: ['itm', 'csv', 'tsv'],
      mimeTypes: ['text/itm', 'text/x-itm', 'text/csv', 'text/tab-separated-values'],
      fileExtensions: ['itm', 'csv', 'tsv'],
    }),
  }),
  createCapability(tablesStructuredEditCapabilityId, {
    description: 'Enable explicit structured editing for CSV and TSV resources.',
    localName: 'structured-edit',
    aliases: ['csv.grid', 'tsv.grid'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: delimitedDocumentPredicate,
  }),
  createCapability(tablesDiagnosticsCapabilityId, {
    description: 'Expose grouped diagnostics through a sortable issue table surface.',
    localName: 'diagnostics.table',
    aliases: ['issues.table'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: genericResourcePredicate,
  }),
]);

export const tableSurfaceContributions = Object.freeze([
  createDelimitedGridSurfaceContribution(),
  createItmCatalogueSurfaceContribution(),
  createItmMatrixSurfaceContribution(),
  createDiagnosticsSurfaceContribution(),
]);

export function createTablesContributionManifest() {
  return createContributionManifest('@textforge/tables', {
    name: '@textforge/tables',
    version: '0.1.0',
    description: 'TanStack-backed table surfaces for ITM catalogues/matrices, CSV/TSV structured editing, and diagnostics review.',
    dependencies: [
      '@textforge/core',
      '@textforge/workspace',
      '@textforge/surfaces',
      '@textforge/ui',
      '@textforge/itm',
    ],
    capabilities: tablesCapabilities,
    surfaces: tableSurfaceContributions,
  });
}

export const contributions = createTablesContributionManifest();
