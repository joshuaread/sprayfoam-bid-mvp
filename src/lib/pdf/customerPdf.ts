import { jsPDF } from 'jspdf';
import { SHAPE_LABELS } from '../engine';
import { money, num } from '../format';
import { DISCLAIMER, type Branding, type Estimate } from '../models';
import { Cursor, ascii, hexToRgb, imageFormat } from './pdfHelpers';

export function buildCustomerPdf(e: Estimate, b: Branding): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const brand = hexToRgb(b.brandColor);
  const W = doc.internal.pageSize.getWidth();
  const t = e.totals;

  // Header band
  doc.setFillColor(...brand);
  doc.rect(0, 0, W, 96, 'F');
  let textX = 40;
  const fmt = b.logoDataUrl ? imageFormat(b.logoDataUrl) : null;
  if (b.logoDataUrl && fmt) {
    try {
      const props = doc.getImageProperties(b.logoDataUrl);
      const h = 60;
      const w = Math.min(140, (props.width / props.height) * h);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(36, 16, w + 8, h + 8, 4, 4, 'F');
      doc.addImage(b.logoDataUrl, fmt, 40, 20, w, h);
      textX = 40 + w + 20;
    } catch {
      /* ignore bad logo */
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(ascii(b.companyName || 'Your Company'), textX, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contact = [b.phone, b.email, b.website].filter(Boolean).join('  |  ');
  doc.text(ascii(contact), textX, 56);
  doc.text(ascii([b.address, b.licenseNo ? `License # ${b.licenseNo}` : ''].filter(Boolean).join('  |  ')), textX, 70);

  const c = new Cursor(doc, 40, 112);
  c.text(`Spray Foam Insulation Proposal #${e.number}${e.version > 1 ? ` (v${e.version})` : ''}`, { size: 16, bold: true, color: brand });
  c.text(`Date: ${new Date(e.updatedAt).toLocaleDateString('en-US')}    Valid until: ${e.validUntil ? new Date(e.validUntil + 'T12:00:00').toLocaleDateString('en-US') : '-'}`, { size: 9, color: [71, 85, 105] });
  c.space(4);
  c.text('Prepared for', { size: 9, bold: true, color: [100, 116, 139], gap: 0 });
  c.text(e.customerName || 'Customer', { size: 11, bold: true, gap: 0 });
  c.text([e.customerPhone, e.customerEmail].filter(Boolean).join('  |  ') || ' ', { size: 9, gap: 0 });
  c.text(`Job address: ${e.jobAddress || '-'}`, { size: 9 });
  c.space(6);

  c.text('Scope of work', { size: 12, bold: true, color: brand });
  const cols = [180, 140, 70, 70, 72];
  doc.setFillColor(241, 245, 249);
  doc.rect(c.margin, c.y, c.width, 16, 'F');
  c.row(
    [
      { text: 'Area', w: cols[0], bold: true },
      { text: 'Foam / product', w: cols[1], bold: true },
      { text: 'Thickness', w: cols[2], bold: true, align: 'right' },
      { text: 'Sq ft', w: cols[3], bold: true, align: 'right' },
      { text: 'R-value', w: cols[4], bold: true, align: 'right' },
    ],
    9,
  );
  for (const a of t?.areas ?? []) {
    const area = e.areas.find((x) => x.id === a.areaId);
    a.layers.forEach((l, i) => {
      const isCoat = l.kind === 'coating' || l.kind === 'primer';
      c.row([
        { text: i === 0 ? `${a.label}` : '', w: cols[0] },
        { text: l.productName.replace(/\s*\(sample\)/i, ''), w: cols[1] },
        { text: isCoat ? `${l.coats} coat(s)` : `${num(l.inches, 2)}"`, w: cols[2], align: 'right' },
        { text: i === 0 ? num(a.sqft, 0) : '', w: cols[3], align: 'right' },
        { text: i === 0 ? area?.rValueText || '' : '', w: cols[4], align: 'right' },
      ]);
    });
    if (a.layers.length === 0) c.row([{ text: a.label, w: cols[0] }, { text: SHAPE_LABELS[a.shape], w: cols[1] }, { text: '', w: cols[2] }, { text: num(a.sqft, 0), w: cols[3], align: 'right' }, { text: '', w: cols[4] }]);
  }
  c.rule();
  c.row([
    { text: 'Total area', w: cols[0] + cols[1] + cols[2], bold: true },
    { text: num(t?.sqft ?? 0, 0), w: cols[3], align: 'right', bold: true },
    { text: '', w: cols[4] },
  ]);
  c.space(10);

  // Price box
  c.ensure(60);
  doc.setFillColor(...brand);
  doc.roundedRect(c.margin, c.y, c.width, 48, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total price', c.margin + 14, c.y + 29);
  doc.setFontSize(22);
  doc.text(money(t?.price ?? 0, 2), c.margin + c.width - 14, c.y + 32, { align: 'right' });
  c.y += 58;
  if (t?.minJobApplied) c.text('Includes our minimum job charge.', { size: 8, color: [100, 116, 139] });
  c.space(6);

  if (e.notes) {
    c.text('Notes', { size: 11, bold: true, color: brand });
    c.text(e.notes, { size: 9 });
  }
  c.text('Terms', { size: 11, bold: true, color: brand });
  c.text(b.terms || '-', { size: 9 });
  c.text(`This proposal is valid until ${e.validUntil || '-'}.`, { size: 9 });
  c.space(14);

  c.ensure(70);
  c.text('Acceptance', { size: 11, bold: true, color: brand });
  c.text('By signing below, the customer accepts this proposal, its price, and its terms.', { size: 9 });
  c.space(22);
  doc.setDrawColor(100, 116, 139);
  doc.line(c.margin, c.y, c.margin + 280, c.y);
  doc.line(c.margin + 320, c.y, c.margin + c.width, c.y);
  c.space(4);
  c.row([
    { text: 'Customer signature', w: 320 },
    { text: 'Date', w: 200 },
  ], 8);
  c.space(14);
  doc.line(c.margin, c.y, c.margin + 280, c.y);
  c.space(4);
  c.row([{ text: 'Printed name', w: 320 }], 8);

  // Disclaimer footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const H = doc.internal.pageSize.getHeight();
    doc.text(DISCLAIMER, 40, H - 28);
    doc.text(`Page ${i} of ${pages}`, W - 40, H - 28, { align: 'right' });
  }
  return doc;
}

export function customerPdfFilename(e: Estimate) {
  const who = (e.customerName || 'customer').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `proposal-${e.number}-v${e.version}-${who}.pdf`;
}
