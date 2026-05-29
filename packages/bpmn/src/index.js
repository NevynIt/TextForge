import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createResourcePredicate,
} from '@textforge/core';
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
    surfaces: overrides.surfaces ?? [],
    pipelines: overrides.pipelines ?? [],
  });
}

export const contributions = createBpmnContributionManifest();
