import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const forbiddenTokens = [
  "fet" + "ch(",
  "XML" + "HttpRequest",
  "Web" + "Socket",
  "Event" + "Source",
  "send" + "Beacon",
  "ev" + "al(",
  "new " + "Function",
  "show" + "OpenFilePicker",
  "show" + "SaveFilePicker",
  "show" + "DirectoryPicker",
  "FileSystem" + "FileHandle",
  "FileSystem" + "DirectoryHandle",
  ["FileSystem", "H", "andle"].join(""),
  ["getAs", "FileSystem", "H", "andle"].join(""),
  "webkit" + "GetAsEntry",
  ["webkit", "dir", "ectory"].join(""),
  "chrome." + "fileSystem",
  "native" + "Messaging"
];
const forbiddenBuildTokens = forbiddenTokens.filter((token) => ![
  "fet" + "ch(",
  "XML" + "HttpRequest",
  "Web" + "Socket",
  "Event" + "Source",
  "send" + "Beacon",
  "ev" + "al(",
  "new " + "Function"
].includes(token));
const remoteReferencePattern = /https?:\/\//i;
const scannedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".json", ".css"]);
const ignoredDirs = new Set(["node_modules", "dist", ".git", "coverage", "external"]);

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

const findings = [];
for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const text = readFileSync(file, "utf8");
  for (const token of forbiddenTokens) {
    if (text.includes(token)) {
      findings.push(`${rel}: forbidden API token "${token}"`);
    }
  }
  if (!rel.startsWith("package") && remoteReferencePattern.test(text)) {
    findings.push(`${rel}: remote URL reference detected`);
  }
}
for (const file of walk(join(root, "dist"))) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const text = readFileSync(file, "utf8");
  for (const token of forbiddenBuildTokens) {
    if (text.includes(token)) {
      findings.push(`${rel}: forbidden API token "${token}"`);
    }
  }
}

const manifest = JSON.parse(readFileSync(join(root, "public", "manifest.json"), "utf8"));
const extensionCsp = manifest.content_security_policy?.extension_pages || "";
if (!extensionCsp.includes("connect-src 'none'")) {
  findings.push("public/manifest.json: extension CSP must keep connect-src 'none'");
}

const indexHtml = readFileSync(join(root, "index.html"), "utf8");
if (!indexHtml.includes("connect-src 'none'")) {
  findings.push("index.html: local CSP must keep connect-src 'none'");
}
if (/\son[a-z]+\s*=|javascript:/i.test(indexHtml)) {
  findings.push("index.html: inline event handler or javascript: URL detected");
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("Security verification passed.");
