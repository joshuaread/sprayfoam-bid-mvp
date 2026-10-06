import type { jsPDF } from 'jspdf';

export function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || '#0f766e').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return [15, 118, 110];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** jsPDF core fonts are WinAnsi; strip characters that would render as garbage. */
export function ascii(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00B7/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, '');
}

export class Cursor {
  y: number;
  constructor(
    public doc: jsPDF,
    public margin = 40,
    startY = 40,
  ) {
    this.y = startY;
  }
  get width() {
    return this.doc.internal.pageSize.getWidth() - this.margin * 2;
  }
  get pageH() {
    return this.doc.internal.pageSize.getHeight();
  }
  ensure(h: number) {
    if (this.y + h > this.pageH - 50) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }
  text(s: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number; mono?: boolean } = {}) {
    const { size = 10, bold = false, color = [30, 41, 59], indent = 0, gap = 2, mono = false } = opts;
    this.doc.setFont(mono ? 'courier' : 'helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(ascii(s), this.width - indent) as string[];
    const lh = size * 1.25;
    for (const line of lines) {
      this.ensure(lh);
      this.doc.text(line, this.margin + indent, this.y + size);
      this.y += lh;
    }
    this.y += gap;
  }
  row(cols: { text: string; w: number; align?: 'left' | 'right'; bold?: boolean }[], size = 9) {
    const lh = size * 1.35;
    this.ensure(lh);
    let x = this.margin;
    this.doc.setFontSize(size);
    this.doc.setTextColor(30, 41, 59);
    for (const c of cols) {
      this.doc.setFont('helvetica', c.bold ? 'bold' : 'normal');
      const t = ascii(c.text);
      const clipped = (this.doc.splitTextToSize(t, c.w - 4) as string[])[0] ?? '';
      if (c.align === 'right') this.doc.text(clipped, x + c.w - 2, this.y + size, { align: 'right' });
      else this.doc.text(clipped, x + 2, this.y + size);
      x += c.w;
    }
    this.y += lh;
  }
  rule(color: [number, number, number] = [203, 213, 225]) {
    this.ensure(6);
    this.doc.setDrawColor(...color);
    this.doc.line(this.margin, this.y + 2, this.margin + this.width, this.y + 2);
    this.y += 8;
  }
  space(h: number) {
    this.y += h;
  }
}

export function imageFormat(dataUrl: string): 'PNG' | 'JPEG' | null {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  return null;
}
