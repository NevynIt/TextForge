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
const indexedWps = Object.entries(state.workpackages).map(([id, wp], index) => [id, wp, index]);
const planningSequence = state.value_oriented_planning_sequence?.workpackages ?? {};
const planningSequenceSource = state.value_oriented_planning_sequence?.source;
const wps = sortWps(indexedWps).map(([id, wp]) => [id, wp]);
const header = (title) => `# ${title}\n\n> Generated from \`roadmap-state.yaml\`. Do not edit manually.\n\n`;
const esc = (value) => String(value ?? "").replace(/\|/g, "\\|");
const planningNote = planningSequenceSource
  ? `Planning order follows \`${planningSequenceSource}\` via \`value_oriented_planning_sequence\` in \`roadmap-state.yaml\`.\n\n`
  : "";

function planningOrder(id) {
  return typeof planningSequence[id] === "number" ? planningSequence[id] : Number.POSITIVE_INFINITY;
}

function formatPlanningOrder(id) {
  const order = planningOrder(id);
  return Number.isFinite(order) ? String(order) : "";
}

function sortWps(entries) {
  return [...entries].sort(([aId, , aIndex], [bId, , bIndex]) => {
    const byPlanningOrder = planningOrder(aId) - planningOrder(bId);
    if (byPlanningOrder !== 0) return byPlanningOrder;
    return aIndex - bIndex;
  });
}

function compareWpIds(aId, bId) {
  const byPlanningOrder = planningOrder(aId) - planningOrder(bId);
  if (byPlanningOrder !== 0) return byPlanningOrder;
  return aId.localeCompare(bId);
}

function modulePlanningOrder(moduleId) {
  return wps
    .filter(([, wp]) => wp.module === moduleId)
    .reduce((min, [wpId]) => Math.min(min, planningOrder(wpId)), Number.POSITIVE_INFINITY);
}

const current = wps.filter(([, wp]) => ["in-progress", "ready", "blocked"].includes(wp.status));
const next = wps.filter(([, wp]) => ["defined", "candidate"].includes(wp.status));
writeIfChanged("views/current-next.md", `${header("Current And Next")}${planningNote}## Current\n\n| Plan | WP | Title | Status | Module |\n|---:|---|---|---|---|\n${current.map(([id, wp]) => `| ${formatPlanningOrder(id)} | \`${id}\` | ${esc(wp.title)} | ${wp.status} | \`${wp.module}\` |`).join("\n")}\n\n## Next Candidates\n\n| Plan | WP | Title | Status | Module |\n|---:|---|---|---|---|\n${next.map(([id, wp]) => `| ${formatPlanningOrder(id)} | \`${id}\` | ${esc(wp.title)} | ${wp.status} | \`${wp.module}\` |`).join("\n")}\n`);

const statusCounts = {};
for (const [, wp] of wps) statusCounts[wp.status] = (statusCounts[wp.status] || 0) + 1;
writeIfChanged("views/status-dashboard.md", `${header("Status Dashboard")}${planningNote}## Counts\n\n| Status | Count |\n|---|---:|\n${Object.entries(statusCounts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => `| ${status} | ${count} |`).join("\n")}\n\n## Workpackages\n\n| Plan | WP | Title | Status | Module |\n|---:|---|---|---|---|\n${wps.map(([id, wp]) => `| ${formatPlanningOrder(id)} | \`${id}\` | ${esc(wp.title)} | ${wp.status} | \`${wp.module}\` |`).join("\n")}\n`);

writeIfChanged("views/module-matrix.md", `${header("Module Matrix")}${planningNote}| Module | Title | Workpackages |\n|---|---|---|\n${Object.entries(state.modules).sort(([aId], [bId]) => modulePlanningOrder(aId) - modulePlanningOrder(bId) || aId.localeCompare(bId)).map(([id, module]) => { const wpList = wps.filter(([, wp]) => wp.module === id).map(([wpId]) => `\`${wpId}\``).join(", "); return `| \`${id}\` | ${esc(module.title)} | ${wpList || "None"} |`; }).join("\n")}\n`);

const edges = [];
for (const [id, wp] of wps) {
  for (const dep of wp.depends_on || []) {
    if (state.workpackages[dep]) edges.push(`  ${dep.replaceAll("-", "_")}["${dep}"] --> ${id.replaceAll("-", "_")}["${id}"]`);
  }
}
edges.sort((a, b) => {
  const [aFrom, aTo] = Array.from(a.matchAll(/WP_[A-Z0-9_]+/g)).map((m) => m[0].replaceAll("_", "-"));
  const [bFrom, bTo] = Array.from(b.matchAll(/WP_[A-Z0-9_]+/g)).map((m) => m[0].replaceAll("_", "-"));
  return compareWpIds(aTo, bTo) || compareWpIds(aFrom, bFrom);
});
const nextSet = new Set(current.concat(next).map(([id]) => id));
const nextEdges = edges.filter((edge) => Array.from(edge.matchAll(/WP_[A-Z0-9_]+/g)).map((m) => m[0].replaceAll("_", "-")).every((id) => nextSet.has(id)));
writeIfChanged("views/dependency-map-full.md", `${header("Dependency Map Full")}${planningNote}\`\`\`mermaid\ngraph TD\n${edges.length ? edges.join("\n") : "  NoDependencies[\"No dependencies registered\"]"}\n\`\`\`\n`);
writeIfChanged("views/dependency-map-next.md", `${header("Dependency Map Next")}${planningNote}\`\`\`mermaid\ngraph TD\n${nextEdges.length ? nextEdges.join("\n") : "  NoDependencies[\"No next-scope dependencies registered\"]"}\n\`\`\`\n`);
