import { describe, expect, it } from "vitest";
import { LanguageRegistry, registerBaseLanguages } from "./languageRegistry";
import { PluginRegistry } from "./pluginRegistry";
import type { TextForgePlugin } from "../domain/types";

function createRegistry(): PluginRegistry {
  const languages = new LanguageRegistry();
  registerBaseLanguages(languages);
  return new PluginRegistry(languages);
}

describe("PluginRegistry", () => {
  it("keeps the first conflicting pipeline enabled and records a diagnostic", () => {
    const registry = createRegistry();

    registry.registerManifest([
      {
        id: "alpha",
        name: "Alpha",
        version: "1.0.0",
        contributionIds: [],
        pipelines: [{ id: "shared", name: "Alpha Shared", input: "text.plain", steps: [] }],
        load: async () => ({ id: "alpha", name: "Alpha", version: "1.0.0" })
      },
      {
        id: "beta",
        name: "Beta",
        version: "1.0.0",
        contributionIds: [],
        pipelines: [{ id: "shared", name: "Beta Shared", input: "text.plain", steps: [] }],
        load: async () => ({ id: "beta", name: "Beta", version: "1.0.0" })
      }
    ]);

    const pipelines = registry.listRegisteredPipelines().filter((record) => record.pipeline.id === "shared");

    expect(pipelines).toHaveLength(2);
    expect(pipelines.find((record) => record.pluginId === "alpha")?.enabled).toBe(true);
    expect(pipelines.find((record) => record.pluginId === "beta")?.disabledReason).toBe("conflict");
    expect(registry.listPluginDiagnostics().some((diagnostic) => diagnostic.pipelineId === "shared")).toBe(true);
  });

  it("lets the user enable a conflicting pipeline and disables the other one", () => {
    const registry = createRegistry();

    registry.registerManifest([
      {
        id: "alpha",
        name: "Alpha",
        version: "1.0.0",
        contributionIds: [],
        pipelines: [{ id: "shared", name: "Alpha Shared", input: "text.plain", steps: [] }],
        load: async () => ({ id: "alpha", name: "Alpha", version: "1.0.0" })
      },
      {
        id: "beta",
        name: "Beta",
        version: "1.0.0",
        contributionIds: [],
        pipelines: [{ id: "shared", name: "Beta Shared", input: "text.plain", steps: [] }],
        load: async () => ({ id: "beta", name: "Beta", version: "1.0.0" })
      }
    ]);

    registry.setPipelineEnabled("beta", "shared", true);

    const pipelines = registry.listRegisteredPipelines().filter((record) => record.pipeline.id === "shared");
    expect(pipelines.find((record) => record.pluginId === "beta")?.enabled).toBe(true);
    expect(pipelines.find((record) => record.pluginId === "alpha")?.enabled).toBe(false);
  });

  it("discovers linters by declared contribution kind instead of suffix", async () => {
    const registry = createRegistry();
    const plugin: TextForgePlugin = {
      id: "lint-pack",
      name: "Lint Pack",
      version: "1.0.0",
      linters: [
        {
          kind: "linter",
          id: "validate-json",
          name: "Validate JSON",
          accepts: "text.json",
          lint() {
            return [];
          }
        }
      ]
    };

    registry.registerCustomPlugin(plugin);

    const linters = await registry.resolveLinters("text.json");

    expect(linters.map((contribution) => contribution.id)).toContain("validate-json");
  });
});
