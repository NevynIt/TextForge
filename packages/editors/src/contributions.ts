import type {
  CommandContribution,
  ContributionManifest,
} from '@textforge/core';
import { languageDefinitions } from '@textforge/core';
import type { TextEditorLanguageModeConfig, TextEditorSurfaceContribution } from './types.js';

export const codeMirrorTextEditorSurfaceContribution: TextEditorSurfaceContribution = {
  id: '@textforge/editors/code-mirror-text',
  label: 'Text editor',
  description: 'Generic source editor surface for plain text resources.',
  kind: 'text-editor',
  editable: true,
  sourceRangeAware: true,
  languageIds: languageDefinitions.map((definition) => definition.id),
  placements: ['main', 'popup', 'auxiliary'],
  resourceRepresentations: ['text'],
  openWithPriority: 100,
};

export declare function createEditorCommandContributions(
  languageModes?: ReadonlyArray<TextEditorLanguageModeConfig>,
): ReadonlyArray<CommandContribution>;

export declare function createEditorContributionManifest(
  languageModes?: ReadonlyArray<TextEditorLanguageModeConfig>,
): ContributionManifest;

export declare const contributions: ContributionManifest;
