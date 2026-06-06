import { createCapability, createResourcePredicate } from '@textforge/core';

const textDocumentPredicate = createResourcePredicate({
  representations: ['text'],
});

export const editorCapabilities = [
  createCapability('@textforge/editors/capability/source', {
    description: 'Open text-backed workspace resources in the CodeMirror source editor.',
    localName: 'source',
    defaultActive: true,
    scope: 'document',
    documentPredicate: textDocumentPredicate,
  }),
  createCapability('@textforge/editors/capability/language-mode', {
    description: 'Switch the language mode for text-backed workspace resources.',
    localName: 'language-mode',
    aliases: ['language'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: textDocumentPredicate,
  }),
];
