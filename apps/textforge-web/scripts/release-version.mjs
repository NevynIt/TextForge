import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export const releaseMajor = 2;

export function assertMinor(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`release-version.json must contain a non-negative integer minor value, got ${value}`);
  }
  return value;
}

export function getPatchForBuild(state, minor) {
  if (!state || state.minor !== minor || !Number.isInteger(state.nextPatch) || state.nextPatch < 1) {
    return 1;
  }
  return state.nextPatch;
}

export function getCurrentGitCommit(repoDir) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoDir,
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    return undefined;
  }

  const commit = result.stdout.trim();
  return commit || undefined;
}

export function getReleasePatchForCommit(state, minor, currentCommit) {
  if (
    currentCommit
    && state
    && state.minor === minor
    && state.lastBuiltCommit === currentCommit
    && Number.isInteger(state.lastBuiltPatch)
    && state.lastBuiltPatch >= 1
  ) {
    return state.lastBuiltPatch;
  }

  return getPatchForBuild(state, minor);
}

export function readJsonFileSync(filePath, fallback) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

export function resolveReleaseVersion({ repoDir, versionConfigPath, releaseStatePath }) {
  const versionConfig = readJsonFileSync(versionConfigPath, null);
  if (!versionConfig) {
    throw new Error(`Missing release version config at ${versionConfigPath}`);
  }

  const minor = assertMinor(versionConfig.minor);
  const state = readJsonFileSync(releaseStatePath, null);
  const currentCommit = repoDir ? getCurrentGitCommit(repoDir) : undefined;
  const patch = getReleasePatchForCommit(state, minor, currentCommit);
  const version = `${releaseMajor}.${minor}.${patch}`;

  return {
    currentCommit,
    major: releaseMajor,
    minor,
    patch,
    state,
    version,
    markerFileName: `TextForge ${version}`,
  };
}
