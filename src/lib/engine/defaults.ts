import type { PriceBook } from './types';

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
  ladder: [
    { kind: 'open_cell', thicknessIn: 3.5, pricePerSqft: 1.1 },
    { kind: 'open_cell', thicknessIn: 5.5, pricePerSqft: 1.55 },
    { kind: 'open_cell', thicknessIn: 7.5, pricePerSqft: 2.0 },
    { kind: 'open_cell', thicknessIn: 10, pricePerSqft: 2.6 },
    { kind: 'closed_cell', thicknessIn: 1, pricePerSqft: 1.15 },
    { kind: 'closed_cell', thicknessIn: 2, pricePerSqft: 2.1 },
    { kind: 'closed_cell', thicknessIn: 3, pricePerSqft: 3.0 },
    { kind: 'other', thicknessIn: 2, pricePerSqft: 1.8 },
  ],
};
