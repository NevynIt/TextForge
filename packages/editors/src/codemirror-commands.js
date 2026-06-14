import {
  copyLineDown,
  copyLineUp,
  indentLess,
  indentMore,
  moveLineDown,
  moveLineUp,
  redo,
  selectLine,
  toggleComment,
  undo,
} from '@codemirror/commands';
import { EditorSelection } from '@codemirror/state';
import {
  gotoLine,
  selectNextOccurrence,
  selectSelectionMatches,
} from '@codemirror/search';
import {
  dedentSmartIndentation,
  insertIndentedNewline,
  insertSmartIndentation,
} from './codemirror-indentation.js';

export const codeMirrorEditorCommandIds = [
  'editor.undo',
  'editor.redo',
  'editor.delete-line',
  'editor.move-line-up',
  'editor.move-line-down',
  'editor.duplicate-line-up',
  'editor.duplicate-line-down',
  'editor.go-to-line',
  'editor.select-next-occurrence',
  'editor.select-all-occurrences',
  'editor.select-line',
  'editor.indent',
  'editor.outdent',
  'editor.toggle-line-comment',
];

export const codeMirrorEditorCommandMetadata = {
  'editor.undo': {
    label: 'Undo',
    hotkey: 'Ctrl+Z',
    description: 'Undo the last editor change.',
    keywords: ['editor', 'undo', 'history'],
    order: 20,
  },
  'editor.redo': {
    label: 'Redo',
    hotkey: 'Ctrl+Y',
    description: 'Redo the last undone editor change.',
    keywords: ['editor', 'redo', 'history'],
    order: 21,
  },
  'editor.delete-line': {
    label: 'Delete line',
    hotkey: 'Ctrl+Shift+K',
    description: 'Delete the current line or selected lines.',
    keywords: ['editor', 'delete', 'line'],
    order: 30,
  },
  'editor.move-line-up': {
    label: 'Move line up',
    hotkey: 'Alt+Up',
    description: 'Move the current line or selected lines up.',
    keywords: ['editor', 'move', 'line', 'up'],
    order: 31,
  },
  'editor.move-line-down': {
    label: 'Move line down',
    hotkey: 'Alt+Down',
    description: 'Move the current line or selected lines down.',
    keywords: ['editor', 'move', 'line', 'down'],
    order: 32,
  },
  'editor.duplicate-line-up': {
    label: 'Duplicate line up',
    hotkey: 'Shift+Alt+Up',
    description: 'Duplicate the current line or selected lines above.',
    keywords: ['editor', 'duplicate', 'copy', 'line', 'up'],
    order: 33,
  },
  'editor.duplicate-line-down': {
    label: 'Duplicate line down',
    hotkey: 'Shift+Alt+Down',
    description: 'Duplicate the current line or selected lines below.',
    keywords: ['editor', 'duplicate', 'copy', 'line', 'down'],
    order: 34,
  },
  'editor.go-to-line': {
    label: 'Go to line',
    hotkey: 'Ctrl+G',
    description: 'Open the editor line prompt and move to a line.',
    keywords: ['editor', 'go to line', 'goto'],
    order: 35,
  },
  'editor.select-next-occurrence': {
    label: 'Add selection to next match',
    hotkey: 'Ctrl+D',
    description: 'Add the next occurrence of the current selection or word.',
    keywords: ['editor', 'selection', 'occurrence', 'match'],
    order: 36,
  },
  'editor.select-all-occurrences': {
    label: 'Select all occurrences',
    hotkey: 'Ctrl+Shift+L',
    description: 'Select every occurrence of the current selection.',
    keywords: ['editor', 'selection', 'occurrences', 'matches'],
    order: 37,
  },
  'editor.select-line': {
    label: 'Select current line',
    hotkey: 'Ctrl+L',
    description: 'Select the current editor line.',
    keywords: ['editor', 'select', 'line'],
    order: 38,
  },
  'editor.indent': {
    label: 'Indent line',
    hotkey: 'Ctrl+]',
    description: 'Indent the current line or selected lines.',
    keywords: ['editor', 'indent'],
    order: 39,
  },
  'editor.outdent': {
    label: 'Outdent line',
    hotkey: 'Ctrl+[',
    description: 'Outdent the current line or selected lines.',
    keywords: ['editor', 'outdent', 'dedent'],
    order: 40,
  },
  'editor.toggle-line-comment': {
    label: 'Toggle line comment',
    hotkey: 'Ctrl+/',
    description: 'Toggle comments when the active language supports comment syntax.',
    keywords: ['editor', 'comment', 'line'],
    order: 41,
  },
};

function lineRangeForSelection(doc, range) {
  const fromLine = doc.lineAt(range.from);
  const rangeEnd = range.empty ? range.to : Math.max(range.from, range.to - 1);
  const toLine = doc.lineAt(rangeEnd);
  return {
    fromLine: fromLine.number,
    toLine: toLine.number,
  };
}

function mergeLineRanges(lineRanges) {
  const sorted = [...lineRanges].sort((left, right) => left.fromLine - right.fromLine);
  const merged = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range.fromLine <= previous.toLine + 1) {
      previous.toLine = Math.max(previous.toLine, range.toLine);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

function documentDeleteRangeForLines(doc, fromLineNumber, toLineNumber) {
  const fromLine = doc.line(fromLineNumber);
  const toLine = doc.line(toLineNumber);
  if (fromLineNumber === 1 && toLineNumber === doc.lines) {
    return { from: 0, to: doc.length };
  }
  if (toLine.to < doc.length) {
    return { from: fromLine.from, to: toLine.to + 1 };
  }
  return { from: Math.max(0, fromLine.from - 1), to: toLine.to };
}

export function deleteSelectedLines(target) {
  const { state } = target;
  const lineRanges = mergeLineRanges(state.selection.ranges.map((range) => lineRangeForSelection(state.doc, range)));
  if (lineRanges.length === 0) {
    return true;
  }

  const changes = lineRanges.map((range) =>
    documentDeleteRangeForLines(state.doc, range.fromLine, range.toLine));
  const changeSet = state.changes(changes);
  const firstPosition = changes[0]?.from ?? 0;
  const nextPosition = Math.min(changeSet.desc.mapPos(firstPosition, -1), changeSet.newLength);

  target.dispatch({
    changes: changeSet,
    selection: EditorSelection.cursor(nextPosition),
    scrollIntoView: true,
    userEvent: 'delete.line',
  });
  return true;
}

function languageSupportsComments(view) {
  return view.state
    .languageDataAt('commentTokens', view.state.selection.main.head)
    .some((tokens) => tokens?.line || tokens?.block);
}

export function toggleLineCommentIfSupported(view) {
  if (!languageSupportsComments(view)) {
    return true;
  }
  return toggleComment(view);
}

export const codeMirrorEditorCommandMap = {
  'editor.undo': undo,
  'editor.redo': redo,
  'editor.delete-line': deleteSelectedLines,
  'editor.move-line-up': moveLineUp,
  'editor.move-line-down': moveLineDown,
  'editor.duplicate-line-up': copyLineUp,
  'editor.duplicate-line-down': copyLineDown,
  'editor.go-to-line': gotoLine,
  'editor.select-next-occurrence': selectNextOccurrence,
  'editor.select-all-occurrences': selectSelectionMatches,
  'editor.select-line': selectLine,
  'editor.indent': indentMore,
  'editor.outdent': indentLess,
  'editor.toggle-line-comment': toggleLineCommentIfSupported,
};

export function runCodeMirrorEditorCommand(view, commandId) {
  const command = codeMirrorEditorCommandMap[commandId];
  if (typeof command !== 'function') {
    return false;
  }
  view.focus();
  return command(view);
}

export function createCodeMirrorEditorCommandTarget(view) {
  return {
    commandIds: codeMirrorEditorCommandIds,
    execute(commandId) {
      return runCodeMirrorEditorCommand(view, commandId);
    },
  };
}

export function createCodeMirrorEditorKeymap() {
  return [
    { key: 'Tab', run: insertSmartIndentation },
    { key: 'Shift-Tab', run: dedentSmartIndentation },
    { key: 'Enter', run: insertIndentedNewline },
    { key: 'Mod-z', run: codeMirrorEditorCommandMap['editor.undo'] },
    { key: 'Ctrl-y', mac: 'Mod-Shift-z', run: codeMirrorEditorCommandMap['editor.redo'] },
    { key: 'Ctrl-Shift-k', mac: 'Mod-Shift-k', run: codeMirrorEditorCommandMap['editor.delete-line'] },
    { key: 'Alt-ArrowUp', run: codeMirrorEditorCommandMap['editor.move-line-up'] },
    { key: 'Alt-ArrowDown', run: codeMirrorEditorCommandMap['editor.move-line-down'] },
    { key: 'Shift-Alt-ArrowUp', run: codeMirrorEditorCommandMap['editor.duplicate-line-up'] },
    { key: 'Shift-Alt-ArrowDown', run: codeMirrorEditorCommandMap['editor.duplicate-line-down'] },
    { key: 'Ctrl-g', mac: 'Mod-g', run: codeMirrorEditorCommandMap['editor.go-to-line'] },
    { key: 'Ctrl-d', mac: 'Mod-d', run: codeMirrorEditorCommandMap['editor.select-next-occurrence'] },
    { key: 'Ctrl-Shift-l', mac: 'Mod-Shift-l', run: codeMirrorEditorCommandMap['editor.select-all-occurrences'] },
    { key: 'Ctrl-l', mac: 'Mod-l', run: codeMirrorEditorCommandMap['editor.select-line'] },
    { key: 'Ctrl-]', mac: 'Mod-]', run: codeMirrorEditorCommandMap['editor.indent'] },
    { key: 'Ctrl-[', mac: 'Mod-[', run: codeMirrorEditorCommandMap['editor.outdent'] },
    { key: 'Ctrl-/', mac: 'Mod-/', run: codeMirrorEditorCommandMap['editor.toggle-line-comment'] },
  ];
}
