import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');

if (!existsSync(standaloneDir)) {
  process.exit(0);
}

const staticSource = path.join(root, '.next', 'static');
const staticTarget = path.join(standaloneDir, '.next', 'static');
const publicSource = path.join(root, 'public');
const publicTarget = path.join(standaloneDir, 'public');

async function copyFresh(source, target) {
  if (!existsSync(source)) return;
  await rm(target, { recursive: true, force: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
}

await copyFresh(staticSource, staticTarget);
await copyFresh(publicSource, publicTarget);
