import { createResourcePredicate } from '@textforge/core';

export const eaViewerCapabilityId = '@textforge/ea-viewer/capability/dashboard';
export const eaViewerSurfaceId = '@textforge/ea-viewer/dashboard';

export const eaDashboardJsonDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['json'],
  mimeTypes: ['application/json', 'text/json'],
  fileExtensions: ['json'],
});
