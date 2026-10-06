import type { LadderRow, PriceBook } from './types';

export const PRICE_BOOK_SCHEMA_VERSION = 2;

export const SAMPLE_OTHER_LADDER: LadderRow[] = [
  { kind: 'other', thicknessIn: 2, pricePerSqft: 1.8, label: 'Sample data - replace with your own' },
];

/**
 * SAMPLE NUMBERS ONLY. These are placeholder values so the demo works out of the box.
 * Every contractor must replace them with their own supplier pricing and yields.
 */
export const SAMPLE_PRICE_BOOK: PriceBook = {
  label: 'Sample numbers - replace with your own',
  products: [
    {
      id: 'oc-sample',
      name: 'Open cell 0.5 lb (sample)',
      kind: 'open_cell',
      setPrice: 1800,
      setSizeGal: 110,
      ratedYieldBfPerSet: 17000,
      fieldYieldFactor: 0.85,
      wastePct: 10,
      rValuePerInch: 3.7,
      active: true,
    },
    {
      id: 'cc-sample',
      name: 'Closed cell 2 lb (sample)',
      kind: 'closed_cell',
      setPrice: 2400,
      setSizeGal: 110,
      ratedYieldBfPerSet: 4500,
      fieldYieldFactor: 0.9,
      wastePct: 10,
      rValuePerInch: 6.9,
      active: true,
    },
    {
      id: 'coat-sample',
      name: 'Ignition barrier coating (sample)',
      kind: 'coating',
      setPrice: 0,
      setSizeGal: 5,
      ratedYieldBfPerSet: 0,
      fieldYieldFactor: 1,
      wastePct: 10,
      coatingPricing: 'per_gal',
      pricePerGal: 45,
      coverageSqftPerGal: 160,
      pricePerSqft: 0.3,
      active: true,
    },
  ],
  labor: { crewSize: 2, hourlyRate: 30, mode: 'production', prodRateBfPerHr: 800, laborPerBf: 0.12 },
  charges: { tripCharge: 150, mileageRate: 1.5, minJob: 1500 },
  pricingMode: 'margin',
  targetMarginPct: 40,
  schemaVersion: PRICE_BOOK_SCHEMA_VERSION,
  ladder: [
    { kind: 'open_cell', thicknessIn: 3.5, pricePerSqft: 1.1 },
    { kind: 'open_cell', thicknessIn: 5.5, pricePerSqft: 1.55 },
    { kind: 'open_cell', thicknessIn: 7.5, pricePerSqft: 2.0 },
    { kind: 'open_cell', thicknessIn: 10, pricePerSqft: 2.6 },
    { kind: 'closed_cell', thicknessIn: 1, pricePerSqft: 1.15 },
    { kind: 'closed_cell', thicknessIn: 2, pricePerSqft: 2.1 },
    { kind: 'closed_cell', thicknessIn: 3, pricePerSqft: 3.0 },
    ...SAMPLE_OTHER_LADDER,
  ],
};

/**
 * Brings a price book saved by an older version up to date. Books saved before
 * schema 2 get the sample 'other' ladder rows merged in once; after that the
 * contractor owns those rows (deleting them is respected). Pure; returns a new object.
 */
export function normalizePriceBook(raw: PriceBook): PriceBook {
  const { materialCostBasis: _removed, ...pb } = raw as PriceBook & { materialCostBasis?: unknown };
  const ladder = Array.isArray(pb.ladder) ? pb.ladder : [];
  if ((pb.schemaVersion ?? 1) >= PRICE_BOOK_SCHEMA_VERSION) return { ...pb, ladder };
  const hasOther = ladder.some((r) => r.kind === 'other');
  return {
    ...pb,
    ladder: hasOther ? ladder : [...ladder, ...SAMPLE_OTHER_LADDER.map((r) => ({ ...r }))],
    schemaVersion: PRICE_BOOK_SCHEMA_VERSION,
  };
}
