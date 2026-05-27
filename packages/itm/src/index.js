import { parse as parseYaml } from 'yaml';
import { StreamLanguage, foldService } from '@codemirror/language';

import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  deriveCapabilityLocalName,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
  matchesResourcePredicate,
} from '@textforge/core';
import {
  resolveWorkspaceRepositoryLocation,
} from '@textforge/workspace';

export * from './upstream/index.js';
import {
  composeDocumentResult,
  createCanonicalGraph,
  createDocument,
  createStdIncludeProvider,
  getStableRelationshipId,
  isEntityOfType,
  isResolvedDocument,
  parseDocument,
  parseDocumentResult,
  resolveDocument,
} from './upstream/index.js';

const itmDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
});
const markdownDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['markdown'],
  mimeTypes: ['text/markdown', 'text/x-markdown'],
  fileExtensions: ['md', 'markdown', 'tfmd'],
});

const itmPublicationDocumentStateKey = '@textforge/itm/publication-state';
const repositoryProtocolPattern = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u;
const windowsAbsolutePathPattern = /^[A-Za-z]:[\\/]/u;

export const itmCapabilities = [
  createCapability('@textforge/itm/capability/itm', {
    description: 'Parse ITM fenced blocks and expose semantic model diagnostics in Markdown documents.',
    aliases: ['itm'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm-pub', {
    description: 'Render publication and projection blocks over embedded ITM models.',
    aliases: ['itm-pub'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: markdownDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/view', {
    description: 'Open `.itm` resources through package-owned projection surfaces.',
    aliases: ['itm-view'],
    defaultActive: true,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.core', {
    description: 'Provide the core ITM directive, type, and document-model semantics.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.type-hierarchy', {
    description: 'Provide ITM type-hierarchy checks and selector expansion over entity and relationship types.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.relationship-identity', {
    description: 'Provide stable ITM relationship identity and source/target resolution checks.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.validation', {
    description: 'Provide built-in ITM validation-rule execution primitives.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.graph-model', {
    description: 'Provide canonical ITM graph projection providers for viewpoints and reports.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.viewpoint', {
    description: 'Provide viewpoint-stage layout, rendering, and report projection providers.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
  createCapability('@textforge/itm/capability/itm.roundtrip.meta', {
    description: 'Provide ITM round-trip metadata preservation helpers for imported or generated models.',
    defaultActive: false,
    scope: 'document',
    documentPredicate: itmDocumentPredicate,
  }),
];

export const itmResolverDiagnosticCodes = Object.freeze({
  unresolved: 'itm.resolve.unresolved',
  unsupported: 'itm.resolve.unsupported',
  unauthorized: 'itm.resolve.unauthorized',
  unavailable: 'itm.resolve.unavailable',
  conflictingAlias: 'itm.resolve.conflicting-alias',
  versionMismatch: 'itm.resolve.version-mismatch',
  capabilityMismatch: 'itm.resolve.capability-mismatch',
  blocked: 'itm.resolve.blocked',
  circular: 'itm.resolve.circular',
});

const itmPackageUsageScopes = new Set([
  'all',
  'types',
  'relationships',
  'styles',
  'rules',
  'viewpoints',
  'pipelines',
]);
const itmValidationDiagnosticCodes = Object.freeze({
  ruleFailed: 'itm.validation.rule-failed',
  providerUnavailable: 'itm.validation.provider-unavailable',
});
const itmBuiltinValidationCapabilityByProvider = Object.freeze({
  requireId: 'itm.validation',
  requireIdPattern: 'itm.validation',
  requireLabel: 'itm.validation',
  requireNonEmptyLabel: 'itm.validation',
  requireAttribute: 'itm.validation',
  requireOneOfAttributes: 'itm.validation',
  requireSourceType: 'itm.type-hierarchy',
  requireTargetType: 'itm.type-hierarchy',
  requireUniqueIdWithinNamespace: 'itm.type-hierarchy',
  requireKnownSource: 'itm.relationship-identity',
  requireSourceId: 'itm.relationship-identity',
  requireResolvedTarget: 'itm.relationship-identity',
  requireTargetResolved: 'itm.relationship-identity',
  requireRelationshipIdOrDeriveStableId: 'itm.relationship-identity',
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizeItmSeverity(severity) {
  switch (severity) {
    case 'error':
    case 'warning':
    case 'observation':
    case 'information':
      return severity;
    default:
      return 'warning';
  }
}

function createItmCoreDiagnostic(diagnostic, sourceResource, overrides = {}) {
  return createDiagnostic(diagnostic?.message ?? 'ITM diagnostic.', normalizeItmSeverity(diagnostic?.severity), {
    code: diagnostic?.code,
    resource: sourceResource,
    origin: {
      packageId: '@textforge/itm',
      subsystem: 'itm',
      ...overrides.origin,
    },
    ...overrides,
  });
}

function normalizeResolverCategory(category) {
  switch (category) {
    case 'unresolved':
    case 'unsupported':
    case 'unauthorized':
    case 'unavailable':
    case 'conflictingAlias':
    case 'versionMismatch':
    case 'capabilityMismatch':
    case 'blocked':
    case 'circular':
      return category;
    default:
      return 'unresolved';
  }
}

function defaultResolverSeverity(category) {
  switch (category) {
    case 'unresolved':
    case 'unsupported':
    case 'unavailable':
      return 'warning';
    default:
      return 'error';
  }
}

export function createItmResolverDiagnostic(category, message, options = {}) {
  const normalizedCategory = normalizeResolverCategory(category);
  return createDiagnostic(message, options.severity ?? defaultResolverSeverity(normalizedCategory), {
    code: options.code ?? itmResolverDiagnosticCodes[normalizedCategory],
    file: options.file,
    uri: options.uri,
    range: options.range,
    includeTarget: options.includeTarget,
    includeStack: options.includeStack,
    repositoryRef: options.repositoryRef,
    requirementRef: options.requirementRef,
    packageRef: options.packageRef,
    usingScope: options.usingScope,
    origin: {
      packageId: '@textforge/itm',
      subsystem: 'itm-resolver',
      category: normalizedCategory,
      ...options.origin,
    },
  });
}

function mergeDiagnostics(...diagnosticGroups) {
  const merged = [];
  const seen = new Set();
  for (const group of diagnosticGroups) {
    for (const diagnostic of group ?? []) {
      const key = [
        diagnostic?.severity,
        diagnostic?.code,
        diagnostic?.message,
        diagnostic?.file,
        diagnostic?.uri,
        diagnostic?.range?.startLine,
        diagnostic?.range?.startColumn,
      ].join('|');
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(diagnostic);
    }
  }
  return merged;
}

function looksLikeWorkspacePath(value) {
  return typeof value === 'string' && value.startsWith('/');
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

function resolveWorkspaceIncludeTarget(target, context = {}, options = {}) {
  const rawTarget = String(target ?? '').trim();
  if (rawTarget === '' || rawTarget.startsWith('std:') || rawTarget.startsWith('std://')) {
    return undefined;
  }
  const resolvedTarget = resolveWorkspaceRepositoryLocation(rawTarget, {
    basePath: options.basePath ?? context.sourceDocument?.uri,
    repositoryAliases: options.repositoryAliases,
    repositoryRoots: options.repositoryRoots,
  });
  return resolvedTarget.status === 'resolved'
    ? resolvedTarget.resolvedPath
    : undefined;
}

export function createWorkspaceItmIncludeProvider(workspace, options = {}) {
  return {
    name: options.name ?? 'workspace',
    load(target, context) {
      const resolvedPath = resolveWorkspaceIncludeTarget(target, context, options);
      if (!resolvedPath) {
        return undefined;
      }

      const entry = workspace?.getEntryByPath?.(resolvedPath);
      if (!entry || entry.kind !== 'resource' || entry.representation !== 'text') {
        return undefined;
      }

      return {
        text: entry.text,
        uri: entry.path ?? resolvedPath,
      };
    },
  };
}

export const createWorkspaceItmResolver = createWorkspaceItmIncludeProvider;

export async function loadItmDocument(source, options = {}) {
  const parseOptions = {
    strict: options.strict ?? false,
    uri: options.uri,
  };
  const parsed = parseDocumentResult(source, parseOptions);
  const includeProviders = [
    ...(options.includeProviders ?? []),
    ...(options.includeStdProfiles === false ? [] : [createStdIncludeProvider()]),
  ];
  let document = parsed.value;
  let diagnostics = [...parsed.diagnostics];

  if (includeProviders.length > 0 || options.sourceProvider) {
    const composed = await composeDocumentResult(document, {
      uri: options.uri,
      parseOptions,
      includeProviders,
      sourceProvider: options.sourceProvider,
      maxIncludeDepth: options.maxIncludeDepth,
    });
    document = composed.value;
    diagnostics = mergeDiagnostics(diagnostics, composed.diagnostics, document.diagnostics);
  }

  const evaluated = evaluateItmDocumentContext(document, options);
  diagnostics = mergeDiagnostics(
    diagnostics,
    document.diagnostics,
    evaluated.diagnostics,
  );

  return {
    document,
    resolvedDocument: evaluated.resolvedDocument,
    effectiveDocument: evaluated.effectiveDocument,
    effectiveResolvedDocument: evaluated.effectiveResolvedDocument,
    capabilityContext: evaluated.capabilityContext,
    diagnostics,
  };
}

function findConflictingRepositoryAliases(document) {
  const repositoriesByName = new Map();
  for (const repository of document.repositories ?? []) {
    if (!repositoriesByName.has(repository.name)) {
      repositoriesByName.set(repository.name, []);
    }
    repositoriesByName.get(repository.name).push(repository);
  }

  return [...repositoriesByName.entries()].filter(([, repositories]) => repositories.length > 1);
}

function resolveRepositoryStatus(repository, document, options = {}) {
  if (!repository?.location) {
    return {
      status: 'unsupported',
      allowed: false,
      available: false,
    };
  }

  return resolveWorkspaceRepositoryLocation(repository.location, {
    basePath: document.uri,
    repositoryAliases: options.repositoryAliases,
    repositoryRoots: options.repositoryRoots,
  });
}

function resolveIncludeTargetStatus(includeTarget, document, options = {}) {
  return resolveWorkspaceRepositoryLocation(includeTarget, {
    basePath: document.uri,
    repositoryAliases: options.repositoryAliases,
    repositoryRoots: options.repositoryRoots,
  });
}

function createIncludeResolutionDiagnostics(document, options = {}) {
  const diagnostics = [];
  const repositoriesByName = new Map((document.repositories ?? []).map((repository) => [repository.name, repository]));

  for (const [repositoryName, repositories] of findConflictingRepositoryAliases(document)) {
    diagnostics.push(createItmResolverDiagnostic(
      'conflictingAlias',
      `Repository alias '${repositoryName}' is declared multiple times.`,
      {
        repositoryRef: repositoryName,
        uri: document.uri,
        file: repositories[0]?.source?.file ?? document.uri,
        range: repositories[0]?.source,
      },
    ));
  }

  for (const include of document.includes ?? []) {
    const repositoryReference = splitRepositoryTarget(include.target);
    const repository = repositoryReference
      ? repositoriesByName.get(repositoryReference.repositoryName)
      : undefined;

    if (repositoryReference && !repository) {
      diagnostics.push(createItmResolverDiagnostic(
        'unsupported',
        `Repository alias '${repositoryReference.repositoryName}' is not declared for include target '${include.target}'.`,
        {
          includeTarget: include.target,
          repositoryRef: repositoryReference.repositoryName,
          uri: document.uri,
          file: include.source?.file ?? document.uri,
          range: include.source,
        },
      ));
      continue;
    }

    const repositoryStatus = repository
      ? resolveRepositoryStatus(repository, document, options)
      : resolveIncludeTargetStatus(include.target, document, options);

    if (repositoryStatus.status === 'unsupported') {
      diagnostics.push(createItmResolverDiagnostic(
        'unsupported',
        repository
          ? `Repository alias '${repository.name}' uses an unsupported location '${repository.location}' for include target '${include.target}'.`
          : `Include target '${include.target}' uses an unsupported repository or provider location in the active local resolver.`,
        {
          includeTarget: include.target,
          repositoryRef: repository?.name ?? repositoryReference?.repositoryName,
          uri: document.uri,
          file: include.source?.file ?? document.uri,
          range: include.source,
        },
      ));
      continue;
    }

    if (repository?.allowed === false || repositoryStatus.status === 'unauthorized') {
      diagnostics.push(createItmResolverDiagnostic(
        'unauthorized',
        `Repository alias '${repository.name}' is not authorized for include target '${include.target}'.`,
        {
          includeTarget: include.target,
          repositoryRef: repository.name,
          uri: document.uri,
          file: include.source?.file ?? document.uri,
          range: include.source,
        },
      ));
      continue;
    }

    if ((repository && repository.resolved === false) || repositoryStatus.status === 'unavailable') {
      diagnostics.push(createItmResolverDiagnostic(
        'unavailable',
        `Repository alias '${repository.name}' is currently unavailable for include target '${include.target}'.`,
        {
          includeTarget: include.target,
          repositoryRef: repository.name,
          uri: document.uri,
          file: include.source?.file ?? document.uri,
          range: include.source,
        },
      ));
      continue;
    }

    switch (include.status) {
      case 'unresolved':
        diagnostics.push(createItmResolverDiagnostic(
          'unresolved',
          `Include target '${include.target}' could not be resolved.`,
          {
            includeTarget: include.target,
            repositoryRef: repositoryReference?.repositoryName,
            uri: document.uri,
            file: include.source?.file ?? document.uri,
            range: include.source,
          },
        ));
        break;
      case 'missing':
        diagnostics.push(createItmResolverDiagnostic(
          'unavailable',
          `Include target '${include.target}' is unavailable.`,
          {
            includeTarget: include.target,
            repositoryRef: repositoryReference?.repositoryName,
            uri: document.uri,
            file: include.source?.file ?? document.uri,
            range: include.source,
          },
        ));
        break;
      case 'blocked':
        diagnostics.push(createItmResolverDiagnostic(
          'blocked',
          `Include target '${include.target}' was blocked by the active resolver.`,
          {
            includeTarget: include.target,
            repositoryRef: repositoryReference?.repositoryName,
            uri: document.uri,
            file: include.source?.file ?? document.uri,
            range: include.source,
          },
        ));
        break;
      case 'circular':
        diagnostics.push(createItmResolverDiagnostic(
          'circular',
          `Include target '${include.target}' is part of a circular resolution chain.`,
          {
            includeTarget: include.target,
            repositoryRef: repositoryReference?.repositoryName,
            uri: document.uri,
            file: include.source?.file ?? document.uri,
            range: include.source,
          },
        ));
        break;
      default:
        break;
    }
  }

  return diagnostics;
}

function getEntrySourceRange(entry) {
  return entry?.sourceRange ?? entry?.source;
}

function getEntrySourceFile(entry, fallbackFile) {
  return getEntrySourceRange(entry)?.file ?? fallbackFile;
}

function compareSourcePositions(left, right) {
  const leftRange = left?.startLine !== undefined ? left : getEntrySourceRange(left);
  const rightRange = right?.startLine !== undefined ? right : getEntrySourceRange(right);
  const leftLine = leftRange?.startLine ?? 0;
  const rightLine = rightRange?.startLine ?? 0;
  if (leftLine !== rightLine) {
    return leftLine - rightLine;
  }
  const leftColumn = leftRange?.startColumn ?? 0;
  const rightColumn = rightRange?.startColumn ?? 0;
  if (leftColumn !== rightColumn) {
    return leftColumn - rightColumn;
  }
  return (leftRange?.startOffset ?? 0) - (rightRange?.startOffset ?? 0);
}

function normalizePackageScope(scope) {
  switch (String(scope ?? '').trim().toLowerCase()) {
    case '':
    case 'all':
      return 'all';
    case 'type':
    case 'types':
    case 'namespace':
    case 'namespaces':
      return 'types';
    case 'relationship':
    case 'relationships':
      return 'relationships';
    case 'style':
    case 'styles':
      return 'styles';
    case 'rule':
    case 'rules':
      return 'rules';
    case 'viewpoint':
    case 'viewpoints':
      return 'viewpoints';
    case 'pipeline':
    case 'pipelines':
      return 'pipelines';
    default:
      return undefined;
  }
}

function listPackageContentScopes(packageContent = {}) {
  const scopes = new Set();
  if ((packageContent.namespaces?.length ?? 0) > 0 || (packageContent.entityTypes?.length ?? 0) > 0) {
    scopes.add('types');
  }
  if ((packageContent.relationshipTypes?.length ?? 0) > 0) {
    scopes.add('types');
    scopes.add('relationships');
  }
  if ((packageContent.validationRules?.length ?? 0) > 0) {
    scopes.add('rules');
  }
  if ((packageContent.styles?.length ?? 0) > 0) {
    scopes.add('styles');
  }
  if ((packageContent.viewpoints?.length ?? 0) > 0) {
    scopes.add('viewpoints');
  }
  if ((packageContent.pipelines?.length ?? 0) > 0) {
    scopes.add('pipelines');
  }
  if (
    scopes.size > 0
    || (packageContent.referenceEntities?.length ?? 0) > 0
    || (packageContent.referenceRelationships?.length ?? 0) > 0
  ) {
    scopes.add('all');
  }
  return scopes;
}

function scopeActivatesPackageCategory(activeScopes, category) {
  if (!activeScopes || activeScopes.size === 0) {
    return false;
  }
  if (activeScopes.has('all')) {
    return true;
  }
  switch (category) {
    case 'namespaces':
    case 'entityTypes':
      return activeScopes.has('types');
    case 'relationshipTypes':
      return activeScopes.has('types') || activeScopes.has('relationships');
    case 'validationRules':
      return activeScopes.has('rules');
    case 'styles':
      return activeScopes.has('styles');
    case 'viewpoints':
      return activeScopes.has('viewpoints');
    case 'pipelines':
      return activeScopes.has('pipelines');
    default:
      return false;
  }
}

function parseVersionParts(version) {
  const normalizedVersion = String(version ?? '').trim();
  if (!normalizedVersion) {
    return undefined;
  }
  const parts = normalizedVersion.split('.');
  if (parts.some((part) => !/^\d+$/u.test(part))) {
    return undefined;
  }
  return parts.map((part) => Number(part));
}

function compareVersionParts(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function isVersionRangeSatisfied(version, versionRange) {
  const normalizedRange = String(versionRange ?? '').trim();
  if (!normalizedRange || normalizedRange === '*') {
    return true;
  }

  const normalizedVersion = String(version ?? '').trim();
  if (!normalizedVersion) {
    return true;
  }

  const comparisonOperators = ['>=', '<=', '>', '<'];
  for (const operator of comparisonOperators) {
    if (!normalizedRange.startsWith(operator)) {
      continue;
    }

    const parsedVersion = parseVersionParts(normalizedVersion);
    const parsedExpected = parseVersionParts(normalizedRange.slice(operator.length));
    if (!parsedVersion || !parsedExpected) {
      return normalizedVersion === normalizedRange.slice(operator.length).trim();
    }

    const comparison = compareVersionParts(parsedVersion, parsedExpected);
    if (operator === '>=') {
      return comparison >= 0;
    }
    if (operator === '<=') {
      return comparison <= 0;
    }
    if (operator === '>') {
      return comparison > 0;
    }
    return comparison < 0;
  }

  const rangePrefix = normalizedRange[0];
  const parsedVersion = parseVersionParts(normalizedVersion);
  const parsedExpected = parseVersionParts(rangePrefix === '^' || rangePrefix === '~'
    ? normalizedRange.slice(1)
    : normalizedRange);
  if (!parsedVersion || !parsedExpected) {
    return normalizedVersion === normalizedRange;
  }

  if (rangePrefix === '^') {
    return parsedVersion[0] === parsedExpected[0]
      && compareVersionParts(parsedVersion, parsedExpected) >= 0;
  }

  if (rangePrefix === '~') {
    return parsedVersion[0] === parsedExpected[0]
      && parsedVersion[1] === parsedExpected[1]
      && compareVersionParts(parsedVersion, parsedExpected) >= 0;
  }

  return compareVersionParts(parsedVersion, parsedExpected) === 0;
}

function listCapabilityLookupNames(capability) {
  return [
    capability?.id,
    capability?.localName,
    deriveCapabilityLocalName(capability?.id),
    ...(capability?.aliases ?? []),
  ]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean);
}

function findCapabilityMatches(capabilities, identifier) {
  const normalizedIdentifier = String(identifier ?? '').trim().toLowerCase();
  if (!normalizedIdentifier) {
    return [];
  }
  return capabilities.filter((capability) =>
    listCapabilityLookupNames(capability).includes(normalizedIdentifier));
}

function createFallbackCapabilityContext(document, options = {}) {
  const documentResource = {
    kind: 'resource',
    representation: 'text',
    path: options.documentResource?.path ?? document.uri,
    languageId: options.documentResource?.languageId ?? 'itm',
    mimeType: options.documentResource?.mimeType ?? 'text/x-itm',
    ...(options.documentResource ?? {}),
  };
  const capabilities = itmCapabilities.map((capability) => ({
    ...capability,
    packageId: '@textforge/itm',
    status: 'available',
  }));
  const activeById = new Map();
  const diagnostics = [];
  const requirements = [];
  const packageVersionById = new Map([['@textforge/itm', contributions.version]]);

  for (const requirement of document.pluginRequirements ?? []) {
    const identifier = requirement.name;
    const matches = findCapabilityMatches(capabilities, identifier);
    if (matches.length === 0) {
      diagnostics.push(createItmResolverDiagnostic(
        'capabilityMismatch',
        `Required capability '${identifier}' is not available in the active ITM host context.`,
        {
          requirementRef: identifier,
          file: requirement.source?.file ?? document.uri,
          uri: document.uri,
          range: requirement.source,
          severity: 'warning',
          origin: {
            directive: 'require',
          },
        },
      ));
      requirements.push({
        name: requirement.name,
        versionRange: requirement.versionRange,
        source: 'document',
        matchedCapabilityId: undefined,
        status: 'missing',
      });
      continue;
    }

    if (matches.length > 1) {
      diagnostics.push(createItmResolverDiagnostic(
        'conflictingAlias',
        `Required capability '${identifier}' matches multiple active ITM capabilities.`,
        {
          requirementRef: identifier,
          file: requirement.source?.file ?? document.uri,
          uri: document.uri,
          range: requirement.source,
          origin: {
            directive: 'require',
          },
        },
      ));
      requirements.push({
        name: requirement.name,
        versionRange: requirement.versionRange,
        source: 'document',
        matchedCapabilityId: undefined,
        status: 'ambiguous',
      });
      continue;
    }

    const match = matches[0];
    const packageVersion = packageVersionById.get(match.packageId);
    if (requirement.versionRange && !isVersionRangeSatisfied(packageVersion, requirement.versionRange)) {
      diagnostics.push(createItmResolverDiagnostic(
        'versionMismatch',
        `Required capability '${identifier}' does not satisfy version range '${requirement.versionRange}'.`,
        {
          requirementRef: identifier,
          file: requirement.source?.file ?? document.uri,
          uri: document.uri,
          range: requirement.source,
          origin: {
            directive: 'require',
          },
        },
      ));
      requirements.push({
        name: requirement.name,
        versionRange: requirement.versionRange,
        source: 'document',
        matchedCapabilityId: match.id,
        status: 'available',
      });
      continue;
    }

    activeById.set(match.id, {
      ...match,
      status: 'active',
    });
    requirements.push({
      name: requirement.name,
      versionRange: requirement.versionRange,
      source: 'document',
      matchedCapabilityId: match.id,
      status: 'active',
    });
  }

  for (const capability of capabilities) {
    if (
      capability.defaultActive === true
      && matchesResourcePredicate(capability.documentPredicate ?? {}, documentResource)
      && !activeById.has(capability.id)
    ) {
      activeById.set(capability.id, {
        ...capability,
        status: 'active',
      });
    }
  }

  return {
    document: documentResource,
    packages: [{
      packageId: '@textforge/itm',
      version: contributions.version,
      status: 'available',
    }],
    capabilities,
    activeCapabilities: [...activeById.values()],
    diagnostics,
    requirements,
    activeCapabilityIds: [...activeById.keys()],
  };
}

function resolveItmCapabilityContext(document, options = {}) {
  if (options.capabilityContext) {
    return options.capabilityContext;
  }

  if (options.contributionRegistry?.resolveDocumentContext) {
    return options.contributionRegistry.resolveDocumentContext({
      document: {
        kind: 'resource',
        representation: 'text',
        path: options.documentResource?.path ?? document.uri,
        languageId: options.documentResource?.languageId ?? 'itm',
        mimeType: options.documentResource?.mimeType ?? 'text/x-itm',
        ...(options.documentResource ?? {}),
      },
      explicitRequirements: (document.pluginRequirements ?? []).map((requirement) => ({
        name: requirement.name,
        versionRange: requirement.versionRange,
        source: 'document',
      })),
    });
  }

  return createFallbackCapabilityContext(document, options);
}

function createPackageOwnershipIndex(document) {
  const packages = [...(document.packages ?? [])].sort(compareSourcePositions);
  const packagesByFile = new Map();
  const packagesByName = new Map();
  for (const pkg of packages) {
    const file = getEntrySourceFile(pkg, document.uri) ?? '__root__';
    const byFile = packagesByFile.get(file) ?? [];
    byFile.push(pkg);
    packagesByFile.set(file, byFile);

    const byName = packagesByName.get(pkg.name) ?? [];
    byName.push(pkg);
    packagesByName.set(pkg.name, byName);
  }
  return {
    packages,
    packagesByFile,
    packagesByName,
  };
}

function findOwningPackage(entry, ownershipIndex, document) {
  const range = getEntrySourceRange(entry);
  if (!range) {
    return undefined;
  }
  const file = getEntrySourceFile(entry, document.uri) ?? '__root__';
  const packages = ownershipIndex.packagesByFile.get(file) ?? [];
  let owner;
  for (const candidate of packages) {
    if (compareSourcePositions(candidate, range) <= 0) {
      owner = candidate;
      continue;
    }
    break;
  }
  return owner;
}

function materializePackageContent(document, ownershipIndex) {
  const contentByUid = new Map((document.packages ?? []).map((pkg) => [pkg.uid, {
    namespaces: [],
    entityTypes: [],
    relationshipTypes: [],
    validationRules: [],
    styles: [],
    viewpoints: [],
    referenceEntities: [],
    referenceRelationships: [],
    pluginRequirements: [],
    pipelines: [],
  }]));

  function assign(entries, key) {
    for (const entry of entries ?? []) {
      const owner = findOwningPackage(entry, ownershipIndex, document);
      if (!owner) {
        continue;
      }
      contentByUid.get(owner.uid)?.[key]?.push(entry);
    }
  }

  assign(document.namespaces, 'namespaces');
  assign(document.entityTypes, 'entityTypes');
  assign(document.relationshipTypes, 'relationshipTypes');
  assign(document.validationRules, 'validationRules');
  assign(document.styles, 'styles');
  assign(document.viewpoints, 'viewpoints');
  assign(document.entities, 'referenceEntities');
  assign(document.relationships, 'referenceRelationships');
  assign(document.pluginRequirements, 'pluginRequirements');

  return contentByUid;
}

function readPackageActivationScopes(pkg, packageContent = {}) {
  const configured = Array.isArray(pkg?.attributes?.values?.activation)
    ? pkg.attributes.values.activation
    : typeof pkg?.attributes?.values?.activation === 'string'
      ? [pkg.attributes.values.activation]
      : [];
  const scopes = [];
  for (const entry of configured) {
    const normalized = String(entry ?? '').trim();
    if (!normalized) {
      continue;
    }
    if (normalized === pkg.name || normalized === `${pkg.name}.all`) {
      scopes.push('all');
      continue;
    }
    if (normalized.startsWith(`${pkg.name}.`)) {
      const normalizedScope = normalizePackageScope(normalized.slice(pkg.name.length + 1));
      if (normalizedScope) {
        scopes.push(normalizedScope);
      }
      continue;
    }
    const normalizedScope = normalizePackageScope(normalized);
    if (normalizedScope) {
      scopes.push(normalizedScope);
    }
  }
  if (scopes.length > 0) {
    return [...new Set(scopes)];
  }
  return [...listPackageContentScopes(packageContent)].filter((scope) => scope !== 'all');
}

function normalizePackageUsageEntry(usage, ownershipIndex) {
  const rawReference = String(usage?.packageRef ?? '').trim();
  if (!rawReference) {
    return {
      ...usage,
      packageRef: '',
      scope: 'all',
      packageUid: undefined,
    };
  }

  const exactMatches = ownershipIndex.packagesByName.get(rawReference);
  if (exactMatches?.length) {
    return {
      ...usage,
      packageRef: rawReference,
      scope: 'all',
      packageUid: exactMatches[0]?.uid,
    };
  }

  const separatorIndex = rawReference.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return {
      ...usage,
      packageRef: rawReference,
      scope: 'all',
      packageUid: ownershipIndex.packagesByName.get(rawReference)?.[0]?.uid,
    };
  }

  const packageRef = rawReference.slice(0, separatorIndex);
  const normalizedScope = normalizePackageScope(rawReference.slice(separatorIndex + 1));
  return {
    ...usage,
    packageRef,
    scope: normalizedScope ?? rawReference.slice(separatorIndex + 1),
    packageUid: ownershipIndex.packagesByName.get(packageRef)?.[0]?.uid,
  };
}

function buildEffectiveItmDocument(document) {
  const ownershipIndex = createPackageOwnershipIndex(document);
  const packageContentByUid = materializePackageContent(document, ownershipIndex);
  const packageDiagnostics = [];
  const activePackageScopes = new Map();

  for (const [packageName, packages] of ownershipIndex.packagesByName.entries()) {
    if (packages.length <= 1) {
      continue;
    }
    const primary = packages[0];
    packageDiagnostics.push(createItmResolverDiagnostic(
      'conflictingAlias',
      `Package '${packageName}' is declared multiple times across the effective ITM document.`,
      {
        packageRef: packageName,
        uri: document.uri,
        file: getEntrySourceFile(primary, document.uri),
        range: getEntrySourceRange(primary),
      },
    ));
  }

  const normalizedPackageUsages = (document.packageUsages ?? []).map((usage) =>
    normalizePackageUsageEntry(usage, ownershipIndex));

  for (const usage of normalizedPackageUsages) {
    const packageMatches = ownershipIndex.packagesByName.get(usage.packageRef) ?? [];
    if (packageMatches.length === 0) {
      packageDiagnostics.push(createItmResolverDiagnostic(
        'unresolved',
        `Package '${usage.packageRef}' is not available for %using.`,
        {
          packageRef: usage.packageRef,
          usingScope: usage.scope,
          uri: document.uri,
          file: usage.source?.file ?? document.uri,
          range: usage.source,
        },
      ));
      continue;
    }

    if (packageMatches.length > 1) {
      packageDiagnostics.push(createItmResolverDiagnostic(
        'conflictingAlias',
        `Package '${usage.packageRef}' is ambiguous across multiple package declarations.`,
        {
          packageRef: usage.packageRef,
          usingScope: usage.scope,
          uri: document.uri,
          file: usage.source?.file ?? document.uri,
          range: usage.source,
        },
      ));
      continue;
    }

    const pkg = packageMatches[0];
    const packageContent = packageContentByUid.get(pkg.uid) ?? {};
    const availableScopes = listPackageContentScopes(packageContent);
    const requestedScope = normalizePackageScope(usage.scope) ?? usage.scope;
    const scopesToActivate = requestedScope === 'all'
      ? readPackageActivationScopes(pkg, packageContent)
      : [requestedScope];
    const activeScopes = activePackageScopes.get(pkg.uid) ?? new Set();

    for (const scope of scopesToActivate) {
      if (!itmPackageUsageScopes.has(scope) || (scope !== 'all' && !availableScopes.has(scope))) {
        packageDiagnostics.push(createItmResolverDiagnostic(
          'unsupported',
          `Package '${pkg.name}' does not expose a '${scope}' scope for %using.`,
          {
            packageRef: pkg.name,
            usingScope: scope,
            uri: document.uri,
            file: usage.source?.file ?? document.uri,
            range: usage.source,
          },
        ));
        continue;
      }
      activeScopes.add(scope);
    }

    if (activeScopes.size > 0) {
      activePackageScopes.set(pkg.uid, activeScopes);
    }
  }

  const materializedPackages = (document.packages ?? []).map((pkg) => ({
    ...pkg,
    ...packageContentByUid.get(pkg.uid),
  }));

  function filterEntries(entries, category) {
    return (entries ?? []).filter((entry) => {
      const owner = findOwningPackage(entry, ownershipIndex, document);
      if (!owner) {
        return true;
      }
      return scopeActivatesPackageCategory(activePackageScopes.get(owner.uid), category);
    });
  }

  const effectiveDocument = createDocument({
    ...document,
    namespaces: filterEntries(document.namespaces, 'namespaces'),
    entityTypes: filterEntries(document.entityTypes, 'entityTypes'),
    relationshipTypes: filterEntries(document.relationshipTypes, 'relationshipTypes'),
    validationRules: filterEntries(document.validationRules, 'validationRules'),
    styles: filterEntries(document.styles, 'styles'),
    viewpoints: filterEntries(document.viewpoints, 'viewpoints'),
    entities: filterEntries(document.entities, 'referenceEntities'),
    relationships: filterEntries(document.relationships, 'referenceRelationships'),
    packages: materializedPackages,
    packageUsages: normalizedPackageUsages,
    diagnostics: mergeDiagnostics(document.diagnostics, packageDiagnostics),
  });

  return {
    effectiveDocument,
    packageDiagnostics,
    activePackageScopes,
  };
}

function normalizePipelineProviderStep(step) {
  if (step?.operation === 'plugin') {
    const rawProvider = String(step.provider ?? '').trim();
    const separatorIndex = rawProvider.indexOf(':');
    if (separatorIndex > 0) {
      const provider = rawProvider.slice(0, separatorIndex).trim();
      const rawValue = rawProvider.slice(separatorIndex + 1).trim();
      return {
        provider,
        arguments: {
          value: rawValue,
        },
      };
    }
    return {
      provider: rawProvider,
      arguments: step.arguments ?? {},
    };
  }

  return {
    provider: step?.operation,
    arguments: step?.arguments ?? {},
  };
}

function describeValidationCandidate(candidate) {
  if (candidate.kind === 'relationship') {
    return candidate.value.id
      ?? getStableRelationshipId(candidate.value)
      ?? candidate.value.uid;
  }
  return candidate.value.qualifiedId
    ?? candidate.value.id
    ?? candidate.value.label
    ?? candidate.value.uid;
}

function createRuleFailureDiagnostic(rule, candidate, message, detail, options = {}) {
  const subject = describeValidationCandidate(candidate);
  const suffix = subject ? ` Affected item: ${subject}.` : '';
  return createDiagnostic(
    `${message ?? detail}${suffix}`,
    rule.severity ?? 'warning',
    {
      code: options.code ?? itmValidationDiagnosticCodes.ruleFailed,
      uri: options.uri,
      file: getEntrySourceFile(candidate.value, options.uri),
      range: getEntrySourceRange(candidate.value) ?? rule.sourceRange,
      entityUid: candidate.kind === 'node' ? candidate.value.uid : undefined,
      relationshipUid: candidate.kind === 'relationship' ? candidate.value.uid : undefined,
      ruleUid: rule.uid,
      origin: {
        packageId: '@textforge/itm',
        subsystem: 'itm-validation',
        provider: options.provider,
      },
    },
  );
}

function listActiveCapabilityNames(capabilityContext) {
  const names = new Set();
  for (const capability of capabilityContext?.activeCapabilities ?? []) {
    for (const name of listCapabilityLookupNames(capability)) {
      names.add(name);
    }
  }
  return names;
}

function findCapabilityRequirementMatch(capabilityContext, identifier, options = {}) {
  const normalizedIdentifier = String(identifier ?? '').trim().toLowerCase();
  if (!normalizedIdentifier) {
    return undefined;
  }
  const capabilities = capabilityContext?.activeCapabilities ?? [];
  return capabilities.find((capability) =>
    listCapabilityLookupNames(capability).some((name) =>
      name === normalizedIdentifier
      || (options.allowPrefixMatch === true && normalizedIdentifier.startsWith(`${name}.`))));
}

function resolvePipelineProviderReference(step, document, activeRuleNames = new Set()) {
  if (!step) {
    return undefined;
  }
  if (step.operation === 'select' || step.operation === 'includeEdges' || step.operation === 'exclude') {
    return undefined;
  }

  if (step.operation === 'validate') {
    const validationRef = typeof step.arguments?.value === 'string'
      ? step.arguments.value
      : undefined;
    if (!validationRef || activeRuleNames.has(validationRef)) {
      return undefined;
    }
    return validationRef;
  }

  if (step.operation === 'plugin') {
    return normalizePipelineProviderStep(step).provider;
  }

  return typeof step.arguments?.value === 'string'
    ? step.arguments.value
    : undefined;
}

function buildUniqueEntityIdCounts(document) {
  const counts = new Map();
  for (const entity of document.entities ?? []) {
    const identifier = entity.qualifiedId ?? entity.id;
    if (!identifier) {
      continue;
    }
    counts.set(identifier, (counts.get(identifier) ?? 0) + 1);
  }
  return counts;
}

function hasAttributeValue(candidate, attributeName) {
  const value = candidate?.attributes?.values?.[attributeName];
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function executeBuiltinValidationStep(step, rule, candidate, document, context) {
  const normalizedStep = normalizePipelineProviderStep(step);
  const provider = normalizedStep.provider;
  const value = normalizedStep.arguments?.value;
  const candidateValue = candidate.value;

  switch (provider) {
    case 'requireId':
      return candidateValue.id
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, 'An id is required for this rule.', {
          uri: document.uri,
          provider,
        });
    case 'requireIdPattern': {
      if (!candidateValue.id) {
        return createRuleFailureDiagnostic(rule, candidate, rule.message, 'An id is required before pattern validation can pass.', {
          uri: document.uri,
          provider,
        });
      }
      try {
        const pattern = new RegExp(String(value ?? ''));
        return pattern.test(candidateValue.id)
          ? undefined
          : createRuleFailureDiagnostic(rule, candidate, rule.message, `Id '${candidateValue.id}' does not satisfy the configured pattern.`, {
            uri: document.uri,
            provider,
          });
      } catch {
        return createRuleFailureDiagnostic(rule, candidate, 'The validation rule uses an invalid id pattern.', 'The validation rule uses an invalid id pattern.', {
          uri: document.uri,
          provider,
        });
      }
    }
    case 'requireLabel':
    case 'requireNonEmptyLabel':
      return String(candidateValue.label ?? '').trim()
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, 'A non-empty label is required for this rule.', {
          uri: document.uri,
          provider,
        });
    case 'requireKnownSource':
    case 'requireSourceId':
      if (candidate.kind !== 'relationship') {
        return undefined;
      }
      return candidateValue.source
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, 'The relationship source must resolve for this rule.', {
          uri: document.uri,
          provider,
        });
    case 'requireResolvedTarget':
    case 'requireTargetResolved':
      if (candidate.kind !== 'relationship') {
        return undefined;
      }
      return candidateValue.target
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, 'The relationship target must resolve for this rule.', {
          uri: document.uri,
          provider,
        });
    case 'requireRelationshipIdOrDeriveStableId':
      if (candidate.kind !== 'relationship') {
        return undefined;
      }
      return candidateValue.id || getStableRelationshipId(candidateValue)
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, 'The relationship must expose or derive a stable id.', {
          uri: document.uri,
          provider,
        });
    case 'requireSourceType':
      if (candidate.kind !== 'relationship' || !candidateValue.source || typeof value !== 'string') {
        return undefined;
      }
      return isEntityOfType(document, candidateValue.source, value, true)
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, `The relationship source must be of type '${value}'.`, {
          uri: document.uri,
          provider,
        });
    case 'requireTargetType':
      if (candidate.kind !== 'relationship' || !candidateValue.target || typeof value !== 'string') {
        return undefined;
      }
      return isEntityOfType(document, candidateValue.target, value, true)
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, `The relationship target must be of type '${value}'.`, {
          uri: document.uri,
          provider,
        });
    case 'requireAttribute':
      return typeof value === 'string' && hasAttributeValue(candidateValue, value)
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, `Attribute '${value}' is required for this rule.`, {
          uri: document.uri,
          provider,
        });
    case 'requireOneOfAttributes': {
      const requiredAttributes = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? [value]
          : [];
      return requiredAttributes.some((attributeName) => hasAttributeValue(candidateValue, attributeName))
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, 'At least one of the configured attributes is required for this rule.', {
          uri: document.uri,
          provider,
        });
    }
    case 'requireUniqueIdWithinNamespace': {
      if (candidate.kind !== 'node' || !candidateValue.id) {
        return undefined;
      }
      const identifier = candidateValue.qualifiedId ?? candidateValue.id;
      return (context.uniqueEntityIds.get(identifier) ?? 0) <= 1
        ? undefined
        : createRuleFailureDiagnostic(rule, candidate, rule.message, `Id '${identifier}' must be unique within the effective document namespace set.`, {
          uri: document.uri,
          provider,
        });
    }
    default:
      return undefined;
  }
}

function collectValidationCandidates(document, selector) {
  const candidates = [];
  for (const entity of document.entities ?? []) {
    if (matchesSelector(selector, { kind: 'node', value: entity })) {
      candidates.push({ kind: 'node', value: entity });
    }
  }
  for (const relationship of document.relationships ?? []) {
    if (matchesSelector(selector, { kind: 'relationship', value: relationship })) {
      candidates.push({ kind: 'relationship', value: relationship });
    }
  }
  return candidates;
}

function createValidationProviderDiagnostic(owner, step, providerName, capabilityName, document) {
  return createItmResolverDiagnostic(
    'capabilityMismatch',
    `Validation/provider step '${providerName}' requires capability '${capabilityName}', but that capability is not active for this ITM document.`,
    {
      requirementRef: capabilityName,
      uri: document.uri,
      file: step?.source?.file ?? getEntrySourceFile(owner, document.uri),
      range: step?.source ?? getEntrySourceRange(owner),
      code: itmValidationDiagnosticCodes.providerUnavailable,
      origin: {
        subsystem: 'itm-validation',
        provider: providerName,
      },
    },
  );
}

function evaluateItmDocumentContext(input, options = {}) {
  const document = isResolvedDocument(input) ? createDocument(input) : input;
  const resolvedDocument = isResolvedDocument(input) ? input : resolveDocument(document);
  const effective = buildEffectiveItmDocument(document);
  const capabilityContext = resolveItmCapabilityContext(effective.effectiveDocument, options);
  const effectiveResolvedDocument = resolveDocument(effective.effectiveDocument);
  const diagnostics = [
    ...(resolvedDocument.diagnostics ?? []),
    ...effective.packageDiagnostics,
    ...(capabilityContext.diagnostics ?? []),
  ];
  const activeRuleNames = new Set((effectiveResolvedDocument.validationRules ?? []).map((rule) => rule.name));
  const uniqueEntityIds = buildUniqueEntityIdCounts(effectiveResolvedDocument);
  const validationContext = {
    uniqueEntityIds,
  };

  for (const rule of effectiveResolvedDocument.validationRules ?? []) {
    if (rule.enabled === false) {
      continue;
    }
    const candidates = collectValidationCandidates(effectiveResolvedDocument, rule.selector?.raw);
    for (const step of rule.pipeline?.steps ?? []) {
      const { provider } = normalizePipelineProviderStep(step);
      const requiredCapabilityName = itmBuiltinValidationCapabilityByProvider[provider] ?? provider;
      if (!findCapabilityRequirementMatch(capabilityContext, requiredCapabilityName, {
        allowPrefixMatch: !itmBuiltinValidationCapabilityByProvider[provider],
      })) {
        diagnostics.push(createValidationProviderDiagnostic(rule, step, provider, requiredCapabilityName, effectiveResolvedDocument));
        continue;
      }
      for (const candidate of candidates) {
        const failure = executeBuiltinValidationStep(step, rule, candidate, effectiveResolvedDocument, validationContext);
        if (failure) {
          diagnostics.push(failure);
        }
      }
    }
  }

  for (const viewpoint of effectiveResolvedDocument.viewpoints ?? []) {
    for (const step of viewpoint.pipeline?.steps ?? []) {
      const providerName = resolvePipelineProviderReference(step, effectiveResolvedDocument, activeRuleNames);
      if (!providerName) {
        continue;
      }
      const requiredCapabilityName = itmBuiltinValidationCapabilityByProvider[providerName] ?? providerName;
      if (findCapabilityRequirementMatch(capabilityContext, requiredCapabilityName, {
        allowPrefixMatch: !itmBuiltinValidationCapabilityByProvider[providerName],
      })) {
        continue;
      }
      diagnostics.push(createValidationProviderDiagnostic(viewpoint, step, providerName, requiredCapabilityName, effectiveResolvedDocument));
    }
  }

  return {
    document,
    resolvedDocument,
    effectiveDocument: effective.effectiveDocument,
    effectiveResolvedDocument,
    capabilityContext,
    diagnostics: mergeDiagnostics(
      diagnostics,
      createIncludeResolutionDiagnostics(effectiveResolvedDocument, options.repositoryResolution),
    ),
  };
}

export function validateItmDocument(document, options = {}) {
  return evaluateItmDocumentContext(document, options).diagnostics;
}

function parseSelectorExpression(selector) {
  const source = String(selector ?? '').trim();
  if (!source) {
    return undefined;
  }

  const tokens = [];
  let index = 0;

  function readBalanced(open, close) {
    let depth = 0;
    const start = index;
    while (index < source.length) {
      const character = source[index];
      if (character === open) {
        depth += 1;
      } else if (character === close) {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          return source.slice(start, index);
        }
      }
      index += 1;
    }
    return source.slice(start);
  }

  while (index < source.length) {
    const character = source[index];
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (character === '(' || character === ')' || character === ',') {
      tokens.push({ type: character, value: character });
      index += 1;
      continue;
    }

    if (source.startsWith('=>', index) || source.startsWith('~>', index)) {
      tokens.push({ type: 'selector', value: source.slice(index, index + 2) });
      index += 2;
      continue;
    }

    if (character === '[') {
      tokens.push({ type: 'selector', value: readBalanced('[', ']') });
      continue;
    }

    if (character === '{') {
      tokens.push({ type: 'selector', value: readBalanced('{', '}') });
      continue;
    }

    if (character === '&' || character === '#' || character === '@' || character === '*' || character === '%') {
      const start = index;
      index += 1;
      while (index < source.length && !/[\s(),]/u.test(source[index])) {
        index += 1;
      }
      tokens.push({ type: 'selector', value: source.slice(start, index) });
      continue;
    }

    const wordMatch = source.slice(index).match(/^[A-Za-z_][A-Za-z0-9_.-]*/u);
    if (!wordMatch) {
      tokens.push({ type: 'selector', value: source[index] });
      index += 1;
      continue;
    }

    const word = wordMatch[0];
    index += word.length;
    if (source[index] === '(') {
      tokens.push({ type: 'function', value: word.toUpperCase() });
      continue;
    }

    const upperWord = word.toUpperCase();
    if (upperWord === 'AND' || upperWord === 'OR' || upperWord === 'XOR' || upperWord === 'NOT') {
      tokens.push({ type: 'operator', value: upperWord });
    } else {
      tokens.push({ type: 'selector', value: word });
    }
  }

  let tokenIndex = 0;

  function peek() {
    return tokens[tokenIndex];
  }

  function consume(expectedType, expectedValue) {
    const token = tokens[tokenIndex];
    if (!token || token.type !== expectedType || (expectedValue && token.value !== expectedValue)) {
      return undefined;
    }
    tokenIndex += 1;
    return token;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) {
      return undefined;
    }

    if (consume('operator', 'NOT')) {
      const operand = parsePrimary();
      return operand ? { kind: 'not', operand } : undefined;
    }

    if (consume('(', '(')) {
      const expression = parseOr();
      consume(')', ')');
      return expression;
    }

    if (token.type === 'function') {
      consume('function');
      consume('(', '(');
      const argumentsList = [];
      while (peek() && peek().type !== ')') {
        const argument = parseOr();
        if (argument) {
          argumentsList.push(argument);
        }
        if (!consume(',', ',')) {
          break;
        }
      }
      consume(')', ')');
      return {
        kind: 'function',
        name: token.value,
        arguments: argumentsList,
      };
    }

    if (token.type === 'selector') {
      consume('selector');
      return {
        kind: 'selector',
        value: token.value,
      };
    }

    return undefined;
  }

  function parseAnd() {
    let left = parsePrimary();
    while (consume('operator', 'AND')) {
      const right = parsePrimary();
      if (!left || !right) {
        break;
      }
      left = { kind: 'and', left, right };
    }
    return left;
  }

  function parseXor() {
    let left = parseAnd();
    while (consume('operator', 'XOR')) {
      const right = parseAnd();
      if (!left || !right) {
        break;
      }
      left = { kind: 'xor', left, right };
    }
    return left;
  }

  function parseOr() {
    let left = parseXor();
    while (consume('operator', 'OR')) {
      const right = parseXor();
      if (!left || !right) {
        break;
      }
      left = { kind: 'or', left, right };
    }
    return left;
  }

  return parseOr();
}

function splitSelectorRelationship(value) {
  const source = String(value ?? '');
  let separatorIndex = -1;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== ':') {
      continue;
    }
    if (source[index - 1] === ':' || source[index + 1] === ':') {
      continue;
    }
    separatorIndex = index;
    break;
  }

  if (separatorIndex < 0) {
    return {
      typeRef: undefined,
      targetRef: source,
    };
  }

  return {
    typeRef: source.slice(0, separatorIndex),
    targetRef: source.slice(separatorIndex + 1),
  };
}

const itmCodeMirrorParser = {
  startState() {
    return {
      inAttributes: false,
      expectingValue: false,
      directiveDepth: 0,
      directivePendingBlock: false,
      directiveKind: undefined,
      styleSelectorEnd: undefined,
    };
  },
  token(stream, state) {
    if (stream.sol()) {
      const trimmedLine = stream.string.trim();
      if (trimmedLine.startsWith('%style')) {
        const layout = scanStyleDirective(trimmedLine === stream.string ? stream.string : stream.string);
        state.directiveKind = 'style';
        state.styleSelectorEnd = layout?.selectorEnd;
        state.directiveDepth = 0;
        state.directivePendingBlock = false;
      } else {
        state.directiveKind = undefined;
        state.styleSelectorEnd = undefined;
      }
      if (state.directiveDepth > 0) {
        state.directiveDepth = Math.max(0, state.directiveDepth + braceBalance(trimmedLine));
        stream.skipToEnd();
        return 'comment';
      }
      if (state.directivePendingBlock) {
        if (!trimmedLine) {
          stream.skipToEnd();
          return null;
        }
        if (trimmedLine.startsWith('{')) {
          state.directivePendingBlock = false;
          state.directiveDepth = Math.max(0, braceBalance(trimmedLine));
          stream.skipToEnd();
          return 'comment';
        }
        state.directivePendingBlock = false;
      }
      const remaining = stream.string.slice(stream.pos);
      const trimmed = remaining.trim();
      if (state.directiveKind === 'style') {
        if (stream.eatSpace()) {
          return null;
        }
        const stylePrefix = stream.string.indexOf('%style');
        if (stylePrefix >= 0 && stream.pos <= stylePrefix) {
          stream.pos = stylePrefix + '%style'.length;
          return 'keyword';
        }
        if (state.styleSelectorEnd !== undefined && stream.pos < state.styleSelectorEnd) {
          stream.pos = state.styleSelectorEnd;
          return 'typeName';
        }
      }
      if (stream.eatSpace()) {
        return null;
      }
      if (trimmed.startsWith('%')) {
        state.directiveDepth = trimmed.includes('{') ? Math.max(0, braceBalance(trimmed)) : 0;
        state.directivePendingBlock = !trimmed.includes('{');
        stream.skipToEnd();
        return 'comment';
      }
      if (trimmed.startsWith('|')) {
        stream.skipToEnd();
        return 'comment';
      }
    }
    if (state.inAttributes) {
      if (stream.eatSpace()) {
        return null;
      }
      if (stream.match('}')) {
        state.inAttributes = false;
        state.expectingValue = false;
        return 'bracket';
      }
      if (stream.match(',')) {
        state.expectingValue = false;
        return 'separator';
      }
      if (stream.match(':')) {
        state.expectingValue = true;
        return 'operator';
      }
      if (!state.expectingValue && stream.match(/[A-Za-z_][A-Za-z0-9_.-]*(?=\s*:)/)) {
        return 'attributeName';
      }
      if (stream.match(/#[0-9A-Fa-f]{3,8}\b/)) {
        state.expectingValue = false;
        return 'string';
      }
      if (stream.match(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/)) {
        state.expectingValue = false;
        return 'string';
      }
      if (stream.match(/[+-]?\d+(?:\.\d+)?(?:px|em|rem|%)?\b/)) {
        state.expectingValue = false;
        return 'number';
      }
      if (stream.match(/[^,}]+/)) {
        state.expectingValue = false;
        return 'string';
      }
    }
    if (stream.match('{')) {
      state.inAttributes = true;
      state.expectingValue = false;
      return 'bracket';
    }
    if (stream.match('%style')) {
      return 'keyword';
    }
    if (stream.match(/&[A-Za-z][A-Za-z0-9_-]*/)) {
      return 'atom';
    }
    if (stream.match(/\[[^\]]+\]/)) {
      return 'keyword';
    }
    if (stream.match(/#[A-Za-z][A-Za-z0-9_-]*/)) {
      return 'tag';
    }
    if (stream.match(/@[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z][A-Za-z0-9_-]*)?/)) {
      return 'link';
    }
    stream.next();
    return null;
  },
};

export function createItmCodeMirrorLanguageExtension() {
  return [
    StreamLanguage.define(itmCodeMirrorParser),
    foldService.of(itmCodeMirrorFoldService),
  ];
}

function itmCodeMirrorFoldService(state, from) {
  const line = state.doc.lineAt(from);
  const directiveFold = directiveFoldRange(state, line.number)?.range;
  if (directiveFold) {
    return directiveFold;
  }
  const detailFold = detailFoldRange(state, line.number);
  if (detailFold) {
    return detailFold;
  }
  return branchFoldRange(state, line.number);
}

function directiveFoldRange(state, lineNumber) {
  const line = state.doc.line(lineNumber);
  const trimmed = line.text.trim();
  if (!trimmed.startsWith('%')) {
    return null;
  }
  if (trimmed.startsWith('%style')) {
    const styleLayout = scanStyleDirective(line.text);
    if (!styleLayout) {
      return { range: null, endLineNumber: lineNumber };
    }
    if (styleLayout.inlineBodyStart !== undefined) {
      return { range: null, endLineNumber: lineNumber };
    }
    const next = nextNonEmptyLine(state, lineNumber + 1);
    if (!next || !next.text.trim().startsWith('{')) {
      return { range: null, endLineNumber: lineNumber };
    }
    if (braceBalance(next.text.trim()) <= 0) {
      return { range: { from: line.to, to: next.to }, endLineNumber: next.number };
    }
    const endLineNumber = findDirectiveBlockEnd(state, next.number, braceBalance(next.text.trim()));
    return {
      range: endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null,
      endLineNumber,
    };
  }
  if (!trimmed.includes('{')) {
    const next = nextNonEmptyLine(state, lineNumber + 1);
    if (!next || !next.text.trim().startsWith('{')) {
      return { range: null, endLineNumber: lineNumber };
    }
    if (braceBalance(next.text.trim()) <= 0) {
      return { range: { from: line.to, to: next.to }, endLineNumber: next.number };
    }
    const endLineNumber = findDirectiveBlockEnd(state, next.number, braceBalance(next.text.trim()));
    return {
      range: endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null,
      endLineNumber,
    };
  }
  const initialBalance = braceBalance(trimmed);
  if (initialBalance <= 0) {
    return { range: null, endLineNumber: lineNumber };
  }
  const endLineNumber = findDirectiveBlockEnd(state, lineNumber, initialBalance);
  return {
    range: endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null,
    endLineNumber,
  };
}

function findDirectiveBlockEnd(state, startLineNumber, initialBalance) {
  let balance = initialBalance;
  let lineNumber = startLineNumber;
  while (balance > 0 && lineNumber < state.doc.lines) {
    lineNumber += 1;
    balance += braceBalance(state.doc.line(lineNumber).text.trim());
  }
  return lineNumber;
}

function detailFoldRange(state, lineNumber) {
  const line = state.doc.line(lineNumber);
  if (!line.text.trim().startsWith('|')) {
    return null;
  }
  let endLineNumber = lineNumber;
  while (endLineNumber + 1 <= state.doc.lines && state.doc.line(endLineNumber + 1).text.trim().startsWith('|')) {
    endLineNumber += 1;
  }
  return endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null;
}

function branchFoldRange(state, lineNumber) {
  const line = state.doc.line(lineNumber);
  const trimmed = line.text.trim();
  if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('|')) {
    return null;
  }
  const baseIndent = lineIndent(line.text);
  let endLineNumber = lineNumber;
  for (let cursor = lineNumber + 1; cursor <= state.doc.lines; cursor += 1) {
    const candidate = state.doc.line(cursor);
    const candidateTrimmed = candidate.text.trim();
    if (!candidateTrimmed) {
      if (endLineNumber > lineNumber) {
        endLineNumber = cursor;
      }
      continue;
    }
    if (candidateTrimmed.startsWith('|') && lineIndent(candidate.text) >= baseIndent) {
      endLineNumber = cursor;
      continue;
    }
    if (lineIndent(candidate.text) <= baseIndent) {
      break;
    }
    endLineNumber = cursor;
  }
  return endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null;
}

function nextNonEmptyLine(state, lineNumber) {
  for (let cursor = lineNumber; cursor <= state.doc.lines; cursor += 1) {
    const line = state.doc.line(cursor);
    if (line.text.trim()) {
      return line;
    }
  }
  return null;
}

function lineIndent(text) {
  const match = /^\s*/.exec(text);
  return match ? match[0].length : 0;
}

function braceBalance(text) {
  let balance = 0;
  for (const char of text) {
    if (char === '{') {
      balance += 1;
    } else if (char === '}') {
      balance -= 1;
    }
  }
  return balance;
}

function scanStyleDirective(line) {
  const trimmed = line.trimStart();
  const prefixIndex = trimmed.indexOf('%style');
  if (prefixIndex !== 0) {
    return null;
  }
  const afterPrefix = trimmed.slice('%style'.length);
  const selectorInput = afterPrefix.trimStart();
  if (!selectorInput) {
    return null;
  }

  const selectorEnd = scanSelectorExpression(selectorInput);
  if (selectorEnd <= 0) {
    return null;
  }

  const rest = selectorInput.slice(selectorEnd).trimStart();
  if (!rest.startsWith('{')) {
    return {
      selectorStart: line.indexOf('%style') + '%style'.length,
      selectorEnd: line.indexOf('%style') + '%style'.length + selectorEnd,
    };
  }

  const body = scanBalancedBlock(rest);
  if (!body) {
    return {
      selectorStart: line.indexOf('%style') + '%style'.length,
      selectorEnd: line.indexOf('%style') + '%style'.length + selectorEnd,
    };
  }

  const selectorBase = line.indexOf('%style') + '%style'.length + afterPrefix.length - selectorInput.length;
  const bodyStart = selectorBase + selectorEnd + (selectorInput.slice(selectorEnd).length - rest.length);
  return {
    selectorStart: selectorBase,
    selectorEnd: selectorBase + selectorEnd,
    inlineBodyStart: bodyStart,
    inlineBodyEnd: bodyStart + body.length,
  };
}

function scanSelectorExpression(text) {
  let index = 0;

  const skipSpaces = () => {
    while (index < text.length && /\s/u.test(text[index] ?? '')) {
      index += 1;
    }
  };

  const readAtomTail = () => {
    const start = index;
    while (index < text.length && !/\s/u.test(text[index] ?? '') && !['(', ')', '[', ']', '{', '}', ','].includes(text[index] ?? '')) {
      index += 1;
    }
    return index > start;
  };

  const parseExpression = () => {
    if (!parseUnary()) {
      return false;
    }
    while (true) {
      const save = index;
      if (!matchWord('AND') && !matchWord('OR') && !matchWord('XOR')) {
        index = save;
        return true;
      }
      if (!parseUnary()) {
        return false;
      }
    }
  };

  const parseUnary = () => {
    skipSpaces();
    if (matchWord('NOT')) {
      return parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = () => {
    skipSpaces();
    const current = text[index];
    if (!current) {
      return false;
    }
    if (current === '(') {
      index += 1;
      if (!parseExpression()) {
        return false;
      }
      skipSpaces();
      if (text[index] !== ')') {
        return false;
      }
      index += 1;
      return true;
    }
    if (current === '[') {
      return scanBalancedBracket();
    }
    if (current === '{') {
      return scanAttributeSelector();
    }
    if (current === '#' || current === '&' || current === '@') {
      index += 1;
      return readAtomTail();
    }
    if (current === '=' && text[index + 1] === '>') {
      index += 2;
      return true;
    }
    if (current === '~' && text[index + 1] === '>') {
      index += 2;
      return true;
    }
    if (current === '-' && text[index + 1] === '>') {
      index += 2;
      if (text[index] === '[') {
        return scanBalancedBracket();
      }
      return true;
    }
    if (/[A-Za-z]/u.test(current)) {
      const start = index;
      while (index < text.length && /[A-Za-z0-9_-]/u.test(text[index] ?? '')) {
        index += 1;
      }
      const name = text.slice(start, index);
      skipSpaces();
      if (text[index] === '(') {
        if (!['ALL', 'ANY', 'NONE', 'ONE'].includes(name)) {
          return false;
        }
        index += 1;
        skipSpaces();
        if (text[index] === ')') {
          return false;
        }
        while (parseExpression()) {
          skipSpaces();
          if (text[index] === ',') {
            index += 1;
            skipSpaces();
            continue;
          }
          if (text[index] === ')') {
            index += 1;
            return true;
          }
          return false;
        }
        return false;
      }
      index = start;
    }
    return false;
  };

  const matchWord = (word) => {
    skipSpaces();
    const end = index + word.length;
    if (text.slice(index, end).toUpperCase() !== word) {
      return false;
    }
    const previous = text[index - 1] ?? '';
    const next = text[end] ?? '';
    if (/[A-Za-z0-9_-]/u.test(previous) || /[A-Za-z0-9_-]/u.test(next)) {
      return false;
    }
    index = end;
    skipSpaces();
    return true;
  };

  const scanBalancedBracket = () => {
    let depth = 0;
    let seenContent = false;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    while (index < text.length) {
      const current = text[index];
      if (escaped) {
        escaped = false;
        index += 1;
        seenContent = true;
        continue;
      }
      if (inDoubleQuote) {
        if (current === '\\') {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        index += 1;
        seenContent = true;
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        index += 1;
        seenContent = true;
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        index += 1;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        index += 1;
        continue;
      }
      if (current === '[') {
        depth += 1;
        index += 1;
        continue;
      }
      if (current === ']') {
        depth -= 1;
        index += 1;
        if (depth === 0) {
          return seenContent;
        }
        continue;
      }
      seenContent = true;
      index += 1;
    }
    return false;
  };

  const scanAttributeSelector = () => {
    const start = index;
    index += 1;
    let depth = 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    let content = '';
    while (index < text.length) {
      const current = text[index];
      if (escaped) {
        escaped = false;
        content += current;
        index += 1;
        continue;
      }
      if (inDoubleQuote) {
        if (current === '\\') {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        content += current;
        index += 1;
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        content += current;
        index += 1;
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        content += current;
        index += 1;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        content += current;
        index += 1;
        continue;
      }
      if (current === '{') {
        depth += 1;
        content += current;
        index += 1;
        continue;
      }
      if (current === '}') {
        depth -= 1;
        index += 1;
        if (depth === 0) {
          return content.includes('=');
        }
        content += current;
        continue;
      }
      content += current;
      index += 1;
    }
    index = start;
    return false;
  };

  if (!parseExpression()) {
    return 0;
  }
  skipSpaces();
  return index;
}

function scanBalancedBlock(text) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inDoubleQuote) {
      if (current === '\\') {
        escaped = true;
      } else if (current === '"') {
        inDoubleQuote = false;
      }
      continue;
    }
    if (inSingleQuote) {
      if (current === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (current === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (current === "'") {
      inSingleQuote = true;
      continue;
    }
    if (current === '{') {
      depth += 1;
      continue;
    }
    if (current === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(0, index + 1);
      }
    }
  }
  return null;
}

function selectorMatchesValue(actualValue, expectedValue) {
  if (Array.isArray(actualValue)) {
    return actualValue.some((candidate) => selectorMatchesValue(candidate, expectedValue));
  }

  if (actualValue === expectedValue) {
    return true;
  }

  return String(actualValue ?? '') === String(expectedValue ?? '');
}

function evaluateSelectorNode(selectorValue, entity) {
  if (!entity) {
    return false;
  }

  if (selectorValue === '*') {
    return true;
  }

  if (selectorValue === '=>' || selectorValue === '~>') {
    return false;
  }

  if (selectorValue.startsWith('&')) {
    const identifier = selectorValue.slice(1);
    return [
      entity.id,
      entity.qualifiedId,
      entity.uid,
      entity.localId,
    ].filter(Boolean).includes(identifier);
  }

  if (selectorValue.startsWith('[') && selectorValue.endsWith(']')) {
    return entity.typeRef === selectorValue.slice(1, -1).trim();
  }

  if (selectorValue.startsWith('#')) {
    return (entity.tags ?? []).includes(selectorValue.slice(1));
  }

  if (selectorValue.startsWith('{') && selectorValue.endsWith('}')) {
    const expression = selectorValue.slice(1, -1).trim();
    const separatorIndex = expression.indexOf('=');
    if (separatorIndex <= 0) {
      return false;
    }
    const key = expression.slice(0, separatorIndex).trim();
    const expectedValue = expression.slice(separatorIndex + 1).trim();
    return selectorMatchesValue(entity.attributes?.values?.[key], expectedValue);
  }

  return false;
}

function evaluateSelectorRelationship(selectorValue, relationship) {
  if (!relationship) {
    return false;
  }

  if (selectorValue === '=>') {
    return relationship.relationshipKind === 'containment';
  }

  if (selectorValue === '~>') {
    return relationship.relationshipKind === 'ordering';
  }

  if (!selectorValue.startsWith('@')) {
    if (selectorValue.startsWith('{') && selectorValue.endsWith('}')) {
      const expression = selectorValue.slice(1, -1).trim();
      const separatorIndex = expression.indexOf('=');
      if (separatorIndex <= 0) {
        return false;
      }
      const key = expression.slice(0, separatorIndex).trim();
      const expectedValue = expression.slice(separatorIndex + 1).trim();
      return selectorMatchesValue(relationship.attributes?.values?.[key], expectedValue);
    }
    return false;
  }

  const selector = selectorValue.slice(1);
  const { typeRef, targetRef } = splitSelectorRelationship(selector);

  if (typeRef && relationship.typeRef !== typeRef) {
    return false;
  }

  if (!targetRef || targetRef === '*') {
    return true;
  }

  return [
    relationship.targetRef,
    relationship.targetId,
  ].filter(Boolean).includes(targetRef);
}

function evaluateSelectorAst(ast, candidate) {
  if (!ast) {
    return true;
  }

  switch (ast.kind) {
    case 'selector':
      return candidate.kind === 'node'
        ? evaluateSelectorNode(ast.value, candidate.value)
        : evaluateSelectorRelationship(ast.value, candidate.value);
    case 'not':
      return !evaluateSelectorAst(ast.operand, candidate);
    case 'and':
      return evaluateSelectorAst(ast.left, candidate) && evaluateSelectorAst(ast.right, candidate);
    case 'or':
      return evaluateSelectorAst(ast.left, candidate) || evaluateSelectorAst(ast.right, candidate);
    case 'xor':
      return evaluateSelectorAst(ast.left, candidate) !== evaluateSelectorAst(ast.right, candidate);
    case 'function':
      switch (ast.name) {
        case 'ALL':
          return ast.arguments.every((argument) => evaluateSelectorAst(argument, candidate));
        case 'ANY':
          return ast.arguments.some((argument) => evaluateSelectorAst(argument, candidate));
        case 'NONE':
          return ast.arguments.every((argument) => !evaluateSelectorAst(argument, candidate));
        case 'ONE':
          return ast.arguments.filter((argument) => evaluateSelectorAst(argument, candidate)).length === 1;
        default:
          return false;
      }
    default:
      return false;
  }
}

function matchesSelector(selector, candidate) {
  const ast = parseSelectorExpression(selector);
  return evaluateSelectorAst(ast, candidate);
}

function computeNodeStyle(document, entity) {
  const style = {};
  for (const rule of document.styles ?? []) {
    if (!matchesSelector(rule.selector?.raw, { kind: 'node', value: entity })) {
      continue;
    }
    Object.assign(style, rule.style?.values ?? {});
  }
  Object.assign(style, entity.attributes?.values ?? {});
  return style;
}

function computeRelationshipStyle(document, relationship) {
  const style = {};
  for (const rule of document.styles ?? []) {
    if (!matchesSelector(rule.selector?.raw, { kind: 'relationship', value: relationship })) {
      continue;
    }
    Object.assign(style, rule.style?.values ?? {});
  }
  Object.assign(style, relationship.attributes?.values ?? {});
  return style;
}

function readPipelineStepSelector(step) {
  if (typeof step?.arguments?.value === 'string') {
    return step.arguments.value;
  }
  if (typeof step?.arguments?.select === 'string') {
    return step.arguments.select;
  }
  return undefined;
}

function collectViewSelectors(document, options = {}) {
  const selectors = {
    nodeSelectors: [],
    edgeSelectors: [],
    view: undefined,
    viewpoint: undefined,
  };

  const selectedView = options.view
    ? (document.views ?? []).find((view) => view.name === options.view || view.uid === options.view)
    : undefined;
  const selectedViewpoint = options.viewpoint
    ? (document.viewpoints ?? []).find((viewpoint) => viewpoint.name === options.viewpoint || viewpoint.uid === options.viewpoint)
    : selectedView
      ? (document.viewpoints ?? []).find((viewpoint) =>
        viewpoint.name === selectedView.viewpointRef || viewpoint.uid === selectedView.viewpointRef)
      : undefined;

  selectors.view = selectedView;
  selectors.viewpoint = selectedViewpoint;

  if (typeof options.select === 'string' && options.select.trim()) {
    selectors.nodeSelectors.push(options.select.trim());
  }

  for (const step of selectedViewpoint?.pipeline?.steps ?? []) {
    if (step.operation === 'select') {
      const selector = readPipelineStepSelector(step);
      if (selector) {
        selectors.nodeSelectors.push(selector);
      }
    }
    if (step.operation === 'includeEdges') {
      const selector = readPipelineStepSelector(step);
      if (selector) {
        selectors.edgeSelectors.push(selector);
      }
    }
  }

  return selectors;
}

function renderStylePropertyValue(value) {
  return String(value ?? '');
}

export const itmProjectionKinds = ['tree', 'graph', 'mindmap', 'catalogue', 'matrix', 'report'];

function normalizeItmProjectionKind(kind) {
  switch (String(kind ?? '').trim().toLowerCase()) {
    case 'graph':
      return 'graph';
    case 'mindmap':
      return 'mindmap';
    case 'catalogue':
    case 'catalog':
      return 'catalogue';
    case 'matrix':
      return 'matrix';
    case 'report':
      return 'report';
    case 'tree':
    default:
      return 'tree';
  }
}

function createInlineStyle(style) {
  const properties = [];
  const propertyMap = {
    fill: 'background',
    background: 'background',
    'background-color': 'background',
    backgroundColor: 'background',
    bg: 'background',
    color: 'color',
    'text-color': 'color',
    textColor: 'color',
    fg: 'color',
    'foreground-color': 'color',
    foregroundColor: 'color',
    'font-size': 'font-size',
    fontSize: 'font-size',
    'font-weight': 'font-weight',
    fontWeight: 'font-weight',
    weight: 'font-weight',
    'font-style': 'font-style',
    fontStyle: 'font-style',
    style: 'font-style',
    stroke: 'border-color',
    border: 'border-color',
    'border-color': 'border-color',
    borderColor: 'border-color',
    'border-width': 'border-width',
    borderWidth: 'border-width',
    opacity: 'opacity',
  };

  for (const [key, value] of Object.entries(style ?? {})) {
    const cssProperty = propertyMap[key];
    if (!cssProperty) {
      continue;
    }
    properties.push(`${cssProperty}: ${renderStylePropertyValue(value)};`);
  }

  return properties.join(' ');
}

function createProjectionTitle(projected, options = {}) {
  return options.title
    ?? projected.view?.title
    ?? projected.view?.name
    ?? projected.viewpoint?.title
    ?? projected.viewpoint?.name
    ?? projected.document.metadata?.title
    ?? 'ITM publication';
}

function createProjectionSubtitle(projected, projectionKind) {
  const sourceLabel = projected.view
    ? `View ${projected.view.name} via viewpoint ${projected.view.viewpointRef}`
    : projected.viewpoint
      ? `Viewpoint ${projected.viewpoint.name}`
      : 'Parsed ITM model';

  switch (projectionKind) {
    case 'graph':
      return `${sourceLabel} as graph projection`;
    case 'mindmap':
      return `${sourceLabel} as mindmap projection`;
    case 'catalogue':
      return `${sourceLabel} as catalogue projection`;
    case 'matrix':
      return `${sourceLabel} as relationship matrix`;
    case 'report':
      return `${sourceLabel} as report fragment`;
    case 'tree':
    default:
      return sourceLabel;
  }
}

function createRelationshipTypeCounts(edges = []) {
  const counts = new Map();
  for (const edge of edges) {
    counts.set(edge.typeRef, (counts.get(edge.typeRef) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([typeRef, count]) => ({ typeRef, count }))
    .sort((left, right) => right.count - left.count || left.typeRef.localeCompare(right.typeRef));
}

function createTreeProjection(projected) {
  const nodeMap = new Map(projected.nodes.map((node) => [node.id, node]));
  const entityMap = new Map((projected.document.entities ?? []).map((entity) => [entity.uid, entity]));
  const childrenByParentId = new Map();
  for (const node of projected.nodes) {
    if (!node.parentId || !nodeMap.has(node.parentId)) {
      continue;
    }
    if (!childrenByParentId.has(node.parentId)) {
      childrenByParentId.set(node.parentId, []);
    }
    childrenByParentId.get(node.parentId).push(node.id);
  }

  let maxDepth = 0;
  function buildNode(nodeId, depth = 0, parentPath = []) {
    const graphNode = nodeMap.get(nodeId);
    const entity = entityMap.get(graphNode?.uid);
    if (!graphNode || !entity) {
      return undefined;
    }

    maxDepth = Math.max(maxDepth, depth);
    const children = (childrenByParentId.get(nodeId) ?? [])
      .map((childId) => buildNode(childId, depth + 1, [...parentPath, graphNode.label]))
      .filter(Boolean);
    return {
      id: graphNode.id,
      uid: graphNode.uid,
      label: graphNode.label,
      typeRef: graphNode.typeRef,
      description: entity.description?.text,
      tags: [...(entity.tags ?? [])],
      parentId: graphNode.parentId,
      depth,
      path: [...parentPath, graphNode.label],
      childCount: children.length,
      style: computeNodeStyle(projected.document, entity),
      children,
    };
  }

  const roots = projected.nodes
    .filter((node) => !node.parentId || !nodeMap.has(node.parentId))
    .map((node) => buildNode(node.id))
    .filter(Boolean);

  return {
    roots,
    maxDepth,
    nodeCount: projected.nodes.length,
  };
}

function calculateNodeDepth(nodeId, nodeById) {
  let depth = 0;
  let current = nodeById.get(nodeId);
  const seen = new Set();
  while (current?.parentId && nodeById.has(current.parentId) && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    depth += 1;
    current = nodeById.get(current.parentId);
  }
  return depth;
}

function createGraphProjection(projected) {
  const nodeById = new Map(projected.nodes.map((node) => [node.id, node]));
  const entityByUid = new Map((projected.document.entities ?? []).map((entity) => [entity.uid, entity]));
  const relationshipByUid = new Map((projected.document.relationships ?? []).map((relationship) => [relationship.uid, relationship]));
  const childrenByParentId = new Map();
  const inboundByNodeId = new Map();
  const outboundByNodeId = new Map();

  for (const node of projected.nodes) {
    if (node.parentId && nodeById.has(node.parentId)) {
      if (!childrenByParentId.has(node.parentId)) {
        childrenByParentId.set(node.parentId, []);
      }
      childrenByParentId.get(node.parentId).push(node.id);
    }
  }

  for (const edge of projected.edges) {
    if (!outboundByNodeId.has(edge.sourceId)) {
      outboundByNodeId.set(edge.sourceId, []);
    }
    outboundByNodeId.get(edge.sourceId).push(edge.uid);
    if (edge.targetId) {
      if (!inboundByNodeId.has(edge.targetId)) {
        inboundByNodeId.set(edge.targetId, []);
      }
      inboundByNodeId.get(edge.targetId).push(edge.uid);
    }
  }

  const nodes = projected.nodes.map((node) => {
    const entity = entityByUid.get(node.uid);
    return {
      ...node,
      description: entity?.description?.text,
      tags: [...(entity?.tags ?? [])],
      childCount: (childrenByParentId.get(node.id) ?? []).length,
      depth: calculateNodeDepth(node.id, nodeById),
      inDegree: (inboundByNodeId.get(node.id) ?? []).length,
      outDegree: (outboundByNodeId.get(node.id) ?? []).length,
      style: entity ? computeNodeStyle(projected.document, entity) : {},
    };
  });
  const edges = projected.edges.map((edge) => {
    const relationship = relationshipByUid.get(edge.uid);
    return {
      ...edge,
      label: relationship?.label ?? edge.typeRef,
      sourceLabel: nodeById.get(edge.sourceId)?.label ?? edge.sourceId,
      targetLabel: edge.targetId
        ? nodeById.get(edge.targetId)?.label ?? edge.targetId
        : edge.targetRelationshipId ?? edge.targetRef ?? undefined,
    };
  });

  return {
    nodes,
    edges,
    rootNodeIds: nodes
      .filter((node) => !node.parentId || !nodeById.has(node.parentId))
      .map((node) => node.id),
    relationshipTypeCounts: createRelationshipTypeCounts(edges),
  };
}

function convertTreeNodeToMindmapNode(treeNode, side, depth) {
  return {
    id: treeNode.id,
    uid: treeNode.uid,
    label: treeNode.label,
    typeRef: treeNode.typeRef,
    description: treeNode.description,
    side,
    depth,
    children: (treeNode.children ?? []).map((child) => convertTreeNodeToMindmapNode(child, side, depth + 1)),
  };
}

function createMindmapProjection(projected, treeProjection, options = {}) {
  const title = createProjectionTitle(projected, options);
  if (treeProjection.roots.length === 0) {
    return {
      root: {
        id: 'itm-mindmap-root',
        label: title,
        side: 'center',
        depth: 0,
        children: [],
      },
      nodeCount: 0,
    };
  }

  if (treeProjection.roots.length === 1) {
    return {
      root: convertTreeNodeToMindmapNode(treeProjection.roots[0], 'center', 0),
      nodeCount: projected.nodes.length,
    };
  }

  return {
    root: {
      id: 'itm-mindmap-root',
      label: title,
      side: 'center',
      depth: 0,
      children: treeProjection.roots.map((root, index) =>
        convertTreeNodeToMindmapNode(root, index % 2 === 0 ? 'left' : 'right', 1)),
    },
    nodeCount: projected.nodes.length,
  };
}

function createCatalogueProjection(projected) {
  const nodeById = new Map(projected.nodes.map((node) => [node.id, node]));
  const entityByUid = new Map((projected.document.entities ?? []).map((entity) => [entity.uid, entity]));
  const relationshipByUid = new Map((projected.document.relationships ?? []).map((relationship) => [relationship.uid, relationship]));

  return {
    entities: projected.nodes.map((node) => {
      const entity = entityByUid.get(node.uid);
      return {
        id: node.id,
        uid: node.uid,
        label: node.label,
        typeRef: node.typeRef,
        parentLabel: node.parentId ? nodeById.get(node.parentId)?.label : undefined,
        tags: [...(entity?.tags ?? [])],
        description: entity?.description?.text,
        attributes: { ...(entity?.attributes?.values ?? {}) },
      };
    }),
    relationships: projected.edges.map((edge) => {
      const relationship = relationshipByUid.get(edge.uid);
      return {
        id: edge.id,
        uid: edge.uid,
        label: relationship?.label ?? edge.typeRef,
        typeRef: edge.typeRef,
        relationshipKind: edge.relationshipKind,
        sourceLabel: nodeById.get(edge.sourceId)?.label ?? edge.sourceId,
        targetLabel: edge.targetId
          ? nodeById.get(edge.targetId)?.label ?? edge.targetId
          : edge.targetRelationshipId ?? edge.targetRef ?? undefined,
        implicit: edge.implicit === true,
        attributes: { ...(relationship?.attributes?.values ?? {}) },
      };
    }),
    views: projected.views.map((view) => ({
      id: view.id,
      name: view.name,
      title: view.title,
      viewpointRef: view.viewpointRef,
      parameters: { ...(view.parameters ?? {}) },
      notes: [...(view.notes ?? [])],
    })),
    viewpoints: (projected.document.viewpoints ?? []).map((viewpoint) => ({
      id: viewpoint.uid,
      name: viewpoint.name,
      title: viewpoint.title,
      supportsVisualEditing: viewpoint.supportsVisualEditing === true,
      stepCount: viewpoint.pipeline?.steps?.length ?? 0,
    })),
  };
}

function createMatrixProjection(graphProjection) {
  const rows = graphProjection.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    typeRef: node.typeRef,
  }));
  const columns = rows.map((row) => ({ ...row }));
  const edgeMap = new Map();

  for (const edge of graphProjection.edges) {
    if (!edge.targetId) {
      continue;
    }
    const key = `${edge.sourceId}=>${edge.targetId}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, []);
    }
    edgeMap.get(key).push(edge);
  }

  const cells = [];
  for (const row of rows) {
    for (const column of columns) {
      const relationships = edgeMap.get(`${row.id}=>${column.id}`) ?? [];
      cells.push({
        rowId: row.id,
        columnId: column.id,
        count: relationships.length,
        relationshipTypes: [...new Set(relationships.map((edge) => edge.typeRef))].sort(),
        relationshipKinds: [...new Set(relationships.map((edge) => edge.relationshipKind))].sort(),
        edgeIds: relationships.map((edge) => edge.id),
      });
    }
  }

  return {
    rows,
    columns,
    cells,
    nonEmptyCellCount: cells.filter((cell) => cell.count > 0).length,
  };
}

function createReportProjection(projected, treeProjection, graphProjection, catalogueProjection, matrixProjection, options = {}) {
  const title = createProjectionTitle(projected, options);
  const summary = {
    nodeCount: projected.nodes.length,
    edgeCount: projected.edges.length,
    rootCount: treeProjection.roots.length,
    viewCount: projected.views.length,
    viewpointCount: projected.document.viewpoints?.length ?? 0,
    diagnosticCount: projected.diagnostics.length,
    relationshipTypeCount: graphProjection.relationshipTypeCounts.length,
    nonEmptyMatrixCellCount: matrixProjection.nonEmptyCellCount,
  };

  return {
    title,
    summary,
    sections: [
      {
        id: 'selection',
        title: 'Selection scope',
        items: [
          projected.view ? `View: ${projected.view.name}` : 'View: full model selection',
          projected.viewpoint ? `Viewpoint: ${projected.viewpoint.name}` : 'Viewpoint: not constrained',
          `Tree roots: ${treeProjection.roots.length}`,
          `Relationship cells: ${matrixProjection.nonEmptyCellCount}`,
        ],
      },
      {
        id: 'relationship-types',
        title: 'Relationship types',
        items: graphProjection.relationshipTypeCounts.length > 0
          ? graphProjection.relationshipTypeCounts.map((entry) => `${entry.typeRef}: ${entry.count}`)
          : ['No relationships matched the current projection.'],
      },
      {
        id: 'entities',
        title: 'Highlighted entities',
        items: catalogueProjection.entities.slice(0, 8).map((entry) =>
          entry.typeRef
            ? `${entry.label} [${entry.typeRef}]`
            : entry.label),
      },
      {
        id: 'diagnostics',
        title: 'Diagnostics',
        items: projected.diagnostics.length > 0
          ? projected.diagnostics.map((diagnostic) => `${diagnostic.severity}: ${diagnostic.message}`)
          : ['No diagnostics.'],
      },
    ],
  };
}

function renderNodeTree(treeNode) {
  if (!treeNode) {
    return '';
  }

  const description = treeNode.description
    ? `<p class="tf-itm-node__description">${escapeHtml(treeNode.description)}</p>`
    : '';
  const typeBadge = treeNode.typeRef
    ? `<span class="tf-itm-node__type">${escapeHtml(treeNode.typeRef)}</span>`
    : '';
  const tagBadges = (treeNode.tags ?? [])
    .map((tag) => `<span class="tf-itm-node__tag">#${escapeHtml(tag)}</span>`)
    .join('');
  const childMarkup = (treeNode.children ?? [])
    .map((child) => renderNodeTree(child))
    .join('');

  return `
<li class="tf-itm-tree__item">
  <article class="tf-itm-node" style="${escapeHtml(createInlineStyle(treeNode.style))}">
    <header class="tf-itm-node__header">
      <span class="tf-itm-node__label">${escapeHtml(treeNode.label)}</span>
      ${typeBadge}
      ${tagBadges}
    </header>
    ${description}
  </article>
  ${childMarkup ? `<ul class="tf-itm-tree">${childMarkup}</ul>` : ''}
</li>`.trim();
}

function createModelSummary(projected) {
  return `<dl class="tf-itm-summary">
  <div><dt>Nodes</dt><dd>${projected.nodes.length}</dd></div>
  <div><dt>Edges</dt><dd>${projected.edges.length}</dd></div>
  <div><dt>Views</dt><dd>${projected.views.length}</dd></div>
  <div><dt>Diagnostics</dt><dd>${projected.diagnostics.length}</dd></div>
</dl>`;
}

function renderDiagnosticsList(diagnostics) {
  return diagnostics.length > 0
    ? `<ul class="tf-itm-diagnostics">${diagnostics.map((diagnostic) =>
      `<li class="tf-itm-diagnostics__item tf-itm-diagnostics__item--${escapeHtml(diagnostic.severity)}">${escapeHtml(diagnostic.message)}</li>`).join('')}</ul>`
    : '';
}

function renderPublicationSection(projected, options, bodyHtml) {
  const projectionKind = normalizeItmProjectionKind(options.projection);
  const title = createProjectionTitle(projected, options);
  const subtitle = createProjectionSubtitle(projected, projectionKind);
  return `
<section class="tf-itm-publication tf-itm-publication--${escapeHtml(projectionKind)}" data-itm-title="${escapeHtml(title)}" data-itm-projection="${escapeHtml(projectionKind)}">
  <header class="tf-itm-publication__header">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(subtitle)}</p>
  </header>
  ${createModelSummary(projected)}
  ${renderDiagnosticsList(projected.diagnostics)}
  ${bodyHtml}
</section>`.trim();
}

function sanitizeMermaidMindmapLabel(value) {
  const normalized = String(value ?? '').replace(/\r?\n+/g, ' ').replace(/[`"]/g, '').trim();
  return normalized || 'Untitled';
}

function appendMindmapSourceLines(lines, node, depth) {
  lines.push(`${'  '.repeat(depth)}${sanitizeMermaidMindmapLabel(node.label)}`);
  for (const child of node.children ?? []) {
    appendMindmapSourceLines(lines, child, depth + 1);
  }
}

function escapeGraphvizString(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n');
}

function isProjectedItmModel(input) {
  return Array.isArray(input?.nodes) && Array.isArray(input?.edges) && input.document;
}

function ensureProjectedItmModel(input, options = {}) {
  return isProjectedItmModel(input) ? input : projectItmDocument(input, options);
}

export function projectItmDocument(input, options = {}) {
  const evaluated = evaluateItmDocumentContext(input, options);
  const resolvedDocument = evaluated.effectiveResolvedDocument;
  const document = resolvedDocument;
  const graph = createCanonicalGraph(resolvedDocument, {
    includeImplicitRelationships: options.includeImplicitRelationships ?? true,
  });
  const entityMap = new Map((document.entities ?? []).map((entity) => [entity.uid, entity]));
  const relationshipMap = new Map((document.relationships ?? []).map((relationship) => [relationship.uid, relationship]));
  const selectors = collectViewSelectors(document, options);

  let selectedNodes = graph.nodes.filter((node) => {
    if (selectors.nodeSelectors.length === 0) {
      return true;
    }
    const entity = entityMap.get(node.uid);
    return selectors.nodeSelectors.some((selector) => matchesSelector(selector, {
      kind: 'node',
      value: entity,
    }));
  });

  if (options.includeAncestors !== false) {
    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
    for (const node of graph.nodes) {
      let currentParentId = node.parentId;
      while (currentParentId) {
        if (selectedNodeIds.has(node.id) && !selectedNodeIds.has(currentParentId)) {
          selectedNodeIds.add(currentParentId);
        }
        currentParentId = graph.nodes.find((candidate) => candidate.id === currentParentId)?.parentId;
      }
    }
    selectedNodes = graph.nodes.filter((node) => selectedNodeIds.has(node.id));
  }

  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
  const selectedEdges = graph.edges.filter((edge) => {
    if (!selectedNodeIds.has(edge.sourceId) || (edge.targetId && !selectedNodeIds.has(edge.targetId))) {
      return false;
    }

    if (selectors.edgeSelectors.length === 0) {
      return true;
    }

    const relationship = relationshipMap.get(edge.uid);
    return selectors.edgeSelectors.some((selector) => matchesSelector(selector, {
      kind: 'relationship',
      value: relationship,
    }));
  }).map((edge) => ({
    ...edge,
    style: computeRelationshipStyle(document, relationshipMap.get(edge.uid)),
  }));

  const projected = {
    document: evaluated.effectiveDocument,
    resolvedDocument,
    sourceDocument: evaluated.document,
    diagnostics: mergeDiagnostics(
      evaluated.diagnostics,
      document.diagnostics,
      resolvedDocument.diagnostics,
      graph.diagnostics,
    ),
    nodes: selectedNodes,
    edges: selectedEdges,
    views: graph.views,
    view: selectors.view,
    viewpoint: selectors.viewpoint,
  };
  const tree = createTreeProjection(projected);
  const graphProjection = createGraphProjection(projected);
  const catalogues = createCatalogueProjection(projected);
  const matrix = createMatrixProjection(graphProjection);
  const mindmap = createMindmapProjection(projected, tree, options);
  const report = createReportProjection(projected, tree, graphProjection, catalogues, matrix, options);

  return {
    ...projected,
    tree,
    graph: graphProjection,
    mindmap,
    catalogues,
    matrix,
    report,
    graphvizSource: createItmGraphvizDiagramSource({
      ...projected,
      tree,
      graph: graphProjection,
      mindmap,
      catalogues,
      matrix,
      report,
    }, options),
    mermaidMindmapSource: createItmMermaidMindmapSource({
      ...projected,
      tree,
      graph: graphProjection,
      mindmap,
      catalogues,
      matrix,
      report,
    }, options),
  };
}

export function createItmGraphvizDiagramSource(input, options = {}) {
  const projected = ensureProjectedItmModel(input, options);
  const graphProjection = projected.graph ?? createGraphProjection(projected);
  const lines = [
    'digraph ItmProjection {',
    '  graph [rankdir=LR, pad="0.35", nodesep="0.45", ranksep="0.7", bgcolor="transparent"];',
    '  node [shape=box, style="rounded,filled", fontname="Inter", color="#334155", fillcolor="#f8fafc", margin="0.16,0.08"];',
    '  edge [fontname="Inter", color="#64748b"];',
  ];

  for (const node of graphProjection.nodes) {
    const label = node.typeRef ? `${node.label}\\n[${node.typeRef}]` : node.label;
    lines.push(`  "${escapeGraphvizString(node.id)}" [label="${escapeGraphvizString(label)}"];`);
  }

  for (const edge of graphProjection.edges) {
    if (!edge.targetId) {
      continue;
    }
    const attributes = [];
    const label = edge.typeRef
      ? `${edge.typeRef}${edge.implicit ? ' (implicit)' : ''}`
      : edge.implicit
        ? 'implicit'
        : '';
    if (label) {
      attributes.push(`label="${escapeGraphvizString(label)}"`);
    }
    const attributeText = attributes.length > 0 ? ` [${attributes.join(', ')}]` : '';
    lines.push(`  "${escapeGraphvizString(edge.sourceId)}" -> "${escapeGraphvizString(edge.targetId)}"${attributeText};`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function createItmMermaidMindmapSource(input, options = {}) {
  const projected = ensureProjectedItmModel(input, options);
  const mindmap = projected.mindmap ?? createMindmapProjection(projected, projected.tree ?? createTreeProjection(projected), options);
  const lines = ['mindmap'];
  appendMindmapSourceLines(lines, mindmap.root, 1);
  return lines.join('\n');
}

function renderTreeProjection(projected, options = {}) {
  const roots = projected.tree?.roots ?? [];
  const treeMarkup = roots.length > 0
    ? `<ul class="tf-itm-tree">${roots.map((node) => renderNodeTree(node)).join('')}</ul>`
    : '<p class="tf-itm-empty">No nodes matched the selected ITM publication source.</p>';
  return renderPublicationSection(projected, { ...options, projection: 'tree' }, treeMarkup);
}

function renderGraphProjection(projected, options = {}) {
  const graphProjection = projected.graph;
  const nodesMarkup = graphProjection.nodes.length > 0
    ? graphProjection.nodes.map((node) => `
<article class="tf-itm-graph-card">
  <header>
    <strong>${escapeHtml(node.label)}</strong>
    ${node.typeRef ? `<span>${escapeHtml(node.typeRef)}</span>` : ''}
  </header>
  <p>${escapeHtml(node.description ?? 'No description.')}</p>
  <dl>
    <div><dt>Depth</dt><dd>${node.depth}</dd></div>
    <div><dt>Children</dt><dd>${node.childCount}</dd></div>
    <div><dt>In</dt><dd>${node.inDegree}</dd></div>
    <div><dt>Out</dt><dd>${node.outDegree}</dd></div>
  </dl>
</article>`.trim()).join('')
    : '<p class="tf-itm-empty">No graph nodes matched the selected ITM publication source.</p>';
  const edgeMarkup = graphProjection.edges.length > 0
    ? `<ul class="tf-itm-graph-links">${graphProjection.edges.map((edge) => `
<li>
  <strong>${escapeHtml(edge.sourceLabel)}</strong>
  <span>${escapeHtml(edge.typeRef)}</span>
  <strong>${escapeHtml(edge.targetLabel ?? edge.targetRef ?? 'unresolved target')}</strong>
</li>`.trim()).join('')}</ul>`
    : '<p class="tf-itm-empty">No relationships matched the selected graph projection.</p>';

  return renderPublicationSection(projected, { ...options, projection: 'graph' }, `
<div class="tf-itm-graph">
  <div class="tf-itm-graph__nodes">${nodesMarkup}</div>
  <section class="tf-itm-graph__relationships">
    <h4>Connections</h4>
    ${edgeMarkup}
  </section>
</div>`);
}

function renderMindmapBranch(node) {
  return `
<li class="tf-itm-mindmap__branch" data-side="${escapeHtml(node.side ?? 'center')}">
  <article class="tf-itm-mindmap__node">
    <strong>${escapeHtml(node.label)}</strong>
    ${node.typeRef ? `<span>${escapeHtml(node.typeRef)}</span>` : ''}
  </article>
  ${(node.children?.length ?? 0) > 0 ? `<ul class="tf-itm-mindmap__children">${node.children.map((child) => renderMindmapBranch(child)).join('')}</ul>` : ''}
</li>`.trim();
}

function renderMindmapProjection(projected, options = {}) {
  const root = projected.mindmap?.root;
  const childrenMarkup = (root?.children?.length ?? 0) > 0
    ? `<ul class="tf-itm-mindmap__children tf-itm-mindmap__children--root">${root.children.map((child) => renderMindmapBranch(child)).join('')}</ul>`
    : '<p class="tf-itm-empty">No branches matched the selected mindmap projection.</p>';
  return renderPublicationSection(projected, { ...options, projection: 'mindmap' }, `
<div class="tf-itm-mindmap">
  <article class="tf-itm-mindmap__root">
    <strong>${escapeHtml(root?.label ?? createProjectionTitle(projected, options))}</strong>
    ${root?.typeRef ? `<span>${escapeHtml(root.typeRef)}</span>` : ''}
  </article>
  ${childrenMarkup}
</div>`);
}

function renderCatalogueTable(headers, rows) {
  if (rows.length === 0) {
    return '<p class="tf-itm-empty">No catalogue rows matched the selected projection.</p>';
  }

  return `
<table class="tf-itm-table">
  <thead>
    <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
  </thead>
  <tbody>
    ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
  </tbody>
</table>`.trim();
}

function renderCatalogueProjection(projected, options = {}) {
  const catalogue = projected.catalogues;
  const entitiesTable = renderCatalogueTable(
    ['Entity', 'Type', 'Parent', 'Tags'],
    catalogue.entities.map((entity) => [
      entity.label,
      entity.typeRef ?? '',
      entity.parentLabel ?? '',
      entity.tags.join(', '),
    ]),
  );
  const relationshipsTable = renderCatalogueTable(
    ['Relationship', 'Type', 'Source', 'Target'],
    catalogue.relationships.map((relationship) => [
      relationship.label,
      relationship.typeRef ?? '',
      relationship.sourceLabel,
      relationship.targetLabel ?? '',
    ]),
  );
  return renderPublicationSection(projected, { ...options, projection: 'catalogue' }, `
<div class="tf-itm-catalogue">
  <section>
    <h4>Entities</h4>
    ${entitiesTable}
  </section>
  <section>
    <h4>Relationships</h4>
    ${relationshipsTable}
  </section>
</div>`);
}

function renderMatrixProjection(projected, options = {}) {
  const matrix = projected.matrix;
  if (matrix.rows.length === 0 || matrix.columns.length === 0) {
    return renderPublicationSection(projected, { ...options, projection: 'matrix' }, '<p class="tf-itm-empty">No matrix rows matched the selected projection.</p>');
  }

  const cellByKey = new Map(matrix.cells.map((cell) => [`${cell.rowId}=>${cell.columnId}`, cell]));
  return renderPublicationSection(projected, { ...options, projection: 'matrix' }, `
<div class="tf-itm-matrix">
  <table class="tf-itm-table tf-itm-table--matrix">
    <thead>
      <tr>
        <th>Source \\ Target</th>
        ${matrix.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${matrix.rows.map((row) => `
<tr>
  <th>${escapeHtml(row.label)}</th>
  ${matrix.columns.map((column) => {
    const cell = cellByKey.get(`${row.id}=>${column.id}`);
    const title = cell?.relationshipTypes?.length
      ? cell.relationshipTypes.join(', ')
      : 'No relationships';
    return `<td title="${escapeHtml(title)}">${cell?.count ?? 0}</td>`;
  }).join('')}
</tr>`).join('')}
    </tbody>
  </table>
</div>`);
}

function renderReportProjection(projected, options = {}) {
  const report = projected.report;
  const sectionMarkup = report.sections.map((section) => `
<section class="tf-itm-report__section">
  <h4>${escapeHtml(section.title)}</h4>
  <ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
</section>`.trim()).join('');
  return renderPublicationSection(projected, { ...options, projection: 'report' }, `
<div class="tf-itm-report">
  <dl class="tf-itm-summary tf-itm-summary--report">
    <div><dt>Roots</dt><dd>${report.summary.rootCount}</dd></div>
    <div><dt>Relation types</dt><dd>${report.summary.relationshipTypeCount}</dd></div>
    <div><dt>Matrix cells</dt><dd>${report.summary.nonEmptyMatrixCellCount}</dd></div>
  </dl>
  ${sectionMarkup}
</div>`);
}

function renderProjectedModel(projected, options = {}) {
  switch (normalizeItmProjectionKind(options.projection)) {
    case 'graph':
      return renderGraphProjection(projected, options);
    case 'mindmap':
      return renderMindmapProjection(projected, options);
    case 'catalogue':
      return renderCatalogueProjection(projected, options);
    case 'matrix':
      return renderMatrixProjection(projected, options);
    case 'report':
      return renderReportProjection(projected, options);
    case 'tree':
    default:
      return renderTreeProjection(projected, options);
  }
}

function renderModelCollection(models, options = {}) {
  return models
    .map((model, index) => renderProjectedModel(
      projectItmDocument(
        model.effectiveResolvedDocument
          ?? model.effectiveDocument
          ?? model.resolvedDocument
          ?? model.document,
        options,
      ),
      {
        ...options,
        title: models.length > 1
          ? `${options.title ?? 'ITM publication'} ${index + 1}`
          : options.title,
      },
    ))
    .join('\n');
}

function createStaticHtmlSurface(model) {
  return {
    id: model.id,
    model,
    mount(container) {
      container.innerHTML = model.html;
      return () => {
        container.innerHTML = '';
      };
    },
  };
}

function createItmProjectionSurfaceContribution(projectionKind, label, description) {
  return {
    id: `@textforge/itm/${projectionKind}`,
    label,
    description,
    kind: 'itm-projection',
    localName: projectionKind,
    capabilities: ['@textforge/itm/capability/view'],
    readOnly: true,
    documentPredicate: itmDocumentPredicate,
    open(execution = {}) {
      const sourceText = execution.sourceText ?? '';
      const resourceTitle = execution.resourceTitle ?? execution.resource?.path ?? label;

      if (!sourceText.trim()) {
        const surface = createStaticHtmlSurface({
          id: `${projectionKind}:${execution.resource?.resourceId ?? 'virtual'}`,
          title: resourceTitle,
          projection: projectionKind,
          html: '<section class="tf-itm-publication tf-itm-publication--error"><p>No ITM source is available for this surface.</p></section>',
          diagnostics: [createDiagnostic('No ITM source is available for the requested ITM projection surface.', 'error', {
            resource: execution.resource,
            code: 'itm.surface.source-missing',
            origin: {
              packageId: '@textforge/itm',
              subsystem: 'itm-surface',
              contributionId: `@textforge/itm/${projectionKind}`,
            },
          })],
        });
        return {
          mountId: `${execution.session?.id ?? 'surface'}:${projectionKind}:${execution.updatedAt ?? 'current'}`,
          summary: `ITM ${projectionKind} projection unavailable.`,
          detail: 'Missing source',
          readOnly: true,
          surface,
        };
      }

      const parsed = parseDocument(sourceText, {
        uri: execution.resource?.path,
      });
      const projected = projectItmDocument(parsed, {
        projection: projectionKind,
        title: resourceTitle,
      });
      const html = renderProjectedModel(projected, {
        projection: projectionKind,
        title: resourceTitle,
      });
      const surface = createStaticHtmlSurface({
        id: `${projectionKind}:${execution.resource?.resourceId ?? 'virtual'}`,
        title: resourceTitle,
        projection: projectionKind,
        html,
        diagnostics: [],
      });
      return {
        mountId: `${execution.session?.id ?? 'surface'}:${projectionKind}:${execution.updatedAt ?? 'current'}`,
        summary: `Package-owned ITM ${projectionKind} projection surface.`,
        detail: `ITM ${projectionKind}`,
        readOnly: true,
        surface,
      };
    },
  };
}

export function renderItmPublicationHtml(input, options = {}) {
  if (Array.isArray(input)) {
    return renderModelCollection(input, options);
  }

  return renderProjectedModel(projectItmDocument(input, options), options);
}

function createItmPublicationNotFoundResult(sourceResource) {
  return {
    html: '<section class="tf-itm-publication tf-itm-publication--error"><p>No ITM source is available for this publication block.</p></section>',
    diagnostics: [
      createDiagnostic('No ITM source is available for the itm-pub block.', 'error', {
        resource: sourceResource,
        code: 'itm.pub.source-missing',
        origin: {
          packageId: '@textforge/itm',
          subsystem: 'itm-publication',
          fenceName: 'itm-pub',
        },
      }),
    ],
    generatedResources: [],
  };
}

function readPipelineStringValue(value) {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value?.value === 'string') {
    return value.value;
  }
  return undefined;
}

function readPipelineBytesValue(value) {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value?.value instanceof Uint8Array) {
    return value.value;
  }
  return undefined;
}

function createItmGeneratedDiagramPath(basePath, blockId, extension) {
  const normalizedBase = String(basePath ?? '/generated/itm-projection').replaceAll('\\', '/').replace(/\/+$/, '');
  return `${normalizedBase}-itm-pub-${blockId}.${extension}`;
}

function createItmGeneratedDiagramResources(input) {
  if (!input.basePath || typeof input.svg !== 'string') {
    return [];
  }

  const generatedAt = new Date().toISOString();
  const resources = [
    {
      kind: 'generated-resource',
      path: createItmGeneratedDiagramPath(input.basePath, input.blockId, 'svg'),
      title: createItmGeneratedDiagramPath(input.basePath, input.blockId, 'svg').split('/').pop(),
      representation: 'text',
      mimeType: 'image/svg+xml',
      languageId: 'svg',
      text: input.svg,
      format: 'svg',
      pipelineId: '@textforge/itm/graphviz-projection',
      sourceResourceId: input.sourceResource?.resourceId,
      sourcePath: input.sourceResource?.path,
      sourceUpdatedAt: input.sourceUpdatedAt,
      blockId: input.blockId,
      blockKind: 'itm-pub',
      generatedAt,
      metadata: {
        projection: 'graph',
      },
    },
  ];

  if (input.pngBytes instanceof Uint8Array) {
    resources.push({
      kind: 'generated-resource',
      path: createItmGeneratedDiagramPath(input.basePath, input.blockId, 'png'),
      title: createItmGeneratedDiagramPath(input.basePath, input.blockId, 'png').split('/').pop(),
      representation: 'bytes',
      mimeType: 'image/png',
      bytes: input.pngBytes,
      format: 'png',
      pipelineId: '@textforge/itm/graphviz-projection',
      sourceResourceId: input.sourceResource?.resourceId,
      sourcePath: input.sourceResource?.path,
      sourceUpdatedAt: input.sourceUpdatedAt,
      blockId: input.blockId,
      blockKind: 'itm-pub',
      generatedAt,
      metadata: {
        projection: 'graph',
      },
    });
  }

  return resources;
}

async function renderItmGraphPublication(selectedModel, renderOptions, execution, blockIdSuffix = '') {
  const projected = projectItmDocument(
    selectedModel.effectiveResolvedDocument
      ?? selectedModel.effectiveDocument
      ?? selectedModel.resolvedDocument
      ?? selectedModel.document,
    renderOptions,
  );
  const fallbackHtml = renderProjectedModel(projected, {
    ...renderOptions,
    projection: 'graph',
  });

  if (!execution.pipelineRunner) {
    return {
      html: fallbackHtml,
      diagnostics: [],
      generatedResources: [],
    };
  }

  try {
    const pipelineResult = await execution.pipelineRunner.run(
      createItmGraphvizDiagramSource(projected, renderOptions),
      {
        context: {
          blockId: `${execution.blockId}${blockIdSuffix}`,
          blockKind: 'itm-pub',
          document: execution.document,
          sourceResource: execution.sourceResource,
        },
        steps: execution.includePng
          ? ['graphviz-svg', 'svg-png']
          : ['graphviz-svg'],
      },
    );
    const svg = readPipelineStringValue(
      pipelineResult.intermediateValues.find((value) => value.contributionId === '@textforge/diagrams/graphviz-svg')?.value
      ?? pipelineResult.value,
    );
    const pngBytes = readPipelineBytesValue(
      pipelineResult.intermediateValues.find((value) => value.contributionId === '@textforge/diagrams/svg-png')?.value,
    );
    if (!svg) {
      return {
        html: fallbackHtml,
        diagnostics: pipelineResult.diagnostics ?? [],
        generatedResources: pipelineResult.generatedResources ?? [],
      };
    }

    return {
      html: renderPublicationSection(projected, { ...renderOptions, projection: 'graph' }, `<div class="tf-itm-graph__stage">${svg}</div>`),
      diagnostics: pipelineResult.diagnostics ?? [],
      generatedResources: [
        ...(pipelineResult.generatedResources ?? []),
        ...createItmGeneratedDiagramResources({
          basePath: execution.generatedAssetBasePath,
          blockId: `${execution.blockId}${blockIdSuffix}`,
          pngBytes,
          sourceResource: execution.sourceResource,
          sourceUpdatedAt: execution.sourceUpdatedAt,
          svg,
        }),
      ],
    };
  } catch (error) {
    return {
      html: fallbackHtml,
      diagnostics: [
        createDiagnostic(error?.message ?? 'Graph projection rendering failed.', 'warning', {
          resource: execution.sourceResource,
          code: 'itm.pub.graph-render-failed',
          origin: {
            packageId: '@textforge/itm',
            subsystem: 'itm-publication',
            fenceName: 'itm-pub',
          },
        }),
      ],
      generatedResources: [],
    };
  }
}

function ensureItmDocumentState(sharedState) {
  if (!sharedState[itmPublicationDocumentStateKey]) {
    sharedState[itmPublicationDocumentStateKey] = {
      models: [],
    };
  }
  return sharedState[itmPublicationDocumentStateKey];
}

function readItmPublicationRequest(content) {
  try {
    const parsed = parseYaml(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
  }
  return {};
}

function findRequestedModel(state, request) {
  const models = state.models ?? [];
  const requestedSource = String(request.source ?? request.import ?? 'nearest').trim();
  if (requestedSource === 'document') {
    return models.slice();
  }

  if (requestedSource === 'nearest') {
    return models.length > 0 ? models[models.length - 1] : undefined;
  }

  return models.find((model) =>
    model.name === requestedSource
    || model.blockId === requestedSource
    || model.document.metadata?.title === requestedSource);
}

async function parseEmbeddedItmBlock(execution) {
  const includeProviders = [];
  const workspace = execution.hostServices?.workspace;
  const repositoryResolution = execution.hostServices?.repositoryResolution;
  if (workspace?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(workspace, {
      basePath: execution.sourceResource?.path,
      ...(repositoryResolution ?? {}),
    }));
  }

  const result = await loadItmDocument(execution.content, {
    strict: false,
    uri: execution.sourceResource?.path,
    includeProviders,
    repositoryResolution,
    contributionRegistry: execution.contributionRegistry ?? execution.hostServices?.contributionRegistry,
    documentResource: {
      path: execution.sourceResource?.path,
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: 'text/x-itm',
    },
  });
  return result;
}

export const itmMarkdownFenceHandlerContributions = [
  createMarkdownFenceHandlerContribution('@textforge/itm/fence-handler/itm', {
    label: 'ITM model block renderer',
    description: 'Parse embedded ITM blocks and render the default tree-oriented ITM publication preview.',
    localName: 'itm',
    capabilities: ['@textforge/itm/capability/itm'],
    defaultActive: true,
    localArtifactCompatible: true,
    fenceNames: ['itm'],
    async render(execution) {
      const parsed = await parseEmbeddedItmBlock(execution);
      const state = ensureItmDocumentState(execution.sharedState ?? {});
      const modelName = execution.fence?.parameters?.name
        ? String(execution.fence.parameters.name)
        : undefined;
      state.models.push({
        blockId: execution.blockId,
        name: modelName,
        document: parsed.document,
        resolvedDocument: parsed.resolvedDocument,
        effectiveDocument: parsed.effectiveDocument,
        effectiveResolvedDocument: parsed.effectiveResolvedDocument,
      });

      return {
        html: renderItmPublicationHtml(parsed.effectiveResolvedDocument ?? parsed.resolvedDocument, {
          title: modelName,
        }),
        diagnostics: parsed.diagnostics.map((diagnostic) =>
          createItmCoreDiagnostic(diagnostic, execution.sourceResource, {
            origin: {
              fenceName: 'itm',
            },
          })),
        generatedResources: [],
      };
    },
  }),
  createMarkdownFenceHandlerContribution('@textforge/itm/fence-handler/itm-pub', {
    label: 'ITM publication block renderer',
    description: 'Render projection-aware publication views over embedded ITM model blocks within the current Markdown document.',
    localName: 'itm-pub',
    capabilities: ['@textforge/itm/capability/itm-pub'],
    defaultActive: true,
    localArtifactCompatible: true,
    fenceNames: ['itm-pub'],
    async render(execution) {
      const state = ensureItmDocumentState(execution.sharedState ?? {});
      const request = readItmPublicationRequest(execution.content);
      const selected = findRequestedModel(state, request);
      if (!selected || (Array.isArray(selected) && selected.length === 0)) {
        return createItmPublicationNotFoundResult(execution.sourceResource);
      }

      const renderOptions = {
        title: request.title,
        view: request.view,
        viewpoint: request.viewpoint,
        select: request.select,
        projection: request.projection ?? request.kind ?? request.layout ?? request.mode,
      };
      const projectionKind = normalizeItmProjectionKind(renderOptions.projection);
      if (projectionKind === 'graph') {
        if (Array.isArray(selected)) {
          const rendered = await Promise.all(selected.map((model, index) =>
            renderItmGraphPublication(model, {
              ...renderOptions,
              title: selected.length > 1
                ? `${renderOptions.title ?? 'ITM publication'} ${index + 1}`
                : renderOptions.title,
            }, execution, `-${index + 1}`)));
          return {
            html: rendered.map((entry) => entry.html).join('\n'),
            diagnostics: rendered.flatMap((entry) => entry.diagnostics ?? []),
            generatedResources: rendered.flatMap((entry) => entry.generatedResources ?? []),
          };
        }

        return renderItmGraphPublication(selected, renderOptions, execution);
      }

      return {
        html: renderItmPublicationHtml(selected, renderOptions),
        diagnostics: [],
        generatedResources: [],
      };
    },
  }),
];

const itmSurfaceContributions = itmProjectionKinds.map((projectionKind) =>
  createItmProjectionSurfaceContribution(
    projectionKind,
    `ITM ${projectionKind[0].toUpperCase()}${projectionKind.slice(1)}`,
    `Open ITM resources through the ${projectionKind} projection surface.`,
  ));

export function createItmContributionManifest() {
  return createContributionManifest('@textforge/itm', {
    capabilities: itmCapabilities,
    markdownFenceHandlers: itmMarkdownFenceHandlerContributions,
    surfaces: itmSurfaceContributions,
  });
}

export const contributions = createItmContributionManifest();
