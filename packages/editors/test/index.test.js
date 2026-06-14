import assert from 'node:assert/strict';
import test from 'node:test';

import { indentUnit } from '@codemirror/language';
import { EditorSelection, EditorState } from '@codemirror/state';
import {
  INDENT_UNIT,
  applyTextEdit,
  codeMirrorEditorCommandIds,
  codeMirrorEditorCommandMap,
  createCodeMirrorTextEditorSurface,
  createCodeMirrorEditorCommandContributions,
  createEditorCommandContributions,
  createTextEditorDocument,
  createTextEditorSelection,
  dedentSmartIndentation,
  deleteSelectedLines,
  insertIndentedNewline,
  insertSmartIndentation,
  listTextEditorLanguageModes,
  resolveGoToLinePosition,
  resolveTextEditorLanguageMode,
} from '../src/index.js';
import { selectCodeMirrorLineFromGutter } from '../src/codemirror-surface.js';

function createEditorState(doc, selection) {
  return EditorState.create({
    doc,
    selection,
    extensions: [
      indentUnit.of(INDENT_UNIT),
      EditorState.tabSize.of(2),
      EditorState.allowMultipleSelections.of(true),
    ],
  });
}

function runStateCommand(command, doc, selection) {
  let state = createEditorState(doc, selection);
  const target = {
    state,
    dispatch(spec) {
      const transaction = spec?.state ? spec : state.update(spec);
      state = transaction.state;
      target.state = state;
    },
  };

  const handled = command(target);
  return {
    handled,
    doc: state.doc.toString(),
    selection: state.selection,
  };
}

function createMockEditorView(doc) {
  let state = EditorState.create({ doc });
  const view = {
    state,
    focused: false,
    dispatch(spec) {
      const transaction = spec?.state ? spec : state.update(spec);
      state = transaction.state;
      view.state = state;
    },
    focus() {
      view.focused = true;
    },
  };

  return view;
}

test('text editor selection and edit helpers preserve document metadata', () => {
  const document = createTextEditorDocument(
    { resourceId: 'resource-1', path: '/docs/notes.md', kind: 'resource', representation: 'text' },
    'Hello world',
    {
      selection: createTextEditorSelection(0, 5),
      viewState: { scrollTop: 128, scrollLeft: 24, focused: true },
    },
  );

  const nextDocument = applyTextEdit(document, { kind: 'replace', start: 6, end: 11, text: 'TextForge' });
  const surface = createCodeMirrorTextEditorSurface({ document });

  assert.equal(nextDocument.text, 'Hello TextForge');
  assert.equal(nextDocument.viewState?.scrollTop, 128);
  assert.equal(nextDocument.viewState?.scrollLeft, 24);
  assert.equal(nextDocument.viewState?.focused, true);
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
  assert.equal(createCodeMirrorEditorCommandContributions().some((command) => command.id === 'editor.delete-line'), true);
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

test('line number gutter mousedown selects the corresponding editor line', () => {
  const view = createMockEditorView('one\ntwo\nthree');
  const secondLine = view.state.doc.line(2);
  const event = {
    button: 0,
    propagationStopped: false,
    stopPropagation() {
      event.propagationStopped = true;
    },
  };

  const handled = selectCodeMirrorLineFromGutter(view, { from: secondLine.from }, event);

  assert.equal(handled, true);
  assert.equal(event.propagationStopped, true);
  assert.equal(view.focused, true);
  assert.equal(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to), 'two\n');
});

test('line number gutter ignores non-primary mouse buttons', () => {
  const view = createMockEditorView('one\ntwo');

  const handled = selectCodeMirrorLineFromGutter(view, { from: 0 }, { button: 2 });

  assert.equal(handled, false);
  assert.equal(view.state.selection.main.empty, true);
  assert.equal(view.focused, false);
});

test('smart tab inserts spaces and never raw tabs', () => {
  const result = runStateCommand(insertSmartIndentation, '', EditorSelection.cursor(0));

  assert.equal(result.handled, true);
  assert.equal(result.doc, '  ');
  assert.equal(result.doc.includes('\t'), false);
});

test('smart tab in leading whitespace indents to the next two-space stop', () => {
  const result = runStateCommand(insertSmartIndentation, ' item', EditorSelection.cursor(1));

  assert.equal(result.doc, '  item');
});

test('smart tab inside text inserts spaces to the next indentation position', () => {
  const result = runStateCommand(insertSmartIndentation, 'abc', EditorSelection.cursor(3));

  assert.equal(result.doc, 'abc ');
});

test('shift tab dedents selected lines', () => {
  const result = runStateCommand(
    dedentSmartIndentation,
    '  a\n  b',
    EditorSelection.range(0, 7),
  );

  assert.equal(result.doc, 'a\nb');
});

test('enter preserves current line indentation', () => {
  const result = runStateCommand(insertIndentedNewline, '  alpha', EditorSelection.cursor(7));

  assert.equal(result.doc, '  alpha\n  ');
});

test('duplicate line down with no selection', () => {
  const result = runStateCommand(
    codeMirrorEditorCommandMap['editor.duplicate-line-down'],
    'one\ntwo',
    EditorSelection.cursor(1),
  );

  assert.equal(result.doc, 'one\none\ntwo');
});

test('duplicate selected lines down', () => {
  const result = runStateCommand(
    codeMirrorEditorCommandMap['editor.duplicate-line-down'],
    'one\ntwo\nthree',
    EditorSelection.range(0, 7),
  );

  assert.equal(result.doc, 'one\ntwo\none\ntwo\nthree');
});

test('delete current line with no selection', () => {
  const result = runStateCommand(deleteSelectedLines, 'one\ntwo\nthree', EditorSelection.cursor(5));

  assert.equal(result.doc, 'one\nthree');
});

test('delete selected lines', () => {
  const result = runStateCommand(deleteSelectedLines, 'one\ntwo\nthree', EditorSelection.range(0, 7));

  assert.equal(result.doc, 'three');
});

test('move line up and down at normal positions', () => {
  const movedUp = runStateCommand(
    codeMirrorEditorCommandMap['editor.move-line-up'],
    'one\ntwo\nthree',
    EditorSelection.cursor(5),
  );
  const movedDown = runStateCommand(
    codeMirrorEditorCommandMap['editor.move-line-down'],
    'one\ntwo\nthree',
    EditorSelection.cursor(5),
  );

  assert.equal(movedUp.doc, 'two\none\nthree');
  assert.equal(movedDown.doc, 'one\nthree\ntwo');
});

test('move line up at top and down at bottom are safe', () => {
  const movedUp = runStateCommand(
    codeMirrorEditorCommandMap['editor.move-line-up'],
    'one\ntwo',
    EditorSelection.cursor(0),
  );
  const movedDown = runStateCommand(
    codeMirrorEditorCommandMap['editor.move-line-down'],
    'one\ntwo',
    EditorSelection.cursor(5),
  );

  assert.equal(movedUp.doc, 'one\ntwo');
  assert.equal(movedDown.doc, 'one\ntwo');
});

test('select next occurrence adds another selection', () => {
  const result = runStateCommand(
    codeMirrorEditorCommandMap['editor.select-next-occurrence'],
    'alpha beta alpha',
    EditorSelection.range(0, 5),
  );

  assert.equal(result.selection.ranges.length, 2);
  assert.equal(result.selection.ranges[1].from, 11);
  assert.equal(result.selection.ranges[1].to, 16);
});

test('go to line resolution clamps valid line and column bounds safely', () => {
  const state = createEditorState('one\ntwo\nthree');

  assert.equal(resolveGoToLinePosition(state.doc, '2'), 4);
  assert.equal(resolveGoToLinePosition(state.doc, '99'), 8);
  assert.equal(resolveGoToLinePosition(state.doc, '2:99'), 7);
  assert.equal(resolveGoToLinePosition(state.doc, 'bad'), undefined);
});

test('editor command contributions include command palette scoped editor actions', () => {
  const commands = createEditorCommandContributions();
  const deleteCommand = commands.find((command) => command.id === 'editor.delete-line');

  assert.deepEqual(
    codeMirrorEditorCommandIds.every((commandId) => commands.some((command) => command.id === commandId)),
    true,
  );
  assert.equal(deleteCommand?.when?.activeSurfaceRequired, true);
  assert.equal(deleteCommand?.when?.activeSurfaceContributionIds?.[0], '@textforge/editors/code-mirror-text');
});
