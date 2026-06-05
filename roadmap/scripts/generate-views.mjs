import fs from "node:fs";
import path from "node:path";

const roadmap = path.resolve("roadmap");
const statePath = path.join(roadmap, "roadmap-state.yaml");
const check = process.argv.includes("--check");

function writeIfChanged(relativePath, content) {
  const fullPath = path.join(roadmap, relativePath);
  const normalized = content.replace(/\r?\n/g, "\n");
  const current = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8").replace(/\r?\n/g, "\n") : null;
  if (check) {
    if (current !== normalized) {
      console.error(`${relativePath} is out of date`);
      process.exitCode = 1;
    }
    return;
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, normalized, "utf8");
}

const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const wps = Object.entries(state.workpackages);
const header = (title) => `# ${title}\n\n> Generated from \`roadmap-state.yaml\`. Do not edit manually.\n\n`;
const esc = (value) => String(value ?? "").replace(/\|/g, "\\|");

const current = wps.filter(([, wp]) => ["in-progress", "ready", "blocked"].includes(wp.status));
const next = wps.filter(([, wp]) => ["defined", "candidate"].includes(wp.status)).slice(0, 25);
writeIfChanged("views/current-next.md", `${header("Current And Next")}## Current\n\n| WP | Title | Status | Module |\n|---|---|---|---|\n${current.map(([id, wp]) => `| \`${id}\` | ${esc(wp.title)} | ${wp.status} | \`${wp.module}\` |`).join("\n")}\n\n## Next Candidates\n\n| WP | Title | Status | Module |\n|---|---|---|---|\n${next.map(([id, wp]) => `| \`${id}\` | ${esc(wp.title)} | ${wp.status} | \`${wp.module}\` |`).join("\n")}\n`);

const statusCounts = {};
for (const [, wp] of wps) statusCounts[wp.status] = (statusCounts[wp.status] || 0) + 1;
writeIfChanged("views/status-dashboard.md", `${header("Status Dashboard")}## Counts\n\n| Status | Count |\n|---|---:|\n${Object.entries(statusCounts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => `| ${status} | ${count} |`).join("\n")}\n\n## Workpackages\n\n| WP | Title | Status | Module |\n|---|---|---|---|\n${wps.map(([id, wp]) => `| \`${id}\` | ${esc(wp.title)} | ${wp.status} | \`${wp.module}\` |`).join("\n")}\n`);

writeIfChanged("views/module-matrix.md", `${header("Module Matrix")}| Module | Title | Workpackages |\n|---|---|---|\n${Object.entries(state.modules).map(([id, module]) => { const wpList = wps.filter(([, wp]) => wp.module === id).map(([wpId]) => `\`${wpId}\``).join(", "); return `| \`${id}\` | ${esc(module.title)} | ${wpList || "None"} |`; }).join("\n")}\n`);

const edges = [];
for (const [id, wp] of wps) {
  for (const dep of wp.depends_on || []) {
    if (state.workpackages[dep]) edges.push(`  ${dep.replaceAll("-", "_")}["${dep}"] --> ${id.replaceAll("-", "_")}["${id}"]`);
  }
}
const nextSet = new Set(current.concat(next).map(([id]) => id));
const nextEdges = edges.filter((edge) => Array.from(edge.matchAll(/WP_[A-Z0-9_]+/g)).map((m) => m[0].replaceAll("_", "-")).every((id) => nextSet.has(id)));
writeIfChanged("views/dependency-map-full.md", `${header("Dependency Map Full")}\`\`\`mermaid\ngraph TD\n${edges.length ? edges.join("\n") : "  NoDependencies[\"No dependencies registered\"]"}\n\`\`\`\n`);
writeIfChanged("views/dependency-map-next.md", `${header("Dependency Map Next")}\`\`\`mermaid\ngraph TD\n${nextEdges.length ? nextEdges.join("\n") : "  NoDependencies[\"No next-scope dependencies registered\"]"}\n\`\`\`\n`);
