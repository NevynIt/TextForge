import {
  createDefaultWorkspaceRepositoryRoots,
  resolveWorkspaceRepositoryLocation,
} from '@textforge/workspace';

const repositoryProtocolPattern = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u;
const windowsAbsolutePathPattern = /^[A-Za-z]:[\\/]/u;

function splitMarkdownLinkHref(href) {
  const normalizedHref = String(href ?? '').trim();
  if (!normalizedHref) {
    return {
      location: '',
      fragment: '',
    };
  }

  if (normalizedHref.startsWith('#')) {
    return {
      location: '',
      fragment: normalizedHref.slice(1),
    };
  }

  const hashIndex = normalizedHref.indexOf('#');
  if (hashIndex < 0) {
    return {
      location: normalizedHref,
      fragment: '',
    };
  }

  return {
    location: normalizedHref.slice(0, hashIndex),
    fragment: normalizedHref.slice(hashIndex + 1),
  };
}

function looksLikeUrl(value) {
  return repositoryProtocolPattern.test(String(value ?? ''));
}

function splitRepositoryTarget(target) {
  const normalizedTarget = String(target ?? '').trim();
  if (
    normalizedTarget === ''
    || normalizedTarget.startsWith('/')
    || normalizedTarget.startsWith('./')
    || normalizedTarget.startsWith('../')
    || looksLikeUrl(normalizedTarget)
    || windowsAbsolutePathPattern.test(normalizedTarget)
  ) {
    return undefined;
  }

  const separatorIndex = normalizedTarget.indexOf(':');
  if (separatorIndex <= 0) {
    return undefined;
  }

  return {
    repositoryName: normalizedTarget.slice(0, separatorIndex),
    path: normalizedTarget.slice(separatorIndex + 1),
  };
}

function resolveMarkdownPreviewLocation(location, options) {
  const normalizedLocation = String(location ?? '').trim();
  const resolution = resolveWorkspaceRepositoryLocation(normalizedLocation, options);
  if (resolution.status === 'resolved') {
    return resolution;
  }
  if (
    !normalizedLocation
    || normalizedLocation.startsWith('/')
    || normalizedLocation.startsWith('./')
    || normalizedLocation.startsWith('../')
    || looksLikeUrl(normalizedLocation)
    || windowsAbsolutePathPattern.test(normalizedLocation)
    || splitRepositoryTarget(normalizedLocation)
  ) {
    return resolution;
  }

  return resolveWorkspaceRepositoryLocation(`./${normalizedLocation}`, options);
}

export function resolveMarkdownPreviewLinkTarget({
  href,
  repositoryAliases,
  repositoryRoots = createDefaultWorkspaceRepositoryRoots(),
  sourceResourcePath,
  workspace,
}) {
  const parsedHref = splitMarkdownLinkHref(href);
  if (!parsedHref.location) {
    return {
      kind: 'fragment',
      href: String(href ?? ''),
      fragment: parsedHref.fragment,
    };
  }

  const resolvedLocation = resolveMarkdownPreviewLocation(parsedHref.location, {
    basePath: sourceResourcePath,
    repositoryAliases,
    repositoryRoots,
  });
  if (resolvedLocation.status !== 'resolved' || !resolvedLocation.resolvedPath) {
    return {
      kind: 'missing',
      href: String(href ?? ''),
      fragment: parsedHref.fragment,
      resolvedLocation,
    };
  }

  const entry = workspace?.getEntryByPath?.(resolvedLocation.resolvedPath);
  if (!entry || entry.kind !== 'resource') {
    return {
      kind: 'missing',
      href: String(href ?? ''),
      fragment: parsedHref.fragment,
      resolvedLocation,
    };
  }

  return {
    kind: 'resource',
    href: String(href ?? ''),
    fragment: parsedHref.fragment,
    entry,
    resolvedLocation,
  };
}

export function activateMarkdownPreviewLink({
  href,
  onMissingTarget,
  openResourceEntry,
  placement,
  repositoryAliases,
  repositoryRoots,
  sourceResourcePath,
  workspace,
}) {
  const resolvedTarget = resolveMarkdownPreviewLinkTarget({
    href,
    repositoryAliases,
    repositoryRoots,
    sourceResourcePath,
    workspace,
  });
  if (resolvedTarget.kind === 'fragment') {
    return {
      handled: false,
      resolvedTarget,
    };
  }

  if (resolvedTarget.kind === 'resource') {
    openResourceEntry?.(resolvedTarget.entry, {
      placement,
    });
    return {
      handled: true,
      resolvedTarget,
      status: 'opened',
    };
  }

  onMissingTarget?.(resolvedTarget);
  return {
    handled: true,
    resolvedTarget,
    status: 'missing',
  };
}
