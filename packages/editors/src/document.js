export function createTextEditorSelection(anchor, head = anchor) {
  return { anchor, head };
}

export function normalizeTextSelection(selection) {
  return {
    anchor: Math.max(0, selection.anchor),
    head: Math.max(0, selection.head),
  };
}

export function clampTextSelection(selection, text) {
  const max = text.length;
  return {
    anchor: Math.min(Math.max(0, selection.anchor), max),
    head: Math.min(Math.max(0, selection.head), max),
  };
}

export function sourceRangeToSelection(range) {
  return {
    anchor: range.start.offset ?? 0,
    head: range.end.offset ?? range.start.offset ?? 0,
  };
}

export function normalizeLineEndings(text) {
  return text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

export function splitLines(text) {
  return normalizeLineEndings(text).split('\n');
}

export function countLines(text) {
  return splitLines(text).length;
}

export function offsetToSourcePosition(text, offset) {
  const normalizedText = normalizeLineEndings(text);
  const clampedOffset = Math.min(Math.max(0, offset), normalizedText.length);
  if (normalizedText.length === 0 && offset > 0) {
    return {
      line: 1,
      column: offset + 1,
      offset,
    };
  }

  let line = 1;
  let lineStart = 0;

  for (let index = 0; index < clampedOffset; index += 1) {
    if (normalizedText[index] === '\n') {
      line += 1;
      lineStart = index + 1;
    }
  }

  return {
    line,
    column: clampedOffset - lineStart + 1,
    offset: clampedOffset,
  };
}

export function selectionToSourceRange(selection, text = '') {
  const start = Math.min(selection.anchor, selection.head);
  const end = Math.max(selection.anchor, selection.head);
  return {
    start: offsetToSourcePosition(text, start),
    end: offsetToSourcePosition(text, end),
  };
}

export function createTextEditorDocument(
  resource,
  text = '',
  options = {},
) {
  return {
    resource,
    text,
    version: options.version ?? 1,
    languageId: options.languageId,
    selection: options.selection,
    sourceRange: options.sourceRange,
    viewState: options.viewState,
    readOnly: options.readOnly,
  };
}

export function applyTextEdit(document, operation) {
  if (document.readOnly) {
    throw new Error(`Cannot edit read-only document: ${document.resource.resourceId}`);
  }

  const text = document.text;
  const nextText = (() => {
    switch (operation.kind) {
      case 'insert': {
        const offset = Math.min(Math.max(0, operation.offset), text.length);
        return `${text.slice(0, offset)}${operation.text}${text.slice(offset)}`;
      }
      case 'delete': {
        const start = Math.min(Math.max(0, operation.start), text.length);
        const end = Math.min(Math.max(start, operation.end), text.length);
        return `${text.slice(0, start)}${text.slice(end)}`;
      }
      case 'replace': {
        const start = Math.min(Math.max(0, operation.start), text.length);
        const end = Math.min(Math.max(start, operation.end), text.length);
        return `${text.slice(0, start)}${operation.text}${text.slice(end)}`;
      }
      default:
        return text;
    }
  })();

  return {
    ...document,
    text: nextText,
    version: document.version + 1,
    selection: clampTextSelection(document.selection ?? createTextEditorSelection(0), nextText),
    viewState: document.viewState,
  };
}

export function createTextEditorState(document, diagnostics = []) {
  return {
    document,
    diagnostics,
  };
}

export function createTextEditorNavigationTarget(resource, range) {
  return { resource, range };
}

export function createSourceRangeFromSelection(selection) {
  return selectionToSourceRange(selection);
}
