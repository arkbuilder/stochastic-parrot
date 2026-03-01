import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function safe(cmd, fallback = 'unknown') {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return fallback;
  }
}

const commit = safe('git rev-parse HEAD');
const shortCommit = safe('git rev-parse --short HEAD');
const branch = safe('git rev-parse --abbrev-ref HEAD');
const status = safe('git status --porcelain');
const isDirty = status.length > 0;
const builtAt = new Date().toISOString();

const payload = {
  app: 'stochastic-parrot',
  commit,
  shortCommit,
  branch,
  builtAt,
  dirty: isDirty,
};

const outDir = join(process.cwd(), 'assets');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'checkversion.json'), JSON.stringify(payload, null, 2) + '\n');

const aboutDir = join(process.cwd(), 'aboutthegame');
mkdirSync(aboutDir, { recursive: true });
writeFileSync(join(aboutDir, 'checkversion.json'), JSON.stringify(payload, null, 2) + '\n');

// root /version route (extensionless), served by static host before SPA fallback
writeFileSync(join(process.cwd(), 'version'), JSON.stringify(payload, null, 2) + '\n');

console.log('Wrote assets/checkversion.json, aboutthegame/checkversion.json, and /version', payload);
