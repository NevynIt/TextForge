import {
  createCapability,
  createResourcePredicate,
} from '@textforge/core';

export const markdownDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['markdown'],
  mimeTypes: ['text/markdown', 'text/x-markdown'],
  fileExtensions: ['md', 'markdown', 'tfmd'],
});

export const diagramCapabilities = [
  createCapability('@textforge/diagrams/capability/mermaid', {
    description: 'Render Mermaid fenced blocks into SVG or PNG diagram assets.',
    aliases: ['mermaid', 'diagram.mermaid'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/diagrams/capability/graphviz', {
    description: 'Render Graphviz DOT fenced blocks into SVG or PNG diagram assets.',
    aliases: ['dot', 'graphviz.dot', 'diagram.dot', 'model.dot', 'diagram.dot.render'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
];
