import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyTextEdit,
  createCodeMirrorTextEditorSurface,
  createEditorCommandContributions,
  createTextEditorDocument,
  createTextEditorSelection,
  listTextEditorLanguageModes,
  resolveTextEditorLanguageMode,
} from '../src/index.js';

test('text editor selection and edit helpers preserve document metadata', () => {
  const document = createTextEditorDocument(
    { resourceId: 'resource-1', path: '/docs/notes.md', kind: 'resource', representation: 'text' },
    'Hello world',
    { selection: createTextEditorSelection(0, 5) },
  );

  const nextDocument = applyTextEdit(document, { kind: 'replace', start: 6, end: 11, text: 'TextForge' });
  const surface = createCodeMirrorTextEditorSurface({ document });

  assert.equal(nextDocument.text, 'Hello TextForge');
  assert.equal(surface.model.lineCount, 1);
  assert.equal(surface.model.characterCount, 11);
  assert.equal(surface.model.engine, 'codemirror-6');
  assert.equal(resolveTextEditorLanguageMode(document).languageId, 'markdown');
  assert.equal(resolveTextEditorLanguageMode(document).parserBacked, true);
  assert.equal(resolveTextEditorLanguageMode(createTextEditorDocument(
    { resourceId: 'resource-2', path: '/docs/chart.mmd', kind: 'resource', representation: 'text' },
    'graph TD',
  )).parserBacked, false);
  assert.equal(listTextEditorLanguageModes().some((mode) => mode.languageId === 'bpmn-xml'), true);
  assert.equal(listTextEditorLanguageModes().find((mode) => mode.languageId === 'svg')?.parserBacked, true);
  assert.equal(createEditorCommandContributions().some((command) => command.id === 'editor.set-language:yaml'), true);
  assert.equal(typeof surface.mount, 'function');
});

test('text editor surface preserves read-only documents', () => {
  const document = createTextEditorDocument(
    { resourceId: 'resource-readonly', path: '/.textforge/resources/docs/guide.md', kind: 'resource', representation: 'text' },
    '# Guide\n',
    { readOnly: true, languageId: 'markdown' },
  );
  const surface = createCodeMirrorTextEditorSurface({ document });

  assert.equal(surface.model.readOnly, true);
  assert.equal(surface.model.state, 'read-only');
});
