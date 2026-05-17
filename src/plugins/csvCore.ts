import type { TextForgePlugin } from "../domain/types";
import { parseDelimited } from "../parsers/csv";

const plugin: TextForgePlugin = {
  id: "csv-core",
  name: "Delimited Text Core",
  version: "0.1.0",
  linters: [
    {
      kind: "linter",
      id: "delimited-linter",
      name: "Delimited Table Parser",
      accepts: "text.csv",
      lint(document) {
        return parseDelimited(document.text, inferDelimiter(document.text), document.languageId).diagnostics || [];
      }
    }
  ],
  transformers: [
    {
      kind: "transformer",
      id: "delimited-to-table",
      name: "Delimited Text to Table",
      input: "text.csv",
      output: "model.table",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("Delimited table transformer requires text input.");
        }
        const table = parseDelimited(value.text, inferDelimiter(value.text), value.languageId);
        return {
          kind: "model",
          modelType: "model.table",
          data: table,
          diagnostics: [...(value.diagnostics || []), ...(table.diagnostics || [])]
        };
      }
    }
  ]
};

function inferDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const candidates = [",", "\t", ";", "|"];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length - 1 }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter || ",";
}

export default plugin;
