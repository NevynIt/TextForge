import type {
  ContributionManifest,
  Diagnostic,
  ResourcePredicate,
} from '@textforge/core';
import type {
  ImportBpmnXmlOptions,
  ItmDiagnostic,
  ItmDocument,
  ItmLoadDocumentResult,
  LoadItmDocumentOptions,
  ResolvedItmDocument,
  ValidateItmDocumentOptions,
} from '@textforge/itm';

export declare const bpmnRulesCapabilityId: '@textforge/bpmn/capability/rules';
export declare const bpmnXmlCapabilityId: '@textforge/bpmn/capability/xml';
export declare const bpmnViewerCapabilityId: '@textforge/bpmn/capability/viewer';
export declare const bpmnDiCapabilityId: '@textforge/bpmn/capability/di';
export declare const bpmnSemanticCapabilityId: '@textforge/bpmn/capability/semantic';
export declare const bpmnCapabilityIds: ReadonlyArray<string>;

export declare const bpmnXmlDocumentPredicate: ResourcePredicate;
export declare const bpmnItmDocumentPredicate: ResourcePredicate;

export declare const bpmnSemanticProfileText: string;
export declare const bpmnSemanticFixtureTexts: Readonly<{
  readonly profile: string;
  readonly linearProcess: string;
  readonly exclusiveGatewayProcess: string;
}>;
export declare const bundledBpmnReferenceAssets: Readonly<{
  readonly rawXmlPath: 'docs/examples/bpmn/Training By Design.bpmn';
  readonly convertedItmPath: 'docs/examples/bpmn/training-by-design.lua-pipeline-reference.itm';
  readonly broadProfilePath: 'docs/examples/bpmn/bpmn-process-diagram-lite-profile.itm';
  readonly luaConverterPath: 'docs/examples/bpmn/bpmn-xml-to-itm.lua';
}>;

export declare function collectBpmnMvpScopeDiagnostics(
  document: ItmDocument | ResolvedItmDocument,
): ReadonlyArray<Diagnostic>;

export declare function validateBpmnSemanticDocument(
  document: ItmDocument | ResolvedItmDocument,
  options?: ValidateItmDocumentOptions,
): ReadonlyArray<ItmDiagnostic | Diagnostic>;

export declare function loadBpmnSemanticFixture(
  name: keyof typeof bpmnSemanticFixtureTexts,
  options?: LoadItmDocumentOptions,
): Promise<ItmLoadDocumentResult>;

export declare function loadBpmnSemanticProfile(
  options?: LoadItmDocumentOptions,
): Promise<ItmLoadDocumentResult>;

export declare function importBpmnSemanticXmlResult(
  xml: string,
  options?: ImportBpmnXmlOptions,
): {
  readonly value: ItmDocument;
  readonly diagnostics: ReadonlyArray<ItmDiagnostic | Diagnostic>;
};

export declare function createBpmnContributionManifest(overrides?: Partial<ContributionManifest>): ContributionManifest;
export declare const contributions: ContributionManifest;
