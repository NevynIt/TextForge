import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const repoDir = path.resolve(appDir, '..', '..');
const distDir = path.join(appDir, 'dist');
const releasesDir = path.join(appDir, 'releases');
const versionConfigPath = path.join(appDir, 'release-version.json');
const releaseStatePath = path.join(repoDir, 'tmp', 'textforge-web-release-state.json');
const releaseMajor = 2;

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

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

function assertMinor(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`release-version.json must contain a non-negative integer minor value, got ${value}`);
  }
  return value;
}

function getPatchForBuild(state, minor) {
  if (!state || state.minor !== minor || !Number.isInteger(state.nextPatch) || state.nextPatch < 1) {
    return 1;
  }
  return state.nextPatch;
}

function toPowerShellLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function zipDist(zipPath) {
  if (process.platform === 'win32') {
    const powershell = path.join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
    const command = `Compress-Archive -LiteralPath ${toPowerShellLiteral(distDir)} -DestinationPath ${toPowerShellLiteral(zipPath)} -CompressionLevel Optimal`;

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

  await run('zip', ['-rq', zipPath, path.basename(distDir)], { cwd: appDir });
}

await stat(distDir);
await mkdir(releasesDir, { recursive: true });

const versionConfig = await readJson(versionConfigPath, null);
if (!versionConfig) {
  throw new Error(`Missing release version config at ${versionConfigPath}`);
}

const minor = assertMinor(versionConfig.minor);
const state = await readJson(releaseStatePath, null);
const patch = getPatchForBuild(state, minor);
const version = `${releaseMajor}.${minor}.${patch}`;
const archiveName = `TextForge ${version}.zip`;
const archivePath = path.join(releasesDir, archiveName);

await rm(archivePath, { force: true });
await zipDist(archivePath);

await mkdir(path.dirname(releaseStatePath), { recursive: true });
await writeFile(
  releaseStatePath,
  `${JSON.stringify({ minor, nextPatch: patch + 1 }, null, 2)}\n`,
  'utf8'
);

console.log(`Created ${archiveName}`);
