export { editorCapabilities } from './capabilities.js';
export {
  applyTextEdit,
  clampTextSelection,
  createSourceRangeFromSelection,
  createTextEditorDocument,
  createTextEditorNavigationTarget,
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
