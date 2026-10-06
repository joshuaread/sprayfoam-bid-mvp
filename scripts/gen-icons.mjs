// Generates PNG app icons (192, 512) with zero dependencies (node:zlib).
// Runs before `next build` so binary files never need to be committed.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const TEAL = [15, 118, 110];
const WHITE = [255, 255, 255];
const FOAM = [253, 230, 138];

function pixel(x, y) {
  // normalized coords 0..1
  // house: roof triangle apex (0.5,0.2), base y=0.48 from x 0.18..0.82 ; walls 0.26..0.74, y 0.48..0.8
  const inRoof = y >= 0.2 && y <= 0.48 && Math.abs(x - 0.5) <= ((y - 0.2) / 0.28) * 0.32;
  const inWall = x >= 0.26 && x <= 0.74 && y >= 0.47 && y <= 0.8;
  if (inRoof || inWall) {
    // foam band inside the house: wavy top edge
    const wave = 0.6 + 0.025 * Math.sin(x * Math.PI * 10);
    if (inWall && x >= 0.31 && x <= 0.69 && y >= wave && y <= 0.75) return FOAM;
    return WHITE;
  }
  return TEAL;
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const ss = 3; // supersampling for smooth edges
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const c = pixel((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size);
          r += c[0]; g += c[1]; b += c[2];
        }
      const n = ss * ss;
      const o = row + 1 + x * 4;
      raw[o] = Math.round(r / n);
      raw[o + 1] = Math.round(g / n);
      raw[o + 2] = Math.round(b / n);
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), png(size));
}
writeFileSync(join(outDir, 'apple-touch-icon.png'), png(180));
console.log('icons: wrote public/icons/icon-192.png, icon-512.png, apple-touch-icon.png');
