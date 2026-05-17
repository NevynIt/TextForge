import type { PipelineValue, TextDocument, TextForgePlugin } from "../domain/types";
import type { LuaActionDescriptor, LuaAvailableAction } from "./types";
import { LuaTransformService } from "./luaTransformService";

export interface RegisteredLuaAction extends LuaAvailableAction {
  pipelineId: string;
  transformerId: string;
}

export async function buildLuaActionsPlugin(
  documents: TextDocument[],
  service: LuaTransformService
): Promise<{ plugin: TextForgePlugin; actions: RegisteredLuaAction[] }> {
  const luaDocuments = documents.filter((document) => document.languageId === "text.lua" || document.fileName.toLowerCase().endsWith(".lua"));
  const actions: RegisteredLuaAction[] = [];
  for (const document of luaDocuments) {
    const descriptors = await service.inspectActions({
      source: document.text,
      fileName: document.fileName,
      input: { kind: "text", languageId: "text.plain", text: "" },
      documents
    });
    descriptors.forEach((descriptor, index) => {
      const actionId = descriptor.id || `${document.id}-${index + 1}`;
      actions.push({
        ...descriptor,
        id: actionId,
        source: document.text,
        fileName: document.fileName,
        documentId: document.id,
        documentName: document.fileName,
        pipelineId: `lua-pipeline-${document.id}-${actionId}`,
        transformerId: `lua-transformer-${document.id}-${actionId}`
      });
    });
  }
  return {
    actions,
    plugin: createLuaActionsPlugin(actions, documents, service)
  };
}

function createLuaActionsPlugin(actions: RegisteredLuaAction[], documents: TextDocument[], service: LuaTransformService): TextForgePlugin {
  return {
    id: "lua-actions",
    name: "Lua Actions",
    version: "0.1.0",
    transformers: actions.map((action) => ({
      kind: "transformer",
      id: action.transformerId,
      name: action.name,
      input: action.input,
      output: action.output,
      async transform(value: PipelineValue, context) {
        const latestDocument = context.documents?.find((document) => document.id === action.documentId);
        const latestActions = actions.map((candidate) => {
          const sourceDocument = context.documents?.find((document) => document.id === candidate.documentId);
          return {
            ...candidate,
            source: sourceDocument?.text || candidate.source,
            fileName: sourceDocument?.fileName || candidate.fileName
          };
        });
        const result = await service.run({
          mode: "action",
          source: latestDocument?.text || action.source,
          fileName: latestDocument?.fileName || action.fileName,
          actionId: action.id,
          input: value,
          documents: context.documents || documents,
          actions: latestActions
        });
        if (!result.ok || !result.value) {
          throw new Error(result.error || `Lua action "${action.name}" did not return a value.`);
        }
        return result.value;
      }
    })),
    pipelines: actions.map((action) => ({
      id: action.pipelineId,
      name: action.name,
      input: action.input,
      steps: [action.transformerId],
      description: action.description,
      category: action.category || "Lua Transform"
    }))
  };
}
