import type { ContributionRegistry, Diagnostic } from '@textforge/core';
import type { BpmnViewerModel } from './types';

export declare function createBpmnViewerModelFromXml(
  xml: string,
  options?: {
    readonly title?: string;
    readonly resource?: unknown;
  },
): Promise<BpmnViewerModel>;

export declare function createBpmnViewerModelFromItmSource(
  sourceText: string,
  options?: {
    readonly title?: string;
    readonly resource?: {
      readonly path?: string;
      readonly mimeType?: string;
      readonly languageId?: string;
    };
    readonly workspaceService?: {
      readonly getEntryByPath?: (path: string) => unknown;
    };
    readonly repositoryResolution?: unknown;
    readonly contributionRegistry?: ContributionRegistry;
    readonly session?: {
      readonly surfaceState?: Readonly<Record<string, unknown>>;
    };
    readonly target?: Readonly<Record<string, unknown>>;
  },
): Promise<BpmnViewerModel>;
