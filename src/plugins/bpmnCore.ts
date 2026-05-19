import type { TextForgePlugin } from "../domain/types";

const plugin: TextForgePlugin = {
  id: "bpmn-core",
  name: "BPMN Core",
  version: "0.1.0",
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