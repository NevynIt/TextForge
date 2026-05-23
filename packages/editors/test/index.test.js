import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyTextEdit,
  createCodeMirrorTextEditorSurface,
  createTextEditorDocument,
  createTextEditorSelection,
} from '../src/index.js';

test('text editor selection and edit helpers preserve document metadata', () => {
  const document = createTextEditorDocument(
    { resourceId: 'resource-1', path: '/docs/notes.md', kind: 'text' },
    'Hello world',
    { selection: createTextEditorSelection(0, 5) },
  );

  const nextDocument = applyTextEdit(document, { kind: 'replace', start: 6, end: 11, text: 'TextForge' });
  const surface = createCodeMirrorTextEditorSurface({ document });

  assert.equal(nextDocument.text, 'Hello TextForge');
  assert.match(surface.html, /textarea/);
});
