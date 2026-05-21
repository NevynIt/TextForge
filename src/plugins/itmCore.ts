import type { TextForgePlugin } from "../domain/types";
import { indentedTreeToGraph, parseIndentedTreeAsync, parseItmValueAsync } from "../parsers/itm";

const plugin: TextForgePlugin = {
  id: "itm-core",
  name: "Indented Text Model Core",
  version: "0.1.0",
  linters: [
    {
      kind: "linter",
      id: "itm-linter",
      name: "Indented Text Model Parser",
      accepts: "text.itm",
      async lint(document, context) {
        return (await parseItmValueAsync(document.text, document.languageId, {
          currentDocumentId: document.id,
          currentFileName: document.fileName,
          includeDocuments: context.documents || []
        })).diagnostics || [];
      }
    }
  ],
  transformers: [
    {
      kind: "transformer",
      id: "itm-parse",
      name: "ITM Parse",
      input: "text.itm",
      output: "model.itm",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("ITM parser requires text input.");
        }
        const parsed = await parseItmValueAsync(value.text, value.languageId, {
          currentDocumentId: value.documentId,
          currentFileName: value.fileName,
          includeDocuments: context.documents || []
        });
        return {
          ...parsed,
          diagnostics: [...(value.diagnostics || []), ...(parsed.diagnostics || [])]
        };
      }
    },
    {
      kind: "transformer",
      id: "itm-to-tree",
      name: "ITM to Tree Model",
      input: "text.itm",
      output: "model.tree",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("ITM tree transformer requires text input.");
        }
        const parsed = await parseIndentedTreeAsync(value.text, value.languageId, {
          currentDocumentId: value.documentId,
          currentFileName: value.fileName,
          includeDocuments: context.documents || []
        });
        return {
          kind: "model",
          modelType: "model.tree",
          data: parsed.nodes,
          diagnostics: [...(value.diagnostics || []), ...parsed.diagnostics]
        };
      }
    },
    {
      kind: "transformer",
      id: "itm-to-graph",
      name: "ITM to Graph Model",
      input: "text.itm",
      output: "model.graph",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("ITM graph transformer requires text input.");
        }
        const parsed = await parseIndentedTreeAsync(value.text, value.languageId, {
          currentDocumentId: value.documentId,
          currentFileName: value.fileName,
          includeDocuments: context.documents || []
        });
        return {
          kind: "model",
          modelType: "model.graph",
          data: indentedTreeToGraph(parsed.nodes),
          diagnostics: [...(value.diagnostics || []), ...parsed.diagnostics]
        };
      }
    }
  ]
};

export default plugin;
