import type { Diagnostic } from '@textforge/core';
import type { ItmDocument, ResolvedItmDocument } from '@textforge/itm';
import type { BpmnDiagramInterchangeView } from './types';

export declare function extractBpmnDiagramInterchangeView(
  sourceText: string,
  options?: {
    readonly viewName?: string;
    readonly startLine?: number;
  },
): BpmnDiagramInterchangeView;

export declare function validateBpmnDiagramInterchangeView(
  view: BpmnDiagramInterchangeView,
  document: ItmDocument | ResolvedItmDocument,
  options?: {
    readonly resource?: unknown;
  },
): ReadonlyArray<Diagnostic>;

export declare function applyBpmnDiagramInterchangeToXml(
  xml: string,
  view: BpmnDiagramInterchangeView,
  options?: {
    readonly resource?: unknown;
  },
): Promise<{
  readonly xml: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}>;
