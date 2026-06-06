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
