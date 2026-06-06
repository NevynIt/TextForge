import {
  workspaceBundledRootPath,
  workspaceProviderIds,
  workspaceRepositoryUriPattern,
} from './constants.js';
import {
  dirnameWorkspacePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
} from './paths.js';

export function createDefaultWorkspaceRepositoryRoots() {
  return [
    {
      id: 'workspace-local-root',
      providerId: workspaceProviderIds.local,
      scheme: 'workspace',
      rootPath: '/',
      label: 'Writable workspace root',
      allowed: true,
      available: true,
    },
    {
      id: 'bundled-docs-root',
      providerId: workspaceProviderIds.bundled,
      scheme: 'bundled',
      rootPath: workspaceBundledRootPath,
      label: 'Bundled docs root',
      allowed: true,
      available: true,
    },
  ];
}

function looksLikeWorkspacePath(path) {
  return typeof path === 'string' && path.startsWith('/');
}

function looksLikeUrl(value) {
  return workspaceRepositoryUriPattern.test(String(value ?? ''));
}

function normalizeRepositoryLocationString(value) {
  return String(value ?? '').trim();
}

function joinRepositoryLocation(base, suffix) {
  if (!suffix) {
    return base;
  }

  if (looksLikeWorkspacePath(base)) {
    return joinWorkspacePath(base, suffix);
  }

  return `${String(base).replace(/[\\/]+$/u, '')}/${String(suffix).replace(/^[/\\]+/u, '')}`;
}

function normalizeWorkspaceRepositoryRoot(root) {
  const scheme = String(root?.scheme ?? '').trim().toLowerCase();
  if (!scheme) {
    return undefined;
  }

  return {
    ...root,
    id: String(root?.id ?? `${root?.providerId ?? 'workspace'}:${scheme}`),
    providerId: root?.providerId ?? workspaceProviderIds.local,
    scheme,
    rootPath: normalizeWorkspacePath(root?.rootPath ?? '/'),
    allowed: root?.allowed !== false,
    available: root?.available !== false,
  };
}

function listWorkspaceRepositoryRoots(options = {}) {
  const customRoots = (options.repositoryRoots ?? [])
    .map((root) => normalizeWorkspaceRepositoryRoot(root))
    .filter(Boolean);
  const defaults = createDefaultWorkspaceRepositoryRoots()
    .map((root) => normalizeWorkspaceRepositoryRoot(root))
    .filter(Boolean);
  return [...customRoots, ...defaults];
}

function findWorkspaceRepositoryRootByPath(path, roots) {
  const normalizedPath = normalizeWorkspacePath(path);
  return roots
    .filter((root) =>
      normalizedPath === root.rootPath
      || normalizedPath.startsWith(`${root.rootPath === '/' ? '' : root.rootPath}/`))
    .sort((left, right) => right.rootPath.length - left.rootPath.length)[0];
}

function findWorkspaceRepositoryRootByScheme(scheme, roots) {
  const normalizedScheme = String(scheme ?? '').trim().toLowerCase();
  if (!normalizedScheme) {
    return undefined;
  }

  return roots.find((root) =>
    root.scheme === normalizedScheme
    || String(root.providerId ?? '').trim().toLowerCase() === normalizedScheme);
}

function createResolvedWorkspaceRepositoryLocation(input) {
  const root = input.root;
  const allowed = input.allowed ?? root?.allowed ?? true;
  const available = input.available ?? root?.available ?? true;
  const status = input.status ?? (
    allowed === false
      ? 'unauthorized'
      : available === false
        ? 'unavailable'
        : 'resolved'
  );
  const resolvedPath = input.resolvedPath ? normalizeWorkspacePath(input.resolvedPath) : undefined;
  return {
    requestedLocation: input.requestedLocation,
    source: input.source,
    status,
    providerId: input.providerId ?? root?.providerId,
    rootId: input.rootId ?? root?.id,
    resolvedPath,
    resolvedLocation: input.resolvedLocation ?? resolvedPath,
    allowed,
    available,
  };
}

function resolveWorkspaceRepositoryAlias(location, options = {}, seen) {
  const aliases = options.repositoryAliases ?? {};
  const normalizedLocation = normalizeRepositoryLocationString(location);
  const aliasEntries = Object.entries(aliases)
    .filter(([alias]) =>
      normalizedLocation === normalizeRepositoryLocationString(alias)
      || normalizedLocation.startsWith(`${normalizeRepositoryLocationString(alias)}/`))
    .sort((left, right) => right[0].length - left[0].length);

  const [matchedAlias, matchedEntry] = aliasEntries[0] ?? [];
  if (!matchedAlias) {
    return undefined;
  }

  const aliasKey = normalizeRepositoryLocationString(matchedAlias);
  const suffix = normalizedLocation === aliasKey ? '' : normalizedLocation.slice(aliasKey.length + 1);
  const alias = typeof matchedEntry === 'string'
    ? { location: matchedEntry }
    : matchedEntry;
  const nextLocation = joinRepositoryLocation(alias.location, suffix);
  const aliasCycleKey = `alias:${aliasKey}:${nextLocation}`;
  if (seen.has(aliasCycleKey)) {
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation: normalizedLocation,
      source: 'alias',
      status: 'unsupported',
      allowed: false,
      available: false,
    });
  }

  seen.add(aliasCycleKey);
  const resolved = resolveWorkspaceRepositoryLocation(nextLocation, options, seen);
  return createResolvedWorkspaceRepositoryLocation({
    requestedLocation: normalizedLocation,
    source: 'alias',
    providerId: resolved.providerId,
    rootId: resolved.rootId,
    resolvedPath: resolved.resolvedPath,
    resolvedLocation: resolved.resolvedLocation,
    allowed: alias.allowed ?? resolved.allowed,
    available: alias.available ?? resolved.available,
  });
}

export function resolveWorkspaceRepositoryLocation(location, options = {}, seen = new Set()) {
  const requestedLocation = normalizeRepositoryLocationString(location);
  if (!requestedLocation) {
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'logical',
      status: 'unsupported',
      allowed: false,
      available: false,
    });
  }

  const aliasResolution = resolveWorkspaceRepositoryAlias(requestedLocation, options, seen);
  if (aliasResolution) {
    return aliasResolution;
  }

  const roots = listWorkspaceRepositoryRoots(options);
  if (looksLikeWorkspacePath(requestedLocation)) {
    const resolvedPath = normalizeWorkspacePath(requestedLocation);
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'workspace-path',
      root: findWorkspaceRepositoryRootByPath(resolvedPath, roots),
      resolvedPath,
    });
  }

  if (requestedLocation.startsWith('./') || requestedLocation.startsWith('../')) {
    const basePath = options.basePath;
    if (!looksLikeWorkspacePath(basePath)) {
      return createResolvedWorkspaceRepositoryLocation({
        requestedLocation,
        source: 'relative-path',
        status: 'unsupported',
        allowed: false,
        available: false,
      });
    }

    const resolvedPath = joinWorkspacePath(dirnameWorkspacePath(basePath), requestedLocation);
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'relative-path',
      root: findWorkspaceRepositoryRootByPath(resolvedPath, roots),
      resolvedPath,
    });
  }

  const uriMatch = requestedLocation.match(workspaceRepositoryUriPattern);
  if (uriMatch) {
    const scheme = uriMatch[1]?.trim().toLowerCase();
    const suffix = uriMatch[2] ?? '';
    const root = findWorkspaceRepositoryRootByScheme(scheme, roots);
    if (!root) {
      return createResolvedWorkspaceRepositoryLocation({
        requestedLocation,
        source: 'url',
        status: 'unsupported',
        allowed: false,
        available: false,
      });
    }

    const resolvedPath = suffix
      ? joinWorkspacePath(root.rootPath, suffix)
      : root.rootPath;
    return createResolvedWorkspaceRepositoryLocation({
      requestedLocation,
      source: 'scheme-root',
      root,
      resolvedPath,
    });
  }

  return createResolvedWorkspaceRepositoryLocation({
    requestedLocation,
    source: looksLikeUrl(requestedLocation) ? 'url' : 'logical',
    status: 'unsupported',
    allowed: false,
    available: false,
  });
}
