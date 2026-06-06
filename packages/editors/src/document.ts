import type { ResourceRef, SourceRange } from '@textforge/core';
import type {
  CodeMirrorTextEditorSurfaceProps,
  TextEditOperation,
  TextEditorDocument,
  TextEditorNavigationTarget,
  TextEditorSelection,
  TextEditorSurfaceState,
} from './types.js';
import type { SurfaceOpenRequest } from '@textforge/surfaces';

export function createTextEditorSelection(anchor: number, head: number = anchor): TextEditorSelection {
  return { anchor, head };
}

export function normalizeTextSelection(selection: TextEditorSelection): TextEditorSelection {
  return {
    anchor: Math.max(0, selection.anchor),
    head: Math.max(0, selection.head),
  };
}

export function clampTextSelection(selection: TextEditorSelection, text: string): TextEditorSelection {
  const max = text.length;
  return {
    anchor: Math.min(Math.max(0, selection.anchor), max),
    head: Math.min(Math.max(0, selection.head), max),
  };
}

export function sourceRangeToSelection(range: SourceRange): TextEditorSelection {
  return {
    anchor: range.start.offset ?? 0,
    head: range.end.offset ?? range.start.offset ?? 0,
  };
}

function offsetToSourcePosition(text: string, offset: number): SourceRange['start'] {
  const normalizedText = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
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

export function selectionToSourceRange(selection: TextEditorSelection, text = ''): SourceRange {
  const start = Math.min(selection.anchor, selection.head);
  const end = Math.max(selection.anchor, selection.head);
  return {
    start: offsetToSourcePosition(text, start),
    end: offsetToSourcePosition(text, end),
  };
}

export function createTextEditorDocument(
  resource: ResourceRef,
  text = '',
  options: Partial<Pick<TextEditorDocument, 'languageId' | 'selection' | 'sourceRange' | 'viewState' | 'readOnly' | 'version'>> = {},
): TextEditorDocument {
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

export function applyTextEdit(
  document: TextEditorDocument,
  operation: TextEditOperation,
): TextEditorDocument {
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

export function createTextEditorState(
  document: TextEditorDocument,
  diagnostics: TextEditorSurfaceState['diagnostics'] = [],
): TextEditorSurfaceState {
  return {
    document,
    diagnostics,
  };
}

export function createTextEditorNavigationTarget(resource: ResourceRef, range?: SourceRange): TextEditorNavigationTarget {
  return { resource, range };
}

export function createSourceRangeFromSelection(selection: TextEditorSelection): SourceRange {
  return selectionToSourceRange(selection);
}

export function createTextEditorOpenRequest(
  resource: ResourceRef,
  document: TextEditorDocument,
  overrides: Partial<SurfaceOpenRequest> = {},
): CodeMirrorTextEditorSurfaceProps {
  return {
    resource,
    document,
    title: overrides.title ?? document.resource.path ?? resource.resourceId,
    placement: overrides.placement ?? 'main',
    allowPopup: overrides.allowPopup ?? true,
    preferredSurfaceIds: overrides.preferredSurfaceIds,
    sourceSessionId: overrides.sourceSessionId,
  };
}
