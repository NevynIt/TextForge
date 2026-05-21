import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const root = process.cwd();
const distDir = join(root, "dist");
const browserCandidates = [
  process.env.BROWSER_NO_NETWORK_SMOKE_BROWSER,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "msedge"
].filter(Boolean);

await access(join(distDir, "index.html"), fsConstants.F_OK);
await mkdir(join(distDir, ".smoke"), { recursive: true });

const browserPath = browserCandidates.find((candidate) => candidate === "msedge" || existsSync(candidate));
if (!browserPath) {
  throw new Error("Unable to locate Microsoft Edge. Set BROWSER_NO_NETWORK_SMOKE_BROWSER to a browser executable.");
}

const userDataDir = join(distDir, ".smoke", "edge-profile");
const harnessPath = join(distDir, ".smoke", "browser-no-network-smoke.html");
const harnessUrl = pathToFileURL(harnessPath).href;

await rm(userDataDir, { recursive: true, force: true });
await writeFile(harnessPath, smokeHarnessHtml(), "utf8");

try {
  const dom = await runHeadlessDump(browserPath, harnessUrl, userDataDir);
  const json = extractResults(dom);
  const failures = [];
  if (json.errors?.length) {
    failures.push(`automation errors: ${json.errors.join("; ")}`);
  }
  if (json.networkAttempts?.length) {
    failures.push(`network attempts: ${JSON.stringify(json.networkAttempts)}`);
  }
  const requiredSteps = ["ready", "batch-upload", "markdown-view", "resources", "lua-popup"];
  const missingSteps = requiredSteps.filter((step) => !(json.steps || []).includes(step));
  if (missingSteps.length) {
    failures.push(`missing steps: ${missingSteps.join(", ")}`);
  }
  if (!Array.isArray(json.badges) || new Set(json.badges).size !== json.badges.length) {
    failures.push("document badges were not unique during batch upload smoke.");
  }
  if (failures.length) {
    throw new Error(failures.join(" | "));
  }
  console.log("Browser no-network smoke passed.");
  console.log(JSON.stringify(json, null, 2));
} catch (error) {
  if (isUnsupportedHeadlessEnvironment(error)) {
    console.warn("Browser no-network smoke skipped: headless Edge is not usable in this environment.");
    console.warn(String(error instanceof Error ? error.message : error));
  } else {
    throw error;
  }
} finally {
  await rm(userDataDir, { recursive: true, force: true });
  await rm(harnessPath, { force: true });
}

function smokeHarnessHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob: 'unsafe-inline'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'none';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TextForge Browser No-Network Smoke</title>
    <link rel="stylesheet" href="../textforge.css" />
    <script>
      window.__networkAttempts = [];
      window.__smokeErrors = [];
      window.addEventListener("error", (event) => {
        window.__smokeErrors.push(event.message || String(event.error || "window error"));
      });
      window.addEventListener("unhandledrejection", (event) => {
        window.__smokeErrors.push(String(event.reason || "unhandled rejection"));
      });

      const blocked = (kind, detail) => {
        window.__networkAttempts.push({ kind, detail });
        throw new Error("Blocked network attempt via " + kind);
      };

      window.fetch = (...args) => blocked("fetch", args[0]);
      window.WebSocket = function WebSocket(url) { blocked("WebSocket", url); };
      window.EventSource = function EventSource(url) { blocked("EventSource", url); };
      const originalSendBeacon = navigator.sendBeacon?.bind(navigator);
      navigator.sendBeacon = (...args) => {
        window.__networkAttempts.push({ kind: "sendBeacon", detail: args[0] });
        return false;
      };
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this.__blockedUrl = url;
        return originalOpen.call(this, method, url, ...rest);
      };
      XMLHttpRequest.prototype.send = function(...args) {
        return blocked("XMLHttpRequest", this.__blockedUrl || args[0]);
      };
      window.__restoreSendBeacon = () => {
        if (originalSendBeacon) {
          navigator.sendBeacon = originalSendBeacon;
        }
      };
    </script>
  </head>
  <body>
    <div id="app"></div>
    <pre id="smoke-results">pending</pre>
    <script src="../textforge.js"></script>
    <script>
      const smokeState = { steps: [], errors: [], networkAttempts: window.__networkAttempts, badges: [] };

      function record(step) {
        smokeState.steps.push(step);
      }

      function waitFor(predicate, label, timeout = 25000) {
        const start = Date.now();
        return new Promise((resolve, reject) => {
          const tick = () => {
            try {
              const value = predicate();
              if (value) {
                resolve(value);
                return;
              }
            } catch (error) {
              reject(error);
              return;
            }
            if (Date.now() - start > timeout) {
              reject(new Error("Timed out waiting for " + label));
              return;
            }
            setTimeout(tick, 50);
          };
          tick();
        });
      }

      function click(element) {
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));
      }

      function findButton(label) {
        return Array.from(document.querySelectorAll("button")).find((button) => (button.textContent || "").replace(/\\s+/g, " ").includes(label));
      }

      function findTab(label) {
        return Array.from(document.querySelectorAll(".document-tabs > button")).find((button) => (button.textContent || "").includes(label));
      }

      async function openFiles(files) {
        const input = await waitFor(() => document.querySelector(".file-button input[type=file]"), "file input");
        const transfer = new DataTransfer();
        files.forEach((file) => transfer.items.add(new File([file.text], file.name, { type: file.type })));
        Object.defineProperty(input, "files", { configurable: true, value: transfer.files });
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await waitFor(() => document.querySelectorAll(".document-tabs > button").length >= files.length + 1, "uploaded tabs");
      }

      async function runPipeline(id) {
        const select = document.querySelector(".pipeline-picker select");
        if (select) {
          select.value = id;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
        const button = document.querySelector(".pipeline-picker button");
        if (!button) {
          throw new Error("Missing pipeline control for " + id);
        }
        click(button);
      }

      function uniqueBadgeTitles() {
        return Array.from(document.querySelectorAll(".document-tabs .document-badge")).map((badge) => badge.getAttribute("title"));
      }

      async function main() {
        try {
          await waitFor(() => document.body.textContent.includes("Ready."), "app ready");
          record("ready");

          await openFiles([
            {
              name: "smoke.md",
              type: "text/markdown",
              text: "# Smoke\\n\\n\`\`\`mermaid\\ngraph TD\\n  A --> B\\n\`\`\`"
            },
            {
              name: "notes.txt",
              type: "text/plain",
              text: "plain text"
            }
          ]);
          record("batch-upload");
          smokeState.badges = uniqueBadgeTitles().filter(Boolean);

          const markdownTab = findTab("smoke.md");
          if (!markdownTab) {
            throw new Error("Markdown tab missing");
          }
          click(markdownTab);
          await runPipeline("view-markdown-html");
          await waitFor(() => document.querySelector(".rendered-markdown .tf-embedded-artifact svg"), "markdown viewer");
          record("markdown-view");

          const resourcesButton = findButton("Resources");
          if (!resourcesButton) {
            throw new Error("Resources button missing");
          }
          click(resourcesButton);
          await waitFor(() => document.querySelector(".resource-browser-panel"), "resource browser");
          record("resources");

          const luaButton = findButton("Lua");
          if (!luaButton) {
            throw new Error("Lua button missing");
          }
          click(luaButton);
          await waitFor(() => document.querySelector(".lua-console-panel"), "lua console");
          record("lua-popup");
        } catch (error) {
          smokeState.errors.push(error instanceof Error ? error.message : String(error));
        } finally {
          if (window.__smokeErrors.length) {
            smokeState.errors.push(...window.__smokeErrors);
          }
          document.getElementById("smoke-results").textContent = JSON.stringify(smokeState);
          document.documentElement.setAttribute("data-smoke-complete", "true");
          window.__restoreSendBeacon?.();
        }
      }

      window.addEventListener("load", () => {
        void main();
      });
    </script>
  </body>
</html>`;
}

function runHeadlessDump(browserPath, url, userDataDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      browserPath,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--disable-extensions",
        "--disable-features=VizDisplayCompositor,RendererCodeIntegrity",
        "--no-first-run",
        "--no-default-browser-check",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=25000",
        `--user-data-dir=${userDataDir}`,
        "--dump-dom",
        url
      ],
      { cwd: root, stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Browser smoke failed with exit code ${code}: ${stderr || stdout}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function extractResults(dom) {
  const match = /<pre id="smoke-results">([\s\S]*?)<\/pre>/i.exec(dom);
  if (!match) {
    throw new Error(`Unable to locate smoke results in dumped DOM. Output preview: ${dom.slice(0, 500)}`);
  }
  return JSON.parse(unescapeHtml(match[1]));
}

function unescapeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function isUnsupportedHeadlessEnvironment(error) {
  const message = String(error instanceof Error ? error.message : error);
  return message.includes("GPU process isn't usable") || message.includes("gpu_process_host.cc");
}
