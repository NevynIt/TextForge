import type { TextForgePlugin } from "../domain/types";
import { extractMarkdownHeadingTree } from "../parsers/markdown";

const plugin: TextForgePlugin = {
  id: "markdown-core",
  name: "Markdown Core",
  version: "0.1.0",
  transformers: [
    {
      kind: "transformer",
      id: "markdown-to-html",
      name: "Markdown to HTML",
      input: "text.markdown",
      output: "html",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("Markdown transformer requires text input.");
        }
        const mod = await context.runtime.load("markdown-it", () => import("markdown-it"));
        const MarkdownIt = mod.default;
        const markdown = new MarkdownIt({
          html: false,
          linkify: true,
          typographer: true
        });
        return {
          kind: "html",
          html: `<article class="rendered-markdown">${markdown.render(value.text)}</article>`,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "transformer",
      id: "markdown-heading-tree",
      name: "Markdown Heading Tree",
      input: "text.markdown",
      output: "model.tree",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("Markdown heading extraction requires text input.");
        }
        return {
          kind: "model",
          modelType: "model.tree",
          data: extractMarkdownHeadingTree(value.text),
          diagnostics: value.diagnostics
        };
      }
    }
  ]
};

export default plugin;
