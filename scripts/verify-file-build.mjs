import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const indexPath = join(dist, "index.html");
const scriptPath = join(dist, "textforge.js");
const stylePath = join(dist, "textforge.css");
const manifestPath = join(dist, "manifest.json");

const findings = [];
const forbiddenExecutablePatterns = [
  {
    name: "global fetch",
    pattern: /(^|[^\w$.}])fetch\s*\(/g,
    allowedContext: ["document.baseURI", "arrayBuffer"]
  },
  { name: "WebSocket", pattern: /\bnew\s+WebSocket\b/g },
  { name: "EventSource", pattern: /\bnew\s+EventSource\b/g },
  { name: "navigator.sendBeacon", pattern: /\bnavigator\s*\.\s*sendBeacon\s*\(/g },
  { name: "eval", pattern: /\beval\s*\(/g },
  { name: "new Function", pattern: /\bnew\s+Function\b/g },
  { name: "remote dynamic import", pattern: /\bimport\s*\(\s*["'](?:https?:)?\/\//gi }
];

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
  findings.push(...remoteHtmlReferences(html, "dist/index.html"));
}

if (!existsSync(scriptPath)) {
  findings.push("dist/textforge.js is missing.");
} else {
  const js = readFileSync(scriptPath, "utf8");
  if (/(^|[^\w$.}])import\s*\(/.test(js) || /(^|[;\n])\s*import\s+[\w{*]/.test(js)) {
    findings.push("dist/textforge.js must not contain runtime ES module imports for file:// mode.");
  }
  const executableJs = stripJsCommentsAndStrings(js);
  for (const { name, pattern, allowedContext } of forbiddenExecutablePatterns) {
    if (hasUnexpectedExecutableUse(executableJs, pattern, allowedContext)) {
      findings.push(`dist/textforge.js contains executable use of ${name}.`);
    }
  }
}

if (!existsSync(stylePath)) {
  findings.push("dist/textforge.css is missing.");
} else {
  const css = stripCssComments(readFileSync(stylePath, "utf8"));
  findings.push(...remoteCssReferences(css, "dist/textforge.css"));
}

if (!existsSync(manifestPath)) {
  findings.push("dist/manifest.json is missing.");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const extensionCsp = manifest.content_security_policy?.extension_pages || "";
  if (!extensionCsp.includes("connect-src 'none'")) {
    findings.push("dist/manifest.json must keep extension connect-src 'none'.");
  }
  if ((manifest.host_permissions || []).length) {
    findings.push("dist/manifest.json must not request host permissions.");
  }
  if ((manifest.permissions || []).includes("scripting")) {
    findings.push("dist/manifest.json must not request extension scripting permission.");
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("File build verification passed.");

function remoteHtmlReferences(html, label) {
  const problems = [];
  const attributePattern = /\s(src|href|poster|action|formaction)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = attributePattern.exec(html))) {
    const attribute = match[1];
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    if (isRemoteReference(value)) {
      problems.push(`${label}: remote ${attribute} reference "${value}"`);
    }
  }
  return problems;
}

function remoteCssReferences(css, label) {
  const problems = [];
  const importPattern = /@import\s+(?:url\()?["']?([^"')\s]+)["']?\)?/gi;
  const urlPattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  let match;
  while ((match = importPattern.exec(css))) {
    if (isRemoteReference(match[1])) {
      problems.push(`${label}: remote @import reference "${match[1]}"`);
    }
  }
  while ((match = urlPattern.exec(css))) {
    if (isRemoteReference(match[1])) {
      problems.push(`${label}: remote url() reference "${match[1]}"`);
    }
  }
  return problems;
}

function isRemoteReference(value) {
  return /^(?:https?:)?\/\//i.test(value.trim());
}

function hasUnexpectedExecutableUse(source, pattern, allowedContext = []) {
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(source))) {
    const start = Math.max(0, match.index - 600);
    const end = Math.min(source.length, match.index + match[0].length + 600);
    const context = source.slice(start, end);
    if (!allowedContext.some((marker) => context.includes(marker))) {
      return true;
    }
  }
  return false;
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripJsCommentsAndStrings(source) {
  let output = "";
  let state = "code";
  let templateDepth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "line-comment") {
      if (char === "\n") {
        state = "code";
        output += "\n";
      }
      continue;
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        index += 1;
        state = "code";
      } else if (char === "\n") {
        output += "\n";
      }
      continue;
    }
    if (state === "single" || state === "double") {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if ((state === "single" && char === "'") || (state === "double" && char === '"')) {
        state = "code";
      }
      continue;
    }
    if (state === "template") {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === "`" && templateDepth === 0) {
        state = "code";
        continue;
      }
      if (char === "$" && next === "{") {
        templateDepth += 1;
        index += 1;
        output += " ";
        continue;
      }
      if (char === "}" && templateDepth > 0) {
        templateDepth -= 1;
        output += " ";
        continue;
      }
      if (templateDepth > 0) {
        output += char === "\n" ? "\n" : char;
      } else if (char === "\n") {
        output += "\n";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      state = "line-comment";
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      state = "block-comment";
      index += 1;
      continue;
    }
    if (char === "'") {
      state = "single";
      continue;
    }
    if (char === '"') {
      state = "double";
      continue;
    }
    if (char === "`") {
      state = "template";
      templateDepth = 0;
      continue;
    }
    output += char;
  }
  return output;
}
