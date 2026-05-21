import { describe, expect, it } from "vitest";
import { WorkspaceManager } from "./workspaceManager";

describe("WorkspaceManager", () => {
  it("increments versions and tracks dirty state on text changes", () => {
    const workspace = new WorkspaceManager();
    const doc = workspace.openDocument({ fileName: "a.txt", languageId: "text.plain", text: "one" });

    const updated = workspace.updateText(doc.id, "two");

    expect(updated?.version).toBe(doc.version + 1);
    expect(updated?.dirty).toBe(true);
    expect(workspace.getActiveDocument()?.text).toBe("two");
  });

  it("switches tabs without merging duplicate file names", () => {
    const workspace = new WorkspaceManager();
    const first = workspace.openDocument({ fileName: "notes.md", languageId: "text.markdown", text: "# A" });
    const second = workspace.openDocument({ fileName: "notes.md", languageId: "text.markdown", text: "# B" });

    workspace.switchDocument(first.id);

    expect(first.id).not.toBe(second.id);
    expect(workspace.getActiveDocument()?.text).toBe("# A");
    expect(workspace.listDocuments().map((doc) => doc.fileName)).toEqual(["notes.md", "notes.md"]);
    expect(workspace.listDocuments()[0].identity.badgeLabel).toBeTruthy();
    expect(workspace.listDocuments()[1].identity.badgeLabel).toBeTruthy();
  });

  it("increments version on file rename", () => {
    const workspace = new WorkspaceManager();
    const doc = workspace.openDocument({ fileName: "a.txt", languageId: "text.plain", text: "one" });

    const renamed = workspace.updateFileName(doc.id, "b.txt");

    expect(renamed?.version).toBe(doc.version + 1);
    expect(renamed?.fileName).toBe("b.txt");
  });

  it("assigns unique badges when many documents are opened in sequence", () => {
    const workspace = new WorkspaceManager();
    for (let index = 0; index < 12; index += 1) {
      workspace.openDocument({
        fileName: `batch-${index}.md`,
        languageId: "text.markdown",
        text: `# ${index}`
      });
    }

    const codes = workspace.listDocuments().map((document) => document.identity.shapeCode);

    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((code) => expect(code).toMatch(/^(([CRSW][rgbypcwu])|--){4}$/));
  });

  it("preserves valid unique badges on restore", () => {
    const workspace = new WorkspaceManager();

    workspace.restore([
      {
        id: "a",
        fileName: "a.md",
        languageId: "text.markdown",
        text: "# A",
        version: 1,
        dirty: false,
        identity: { color: "#000", badgeLabel: "CrRgSbWu", badgeKind: "shapez-one-layer", shapeCode: "CrRgSbWu" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "b",
        fileName: "b.md",
        languageId: "text.markdown",
        text: "# B",
        version: 1,
        dirty: false,
        identity: { color: "#000", badgeLabel: "WuCbRgSy", badgeKind: "shapez-one-layer", shapeCode: "WuCbRgSy" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ], "a");

    expect(workspace.listDocuments().map((document) => document.identity.shapeCode)).toEqual(["CrRgSbWu", "WuCbRgSy"]);
  });

  it("repairs duplicate and invalid badges on restore", () => {
    const workspace = new WorkspaceManager();

    workspace.restore([
      {
        id: "a",
        fileName: "a.md",
        languageId: "text.markdown",
        text: "# A",
        version: 1,
        dirty: false,
        identity: { color: "#000", badgeLabel: "CrRgSbWu", badgeKind: "shapez-one-layer", shapeCode: "CrRgSbWu" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "b",
        fileName: "b.md",
        languageId: "text.markdown",
        text: "# B",
        version: 1,
        dirty: false,
        identity: { color: "#000", badgeLabel: "CrRgSbWu", badgeKind: "shapez-one-layer", shapeCode: "CrRgSbWu" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "c",
        fileName: "c.md",
        languageId: "text.markdown",
        text: "# C",
        version: 1,
        dirty: false,
        identity: { color: "#000", badgeLabel: "invalid", badgeKind: "shapez-one-layer", shapeCode: "invalid" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ], "a");

    const codes = workspace.listDocuments().map((document) => document.identity.shapeCode);

    expect(codes[0]).toBe("CrRgSbWu");
    expect(codes[1]).not.toBe("CrRgSbWu");
    expect(codes[2]).toMatch(/^(([CRSW][rgbypcwu])|--){4}$/);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
