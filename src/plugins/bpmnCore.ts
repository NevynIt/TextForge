import type { TextForgePlugin } from "../domain/types";

type BpmnViewerModule = typeof import("bpmn-js/lib/Viewer");

interface BpmnSvgViewerInstance {
  importXML(xml: string): Promise<{ warnings?: unknown[] }>;
  saveSVG(): Promise<{ svg: string }>;
  destroy(): void;
}

async function renderBpmnSvg(xml: string): Promise<string> {
  const host = document.createElement("div");
  host.style.position = "absolute";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "1600px";
  host.style.height = "1200px";
  host.style.pointerEvents = "none";
  document.body.append(host);

  let viewer: BpmnSvgViewerInstance | null = null;
  try {
    const module = (await import("bpmn-js/lib/Viewer")) as BpmnViewerModule;
    const ViewerCtor = module.default;
    viewer = new ViewerCtor({ container: host }) as unknown as BpmnSvgViewerInstance;
    await viewer.importXML(xml);
    const result = await viewer.saveSVG();
    return result.svg;
  } finally {
    viewer?.destroy();
    host.remove();
  }
}

const plugin: TextForgePlugin = {
  id: "bpmn-core",
  name: "BPMN Core",
  version: "0.1.0",
  transformers: [
    {
      kind: "transformer",
      id: "bpmn-to-svg",
      name: "BPMN 2.0 XML to SVG",
      input: "text.bpmn",
      output: "svg",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("BPMN SVG transformer requires XML text input.");
        }
        await context.runtime.load("bpmn-js-viewer", () => import("bpmn-js/lib/Viewer"));
        const svg = await renderBpmnSvg(value.text);
        return { kind: "svg", svg, diagnostics: value.diagnostics };
      }
    }
  ],
  viewers: [
    {
      kind: "viewer",
      id: "bpmn-viewer",
      name: "BPMN Diagram Viewer",
      input: "text.bpmn",
      capabilities: { zoom: true, pan: true, export: true },
      render(value) {
        if (value.kind !== "text") {
          throw new Error("BPMN viewer requires XML text input.");
        }
        return {
          kind: "bpmn",
          title: "BPMN Diagram Viewer",
          xml: value.text,
          capabilities: { zoom: true, pan: true, export: true },
          diagnostics: value.diagnostics
        };
      }
    }
  ]
};

export default plugin;