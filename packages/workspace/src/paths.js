export function createSequentialIdFactory(prefix = 'workspace-entry') {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

export function normalizeWorkspacePath(path) {
  const segments = path
    .replaceAll('\\', '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalized = [];
  for (const segment of segments) {
    if (segment === '.') {
      continue;
    }

    if (segment === '..') {
      normalized.pop();
      continue;
    }

    normalized.push(segment);
  }

  return `/${normalized.join('/')}`;
}

export function joinWorkspacePath(...parts) {
  return normalizeWorkspacePath(parts.filter(Boolean).join('/'));
}

export function dirnameWorkspacePath(path) {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === '/') {
    return '/';
  }

  const segments = normalized.split('/').filter(Boolean);
  segments.pop();
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

export function basenameWorkspacePath(path) {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === '/') {
    return '';
  }

  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}
