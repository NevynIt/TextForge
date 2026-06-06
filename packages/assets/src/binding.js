export function selectAssetViewerKind(request) {
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

export function createWorkspaceAssetBinding(request) {
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

export function createBlobUrlLedger(driver) {
  const leases = new Map();
  let counter = 0;

  return {
    acquire(resource, source, mimeType) {
      const id = `blob-lease-${++counter}`;
      const url = driver.createObjectURL(source);
      const lease = {
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
    release(leaseId) {
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
    get(leaseId) {
      const lease = leases.get(leaseId);
      return lease ? { ...lease } : undefined;
    },
    list() {
      return [...leases.values()].map(({ source: _source, ...lease }) => ({ ...lease }));
    },
  };
}

export function markAssetBindingReady(binding, blobUrl) {
  return {
    ...binding,
    blobUrl,
    state: 'ready',
  };
}

export function markAssetBindingStale(binding) {
  return {
    ...binding,
    state: 'stale',
  };
}

export function markAssetBindingReleased(binding) {
  return {
    ...binding,
    blobUrl: undefined,
    state: 'released',
  };
}
