import { jsPDF } from 'jspdf';
import { SHAPE_LABELS } from '../engine';
import { money, num } from '../format';
import type { Branding, Estimate } from '../models';
import { Cursor } from './pdfHelpers';

const LADDER_LABELS = { open_cell: 'OC', closed_cell: 'CC', other: 'Other' } as const;

export function buildCostSheetPdf(e: Estimate, b: Branding): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const t = e.totals;
  const pb = e.priceBookSnapshot;
  const c = new Cursor(doc, 36, 36);
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INTERNAL COST SHEET - DO NOT SEND TO CUSTOMER', 36, 16);

  c.text(`${b.companyName} - Estimate #${e.number} v${e.version}`, { size: 14, bold: true });
  c.text(
    `Customer: ${e.customerName || '-'} | Job: ${e.jobAddress || '-'} | Status: ${e.status} | Engine v${t?.engine_version ?? '-'} | Price book snapshot: ${new Date(e.snapshotAt).toLocaleString('en-US')}`,
    { size: 8, color: [71, 85, 105] },
  );
  c.text(`Pricing mode: ${e.pricingMode === 'ladder' ? 'Per-inch price ladder' : 'Cost-plus margin'} | Target margin: ${num(e.marginPct, 1)}% | Miles: ${num(e.miles, 0)}`, { size: 9 });
  c.rule();

  c.text('Price book inputs (snapshot)', { size: 11, bold: true });
  for (const p of pb.products) {
    if (p.kind === 'coating' || p.kind === 'primer') {
      c.text(
        `${p.name} [${p.kind}${p.active ? '' : ', inactive'}]: ${p.coatingPricing === 'per_gal' ? `$${num(p.pricePerGal ?? 0, 2)}/gal, coverage ${num(p.coverageSqftPerGal ?? 0)} sq ft/gal` : `$${num(p.pricePerSqft ?? 0, 3)}/sq ft`}, waste ${num(p.wastePct, 1)}%`,
        { size: 8, indent: 8, gap: 0 },
      );
    } else {
      c.text(
        `${p.name} [${p.kind}${p.active ? '' : ', inactive'}]: set $${num(p.setPrice, 2)}, set size ${num(p.setSizeGal)} gal, rated yield ${num(p.ratedYieldBfPerSet)} bf/set, field-yield factor ${p.fieldYieldFactor}, waste ${num(p.wastePct, 1)}%`,
        { size: 8, indent: 8, gap: 0 },
      );
    }
  }
  const L = pb.labor;
  c.text(
    `Labor: ${L.mode === 'flat' ? `flat $${num(L.laborPerBf, 3)}/bf` : `crew ${L.crewSize} x $${num(L.hourlyRate, 2)}/hr, production ${num(L.prodRateBfPerHr)} bf/hr`}`,
    { size: 8, indent: 8, gap: 0 },
  );
  c.text(`Charges: trip $${num(pb.charges.tripCharge, 2)}, mileage $${num(pb.charges.mileageRate, 2)}/mi, minimum job $${num(pb.charges.minJob, 2)}; trip and mileage pass through at cost (no markup)`, {
    size: 8,
    indent: 8,
    gap: 0,
  });
  if (e.pricingMode === 'ladder') {
    c.text(`Ladder: ${pb.ladder.map((r) => `${LADDER_LABELS[r.kind]} ${r.thicknessIn}" $${r.pricePerSqft}/sf`).join(', ')}`, { size: 8, indent: 8 });
  }
  c.rule();

  c.text('Areas', { size: 11, bold: true });
  for (const a of t?.areas ?? []) {
    c.ensure(50);
    c.text(`${a.label} (${SHAPE_LABELS[a.shape]}): ${num(a.sqft, 2)} sq ft, ${num(a.boardFeet, 1)} bf`, { size: 9.5, bold: true, gap: 0 });
    c.text(a.formula, { size: 7.5, mono: true, indent: 8, gap: 0 });
    for (const p of a.parts) c.text(`- ${p}`, { size: 7.5, mono: true, indent: 16, gap: 0 });
    for (const l of a.layers) {
      const isCoat = l.kind === 'coating' || l.kind === 'primer';
      c.text(
        isCoat
          ? `Layer: ${l.productName}, ${l.coats} coat(s): coating $${num(l.coatingCost, 2)}`
          : `Layer: ${l.productName} @ ${l.inches}": ${num(l.boardFeet, 1)} bf, ${num(l.sets, 3)} sets, material $${num(l.materialCost, 2)}, labor ${num(l.laborHours, 2)} hr / $${num(l.laborCost, 2)}${l.ladderPrice != null ? `, ladder price $${num(l.ladderPrice, 2)}` : ''}`,
        { size: 8, indent: 8, gap: 0 },
      );
      c.text(l.setsFormula + (l.ladderNote ? ` | ${l.ladderNote}` : ''), { size: 7, mono: true, indent: 16, gap: 0 });
    }
    c.space(4);
  }
  c.rule();

  c.text('Sets by product', { size: 11, bold: true });
  for (const s of t?.setsByProduct ?? []) {
    c.text(`${s.productName}: ${num(s.boardFeet, 1)} bf -> ${num(s.sets, 3)} sets (order ${s.setsRounded}), material $${num(s.materialCost, 2)}`, { size: 8.5, indent: 8, gap: 0 });
  }
  c.rule();

  c.text('Totals', { size: 11, bold: true });
  const lines: [string, string][] = [
    ['Total sq ft', num(t?.sqft ?? 0, 2)],
    ['Total board feet', num(t?.boardFeet ?? 0, 1)],
    ['Sets (decimal / rounded up)', `${num(t?.sets ?? 0, 3)} / ${t?.setsRounded ?? 0}`],
    ['Material cost', money(t?.materialCost ?? 0, 2)],
    ['Labor', `${money(t?.laborCost ?? 0, 2)} (${num(t?.laborHours ?? 0, 2)} hr)`],
    ['Trip + mileage (pass-through at cost, no markup)', money(t?.tripCost ?? 0, 2)],
    ['Coatings', money(t?.coatingCost ?? 0, 2)],
    ['Total cost', money(t?.totalCost ?? 0, 2)],
    [e.pricingMode === 'ladder' ? 'Calculated price (ladder + coatings at margin + trip at cost)' : `Calculated price = (cost excl. trip) / (1 - ${num(e.marginPct, 1)}%) + trip at cost`, money(t?.calculatedPrice ?? 0, 2)],
    ['Minimum job', `${money(t?.minJob ?? 0, 2)}${t?.minJobApplied ? ' (APPLIED)' : ''}`],
    ['Price', money(t?.price ?? 0, 2)],
    ['Gross margin (% excludes trip/mileage pass-through)', `${money(t?.marginAmt ?? 0, 2)} (${num(t?.marginPct ?? 0, 1)}%)`],
    ['Price per sq ft', money(t?.pricePerSqft ?? 0, 2)],
  ];
  for (const [k, v] of lines) c.row([{ text: k, w: 330 }, { text: v, w: 200, align: 'right', bold: k === 'Price' }], 9);
  if (t?.minJobNote) c.text(t.minJobNote, { size: 8, color: [180, 83, 9] });
  for (const w of t?.warnings ?? []) c.text(`Warning: ${w}`, { size: 8, color: [185, 28, 28] });
  return doc;
}

export function costSheetFilename(e: Estimate) {
  return `cost-sheet-${e.number}-v${e.version}.pdf`;
}
