import type {
  Capability,
  ContributionInspectorModel,
  ContributionManifest,
  ContributionRegistry,
  ContributionRegistryResolution,
  DocumentContributionContext,
  DocumentContributionResolverOptions,
  MarkdownFenceHandlerContribution,
  PipelineContribution,
  SurfaceContribution,
} from './types';

export declare function createCapability(id: string, overrides?: Partial<Capability>): Capability;
export declare function createSurfaceContribution(id: string, overrides?: Partial<SurfaceContribution>): SurfaceContribution;
export declare function createPipelineContribution(id: string, overrides?: Partial<PipelineContribution>): PipelineContribution;
export declare function createMarkdownFenceHandlerContribution(
  id: string,
  overrides?: Partial<MarkdownFenceHandlerContribution>,
): MarkdownFenceHandlerContribution;
export declare function createCanonicalContributionId(packageId: string, localName: string): string;
export declare function deriveContributionLocalName(packageId: string, contributionId?: string): string | undefined;
export declare function deriveCapabilityLocalName(capabilityId?: string): string | undefined;
export declare function createContributionManifest(
  packageId: string,
  overrides?: Partial<ContributionManifest>,
): ContributionManifest;
export declare function createContributionRegistry(
  initialManifests?: ReadonlyArray<ContributionManifest>,
): ContributionRegistry;
export declare function resolveDocumentContributionContext(input: {
  readonly registry: ContributionRegistry;
} & DocumentContributionResolverOptions): DocumentContributionContext;
export declare function createContributionInspectorModel(input: {
  readonly resolution: ContributionRegistryResolution;
  readonly documentContext?: DocumentContributionContext;
}): ContributionInspectorModel;

export declare const defaultContributionManifest: ContributionManifest;

export declare const contributions: ContributionManifest;
