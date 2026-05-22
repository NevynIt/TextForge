import { describe, expect, it } from "vitest";
import { WorkspaceManager } from "./workspaceManager";

describe("WorkspaceManager", () => {
  it("creates a default workspace with bundled resources and no open tabs", () => {
    const workspace = new WorkspaceManager();
    const snapshot = workspace.snapshot();

    expect(snapshot.rootFolderId).toBeTruthy();
    expect(snapshot.openFileIds).toEqual([]);
    expect(workspace.findByPath("/.textforge/resources/docs/user-guide.md")).toBeTruthy();
  });

  it("creates, opens, edits, closes, and reopens a text file without deleting it", () => {
    const workspace = new WorkspaceManager();
    const docs = workspace.findByPath("/docs");
    const file = workspace.createTextFile(docs!.id, "readme.md", "# One", "text.markdown");

    workspace.openFile(file.id);
    const updated = workspace.updateText(file.id, "# Two");
    workspace.closeFile(file.id);

    expect(updated?.version).toBe(2);
    expect(updated?.dirty).toBe(true);
    expect(workspace.findByPath("/docs/readme.md")).toBeTruthy();
    expect(workspace.listDocuments()).toEqual([]);

    workspace.openFile(file.id);
    expect(workspace.getActiveDocument()?.text).toBe("# Two");
  });

  it("renames files by path and keeps stable identity", () => {
    const workspace = new WorkspaceManager();
    const docs = workspace.findByPath("/docs")!;
    const file = workspace.createTextFile(docs.id, "a.txt", "one");
    const identity = file.identity.badgeLabel;

    const renamed = workspace.renameEntry(file.id, "b.txt");

    expect(renamed?.path).toBe("/docs/b.txt");
    expect(workspace.getFile(file.id)?.identity.badgeLabel).toBe(identity);
  });

  it("rejects duplicate interactive names in the same folder", () => {
    const workspace = new WorkspaceManager();
    const docs = workspace.findByPath("/docs")!;
    workspace.createTextFile(docs.id, "notes.md", "# A", "text.markdown");

    expect(() => workspace.createTextFile(docs.id, "notes.md", "# B", "text.markdown")).toThrow(/already exists/);
  });

  it("resolves import conflicts deterministically", () => {
    const workspace = new WorkspaceManager();
    const docs = workspace.findByPath("/docs")!;

    const report = workspace.importFiles(docs.id, [
      { path: "sample.md", text: "# A", languageId: "text.markdown" },
      { path: "sample.md", text: "# B", languageId: "text.markdown" }
    ]);

    expect(report.imported.map((file) => file.name)).toEqual(["sample.md", "sample (2).md"]);
  });

  it("keeps read-only resource files immutable but allows copying them", () => {
    const workspace = new WorkspaceManager();
    const resource = workspace.findByPath("/.textforge/resources/examples/party.itm");
    const examples = workspace.findByPath("/examples");

    expect(() => workspace.updateText(resource!.id, "change")).toThrow(/read-only/);

    const copy = workspace.copyEntry(resource!.id, examples!.id);

    expect(copy?.path).toBe("/examples/party.itm");
    expect(workspace.getFile(copy!.id)?.readOnly).toBeFalsy();
  });

  it("falls back to a writable folder when the current selection is read-only", () => {
    const workspace = new WorkspaceManager();
    const resourceFolder = workspace.findByPath("/.textforge/resources/examples")!;

    workspace.selectEntry(resourceFolder.id);

    expect(workspace.getFolder(workspace.resolveWritableFolderId())?.path).toBe("/docs");
    expect(() => workspace.importFiles(workspace.resolveWritableFolderId(), [{ path: "imported.md", text: "# Imported", languageId: "text.markdown" }])).not.toThrow();
    expect(workspace.findByPath("/docs/imported.md")).toBeTruthy();
  });

  it("preserves valid unique badges on restore", () => {
    const workspace = new WorkspaceManager();
    const docs = workspace.findByPath("/docs")!;
    const first = workspace.createTextFile(docs.id, "a.md", "# A", "text.markdown");
    const second = workspace.createTextFile(docs.id, "b.md", "# B", "text.markdown");
    workspace.openFile(first.id);
    workspace.openFile(second.id);
    const snapshot = workspace.snapshot();

    const restored = new WorkspaceManager();
    restored.restore(snapshot);

    expect(restored.listDocuments().map((document) => document.identity.shapeCode)).toEqual(
      workspace.listDocuments().map((document) => document.identity.shapeCode)
    );
  });
});
