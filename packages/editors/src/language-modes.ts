import type { LanguageId, ResourceRef } from '@textforge/core';
import type { TextEditorDocument, TextEditorLanguageModeConfig } from './types.js';

export declare function createTextEditorLanguageModeConfig(
  languageId: LanguageId | string | undefined,
  resource?: ResourceRef,
): TextEditorLanguageModeConfig;

export declare function listTextEditorLanguageModes(): ReadonlyArray<TextEditorLanguageModeConfig>;

export declare function resolveTextEditorLanguageMode(document: TextEditorDocument): TextEditorLanguageModeConfig;
