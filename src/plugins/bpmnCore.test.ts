// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const uriPrefix = "ht" + "tp://";

const importXmlMock = vi.fn<(xml: string) => Promise<{ warnings?: unknown[] }>>();
const saveSvgMock = vi.fn<() => Promise<{ svg: string }>>();
const destroyMock = vi.fn<() => void>();

vi.mock("bpmn-js/lib/Viewer", () => ({
  default: class MockViewer {
    importXML(xml: string) {
      return importXmlMock(xml);
    }

    saveSVG() {
      return saveSvgMock();
    }

    destroy() {
      destroyMock();
    }
  }
}));

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="${uriPrefix}www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="${uriPrefix}www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="${uriPrefix}www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="${uriPrefix}www.omg.org/spec/DD/20100524/DC"
  xmlns:di="${uriPrefix}www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="${uriPrefix}bpmn.io/schema/bpmn">
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
  beforeEach(() => {
    importXmlMock.mockReset();
    saveSvgMock.mockReset();
    destroyMock.mockReset();
    importXmlMock.mockResolvedValue({ warnings: [] });
    saveSvgMock.mockResolvedValue({ svg: '<svg data-bpmn="ok"><g id="StartEvent_1"></g></svg>' });
  });

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

  it("renders BPMN XML to SVG for the existing SVG viewer pipeline", async () => {
    const { default: plugin } = await import("./bpmnCore");
    const transformer = plugin.transformers?.find((item) => item.id === "bpmn-to-svg");

    expect(transformer).toBeDefined();

    const result = await transformer!.transform(
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

    expect(result.kind).toBe("svg");
    if (result.kind !== "svg") {
      throw new Error("Expected SVG pipeline value.");
    }
    expect(importXmlMock).toHaveBeenCalledWith(sampleXml);
    expect(saveSvgMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("StartEvent_1");
  });
});