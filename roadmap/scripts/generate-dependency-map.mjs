import { readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const registerPath = resolve(repoRoot, 'roadmap', 'workpackages', 'workpackage-register.md');
const implementationStatusPath = resolve(repoRoot, 'roadmap', 'workpackages', 'implementation-status.md');
const outputPath = resolve(repoRoot, 'roadmap', 'workpackages', 'dependency-map.md');
const checkMode = process.argv.includes('--check');

const includedWorkpackageIds = [
  'WP-05A',
  'WP-05B',
  'WP-05C',
  'WP-05D',
  'WP-SET-01',
  'WP-ITM-01',
  'WP-LUA',
  'WP-LUA-POWER-SESSION',
  'WP-RES-01',
  'WP-RES-02',
  'WP-RES-03',
  'WP-REPO-01',
  'WP-ITM-02',
  'WP-ITM-VISUALS',
  'WP-VITM-01',
  'WP-ITM-VTARGET-01',
  'WP-ITM-VRESOLVE-01',
  'WP-RENDER-CYTOSCAPE',
  'WP-ITM-PUB-VISUAL-01',
  'WP-RENDER-JSMIND',
  'WP-RENDER-SIGMA',
  'WP-VITM-TRANSLATORS',
  'WP-GRAPH-EDIT-VITM',
  'WP-MD-REPORT',
  'WP-ID-01',
  'WP-ID-DEV',
  'WP-POLICY-01',
  'WP-BE-HOST',
  'WP-BE-API',
  'WP-BE-PERSIST',
  'WP-SSO-ENTRA',
  'WP-SSO-OIDC',
  'WP-SSO-SAML',
  'WP-PRIVATE-SERVER',
  'WP-SET-SYNC',
  'WP-GITLAB',
  'WP-SERVICES-BE',
  'WP-COLLAB-LEASES',
  'WP-AI-MEDIATOR',
  'WP-AI-CHAT',
  'WP-AI-PREF',
  'WP-BPMN-SEM',
  'WP-BPMN-VISUAL-A',
  'WP-BPMN-VISUAL-B',
  'WP-BPMN-VISUAL-C',
  'WP-ARCHIMATE-SEM',
  'WP-ARCHIMATE-VISUAL',
  'WP-TABLES',
  'WP-PIPELINE-EDITOR',
  'WP-PDF-EXPORT',
  'WP-PDF-ANNOTATE',
  'WP-SKETCH',
  'WP-RELEASE-GATE',
];

const registerMarkdown = await readFile(registerPath, 'utf8');
const implementationStatusMarkdown = await readFile(implementationStatusPath, 'utf8');
const registerRows = parseTableAfterHeading(registerMarkdown, '## Register');
const implementationStatusRows = parseTableAfterHeading(implementationStatusMarkdown, '## Status update table');
const registerById = new Map(registerRows.map((row) => [row['WP ID'], row]));
const includedSet = new Set(includedWorkpackageIds);
const orderedIds = includedWorkpackageIds.filter((workpackageId) => registerById.has(workpackageId));

const missingFromRegister = includedWorkpackageIds.filter((workpackageId) => !registerById.has(workpackageId));
if (missingFromRegister.length > 0) {
  throw new Error(`Dependency-map generator is missing register rows for: ${missingFromRegister.join(', ')}`);
}

const completedIds = new Set();
for (const row of implementationStatusRows) {
  const workpackageId = row['WP ID'];
  const status = row.Status?.trim();
  if (!workpackageId || !status) {
    continue;
  }

  if (/^(Validated|Implemented)$/i.test(status)) {
    completedIds.add(workpackageId);
  }
}

for (const row of registerRows) {
  const workpackageId = row['WP ID'];
  const status = row.Status?.trim();
  if (!workpackageId || !status) {
    continue;
  }

  if (/^(Validated|Implemented)$/i.test(status)) {
    completedIds.add(workpackageId);
  }
}

const selectedStartableIds = new Set(extractCurrentStartableIds(implementationStatusMarkdown).filter((workpackageId) => includedSet.has(workpackageId)));
const dependencyReadyIds = computeDependencyReadyIds({ orderedIds, registerById, completedIds, includedSet });
const startableIds = new Set([...selectedStartableIds, ...dependencyReadyIds].filter((workpackageId) => !completedIds.has(workpackageId)));
const edges = buildEdges({ orderedIds, registerById, completedIds, startableIds, includedSet });
const generated = buildDocument({ orderedIds, registerById, completedIds, startableIds, edges });
const existing = await readFile(outputPath, 'utf8');

if (checkMode) {
  if (existing !== generated) {
    console.error(`Dependency map is out of date: ${relative(repoRoot, outputPath).replaceAll('\\', '/')}`);
    process.exit(1);
  }

  console.info(`Dependency map is up to date: ${relative(repoRoot, outputPath).replaceAll('\\', '/')}`);
  process.exit(0);
}

if (existing !== generated) {
  await writeFile(outputPath, generated, 'utf8');
  console.info(`Regenerated ${relative(repoRoot, outputPath).replaceAll('\\', '/')}.`);
} else {
  console.info(`No dependency-map changes were needed for ${relative(repoRoot, outputPath).replaceAll('\\', '/')}.`);
}

function buildEdges({ orderedIds, registerById, completedIds, startableIds, includedSet }) {
  const edges = [];
  const seenEdges = new Set();

  for (const targetId of orderedIds) {
    const row = registerById.get(targetId);
    const dependencySegments = splitDependencySegments(row['Depends on']);
    const blockingDependencyIds = [];
    let hasFoundationDependency = false;

    for (const segment of dependencySegments) {
      const dependencyIds = segment.match(/WP-[A-Z0-9-]+/g) ?? [];
      const nonBlocking = /\brecommended\b|\boptional\b/i.test(segment);
      if (/\bphase\b|\bfoundation\b/i.test(segment)) {
        hasFoundationDependency = true;
      }

      if (nonBlocking) {
        continue;
      }

      for (const dependencyId of dependencyIds) {
        if (includedSet.has(dependencyId)) {
          blockingDependencyIds.push(dependencyId);
        }
      }
    }

    const uniqueBlockingDependencyIds = [...new Set(blockingDependencyIds)];
    if (uniqueBlockingDependencyIds.length > 0) {
      for (const sourceId of uniqueBlockingDependencyIds) {
        addEdge({ sourceId, targetId });
      }
      continue;
    }

    if (hasFoundationDependency || startableIds.has(targetId)) {
      addEdge({ sourceId: 'FOUNDATION', targetId });
    }
  }

  return edges;

  function addEdge({ sourceId, targetId }) {
    const key = `${sourceId}->${targetId}`;
    if (seenEdges.has(key)) {
      return;
    }

    const highlighted = isCompletedSource(sourceId) && startableIds.has(targetId);
    seenEdges.add(key);
    edges.push({ sourceId, targetId, highlighted });
  }

  function isCompletedSource(sourceId) {
    return sourceId === 'FOUNDATION' || completedIds.has(sourceId);
  }
}

function buildDocument({ orderedIds, registerById, completedIds, startableIds, edges }) {
  const completedAliases = ['FOUNDATION', ...orderedIds.filter((workpackageId) => completedIds.has(workpackageId)).map(toAlias)];
  const startableAliases = orderedIds.filter((workpackageId) => startableIds.has(workpackageId)).map(toAlias);
  const lines = [
    '# V19a Workpackage Dependency Map',
    '',
    '<!-- Generated by roadmap/scripts/generate-dependency-map.mjs from workpackage-register.md and implementation-status.md. Do not edit by hand. -->',
    '',
    '```mermaid',
    'flowchart TD',
  ];

  for (const edge of edges) {
    lines.push(`  ${formatNode(edge.sourceId, registerById)} --> ${formatNode(edge.targetId, registerById)}`);
  }

  lines.push('');
  lines.push('  classDef done fill:#2e7d32,stroke:#1b5e20,color:#ffffff,stroke-width:2px;');
  lines.push('  classDef startable fill:#1565c0,stroke:#0d47a1,color:#ffffff,stroke-width:2px;');
  lines.push('');

  if (completedAliases.length > 0) {
    lines.push(`  class ${completedAliases.join(',')} done;`);
  }
  if (startableAliases.length > 0) {
    lines.push(`  class ${startableAliases.join(',')} startable;`);
  }

  const highlightedEdges = edges
    .map((edge, index) => ({ edge, index }))
    .filter(({ edge }) => edge.highlighted);

  if (highlightedEdges.length > 0) {
    lines.push('');
    for (const { index } of highlightedEdges) {
      lines.push(`  linkStyle ${index} stroke:#1565c0,stroke-width:2px;`);
    }
  }

  lines.push('```');
  lines.push('');
  lines.push('## Selected V19a main chain');
  lines.push('');
  lines.push('```text');
  lines.push('WP-VITM-01');
  lines.push('  -> WP-ITM-VTARGET-01');
  lines.push('  -> WP-ITM-VRESOLVE-01');
  lines.push('  -> WP-RENDER-CYTOSCAPE');
  lines.push('  -> WP-RENDER-JSMIND');
  lines.push('  -> WP-RENDER-SIGMA');
  lines.push('  -> WP-BPMN-SEM');
  lines.push('  -> WP-BPMN-VISUAL-A');
  lines.push('  -> WP-BPMN-VISUAL-B');
  lines.push('```');
  lines.push('');
  lines.push('## Reading rule');
  lines.push('');
  lines.push('The graph shows dependency direction only. It is not a mandatory calendar sequence. Optional adapters should be scheduled only when a release profile needs them.');
  lines.push('');
  lines.push('## Status coloring guidance');
  lines.push('');
  lines.push('- Green nodes are completed or validated workpackages in the current roadmap baseline.');
  lines.push('- Blue nodes can be started now according to the current implementation baseline.');
  lines.push('- Candidate workpackages with satisfied dependencies should still appear as blue/startable when they are included in the current dependency view; sequencing remains a manual per-slice decision.');
  lines.push('- Blue edges indicate a direct dependency path from completed work to a startable node.');
  lines.push('- Nodes without explicit styling are not currently startable or not yet marked as completed.');
  lines.push('');
  return `${lines.join('\n')}`;
}

function computeDependencyReadyIds({ orderedIds, registerById, completedIds, includedSet }) {
  const dependencyReadyIds = [];

  for (const workpackageId of orderedIds) {
    if (completedIds.has(workpackageId)) {
      continue;
    }

    const row = registerById.get(workpackageId);
    const dependencySegments = splitDependencySegments(row['Depends on']);
    const blockingDependencyIds = [];

    for (const segment of dependencySegments) {
      const nonBlocking = /\brecommended\b|\boptional\b/i.test(segment);
      if (nonBlocking) {
        continue;
      }

      const dependencyIds = segment.match(/WP-[A-Z0-9-]+/g) ?? [];
      for (const dependencyId of dependencyIds) {
        if (includedSet.has(dependencyId)) {
          blockingDependencyIds.push(dependencyId);
        }
      }
    }

    const uniqueBlockingDependencyIds = [...new Set(blockingDependencyIds)];
    if (uniqueBlockingDependencyIds.length === 0) {
      continue;
    }

    const isDependencyReady = uniqueBlockingDependencyIds.every((dependencyId) => completedIds.has(dependencyId));
    if (isDependencyReady) {
      dependencyReadyIds.push(workpackageId);
    }
  }

  return new Set(dependencyReadyIds);
}

function formatNode(workpackageId, registerById) {
  if (workpackageId === 'FOUNDATION') {
    return 'FOUNDATION[Frozen baseline\\nValidated foundations]';
  }

  const row = registerById.get(workpackageId);
  return `${toAlias(workpackageId)}[${workpackageId}\\n${row.Title}]`;
}

function toAlias(workpackageId) {
  return workpackageId.replaceAll(/[^A-Z0-9]+/g, '_');
}

function extractCurrentStartableIds(markdown) {
  const baselineRows = parseTableAfterHeading(markdown, '## Current baseline');
  const nextOptionsRow = baselineRows.find((row) => row.Area === 'Next implementation options');
  if (!nextOptionsRow) {
    return [];
  }

  return [...new Set(nextOptionsRow['Current state'].match(/WP-[A-Z0-9-]+/g) ?? [])];
}

function splitDependencySegments(dependsOn) {
  if (!dependsOn) {
    return [];
  }

  return dependsOn
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function parseTableAfterHeading(markdown, heading) {
  const headingIndex = markdown.indexOf(heading);
  if (headingIndex < 0) {
    throw new Error(`Could not find heading: ${heading}`);
  }

  const lines = markdown.slice(headingIndex).split(/\r?\n/);
  let tableStart = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('|')) {
      tableStart = index;
      break;
    }
    if (lines[index].startsWith('## ')) {
      break;
    }
  }

  if (tableStart < 0 || tableStart + 1 >= lines.length) {
    return [];
  }

  const headerCells = splitTableRow(lines[tableStart]);
  const rows = [];
  for (let index = tableStart + 2; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith('|')) {
      break;
    }

    const cells = splitTableRow(line);
    const row = {};
    for (let cellIndex = 0; cellIndex < headerCells.length; cellIndex += 1) {
      row[headerCells[cellIndex]] = cells[cellIndex] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}