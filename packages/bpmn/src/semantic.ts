import type { ContributionManifest, Diagnostic } from '@textforge/core';
import type {
  ImportBpmnXmlOptions,
  ItmDiagnostic,
  ItmDocument,
  ItmLoadDocumentResult,
  LoadItmDocumentOptions,
  ResolvedItmDocument,
  ValidateItmDocumentOptions,
} from '@textforge/itm';
import type { BpmnViewerModel } from './types';
import type { bpmnSemanticFixtureTexts } from './fixtures';

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
