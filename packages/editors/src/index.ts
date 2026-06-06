export type {
  CodeMirrorTextEditorSurface,
  CodeMirrorTextEditorSurfaceProps,
  TextEditOperation,
  TextEditorDocument,
  TextEditorLanguageModeConfig,
  TextEditorLintBridge,
  TextEditorNavigationTarget,
  TextEditorSelection,
  TextEditorSurfaceContribution,
  TextEditorSurfaceModel,
  TextEditorSurfaceState,
  TextEditorViewState,
} from './types.js';
export {
  applyTextEdit,
  clampTextSelection,
  createSourceRangeFromSelection,
  createTextEditorDocument,
  createTextEditorNavigationTarget,
  createTextEditorOpenRequest,
  createTextEditorSelection,
  createTextEditorState,
  normalizeTextSelection,
  selectionToSourceRange,
  sourceRangeToSelection,
} from './document.js';
export {
  createTextEditorLanguageModeConfig,
  listTextEditorLanguageModes,
  resolveTextEditorLanguageMode,
} from './language-modes.js';
export { createTextEditorSurfaceModel } from './surface-model.js';
export { createCodeMirrorTextEditorSurface } from './codemirror-surface.js';
export {
  codeMirrorTextEditorSurfaceContribution,
  contributions,
  createEditorCommandContributions,
  createEditorContributionManifest,
} from './contributions.js';
