import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContributionContext } from "../domain/types";

const renderMock = vi.fn<(id: string, source: string, container?: Element) => Promise<{ svg: string }>>();

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: renderMock
  }
}));

const emptyContext: ContributionContext = {
  runtime: {
    load: async (_id, loader) => loader()
  },
  workspace: {
    activeFileId: null,
    selectedFileId: null,
    listFiles: () => [],
    listTextFiles: () => [],
    listOpenTextFiles: () => [],
    getFile: () => undefined,
    findByPath: () => undefined,
    resolvePath: (_baseFileId, target) => target,
    readText: () => undefined,
    readBinary: () => undefined
  },
  documents: []
};

describe("markdownCore", () => {
  beforeEach(() => {
    renderMock.mockReset();
  });

  it("renders distinct Mermaid blocks in markdown sequentially", async () => {
    let activeRender: string | null = null;

    renderMock.mockImplementation(async (id, source) => {
      if (activeRender !== null) {
        return { svg: `<svg data-rendered="${activeRender}"></svg>` };
      }

      activeRender = source;
      await Promise.resolve();
      activeRender = null;
      return { svg: `<svg data-rendered="${source}"></svg>` };
    });

    const { default: plugin } = await import("./markdownCore");
    const transformer = plugin.transformers?.find((item) => item.id === "markdown-to-html");

    expect(transformer).toBeDefined();

    const result = await transformer!.transform(
      {
        kind: "text",
        languageId: "text.markdown",
        text: [
          "```mermaid",
          "graph TD",
          "  A --> B",
          "```",
          "",
          "```mermaid",
          "graph TD",
          "  C --> D",
          "```"
        ].join("\n")
      },
      emptyContext
    );

    expect(result.kind).toBe("html");
    if (result.kind !== "html") {
      throw new Error("Expected HTML result.");
    }
    expect(renderMock).toHaveBeenCalledTimes(2);
    expect(result.html).toContain('data-rendered="graph TD\n  A --> B"');
    expect(result.html).toContain('data-rendered="graph TD\n  C --> D"');
  });

  it("keeps Mermaid artifact placeholders distinct through large markdown batches", async () => {
    renderMock.mockImplementation(async (_id, source) => ({ svg: `<svg data-rendered="${source}"></svg>` }));

    const { default: plugin } = await import("./markdownCore");
    const transformer = plugin.transformers?.find((item) => item.id === "markdown-to-html");

    expect(transformer).toBeDefined();

    const blocks = Array.from({ length: 1000 }, (_, index) => [
      "```mermaid",
      "graph TD",
      `  N${index} --> N${index + 1}`,
      "```"
    ].join("\n")).join("\n\n");

    const result = await transformer!.transform(
      {
        kind: "text",
        languageId: "text.markdown",
        text: blocks
      },
      emptyContext
    );

    expect(result.kind).toBe("html");
    if (result.kind !== "html") {
      throw new Error("Expected HTML result.");
    }

    expect((result.html.match(/data-rendered=/g) || []).length).toBe(1000);
    expect(result.html).toContain('data-rendered="graph TD\n  N0 --> N1"');
    expect(result.html).toContain('data-rendered="graph TD\n  N9 --> N10"');
    expect(result.html).toContain('data-rendered="graph TD\n  N99 --> N100"');
    expect(result.html).toContain('data-rendered="graph TD\n  N999 --> N1000"');
    expect(result.html).not.toContain("TEXTFORGE_ARTIFACT");
    expect(result.html).not.toContain("TEXTFORGE_INLINE_MATH");
  });

  it("emits source bridge metadata for embedded diagrams and fenced code blocks", async () => {
    renderMock.mockImplementation(async (_id, source) => ({ svg: `<svg data-rendered="${source}"></svg>` }));

    const { default: plugin } = await import("./markdownCore");
    const transformer = plugin.transformers?.find((item) => item.id === "markdown-to-html");

    expect(transformer).toBeDefined();

    const result = await transformer!.transform(
      {
        kind: "text",
        languageId: "text.markdown",
        text: [
          "```mermaid",
          "graph TD",
          "  A --> B",
          "```",
          "",
          "```js",
          "const answer = 42;",
          "```"
        ].join("\n")
      },
      emptyContext
    );

    expect(result.kind).toBe("html");
    if (result.kind !== "html") {
      throw new Error("Expected HTML result.");
    }

    expect(result.html).toContain('class="tf-embedded-artifact tf-source-bridge"');
    expect(result.html).toMatch(/data-source-from="\d+" data-source-to="\d+"/);
    expect(result.html).toContain('data-source-kind="code-block"');
    expect(result.html).toContain('class="hljs language-js tf-source-bridge"');
  });
});
