import type { TextForgePlugin } from "../domain/types";
import { jsonToTree } from "../parsers/jsonTree";

const plugin: TextForgePlugin = {
  id: "json-core",
  name: "JSON Core",
  version: "0.1.0",
  linters: [
    {
      kind: "linter",
      id: "json-linter",
      name: "JSON Parser",
      accepts: "text.json",
      lint(document) {
        try {
          JSON.parse(document.text);
          return [];
        } catch (error) {
          return [
            {
              source: "json-parser",
              severity: "error",
              languageId: document.languageId,
              message: error instanceof Error ? error.message : String(error)
            }
          ];
        }
      }
    }
  ],
  transformers: [
    {
      kind: "transformer",
      id: "json-to-tree",
      name: "JSON to Tree",
      input: "text.json",
      output: "model.tree",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("JSON transformer requires text input.");
        }
        const parsed = JSON.parse(value.text);
        return {
          kind: "model",
          modelType: "model.tree",
          data: [jsonToTree(parsed)],
          diagnostics: value.diagnostics
        };
      }
    }
  ]
};

export default plugin;
