import type { TextForgePlugin } from "../domain/types";
import { dotToGraph } from "../parsers/dot";

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
        const mod = await context.runtime.load("mermaid", () => import("mermaid"));
        const mermaid = mod.default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
        const id = `textforge-mermaid-${Math.random().toString(36).slice(2)}`;
        const rendered = await mermaid.render(id, value.text);
        return { kind: "svg", svg: rendered.svg, diagnostics: value.diagnostics };
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
        const mod = await context.runtime.load("@viz-js/viz", () => import("@viz-js/viz"));
        const viz = await mod.instance();
        const element = viz.renderSVGElement(value.text);
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
