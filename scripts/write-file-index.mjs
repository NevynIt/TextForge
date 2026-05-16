import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self' blob: data:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TextForge</title>
    <link rel="stylesheet" href="./textforge.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="./textforge.js"></script>
  </body>
</html>
`;

writeFileSync(join(dist, "index.html"), html, "utf8");

const manifestSource = join(root, "public", "manifest.json");
if (existsSync(manifestSource)) {
  copyFileSync(manifestSource, join(dist, "manifest.json"));
}

console.log("Wrote file:// compatible dist/index.html.");
