import { mkdir, rm, copyFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = resolve(rootDir, 'dist');
const filesToCopy = [
  ['index.html', 'index.html'],
  ['src/main.js', 'src/main.js'],
  ['src/styles.css', 'src/styles.css'],
];

await rm(distDir, { recursive: true, force: true });
for (const [source, target] of filesToCopy) {
  const sourcePath = resolve(rootDir, source);
  const targetPath = resolve(distDir, target);
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

await stat(resolve(distDir, 'index.html'));
console.info(`Built TextForge web shell into ${distDir}`);
