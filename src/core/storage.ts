import type { WorkspaceState } from "./workspaceTypes";

export interface PluginPreferences {
  autoloadPluginIds: string[];
  disabledPipelines?: Array<{
    pluginId: string;
    pipelineId: string;
    reason?: "user" | "conflict";
  }>;
}

export class TextForgeStorage {
  private db: IDBDatabase | null = null;
  private idbUnavailable = false;

  async init(): Promise<void> {
    if (!("indexedDB" in globalThis)) {
      this.idbUnavailable = true;
      return;
    }
    this.db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("textforge-workspace", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("kv");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.idbUnavailable = true;
        resolve(null as unknown as IDBDatabase);
      };
    });
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
    return new Promise<T | null>((resolve) => {
      const tx = this.db!.transaction("kv", "readonly");
      const request = tx.objectStore("kv").get(key);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => resolve(null);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.db || this.idbUnavailable) {
      return;
    }
    await new Promise<void>((resolve) => {
      const tx = this.db!.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}
