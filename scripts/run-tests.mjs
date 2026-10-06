// Compile the unit tests with tsc, then run them with Node's built-in test runner.
import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const outDir = '.test-build';
rmSync(outDir, { recursive: true, force: true });

const tsc = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.test.json'], { stdio: 'inherit' });
if (tsc.status !== 0) process.exit(tsc.status ?? 1);

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const files = walk(outDir).filter((f) => f.endsWith('.test.js'));
if (files.length === 0) {
  console.error('No compiled test files found');
  process.exit(1);
}
const run = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(run.status ?? 1);
