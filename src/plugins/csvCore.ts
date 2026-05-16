import type { TextForgePlugin } from "../domain/types";
import { parseDelimited } from "../parsers/csv";

const plugin: TextForgePlugin = {
  id: "csv-core",
  name: "CSV/TSV Core",
  version: "0.1.0",
  linters: [
    {
      kind: "linter",
      id: "delimited-linter",
      name: "Delimited Table Parser",
      accepts: ["text.csv", "text.tsv"],
      lint(document) {
        return parseDelimited(document.text, document.languageId === "text.tsv" ? "\t" : ",", document.languageId).diagnostics || [];
      }
    }
  ],
  transformers: [
    {
      kind: "transformer",
      id: "delimited-to-table",
      name: "Delimited Text to Table",
      input: ["text.csv", "text.tsv"],
      output: "model.table",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("Delimited table transformer requires text input.");
        }
        const table = parseDelimited(value.text, value.languageId === "text.tsv" ? "\t" : ",", value.languageId);
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

export default plugin;
