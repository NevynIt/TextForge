import type {
  Contribution,
  ContributionKind,
  LanguageDefinition,
  PipelineContribution,
  PipelineStatus,
  PluginDiagnostic,
  PluginManifestEntry,
  PluginState,
  RegisteredPipeline,
  RegisteredPipelineConflict,
  TextForgePlugin
} from "../domain/types";
import { LanguageRegistry } from "./languageRegistry";

type ContributionBuckets = {
  transformer: Map<string, Contribution>;
  viewer: Map<string, Contribution>;
  editor: Map<string, Contribution>;
  linter: Map<string, Contribution>;
};

interface RegisteredContributionDescriptor {
  id: string;
  kind: ContributionKind;
  pluginId: string;
}

export class PluginRegistry {
  private manifests = new Map<string, PluginManifestEntry>();
  private contributionOwners = new Map<string, string>();
  private contributionDescriptors = new Map<string, RegisteredContributionDescriptor>();
  private states = new Map<string, PluginState>();
  private contributions: ContributionBuckets = {
    transformer: new Map(),
    viewer: new Map(),
    editor: new Map(),
    linter: new Map()
  };
  private pipelines = new Map<string, RegisteredPipeline[]>();
  private pluginDiagnostics = new Map<string, PluginDiagnostic>();

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
      for (const descriptor of entry.contributions || []) {
        this.contributionDescriptors.set(descriptor.id, { ...descriptor, pluginId: entry.id });
      }
      for (const pipeline of entry.pipelines || []) {
        this.registerPipelineRecord(entry.id, pipeline);
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

  registerCustomPlugin(plugin: TextForgePlugin): void {
    assertPlugin(plugin);
    if (this.manifests.has(plugin.id) || this.states.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered.`);
    }

    const descriptors = contributionDescriptorsForPlugin(plugin);
    for (const descriptor of descriptors) {
      if (this.contributionOwners.has(descriptor.id) || this.getLoadedContribution(descriptor.id)) {
        throw new Error(`Contribution "${descriptor.id}" is already registered.`);
      }
    }

    this.manifests.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      autoLoad: false,
      languages: plugin.languages || [],
      pipelines: plugin.pipelines || [],
      contributions: descriptors.map(({ id, kind }) => ({ id, kind })),
      contributionIds: descriptors.map(({ id }) => id),
      load: async () => plugin
    });
    this.states.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      status: "loaded",
      autoload: false,
      contributionIds: descriptors.map(({ id }) => id)
    });

    for (const descriptor of descriptors) {
      this.contributionOwners.set(descriptor.id, plugin.id);
      this.contributionDescriptors.set(descriptor.id, descriptor);
    }

    this.registerPlugin(plugin);
  }

  replaceGeneratedPlugin(plugin: TextForgePlugin): void {
    assertPlugin(plugin);
    this.unregisterPlugin(plugin.id);
    const descriptors = contributionDescriptorsForPlugin(plugin);
    this.manifests.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      autoLoad: false,
      languages: plugin.languages || [],
      pipelines: plugin.pipelines || [],
      contributions: descriptors.map(({ id, kind }) => ({ id, kind })),
      contributionIds: descriptors.map(({ id }) => id),
      load: async () => plugin
    });
    this.states.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      status: "loaded",
      autoload: false,
      contributionIds: descriptors.map(({ id }) => id)
    });
    for (const descriptor of descriptors) {
      this.contributionOwners.set(descriptor.id, plugin.id);
      this.contributionDescriptors.set(descriptor.id, descriptor);
    }
    this.registerPlugin(plugin);
  }

  listLanguages(): LanguageDefinition[] {
    return this.languageRegistry.list();
  }

  listPipelinesForLanguage(languageId: string): PipelineContribution[] {
    return this.listRegisteredPipelines()
      .filter((record) => record.enabled && this.languageRegistry.matches(record.pipeline.input, languageId))
      .map((record) => record.pipeline)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  listRegisteredPipelines(): RegisteredPipeline[] {
    return Array.from(this.pipelines.values())
      .flatMap((records) => records)
      .sort((left, right) => {
        const byPipeline = left.pipeline.name.localeCompare(right.pipeline.name);
        return byPipeline !== 0 ? byPipeline : left.pluginId.localeCompare(right.pluginId);
      });
  }

  getPipeline(id: string): PipelineContribution | undefined {
    return this.pipelines.get(id)?.find((record) => record.enabled)?.pipeline;
  }

  setPipelineEnabled(pluginId: string, pipelineId: string, enabled: boolean): void {
    const records = this.pipelines.get(pipelineId);
    if (!records) {
      return;
    }

    const target = records.find((record) => record.pluginId === pluginId);
    if (!target) {
      return;
    }

    if (!enabled) {
      target.enabled = false;
      target.disabledReason = "user";
      this.refreshConflicts(pipelineId);
      return;
    }

    for (const record of records) {
      if (record.pluginId === pluginId) {
        record.enabled = true;
        delete record.disabledReason;
      } else {
        record.enabled = false;
        record.disabledReason = "conflict";
      }
    }

    this.pluginDiagnostics.set(
      diagnosticKey(pluginId, pipelineId, "enabled"),
      {
        id: diagnosticKey(pluginId, pipelineId, "enabled"),
        source: "plugin-registry",
        severity: "warning",
        pluginId,
        pipelineId,
        message: `Pipeline "${pipelineId}" from plugin "${pluginId}" was enabled. Conflicting pipelines with the same ID were disabled.`,
        createdAt: new Date().toISOString(),
        acknowledged: false
      }
    );
    this.refreshConflicts(pipelineId);
  }

  applyPipelinePreferences(preferences: Array<{ pluginId: string; pipelineId: string; reason?: "user" | "conflict" }>): void {
    for (const preference of preferences) {
      const records = this.pipelines.get(preference.pipelineId);
      const target = records?.find((record) => record.pluginId === preference.pluginId);
      if (!target) {
        continue;
      }
      target.enabled = false;
      target.disabledReason = preference.reason || "user";
    }

    for (const pipelineId of this.pipelines.keys()) {
      this.refreshConflicts(pipelineId);
    }
  }

  listPluginDiagnostics(): PluginDiagnostic[] {
    return Array.from(this.pluginDiagnostics.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  acknowledgePluginDiagnostic(id: string): void {
    const diagnostic = this.pluginDiagnostics.get(id);
    if (!diagnostic) {
      return;
    }
    this.pluginDiagnostics.set(id, { ...diagnostic, acknowledged: true });
  }

  hasUnacknowledgedPluginDiagnostics(): boolean {
    return this.listPluginDiagnostics().some((diagnostic) => !diagnostic.acknowledged);
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
    const candidates = Array.from(this.contributionDescriptors.values()).filter((descriptor) => descriptor.kind === "linter");
    const linters: Contribution[] = [];
    for (const descriptor of candidates) {
      const contribution = await this.resolveContribution(descriptor.id);
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
      this.registerPipelineRecord(plugin.id, pipeline);
    }
    for (const contribution of [
      ...(plugin.transformers || []),
      ...(plugin.viewers || []),
      ...(plugin.editors || []),
      ...(plugin.linters || [])
    ]) {
      this.contributions[contribution.kind].set(contribution.id, contribution);
      this.contributionDescriptors.set(contribution.id, {
        id: contribution.id,
        kind: contribution.kind,
        pluginId: plugin.id
      });
    }
  }

  private registerPipelineRecord(pluginId: string, pipeline: PipelineContribution): void {
    const records = this.pipelines.get(pipeline.id) ?? [];
    const record: RegisteredPipeline = {
      pipeline,
      pluginId,
      enabled: !records.some((candidate) => candidate.enabled)
    };
    records.push(record);
    this.pipelines.set(pipeline.id, records);
    this.refreshConflicts(pipeline.id);
  }

  private refreshConflicts(pipelineId: string): void {
    const records = this.pipelines.get(pipelineId);
    if (!records || records.length === 0) {
      return;
    }

    const enabledRecord = records.find((record) => record.enabled);
    for (const record of records) {
      const others = records
        .filter((candidate) => candidate.pluginId !== record.pluginId)
        .map((candidate) => this.toConflict(candidate));
      record.conflictWith = others.length > 0 ? others : undefined;
      if (record.enabled) {
        delete record.disabledReason;
      } else if (records.length > 1 && record.disabledReason !== "user") {
        record.disabledReason = "conflict";
      }
    }

    if (records.length === 1) {
      this.pluginDiagnostics.delete(diagnosticKey(records[0].pluginId, pipelineId, "conflict"));
      return;
    }

    if (enabledRecord) {
      for (const record of records) {
        if (!record.enabled) {
          record.disabledReason = record.disabledReason === "user" ? "user" : "conflict";
        }
      }
    }

    for (const record of records.filter((candidate) => !candidate.enabled && candidate.disabledReason === "conflict")) {
      const winner = enabledRecord ?? records.find((candidate) => candidate.pluginId !== record.pluginId);
      if (!winner) {
        continue;
      }
      this.pluginDiagnostics.set(
        diagnosticKey(record.pluginId, pipelineId, "conflict"),
        {
          id: diagnosticKey(record.pluginId, pipelineId, "conflict"),
          source: "plugin-registry",
          severity: "warning",
          pluginId: record.pluginId,
          pipelineId,
          message: `Pipeline "${pipelineId}" from plugin "${record.pluginId}" conflicts with plugin "${winner.pluginId}". The "${winner.pluginId}" pipeline remains active.`,
          createdAt: new Date().toISOString(),
          acknowledged: false
        }
      );
    }
  }

  private toConflict(record: RegisteredPipeline): RegisteredPipelineConflict {
    return {
      pluginId: record.pluginId,
      pipelineId: record.pipeline.id,
      pipelineName: record.pipeline.name
    };
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

  private unregisterPlugin(pluginId: string): void {
    const manifest = this.manifests.get(pluginId);
    for (const contributionId of manifest?.contributionIds || []) {
      this.contributionOwners.delete(contributionId);
      this.contributionDescriptors.delete(contributionId);
      for (const map of Object.values(this.contributions)) {
        map.delete(contributionId);
      }
    }
    for (const pipeline of manifest?.pipelines || []) {
      const records = this.pipelines.get(pipeline.id)?.filter((candidate) => candidate.pluginId !== pluginId) ?? [];
      if (records.length === 0) {
        this.pipelines.delete(pipeline.id);
      } else {
        this.pipelines.set(pipeline.id, records);
        this.refreshConflicts(pipeline.id);
      }
    }
    this.manifests.delete(pluginId);
    this.states.delete(pluginId);
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

function contributionDescriptorsForPlugin(plugin: TextForgePlugin): RegisteredContributionDescriptor[] {
  return [
    ...(plugin.transformers || []),
    ...(plugin.viewers || []),
    ...(plugin.editors || []),
    ...(plugin.linters || [])
  ].map((contribution) => ({
    id: contribution.id,
    kind: contribution.kind,
    pluginId: plugin.id
  }));
}

function diagnosticKey(pluginId: string, pipelineId: string, kind: string): string {
  return `${kind}:${pluginId}:${pipelineId}`;
}
