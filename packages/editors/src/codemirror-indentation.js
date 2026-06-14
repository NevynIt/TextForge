import {
  indentLess,
  indentMore,
  insertNewlineKeepIndent,
} from '@codemirror/commands';
import { EditorSelection, EditorState, countColumn } from '@codemirror/state';

export const INDENT_UNIT = '  ';
export const INDENT_WIDTH = INDENT_UNIT.length;

function getTabSize(state) {
  return state.facet(EditorState.tabSize);
}

function getLineOffset(line, position) {
  return Math.max(0, Math.min(line.length, position - line.from));
}

function getColumnAtOffset(line, offset, tabSize = INDENT_WIDTH) {
  return countColumn(line.text, tabSize, offset);
}

function getLeadingWhitespaceLength(text) {
  return text.match(/^[ \t]*/)?.[0].length ?? 0;
}

function hasLineSelection(state) {
  return state.selection.ranges.some((range) =>
    !range.empty || state.doc.lineAt(range.from).number !== state.doc.lineAt(range.to).number);
}

function hasMultipleCursorLines(state) {
  const lines = new Set(state.selection.ranges.map((range) => state.doc.lineAt(range.from).number));
  return lines.size > 1;
}

export function spacesToNextIndentStop(column, width = INDENT_WIDTH) {
  const remainder = column % width;
  return remainder === 0 ? width : width - remainder;
}

export function resolveGoToLinePosition(doc, input) {
  const raw = String(input ?? '').trim();
  const match = raw.match(/^(\d+)(?::(\d+))?$/);
  if (!match) {
    return undefined;
  }

  const requestedLine = Number.parseInt(match[1], 10);
  const requestedColumn = match[2] ? Number.parseInt(match[2], 10) : 1;
  if (!Number.isFinite(requestedLine) || !Number.isFinite(requestedColumn)) {
    return undefined;
  }

  const lineNumber = Math.min(Math.max(requestedLine, 1), doc.lines);
  const line = doc.line(lineNumber);
  const column = Math.min(Math.max(requestedColumn, 1), line.length + 1);
  return line.from + column - 1;
}

export function insertSmartIndentation(target) {
  const { state } = target;

  if (hasLineSelection(state) || hasMultipleCursorLines(state)) {
    return indentMore(target);
  }

  const tabSize = getTabSize(state);
  const transaction = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    const offset = getLineOffset(line, range.from);
    const column = getColumnAtOffset(line, offset, tabSize);
    const spaces = INDENT_UNIT.slice(0, spacesToNextIndentStop(column));
    return {
      changes: { from: range.from, insert: spaces },
      range: EditorSelection.cursor(range.from + spaces.length),
    };
  });

  target.dispatch(state.update(transaction, { scrollIntoView: true, userEvent: 'input.indent' }));
  return true;
}

export function dedentSmartIndentation(target) {
  const { state } = target;

  if (hasLineSelection(state) || hasMultipleCursorLines(state)) {
    return indentLess(target);
  }

  const range = state.selection.main;
  const line = state.doc.lineAt(range.from);
  const offset = getLineOffset(line, range.from);
  const leadingLength = getLeadingWhitespaceLength(line.text);
  if (offset > leadingLength || leadingLength === 0) {
    return true;
  }

  const leading = line.text.slice(0, leadingLength);
  const removeCount = leading.startsWith('\t') ? 1 : Math.min(INDENT_WIDTH, leading.match(/^ */)?.[0].length ?? 0);
  if (removeCount <= 0) {
    return true;
  }

  const from = line.from;
  const to = line.from + removeCount;
  const cursor = Math.max(line.from, range.from - Math.min(removeCount, offset));
  target.dispatch({
    changes: { from, to, insert: '' },
    selection: EditorSelection.cursor(cursor),
    scrollIntoView: true,
    userEvent: 'delete.dedent',
  });
  return true;
}

export function insertIndentedNewline(target) {
  return insertNewlineKeepIndent(target);
}
