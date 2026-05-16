import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const indexPath = join(dist, "index.html");
const scriptPath = join(dist, "textforge.js");
const stylePath = join(dist, "textforge.css");

const findings = [];

if (!existsSync(indexPath)) {
  findings.push("dist/index.html is missing.");
} else {
  const html = readFileSync(indexPath, "utf8");
  if (html.includes('type="module"')) {
    findings.push("dist/index.html must not use module scripts for file:// mode.");
  }
  if (html.includes("modulepreload")) {
    findings.push("dist/index.html must not use modulepreload for file:// mode.");
  }
  if (!html.includes('<script src="./textforge.js"></script>')) {
    findings.push("dist/index.html must reference ./textforge.js as a classic script.");
  }
  if (!html.includes('<link rel="stylesheet" href="./textforge.css" />')) {
    findings.push("dist/index.html must reference ./textforge.css.");
  }
  if (!html.includes("connect-src 'none'")) {
    findings.push("dist/index.html must keep connect-src 'none'.");
  }
}

if (!existsSync(scriptPath)) {
  findings.push("dist/textforge.js is missing.");
} else {
  const js = readFileSync(scriptPath, "utf8");
  if (/(^|[^\w$.}])import\s*\(/.test(js) || /(^|[;\n])\s*import\s+[\w{*]/.test(js)) {
    findings.push("dist/textforge.js must not contain runtime ES module imports for file:// mode.");
  }
}

if (!existsSync(stylePath)) {
  findings.push("dist/textforge.css is missing.");
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("File build verification passed.");
