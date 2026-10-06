import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_WIDGET } from './models';
import { decodeCfg, encodeCfg } from './widgetCfg';

describe('engine purity', () => {
  it('src/lib/engine has no React or browser-only imports', () => {
    const dir = join(__dirname, 'engine');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src, f).not.toMatch(/from ['"]react/);
      expect(src, f).not.toMatch(/from ['"]next/);
      expect(src, f).not.toMatch(/\b(window|localStorage|document)\./);
    }
  });
});

describe('widget config encoding', () => {
  it('round-trips through the preview URL param', () => {
    const cfg = { ...DEFAULT_WIDGET, headline: 'Instant price — try it', bandPct: 20, gated: true };
    expect(decodeCfg(encodeCfg(cfg))).toEqual(cfg);
    expect(decodeCfg('not-valid')).toBeNull();
    expect(decodeCfg(null)).toBeNull();
  });
});

describe('naming rule', () => {
  it('never uses the competitor name in source, public files, or docs', () => {
    const root = join(__dirname, '..', '..');
    const bad = new RegExp(['foam', 'bid'].join(''), 'i');
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) => {
        if (['node_modules', '.next', 'out', '.git'].includes(e.name)) return [];
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
