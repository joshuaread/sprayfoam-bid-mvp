import { computeEstimate } from './calc';
import type { PriceBook, ProductKind } from './types';

export type FoamPref = 'oc' | 'cc' | 'unsure';

export interface QuoteRequest {
  sqft: number;
  foamPref: FoamPref;
  /** thickness used for open cell on this project type */
  ocInches: number;
  /** thickness used for closed cell on this project type */
  ccInches: number;
  /** +/- band percent, e.g. 15 */
  bandPct: number;
}

export interface QuoteRange {
  low: number;
  high: number;
  basis: { kind: 'open_cell' | 'closed_cell'; inches: number; price: number }[];
  minJobApplied: boolean;
  note: string;
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

function priceFor(pb: PriceBook, kind: ProductKind, inches: number, sqft: number) {
  const product = pb.products.find((p) => p.kind === kind && p.active);
  if (!product) return null;
  // The range is the foam job only, before min job; trip charge is already included in the calculated price and min job is applied below.
  const t = computeEstimate({
    priceBook: { ...pb, charges: { ...pb.charges, minJob: 0 } },
    areas: [
      {
        id: 'q',
        label: 'Quote',
        dims: { shape: 'freeform', sqft },
        layers: [{ id: 'l', productId: product.id, inches }],
      },
    ],
  });
  return t.calculatedPrice;
}

/** Homeowner range: price book price for the job, +/- band, min job applied, rounded to $50. */
export function quoteRange(pb: PriceBook, req: QuoteRequest): QuoteRange {
  const sqft = Math.max(0, Number(req.sqft) || 0);
  const band = Math.min(Math.max(Number(req.bandPct) || 0, 0), 90) / 100;
  const kinds: ('open_cell' | 'closed_cell')[] =
    req.foamPref === 'oc' ? ['open_cell'] : req.foamPref === 'cc' ? ['closed_cell'] : ['open_cell', 'closed_cell'];
  const basis: QuoteRange['basis'] = [];
  for (const k of kinds) {
    const inches = k === 'open_cell' ? req.ocInches : req.ccInches;
    const price = priceFor(pb, k, inches, sqft);
    if (price != null) basis.push({ kind: k, inches, price });
  }
  if (basis.length === 0) return { low: 0, high: 0, basis, minJobApplied: false, note: 'No active products for this foam type.' };
  const lo = Math.min(...basis.map((b) => b.price));
  const hi = Math.max(...basis.map((b) => b.price));
  let low = lo * (1 - band);
  let high = hi * (1 + band);
  const minJob = Math.max(0, Number(pb.charges.minJob) || 0);
  let minJobApplied = false;
  if (low < minJob) {
    low = minJob;
    minJobApplied = true;
  }
  if (high < minJob) high = minJob;
  low = Math.max(minJob, roundTo(low, 50));
  high = Math.max(low, roundTo(high, 50));
  return {
    low,
    high,
    basis,
    minJobApplied,
    note: minJobApplied ? `Includes the $${minJob.toLocaleString('en-US')} minimum job.` : '',
  };
}
