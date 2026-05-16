import type {
  Contribution,
  ContributionKind,
  LanguageDefinition,
  PipelineContribution,
  PipelineStatus,
  PluginManifestEntry,
  PluginState,
  TextForgePlugin
} from "../domain/types";
import { LanguageRegistry } from "./languageRegistry";

type ContributionBuckets = {
  transformer: Map<string, Contribution>;
  viewer: Map<string, Contribution>;
  editor: Map<string, Contribution>;
  linter: Map<string, Contribution>;
};

export class PluginRegistry {
  private manifests = new Map<string, PluginManifestEntry>();
  private contributionOwners = new Map<string, string>();
  private states = new Map<string, PluginState>();
  private contributions: ContributionBuckets = {
    transformer: new Map(),
    viewer: new Map(),
    editor: new Map(),
    linter: new Map()
  };
  private pipelines = new Map<string, PipelineContribution>();

  constructor(private languageRegistry: LanguageRegistry) {}

  registerManifest(entries: PluginManifestEntry[]): void {
    for (const entry of entries) {
      this.manifests.set(entry.id, entry);
      this.states.set(entry.id, {
        id: entry.id,
        name: entry.name,
        version: entry.version,
        status: "available",
        autoload: Boolean(entry.autoLoad),
        contributionIds: entry.contributionIds.slice()
      });
      for (const language of entry.languages || []) {
        this.languageRegistry.register(language);
      }
      for (const pipeline of entry.pipelines || []) {
        this.pipelines.set(pipeline.id, pipeline);
      }
      for (const contributionId of entry.contributionIds) {
        this.contributionOwners.set(contributionId, entry.id);
      }
    }
  }

  listPluginStates(): PluginState[] {
    return Array.from(this.states.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  listAutoloadPluginIds(): string[] {
    return this.listPluginStates()
      .filter((state) => state.autoload)
      .map((state) => state.id);
  }

  setAutoload(pluginId: string, autoload: boolean): void {
    const state = this.states.get(pluginId);
    if (!state) {
      return;
    }
    this.states.set(pluginId, { ...state, autoload });
  }

  listLanguages(): LanguageDefinition[] {
    return this.languageRegistry.list();
  }

  listPipelinesForLanguage(languageId: string): PipelineContribution[] {
    return Array.from(this.pipelines.values())
      .filter((pipeline) => this.languageRegistry.matches(pipeline.input, languageId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getPipeline(id: string): PipelineContribution | undefined {
    return this.pipelines.get(id);
  }

  getContributionAvailability(id: string): PipelineStatus {
    if (this.getLoadedContribution(id)) {
      return "available";
    }
    const ownerId = this.contributionOwners.get(id);
    if (!ownerId) {
      return "missing-contribution";
    }
    if (!this.manifests.has(ownerId)) {
      return "missing-plugin";
    }
    return "available";
  }

  async loadPlugin(pluginId: string): Promise<TextForgePlugin> {
    const manifest = this.manifests.get(pluginId);
    if (!manifest) {
      throw new Error(`Plugin "${pluginId}" is not packaged.`);
    }
    const state = this.states.get(pluginId);
    if (state?.status === "loaded") {
      return this.buildLoadedPlugin(pluginId);
    }
    try {
      const loaded = await manifest.load();
      const plugin = "default" in loaded ? loaded.default : loaded;
      this.registerPlugin(plugin);
      this.states.set(pluginId, {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        status: "loaded",
        autoload: state?.autoload || Boolean(manifest.autoLoad),
        contributionIds: manifest.contributionIds.slice()
      });
      return plugin;
    } catch (error) {
      this.states.set(pluginId, {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        status: "failed",
        autoload: state?.autoload || Boolean(manifest.autoLoad),
        contributionIds: manifest.contributionIds.slice(),
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async resolveContribution(id: string): Promise<Contribution | undefined> {
    const loaded = this.getLoadedContribution(id);
    if (loaded) {
      return loaded;
    }
    const ownerId = this.contributionOwners.get(id);
    if (!ownerId) {
      return undefined;
    }
    await this.loadPlugin(ownerId);
    return this.getLoadedContribution(id);
  }

  async resolveLinters(languageId: string): Promise<Contribution[]> {
    const candidates = Array.from(this.contributionOwners.keys()).filter((id) => id.endsWith("-linter"));
    const linters: Contribution[] = [];
    for (const id of candidates) {
      const contribution = await this.resolveContribution(id);
      if (contribution?.kind === "linter" && this.languageRegistry.matches(contribution.accepts, languageId)) {
        linters.push(contribution);
      }
    }
    return linters;
  }

  valueMatches(input: string | string[], actual: string): boolean {
    if (actual.startsWith("text.")) {
      return this.languageRegistry.matches(input, actual);
    }
    const options = Array.isArray(input) ? input : [input];
    return options.includes("*") || options.includes(actual);
  }

  private registerPlugin(plugin: TextForgePlugin): void {
    assertPlugin(plugin);
    for (const language of plugin.languages || []) {
      this.languageRegistry.register(language);
    }
    for (const pipeline of plugin.pipelines || []) {
      this.pipelines.set(pipeline.id, pipeline);
    }
    for (const contribution of [
      ...(plugin.transformers || []),
      ...(plugin.viewers || []),
      ...(plugin.editors || []),
      ...(plugin.linters || [])
    ]) {
      this.contributions[contribution.kind].set(contribution.id, contribution);
    }
  }

  private getLoadedContribution(id: string): Contribution | undefined {
    for (const map of Object.values(this.contributions)) {
      const contribution = map.get(id);
      if (contribution) {
        return contribution;
      }
    }
    return undefined;
  }

  private buildLoadedPlugin(pluginId: string): TextForgePlugin {
    const manifest = this.manifests.get(pluginId);
    return {
      id: pluginId,
      name: manifest?.name || pluginId,
      version: manifest?.version || "0.0.0"
    };
  }
}

function assertPlugin(plugin: TextForgePlugin): void {
  if (!plugin.id || !plugin.name || !plugin.version) {
    throw new Error("Plugin must include id, name, and version.");
  }
  const ids = new Set<string>();
  for (const contribution of [
    ...(plugin.transformers || []),
    ...(plugin.viewers || []),
    ...(plugin.editors || []),
    ...(plugin.linters || [])
  ]) {
    if (!contribution.id || !contribution.name || !contribution.kind) {
      throw new Error(`Plugin "${plugin.id}" has an invalid contribution.`);
    }
    if (ids.has(contribution.id)) {
      throw new Error(`Plugin "${plugin.id}" declares duplicate contribution "${contribution.id}".`);
    }
    ids.add(contribution.id);
  }
}
