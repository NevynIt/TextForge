import test from 'node:test';
import assert from 'node:assert/strict';

import { matchesResourcePredicate } from '@textforge/core';

import {
  parseDelimitedTable,
  renderReadonlyTableModel,
  serializeDelimitedTable,
} from '../src/index.js';
import {
  createTablesFailureHtml,
  createTablesRuntimeMarkup,
  ensureTablesAgGridThemeStyle,
  ensureTablesGlideStyle,
  ensureTablesPackageStyle,
} from '../src/dom-style.js';
import {
  applyTableCellEdits,
  applyTableFormatOverrides,
  appendTableColumn,
  appendTableRow,
  clearTableSelection,
  createCsvTsvAgGridFallbackSurfaceContribution,
  createCsvTsvGridSurfaceContribution,
  removeTableColumn,
  removeTableRow,
  renameTableColumn,
} from '../src/grid-surface.js';
import {
  contributions,
  createTablesContributionManifest,
  tablesAgGridFallbackSurfaceId,
  tablesGridCapabilityId,
  tablesGridSurfaceId,
  tablesTextDocumentPredicate,
} from '../src/manifest.js';

function createStyleTestContainer() {
  const headChildren = [];
  const head = {
    querySelector(selector) {
      if (selector === 'style[data-textforge-tables-style="true"]') {
        return headChildren.find((child) => child.dataset?.textforgeTablesStyle === 'true');
      }
      if (selector === 'style[data-textforge-tables-ag-grid-style="true"]') {
        return headChildren.find((child) => child.dataset?.textforgeTablesAgGridStyle === 'true');
      }
      if (selector === 'style[data-textforge-tables-glide-style="true"]') {
        return headChildren.find((child) => child.dataset?.textforgeTablesGlideStyle === 'true');
      }
      return undefined;
    },
    appendChild(node) {
      headChildren.push(node);
      node.parentNode = head;
      return node;
    },
  };
  const documentRef = {
    head,
    querySelector(selector) {
      if (selector === 'meta[name="textforge-csp-nonce"]') {
        return {
          getAttribute(name) {
            return name === 'content' ? 'nonce-123' : undefined;
          },
        };
      }
      return undefined;
    },
    createElement(tagName) {
      return {
        tagName,
        dataset: {},
        setAttribute(name, value) {
          this[name] = value;
        },
        remove() {
          const index = headChildren.indexOf(this);
          if (index >= 0) {
            headChildren.splice(index, 1);
          }
        },
      };
    },
  };

  return {
    innerHTML: '',
    style: {},
    ownerDocument: documentRef,
    headChildren,
  };
}

test('root exports expose the parser, serializer, and readonly renderer', async () => {
  const root = await import('../src/index.js');

  assert.equal(typeof root.parseDelimitedTable, 'function');
  assert.equal(typeof root.serializeDelimitedTable, 'function');
  assert.equal(typeof root.renderReadonlyTableModel, 'function');
  assert.equal(typeof root.createCsvTsvGridSurfaceContribution, 'function');
  assert.equal(typeof root.createCsvTsvAgGridFallbackSurfaceContribution, 'function');
});

test('parses a normal CSV file with auto header detection', () => {
  const model = parseDelimitedTable('name,age\nAlice,30\nBob,31', { format: 'csv' });

  assert.equal(model.metadata.format, 'csv');
  assert.equal(model.metadata.resolvedHeaderMode, 'header');
  assert.deepEqual(model.columns.map((column) => column.label), ['name', 'age']);
  assert.deepEqual(model.rows.map((row) => row.values), [
    { column_1: 'Alice', column_2: '30' },
    { column_1: 'Bob', column_2: '31' },
  ]);
});

test('prefers tab parsing for TSV resources', () => {
  const model = parseDelimitedTable('name\tage\nAlice\t30', { format: 'tsv' });

  assert.equal(model.metadata.format, 'tsv');
  assert.equal(model.metadata.dialect.delimiter, '\t');
  assert.equal(model.columns[0].label, 'name');
});

test('auto-detects semicolon-delimited CSV files', () => {
  const model = parseDelimitedTable('name;age\nAlice;30', { format: 'csv' });

  assert.equal(model.metadata.dialect.delimiter, ';');
  assert.equal(model.rows[0].values.column_2, '30');
});

test('preserves quoted delimiters, escaped quotes, and embedded newlines', () => {
  const model = parseDelimitedTable('name,notes\nAlice,"Said ""hello"", then left\r\nsecond line"', { format: 'csv' });

  assert.equal(model.rows[0].values.column_2, 'Said "hello", then left\nsecond line');
});

test('warns on duplicate and empty headers in explicit header mode', () => {
  const duplicateModel = parseDelimitedTable('name,name\nAlice,Bob', { format: 'csv', headerMode: 'header' });
  const emptyModel = parseDelimitedTable('name,\nAlice,Bob', { format: 'csv', headerMode: 'header' });

  assert.equal(duplicateModel.diagnostics.some((diagnostic) => diagnostic.code === 'tables.header.duplicate'), true);
  assert.equal(emptyModel.diagnostics.some((diagnostic) => diagnostic.code === 'tables.header.empty'), true);
});

test('falls back to no-header mode when automatic header detection is ambiguous', () => {
  const model = parseDelimitedTable('name,name\nAlice,Bob', { format: 'csv' });

  assert.equal(model.metadata.resolvedHeaderMode, 'no-header');
  assert.equal(model.diagnostics.some((diagnostic) => diagnostic.code === 'tables.header.auto-ambiguous'), true);
  assert.deepEqual(model.columns.map((column) => column.label), ['Column 1', 'Column 2']);
});

test('recovers ragged rows with empty-string fill and synthesized columns', () => {
  const model = parseDelimitedTable('name,age\nAlice,30,extra\nBob', { format: 'csv', headerMode: 'header' });

  assert.equal(model.columns.length, 3);
  assert.equal(model.columns[2].generated, true);
  assert.equal(model.rows[0].values.column_3, 'extra');
  assert.equal(model.rows[1].values.column_2, '');
  assert.equal(model.diagnostics.some((diagnostic) => diagnostic.code === 'tables.rows.ragged'), true);
});

test('preserves formula-like strings through parse and serialize', () => {
  const model = parseDelimitedTable('formula\n=SUM(A1:A2)', { format: 'csv' });
  const serialized = serializeDelimitedTable(model);

  assert.equal(model.rows[0].values.column_1, '=SUM(A1:A2)');
  assert.equal(serialized, 'formula\n=SUM(A1:A2)');
});

test('serializes with the parsed dialect and header mode', () => {
  const model = parseDelimitedTable('name;age\r\nAlice;30', { format: 'csv', headerMode: 'header' });
  const serialized = serializeDelimitedTable(model);

  assert.equal(serialized, 'name;age\r\nAlice;30');
});

test('never serializes generated headers in no-header mode', () => {
  const model = parseDelimitedTable('Alice,30\nBob,31', { format: 'csv', headerMode: 'no-header' });
  const serialized = serializeDelimitedTable(model);

  assert.equal(serialized, 'Alice,30\nBob,31');
});

test('blocks malformed quoting that would make the row structure unsafe', () => {
  const model = parseDelimitedTable('name,notes\nAlice,"broken"value', { format: 'csv' });

  assert.equal(model.metadata.source.blocked, true);
  assert.equal(model.diagnostics[0]?.code, 'tables.parse.failed');
  assert.equal(model.diagnostics[0]?.blocking, true);
});

test('emits warn and block size diagnostics at the required thresholds', () => {
  const warnSource = `${Array.from({ length: 201 }, (_, index) => `h${index + 1}`).join(',')}\n${Array.from({ length: 201 }, (_, index) => `${index + 1}`).join(',')}`;
  const warnModel = parseDelimitedTable(warnSource, { format: 'csv', headerMode: 'header' });
  const blockModel = parseDelimitedTable('x'.repeat((50 * 1024 * 1024) + 1), { format: 'csv' });

  assert.equal(warnModel.diagnostics.some((diagnostic) => diagnostic.code === 'tables.size.warn'), true);
  assert.equal(blockModel.metadata.source.blocked, true);
  assert.equal(blockModel.diagnostics.some((diagnostic) => diagnostic.code === 'tables.size.block'), true);
});

test('renders a minimal readonly HTML table', () => {
  const model = parseDelimitedTable('name,age\nAlice,30', { format: 'csv' });
  const html = renderReadonlyTableModel(model);

  assert.match(html, /<table/u);
  assert.match(html, /<thead>/u);
  assert.match(html, /<th scope="col">name<\/th>/u);
  assert.match(html, /<td>Alice<\/td>/u);
});

test('tables contribution manifest exposes the csv/tsv capability with Glide primary and AG fallback surfaces', () => {
  assert.equal(contributions.packageId, '@textforge/tables');
  assert.equal(contributions.capabilities.some((capability) => capability.id === tablesGridCapabilityId), true);
  assert.equal(contributions.surfaces.some((surface) => surface.id === tablesGridSurfaceId), true);
  assert.equal(contributions.surfaces.some((surface) => surface.id === tablesAgGridFallbackSurfaceId), true);
  assert.deepEqual(
    createTablesContributionManifest().surfaces.map((surface) => surface.id),
    [tablesGridSurfaceId, tablesAgGridFallbackSurfaceId],
  );
  assert.equal(createTablesContributionManifest().surfaces[0].openWithPriority, 110);
  assert.equal(createTablesContributionManifest().surfaces[1].openWithPriority, 109);
  assert.equal(matchesResourcePredicate(tablesTextDocumentPredicate, {
    kind: 'resource',
    representation: 'text',
    path: '/data/report.tsv',
    languageId: 'tsv',
    mimeType: 'text/tab-separated-values',
  }), true);
});

test('tables grid surface uses the parser-backed runtime by default', () => {
  const opened = createTablesContributionManifest().surfaces[0].open({
    sourceText: 'name,value\nalpha,1\n',
    resource: {
      resourceId: 'csv-runtime',
      kind: 'resource',
      representation: 'text',
      path: '/data/report.csv',
      languageId: 'csv',
      mimeType: 'text/csv',
    },
  });

  assert.equal(opened.diagnostics.some((diagnostic) => diagnostic.code === 'tables.surface.runtime'), false);
  assert.match(opened.surface.model.html, /Loading table grid/i);
  assert.equal(opened.detail.includes('1 rows / 2 columns'), true);
});

test('tables grid surface can fall back cleanly when parser dependencies are unavailable', () => {
  const opened = createCsvTsvGridSurfaceContribution({
    parseDelimitedTable: null,
    serializeDelimitedTable: null,
  }).open({
    sourceText: 'name,value\nalpha,1\n',
    resource: {
      resourceId: 'csv-missing',
      kind: 'resource',
      representation: 'text',
      path: '/data/report.csv',
      languageId: 'csv',
      mimeType: 'text/csv',
    },
  });

  assert.equal(opened.diagnostics.some((diagnostic) => diagnostic.code === 'tables.surface.runtime'), true);
  assert.match(opened.surface.model.html, /parser is not available/i);
});

test('tables AG fallback surface can fall back cleanly when parser dependencies are unavailable', () => {
  const opened = createCsvTsvAgGridFallbackSurfaceContribution({
    parseDelimitedTable: null,
    serializeDelimitedTable: null,
  }).open({
    sourceText: 'name,value\nalpha,1\n',
    resource: {
      resourceId: 'csv-fallback-missing',
      kind: 'resource',
      representation: 'text',
      path: '/data/report.csv',
      languageId: 'csv',
      mimeType: 'text/csv',
    },
  });

  assert.equal(opened.diagnostics.some((diagnostic) => diagnostic.code === 'tables.surface.runtime'), true);
  assert.match(opened.surface.model.html, /parser is not available/i);
});

test('grid helpers apply cell edits and structural row or column mutations renderer-agnostically', () => {
  const baseModel = parseDelimitedTable('name,value\nalpha,1', { format: 'csv' });
  const editedModel = applyTableCellEdits(baseModel, [{
    rowIndex: 0,
    columnField: baseModel.columns[1].field,
    value: '2',
  }]);
  const rowExtendedModel = appendTableRow(editedModel);
  const columnExtendedModel = appendTableColumn(rowExtendedModel);
  const renamedModel = renameTableColumn(columnExtendedModel, columnExtendedModel.columns[2].field, 'status');
  const columnTrimmedModel = removeTableColumn(renamedModel, renamedModel.columns[2].field);
  const rowTrimmedModel = removeTableRow(columnTrimmedModel, rowExtendedModel.rows[1].id);

  assert.equal(editedModel.rows[0].values[baseModel.columns[1].field], '2');
  assert.equal(rowExtendedModel.rows.length, 2);
  assert.equal(columnExtendedModel.columns.length, 3);
  assert.equal(columnExtendedModel.rows[0].values[columnExtendedModel.columns[2].field], '');
  assert.equal(renamedModel.columns[2].label, 'status');
  assert.equal(columnTrimmedModel.columns.length, 2);
  assert.equal(rowTrimmedModel.rows.length, 1);
});

test('grid helper clears selected cell, row, and column content', () => {
  const model = parseDelimitedTable('name,value\nalpha,1\nbeta,2', { format: 'csv' });
  const clearedModel = clearTableSelection(model, {
    current: {
      cell: [0, 0],
      range: { x: 0, y: 0, width: 1, height: 1 },
      rangeStack: [],
    },
    rows: {
      *[Symbol.iterator]() {
        yield 1;
      },
    },
    columns: {
      *[Symbol.iterator]() {
        yield 1;
      },
    },
  });

  assert.equal(clearedModel.rows[0].values[clearedModel.columns[0].field], '');
  assert.equal(clearedModel.rows[0].values[clearedModel.columns[1].field], '');
  assert.equal(clearedModel.rows[1].values[clearedModel.columns[0].field], '');
  assert.equal(clearedModel.rows[1].values[clearedModel.columns[1].field], '');
});

test('grid helper applies header, delimiter, and newline overrides through shared serialization', () => {
  const applied = applyTableFormatOverrides(
    'name;value\nalpha;1',
    {
      resource: {
        resourceId: 'csv-override',
        kind: 'resource',
        representation: 'text',
        path: '/data/report.csv',
        languageId: 'csv',
        mimeType: 'text/csv',
      },
    },
    {
      headerMode: 'header',
      delimiterMode: 'semicolon',
      newlineMode: 'crlf',
    },
    {
      parseDelimitedTable,
      serializeDelimitedTable,
    },
  );

  assert.equal(applied.blocked, false);
  assert.match(applied.text, /;/u);
  assert.match(applied.text, /\r\n/u);
  assert.equal(applied.model.metadata.resolvedHeaderMode, 'header');
  assert.deepEqual(applied.model.columns.map((column) => column.label), ['name', 'value']);
});

test('tables DOM style helper injects a single CSP-safe style tag', () => {
  const container = createStyleTestContainer();
  const disposeA = ensureTablesPackageStyle(container);
  const disposeB = ensureTablesPackageStyle(container);

  assert.equal(container.headChildren.length, 1);
  assert.equal(container.headChildren[0].nonce, 'nonce-123');
  assert.match(container.headChildren[0].textContent, /tf-tables-surface/u);

  disposeB();
  assert.equal(container.headChildren.length, 1);
  disposeA();
  assert.equal(container.headChildren.length, 0);
});

test('tables AG Grid theme helper injects a single CSP-safe style tag', () => {
  const container = createStyleTestContainer();
  const disposeA = ensureTablesAgGridThemeStyle(container, '.ag-theme-test{color:red}');
  const disposeB = ensureTablesAgGridThemeStyle(container, '.ag-theme-test{color:red}');

  assert.equal(container.headChildren.length, 1);
  assert.equal(container.headChildren[0].nonce, 'nonce-123');
  assert.equal(container.headChildren[0].dataset.textforgeTablesAgGridStyle, 'true');
  assert.match(container.headChildren[0].textContent, /\.ag-theme-test/u);

  disposeB();
  assert.equal(container.headChildren.length, 1);
  disposeA();
  assert.equal(container.headChildren.length, 0);
});

test('tables Glide style helper injects a single CSP-safe style tag', () => {
  const container = createStyleTestContainer();
  const disposeA = ensureTablesGlideStyle(container, '.gdg-test{color:red}');
  const disposeB = ensureTablesGlideStyle(container, '.gdg-test{color:red}');

  assert.equal(container.headChildren.length, 1);
  assert.equal(container.headChildren[0].nonce, 'nonce-123');
  assert.equal(container.headChildren[0].dataset.textforgeTablesGlideStyle, 'true');
  assert.match(container.headChildren[0].textContent, /\.gdg-test/u);

  disposeB();
  assert.equal(container.headChildren.length, 1);
  disposeA();
  assert.equal(container.headChildren.length, 0);
});

test('tables runtime and failure markup are labeled for the surface host', () => {
  assert.match(createTablesRuntimeMarkup('Report'), /data-tf-tables-surface="loading"/u);
  assert.match(createTablesFailureHtml('Report', [{ message: 'Malformed CSV' }]), /Malformed CSV/u);
});
