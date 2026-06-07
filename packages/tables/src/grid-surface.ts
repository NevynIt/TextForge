import type { SurfaceContribution } from '@textforge/core';

export interface TablesGridSurfaceDependencies {
  readonly parseDelimitedTable?: (sourceText: string, options?: Record<string, unknown>) => unknown;
  readonly serializeDelimitedTable?: (model: unknown, options?: Record<string, unknown>) => unknown;
}

export declare function createCsvTsvGridSurfaceContribution(
  dependencies?: TablesGridSurfaceDependencies,
): SurfaceContribution;

export declare const csvTsvGridSurfaceContribution: SurfaceContribution;
