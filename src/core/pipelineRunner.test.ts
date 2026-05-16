import { describe, expect, it } from "vitest";
import { LanguageRegistry, registerBaseLanguages } from "./languageRegistry";
import { PipelineRunner } from "./pipelineRunner";
import { PluginRegistry } from "./pluginRegistry";
import { RuntimeLoader } from "./runtimeLoader";
import { pluginManifest } from "../plugins/manifest";
import type { TextDocument } from "../domain/types";

describe("PipelineRunner", () => {
  it("runs a lazy-loaded JSON tree pipeline", async () => {
    const languages = new LanguageRegistry();
    registerBaseLanguages(languages);
    const registry = new PluginRegistry(languages);
    registry.registerManifest(pluginManifest);
    const runner = new PipelineRunner(registry, new RuntimeLoader());
    const document: TextDocument = {
      id: "doc-test",
      fileName: "sample.json",
      languageId: "text.json",
      text: "{\"name\":\"TextForge\"}",
      version: 1,
      dirty: false,
      identity: { color: "#3a6ea5", badgeLabel: "T1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await runner.run("view-json-tree", document);

    expect(result.status).toBe("available");
    expect(result.viewerResult?.kind).toBe("tree");
    expect(result.trace.map((step) => step.stepId)).toEqual(["json-to-tree", "tree-viewer"]);
  });

  it("reports missing contributions without throwing", async () => {
    const languages = new LanguageRegistry();
    registerBaseLanguages(languages);
    const registry = new PluginRegistry(languages);
    const runner = new PipelineRunner(registry, new RuntimeLoader());
    const document: TextDocument = {
      id: "doc-test",
      fileName: "sample.txt",
      languageId: "text.plain",
      text: "text",
      version: 1,
      dirty: false,
      identity: { color: "#3a6ea5", badgeLabel: "T1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await runner.runPipeline({ id: "bad", name: "Bad", input: "text.plain", steps: ["missing-step"] }, document);

    expect(result.status).toBe("missing-contribution");
    expect(result.trace[0].status).toBe("missing-contribution");
  });
});
