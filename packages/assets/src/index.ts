import type { CommandContribution, ContributionManifest, ResourceRef } from '@textforge/core';
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

export declare function createAssetViewerSurfaceContribution(
  overrides: Omit<AssetSurfaceContribution, 'kind' | 'readOnly'>,
): AssetSurfaceContribution;

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

export const assetSurfaceContributions: ReadonlyArray<AssetSurfaceContribution> = [
  {
    id: '@textforge/assets/image',
    label: 'Image viewer',
    description: 'Read-only image surface for workspace image resources.',
    kind: 'asset-viewer',
    viewerKind: 'image',
    readOnly: true,
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['bytes'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    openWithPriority: 80,
  },
  {
    id: '@textforge/assets/svg',
    label: 'SVG viewer',
    description: 'Read-only SVG surface with workspace blob binding support for text or byte resources.',
    kind: 'asset-viewer',
    viewerKind: 'svg',
    readOnly: true,
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['text', 'bytes'],
    mimeTypes: ['image/svg+xml'],
    openWithPriority: 90,
  },
  {
    id: '@textforge/assets/pdf',
    label: 'PDF viewer',
    description: 'Read-only PDF surface for workspace PDF resources.',
    kind: 'asset-viewer',
    viewerKind: 'pdf',
    readOnly: true,
    placements: ['main', 'popup'],
    resourceRepresentations: ['bytes'],
    mimeTypes: ['application/pdf'],
    openWithPriority: 70,
  },
  {
    id: '@textforge/assets/binary',
    label: 'File viewer',
    description: 'Fallback viewer for opaque byte-backed workspace resources.',
    kind: 'asset-viewer',
    viewerKind: 'binary',
    readOnly: true,
    placements: ['main', 'popup', 'auxiliary'],
    resourceRepresentations: ['bytes'],
    openWithPriority: 10,
  },
];

export declare const assetCommandContributions: ReadonlyArray<CommandContribution>;
export declare function createAssetContributionManifest(): ContributionManifest;
export declare const contributions: ContributionManifest;
export declare function createAssetProvenanceLabel(provenance: AssetViewerRequest['provenance']): string;

export function createWorkspaceAssetBinding(request: AssetViewerRequest): WorkspaceAssetBinding {
  const viewerKind = selectAssetViewerKind(request);
  return {
    resource: request.resource,
    viewerKind,
    mimeType: request.mimeType ?? request.resource.mimeType,
    title: request.title ?? request.resource.path ?? request.resource.resourceId,
    provenance: request.provenance,
    state: 'pending',
  };
}

export function selectAssetViewerKind(request: AssetViewerRequest): AssetViewerKind {
  const mimeType = request.mimeType ?? request.resource.mimeType ?? request.workspaceResource?.mimeType;
  if (mimeType === 'image/svg+xml') {
    return 'svg';
  }

  if (mimeType?.startsWith('image/')) {
    return 'image';
  }

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  return 'binary';
}

export function createBlobUrlLedger(driver: BlobUrlDriver): BlobUrlLedger {
  const leases = new Map<string, BlobUrlLease & { readonly source: BlobSourceLike }>();
  let counter = 0;

  return {
    acquire(resource: ResourceRef, source: BlobSourceLike, mimeType?: string): BlobUrlLease {
      const id = `blob-lease-${++counter}`;
      const url = driver.createObjectURL(source);
      const lease: BlobUrlLease & { readonly source: BlobSourceLike } = {
        id,
        resourceId: resource.resourceId,
        url,
        mimeType: mimeType ?? source.type,
        createdAt: new Date().toISOString(),
        state: 'active',
        source,
      };
      leases.set(id, lease);
      return lease;
    },
    release(leaseId: string): boolean {
      const current = leases.get(leaseId);
      if (!current || current.state === 'released') {
        return false;
      }

      driver.revokeObjectURL(current.url);
      leases.set(leaseId, {
        ...current,
        releasedAt: new Date().toISOString(),
        state: 'released',
      });
      return true;
    },
    get(leaseId: string): BlobUrlLease | undefined {
      const lease = leases.get(leaseId);
      return lease ? { ...lease } : undefined;
    },
    list(): ReadonlyArray<BlobUrlLease> {
      return [...leases.values()].map(({ source: _source, ...lease }) => ({ ...lease }));
    },
  };
}

export function markAssetBindingReady(binding: WorkspaceAssetBinding, blobUrl: string): WorkspaceAssetBinding {
  return {
    ...binding,
    blobUrl,
    state: 'ready',
  };
}

export function markAssetBindingStale(binding: WorkspaceAssetBinding): WorkspaceAssetBinding {
  return {
    ...binding,
    state: 'stale',
  };
}

export function markAssetBindingReleased(binding: WorkspaceAssetBinding): WorkspaceAssetBinding {
  return {
    ...binding,
    blobUrl: undefined,
    state: 'released',
  };
}

export declare function createAssetViewerSurfaceModel(
  request: AssetViewerRequest,
  binding?: WorkspaceAssetBinding,
  lease?: BlobUrlLease,
): AssetViewerSurfaceModel;

export declare function createAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createImageAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createSvgAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createPdfAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;

export declare function createBinaryAssetViewerSurface(
  request: AssetViewerRequest,
  options?: AssetViewerSurfaceOptions,
): AssetViewerSurface;
