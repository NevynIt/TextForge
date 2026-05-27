import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const generatorScriptPath = resolve(repoRoot, 'roadmap', 'scripts', 'generate-dependency-map.mjs');
const sourcePath = resolve(repoRoot, 'roadmap', 'workpackages', 'dependency-map.md');
const publishedPath = resolve(repoRoot, 'docs', 'design', 'dependency-map.md');
const checkMode = process.argv.includes('--check');

await runGenerator({ checkMode });

const sourceMarkdown = await readFile(sourcePath, 'utf8');
let existingPublishedMarkdown = '';
try {
  existingPublishedMarkdown = await readFile(publishedPath, 'utf8');
} catch {
  existingPublishedMarkdown = '';
}

if (checkMode) {
  if (existingPublishedMarkdown !== sourceMarkdown) {
    console.error(`Published dependency map is out of date: ${toRepoPath(publishedPath)}`);
    process.exit(1);
  }

  console.info(`Published dependency map is up to date: ${toRepoPath(publishedPath)}`);
  process.exit(0);
}

if (existingPublishedMarkdown !== sourceMarkdown) {
  await mkdir(dirname(publishedPath), { recursive: true });
  await writeFile(publishedPath, sourceMarkdown, 'utf8');
  console.info(`Published dependency map to ${toRepoPath(publishedPath)}.`);
} else {
  console.info(`No publish changes were needed for ${toRepoPath(publishedPath)}.`);
}

async function runGenerator({ checkMode }) {
  const args = [generatorScriptPath];
  if (checkMode) {
    args.push('--check');
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.once('error', (error) => {
      rejectPromise(error);
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Dependency-map generation failed with exit code ${code ?? 'null'}.`));
    });
  });
}

function toRepoPath(filePath) {
  return relative(repoRoot, filePath).replaceAll('\\', '/');
}