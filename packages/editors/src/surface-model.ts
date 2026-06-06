import type { Diagnostic } from '@textforge/core';
import type { TextEditorDocument, TextEditorSurfaceModel } from './types.js';

export declare function createTextEditorSurfaceModel(
  document: TextEditorDocument,
  diagnostics?: ReadonlyArray<Diagnostic>,
): TextEditorSurfaceModel;
