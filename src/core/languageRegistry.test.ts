import { describe, expect, it } from "vitest";
import { LanguageRegistry, registerBaseLanguages } from "./languageRegistry";

describe("LanguageRegistry", () => {
  it("keeps file-name inference working when used as a detached callback", () => {
    const registry = new LanguageRegistry();
    registerBaseLanguages(registry);

    const infer = registry.inferFromFileName;

    expect(infer("notes.md")).toBe("text.markdown");
    expect(infer("diagram.mmd")).toBe("text.mermaid");
    expect(infer("unknown.bin")).toBe("text.plain");
  });
});
