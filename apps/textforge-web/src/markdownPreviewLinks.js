import {
  createDefaultWorkspaceRepositoryRoots,
  resolveWorkspaceRepositoryLocation,
} from '@textforge/workspace';

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

  const resolvedLocation = resolveWorkspaceRepositoryLocation(parsedHref.location, {
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
