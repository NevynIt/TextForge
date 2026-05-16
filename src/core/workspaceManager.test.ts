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
    expect(workspace.listDocuments().map((doc) => doc.fileName)).toEqual(["notes.md", "notes (2).md"]);
  });
});
