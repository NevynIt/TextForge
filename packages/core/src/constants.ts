import type { LanguageDefinition, ResourceCapabilityId, ResourceKind, ResourceRepresentation } from './types';

export const contributionKinds: {
  readonly diagnostics: 'diagnostics';
  readonly commands: 'commands';
  readonly surfaces: 'surfaces';
  readonly pipelines: 'pipelines';
  readonly markdownFenceHandlers: 'markdown-fence-handlers';
};

export const languageDefinitions: ReadonlyArray<LanguageDefinition>;
export const resourceKinds: ReadonlyArray<ResourceKind>;
export const resourceRepresentations: ReadonlyArray<ResourceRepresentation>;
export const resourceCapabilityIds: ReadonlyArray<ResourceCapabilityId>;
export const resourceBadgePlacements: ReadonlyArray<'center' | 'top' | 'right' | 'bottom' | 'left'>;
export const capabilityStates: ReadonlyArray<'available' | 'active' | 'disabled' | 'missing' | 'failed'>;
export const contributionRegistryPackageStatuses: ReadonlyArray<'available' | 'disabled' | 'missingDependency' | 'incompatibleVersion' | 'conflict' | 'failedToInitialize'>;

export const editorCapabilityIds: {
  readonly source: 'editor.source';
  readonly sourceRange: 'editor.source-range';
  readonly diagnostics: 'editor.diagnostics';
  readonly languageMode: 'editor.language-mode';
  readonly sourceFallback: 'editor.source-fallback';
};
