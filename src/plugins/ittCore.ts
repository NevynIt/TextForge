import type { TextForgePlugin } from "../domain/types";
import { indentedTreeToGraph, parseIndentedTree } from "../parsers/itt";

const plugin: TextForgePlugin = {
  id: "itt-core",
  name: "Indented Tree Core",
  version: "0.1.0",
  linters: [
    {
      kind: "linter",
      id: "itt-linter",
      name: "Indented Tree Parser",
      accepts: "text.indented-tree",
      lint(document, context) {
        return parseIndentedTree(document.text, document.languageId, {
          currentDocumentId: document.id,
          currentFileName: document.fileName,
          includeDocuments: context.documents || []
        }).diagnostics;
      }
    }
  ],
  transformers: [
    {
      kind: "transformer",
      id: "itt-to-tree",
      name: "ITT to Tree Model",
      input: "text.indented-tree",
      output: "model.tree",
      transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("ITT tree transformer requires text input.");
        }
        const parsed = parseIndentedTree(value.text, value.languageId, {
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
      id: "itt-to-graph",
      name: "ITT to Graph Model",
      input: "text.indented-tree",
      output: "model.graph",
      transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("ITT graph transformer requires text input.");
        }
        const parsed = parseIndentedTree(value.text, value.languageId, {
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
