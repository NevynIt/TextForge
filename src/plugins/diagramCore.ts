import type { TextForgePlugin } from "../domain/types";
import { dotToGraph } from "../parsers/dot";
import mermaid from "mermaid";
import * as viz from "@viz-js/viz";
import { renderMermaidSvg } from "./renderMermaidSvg";

const plugin: TextForgePlugin = {
  id: "diagram-core",
  name: "Diagram Core",
  version: "0.1.0",
  transformers: [
    {
      kind: "transformer",
      id: "mermaid-to-svg",
      name: "Mermaid to SVG",
      input: "text.mermaid",
      output: "svg",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("Mermaid transformer requires text input.");
        }
        await context.runtime.load("mermaid", () => Promise.resolve(mermaid));
        const id = `textforge-mermaid-${Math.random().toString(36).slice(2)}`;
        const svg = await renderMermaidSvg(id, value.text);
        return { kind: "svg", svg, diagnostics: value.diagnostics };
      }
    },
    {
      kind: "transformer",
      id: "graphviz-dot-to-svg",
      name: "Graphviz DOT to SVG",
      input: "text.graphviz-dot",
      output: "svg",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("Graphviz transformer requires text input.");
        }
        const runtime = await context.runtime.load("@viz-js/viz", () => viz.instance());
        const element = runtime.renderSVGElement(value.text);
        return { kind: "svg", svg: element.outerHTML, diagnostics: value.diagnostics };
      }
    },
    {
      kind: "transformer",
      id: "graphviz-dot-to-graph",
      name: "Graphviz DOT to Graph Model",
      input: "text.graphviz-dot",
      output: "model.graph",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("DOT graph transformer requires text input.");
        }
        const graph = dotToGraph(value.text);
        if (!graph.nodes.length) {
          graph.nodes.push({ id: "dot-source", label: "DOT source", type: "source" });
          graph.diagnostics = [
            {
              source: "dot-parser",
              severity: "observation",
              languageId: value.languageId,
              message: "No explicit edges were found; showing a placeholder graph."
            }
          ];
        }
        return {
          kind: "model",
          modelType: "model.graph",
          data: graph,
          diagnostics: [...(value.diagnostics || []), ...(graph.diagnostics || [])]
        };
      }
    }
  ]
};

export default plugin;
