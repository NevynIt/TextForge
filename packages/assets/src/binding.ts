import type {
  AssetViewerKind,
  AssetViewerRequest,
  BlobSourceLike,
  BlobUrlDriver,
  BlobUrlLease,
  BlobUrlLedger,
  WorkspaceAssetBinding,
} from './types.ts';
import type { ResourceRef } from '@textforge/core';

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
