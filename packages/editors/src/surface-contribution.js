import { languageDefinitions } from '@textforge/core';

export const codeMirrorTextEditorSurfaceContribution = {
  id: '@textforge/editors/code-mirror-text',
  label: 'Text editor',
  description: 'Generic source editor surface for plain text resources.',
  kind: 'text-editor',
  localName: 'source',
  capabilities: ['@textforge/editors/capability/source'],
  defaultActive: true,
  editable: true,
  sourceRangeAware: true,
  languageIds: languageDefinitions.map((definition) => definition.id),
  placements: ['main', 'popup', 'auxiliary'],
  resourceRepresentations: ['text'],
  openWithPriority: 100,
};
