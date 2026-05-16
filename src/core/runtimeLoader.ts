import type { RuntimeLoader as RuntimeLoaderContract } from "../domain/types";

export class RuntimeLoader implements RuntimeLoaderContract {
  private loaded = new Map<string, Promise<unknown>>();

  async load<T>(id: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.loaded.get(id);
    if (existing) {
      return existing as Promise<T>;
    }
    const promise = loader().catch((error) => {
      this.loaded.delete(id);
      throw error;
    });
    this.loaded.set(id, promise);
    return promise;
  }
}
