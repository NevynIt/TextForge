import assert from 'node:assert/strict';

import {
  applyTextEdit,
  codeMirrorTextEditorSurfaceContribution,
  createCodeMirrorTextEditorSurface,
  createTextEditorDocument,
  createTextEditorSelection,
  createTextEditorState,
  listTextEditorLanguageModes,
  resolveTextEditorLanguageMode,
  selectionToSourceRange,
} from '../src/index.js';

const document = createTextEditorDocument(
  { resourceId: 'resource-1', path: '/docs/notes.md', kind: 'text', languageId: 'markdown' },
  '# Notes\n',
  { selection: createTextEditorSelection(0, 7), languageId: 'markdown' },
);

const nextDocument = applyTextEdit(document, { kind: 'insert', offset: document.text.length, text: 'More' });

assert.equal(codeMirrorTextEditorSurfaceContribution.kind, 'text-editor');
assert.equal(nextDocument.text.endsWith('More'), true);
assert.equal(selectionToSourceRange(createTextEditorSelection(1, 4)).end.column, 5);
assert.equal(createTextEditorState(document).diagnostics.length, 0);

const surface = createCodeMirrorTextEditorSurface({ document });
assert.equal(surface.model.title, '/docs/notes.md');
assert.equal(surface.model.lineCount, 2);
assert.equal(surface.model.engine, 'codemirror-6');
assert.equal(surface.model.languageMode.languageId, 'markdown');
assert.equal(surface.model.languageMode.parserBacked, true);
assert.equal(resolveTextEditorLanguageMode(document).label, 'Markdown');
assert.equal(resolveTextEditorLanguageMode(createTextEditorDocument(
  { resourceId: 'resource-2', path: '/docs/config.yaml', kind: 'text' },
  'name: TextForge\n',
)).parserBacked, true);
assert.equal(resolveTextEditorLanguageMode(createTextEditorDocument(
  { resourceId: 'resource-3', path: '/docs/diagram.mmd', kind: 'text' },
  'graph TD',
)).parserBacked, false);
assert.equal(listTextEditorLanguageModes().length, 14);
assert.equal(listTextEditorLanguageModes().filter((mode) => mode.parserBacked).length >= 8, true);
assert.equal(typeof surface.mount, 'function');

console.info('editors package checks passed');
