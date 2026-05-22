import Dexie, { type EntityTable } from "dexie";
import type { WorkspaceState } from "./workspaceTypes";

export interface PluginPreferences {
  autoloadPluginIds: string[];
  disabledPipelines?: Array<{
    pluginId: string;
    pipelineId: string;
    reason?: "user" | "conflict";
  }>;
}

interface KeyValueRecord {
  key: string;
  value: PluginPreferences | WorkspaceState;
}

class TextForgeDatabase extends Dexie {
  kv!: EntityTable<KeyValueRecord, "key">;

  constructor() {
    super("textforge-workspace");
    this.version(1).stores({
      kv: "&key"
    });
  }
}

export class TextForgeStorage {
  private db: TextForgeDatabase | null = null;
  private idbUnavailable = false;

  async init(): Promise<void> {
    if (!("indexedDB" in globalThis)) {
      this.idbUnavailable = true;
      return;
    }
    try {
      this.db = new TextForgeDatabase();
      await this.db.open();
    } catch {
      this.idbUnavailable = true;
      this.db = null;
    }
  }

  async loadWorkspace(): Promise<WorkspaceState | null> {
    return this.get<WorkspaceState>("workspace");
  }

  async saveWorkspace(workspace: WorkspaceState): Promise<void> {
    await this.set("workspace", workspace);
  }

  async loadPluginPreferences(): Promise<PluginPreferences> {
    return (await this.get<PluginPreferences>("pluginPreferences")) || { autoloadPluginIds: [], disabledPipelines: [] };
  }

  async savePluginPreferences(preferences: PluginPreferences): Promise<void> {
    await this.set("pluginPreferences", preferences);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db || this.idbUnavailable) {
      return null;
    }
    try {
      const record = await this.db.kv.get(key);
      return (record?.value as T | undefined) ?? null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.db || this.idbUnavailable) {
      return;
    }
    try {
      await this.db.kv.put({ key, value: value as PluginPreferences | WorkspaceState });
    } catch {
      // Ignore storage write failures and keep the app usable offline.
    }
  }
}
