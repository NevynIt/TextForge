import type { CodeMirrorTextEditorSurface, TextEditorDocument } from './types.js';
import type { Diagnostic } from '@textforge/core';

export declare function createCodeMirrorTextEditorSurface(props?: {
  readonly document?: TextEditorDocument;
  readonly diagnostics?: ReadonlyArray<Diagnostic>;
  readonly onChange?: (document: TextEditorDocument) => void;
  readonly onMountCommandTarget?: (target: unknown) => (() => void) | void;
  readonly onUpdate?: (document: TextEditorDocument) => void;
}): CodeMirrorTextEditorSurface;
