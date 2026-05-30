import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addDelimitedColumn,
  addDelimitedRow,
  buildDiagnosticsTableModel,
  buildItmCatalogueTableSections,
  buildItmMatrixTableModel,
  createDelimitedPatchSummary,
  inferDelimitedDialect,
  parseDelimitedText,
  removeDelimitedColumn,
  removeDelimitedRow,
  serializeDelimitedText,
  updateDelimitedCell,
  updateDelimitedColumnLabel,
} from '../src/index.js';
import {
  loadItmDocument,
  resolveItmVisualTarget,
} from '@textforge/itm';

const sampleItmText = `%metadata
{
  title: "Tables fixture"
}

&capability [archimate::Capability] Capability A
{
  id: "capability-a"
}

&application [archimate::ApplicationComponent] Application B
{
  id: "application-b"
}

@archimate::serving:application
{
  id: "serving-1"
}

%viewpoint table_view
{
  pipeline:
    - select: "ANY([archimate::Capability], [archimate::ApplicationComponent])"
    - includeEdges: "ANY(@archimate::serving:*)"
    - render: catalogue
}

%view tables_catalogue
{
  viewpoint: table_view
  title: "Catalogue sample"
}`;

test('inferDelimitedDialect returns TSV for tsv resources', () => {
  const dialect = inferDelimitedDialect({
    path: '/docs/sample.tsv',
    languageId: 'tsv',
  });

  assert.equal(dialect.id, 'tsv');
  assert.equal(dialect.delimiter, '\t');
});

test('parseDelimitedText handles headers, quotes, and newlines', () => {
  const parsed = parseDelimitedText('Name,Notes\n"Alpha","Line 1\nLine 2"\n"Beta","Plain"', {
    delimiter: ',',
    dialect: 'csv',
  });

  assert.equal(parsed.columns.length, 2);
  assert.equal(parsed.columns[0].label, 'Name');
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].cells[1], 'Line 1\nLine 2');
  assert.equal(parsed.diagnostics.length, 0);
});

test('serializeDelimitedText round-trips structured edits', () => {
  let state = parseDelimitedText('Name,Owner\nCapability A,Team 1', {
    delimiter: ',',
    dialect: 'csv',
  });
  state = addDelimitedRow(state);
  state = updateDelimitedCell(state, 1, 0, 'Capability B');
  state = updateDelimitedCell(state, 1, 1, 'Team 2');
  state = addDelimitedColumn(state, 'Status');
  state = updateDelimitedCell(state, 0, 2, 'Active');
  state = updateDelimitedCell(state, 1, 2, 'Planned');

  const serialized = serializeDelimitedText(state, { delimiter: ',' });

  assert.equal(serialized, 'Name,Owner,Status\nCapability A,Team 1,Active\nCapability B,Team 2,Planned');
});

test('createDelimitedPatchSummary counts row, column, header, and cell changes', () => {
  const baseline = parseDelimitedText('Name,Owner\nCapability A,Team 1', {
    delimiter: ',',
    dialect: 'csv',
  });
  let next = updateDelimitedColumnLabel(baseline, 0, 'Capability');
  next = updateDelimitedCell(next, 0, 1, 'Team Alpha');
  next = addDelimitedRow(next);
  next = updateDelimitedCell(next, 1, 0, 'Capability B');
  next = updateDelimitedCell(next, 1, 1, 'Team Beta');
  next = addDelimitedColumn(next, 'Status');

  const patch = createDelimitedPatchSummary(baseline, next, { delimiter: ',' });

  assert.equal(patch.changedHeaderCount, 1);
  assert.equal(patch.changedCellCount, 1);
  assert.equal(patch.addedRowCount, 1);
  assert.equal(patch.addedColumnCount, 1);
  assert.match(patch.nextText, /^Capability,Owner,Status/u);
});

test('delimited row and column removal preserve consistency', () => {
  let state = parseDelimitedText('A,B,C\n1,2,3\n4,5,6', {
    delimiter: ',',
    dialect: 'csv',
  });
  state = removeDelimitedColumn(state, 1);
  state = removeDelimitedRow(state, 0);

  assert.equal(state.columns.length, 2);
  assert.deepEqual(state.rows[0].cells, ['4', '6']);
});

test('buildItmCatalogueTableSections materializes the expected section sets', async () => {
  const loaded = await loadItmDocument(sampleItmText, { strict: false });
  const resolved = resolveItmVisualTarget(loaded, {
    projection: 'catalogue',
  });

  const sections = buildItmCatalogueTableSections(resolved.projectedDocument);

  assert.deepEqual(sections.map((section) => section.id), ['entities', 'relationships', 'views', 'viewpoints']);
  assert.equal(sections[0].rows.length, 2);
  assert.equal(sections[1].rows.length, 2);
  assert.equal(sections[2].rows.length, 1);
  assert.equal(sections[3].rows.length, 1);
});

test('buildItmMatrixTableModel supports hidden empty axes and flattened non-empty cells', async () => {
  const loaded = await loadItmDocument(sampleItmText, { strict: false });
  const resolved = resolveItmVisualTarget(loaded, {
    projection: 'matrix',
  });

  const compact = buildItmMatrixTableModel(resolved.projectedDocument, {
    showEmptyRows: false,
    showEmptyColumns: false,
  });
  const expanded = buildItmMatrixTableModel(resolved.projectedDocument, {
    showEmptyRows: true,
    showEmptyColumns: true,
  });

  assert.equal(compact.nonEmptyCellCount, 2);
  assert.equal(compact.cellRows.length, 2);
  assert.equal(expanded.totalRowCount >= compact.rows.length, true);
  assert.equal(expanded.totalColumnCount >= compact.visibleColumns.length, true);
});

test('buildDiagnosticsTableModel deduplicates repeated diagnostics', () => {
  const diagnostics = [
    {
      severity: 'warning',
      code: 'duplicate',
      message: 'Repeated message',
      resource: { resourceId: 'a', path: '/a.md' },
      origin: { packageId: '@textforge/example' },
    },
    {
      severity: 'warning',
      code: 'duplicate',
      message: 'Repeated message',
      resource: { resourceId: 'a', path: '/a.md' },
      origin: { packageId: '@textforge/example' },
    },
  ];

  const model = buildDiagnosticsTableModel(diagnostics, {
    title: 'Issue list',
  });

  assert.equal(model.title, 'Issue list');
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].code, 'duplicate');
});
