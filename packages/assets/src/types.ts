import type { ResourceRef } from '@textforge/core';
import type { SurfaceContribution } from '@textforge/surfaces';
import type { WorkspaceGeneratedProvenance, WorkspaceResource } from '@textforge/workspace';

export type AssetViewerKind = 'image' | 'svg' | 'pdf' | 'binary';
export type AssetBindingState = 'pending' | 'ready' | 'stale' | 'released';
export type BlobLeaseState = 'active' | 'released';

export interface BlobSourceLike {
  readonly size?: number;
  readonly type?: string;
  readonly data?: Uint8Array;
}

export interface BlobUrlDriver {
  createObjectURL(source: BlobSourceLike): string;
  revokeObjectURL(url: string): void;
}

export interface BlobUrlLease {
  readonly id: string;
  readonly resourceId: string;
  readonly url: string;
  readonly mimeType?: string;
  readonly createdAt: string;
  readonly releasedAt?: string;
  readonly state: BlobLeaseState;
}

export interface BlobUrlLedger {
  acquire(resource: ResourceRef, source: BlobSourceLike, mimeType?: string): BlobUrlLease;
  release(leaseId: string): boolean;
  get(leaseId: string): BlobUrlLease | undefined;
  list(): ReadonlyArray<BlobUrlLease>;
}

export interface WorkspaceAssetBinding {
  readonly resource: ResourceRef;
  readonly viewerKind: AssetViewerKind;
  readonly mimeType?: string;
  readonly title?: string;
  readonly blobUrl?: string;
  readonly provenance?: string | WorkspaceGeneratedProvenance;
  readonly state: AssetBindingState;
}

export interface AssetSurfaceContribution extends SurfaceContribution {
  readonly kind: 'asset-viewer';
  readonly viewerKind: AssetViewerKind;
  readonly readOnly: true;
  readonly mimeTypes?: ReadonlyArray<string>;
}

export interface AssetViewerRequest {
  readonly resource: ResourceRef;
  readonly workspaceResource?: WorkspaceResource;
  readonly mimeType?: string;
  readonly title?: string;
  readonly provenance?: string | WorkspaceGeneratedProvenance;
}

export interface AssetViewerSurfaceModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly viewerKind: AssetViewerKind;
  readonly state: AssetBindingState;
  readonly mimeType: string;
  readonly binding: WorkspaceAssetBinding;
  readonly lease?: BlobUrlLease;
  readonly blobUrl?: string;
  readonly resourceText: string;
  readonly provenance: string | WorkspaceGeneratedProvenance;
  readonly provenanceLabel: string;
}

export interface AssetViewerSurfaceOptions {
  readonly binding?: WorkspaceAssetBinding;
  readonly lease?: BlobUrlLease;
}

export interface AssetViewerSurface {
  readonly id: string;
  readonly contribution: AssetSurfaceContribution;
  readonly binding: WorkspaceAssetBinding;
  readonly lease?: BlobUrlLease;
  readonly model: AssetViewerSurfaceModel;
  mount(container: HTMLElement): () => void;
}
