import {
  createCapability,
  createResourcePredicate,
} from '@textforge/core';

const imageDocumentPredicate = createResourcePredicate({
  representations: ['bytes'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
});
const svgDocumentPredicate = createResourcePredicate({
  representations: ['text', 'bytes'],
  mimeTypes: ['image/svg+xml'],
});
const pdfDocumentPredicate = createResourcePredicate({
  representations: ['bytes'],
  mimeTypes: ['application/pdf'],
});
const binaryDocumentPredicate = createResourcePredicate({
  representations: ['bytes'],
});

export const assetCapabilities = [
  createCapability('@textforge/assets/capability/image', {
    description: 'Open image resources through the image viewer surface.',
    localName: 'image',
    defaultActive: true,
    scope: 'document',
    documentPredicate: imageDocumentPredicate,
  }),
  createCapability('@textforge/assets/capability/svg', {
    description: 'Open SVG resources through the SVG viewer surface.',
    aliases: ['svg'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: svgDocumentPredicate,
  }),
  createCapability('@textforge/assets/capability/pdf', {
    description: 'Open PDF resources through the PDF viewer surface.',
    localName: 'pdf',
    defaultActive: true,
    scope: 'document',
    documentPredicate: pdfDocumentPredicate,
  }),
  createCapability('@textforge/assets/capability/binary', {
    description: 'Open opaque byte resources through the generic file viewer surface.',
    aliases: ['bytes', 'file'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: binaryDocumentPredicate,
  }),
];
