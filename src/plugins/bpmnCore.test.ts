import { describe, expect, it } from "vitest";

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="urn:test:xsi"
  xmlns:bpmn="urn:test:bpmn:model"
  xmlns:bpmndi="urn:test:bpmn:di"
  xmlns:dc="urn:test:dc"
  xmlns:di="urn:test:di"
  id="Definitions_1"
  targetNamespace="urn:test:textforge:bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

describe("bpmnCore", () => {
  it("returns a BPMN viewer result for BPMN XML text", async () => {
    const { default: plugin } = await import("./bpmnCore");
    const viewer = plugin.viewers?.find((item) => item.id === "bpmn-viewer");

    expect(viewer).toBeDefined();

    const result = await viewer!.render(
      {
        kind: "text",
        languageId: "text.bpmn",
        text: sampleXml
      },
      {
        runtime: {
          load: async (_id, loader) => loader()
        }
      }
    );

    expect(result.kind).toBe("bpmn");
    if (result.kind !== "bpmn") {
      throw new Error("Expected BPMN viewer result.");
    }
    expect(result.title).toBe("BPMN Diagram Viewer");
    expect(result.xml).toContain("<bpmn:definitions");
    expect(result.capabilities).toMatchObject({ zoom: true, pan: true, export: true });
  });
});