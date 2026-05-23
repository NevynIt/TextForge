import { describe, expect, it } from "vitest";
import { fileToWorkspaceImport } from "./fileGateway";

describe("fileGateway", () => {
  it("imports markdown as editable text", async () => {
    const imported = await fileToWorkspaceImport(
      new File(["# Notes"], "notes.md", { type: "text/markdown" }),
      (fileName) => (fileName.endsWith(".md") ? "text.markdown" : "text.plain")
    );

    expect(imported.fileKind).toBe("text");
    expect(imported.languageId).toBe("text.markdown");
  });

  it("imports SVG uploads as binary view-only assets", async () => {
    const imported = await fileToWorkspaceImport(
      new File(["<svg></svg>"], "diagram.svg", { type: "image/svg+xml" }),
      () => "text.plain"
    );

    expect(imported.fileKind).toBe("binary");
    expect(imported.mediaType).toBe("image/svg+xml");
    expect(imported.blob).toBeInstanceOf(File);
  });
});
