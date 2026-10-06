// Post-build checks for the static export (GitHub Pages).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'out');
if (!existsSync(out)) {
  console.error('postbuild: out/ missing');
  process.exit(1);
}
writeFileSync(join(out, '.nojekyll'), '');
const required = ['index.html', 'widget.js', 'sw.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'demo-site/index.html', 'embed/index.html', 'estimate/index.html'];
const missing = required.filter((f) => !existsSync(join(out, f)));
if (missing.length) {
  console.error('postbuild: missing files in out/:', missing.join(', '));
  process.exit(1);
}
console.log('postbuild: out/ ready (.nojekyll written, required files present)');
