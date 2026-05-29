import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createResourcePredicate,
} from '@textforge/core';
import BpmnModdle from 'bpmn-moddle';
import { parse as parseYaml } from 'yaml';
import {
  createWorkspaceItmIncludeProvider,
  importBpmnXmlResult,
  isResolvedDocument,
  loadItmDocument,
  resolveItmVisualTarget,
  resolveDocument,
  validateBpmnRules,
  validateItmDocument,
} from '@textforge/itm';

export const bpmnRulesCapabilityId = '@textforge/bpmn/capability/rules';
export const bpmnXmlCapabilityId = '@textforge/bpmn/capability/xml';
export const bpmnViewerCapabilityId = '@textforge/bpmn/capability/viewer';
export const bpmnDiCapabilityId = '@textforge/bpmn/capability/di';
export const bpmnSemanticCapabilityId = '@textforge/bpmn/capability/semantic';

export const bpmnCapabilityIds = Object.freeze([
  bpmnRulesCapabilityId,
  bpmnXmlCapabilityId,
  bpmnViewerCapabilityId,
  bpmnDiCapabilityId,
  bpmnSemanticCapabilityId,
]);

export const bpmnXmlDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['bpmn-xml'],
  mimeTypes: ['application/bpmn+xml'],
  fileExtensions: ['bpmn'],
});

export const bpmnItmDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['itm'],
  mimeTypes: ['text/itm', 'text/x-itm'],
  fileExtensions: ['itm'],
});

export const bpmnViewerSurfaceId = '@textforge/bpmn/viewer';
export const bpmnViewerSurfaceDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['bpmn-xml', 'itm'],
  fileExtensions: ['bpmn', 'itm'],
});

export const bpmnSemanticProfileText = `%metadata
{
  title: "TextForge BPMN Semantic MVP Profile"
  version: "0.1.0"
  profile: "textforge.bpmn.semantic-mvp"
  description: "Narrow BPMN semantic MVP profile used by the V19a BPMN chain."
}

%package textforge_bpmn_semantic_mvp
{
  version: "0.1.0"
  namespace: "bpmn"
  description: "Minimal BPMN semantic MVP for Process, Events, Tasks, collapsed SubProcess, ExclusiveGateway, SequenceFlow, basic associations, and data references."
}

%namespace bpmn https://www.omg.org/spec/BPMN/20100524/MODEL

%require itm.type-hierarchy ^0.1.0
%require itm.validation ^0.1.0
%require bpmn.semantic ^0.1.0
%require bpmn.rules ^0.1.0
%require bpmn.xml ^0.1.0
%require bpmn.viewer ^0.1.0
%using textforge_bpmn_semantic_mvp

%entitytype bpmn::Definitions
{
  description: "BPMN definitions root used to carry export metadata."
  requiredAttributes:
    - id
    - targetNamespace
}

%entitytype bpmn::Process
{
  description: "BPMN process root for the semantic MVP."
  requiredAttributes:
    - id
  recommendedAttributes:
    - isExecutable
}

%entitytype bpmn::FlowNode
{
  abstract: true
  description: "Abstract BPMN flow node."
}

%entitytype bpmn::Task
{
  extends:
    - "bpmn::FlowNode"
  description: "BPMN task."
  requiredAttributes:
    - id
}

%entitytype bpmn::SubProcess
{
  extends:
    - "bpmn::FlowNode"
  description: "Collapsed BPMN subprocess."
  requiredAttributes:
    - id
  recommendedAttributes:
    - triggeredByEvent
}

%entitytype bpmn::StartEvent
{
  extends:
    - "bpmn::FlowNode"
  description: "BPMN start event."
  requiredAttributes:
    - id
}

%entitytype bpmn::EndEvent
{
  extends:
    - "bpmn::FlowNode"
  description: "BPMN end event."
  requiredAttributes:
    - id
}

%entitytype bpmn::ExclusiveGateway
{
  extends:
    - "bpmn::FlowNode"
  description: "BPMN exclusive gateway."
  requiredAttributes:
    - id
}

%entitytype bpmn::DataObject
{
  description: "Backing BPMN data object for a data object reference."
  requiredAttributes:
    - id
}

%entitytype bpmn::DataObjectReference
{
  description: "Visible BPMN data object reference."
  requiredAttributes:
    - id
    - dataObjectRef
}

%entitytype bpmn::DataStore
{
  description: "Backing BPMN data store for a data store reference."
  requiredAttributes:
    - id
}

%entitytype bpmn::DataStoreReference
{
  description: "Visible BPMN data store reference."
  requiredAttributes:
    - id
    - dataStoreRef
}

%relationshiptype bpmn::sequenceFlow
{
  sourceTypes:
    - bpmn::FlowNode
  targetTypes:
    - bpmn::FlowNode
  attributes:
    - id
}

%relationshiptype bpmn::association
{
  sourceTypes:
    - bpmn::FlowNode
    - bpmn::DataObjectReference
    - bpmn::DataStoreReference
  targetTypes:
    - bpmn::FlowNode
    - bpmn::DataObjectReference
    - bpmn::DataStoreReference
  attributes:
    - id
}

%relationshiptype bpmn::dataObjectRef
{
  sourceTypes:
    - bpmn::DataObjectReference
  targetTypes:
    - bpmn::DataObject
  attributes:
    - id
}

%relationshiptype bpmn::dataStoreRef
{
  sourceTypes:
    - bpmn::DataStoreReference
  targetTypes:
    - bpmn::DataStore
  attributes:
    - id
}

%rule bpmn_start_events_have_no_incoming_sequence_flow
{
  select: "[bpmn::StartEvent]"
  pipeline:
    - bpmn.rules.rejectIncomingSequenceFlow
  severity: error
  message: "BPMN StartEvent must not have incoming sequenceFlow."
}

%rule bpmn_end_events_have_no_outgoing_sequence_flow
{
  select: "[bpmn::EndEvent]"
  pipeline:
    - bpmn.rules.rejectOutgoingSequenceFlow
  severity: error
  message: "BPMN EndEvent must not have outgoing sequenceFlow."
}

%rule bpmn_sequence_flow_connects_flow_nodes
{
  select: "@bpmn::sequenceFlow:*"
  pipeline:
    - requireSourceType: bpmn::FlowNode
    - requireTargetType: bpmn::FlowNode
  severity: error
  message: "BPMN sequenceFlow must connect BPMN FlowNode elements."
}

%rule bpmn_data_references_resolve
{
  select: "ANY([bpmn::DataObjectReference], [bpmn::DataStoreReference])"
  pipeline:
    - bpmn.rules.validateReferencedDataElement
  severity: error
  message: "BPMN data references must resolve to compatible backing data elements."
}

%style [bpmn::Task]
{
  shape: rectangle
}

%style [bpmn::SubProcess]
{
  shape: rounded-rectangle
}

%style [bpmn::StartEvent]
{
  shape: circle
}

%style [bpmn::EndEvent]
{
  shape: circle
  stroke-width: 3
}

%style [bpmn::ExclusiveGateway]
{
  shape: diamond
}

%style [bpmn::DataObjectReference]
{
  shape: document
}

%style [bpmn::DataStoreReference]
{
  shape: cylinder
}

%style @bpmn::sequenceFlow:*
{
  line-style: solid
  marker-end: arrow
}

%style @bpmn::association:*
{
  line-style: dashed
}

%viewpoint bpmn_process_diagram
{
  description: "BPMN semantic MVP view routed to the dedicated BPMN viewer surface."
  pipeline:
    - select: "ANY([bpmn::Task], [bpmn::SubProcess], [bpmn::StartEvent], [bpmn::EndEvent], [bpmn::ExclusiveGateway], [bpmn::DataObjectReference], [bpmn::DataStoreReference])"
    - includeEdges: "ANY(@bpmn::sequenceFlow:*, @bpmn::association:*)"
    - validate: bpmn.rules.basicWellFormedness
    - transform: bpmn.xml
    - render: bpmn.viewer
}`;

export const bpmnSemanticFixtureTexts = Object.freeze({
  profile: bpmnSemanticProfileText,
  linearProcess: `%include ./textforge-bpmn-semantic-mvp.itm
%using textforge_bpmn_semantic_mvp

&defs [bpmn::Definitions] Linear process definitions
{
  id: "Definitions_Linear"
  targetNamespace: "https://example.org/textforge/bpmn/linear"
}

  &process [bpmn::Process] Linear order flow
  {
    id: "Process_Linear"
    isExecutable: "false"
  }

    &start [bpmn::StartEvent] Start
    {
      id: "StartEvent_Linear"
    }

    @bpmn::sequenceFlow:task_receive
    {
      id: "Flow_Start_Receive"
    }

    &task_receive [bpmn::Task] Receive order
    {
      id: "Task_Receive"
    }

    @bpmn::sequenceFlow:task_validate
    {
      id: "Flow_Receive_Validate"
    }

    &task_validate [bpmn::Task] Validate order
    {
      id: "Task_Validate"
    }

    @bpmn::sequenceFlow:end
    {
      id: "Flow_Validate_End"
    }

    &end [bpmn::EndEvent] Complete
    {
      id: "EndEvent_Linear"
    }

%view linear_diagram
{
  viewpoint: bpmn_process_diagram
  title: "Linear order flow"
}`,
  exclusiveGatewayProcess: `%include ./textforge-bpmn-semantic-mvp.itm
%using textforge_bpmn_semantic_mvp

&defs [bpmn::Definitions] Exclusive gateway definitions
{
  id: "Definitions_Gateway"
  targetNamespace: "https://example.org/textforge/bpmn/gateway"
}

  &process [bpmn::Process] Approval flow
  {
    id: "Process_Gateway"
    isExecutable: "true"
  }

    &start [bpmn::StartEvent] Start
    {
      id: "StartEvent_Gateway"
    }

    @bpmn::sequenceFlow:task_review
    {
      id: "Flow_Start_Review"
    }

    &task_review [bpmn::Task] Review request
    {
      id: "Task_Review"
    }

    @bpmn::sequenceFlow:gateway
    {
      id: "Flow_Review_Gateway"
    }

    &gateway [bpmn::ExclusiveGateway] Approved?
    {
      id: "Gateway_Approved"
    }

    @bpmn::sequenceFlow:task_accept
    {
      id: "Flow_Gateway_Accept"
    }

    @bpmn::sequenceFlow:task_rework
    {
      id: "Flow_Gateway_Rework"
    }

    &task_accept [bpmn::Task] Accept request
    {
      id: "Task_Accept"
    }

    @bpmn::sequenceFlow:end
    {
      id: "Flow_Accept_End"
    }

    &task_rework [bpmn::Task] Request rework
    {
      id: "Task_Rework"
    }

    @bpmn::sequenceFlow:end
    {
      id: "Flow_Rework_End"
    }

    &end [bpmn::EndEvent] End
    {
      id: "EndEvent_Gateway"
    }

%view approval_diagram
{
  viewpoint: bpmn_process_diagram
  title: "Approval flow"
}`,
});

export const bundledBpmnReferenceAssets = Object.freeze({
  rawXmlPath: 'docs/examples/bpmn/Training By Design.bpmn',
  convertedItmPath: 'docs/examples/bpmn/training-by-design.lua-pipeline-reference.itm',
  broadProfilePath: 'docs/examples/bpmn/bpmn-process-diagram-lite-profile.itm',
  luaConverterPath: 'docs/examples/bpmn/bpmn-xml-to-itm.lua',
});

const supportedEntityTypes = new Set([
  'bpmn::Definitions',
  'bpmn::Process',
  'bpmn::Task',
  'bpmn::SubProcess',
  'bpmn::StartEvent',
  'bpmn::EndEvent',
  'bpmn::ExclusiveGateway',
  'bpmn::DataObject',
  'bpmn::DataObjectReference',
  'bpmn::DataStore',
  'bpmn::DataStoreReference',
]);

const supportedRelationshipTypes = new Set([
  'bpmn::sequenceFlow',
  'bpmn::association',
  'bpmn::dataObjectRef',
  'bpmn::dataStoreRef',
]);

const bpmnCapabilities = Object.freeze([
  createCapability(bpmnSemanticCapabilityId, {
    localName: 'bpmn.semantic',
    aliases: ['bpmn', 'semantic-bpmn'],
    description: 'Owns the narrowed TextForge BPMN semantic MVP profile and validation helpers.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnRulesCapabilityId, {
    localName: 'bpmn.rules',
    aliases: ['bpmn.basicWellFormedness'],
    description: 'Activates BPMN semantic validation rules for ITM documents using the BPMN MVP profile.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnXmlCapabilityId, {
    localName: 'bpmn.xml',
    aliases: ['bpmn.import', 'bpmn.export'],
    description: 'Owns BPMN XML import/export helpers and diagnostics for the BPMN MVP slice.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnViewerCapabilityId, {
    localName: 'bpmn.viewer',
    aliases: ['bpmn.view'],
    description: 'Owns the read-only BPMN viewer surface and ITM render-target binding.',
    defaultActive: true,
    documentPredicate: bpmnXmlDocumentPredicate,
  }),
  createCapability(bpmnDiCapabilityId, {
    localName: 'bpmn.di',
    aliases: ['bpmndi', 'bpmn.diagram-interchange'],
    description: 'Owns read-only BPMN Diagram Interchange extraction and fidelity helpers.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
]);

const bpmnModdle = new BpmnModdle();

function normalizeMultilineText(source) {
  return String(source ?? '').replace(/\r\n?/gu, '\n');
}

function countBraceDelta(line) {
  let delta = 0;
  let quote = '';
  let escaped = false;

  for (const character of String(line ?? '')) {
    if (quote) {
      if (!escaped && character === quote) {
        quote = '';
      }
      escaped = !escaped && character === '\\';
      continue;
    }

    if (character === '"' || character === '\'') {
      quote = character;
      escaped = false;
      continue;
    }

    if (character === '{') {
      delta += 1;
    } else if (character === '}') {
      delta -= 1;
    }
  }

  return delta;
}

function readRecordString(record, key) {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function coerceRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function normalizeBpmnDiBoundsEntry(entry) {
  const record = coerceRecord(entry);
  const element = readRecordString(record, 'element');
  const x = readFiniteNumber(record?.x);
  const y = readFiniteNumber(record?.y);
  const width = readFiniteNumber(record?.width);
  const height = readFiniteNumber(record?.height);
  if (!element || x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  return {
    element,
    shapeId: readRecordString(record, 'shapeId'),
    x,
    y,
    width,
    height,
  };
}

function normalizeBpmnDiRouteEntry(entry) {
  const record = coerceRecord(entry);
  const relationship = readRecordString(record, 'relationship');
  const waypoints = Array.isArray(record?.waypoints)
    ? record.waypoints
      .map((waypoint) => {
        const item = coerceRecord(waypoint);
        const x = readFiniteNumber(item?.x);
        const y = readFiniteNumber(item?.y);
        return x === undefined || y === undefined ? undefined : { x, y };
      })
      .filter(Boolean)
    : [];
  if (!relationship || waypoints.length === 0) {
    return undefined;
  }

  return {
    relationship,
    edgeId: readRecordString(record, 'edgeId'),
    waypoints,
  };
}

function normalizeBpmnDiLabelBoundsEntry(entry) {
  const record = coerceRecord(entry);
  const element = readRecordString(record, 'element');
  const x = readFiniteNumber(record?.x);
  const y = readFiniteNumber(record?.y);
  const width = readFiniteNumber(record?.width);
  const height = readFiniteNumber(record?.height);
  if (!element || x === undefined || y === undefined || width === undefined || height === undefined) {
    return undefined;
  }

  return {
    element,
    sourceDiElement: readRecordString(record, 'sourceDiElement'),
    x,
    y,
    width,
    height,
  };
}

function createBpmnDiDiagnostic(resource, message, code, severity = 'error') {
  return createDiagnostic(message, severity, {
    code,
    resource,
    origin: {
      packageId: '@textforge/bpmn',
      subsystem: 'bpmn-di',
    },
  });
}

function collectSemanticElementIdentifiers(document) {
  const resolved = toResolvedDocument(document);
  const entityIds = new Set();
  const relationshipIds = new Set();

  for (const entity of resolved.entities ?? []) {
    for (const candidate of [
      entity?.uid,
      entity?.id,
      entity?.localId,
      entity?.qualifiedId,
      entity?.attributes?.values?.id,
    ]) {
      const normalized = String(candidate ?? '').trim();
      if (normalized) {
        entityIds.add(normalized);
      }
    }
  }

  for (const relationship of resolved.relationships ?? []) {
    for (const candidate of [
      relationship?.uid,
      relationship?.id,
      relationship?.attributes?.values?.id,
    ]) {
      const normalized = String(candidate ?? '').trim();
      if (normalized) {
        relationshipIds.add(normalized);
      }
    }
  }

  return { entityIds, relationshipIds };
}

function extractItmViewBlock(sourceText, options = {}) {
  const lines = normalizeMultilineText(sourceText).split('\n');
  const requestedName = String(options.viewName ?? '').trim();
  const requestedStartLine = Number.isInteger(options.startLine) ? options.startLine : undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const match = line.match(/^%view\s+([^\s{]+)/u);
    if (!match) {
      continue;
    }

    const viewName = match[1];
    if (requestedName && viewName !== requestedName) {
      continue;
    }
    if (requestedStartLine && requestedStartLine !== index + 1) {
      continue;
    }

    let openLineIndex = index + 1;
    while (openLineIndex < lines.length && !lines[openLineIndex].includes('{')) {
      openLineIndex += 1;
    }
    if (openLineIndex >= lines.length) {
      throw new Error(`View '${viewName}' does not include a YAML body.`);
    }

    let depth = 0;
    let closeLineIndex = openLineIndex;
    for (; closeLineIndex < lines.length; closeLineIndex += 1) {
      depth += countBraceDelta(lines[closeLineIndex]);
      if (depth === 0) {
        break;
      }
    }
    if (depth !== 0) {
      throw new Error(`View '${viewName}' has an unterminated YAML body.`);
    }

    return {
      viewName,
      startLine: index + 1,
      bodyText: lines.slice(openLineIndex + 1, closeLineIndex).join('\n'),
    };
  }

  throw new Error(requestedName
    ? `View '${requestedName}' was not found in the ITM source.`
    : 'No %view block was found in the ITM source.');
}

function collectModdleElementsById(value, byId, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return;
  }
  seen.add(value);

  if (typeof value.id === 'string' && value.id.trim()) {
    byId.set(value.id, value);
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === '$parent') {
      continue;
    }
    if (Array.isArray(child)) {
      for (const item of child) {
        collectModdleElementsById(item, byId, seen);
      }
      continue;
    }
    collectModdleElementsById(child, byId, seen);
  }
}

function createModdleBounds(bounds) {
  return bpmnModdle.create('dc:Bounds', {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });
}

function createModdleWaypoint(waypoint) {
  return bpmnModdle.create('dc:Point', {
    x: waypoint.x,
    y: waypoint.y,
  });
}

function ensurePlaneElements(plane) {
  if (!Array.isArray(plane.planeElement)) {
    plane.planeElement = [];
  }
  return plane.planeElement;
}

function findPlaneElement(planeElements, diElementId, bpmnElementId) {
  return planeElements.find((entry) =>
    (diElementId && entry?.id === diElementId)
    || (bpmnElementId && entry?.bpmnElement?.id === bpmnElementId));
}

function createBpmnSurfaceIncludeProviders(execution) {
  const includeProviders = [];
  if (execution.workspaceService?.getEntryByPath) {
    includeProviders.push(createWorkspaceItmIncludeProvider(execution.workspaceService, {
      basePath: execution.resource?.path,
      ...(execution.repositoryResolution ?? {}),
    }));
  }
  return includeProviders;
}

function isWindowsAbsolutePath(value) {
  return /^[A-Za-z]:[\\/]/u.test(String(value ?? ''));
}

function normalizePathSegments(segments) {
  const normalized = [];
  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
        normalized.pop();
      }
      continue;
    }
    normalized.push(segment);
  }
  return normalized;
}

function dirnameLikePath(path) {
  const normalized = String(path ?? '').trim();
  if (!normalized) {
    return '';
  }
  const separatorIndex = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  if (separatorIndex < 0) {
    return '';
  }
  if (separatorIndex === 0 && normalized.startsWith('/')) {
    return '/';
  }
  if (separatorIndex === 2 && isWindowsAbsolutePath(normalized)) {
    return normalized.slice(0, 3);
  }
  return normalized.slice(0, separatorIndex);
}

function joinLikePath(basePath, relativePath) {
  const normalizedRelative = String(relativePath ?? '').replaceAll('\\', '/');
  if (basePath.startsWith('/')) {
    const joined = `${basePath.replace(/\/+$/u, '')}/${normalizedRelative}`;
    return `/${normalizePathSegments(joined.split('/')).join('/')}`.replace(/^\/{2,}/u, '/');
  }

  if (isWindowsAbsolutePath(basePath) || basePath.includes('\\')) {
    const normalizedBase = String(basePath ?? '').replaceAll('/', '\\');
    const drivePrefix = normalizedBase.slice(0, 2);
    const baseSegments = normalizedBase.slice(isWindowsAbsolutePath(normalizedBase) ? 2 : 0).split('\\');
    const relativeSegments = normalizedRelative.split('/');
    const combined = normalizePathSegments([...baseSegments, ...relativeSegments]);
    const suffix = combined.join('\\');
    return drivePrefix
      ? `${drivePrefix}\\${suffix}`.replace(/\\{2,}/gu, '\\')
      : suffix;
  }

  return normalizePathSegments(`${basePath}/${normalizedRelative}`.split('/')).join('/');
}

function resolveSiblingResourcePath(basePath, targetPath) {
  const normalizedTarget = String(targetPath ?? '').trim();
  if (!normalizedTarget) {
    return undefined;
  }
  if (normalizedTarget.startsWith('/') || isWindowsAbsolutePath(normalizedTarget)) {
    return normalizedTarget;
  }

  const normalizedBase = String(basePath ?? '').trim();
  if (!normalizedBase) {
    return normalizedTarget;
  }

  return joinLikePath(dirnameLikePath(normalizedBase), normalizedTarget);
}

function readWorkspaceTextResource(workspaceService, path) {
  const entry = workspaceService?.getEntryByPath?.(path);
  if (!entry || entry.kind !== 'resource' || entry.representation !== 'text') {
    return undefined;
  }
  return entry.text;
}

function toResolvedDocument(document) {
  return isResolvedDocument(document) ? document : resolveDocument(document);
}

function appendUniqueDiagnostics(target, diagnostics) {
  const seen = new Set(target.map((diagnostic) =>
    `${diagnostic.code ?? ''}|${diagnostic.severity}|${diagnostic.message}|${diagnostic.entityUid ?? ''}|${diagnostic.relationshipUid ?? ''}`));
  for (const diagnostic of diagnostics) {
    const fingerprint = `${diagnostic.code ?? ''}|${diagnostic.severity}|${diagnostic.message}|${diagnostic.entityUid ?? ''}|${diagnostic.relationshipUid ?? ''}`;
    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    target.push(diagnostic);
  }
  return target;
}

function createBpmnSurfaceDiagnostic(resource, message, code, severity = 'error') {
  return createDiagnostic(message, severity, {
    code,
    resource,
    origin: {
      packageId: '@textforge/bpmn',
      contributionId: bpmnViewerSurfaceId,
      subsystem: 'bpmn-viewer',
    },
  });
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stringifyBpmnWarning(warning) {
  if (!warning) {
    return 'Unknown BPMN XML warning.';
  }
  if (typeof warning === 'string') {
    return warning;
  }
  if (typeof warning.message === 'string' && warning.message.trim()) {
    return warning.message;
  }
  return String(warning);
}

function collectProcessSummaries(definitions) {
  const rootElements = Array.isArray(definitions?.rootElements) ? definitions.rootElements : [];
  return rootElements
    .filter((element) => element?.$type === 'bpmn:Process')
    .map((process) => ({
      id: process.id,
      name: process.name,
      flowElementCount: Array.isArray(process.flowElements) ? process.flowElements.length : 0,
    }));
}

function createBpmnViewerRuntimeMarkup(model) {
  const diagnosticsList = model.diagnostics.length > 0
    ? `<ul class="tf-bpmn-viewer__diagnostics">${model.diagnostics.map((diagnostic) =>
      `<li><strong>${escapeHtml(diagnostic.severity)}</strong> ${escapeHtml(diagnostic.message)}</li>`).join('')}</ul>`
    : '<p class="tf-bpmn-viewer__empty">No diagnostics.</p>';
  return `
    <section class="tf-bpmn-viewer">
      <header class="tf-bpmn-viewer__header">
        <div>
          <span class="tf-bpmn-viewer__eyebrow">BPMN.io viewer</span>
          <h4>${escapeHtml(model.title)}</h4>
        </div>
        <div class="tf-bpmn-viewer__meta">
          <span data-bpmn-summary>${escapeHtml(model.summary)}</span>
          <span data-bpmn-diagnostics>${model.diagnostics.length} diagnostics</span>
        </div>
      </header>
      <div class="tf-bpmn-viewer__toolbar">
        <button type="button" data-bpmn-fit>Fit</button>
        <button type="button" data-bpmn-reset>Reset zoom</button>
      </div>
      <div class="tf-bpmn-viewer__body">
        <div class="tf-bpmn-viewer__stage" data-bpmn-stage></div>
        <aside class="tf-bpmn-viewer__sidebar">
          <section class="tf-bpmn-viewer__panel">
            <h5>Processes</h5>
            <ul class="tf-bpmn-viewer__processes">
              ${model.processes.length > 0
                ? model.processes.map((process) =>
                  `<li><strong>${escapeHtml(process.name ?? process.id ?? 'process')}</strong> <span>${process.flowElementCount} flow elements</span></li>`).join('')
                : '<li class="tf-bpmn-viewer__empty">No process roots were found.</li>'}
            </ul>
          </section>
          <section class="tf-bpmn-viewer__panel">
            <h5>Diagnostics</h5>
            ${diagnosticsList}
          </section>
        </aside>
      </div>
    </section>
  `;
}

export async function createBpmnViewerModelFromXml(xml, options = {}) {
  const diagnostics = [];
  const trimmed = String(xml ?? '').trim();
  if (!trimmed) {
    diagnostics.push(createBpmnSurfaceDiagnostic(
      options.resource,
      'No BPMN XML source is available for this surface.',
      'bpmn.viewer.source-missing',
    ));
    return {
      id: 'bpmn-viewer:empty',
      title: options.title ?? 'BPMN viewer',
      summary: '0 processes / 0 diagrams',
      detail: 'Read-only BPMN XML surface.',
      diagnostics,
      xml: '',
      definitions: undefined,
      processes: [],
      diagramCount: 0,
    };
  }

  try {
    const parsed = await bpmnModdle.fromXML(trimmed);
    const warnings = (parsed.warnings ?? []).map((warning, index) =>
      createBpmnSurfaceDiagnostic(
        options.resource,
        stringifyBpmnWarning(warning),
        `bpmn.viewer.parse-warning-${index + 1}`,
        'warning',
      ));
    appendUniqueDiagnostics(diagnostics, warnings);
    const definitions = parsed.rootElement;
    const processes = collectProcessSummaries(definitions);
    const diagrams = Array.isArray(definitions?.diagrams) ? definitions.diagrams : [];

    return {
      id: `bpmn-viewer:${options.title ?? 'document'}`,
      title: options.title ?? 'BPMN viewer',
      summary: `${processes.length} process${processes.length === 1 ? '' : 'es'} / ${diagrams.length} diagram${diagrams.length === 1 ? '' : 's'}`,
      detail: 'Read-only BPMN XML surface.',
      diagnostics,
      xml: trimmed,
      definitions,
      processes,
      diagramCount: diagrams.length,
    };
  } catch (error) {
    diagnostics.push(createBpmnSurfaceDiagnostic(
      options.resource,
      error?.message ?? 'BPMN XML could not be parsed.',
      'bpmn.viewer.parse-failed',
    ));
    return {
      id: `bpmn-viewer:${options.title ?? 'document'}`,
      title: options.title ?? 'BPMN viewer',
      summary: '0 processes / 0 diagrams',
      detail: 'Read-only BPMN XML surface.',
      diagnostics,
      xml: trimmed,
      definitions: undefined,
      processes: [],
      diagramCount: 0,
    };
  }
}

function mergeBpmnViewerDiagnostics(model, diagnostics, detail) {
  return {
    ...model,
    detail: detail ?? model.detail,
    diagnostics: appendUniqueDiagnostics([...(model.diagnostics ?? [])], diagnostics),
  };
}

function findCandidateBpmnDiView(loaded, resolved, requestedTarget) {
  if (resolved?.projectedDocument?.view?.name) {
    return resolved.projectedDocument.view;
  }

  const viewpointId = String(requestedTarget?.viewpointId ?? resolved?.target?.viewpointId ?? resolved?.target?.id ?? '').trim();
  if (!viewpointId) {
    return undefined;
  }

  const views = [
    ...(loaded?.effectiveResolvedDocument?.views ?? []),
    ...(loaded?.resolvedDocument?.views ?? []),
  ];
  return views.find((view) => view?.viewpointRef === viewpointId);
}

export async function createBpmnViewerModelFromItmSource(sourceText, options = {}) {
  const title = options.title ?? 'BPMN viewer';
  if (!String(sourceText ?? '').trim()) {
    return createBpmnViewerModelFromXml('', {
      title,
      resource: options.resource,
    });
  }

  const loaded = await loadItmDocument(sourceText, {
    strict: false,
    uri: options.resource?.path,
    includeProviders: createBpmnSurfaceIncludeProviders(options),
    repositoryResolution: options.repositoryResolution,
    contributionRegistry: options.contributionRegistry,
    documentResource: {
      path: options.resource?.path,
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: options.resource?.mimeType ?? 'text/x-itm',
    },
  });
  const requestedTarget = options.session?.surfaceState?.itmVisualTarget ?? options.target;
  const resolved = resolveItmVisualTarget(loaded, {
    target: requestedTarget,
    projection: requestedTarget?.projection ?? 'graph',
    title,
  });
  const diagnostics = [...loaded.diagnostics, ...resolved.diagnostics, ...resolved.visualDiagnostics];

  if (resolved.target.available === false) {
    return mergeBpmnViewerDiagnostics(await createBpmnViewerModelFromXml('', {
      title,
      resource: options.resource,
    }), diagnostics, 'BPMN ITM visual target is unavailable.');
  }

  const sourceFile = String(
    loaded.effectiveResolvedDocument?.metadata?.values?.sourceFile
      ?? loaded.effectiveResolvedDocument?.metadata?.sourceFile
      ?? loaded.resolvedDocument?.metadata?.values?.sourceFile
      ?? loaded.resolvedDocument?.metadata?.sourceFile
      ?? loaded.document?.metadata?.values?.sourceFile
      ?? loaded.document?.metadata?.sourceFile
      ?? '',
  ).trim();
  const sourcePath = resolveSiblingResourcePath(options.resource?.path, sourceFile);
  const sourceXml = sourcePath
    ? readWorkspaceTextResource(options.workspaceService, sourcePath)
    : undefined;
  if (!sourceXml) {
    diagnostics.push(createBpmnSurfaceDiagnostic(
      options.resource,
      sourceFile
        ? `Referenced BPMN source '${sourceFile}' could not be loaded for this ITM target.`
        : 'This ITM BPMN target does not declare a sourceFile BPMN XML reference.',
      'bpmn.viewer.source-file-missing',
    ));
  }

  const selectedView = findCandidateBpmnDiView(loaded, resolved, requestedTarget);
  let appliedXml = sourceXml ?? '';
  let provenanceDetail = sourcePath
    ? `Read-only BPMN view sourced from ${sourcePath}.`
    : 'Read-only BPMN view sourced from ITM target metadata.';

  if (selectedView?.name) {
    try {
      const diView = extractBpmnDiagramInterchangeView(sourceText, {
        viewName: selectedView.name,
        startLine: selectedView.sourceRange?.startLine,
      });
      appendUniqueDiagnostics(diagnostics, validateBpmnDiagramInterchangeView(
        diView,
        loaded.effectiveResolvedDocument,
        { resource: options.resource },
      ));
      provenanceDetail = sourcePath
        ? `View ${diView.viewName} via viewpoint ${diView.viewpointRef ?? selectedView.viewpointRef} from ${sourcePath}.`
        : `View ${diView.viewName} via viewpoint ${diView.viewpointRef ?? selectedView.viewpointRef}.`;

      if (appliedXml) {
        const applied = await applyBpmnDiagramInterchangeToXml(appliedXml, diView, {
          resource: options.resource,
        });
        appliedXml = applied.xml;
        appendUniqueDiagnostics(diagnostics, applied.diagnostics);
      }
    } catch (error) {
      diagnostics.push(createBpmnSurfaceDiagnostic(
        options.resource,
        error?.message ?? 'BPMN Diagram Interchange could not be extracted from the ITM view.',
        'bpmn.viewer.di-extraction-failed',
      ));
    }
  } else if (requestedTarget?.kind === 'viewpoint') {
    provenanceDetail = sourcePath
      ? `Viewpoint ${requestedTarget.id} from ${sourcePath}.`
      : `Viewpoint ${requestedTarget.id}.`;
  }

  const model = await createBpmnViewerModelFromXml(appliedXml, {
    title,
    resource: options.resource,
  });
  return mergeBpmnViewerDiagnostics(model, diagnostics, provenanceDetail);
}

export function extractBpmnDiagramInterchangeView(sourceText, options = {}) {
  const extracted = extractItmViewBlock(sourceText, options);
  const parsedBody = coerceRecord(parseYaml(extracted.bodyText)) ?? {};
  const deltas = coerceRecord(parsedBody.deltas) ?? {};

  return {
    viewName: extracted.viewName,
    startLine: extracted.startLine,
    title: readRecordString(parsedBody, 'title'),
    viewpointRef: readRecordString(parsedBody, 'viewpoint'),
    sourceDiagramId: readRecordString(parsedBody, 'sourceDiagramId'),
    sourcePlaneId: readRecordString(parsedBody, 'sourcePlaneId'),
    planeElement: readRecordString(parsedBody, 'planeElement'),
    bounds: Array.isArray(deltas.bounds)
      ? deltas.bounds.map(normalizeBpmnDiBoundsEntry).filter(Boolean)
      : [],
    routes: Array.isArray(deltas.routes)
      ? deltas.routes.map(normalizeBpmnDiRouteEntry).filter(Boolean)
      : [],
    labelBounds: Array.isArray(deltas.labelBounds)
      ? deltas.labelBounds.map(normalizeBpmnDiLabelBoundsEntry).filter(Boolean)
      : [],
  };
}

export function validateBpmnDiagramInterchangeView(view, document, options = {}) {
  const diagnostics = [];
  const { entityIds, relationshipIds } = collectSemanticElementIdentifiers(document);
  const diElementIds = new Set();

  if (view?.planeElement && !entityIds.has(view.planeElement)) {
    diagnostics.push(createBpmnDiDiagnostic(
      options.resource,
      `BPMN DI plane element '${view.planeElement}' does not resolve to a BPMN semantic element.`,
      'bpmn.di.missing-plane-element',
    ));
  }

  for (const entry of view?.bounds ?? []) {
    if (!entityIds.has(entry.element)) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI bounds entry references unknown BPMN element '${entry.element}'.`,
        'bpmn.di.missing-bounds-element',
      ));
    }
    if (entry.shapeId) {
      diElementIds.add(entry.shapeId);
    }
  }

  for (const entry of view?.routes ?? []) {
    if (!relationshipIds.has(entry.relationship)) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI route entry references unknown BPMN relationship '${entry.relationship}'.`,
        'bpmn.di.missing-route-relationship',
      ));
    }
    if (entry.edgeId) {
      diElementIds.add(entry.edgeId);
    }
  }

  for (const entry of view?.labelBounds ?? []) {
    const targetExists = entityIds.has(entry.element) || relationshipIds.has(entry.element);
    if (!targetExists) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI label bounds entry references unknown BPMN element or relationship '${entry.element}'.`,
        'bpmn.di.missing-label-target',
      ));
    }
    if (entry.sourceDiElement && !diElementIds.has(entry.sourceDiElement)) {
      diagnostics.push(createBpmnDiDiagnostic(
        options.resource,
        `BPMN DI label bounds entry references unknown diagram element '${entry.sourceDiElement}'.`,
        'bpmn.di.missing-label-di-element',
        'warning',
      ));
    }
  }

  return diagnostics;
}

export async function applyBpmnDiagramInterchangeToXml(xml, view, options = {}) {
  const diagnostics = [];
  const trimmed = String(xml ?? '').trim();
  if (!trimmed) {
    diagnostics.push(createBpmnDiDiagnostic(
      options.resource,
      'No BPMN XML source is available for BPMN DI application.',
      'bpmn.di.source-missing',
    ));
    return {
      xml: '',
      diagnostics,
    };
  }

  try {
    const parsed = await bpmnModdle.fromXML(trimmed);
    const warnings = (parsed.warnings ?? []).map((warning, index) =>
      createBpmnDiDiagnostic(
        options.resource,
        stringifyBpmnWarning(warning),
        `bpmn.di.parse-warning-${index + 1}`,
        'warning',
      ));
    appendUniqueDiagnostics(diagnostics, warnings);

    const definitions = parsed.rootElement;
    const byId = new Map();
    collectModdleElementsById(definitions, byId);
    const diagrams = Array.isArray(definitions.diagrams) ? definitions.diagrams : [];
    if (!Array.isArray(definitions.diagrams)) {
      definitions.diagrams = diagrams;
    }

    let diagram = diagrams.find((entry) =>
      (view?.sourceDiagramId && entry?.id === view.sourceDiagramId))
      ?? diagrams[0];
    if (!diagram) {
      diagram = bpmnModdle.create('bpmndi:BPMNDiagram', {
        id: view?.sourceDiagramId ?? 'BPMNDiagram_1',
      });
      diagrams.push(diagram);
    }
    if (view?.sourceDiagramId) {
      diagram.id = view.sourceDiagramId;
    }

    let plane = diagram.plane;
    if (!plane) {
      plane = bpmnModdle.create('bpmndi:BPMNPlane', {
        id: view?.sourcePlaneId ?? `${diagram.id ?? 'BPMNDiagram_1'}_plane`,
      });
      diagram.plane = plane;
    }
    if (view?.sourcePlaneId) {
      plane.id = view.sourcePlaneId;
    }
    if (view?.planeElement && byId.has(view.planeElement)) {
      plane.bpmnElement = byId.get(view.planeElement);
    }

    const planeElements = ensurePlaneElements(plane);
    const diElementsById = new Map();
    const diElementsByElementId = new Map();

    for (const entry of view?.bounds ?? []) {
      const bpmnElement = byId.get(entry.element);
      if (!bpmnElement) {
        diagnostics.push(createBpmnDiDiagnostic(
          options.resource,
          `Skipped BPMN DI bounds for missing BPMN element '${entry.element}'.`,
          'bpmn.di.apply-missing-bounds-element',
          'warning',
        ));
        continue;
      }

      let shape = findPlaneElement(planeElements, entry.shapeId, entry.element);
      if (!shape) {
        shape = bpmnModdle.create('bpmndi:BPMNShape', {
          id: entry.shapeId ?? `${entry.element}_di`,
          bpmnElement,
        });
        planeElements.push(shape);
      }

      shape.id = entry.shapeId ?? shape.id ?? `${entry.element}_di`;
      shape.bpmnElement = bpmnElement;
      shape.bounds = createModdleBounds(entry);
      diElementsById.set(shape.id, shape);
      diElementsByElementId.set(entry.element, shape);
    }

    for (const entry of view?.routes ?? []) {
      const bpmnElement = byId.get(entry.relationship);
      if (!bpmnElement) {
        diagnostics.push(createBpmnDiDiagnostic(
          options.resource,
          `Skipped BPMN DI route for missing BPMN relationship '${entry.relationship}'.`,
          'bpmn.di.apply-missing-route-relationship',
          'warning',
        ));
        continue;
      }

      let edge = findPlaneElement(planeElements, entry.edgeId, entry.relationship);
      if (!edge) {
        edge = bpmnModdle.create('bpmndi:BPMNEdge', {
          id: entry.edgeId ?? `${entry.relationship}_di`,
          bpmnElement,
        });
        planeElements.push(edge);
      }

      edge.id = entry.edgeId ?? edge.id ?? `${entry.relationship}_di`;
      edge.bpmnElement = bpmnElement;
      edge.waypoint = entry.waypoints.map(createModdleWaypoint);
      diElementsById.set(edge.id, edge);
      diElementsByElementId.set(entry.relationship, edge);
    }

    for (const entry of view?.labelBounds ?? []) {
      const target = (entry.sourceDiElement && diElementsById.get(entry.sourceDiElement))
        || diElementsByElementId.get(entry.element);
      if (!target) {
        diagnostics.push(createBpmnDiDiagnostic(
          options.resource,
          `Skipped BPMN DI label bounds for missing target '${entry.element}'.`,
          'bpmn.di.apply-missing-label-target',
          'warning',
        ));
        continue;
      }

      if (!target.label) {
        target.label = bpmnModdle.create('bpmndi:BPMNLabel', {});
      }
      target.label.bounds = createModdleBounds(entry);
    }

    const serialized = await bpmnModdle.toXML(definitions, { format: true });
    return {
      xml: serialized.xml,
      diagnostics,
    };
  } catch (error) {
    diagnostics.push(createBpmnDiDiagnostic(
      options.resource,
      error?.message ?? 'BPMN Diagram Interchange could not be applied to the XML source.',
      'bpmn.di.apply-failed',
    ));
    return {
      xml: trimmed,
      diagnostics,
    };
  }
}

function createBpmnViewerFailureHtml(title, message) {
  return `
    <section class="tf-bpmn-viewer tf-bpmn-viewer--error">
      <header class="tf-bpmn-viewer__header">
        <div>
          <span class="tf-bpmn-viewer__eyebrow">BPMN.io viewer</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
      </header>
      <div class="tf-bpmn-viewer__body tf-bpmn-viewer__body--message">
        <p class="tf-bpmn-viewer__message">${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

async function mountBpmnViewerRuntime(container, model) {
  container.innerHTML = createBpmnViewerRuntimeMarkup(model);
  const stage = container.querySelector('[data-bpmn-stage]');
  const fitButton = container.querySelector('[data-bpmn-fit]');
  const resetButton = container.querySelector('[data-bpmn-reset]');

  if (!stage || !fitButton || !resetButton) {
    container.innerHTML = createBpmnViewerFailureHtml(model.title, 'BPMN viewer UI failed to initialize.');
    return () => {
      container.innerHTML = '';
    };
  }

  try {
    await import('bpmn-js/dist/assets/diagram-js.css');
    await import('bpmn-js/dist/assets/bpmn-js.css');
    await import('bpmn-js/dist/assets/bpmn-font/css/bpmn.css');
    const { default: NavigatedViewer } = await import('bpmn-js/lib/NavigatedViewer');
    const viewer = new NavigatedViewer({
      container: stage,
      additionalModules: [],
    });
    await viewer.importXML(model.xml);
    viewer.get('canvas')?.zoom('fit-viewport', 'auto');

    const handleFit = () => viewer.get('canvas')?.zoom('fit-viewport', 'auto');
    const handleReset = () => viewer.get('canvas')?.zoom(1);
    fitButton.addEventListener('click', handleFit);
    resetButton.addEventListener('click', handleReset);

    return () => {
      fitButton.removeEventListener('click', handleFit);
      resetButton.removeEventListener('click', handleReset);
      viewer.destroy();
      container.innerHTML = '';
    };
  } catch (error) {
    container.innerHTML = createBpmnViewerFailureHtml(model.title, error?.message ?? 'BPMN.io failed to load.');
    return () => {
      container.innerHTML = '';
    };
  }
}

async function resolveBpmnViewerSurfaceModel(execution, title) {
  const isItmResource = execution.resource?.languageId === 'itm'
    || execution.resource?.mimeType === 'text/itm'
    || execution.resource?.mimeType === 'text/x-itm';
  if (isItmResource) {
    return createBpmnViewerModelFromItmSource(execution.sourceText ?? '', {
      title,
      resource: execution.resource,
      workspaceService: execution.workspaceService,
      repositoryResolution: execution.repositoryResolution,
      contributionRegistry: execution.contributionRegistry,
      session: execution.session,
    });
  }

  return createBpmnViewerModelFromXml(execution.sourceText ?? '', {
    title,
    resource: execution.resource,
  });
}

export function collectBpmnMvpScopeDiagnostics(document) {
  const resolved = toResolvedDocument(document);
  const diagnostics = [];

  for (const entity of resolved.entities) {
    if (!entity.typeRef || !entity.typeRef.startsWith('bpmn::')) {
      continue;
    }
    if (supportedEntityTypes.has(entity.typeRef)) {
      continue;
    }
    diagnostics.push(createDiagnostic(
      `BPMN semantic MVP does not include entity type '${entity.typeRef}'.`,
      'error',
      {
        code: 'bpmn.mvp.out-of-scope-type',
        origin: {
          packageId: '@textforge/bpmn',
          capabilityId: bpmnSemanticCapabilityId,
          subsystem: 'semantic-mvp',
        },
      },
    ));
  }

  for (const relationship of resolved.relationships) {
    if (!relationship.typeRef || !relationship.typeRef.startsWith('bpmn::')) {
      continue;
    }
    if (supportedRelationshipTypes.has(relationship.typeRef)) {
      continue;
    }
    diagnostics.push(createDiagnostic(
      `BPMN semantic MVP does not include relationship type '${relationship.typeRef}'.`,
      'error',
      {
        code: 'bpmn.mvp.out-of-scope-relationship',
        origin: {
          packageId: '@textforge/bpmn',
          capabilityId: bpmnSemanticCapabilityId,
          subsystem: 'semantic-mvp',
        },
      },
    ));
  }

  return diagnostics;
}

export function validateBpmnSemanticDocument(document, options = {}) {
  const diagnostics = [];
  appendUniqueDiagnostics(diagnostics, validateItmDocument(document, options));
  appendUniqueDiagnostics(diagnostics, validateBpmnRules(document));
  appendUniqueDiagnostics(diagnostics, collectBpmnMvpScopeDiagnostics(document));
  return diagnostics;
}

export async function loadBpmnSemanticFixture(name, options = {}) {
  const fixtureText = bpmnSemanticFixtureTexts[name];
  if (!fixtureText) {
    throw new Error(`Unknown BPMN semantic fixture: ${name}`);
  }

  const uri = options.uri ?? `/packages/bpmn/${name}.itm`;
  const includeProviders = [
    {
      name: 'textforge-bpmn-semantic-mvp',
      load(target) {
        if (target === './textforge-bpmn-semantic-mvp.itm' || target === 'textforge-bpmn-semantic-mvp.itm') {
          return {
            text: bpmnSemanticProfileText,
            uri: '/packages/bpmn/textforge-bpmn-semantic-mvp.itm',
          };
        }
        return undefined;
      },
    },
    ...(options.includeProviders ?? []),
  ];
  return loadItmDocument(fixtureText, {
    strict: false,
    includeStdProfiles: false,
    uri,
    includeProviders,
    ...options,
  });
}

export async function loadBpmnSemanticProfile(options = {}) {
  return loadItmDocument(bpmnSemanticProfileText, {
    strict: false,
    includeStdProfiles: false,
    uri: options.uri ?? '/packages/bpmn/textforge-bpmn-semantic-mvp.itm',
    ...options,
  });
}

export function importBpmnSemanticXmlResult(xml, options = {}) {
  const result = importBpmnXmlResult(xml, options);
  if (result.value) {
    appendUniqueDiagnostics(result.diagnostics, collectBpmnMvpScopeDiagnostics(result.value));
  }
  return result;
}

export const bpmnViewerSurfaceContribution = {
  id: bpmnViewerSurfaceId,
  label: 'BPMN viewer',
  description: 'Open BPMN XML in a read-only BPMN.io viewer surface.',
  kind: 'visual-runtime',
  localName: 'bpmn',
  capabilities: [bpmnViewerCapabilityId],
  readOnly: true,
  defaultActive: true,
  resourcePredicate: bpmnViewerSurfaceDocumentPredicate,
  documentPredicate: bpmnViewerSurfaceDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['bpmn-xml', 'itm'],
  mimeTypes: ['application/bpmn+xml', 'text/itm', 'text/x-itm'],
  fileExtensions: ['bpmn', 'itm'],
  placements: ['main', 'popup'],
  openWithPriority: 92,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'BPMN viewer';
    const placeholderHtml = createBpmnViewerFailureHtml(title, 'Resolving BPMN XML...');

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}`,
      summary: 'Resolving the BPMN.io viewer surface.',
      detail: 'Read-only BPMN XML viewer',
      readOnly: true,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'BPMN surface',
          rows: [
            { label: 'Renderer', value: 'bpmn-js' },
            { label: 'Mode', value: 'Read-only' },
          ],
        },
      ],
      surface: {
        model: {
          html: placeholderHtml,
          diagnostics: [],
        },
        mount(container) {
          let disposed = false;
          let disposeRuntime = () => {};
          container.innerHTML = placeholderHtml;

          void (async () => {
            try {
              const model = await resolveBpmnViewerSurfaceModel(execution, title);
              if (disposed) {
                return;
              }
              this.model.diagnostics = model.diagnostics;
              this.model.html = createBpmnViewerRuntimeMarkup(model);
              disposeRuntime = await mountBpmnViewerRuntime(container, model);
            } catch (error) {
              if (!disposed) {
                this.model.diagnostics = [
                  createBpmnSurfaceDiagnostic(
                    execution.resource,
                    error?.message ?? 'BPMN viewer resolution failed.',
                    'bpmn.viewer.resolve-failed',
                  ),
                ];
                this.model.html = createBpmnViewerFailureHtml(title, error?.message ?? 'BPMN viewer resolution failed.');
                container.innerHTML = this.model.html;
              }
            }
          })();

          return () => {
            disposed = true;
            disposeRuntime();
            container.innerHTML = '';
          };
        },
      },
    };
  },
};

export function createBpmnContributionManifest(overrides = {}) {
  return createContributionManifest('@textforge/bpmn', {
    name: '@textforge/bpmn',
    version: '0.1.0',
    description: 'BPMN semantic MVP, read-only viewer, Diagram Interchange fidelity, and ITM integration for TextForge.',
    dependencies: [
      '@textforge/core',
      '@textforge/itm',
      ...(overrides.dependencies ?? []),
    ],
    capabilities: bpmnCapabilities,
    surfaces: overrides.surfaces ?? [bpmnViewerSurfaceContribution],
    pipelines: overrides.pipelines ?? [],
  });
}

export const contributions = createBpmnContributionManifest();
