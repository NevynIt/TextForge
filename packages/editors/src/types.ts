import type {
  Diagnostic,
  LanguageId,
  ResourceRef,
  SourceRange,
} from '@textforge/core';
import type { SurfaceContribution, SurfacePlacement, SurfaceOpenRequest } from '@textforge/surfaces';

export type TextEditOperation =
  | { readonly kind: 'insert'; readonly offset: number; readonly text: string }
  | { readonly kind: 'delete'; readonly start: number; readonly end: number }
  | { readonly kind: 'replace'; readonly start: number; readonly end: number; readonly text: string };

export interface TextEditorSelection {
  readonly anchor: number;
  readonly head: number;
}

export interface TextEditorViewState {
  readonly scrollTop?: number;
  readonly scrollLeft?: number;
  readonly focused?: boolean;
}

export interface TextEditorDocument {
  readonly resource: ResourceRef;
  readonly text: string;
  readonly version: number;
  readonly languageId?: string;
  readonly selection?: TextEditorSelection;
  readonly sourceRange?: SourceRange;
  readonly viewState?: TextEditorViewState;
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

export interface TextEditorSurfaceModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly state: 'editable' | 'read-only';
  readonly languageLabel: string;
  readonly selection: TextEditorSelection;
  readonly selectionLabel: string;
  readonly range: SourceRange;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly text: string;
  readonly lineCount: number;
  readonly characterCount: number;
  readonly readOnly: boolean;
  readonly engine: 'codemirror-6';
  readonly languageMode: TextEditorLanguageModeConfig;
}

export interface TextEditorLanguageModeConfig {
  readonly languageId: LanguageId;
  readonly label: string;
  readonly mimeTypes: ReadonlyArray<string>;
  readonly extensions: ReadonlyArray<string>;
  readonly parserBacked: boolean;
  readonly sourceEditor: true;
}

export interface CodeMirrorTextEditorSurface {
  readonly id: string;
  readonly contribution: TextEditorSurfaceContribution;
  readonly document: TextEditorDocument;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly model: TextEditorSurfaceModel;
  mount(
    container: HTMLElement,
    handlers?: {
      readonly onChange?: (document: TextEditorDocument) => void;
      readonly onUpdate?: (document: TextEditorDocument) => void;
    },
  ): () => void;
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
