import type { ContributionManifest, Diagnostic, ResourcePredicate, SurfaceContribution } from '@textforge/core';
import type { VisualItmDocument } from '@textforge/visual-itm';

export interface JsMindNodeRecord {
  readonly id: string;
  readonly topic: string;
  readonly parentid?: string;
  readonly isroot?: boolean;
  readonly direction?: 'left' | 'right';
  readonly expanded?: boolean;
}

export interface JsMindSearchMatch {
  readonly id: string;
  readonly label: string;
}

export interface JsMindNodeArrayResult {
  readonly rootId: string;
  readonly nodes: ReadonlyArray<JsMindNodeRecord>;
}

export interface JsMindSurfaceModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly visualDocument: VisualItmDocument;
  readonly rootId: string;
  readonly nodes: ReadonlyArray<JsMindNodeRecord>;
}

export declare const jsmindItmDocumentPredicate: ResourcePredicate;
export declare const jsmindSurfaceContribution: SurfaceContribution;
export declare function createJsMindNodeArray(visualDocument: VisualItmDocument): JsMindNodeArrayResult;
export declare function findJsMindMatches(
  visualDocument: VisualItmDocument,
  query: string,
): ReadonlyArray<JsMindSearchMatch>;
export declare function createJsMindSurfaceModel(
  visualDocument: VisualItmDocument,
  options?: {
    readonly title?: string;
    readonly diagnostics?: ReadonlyArray<Diagnostic>;
  },
): JsMindSurfaceModel;
export declare function createRendererJsMindContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
