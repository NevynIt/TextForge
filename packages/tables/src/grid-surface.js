import { createDiagnostic } from '@textforge/core';

import { parseDelimitedTable, serializeDelimitedTable } from './csv.js';
import {
  createTablesFailureHtml,
  createTablesRuntimeMarkup,
  ensureTablesAgGridThemeStyle,
  ensureTablesPackageStyle,
} from './dom-style.js';
import {
  tablesGridCapabilityId,
  tablesGridSurfaceId,
  tablesTextDocumentPredicate,
} from './ids.js';

const defaultDependencies = {
  parseDelimitedTable,
  serializeDelimitedTable,
};

function createTablesDiagnostic(message, severity = 'error', overrides = {}) {
  return createDiagnostic(message, severity, {
    code: overrides.code ?? 'tables.surface.runtime',
    source: '@textforge/tables',
    ...overrides,
  });
}

function normalizeSeverity(severity) {
  const normalized = String(severity ?? '').toLowerCase();
  if (normalized === 'warning') {
    return 'warning';
  }
  if (normalized === 'error') {
    return 'error';
  }
  return 'information';
}

function normalizeDiagnostics(diagnostics, fallbackMessage) {
  if (!Array.isArray(diagnostics) || diagnostics.length === 0) {
    return fallbackMessage ? [createTablesDiagnostic(fallbackMessage, 'error')] : [];
  }

  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    severity: normalizeSeverity(diagnostic?.severity),
  }));
}

function isBlockingDiagnostic(diagnostic) {
  if (!diagnostic) {
    return false;
  }

  if (diagnostic.blocking === true || diagnostic.fatal === true) {
    return true;
  }

  return normalizeSeverity(diagnostic.severity) === 'error';
}

function resolveFormat(resource) {
  const explicit = String(resource?.languageId ?? '').trim().toLowerCase();
  if (explicit === 'csv' || explicit === 'tsv') {
    return explicit;
  }

  const path = String(resource?.path ?? '');
  const extension = path.includes('.') ? path.split('.').pop().toLowerCase() : '';
  return extension === 'tsv' ? 'tsv' : 'csv';
}

function resolveDelimiterOverride(value, format) {
  if (!value || value === 'auto') {
    return undefined;
  }

  const map = {
    comma: ',',
    tab: '\t',
    semicolon: ';',
    pipe: '|',
  };
  return map[value] ?? (format === 'tsv' ? '\t' : ',');
}

function resolveNewlineOverride(value) {
  if (!value || value === 'auto') {
    return undefined;
  }
  return value === 'crlf' ? '\r\n' : '\n';
}

function makeFieldId(index, label) {
  const normalized = String(label ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized ? `column_${index + 1}_${normalized}` : `column_${index + 1}`;
}

function cloneValueMap(values) {
  return Object.fromEntries(Object.entries(values ?? {}).map(([key, value]) => [key, String(value ?? '')]));
}

function normalizeColumn(column, index) {
  const label = String(
    column?.label
    ?? column?.displayLabel
    ?? column?.header
    ?? column?.name
    ?? column?.title
    ?? `Column ${index + 1}`,
  );
  return {
    field: String(column?.field ?? column?.id ?? makeFieldId(index, label)),
    index: Number.isInteger(column?.index) ? column.index : index,
    label,
    headerValue: column?.headerValue,
    sourceHeader: column?.sourceHeader,
    generated: column?.generated === true,
  };
}

function normalizeRow(row, index, columns) {
  const values = cloneValueMap(row?.values);
  const normalizedValues = {};
  for (const column of columns) {
    normalizedValues[column.field] = String(values[column.field] ?? '');
  }
  return {
    id: String(row?.id ?? row?.key ?? `row-${index + 1}`),
    index: Number.isInteger(row?.index) ? row.index : index,
    sourceRowNumber: Number.isInteger(row?.sourceRowNumber) ? row.sourceRowNumber : index + 1,
    values: normalizedValues,
  };
}

function inferResolvedHeaderMode(metadata) {
  const resolved = metadata?.resolvedHeaderMode;
  if (resolved === 'header' || resolved === 'no-header') {
    return resolved;
  }
  return metadata?.headerMode === 'header' ? 'header' : 'no-header';
}

function normalizeTableModel(input, format, overrides = {}) {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const columns = Array.isArray(input.columns)
    ? input.columns.map((column, index) => normalizeColumn(column, index))
    : [];
  const rows = Array.isArray(input.rows)
    ? input.rows.map((row, index) => normalizeRow(row, index, columns))
    : [];
  const metadata = {
    ...(input.metadata ?? {}),
    format: input.metadata?.format ?? format,
    headerMode: overrides.headerMode ?? input.metadata?.headerMode ?? 'auto',
    resolvedHeaderMode: inferResolvedHeaderMode({
      ...(input.metadata ?? {}),
      headerMode: overrides.headerMode ?? input.metadata?.headerMode,
      resolvedHeaderMode: input.metadata?.resolvedHeaderMode,
    }),
    dialect: {
      ...(input.metadata?.dialect ?? {}),
      ...(overrides.delimiter ? { delimiter: overrides.delimiter } : {}),
      ...(overrides.newline ? { newline: overrides.newline } : {}),
      quoteChar: input.metadata?.dialect?.quoteChar ?? '"',
      escapeChar: input.metadata?.dialect?.escapeChar ?? '"',
    },
    source: {
      ...(input.metadata?.source ?? {}),
      rowCount: rows.length,
      columnCount: columns.length,
    },
  };

  return {
    ...input,
    columns,
    rows,
    metadata,
  };
}

function buildParseOptions(resource, overrides = {}) {
  const format = resolveFormat(resource);
  const delimiter = resolveDelimiterOverride(overrides.delimiterMode, format);
  const newline = resolveNewlineOverride(overrides.newlineMode);
  return {
    format,
    headerMode: overrides.headerMode ?? 'auto',
    delimiter,
    newline,
    dialect: {
      ...(delimiter ? { delimiter } : {}),
      ...(newline ? { newline } : {}),
    },
    resource,
  };
}

function buildSerializeOptions(model, overrides = {}) {
  const format = model?.metadata?.format ?? 'csv';
  const delimiter = resolveDelimiterOverride(overrides.delimiterMode, format);
  const newline = resolveNewlineOverride(overrides.newlineMode);
  return {
    format,
    headerMode: overrides.headerMode ?? model?.metadata?.headerMode ?? 'auto',
    resolvedHeaderMode: model?.metadata?.resolvedHeaderMode,
    delimiter,
    newline,
    dialect: {
      ...(model?.metadata?.dialect ?? {}),
      ...(delimiter ? { delimiter } : {}),
      ...(newline ? { newline } : {}),
    },
  };
}

function parseSourceText(sourceText, execution, overrides, dependencies) {
  const parseDelimitedTable = dependencies?.parseDelimitedTable;
  const format = resolveFormat(execution.resource);
  if (typeof parseDelimitedTable !== 'function') {
    const diagnostics = normalizeDiagnostics([], 'CSV/TSV parser is not available in this build.');
    return {
      blocked: true,
      format,
      diagnostics,
      model: undefined,
    };
  }

  try {
    const result = parseDelimitedTable(sourceText ?? '', buildParseOptions(execution.resource, overrides));
    const diagnostics = normalizeDiagnostics(
      result?.diagnostics ?? result?.model?.diagnostics ?? result?.value?.diagnostics,
      undefined,
    );
    const model = normalizeTableModel(result?.model ?? result?.value ?? result, format, {
      headerMode: overrides.headerMode,
      delimiter: resolveDelimiterOverride(overrides.delimiterMode, format),
      newline: resolveNewlineOverride(overrides.newlineMode),
    });
    const blocked = result?.blocked === true
      || model?.metadata?.source?.blocked === true
      || !model
      || diagnostics.some(isBlockingDiagnostic);
    return {
      blocked,
      format,
      diagnostics,
      model,
    };
  } catch (error) {
    return {
      blocked: true,
      format,
      model: undefined,
      diagnostics: [
        createTablesDiagnostic(error?.message ?? 'Table parsing failed.', 'error', {
          code: 'tables.parse.failed',
        }),
      ],
    };
  }
}

function resolveDocumentForPersistence(execution, nextText) {
  const baseDocument = execution.getTextDocument?.()
    ?? {
      text: execution.sourceText ?? '',
      resource: execution.resource,
      languageId: execution.resource?.languageId,
      readOnly: execution.readOnly ?? false,
    };
  return {
    ...baseDocument,
    text: nextText,
  };
}

function serializeModel(nextModel, execution, overrides, dependencies) {
  const serializeDelimitedTable = dependencies?.serializeDelimitedTable;
  if (typeof serializeDelimitedTable !== 'function') {
    throw createTablesDiagnostic('CSV/TSV serializer is not available in this build.', 'error', {
      code: 'tables.serialize.unavailable',
    });
  }

  const result = serializeDelimitedTable(nextModel, buildSerializeOptions(nextModel, overrides));
  if (typeof result === 'string') {
    return { text: result, diagnostics: [] };
  }
  if (typeof result?.text === 'string') {
    return {
      text: result.text,
      diagnostics: normalizeDiagnostics(result?.diagnostics),
    };
  }
  if (typeof result?.value === 'string') {
    return {
      text: result.value,
      diagnostics: normalizeDiagnostics(result?.diagnostics),
    };
  }
  throw createTablesDiagnostic('CSV/TSV serializer did not return text output.', 'error', {
    code: 'tables.serialize.invalid-result',
  });
}

function createEmptyRow(columns, index) {
  const values = {};
  for (const column of columns) {
    values[column.field] = '';
  }
  return {
    id: `row-${index + 1}`,
    index,
    sourceRowNumber: index + 1,
    values,
  };
}

function nextColumn(columns) {
  return normalizeColumn({
    field: `column_${columns.length + 1}`,
    index: columns.length,
    label: `Column ${columns.length + 1}`,
    headerValue: `Column ${columns.length + 1}`,
    generated: true,
  }, columns.length);
}

function cloneTableModel(model) {
  return {
    ...model,
    columns: model.columns.map((column) => ({ ...column })),
    rows: model.rows.map((row) => ({
      ...row,
      values: cloneValueMap(row.values),
    })),
    metadata: {
      ...(model.metadata ?? {}),
      dialect: {
        ...(model.metadata?.dialect ?? {}),
      },
      source: {
        ...(model.metadata?.source ?? {}),
      },
    },
  };
}

function reindexTableModel(model) {
  model.columns = model.columns.map((column, index) => ({
    ...column,
    index,
  }));
  model.rows = model.rows.map((row, index) => ({
    ...row,
    index,
    sourceRowNumber: index + 1,
  }));
  if (model.metadata?.source) {
    model.metadata.source.dataRowCount = model.rows.length;
    model.metadata.source.dataColumnCount = model.columns.length;
  }
}

function createRowData(model) {
  return model.rows.map((row) => ({
    __tfRowKey: row.id,
    ...row.values,
  }));
}

function createColumnDefs(model, readOnly) {
  return model.columns.map((column) => ({
    field: column.field,
    headerName: column.label,
    editable: !readOnly,
    sortable: true,
    resizable: true,
    minWidth: 120,
    flex: 1,
  }));
}

function diagnosticsSummary(diagnostics) {
  const warningCount = diagnostics.filter((diagnostic) => normalizeSeverity(diagnostic.severity) === 'warning').length;
  const errorCount = diagnostics.filter((diagnostic) => normalizeSeverity(diagnostic.severity) === 'error').length;
  return { warningCount, errorCount };
}

function createSurfaceSummary(parseState, readOnly) {
  if (parseState.blocked) {
    return {
      summary: 'Table grid could not open this resource.',
      detail: `${parseState.diagnostics.length} diagnostics`,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'warning',
          title: 'CSV / TSV grid',
          rows: [
            { label: 'State', value: 'blocked' },
            { label: 'Mode', value: readOnly ? 'read-only' : 'editable' },
            { label: 'Diagnostics', value: String(parseState.diagnostics.length) },
          ],
        },
      ],
    };
  }

  const model = parseState.model;
  const counts = diagnosticsSummary(parseState.diagnostics);
  return {
    summary: readOnly ? 'Read-only CSV/TSV grid.' : 'Editable CSV/TSV grid.',
    detail: `${model.rows.length} rows / ${model.columns.length} columns / ${counts.warningCount} warnings`,
    inspectorSections: [
      {
        eyebrow: 'Grid',
        icon: 'table',
        title: 'CSV / TSV grid',
        rows: [
          { label: 'Mode', value: readOnly ? 'read-only' : 'editable' },
          { label: 'Format', value: String(model.metadata?.format ?? parseState.format).toUpperCase() },
          { label: 'Rows', value: String(model.rows.length) },
          { label: 'Columns', value: String(model.columns.length) },
          { label: 'Warnings', value: String(counts.warningCount) },
          { label: 'Errors', value: String(counts.errorCount) },
        ],
      },
    ],
  };
}

function createFakeRootMount(container, html) {
  container.innerHTML = html;
  return () => {
    container.innerHTML = '';
  };
}

async function mountTablesGridRuntime(container, execution, initialParseState, dependencies) {
  ensureTablesPackageStyle(container);
  const previous = {
    display: container.style?.display,
    flex: container.style?.flex,
    width: container.style?.width,
    height: container.style?.height,
    minHeight: container.style?.minHeight,
    overflow: container.style?.overflow,
  };
  if (container.style) {
    container.style.display = 'flex';
    container.style.flex = '1 1 auto';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '0';
    container.style.overflow = 'hidden';
  }

  const [{ createRoot }, React, agGridReact, agGridCommunity] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('ag-grid-react'),
    import('ag-grid-community'),
  ]);

  const AgGridReact = agGridReact.AgGridReact;
  const theme = agGridCommunity.themeQuartz?.withParams
    ? agGridCommunity.themeQuartz.withParams({
      browserColorScheme: 'light',
      foregroundColor: '#142033',
      backgroundColor: '#ffffff',
      headerBackgroundColor: '#eef3fb',
      headerTextColor: '#31445f',
      borderColor: '#d7dde7',
      accentColor: '#1f6feb',
      rowHoverColor: '#f7faff',
      wrapperBorderRadius: 8,
    })
    : agGridCommunity.themeQuartz;
  const agGridThemeCss = typeof theme?.getCSS === 'function' ? theme.getCSS() : '';
  const agGridThemeClass = typeof theme?.getCssClass === 'function' ? theme.getCssClass() : '';
  ensureTablesAgGridThemeStyle(container, agGridThemeCss);
  const gridModules = agGridCommunity.ClientSideRowModelModule
    ? [agGridCommunity.ClientSideRowModelModule]
    : [];

  function TablesGridApp() {
    const readOnly = execution.readOnly ?? false;
    const [headerMode, setHeaderMode] = React.useState(initialParseState.model.metadata?.headerMode ?? 'auto');
    const [delimiterMode, setDelimiterMode] = React.useState(() => {
      const delimiter = initialParseState.model.metadata?.dialect?.delimiter;
      if (delimiter === ',') return 'comma';
      if (delimiter === '\t') return 'tab';
      if (delimiter === ';') return 'semicolon';
      if (delimiter === '|') return 'pipe';
      return 'auto';
    });
    const [newlineMode, setNewlineMode] = React.useState(() => {
      const newline = initialParseState.model.metadata?.dialect?.newline;
      return newline === '\r\n' ? 'crlf' : newline === '\n' ? 'lf' : 'auto';
    });
    const [model, setModel] = React.useState(initialParseState.model);
    const [diagnostics, setDiagnostics] = React.useState(initialParseState.diagnostics);
    const [selectedRowKey, setSelectedRowKey] = React.useState(undefined);
    const [selectedColumnField, setSelectedColumnField] = React.useState(initialParseState.model.columns[0]?.field);
    const [columnLabelDraft, setColumnLabelDraft] = React.useState(initialParseState.model.columns[0]?.label ?? '');
    const modelRef = React.useRef(initialParseState.model);
    const sourceTextRef = React.useRef(execution.sourceText ?? '');
    const overridesRef = React.useRef({
      headerMode,
      delimiterMode,
      newlineMode,
    });

    React.useEffect(() => {
      modelRef.current = model;
    }, [model]);

    React.useEffect(() => {
      overridesRef.current = { headerMode, delimiterMode, newlineMode };
    }, [headerMode, delimiterMode, newlineMode]);

    React.useEffect(() => {
      const activeColumn = model.columns.find((column) => column.field === selectedColumnField) ?? model.columns[0];
      setSelectedColumnField(activeColumn?.field);
      setColumnLabelDraft(activeColumn?.label ?? '');
    }, [model.columns, selectedColumnField]);

    const reparseAndRefresh = React.useCallback((nextText) => {
      sourceTextRef.current = nextText;
      const reparsed = parseSourceText(nextText, execution, overridesRef.current, dependencies);
      if (!reparsed.blocked && reparsed.model) {
        modelRef.current = reparsed.model;
        setModel(reparsed.model);
      }
      setDiagnostics(reparsed.diagnostics);
      return reparsed;
    }, []);

    const persistModel = React.useCallback((nextModel) => {
      try {
        const serialized = serializeModel(nextModel, execution, overridesRef.current, dependencies);
        const nextDocument = resolveDocumentForPersistence(execution, serialized.text);
        const persistedDocument = execution.persistTextDocument?.(nextDocument) ?? nextDocument;
        execution.setTextDocument?.(persistedDocument);
        execution.markSessionCurrent?.();
        const reparsed = reparseAndRefresh(persistedDocument.text ?? serialized.text);
        const combinedDiagnostics = [
          ...serialized.diagnostics,
          ...reparsed.diagnostics,
        ];
        setDiagnostics(normalizeDiagnostics(combinedDiagnostics));
        return reparsed;
      } catch (error) {
        const nextDiagnostics = normalizeDiagnostics([
          error?.message
            ? error
            : createTablesDiagnostic('Table serialization failed.', 'error', {
              code: 'tables.serialize.failed',
            }),
        ]);
        setDiagnostics(nextDiagnostics);
        return {
          blocked: false,
          model: nextModel,
          diagnostics: nextDiagnostics,
        };
      }
    }, [reparseAndRefresh]);

    const commitMutation = React.useCallback((mutate) => {
      if (readOnly) {
        return;
      }

      const nextModel = cloneTableModel(modelRef.current);
      mutate(nextModel);
      reindexTableModel(nextModel);
      persistModel(nextModel);
    }, [persistModel, readOnly]);

    const applyOverrideState = React.useCallback((nextOverrides) => {
      if (readOnly) {
        return;
      }

      const mergedOverrides = {
        ...overridesRef.current,
        ...nextOverrides,
      };
      overridesRef.current = mergedOverrides;
      const reparsed = parseSourceText(sourceTextRef.current, execution, mergedOverrides, dependencies);
      if (reparsed.blocked || !reparsed.model) {
        setDiagnostics(reparsed.diagnostics);
        return;
      }
      try {
        const serialized = serializeModel(reparsed.model, execution, mergedOverrides, dependencies);
        const nextDocument = resolveDocumentForPersistence(execution, serialized.text);
        const persistedDocument = execution.persistTextDocument?.(nextDocument) ?? nextDocument;
        execution.setTextDocument?.(persistedDocument);
        execution.markSessionCurrent?.();
        sourceTextRef.current = persistedDocument.text ?? serialized.text;
        const refreshed = parseSourceText(sourceTextRef.current, execution, mergedOverrides, dependencies);
        if (!refreshed.blocked && refreshed.model) {
          modelRef.current = refreshed.model;
          setModel(refreshed.model);
        }
        setDiagnostics(normalizeDiagnostics([...serialized.diagnostics, ...refreshed.diagnostics]));
      } catch (error) {
        setDiagnostics(normalizeDiagnostics([
          error?.message
            ? error
            : createTablesDiagnostic('Failed to apply table format overrides.', 'error'),
        ]));
      }
    }, [readOnly]);

    const onCellValueChanged = React.useCallback((event) => {
      if (readOnly) {
        return;
      }
      const field = event?.colDef?.field;
      const rowKey = event?.data?.__tfRowKey;
      if (!field || !rowKey) {
        return;
      }
      commitMutation((draft) => {
        const row = draft.rows.find((entry) => entry.id === rowKey);
        if (!row) {
          return;
        }
        row.values[field] = String(event.newValue ?? '');
      });
    }, [commitMutation, readOnly]);

    const rowData = React.useMemo(() => createRowData(model), [model]);
    const columnDefs = React.useMemo(() => createColumnDefs(model, readOnly), [model, readOnly]);
    const selectedColumn = model.columns.find((column) => column.field === selectedColumnField);
    const readOnlyHeaderMode = model.metadata?.resolvedHeaderMode ?? model.metadata?.headerMode;
    const counts = diagnosticsSummary(diagnostics);

    return React.createElement(
      'section',
      { className: 'tf-tables-surface tf-tables-runtime', 'data-tf-tables-surface': 'ready' },
      React.createElement(
        'div',
        { className: 'tf-tables-toolbar' },
        React.createElement(
          'div',
          { className: 'tf-tables-toolbar-group' },
          React.createElement(
            'div',
            { className: 'tf-tables-field' },
            React.createElement('label', { htmlFor: 'tf-tables-header-mode' }, 'Header mode'),
            React.createElement(
              'select',
              {
                id: 'tf-tables-header-mode',
                value: headerMode,
                disabled: readOnly,
                onChange: (event) => {
                  const nextValue = event.target.value;
                  setHeaderMode(nextValue);
                  applyOverrideState({ headerMode: nextValue });
                },
              },
              React.createElement('option', { value: 'auto' }, 'Auto'),
              React.createElement('option', { value: 'header' }, 'First row is header'),
              React.createElement('option', { value: 'no-header' }, 'No header row'),
            ),
          ),
          React.createElement(
            'div',
            { className: 'tf-tables-field' },
            React.createElement('label', { htmlFor: 'tf-tables-delimiter-mode' }, 'Delimiter'),
            React.createElement(
              'select',
              {
                id: 'tf-tables-delimiter-mode',
                value: delimiterMode,
                disabled: readOnly,
                onChange: (event) => {
                  const nextValue = event.target.value;
                  setDelimiterMode(nextValue);
                  applyOverrideState({ delimiterMode: nextValue });
                },
              },
              React.createElement('option', { value: 'auto' }, 'Auto'),
              React.createElement('option', { value: 'comma' }, 'Comma'),
              React.createElement('option', { value: 'tab' }, 'Tab'),
              React.createElement('option', { value: 'semicolon' }, 'Semicolon'),
              React.createElement('option', { value: 'pipe' }, 'Pipe'),
            ),
          ),
          React.createElement(
            'div',
            { className: 'tf-tables-field' },
            React.createElement('label', { htmlFor: 'tf-tables-newline-mode' }, 'Newline'),
            React.createElement(
              'select',
              {
                id: 'tf-tables-newline-mode',
                value: newlineMode,
                disabled: readOnly,
                onChange: (event) => {
                  const nextValue = event.target.value;
                  setNewlineMode(nextValue);
                  applyOverrideState({ newlineMode: nextValue });
                },
              },
              React.createElement('option', { value: 'auto' }, 'Auto'),
              React.createElement('option', { value: 'lf' }, 'LF'),
              React.createElement('option', { value: 'crlf' }, 'CRLF'),
            ),
          ),
        ),
        React.createElement(
          'div',
          { className: 'tf-tables-toolbar-group' },
          React.createElement(
            'div',
            { className: 'tf-tables-actions' },
            React.createElement('button', {
              type: 'button',
              className: 'tf-tables-btn tf-tables-btn--primary',
              disabled: readOnly,
              onClick: () => commitMutation((draft) => {
                draft.rows.push(createEmptyRow(draft.columns, draft.rows.length));
              }),
            }, 'Add row'),
            React.createElement('button', {
              type: 'button',
              className: 'tf-tables-btn',
              disabled: readOnly || !selectedRowKey,
              onClick: () => commitMutation((draft) => {
                draft.rows = draft.rows.filter((row) => row.id !== selectedRowKey);
              }),
            }, 'Delete row'),
          ),
        ),
        React.createElement(
          'div',
          { className: 'tf-tables-toolbar-group' },
          React.createElement(
            'div',
            { className: 'tf-tables-actions' },
            React.createElement('button', {
              type: 'button',
              className: 'tf-tables-btn tf-tables-btn--primary',
              disabled: readOnly,
              onClick: () => commitMutation((draft) => {
                const column = nextColumn(draft.columns);
                draft.columns.push(column);
                for (const row of draft.rows) {
                  row.values[column.field] = '';
                }
              }),
            }, 'Add column'),
            React.createElement('button', {
              type: 'button',
              className: 'tf-tables-btn',
              disabled: readOnly || !selectedColumnField || model.columns.length === 0,
              onClick: () => commitMutation((draft) => {
                draft.columns = draft.columns.filter((column) => column.field !== selectedColumnField);
                for (const row of draft.rows) {
                  delete row.values[selectedColumnField];
                }
              }),
            }, 'Delete column'),
          ),
          React.createElement(
            'div',
            { className: 'tf-tables-field' },
            React.createElement('label', { htmlFor: 'tf-tables-column-select' }, 'Column'),
            React.createElement(
              'select',
              {
                id: 'tf-tables-column-select',
                value: selectedColumnField ?? '',
                disabled: model.columns.length === 0,
                onChange: (event) => setSelectedColumnField(event.target.value),
              },
              model.columns.map((column) =>
                React.createElement('option', { key: column.field, value: column.field }, column.label)),
            ),
          ),
          React.createElement(
            'div',
            { className: 'tf-tables-field' },
            React.createElement('label', { htmlFor: 'tf-tables-column-label' }, 'Header label'),
            React.createElement('input', {
              id: 'tf-tables-column-label',
              type: 'text',
              value: columnLabelDraft,
              disabled: readOnly || !selectedColumnField || readOnlyHeaderMode !== 'header',
              onChange: (event) => setColumnLabelDraft(event.target.value),
            }),
          ),
          React.createElement('button', {
            type: 'button',
            className: 'tf-tables-btn',
            disabled: readOnly || !selectedColumn?.field || readOnlyHeaderMode !== 'header',
            onClick: () => commitMutation((draft) => {
              const column = draft.columns.find((entry) => entry.field === selectedColumnField);
              if (column) {
                column.label = String(columnLabelDraft || column.label);
                column.headerValue = column.label;
              }
            }),
          }, 'Rename'),
        ),
      ),
      React.createElement(
        'div',
        { className: 'tf-tables-body' },
        React.createElement(
          'div',
          {
            className: ['tf-tables-grid-shell', agGridThemeClass].filter(Boolean).join(' '),
            'data-tf-tables-grid-theme': agGridThemeClass || undefined,
          },
          React.createElement(AgGridReact, {
            className: 'tf-tables-grid',
            containerStyle: { width: '100%', height: '100%' },
            rowData,
            columnDefs,
            modules: gridModules,
            domLayout: 'normal',
            singleClickEdit: !readOnly,
            stopEditingWhenCellsLoseFocus: true,
            suppressMovableColumns: false,
            rowSelection: 'single',
            animateRows: false,
            defaultColDef: {
              editable: !readOnly,
            },
            getRowId: (params) => params.data.__tfRowKey,
            onCellValueChanged,
            onSelectionChanged: (event) => {
              const selected = event.api.getSelectedRows?.()?.[0];
              setSelectedRowKey(selected?.__tfRowKey);
            },
          }),
        ),
      ),
      React.createElement(
        'div',
        { className: 'tf-tables-footer' },
        React.createElement(
          'div',
          { className: 'tf-tables-summary' },
          React.createElement('span', null, `${model.rows.length} rows`),
          React.createElement('span', null, `${model.columns.length} columns`),
          React.createElement('span', null, `${String(model.metadata?.format ?? 'csv').toUpperCase()} mode`),
          React.createElement('span', null, readOnly ? 'Read-only' : 'Editable'),
        ),
        React.createElement(
          'div',
          { className: 'tf-tables-diagnostics' },
          counts.errorCount > 0 && React.createElement(
            'span',
            { className: 'tf-tables-diagnostic', 'data-severity': 'error', title: `${counts.errorCount} blocking diagnostics` },
            `${counts.errorCount} errors`,
          ),
          counts.warningCount > 0 && React.createElement(
            'span',
            { className: 'tf-tables-diagnostic', 'data-severity': 'warning', title: `${counts.warningCount} non-blocking diagnostics` },
            `${counts.warningCount} warnings`,
          ),
          diagnostics.slice(0, 2).map((diagnostic, index) =>
            React.createElement(
              'span',
              {
                key: `${diagnostic.code ?? 'diagnostic'}:${index}`,
                className: 'tf-tables-diagnostic',
                'data-severity': normalizeSeverity(diagnostic.severity),
                title: diagnostic.message ?? '',
              },
              diagnostic.message ?? 'Table diagnostic',
            )),
        ),
      ),
    );
  }

  const root = createRoot(container);
  root.render(React.createElement(TablesGridApp));
  return () => {
    root.unmount();
    if (container.style) {
      container.style.display = previous.display;
      container.style.flex = previous.flex;
      container.style.width = previous.width;
      container.style.height = previous.height;
      container.style.minHeight = previous.minHeight;
      container.style.overflow = previous.overflow;
    }
    container.innerHTML = '';
  };
}

export function createCsvTsvGridSurfaceContribution(dependencies = {}) {
  const resolvedDependencies = {
    parseDelimitedTable: dependencies.parseDelimitedTable === undefined
      ? defaultDependencies.parseDelimitedTable
      : dependencies.parseDelimitedTable,
    serializeDelimitedTable: dependencies.serializeDelimitedTable === undefined
      ? defaultDependencies.serializeDelimitedTable
      : dependencies.serializeDelimitedTable,
  };
  return {
    id: tablesGridSurfaceId,
    label: 'CSV / TSV grid',
    description: 'Open CSV and TSV text resources in the package-owned AG Grid surface.',
    kind: 'table-grid',
    localName: 'csv-grid',
    capabilities: [tablesGridCapabilityId],
    defaultActive: true,
    documentPredicate: tablesTextDocumentPredicate,
    resourcePredicate: tablesTextDocumentPredicate,
    resourceRepresentations: ['text'],
    languageIds: ['csv', 'tsv'],
    mimeTypes: ['text/csv', 'text/tab-separated-values'],
    fileExtensions: ['csv', 'tsv'],
    placements: ['main', 'popup', 'auxiliary'],
    openWithPriority: 80,
    open(execution = {}) {
      const title = execution.resourceTitle ?? execution.resource?.path ?? 'CSV / TSV grid';
      const parseState = parseSourceText(execution.sourceText ?? '', execution, {
        headerMode: 'auto',
        delimiterMode: 'auto',
        newlineMode: 'auto',
      }, resolvedDependencies);
      const runtimeDetails = createSurfaceSummary(parseState, execution.readOnly ?? false);
      const html = parseState.blocked
        ? createTablesFailureHtml(title, parseState.diagnostics)
        : createTablesRuntimeMarkup(title);

      return {
        mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}:${parseState.blocked ? 'blocked' : 'ready'}`,
        summary: runtimeDetails.summary,
        detail: runtimeDetails.detail,
        readOnly: execution.readOnly ?? false,
        diagnostics: parseState.diagnostics,
        inspectorSections: runtimeDetails.inspectorSections,
        surface: {
          model: {
            html,
            diagnostics: parseState.diagnostics,
          },
          mount(container) {
            if (parseState.blocked || !parseState.model) {
              ensureTablesPackageStyle(container);
              return createFakeRootMount(container, html);
            }

            let disposed = false;
            let disposeRuntime = createFakeRootMount(container, html);
            void (async () => {
              try {
                const mounted = await mountTablesGridRuntime(container, execution, parseState, resolvedDependencies);
                if (disposed) {
                  mounted();
                  return;
                }
                disposeRuntime = mounted;
              } catch (error) {
                const diagnostics = normalizeDiagnostics([
                  createTablesDiagnostic(error?.message ?? 'Table grid runtime failed to load.', 'error', {
                    code: 'tables.runtime.load-failed',
                  }),
                ]);
                this.model.diagnostics = diagnostics;
                this.model.html = createTablesFailureHtml(title, diagnostics);
                ensureTablesPackageStyle(container);
                container.innerHTML = this.model.html;
              }
            })();
            return () => {
              disposed = true;
              disposeRuntime();
            };
          },
        },
      };
    },
  };
}

export const csvTsvGridSurfaceContribution = createCsvTsvGridSurfaceContribution(defaultDependencies);
