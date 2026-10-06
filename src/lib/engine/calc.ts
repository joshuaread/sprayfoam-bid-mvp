import { computeAreaSqft, fmt } from './geometry';
import type {
  AreaResult,
  EstimateInput,
  EstimateTotals,
  LadderKind,
  LadderRow,
  LayerResult,
  PriceBook,
  Product,
  ProductSets,
} from './types';

export const ENGINE_VERSION = '0.2.0';

const r2 = (n: number) => Math.round(n * 100) / 100;
const pos = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function isFoam(p: Pick<Product, 'kind'> | undefined): boolean {
  return !!p && (p.kind === 'open_cell' || p.kind === 'closed_cell' || p.kind === 'other');
}

/**
 * Sets = board feet / (rated yield x field-yield factor) x (1 + waste%)
 */
export function setsFor(boardFeet: number, p: Pick<Product, 'ratedYieldBfPerSet' | 'fieldYieldFactor' | 'wastePct'>): number {
  const effYield = pos(p.ratedYieldBfPerSet) * pos(p.fieldYieldFactor);
  if (effYield <= 0) return 0;
  return (pos(boardFeet) / effYield) * (1 + pos(p.wastePct) / 100);
}

/** Margin mode: price = cost / (1 - margin) */
export function priceFromMargin(cost: number, marginPct: number): number {
  const m = Math.min(Math.max(Number(marginPct) || 0, 0), 95) / 100;
  return cost / (1 - m);
}

/**
 * Ladder lookup: $/sq ft for a foam kind at a thickness.
 * Exact match wins; between two rows interpolate linearly; outside the
 * range scale per inch from the nearest row. Returns null if no rows for that kind.
 */
export function ladderPricePerSqft(
  ladder: LadderRow[],
  kind: LadderKind,
  inches: number,
): { pricePerSqft: number; note: string } | null {
  const rows = ladder
    .filter((r) => r.kind === kind && pos(r.thicknessIn) > 0)
    .sort((a, b) => a.thicknessIn - b.thicknessIn);
  if (rows.length === 0) return null;
  const t = pos(inches);
  const exact = rows.find((r) => Math.abs(r.thicknessIn - t) < 1e-9);
  if (exact) return { pricePerSqft: exact.pricePerSqft, note: `ladder ${fmt(t)}" = $${fmt(exact.pricePerSqft)}/sq ft` };
  const lo = [...rows].reverse().find((r) => r.thicknessIn < t);
  const hi = rows.find((r) => r.thicknessIn > t);
  if (lo && hi) {
    const frac = (t - lo.thicknessIn) / (hi.thicknessIn - lo.thicknessIn);
    const p = lo.pricePerSqft + frac * (hi.pricePerSqft - lo.pricePerSqft);
    return { pricePerSqft: p, note: `interpolated ${fmt(lo.thicknessIn)}"-${fmt(hi.thicknessIn)}" = $${fmt(p, 3)}/sq ft` };
  }
  const nearest = lo ?? hi!;
  const p = (nearest.pricePerSqft / nearest.thicknessIn) * t;
  return { pricePerSqft: p, note: `scaled per inch from ${fmt(nearest.thicknessIn)}" = $${fmt(p, 3)}/sq ft` };
}

export function computeEstimate(input: EstimateInput): EstimateTotals {
  const pb: PriceBook = input.priceBook;
  const mode = input.pricingMode ?? pb.pricingMode;
  const marginPct = input.marginPct ?? pb.targetMarginPct;
  const productsById = new Map(pb.products.map((p) => [p.id, p]));
  const warnings: string[] = [];

  const areas: AreaResult[] = [];
  const bySet = new Map<string, ProductSets>();
  let sqft = 0;
  let boardFeet = 0;
  let laborHours = 0;
  let laborCost = 0;
  let coatingCost = 0;
  let ladderSubtotal = 0;

  for (const area of input.areas) {
    const geo = computeAreaSqft(area.dims);
    sqft += geo.sqft;
    let areaBf = 0;
    const layers: LayerResult[] = [];
    for (const layer of area.layers) {
      const p = productsById.get(layer.productId);
      const base: LayerResult = {
        layerId: layer.id,
        productId: layer.productId,
        productName: p?.name ?? 'Missing product',
        kind: p?.kind ?? 'missing',
        inches: pos(layer.inches),
        coats: pos(layer.coats ?? 1) || 1,
        sqft: geo.sqft,
        boardFeet: 0,
        sets: 0,
        materialCost: 0,
        coatingCost: 0,
        laborHours: 0,
        laborCost: 0,
        setsFormula: '',
      };
      if (!p) {
        warnings.push(`${area.label}: a layer references a product that is not in this price book.`);
        layers.push(base);
        continue;
      }
      if (isFoam(p)) {
        const bf = geo.sqft * base.inches;
        const sets = setsFor(bf, p);
        base.boardFeet = bf;
        base.sets = sets;
        base.materialCost = sets * pos(p.setPrice);
        base.setsFormula = `${fmt(bf)} bf / (${fmt(p.ratedYieldBfPerSet)} x ${fmt(p.fieldYieldFactor)}) x (1 + ${fmt(p.wastePct)}%) = ${fmt(sets, 3)} sets`;
        if (pb.labor.mode === 'flat') {
          base.laborCost = bf * pos(pb.labor.laborPerBf);
          base.laborHours = 0;
        } else {
          const rate = pos(pb.labor.prodRateBfPerHr);
          base.laborHours = rate > 0 ? bf / rate : 0;
          base.laborCost = base.laborHours * pos(pb.labor.crewSize) * pos(pb.labor.hourlyRate);
        }
        if (mode === 'ladder') {
          const k: LadderKind = p.kind === 'closed_cell' ? 'closed_cell' : p.kind === 'other' ? 'other' : 'open_cell';
          const lp = ladderPricePerSqft(pb.ladder, k, base.inches);
          if (lp) {
            base.ladderPrice = lp.pricePerSqft * geo.sqft;
            base.ladderNote = lp.note;
          } else {
            base.ladderPrice = priceFromMargin(base.materialCost + base.laborCost, marginPct);
            base.ladderNote = `no ladder rows for ${k}; priced at ${fmt(marginPct)}% margin`;
            warnings.push(`${area.label}: no ladder rows for ${k}; that layer is priced at target margin.`);
          }
          ladderSubtotal += base.ladderPrice;
        }
        areaBf += bf;
        const agg = bySet.get(p.id) ?? { productId: p.id, productName: p.name, boardFeet: 0, sets: 0, setsRounded: 0, materialCost: 0 };
        agg.boardFeet += bf;
        agg.sets += sets;
        bySet.set(p.id, agg);
      } else {
        // coating / primer
        const coats = base.coats;
        let c = 0;
        if (p.coatingPricing === 'per_gal') {
          const cov = pos(p.coverageSqftPerGal);
          const gal = cov > 0 ? (geo.sqft * coats) / cov : 0;
          c = gal * pos(p.pricePerGal) * (1 + pos(p.wastePct) / 100);
          base.setsFormula = `${fmt(geo.sqft)} sq ft x ${coats} coat(s) / ${fmt(cov)} sq ft/gal = ${fmt(gal)} gal x $${fmt(pos(p.pricePerGal))} x (1 + ${fmt(p.wastePct)}%)`;
        } else {
          c = geo.sqft * coats * pos(p.pricePerSqft) * (1 + pos(p.wastePct) / 100);
          base.setsFormula = `${fmt(geo.sqft)} sq ft x ${coats} coat(s) x $${fmt(pos(p.pricePerSqft))}/sq ft x (1 + ${fmt(p.wastePct)}%)`;
        }
        base.coatingCost = c;
        coatingCost += c;
      }
      laborHours += base.laborHours;
      laborCost += base.laborCost;
      layers.push(base);
    }
    boardFeet += areaBf;
    areas.push({
      areaId: area.id,
      label: area.label,
      shape: area.dims.shape,
      sqft: geo.sqft,
      formula: geo.formula,
      parts: geo.parts,
      boardFeet: areaBf,
      layers,
    });
  }

  let materialCost = 0;
  const setsByProduct: ProductSets[] = [];
  for (const agg of bySet.values()) {
    const p = productsById.get(agg.productId)!;
    agg.setsRounded = Math.ceil(agg.sets - 1e-9);
    agg.materialCost = agg.sets * pos(p.setPrice);
    materialCost += agg.materialCost;
    setsByProduct.push(agg);
  }
  const sets = setsByProduct.reduce((s, p) => s + p.sets, 0);
  const setsRounded = setsByProduct.reduce((s, p) => s + p.setsRounded, 0);
  const tripCost = pos(pb.charges.tripCharge) + pos(pb.charges.mileageRate) * pos(input.miles);

  const jobCost = materialCost + laborCost + coatingCost;
  const totalCost = jobCost + tripCost;
  // Trip charge and mileage pass through at cost in both modes; they are never marked up.
  let calculatedPrice: number;
  if (mode === 'ladder') {
    calculatedPrice = ladderSubtotal + priceFromMargin(coatingCost, marginPct) + tripCost;
  } else {
    calculatedPrice = priceFromMargin(jobCost, marginPct) + tripCost;
  }
  const minJob = pos(pb.charges.minJob);
  const minJobApplied = calculatedPrice < minJob;
  const price = minJobApplied ? minJob : calculatedPrice;
  const marginAmt = price - totalCost;
  // Margin % is on the marked-up part of the price; trip/mileage pass through at cost and are excluded.
  const priceExPassThrough = price - tripCost;
  const marginPctActual = priceExPassThrough > 0 ? (marginAmt / priceExPassThrough) * 100 : 0;

  return {
    engine_version: ENGINE_VERSION,
    pricingMode: mode,
    marginPctTarget: marginPct,
    sqft: r2(sqft),
    boardFeet: r2(boardFeet),
    sets: Math.round(sets * 1000) / 1000,
    setsRounded,
    setsByProduct: setsByProduct.map((s) => ({ ...s, boardFeet: r2(s.boardFeet), sets: Math.round(s.sets * 1000) / 1000, materialCost: r2(s.materialCost) })),
    materialCost: r2(materialCost),
    laborHours: Math.round(laborHours * 100) / 100,
    laborCost: r2(laborCost),
    tripCost: r2(tripCost),
    coatingCost: r2(coatingCost),
    totalCost: r2(totalCost),
    calculatedPrice: r2(calculatedPrice),
    price: r2(price),
    minJob,
    minJobApplied,
    minJobNote: minJobApplied
      ? `Minimum job of $${fmt(minJob)} applied (calculated price was $${fmt(calculatedPrice)}).`
      : undefined,
    marginAmt: r2(marginAmt),
    marginPct: Math.round(marginPctActual * 10) / 10,
    pricePerSqft: sqft > 0 ? Math.round((price / sqft) * 100) / 100 : 0,
    areas,
    warnings,
  };
}
