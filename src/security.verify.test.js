import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const forbiddenTokens = [
  "fet" + "ch(",
  "XML" + "HttpRequest",
  "Web" + "Socket",
  "Event" + "Source",
  "send" + "Beacon",
  "ev" + "al(",
  "new " + "Function"
];

const remoteReferencePattern = /\b(?:https?:)?\/\//i;
const scannedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".json", ".css"]);
const ignoredDirs = new Set(["node_modules", "dist", ".git", "coverage", "external"]);

describe("source security posture", () => {
  it("keeps app source free of network and dynamic-code APIs", () => {
    const findings = [];
    for (const file of walk(process.cwd())) {
      const rel = relative(process.cwd(), file).replaceAll("\\", "/");
      const text = readFileSync(file, "utf8");
      for (const token of forbiddenTokens) {
        if (text.includes(token)) {
          findings.push(`${rel}: forbidden API token ${JSON.stringify(token)}`);
        }
      }
      if (!rel.startsWith("package") && remoteReferencePattern.test(text)) {
        findings.push(`${rel}: remote URL reference detected`);
      }
    }

    expect(findings).toEqual([]);
  });

  it("keeps local and extension CSP locked down", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "public", "manifest.json"), "utf8"));
    const extensionCsp = manifest.content_security_policy?.extension_pages || "";
    const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");

    expect(extensionCsp).toContain("connect-src 'none'");
    expect(indexHtml).toContain("connect-src 'none'");
    expect(indexHtml).not.toMatch(/\son[a-z]+\s*=|javascript:/i);
  });
});

function extensionOf(fileName) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index) : "";
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, files);
      continue;
    }
    if (scannedExtensions.has(extensionOf(entry))) {
      files.push(path);
    }
  }
  return files;
}
