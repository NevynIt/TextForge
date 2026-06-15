import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolveReleaseVersion } from './release-version.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const repoDir = path.resolve(appDir, '..', '..');
const distDir = path.join(appDir, 'dist');
const releasesDir = path.join(appDir, 'releases');
const versionConfigPath = path.join(appDir, 'release-version.json');
const releaseStatePath = path.join(repoDir, 'tmp', 'textforge-web-release-state.json');
const archiveRootDir = path.join(repoDir, 'tmp', `textforge-web-release-root-${process.pid}`);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function toPowerShellLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function zipDirectoryContents(sourceDir, zipPath) {
  if (process.platform === 'win32') {
    const powershell = path.join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
    const command = `Get-ChildItem -LiteralPath ${toPowerShellLiteral(sourceDir)} -Force | Compress-Archive -DestinationPath ${toPowerShellLiteral(zipPath)} -CompressionLevel Optimal`;

    await run(
      powershell,
      [
        '-NoProfile',
        '-Command',
        command,
      ],
      { cwd: appDir }
    );
    return;
  }

  await run('zip', ['-rq', zipPath, '.'], { cwd: sourceDir });
}

await stat(distDir);
await mkdir(releasesDir, { recursive: true });

const { currentCommit, minor, patch, version, markerFileName, state } = resolveReleaseVersion({
  repoDir,
  versionConfigPath,
  releaseStatePath,
});
const archiveName = `TextForge ${version}.zip`;
const archivePath = path.join(releasesDir, archiveName);

await rm(archivePath, { force: true });
await rm(archiveRootDir, { recursive: true, force: true });
await mkdir(archiveRootDir, { recursive: true });
await cp(distDir, archiveRootDir, { recursive: true });
await writeFile(path.join(archiveRootDir, markerFileName), '', 'utf8');
try {
  await zipDirectoryContents(archiveRootDir, archivePath);
} finally {
  await rm(archiveRootDir, { recursive: true, force: true });
}

await mkdir(path.dirname(releaseStatePath), { recursive: true });
const sameBuiltCommit = currentCommit && state?.minor === minor && state?.lastBuiltCommit === currentCommit;
const nextPatch = sameBuiltCommit
  ? Math.max(state.nextPatch ?? patch + 1, patch + 1)
  : patch + 1;
await writeFile(
  releaseStatePath,
  `${JSON.stringify({
    minor,
    nextPatch,
    lastBuiltCommit: currentCommit,
    lastBuiltPatch: patch,
  }, null, 2)}\n`,
  'utf8'
);

console.log(`Created ${archiveName}`);
