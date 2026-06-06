import type { ResourcePredicate } from '@textforge/core';

export declare const bpmnRulesCapabilityId: '@textforge/bpmn/capability/rules';
export declare const bpmnXmlCapabilityId: '@textforge/bpmn/capability/xml';
export declare const bpmnViewerCapabilityId: '@textforge/bpmn/capability/viewer';
export declare const bpmnDiCapabilityId: '@textforge/bpmn/capability/di';
export declare const bpmnSemanticCapabilityId: '@textforge/bpmn/capability/semantic';
export declare const bpmnCapabilityIds: ReadonlyArray<string>;

export declare const bpmnXmlDocumentPredicate: ResourcePredicate;
export declare const bpmnItmDocumentPredicate: ResourcePredicate;
export declare const bpmnViewerSurfaceId: '@textforge/bpmn/viewer';
export declare const bpmnViewerSurfaceDocumentPredicate: ResourcePredicate;
