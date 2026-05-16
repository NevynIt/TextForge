import type { TextForgePlugin } from "../domain/types";
import { parseXmlTree } from "../parsers/xmlTree";

const plugin: TextForgePlugin = {
  id: "xml-core",
  name: "XML Core",
  version: "0.1.0",
  linters: [
    {
      kind: "linter",
      id: "xml-linter",
      name: "XML Parser",
      accepts: "text.xml",
      lint(document) {
        return parseXmlTree(document.text, document.languageId).diagnostics;
      }
    }
  ],
  transformers: [
    {
      kind: "transformer",
      id: "xml-to-tree",
      name: "XML to Tree",
      input: "text.xml",
      output: "model.tree",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("XML transformer requires text input.");
        }
        const parsed = parseXmlTree(value.text, value.languageId);
        return {
          kind: "model",
          modelType: "model.tree",
          data: parsed.nodes,
          diagnostics: [...(value.diagnostics || []), ...parsed.diagnostics]
        };
      }
    }
  ]
};

export default plugin;
