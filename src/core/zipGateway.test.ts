import { describe, expect, it } from "vitest";
import { exportWorkspaceFilesToZip, importZipToWorkspaceFiles } from "./zipGateway";

describe("zipGateway", () => {
  it("round-trips text files through a stored zip", async () => {
    const zip = await exportWorkspaceFilesToZip([
      { path: "/docs/readme.md", fileKind: "text", text: "# Readme", mediaType: "text/markdown" },
      { path: "/examples/demo.itm", fileKind: "text", text: "&root Demo", mediaType: "text/plain" }
    ]);

    const imported = await importZipToWorkspaceFiles(zip, (fileName) => (fileName.endsWith(".md") ? "text.markdown" : "text.itm"));

    expect(imported.map((entry) => entry.path)).toEqual(["docs/readme.md", "examples/demo.itm"]);
    expect(imported[0].text).toBe("# Readme");
    expect(imported[1].text).toBe("&root Demo");
  });

  it("rejects path traversal entries", async () => {
    const zip = await exportWorkspaceFilesToZip([
      { path: "/docs/readme.md", fileKind: "text", text: "# Readme", mediaType: "text/markdown" }
    ]);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    const updated = new TextEncoder().encode("../evil.txt");
    bytes.set(updated, 30);

    await expect(importZipToWorkspaceFiles(new Blob([bytes], { type: "application/zip" }), () => "text.plain")).rejects.toThrow(/escape|relative/i);
  });

  it("keeps uploaded SVG assets as binary files so they stay view-only", async () => {
    const zip = await exportWorkspaceFilesToZip([
      { path: "/docs/diagram.svg", fileKind: "binary", blob: new Blob(["<svg></svg>"], { type: "image/svg+xml" }), mediaType: "image/svg+xml" }
    ]);

    const imported = await importZipToWorkspaceFiles(zip, () => "text.plain");

    expect(imported).toHaveLength(1);
    expect(imported[0].fileKind).toBe("binary");
    expect(imported[0].mediaType).toBe("image/svg+xml");
  });
});
