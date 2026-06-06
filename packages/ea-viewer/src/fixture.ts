import type { Diagnostic, ResourceRef } from '@textforge/core';

export interface EaDashboardFixtureRecord {
  readonly model: string;
  readonly pk: string | number;
  readonly fields: Readonly<Record<string, unknown>>;
}

export interface EaDashboardEntity {
  readonly id: number | string;
  readonly sourceModel: string;
  readonly [key: string]: unknown;
}

export interface EaDashboardModel {
  readonly sourceKind: 'ea-dashboard-django-fixture';
  readonly recordCount: number;
  readonly modelCounts: Readonly<Record<string, number>>;
  readonly securityDomains: ReadonlyArray<EaDashboardEntity>;
  readonly domains: ReadonlyArray<EaDashboardEntity>;
  readonly capabilities: ReadonlyArray<EaDashboardEntity>;
  readonly systems: ReadonlyArray<EaDashboardEntity>;
  readonly services: ReadonlyArray<EaDashboardEntity>;
  readonly dataEntities: ReadonlyArray<EaDashboardEntity>;
  readonly datacenters: ReadonlyArray<EaDashboardEntity>;
  readonly racks: ReadonlyArray<EaDashboardEntity>;
  readonly servers: ReadonlyArray<EaDashboardEntity>;
  readonly cloudResources: ReadonlyArray<EaDashboardEntity>;
  readonly databases: ReadonlyArray<EaDashboardEntity>;
  readonly projects: ReadonlyArray<EaDashboardEntity>;
  readonly strategicGoals: ReadonlyArray<EaDashboardEntity>;
  readonly valueStreams: ReadonlyArray<EaDashboardEntity>;
  readonly businessUnits: ReadonlyArray<EaDashboardEntity>;
  readonly businessProcesses: ReadonlyArray<EaDashboardEntity>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

export interface EaDashboardNormalizeResult {
  readonly recognized: boolean;
  readonly model?: EaDashboardModel;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

export declare function isEaDashboardFixture(input: unknown): input is ReadonlyArray<EaDashboardFixtureRecord>;
export declare function normalizeEaDashboardFixture(sourceText: string, options?: {
  readonly resource?: ResourceRef;
}): EaDashboardNormalizeResult;
export declare function createEaViewerModel(sourceText: string, options?: {
  readonly title?: string;
  readonly resource?: ResourceRef;
}): EaDashboardNormalizeResult & {
  readonly title: string;
};
