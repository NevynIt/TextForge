import fs from "node:fs";
import path from "node:path";
import "./generate-views.mjs";

const check = process.argv.includes("--check");
const source = path.resolve("roadmap/views/dependency-map-full.md");
const target = path.resolve("docs/architecture/dependency-map.md");
if (fs.existsSync(source) && fs.existsSync(path.dirname(target))) {
  const generated = fs.readFileSync(source, "utf8");
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (check) {
    if (current !== generated) {
      console.error("docs/architecture/dependency-map.md is out of date");
      process.exitCode = 1;
    }
  } else if (current !== generated) {
    fs.writeFileSync(target, generated, "utf8");
  }
}
