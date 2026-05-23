import assert from 'node:assert/strict';

import {
  applyTextEdit,
  codeMirrorTextEditorSurfaceContribution,
  createCodeMirrorTextEditorSurface,
  createTextEditorDocument,
  createTextEditorSelection,
  createTextEditorState,
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
assert.match(surface.html, /data-editor-input/);

console.info('editors package checks passed');
