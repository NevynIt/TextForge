import {
  dirnameWorkspacePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
} from '@textforge/workspace';

import {
  defaultAutomationRoot,
  luaLanguageId,
} from './policy.js';

export function isLuaAutomationPath(path, automationRoot = defaultAutomationRoot) {
  const normalizedPath = normalizeWorkspacePath(path ?? '/');
  const normalizedRoot = normalizeWorkspacePath(automationRoot);
  return normalizedPath.toLowerCase().startsWith(`${normalizedRoot.toLowerCase()}/`)
    && normalizedPath.toLowerCase().endsWith('.lua');
}

export function isLuaResource(entry) {
  return entry?.kind === 'resource'
    && entry.representation === 'text'
    && String(entry.languageId ?? '').toLowerCase() === luaLanguageId;
}

export function createWorkspaceTextResourceIndex(workspaceInput) {
  const state = typeof workspaceInput?.snapshot === 'function'
    ? workspaceInput.snapshot()
    : workspaceInput;
  const resources = state?.resources ?? [];
  const byPath = new Map();
  const byId = new Map();
  for (const resource of resources) {
    if (resource?.kind !== 'resource' || resource.representation !== 'text' || !resource.path) {
      continue;
    }

    const normalizedPath = normalizeWorkspacePath(resource.path);
    byPath.set(normalizedPath, resource);
    if (resource.id) {
      byId.set(resource.id, resource);
    }
  }

  return {
    resources,
    byPath,
    byId,
  };
}

export function resolveLuaModuleCandidatePaths(scriptPath, moduleName, automationRoot = defaultAutomationRoot) {
  const normalizedScriptPath = normalizeWorkspacePath(scriptPath ?? '/');
  const relativeModulePath = String(moduleName ?? '')
    .trim()
    .replaceAll('.', '/')
    .replace(/^\/+/, '');
  if (!relativeModulePath) {
    return [];
  }

  const sameFolder = dirnameWorkspacePath(normalizedScriptPath);
  const moduleDirectory = relativeModulePath;
  const candidates = [
    joinWorkspacePath(sameFolder, `${moduleDirectory}.lua`),
    joinWorkspacePath(sameFolder, moduleDirectory, 'init.lua'),
    joinWorkspacePath('/lua', `${moduleDirectory}.lua`),
    joinWorkspacePath('/lua', moduleDirectory, 'init.lua'),
    joinWorkspacePath('/lib', `${moduleDirectory}.lua`),
    joinWorkspacePath('/lib', moduleDirectory, 'init.lua'),
    joinWorkspacePath(automationRoot, `${moduleDirectory}.lua`),
    joinWorkspacePath(automationRoot, moduleDirectory, 'init.lua'),
  ];

  return [...new Set(candidates.map((candidate) => normalizeWorkspacePath(candidate)))];
}

export function listLuaAutomationFiles(workspaceInput, options = {}) {
  const automationRoot = normalizeWorkspacePath(options.automationRoot ?? defaultAutomationRoot);
  const disabledPaths = new Set((options.disabledPaths ?? []).map((path) => normalizeWorkspacePath(path)));
  const { resources } = createWorkspaceTextResourceIndex(workspaceInput);
  return resources
    .filter((resource) => isLuaAutomationPath(resource.path, automationRoot))
    .map((resource) => ({
      id: resource.id,
      path: normalizeWorkspacePath(resource.path),
      enabled: !disabledPaths.has(normalizeWorkspacePath(resource.path)),
      source: resource.text ?? '',
      updatedAt: resource.metadata?.updatedAt,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}
