import { createResourcePredicate } from '@textforge/core';

export const eaViewerCapabilityId = '@textforge/ea-viewer/capability/dashboard';
export const eaDashboardLuaTranslatorCapabilityId = '@textforge/ea-viewer/capability/ead.translator.lua';
export const eaViewerSurfaceId = '@textforge/ea-viewer/dashboard';

export const eaDashboardJsonDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['json'],
  mimeTypes: ['application/json', 'text/json'],
  fileExtensions: ['json'],
});

export const eaDashboardItmDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
});
