import type { Diagnostic, ResourceRef, SourceRange } from '@textforge/core';
import type { SurfaceContribution, SurfacePlacement, SurfaceOpenRequest } from '@textforge/surfaces';

export type TextEditOperation =
  | { readonly kind: 'insert'; readonly offset: number; readonly text: string }
  | { readonly kind: 'delete'; readonly start: number; readonly end: number }
  | { readonly kind: 'replace'; readonly start: number; readonly end: number; readonly text: string };

export interface TextEditorSelection {
  readonly anchor: number;
  readonly head: number;
}

export interface TextEditorDocument {
  readonly resource: ResourceRef;
  readonly text: string;
  readonly version: number;
  readonly languageId?: string;
  readonly selection?: TextEditorSelection;
  readonly sourceRange?: SourceRange;
  readonly readOnly?: boolean;
}

export interface TextEditorSurfaceContribution extends SurfaceContribution {
  readonly kind: 'text-editor';
  readonly editable: true;
  readonly sourceRangeAware?: boolean;
  readonly languageIds?: ReadonlyArray<string>;
  readonly surfacePlacement?: SurfacePlacement;
}

export interface TextEditorSurfaceState {
  readonly document: TextEditorDocument;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

export interface TextEditorNavigationTarget {
  readonly resource: ResourceRef;
  readonly range?: SourceRange;
}

export interface TextEditorLintBridge {
  lint(document: TextEditorDocument): ReadonlyArray<Diagnostic>;
}

export interface CodeMirrorTextEditorSurfaceProps extends SurfaceOpenRequest {
  readonly document: TextEditorDocument;
}

export const codeMirrorTextEditorSurfaceContribution: TextEditorSurfaceContribution = {
  id: '@textforge/editors/code-mirror-text',
  label: 'Text editor',
  description: 'Generic source editor surface for plain text resources.',
  kind: 'text-editor',
  editable: true,
  sourceRangeAware: true,
  placements: ['main', 'popup', 'auxiliary'],
  resourceKinds: ['text'],
  openWithPriority: 100,
};

export const contributions = {
  id: '@textforge/editors',
  diagnostics: [],
  commands: [],
  surfaces: [codeMirrorTextEditorSurfaceContribution],
  pipelines: [],
} as const;

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

export function selectionToSourceRange(selection: TextEditorSelection): SourceRange {
  const start = Math.min(selection.anchor, selection.head);
  const end = Math.max(selection.anchor, selection.head);
  return {
    start: { line: 1, column: start + 1, offset: start },
    end: { line: 1, column: end + 1, offset: end },
  };
}

export function createTextEditorDocument(
  resource: ResourceRef,
  text = '',
  options: Partial<Pick<TextEditorDocument, 'languageId' | 'selection' | 'sourceRange' | 'readOnly' | 'version'>> = {},
): TextEditorDocument {
  return {
    resource,
    text,
    version: options.version ?? 1,
    languageId: options.languageId,
    selection: options.selection,
    sourceRange: options.sourceRange,
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
  };
}

export function createTextEditorState(
  document: TextEditorDocument,
  diagnostics: ReadonlyArray<Diagnostic> = [],
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
