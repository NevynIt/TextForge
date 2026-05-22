import { describe, expect, it } from "vitest";
import {
  baseName,
  isPathInside,
  joinWorkspacePath,
  normalizeImportPath,
  normalizeWorkspacePath,
  parentPath,
  resolveRelativePath,
  validateEntryName
} from "./workspacePaths";

describe("workspacePaths", () => {
  it("normalizes workspace paths to canonical absolute form", () => {
    expect(normalizeWorkspacePath("/docs//specs/../readme.md")).toBe("/docs/readme.md");
    expect(normalizeWorkspacePath("\\docs\\models\\main.itm")).toBe("/docs/models/main.itm");
    expect(normalizeWorkspacePath("/")).toBe("/");
  });

  it("rejects root escape and malformed import paths", () => {
    expect(() => normalizeWorkspacePath("/docs/../../evil.txt")).toThrow(/escape/);
    expect(() => normalizeImportPath("../evil.txt")).toThrow(/escape/);
    expect(() => normalizeImportPath("C:\\temp\\evil.txt")).toThrow(/Absolute OS paths/);
    expect(() => normalizeImportPath("/absolute.txt")).toThrow(/relative/);
  });

  it("joins and resolves relative paths", () => {
    expect(joinWorkspacePath("/docs", "guides/intro.md")).toBe("/docs/guides/intro.md");
    expect(resolveRelativePath("/models/main.itm", "../shared/common.itm")).toBe("/shared/common.itm");
  });

  it("derives parent and basename", () => {
    expect(parentPath("/docs/guides/intro.md")).toBe("/docs/guides");
    expect(parentPath("/docs")).toBe("/");
    expect(baseName("/docs/guides/intro.md")).toBe("intro.md");
  });

  it("checks ancestry", () => {
    expect(isPathInside("/docs", "/docs/guides/intro.md")).toBe(true);
    expect(isPathInside("/docs", "/examples/demo.md")).toBe(false);
  });

  it("validates entry names", () => {
    expect(validateEntryName(" readme.md ")).toEqual({ ok: true });
    expect(validateEntryName("")).toEqual({ ok: false, message: "Name cannot be empty." });
    expect(validateEntryName("../evil")).toEqual({ ok: false, message: "Folder separators are not allowed in names." });
  });
});
