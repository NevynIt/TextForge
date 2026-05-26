import { parse as parseYaml } from 'yaml';

import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createMarkdownFenceHandlerContribution,
  createResourcePredicate,
} from '@textforge/core';
import {
  dirnameWorkspacePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
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

function resolveRepositoryLocation(location, fromPath) {
  if (!location || looksLikeUrl(location)) {
    return undefined;
  }

  if (looksLikeWorkspacePath(location)) {
    return normalizeWorkspacePath(location);
  }

  if (location.startsWith('./') || location.startsWith('../')) {
    if (!fromPath || !looksLikeWorkspacePath(fromPath)) {
      return undefined;
    }
    return joinWorkspacePath(dirnameWorkspacePath(fromPath), location);
  }

  return undefined;
}

function resolveWorkspaceIncludeTarget(target, context = {}, options = {}) {
  const rawTarget = String(target ?? '').trim();
  if (rawTarget === '' || rawTarget.startsWith('std:') || rawTarget.startsWith('std://')) {
    return undefined;
  }

  if (looksLikeWorkspacePath(rawTarget)) {
    return normalizeWorkspacePath(rawTarget);
  }

  const repositoryReference = splitRepositoryTarget(rawTarget);
  if (repositoryReference) {
    const repository = context.sourceDocument?.repositories?.find((candidate) =>
      candidate?.name === repositoryReference.repositoryName);
    const repositoryBasePath = resolveRepositoryLocation(
      repository?.location,
      options.basePath ?? context.sourceDocument?.uri,
    );
    if (!repositoryBasePath) {
      return undefined;
    }
    return joinWorkspacePath(repositoryBasePath, repositoryReference.path);
  }

  const basePath = options.basePath ?? context.sourceDocument?.uri;
  if (looksLikeWorkspacePath(basePath)) {
    return joinWorkspacePath(dirnameWorkspacePath(basePath), rawTarget);
  }

  return undefined;
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
  diagnostics = mergeDiagnostics(diagnostics, resolvedDocument.diagnostics, document.diagnostics);

  return {
    document,
    resolvedDocument,
    diagnostics,
  };
}

export function validateItmDocument(document) {
  const resolvedDocument = isResolvedDocument(document) ? document : resolveDocument(document);
  return [...(resolvedDocument.diagnostics ?? [])];
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
  if (workspace?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(workspace, {
      basePath: execution.sourceResource?.path,
    }));
  }

  const result = await loadItmDocument(execution.content, {
    strict: false,
    uri: execution.sourceResource?.path,
    includeProviders,
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
