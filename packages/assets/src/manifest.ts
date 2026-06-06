import type { CommandContribution, ContributionManifest } from '@textforge/core';

export declare const assetCapabilities: ContributionManifest['capabilities'];
export declare const assetCommandContributions: ReadonlyArray<CommandContribution>;
export declare function createAssetContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
