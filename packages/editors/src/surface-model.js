import {
  countLines,
  createTextEditorSelection,
  normalizeLineEndings,
  normalizeTextSelection,
  offsetToSourcePosition,
  selectionToSourceRange,
} from './document.js';
import { resolveTextEditorLanguageMode } from './language-modes.js';

export function formatSelectionLabel(selection, text) {
  const normalized = normalizeTextSelection(selection);
  const start = Math.min(normalized.anchor, normalized.head);
  const end = Math.max(normalized.anchor, normalized.head);
  const position = offsetToSourcePosition(text, start);
  const span = end - start;
  return `L${position.line}:C${position.column}${span > 0 ? `, ${span} selected` : ''}`;
}

export function createTextEditorSurfaceModel(document, diagnostics = []) {
  const title = document.resource.path ?? document.resource.resourceId;
  const selection = document.selection ?? createTextEditorSelection(0);
  const text = normalizeLineEndings(document.text);
  const range = document.sourceRange ?? selectionToSourceRange(selection, text);
  const state = document.readOnly ? 'read-only' : 'editable';
  const languageMode = resolveTextEditorLanguageMode(document);
  const languageLabel = languageMode.label;

  return {
    id: `text-editor:${document.resource.resourceId}`,
    title,
    summary: `${state} text surface for ${languageLabel}.`,
    state,
    languageLabel,
    selection,
    selectionLabel: formatSelectionLabel(selection, text),
    range,
    diagnostics,
    text,
    lineCount: countLines(text),
    characterCount: text.length,
    readOnly: Boolean(document.readOnly),
    engine: 'codemirror-6',
    languageMode,
  };
}
