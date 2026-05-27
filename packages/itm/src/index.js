import { parse as parseYaml } from 'yaml';
import { StreamLanguage, foldService } from '@codemirror/language';

import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
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
  isResolvedDocument,
  parseDocumentResult,
  resolveDocument,
} from './upstream/index.js';

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

  const resolvedDocument = resolveDocument(document);
  diagnostics = mergeDiagnostics(
    diagnostics,
    resolvedDocument.diagnostics,
    document.diagnostics,
    createIncludeResolutionDiagnostics(resolvedDocument, options.repositoryResolution),
  );

  return {
    document,
    resolvedDocument,
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

export function validateItmDocument(document, options = {}) {
  const resolvedDocument = isResolvedDocument(document) ? document : resolveDocument(document);
  return mergeDiagnostics(
    resolvedDocument.diagnostics,
    createIncludeResolutionDiagnostics(resolvedDocument, options.repositoryResolution),
  );
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

function renderNodeTree(nodeId, childrenByParentId, nodeMap, entityMap, document) {
  const graphNode = nodeMap.get(nodeId);
  const entity = entityMap.get(nodeId);
  if (!graphNode || !entity) {
    return '';
  }

  const style = computeNodeStyle(document, entity);
  const description = entity.description?.text
    ? `<p class="tf-itm-node__description">${escapeHtml(entity.description.text)}</p>`
    : '';
  const typeBadge = graphNode.typeRef
    ? `<span class="tf-itm-node__type">${escapeHtml(graphNode.typeRef)}</span>`
    : '';
  const tagBadges = (entity.tags ?? [])
    .map((tag) => `<span class="tf-itm-node__tag">#${escapeHtml(tag)}</span>`)
    .join('');
  const childMarkup = (childrenByParentId.get(nodeId) ?? [])
    .map((childId) => renderNodeTree(childId, childrenByParentId, nodeMap, entityMap, document))
    .join('');

  return `
<li class="tf-itm-tree__item">
  <article class="tf-itm-node" style="${escapeHtml(createInlineStyle(style))}">
    <header class="tf-itm-node__header">
      <span class="tf-itm-node__label">${escapeHtml(graphNode.label)}</span>
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

export function projectItmDocument(input, options = {}) {
  const resolvedDocument = isResolvedDocument(input) ? input : resolveDocument(input);
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
    const selectedNodeIds = new Set(selectedNodes.map((node) => node.uid));
    for (const node of graph.nodes) {
      let currentParentId = node.parentId;
      while (currentParentId) {
        if (selectedNodeIds.has(node.uid) && !selectedNodeIds.has(currentParentId)) {
          selectedNodeIds.add(currentParentId);
        }
        currentParentId = graph.nodes.find((candidate) => candidate.uid === currentParentId)?.parentId;
      }
    }
    selectedNodes = graph.nodes.filter((node) => selectedNodeIds.has(node.uid));
  }

  const selectedNodeIds = new Set(selectedNodes.map((node) => node.uid));
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

  return {
    document,
    resolvedDocument,
    diagnostics: mergeDiagnostics(document.diagnostics, resolvedDocument.diagnostics, graph.diagnostics),
    nodes: selectedNodes,
    edges: selectedEdges,
    views: graph.views,
    view: selectors.view,
    viewpoint: selectors.viewpoint,
  };
}

function renderProjectedModel(projected, options = {}) {
  const nodeMap = new Map(projected.nodes.map((node) => [node.uid, node]));
  const entityMap = new Map((projected.document.entities ?? []).map((entity) => [entity.uid, entity]));
  const childrenByParentId = new Map();
  for (const node of projected.nodes) {
    const parentId = node.parentId;
    if (!parentId || !nodeMap.has(parentId)) {
      continue;
    }
    if (!childrenByParentId.has(parentId)) {
      childrenByParentId.set(parentId, []);
    }
    childrenByParentId.get(parentId).push(node.uid);
  }

  const rootNodes = projected.nodes.filter((node) => !node.parentId || !nodeMap.has(node.parentId));
  const title = options.title
    ?? projected.view?.title
    ?? projected.view?.name
    ?? projected.viewpoint?.title
    ?? projected.viewpoint?.name
    ?? projected.document.metadata?.title
    ?? 'ITM publication';
  const subtitle = projected.view
    ? `View ${projected.view.name} via viewpoint ${projected.view.viewpointRef}`
    : projected.viewpoint
      ? `Viewpoint ${projected.viewpoint.name}`
      : 'Parsed ITM model';
  const diagnosticsMarkup = projected.diagnostics.length > 0
    ? `<ul class="tf-itm-diagnostics">${projected.diagnostics.map((diagnostic) =>
      `<li class="tf-itm-diagnostics__item tf-itm-diagnostics__item--${escapeHtml(diagnostic.severity)}">${escapeHtml(diagnostic.message)}</li>`).join('')}</ul>`
    : '';
  const treeMarkup = rootNodes.length > 0
    ? `<ul class="tf-itm-tree">${rootNodes.map((node) =>
      renderNodeTree(node.uid, childrenByParentId, nodeMap, entityMap, projected.document)).join('')}</ul>`
    : '<p class="tf-itm-empty">No nodes matched the selected ITM publication source.</p>';

  return `
<section class="tf-itm-publication" data-itm-title="${escapeHtml(title)}">
  <header class="tf-itm-publication__header">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(subtitle)}</p>
  </header>
  ${createModelSummary(projected)}
  ${diagnosticsMarkup}
  ${treeMarkup}
</section>`.trim();
}

function renderModelCollection(models, options = {}) {
  return models
    .map((model, index) => renderProjectedModel(
      projectItmDocument(model.resolvedDocument ?? model.document, options),
      {
        ...options,
        title: models.length > 1
          ? `${options.title ?? 'ITM publication'} ${index + 1}`
          : options.title,
      },
    ))
    .join('\n');
}

export function renderItmPublicationHtml(input, options = {}) {
  if (Array.isArray(input)) {
    return renderModelCollection(input, options);
  }

  return renderProjectedModel(projectItmDocument(input, options), options);
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
  });
  return result;
}

export const itmMarkdownFenceHandlerContributions = [
  createMarkdownFenceHandlerContribution('@textforge/itm/fence-handler/itm', {
    label: 'ITM model block renderer',
    description: 'Parse embedded ITM blocks and render a publication-oriented outline preview.',
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
      });

      return {
        html: renderItmPublicationHtml(parsed.resolvedDocument, {
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
    description: 'Render publication views over embedded ITM model blocks within the current Markdown document.',
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
        return {
          html: '<section class="tf-itm-publication tf-itm-publication--error"><p>No ITM source is available for this publication block.</p></section>',
          diagnostics: [
            createDiagnostic('No ITM source is available for the itm-pub block.', 'error', {
              resource: execution.sourceResource,
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

      const renderOptions = {
        title: request.title,
        view: request.view,
        viewpoint: request.viewpoint,
        select: request.select,
      };
      return {
        html: renderItmPublicationHtml(selected, renderOptions),
        diagnostics: [],
        generatedResources: [],
      };
    },
  }),
];

export function createItmContributionManifest() {
  return createContributionManifest('@textforge/itm', {
    capabilities: itmCapabilities,
    markdownFenceHandlers: itmMarkdownFenceHandlerContributions,
  });
}

export const contributions = createItmContributionManifest();
