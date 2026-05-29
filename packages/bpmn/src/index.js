import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createResourcePredicate,
} from '@textforge/core';
import BpmnModdle from 'bpmn-moddle';
import {
  importBpmnXmlResult,
  isResolvedDocument,
  loadItmDocument,
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
  mimeTypes: ['application/bpmn+xml', 'text/itm', 'text/x-itm'],
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
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnDiCapabilityId, {
    localName: 'bpmn.di',
    aliases: ['bpmndi', 'bpmn.diagram-interchange'],
    description: 'Owns read-only BPMN Diagram Interchange extraction and fidelity helpers.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
]);

const bpmnModdle = new BpmnModdle();

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
  const model = await createBpmnViewerModelFromXml(execution.sourceText ?? '', {
    title,
    resource: execution.resource,
  });
  return model;
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
