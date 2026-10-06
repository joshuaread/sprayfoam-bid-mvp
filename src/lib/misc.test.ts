import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from './testkit';

describe('engine purity', () => {
  it('src/lib/engine has no React or browser-only imports', () => {
    const dir = join(process.cwd(), 'src', 'lib', 'engine');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src, f).not.toMatch(/from ['"]react/);
      expect(src, f).not.toMatch(/from ['"]next/);
      expect(src, f).not.toMatch(/\b(window|localStorage|document)\./);
    }
  });
});

describe('naming rule', () => {
  it('never uses the competitor name in source, public files, or docs', () => {
    const root = process.cwd();
    const bad = new RegExp(['foam', 'bid'].join(''), 'i');
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) => {
        if (['node_modules', '.next', 'out', '.git', '.test-build'].includes(e.name)) return [];
        const p = join(d, e.name);
        return e.isDirectory() ? walk(p) : [p];
      });
    const files = walk(root).filter((f) => /\.(tsx?|mjs|js|md|json|html|webmanifest|yml)$/.test(f) && !f.endsWith('package-lock.json'));
    for (const f of files) {
      const hits = readFileSync(f, 'utf8').split('\n').filter((l) => bad.test(l));
      expect(hits, f).toEqual([]);
    }
  });
});
