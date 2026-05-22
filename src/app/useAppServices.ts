import { useMemo } from "preact/hooks";
import { DiagnosticsService } from "../core/diagnosticsService";
import { LanguageRegistry, registerBaseLanguages } from "../core/languageRegistry";
import { PipelineRunner } from "../core/pipelineRunner";
import { PluginRegistry } from "../core/pluginRegistry";
import { RuntimeLoader } from "../core/runtimeLoader";
import { TextForgeStorage } from "../core/storage";
import { WorkspaceManager } from "../core/workspaceManager";
import { LuaTransformService } from "../lua/luaTransformService";
import { pluginManifest } from "../plugins/manifest";

export interface AppServices {
  languages: LanguageRegistry;
  workspace: WorkspaceManager;
  runtime: RuntimeLoader;
  plugins: PluginRegistry;
  pipelines: PipelineRunner;
  diagnostics: DiagnosticsService;
  storage: TextForgeStorage;
  lua: LuaTransformService;
}

export function useAppServices(): AppServices {
  return useMemo<AppServices>(() => {
    const languages = new LanguageRegistry();
    registerBaseLanguages(languages);
    const runtime = new RuntimeLoader();
    const plugins = new PluginRegistry(languages);
    const workspace = new WorkspaceManager();
    const lua = new LuaTransformService();
    plugins.registerManifest(pluginManifest);
    return {
      languages,
      runtime,
      plugins,
      workspace,
      pipelines: new PipelineRunner(plugins, runtime, () => workspace.listDocuments()),
      diagnostics: new DiagnosticsService(plugins, runtime, () => workspace.listDocuments()),
      storage: new TextForgeStorage(),
      lua
    };
  }, []);
}
