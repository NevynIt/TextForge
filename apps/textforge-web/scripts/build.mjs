import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = resolve(rootDir, 'dist');

await rm(distDir, { recursive: true, force: true });

async function copyEntry(sourcePath, targetPath) {
  const stats = await stat(sourcePath);
  if (stats.isDirectory()) {
    await mkdir(targetPath, { recursive: true });
    const entries = await readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      await copyEntry(resolve(sourcePath, entry.name), resolve(targetPath, entry.name));
    }
    return;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

await copyEntry(resolve(rootDir, 'index.html'), resolve(distDir, 'index.html'));
await copyEntry(resolve(rootDir, 'src'), resolve(distDir, 'src'));
await copyEntry(resolve(rootDir, '..', '..', 'packages'), resolve(distDir, 'packages'));

await stat(resolve(distDir, 'index.html'));
console.info(`Built TextForge web shell into ${distDir}`);
