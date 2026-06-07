import type { ContributionManifest } from '@textforge/core';
import type { TablesGridSurfaceDependencies } from './grid-surface';

export declare const tablesGridCapabilityId: '@textforge/tables/capability/csv-grid';
export declare const tablesGridSurfaceId: '@textforge/tables/csv-grid';
export declare const tablesTextDocumentPredicate: unknown;

export declare function createTablesContributionManifest(
  overrides?: TablesGridSurfaceDependencies & {
    readonly dependencies?: ReadonlyArray<string>;
    readonly capabilities?: unknown;
    readonly surfaces?: unknown;
  },
): ContributionManifest;

export declare const contributions: ContributionManifest;
