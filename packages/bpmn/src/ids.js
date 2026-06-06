import { createResourcePredicate } from '@textforge/core';

export const bpmnRulesCapabilityId = '@textforge/bpmn/capability/rules';
export const bpmnXmlCapabilityId = '@textforge/bpmn/capability/xml';
export const bpmnViewerCapabilityId = '@textforge/bpmn/capability/viewer';
export const bpmnDiCapabilityId = '@textforge/bpmn/capability/di';
export const bpmnSemanticCapabilityId = '@textforge/bpmn/capability/semantic';

export const bpmnCapabilityIds = Object.freeze([
  bpmnRulesCapabilityId,
  bpmnXmlCapabilityId,
  bpmnViewerCapabilityId,
  bpmnDiCapabilityId,
  bpmnSemanticCapabilityId,
]);

export const bpmnXmlDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['bpmn-xml'],
  mimeTypes: ['application/bpmn+xml'],
  fileExtensions: ['bpmn'],
});

export const bpmnItmDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
});

export const bpmnViewerSurfaceId = '@textforge/bpmn/viewer';
export const bpmnViewerSurfaceDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['bpmn-xml', 'itm'],
  fileExtensions: ['bpmn', 'itm'],
});
