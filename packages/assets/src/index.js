import { createCommand, createContributionManifest } from '@textforge/core';

export function createAssetViewerSurfaceContribution(overrides) {
  return {
    ...overrides,
    kind: 'asset-viewer',
    readOnly: true,
  };
}

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

export const assetSurfaceContributions = [
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/image',
    label: 'Image viewer',
    description: 'Read-only image surface for workspace binary assets.',
    viewerKind: 'image',
    placements: ['main', 'popup', 'auxiliary'],
    resourceKinds: ['binary'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    openWithPriority: 80,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/svg',
    label: 'SVG viewer',
    description: 'Read-only SVG surface with workspace blob binding support.',
    viewerKind: 'svg',
    placements: ['main', 'popup', 'auxiliary'],
    resourceKinds: ['binary'],
    mimeTypes: ['image/svg+xml'],
    openWithPriority: 90,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/pdf',
    label: 'PDF viewer',
    description: 'Read-only PDF surface for workspace binary assets.',
    viewerKind: 'pdf',
    placements: ['main', 'popup'],
    resourceKinds: ['binary'],
    mimeTypes: ['application/pdf'],
    openWithPriority: 70,
  }),
  createAssetViewerSurfaceContribution({
    id: '@textforge/assets/binary',
    label: 'Binary viewer',
    description: 'Fallback viewer for binary workspace resources.',
    viewerKind: 'binary',
    placements: ['main', 'popup', 'auxiliary'],
    resourceKinds: ['binary'],
    openWithPriority: 10,
  }),
];

export const assetCommandContributions = [
  createCommand('asset.download-selected', 'Download selected asset', {
    category: 'asset',
    description: 'Download the selected binary resource through the existing asset viewer path.',
    keywords: ['asset', 'download', 'binary', 'viewer'],
    menu: { id: 'asset', label: 'Asset', groupOrder: 40, order: 10 },
    toolbar: { order: 90, kind: 'secondary' },
    when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['binary'] },
  }),
];

export function createAssetContributionManifest() {
  return createContributionManifest('@textforge/assets', {
    commands: assetCommandContributions,
    surfaces: assetSurfaceContributions,
  });
}

export const contributions = createAssetContributionManifest();

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

function createMediaNode(ownerDocument, model) {
  const stage = ownerDocument.createElement('div');
  stage.className = 'asset-viewer__stage';

  if (model.viewerKind === 'svg' || model.viewerKind === 'image') {
    if (model.blobUrl) {
      const img = ownerDocument.createElement('img');
      img.className = 'asset-viewer__media';
      img.src = model.blobUrl;
      img.alt = model.title;
      img.loading = 'lazy';
      stage.append(img);
    } else {
      const fallback = ownerDocument.createElement('pre');
      fallback.className = 'asset-viewer__fallback';
      fallback.textContent = model.resourceText || 'No image data available.';
      stage.append(fallback);
    }
  } else if (model.viewerKind === 'pdf') {
    if (model.blobUrl) {
      const frame = ownerDocument.createElement('iframe');
      frame.className = 'asset-viewer__media';
      frame.src = model.blobUrl;
      frame.title = model.title;
      stage.append(frame);
    } else {
      const fallback = ownerDocument.createElement('pre');
      fallback.className = 'asset-viewer__fallback';
      fallback.textContent = 'PDF preview is available when a blob URL is bound.';
      stage.append(fallback);
    }
  } else {
    const fallback = ownerDocument.createElement('pre');
    fallback.className = 'asset-viewer__fallback';
    fallback.textContent = model.resourceText || 'Binary resource preview';
    stage.append(fallback);
  }

  return stage;
}

function createAssetViewerMarkup(model) {
  const downloadLabel = model.blobUrl ? 'Download asset' : 'No download link';
  const downloadMarkup = model.blobUrl
    ? `<a class="asset-viewer__download" data-download-link href="${escapeHtml(model.blobUrl)}" download="${escapeHtml(model.title)}">${escapeHtml(downloadLabel)}</a>`
    : `<span class="asset-viewer__download asset-viewer__download--disabled" data-download-link aria-disabled="true">${escapeHtml(downloadLabel)}</span>`;
  return `
    <section class="asset-viewer asset-viewer--${model.viewerKind}">
      <header class="asset-viewer__header">
        <div>
          <span class="asset-viewer__eyebrow">Asset viewer</span>
          <h4>Workspace asset preview</h4>
        </div>
        <div class="asset-viewer__meta">
          <span>${escapeHtml(model.viewerKind)}</span>
          <span>${escapeHtml(model.mimeType)}</span>
        </div>
      </header>
      <div class="asset-viewer__body">
        <div class="asset-viewer__stage"></div>
        <aside class="asset-viewer__details">
          <div class="asset-viewer__detail">
            <span>State</span>
            <strong>${escapeHtml(model.state)}</strong>
          </div>
          <div class="asset-viewer__detail">
            <span>Source</span>
            <strong>${escapeHtml(model.provenance)}</strong>
          </div>
          <div class="asset-viewer__detail">
            <span>Blob URL</span>
            <strong>${model.blobUrl ? 'bound' : 'unbound'}</strong>
          </div>
          <div class="asset-viewer__detail">
            <span>Action</span>
            <strong>${downloadMarkup}</strong>
          </div>
        </aside>
      </div>
      <footer class="asset-viewer__footer">
        <span>${escapeHtml(model.state)}</span>
        <span>${escapeHtml(model.provenance)}</span>
      </footer>
    </section>
  `;
}

export function createAssetViewerSurfaceModel(request, binding, lease) {
  const resolvedBinding = binding ?? createWorkspaceAssetBinding(request);
  const viewerKind = resolvedBinding.viewerKind;
  const title = resolvedBinding.title ?? request.resource.path ?? request.resource.resourceId;
  const state = resolvedBinding.state;
  const blobUrl = resolvedBinding.blobUrl ?? lease?.url;
  const mimeType = resolvedBinding.mimeType ?? request.resource.mimeType ?? request.workspaceResource?.mimeType ?? 'application/octet-stream';
  const resourceText = request.workspaceResource?.kind === 'binary'
    ? bytesToText(request.workspaceResource.bytes)
    : request.workspaceResource?.kind === 'text'
      ? request.workspaceResource.text
      : '';

  return {
    id: `asset-viewer:${request.resource.resourceId}`,
    title,
    summary: `${viewerKind} asset viewer for ${mimeType}.`,
    viewerKind,
    state,
    mimeType,
    binding: resolvedBinding,
    lease,
    blobUrl,
    resourceText,
    provenance: request.provenance ?? 'workspace-bound',
  };
}

export function createAssetViewerSurface(request, options = {}) {
  const binding = options.binding ?? createWorkspaceAssetBinding(request);
  const model = createAssetViewerSurfaceModel(request, binding, options.lease);
  return {
    id: model.id,
    contribution:
      assetSurfaceContributions.find((candidate) => candidate.viewerKind === binding.viewerKind) ??
      assetSurfaceContributions[assetSurfaceContributions.length - 1],
    binding,
    lease: options.lease,
    model,
    mount(container) {
      container.innerHTML = createAssetViewerMarkup(model);
      const stage = container.querySelector('.asset-viewer__stage');
      if (!stage) {
        return () => {};
      }

      const ownerDocument = container.ownerDocument ?? globalThis.document;
      if (!ownerDocument) {
        return () => {};
      }

      stage.replaceChildren(createMediaNode(ownerDocument, model));
      const downloadLink = container.querySelector('[data-download-link]');
      if (downloadLink && model.blobUrl) {
        downloadLink.setAttribute('href', model.blobUrl);
        downloadLink.setAttribute('download', model.title);
      }
      return () => {};
    },
  };
}

function createAssetViewerSurfaceForKind(viewerKind, request, options = {}) {
  const baseBinding = options.binding ?? createWorkspaceAssetBinding(request);
  return createAssetViewerSurface(request, {
    ...options,
    binding: {
      ...baseBinding,
      viewerKind,
    },
  });
}

export function createImageAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('image', request, options);
}

export function createSvgAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('svg', request, options);
}

export function createPdfAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('pdf', request, options);
}

export function createBinaryAssetViewerSurface(request, options = {}) {
  return createAssetViewerSurfaceForKind('binary', request, options);
}
