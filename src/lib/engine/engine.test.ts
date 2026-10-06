import { describe, expect, it } from '../testkit';
import {
  computeAreaSqft,
  computeEstimate,
  ENGINE_VERSION,
  ladderPricePerSqft,
  pitchFactor,
  priceFromMargin,
  quoteRange,
  SAMPLE_PRICE_BOOK,
  setsFor,
  type Area,
  type PriceBook,
} from './index';

const close = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

// A simple, round-number price book for hand-checkable tests.
const PB: PriceBook = {
  products: [
    { id: 'oc', name: 'OC', kind: 'open_cell', setPrice: 1000, setSizeGal: 110, ratedYieldBfPerSet: 10000, fieldYieldFactor: 1, wastePct: 0, active: true },
    { id: 'cc', name: 'CC', kind: 'closed_cell', setPrice: 2000, setSizeGal: 110, ratedYieldBfPerSet: 4000, fieldYieldFactor: 0.8, wastePct: 10, active: true },
    { id: 'coat', name: 'Coat', kind: 'coating', setPrice: 0, setSizeGal: 5, ratedYieldBfPerSet: 0, fieldYieldFactor: 1, wastePct: 0, coatingPricing: 'per_sqft', pricePerSqft: 0.5, active: true },
    { id: 'coatg', name: 'CoatG', kind: 'coating', setPrice: 0, setSizeGal: 5, ratedYieldBfPerSet: 0, fieldYieldFactor: 1, wastePct: 0, coatingPricing: 'per_gal', pricePerGal: 40, coverageSqftPerGal: 100, active: true },
  ],
  labor: { crewSize: 2, hourlyRate: 25, mode: 'production', prodRateBfPerHr: 1000, laborPerBf: 0.1 },
  charges: { tripCharge: 100, mileageRate: 2, minJob: 0 },
  pricingMode: 'margin',
  targetMarginPct: 50,
  ladder: [
    { kind: 'open_cell', thicknessIn: 3, pricePerSqft: 1 },
    { kind: 'open_cell', thicknessIn: 5, pricePerSqft: 2 },
    { kind: 'closed_cell', thicknessIn: 2, pricePerSqft: 3 },
  ],
};

const free = (sqft: number, layers: Area['layers']): Area => ({ id: 'a', label: 'A', dims: { shape: 'freeform', sqft }, layers });

describe('area shapes', () => {
  it('walls minus openings with mixed heights', () => {
    const g = computeAreaSqft({
      shape: 'wall',
      segments: [
        { lengthFt: 40, heightFt: 8 },
        { lengthFt: 30, heightFt: 10 },
        { lengthFt: 20, heightFt: 12 },
      ],
      openings: [
        { kind: 'door', count: 2, widthFt: 3, heightFt: 6.75 },
        { kind: 'window', count: 4, widthFt: 3, heightFt: 4 },
        { kind: 'garage', count: 1, widthFt: 16, heightFt: 7 },
      ],
    });
    // 320 + 300 + 240 = 860 ; openings 40.5 + 48 + 112 = 200.5
    close(g.sqft, 659.5);
    expect(g.formula).toContain('860');
  });
  it('walls never go negative', () => {
    const g = computeAreaSqft({ shape: 'wall', segments: [{ lengthFt: 2, heightFt: 2 }], openings: [{ kind: 'door', count: 1, widthFt: 3, heightFt: 7 }] });
    expect(g.sqft).toBe(0);
  });
  it('gable ends', () => {
    close(computeAreaSqft({ shape: 'gable', spanFt: 24, riseFt: 6, qty: 2 }).sqft, 144);
  });
  it('roof deck by pitch', () => {
    close(pitchFactor(12), Math.SQRT2);
    close(pitchFactor(6), Math.sqrt(1.25));
    close(pitchFactor(0), 1);
    close(computeAreaSqft({ shape: 'roof_pitch', lengthFt: 40, widthFt: 30, pitchRise: 6 }).sqft, 1200 * Math.sqrt(1.25));
    // custom pitch
    close(computeAreaSqft({ shape: 'roof_pitch', lengthFt: 10, widthFt: 10, pitchRise: 7.5 }).sqft, 100 * Math.sqrt(1 + (7.5 / 12) ** 2));
  });
  it('attic floor list of rectangles', () => {
    close(computeAreaSqft({ shape: 'attic_floor', rects: [{ lengthFt: 30, widthFt: 20 }, { lengthFt: 10, widthFt: 12 }] }).sqft, 720);
  });
  it('quonset arch + end walls minus openings', () => {
    const g = computeAreaSqft({ shape: 'quonset', spanFt: 40, lengthFt: 60, endWalls: 2, openings: [{ kind: 'garage', count: 1, widthFt: 12, heightFt: 12 }] });
    // r = 20: arch = pi*20*60 ; ends = 2 * pi*400/2 = 400pi ; minus 144
    close(g.sqft, Math.PI * 1200 + Math.PI * 400 - 144);
  });
  it('metal building preset (walls + gables + roof by pitch)', () => {
    const g = computeAreaSqft({
      shape: 'metal_building', lengthFt: 60, widthFt: 40, eaveHeightFt: 14, pitchRise: 1,
      includeWalls: true, includeGables: true, includeRoof: true,
      openings: [{ kind: 'garage', count: 2, widthFt: 12, heightFt: 12 }],
    });
    const walls = 2 * 100 * 14; // 2800
    const gableRise = 20 * (1 / 12);
    const gables = 2 * 0.5 * 40 * gableRise;
    const roof = 2400 * Math.sqrt(1 + 1 / 144);
    close(g.sqft, walls + gables + roof - 288);
    const noRoof = computeAreaSqft({ shape: 'metal_building', lengthFt: 60, widthFt: 40, eaveHeightFt: 14, pitchRise: 1, includeWalls: true, includeGables: false, includeRoof: false, openings: [] });
    close(noRoof.sqft, 2800);
  });
  it('rim joist', () => {
    close(computeAreaSqft({ shape: 'rim_joist', linearFt: 160, joistHeightIn: 9 }).sqft, 120);
  });
  it('freeform', () => {
    close(computeAreaSqft({ shape: 'freeform', sqft: 512 }).sqft, 512);
    close(computeAreaSqft({ shape: 'freeform', sqft: -5 }).sqft, 0);
  });
});

describe('sets formula', () => {
  it('sets = bf / (rated yield x field factor) x (1 + waste)', () => {
    close(setsFor(4000, { ratedYieldBfPerSet: 4000, fieldYieldFactor: 0.8, wastePct: 10 }), (4000 / 3200) * 1.1);
    close(setsFor(10000, { ratedYieldBfPerSet: 10000, fieldYieldFactor: 1, wastePct: 0 }), 1);
    expect(setsFor(100, { ratedYieldBfPerSet: 0, fieldYieldFactor: 1, wastePct: 0 })).toBe(0);
  });
  it('totals show decimal and rounded-up sets per product', () => {
    const t = computeEstimate({ priceBook: PB, areas: [free(1000, [{ id: 'l1', productId: 'cc', inches: 2 }])] });
    // 2000 bf / 3200 * 1.1 = 0.6875
    close(t.sets, 0.688, 1e-3);
    expect(t.setsRounded).toBe(1);
    expect(t.setsByProduct[0].setsRounded).toBe(1);
    close(t.materialCost, 1375, 0.01);
  });
  it('rounded material cost basis charges full sets', () => {
    const t = computeEstimate({ priceBook: { ...PB, materialCostBasis: 'rounded' }, areas: [free(1000, [{ id: 'l1', productId: 'cc', inches: 2 }])] });
    close(t.materialCost, 2000, 0.01);
  });
});

describe('estimate totals', () => {
  it('multi-layer area: board feet, labor, margin mode', () => {
    const t = computeEstimate({
      priceBook: PB,
      miles: 10,
      areas: [free(1000, [{ id: 'l1', productId: 'cc', inches: 1 }, { id: 'l2', productId: 'oc', inches: 3 }])],
    });
    expect(t.engine_version).toBe(ENGINE_VERSION);
    expect(t.sqft).toBe(1000); // area counted once, not per layer
    expect(t.boardFeet).toBe(4000);
    // CC 1000bf -> 1000/3200*1.1 = 0.34375 sets * 2000 = 687.5 ; OC 3000bf -> 0.3 sets * 1000 = 300
    close(t.materialCost, 987.5, 0.01);
    // labor 4000 bf / 1000 = 4 hr * 2 crew * 25 = 200
    close(t.laborHours, 4, 1e-9);
    close(t.laborCost, 200, 0.01);
    // trip 100 + 10 mi * 2 = 120
    close(t.tripCost, 120, 0.01);
    close(t.totalCost, 1307.5, 0.01);
    // margin 50% -> price = cost / 0.5
    close(t.price, 2615, 0.01);
    close(t.marginAmt, 1307.5, 0.01);
    close(t.marginPct, 50, 0.01);
    close(t.pricePerSqft, 2.62, 0.01);
    expect(t.minJobApplied).toBe(false);
  });
  it('flat labor $/bf', () => {
    const t = computeEstimate({ priceBook: { ...PB, labor: { ...PB.labor, mode: 'flat', laborPerBf: 0.1 } }, areas: [free(1000, [{ id: 'l', productId: 'oc', inches: 5 }])] });
    close(t.laborCost, 500, 0.01);
    expect(t.laborHours).toBe(0);
  });
  it('coatings per sq ft and per gallon', () => {
    const t = computeEstimate({ priceBook: PB, areas: [free(1000, [{ id: 'c1', productId: 'coat', inches: 0, coats: 2 }, { id: 'c2', productId: 'coatg', inches: 0 }])] });
    // 1000*2*0.5 = 1000 ; 1000/100 = 10 gal * 40 = 400
    close(t.coatingCost, 1400, 0.01);
    expect(t.boardFeet).toBe(0);
  });
  it('priceFromMargin', () => {
    close(priceFromMargin(600, 40), 1000);
    close(priceFromMargin(600, 0), 600);
  });
  it('per-estimate margin override', () => {
    const t = computeEstimate({ priceBook: { ...PB, charges: { ...PB.charges, tripCharge: 0 } }, marginPct: 20, areas: [free(1000, [{ id: 'l', productId: 'oc', inches: 10 }])] });
    // 10000 bf -> 1 set = 1000 ; labor 10hr*2*25 = 500 ; cost 1500 ; /0.8 = 1875
    close(t.price, 1875, 0.01);
  });
  it('warns on missing product', () => {
    const t = computeEstimate({ priceBook: PB, areas: [free(100, [{ id: 'l', productId: 'nope', inches: 2 }])] });
    expect(t.warnings.length).toBe(1);
  });
});

describe('ladder mode', () => {
  it('exact, interpolated, and scaled lookups', () => {
    expect(ladderPricePerSqft(PB.ladder, 'open_cell', 3)!.pricePerSqft).toBe(1);
    close(ladderPricePerSqft(PB.ladder, 'open_cell', 4)!.pricePerSqft, 1.5);
    close(ladderPricePerSqft(PB.ladder, 'open_cell', 10)!.pricePerSqft, 4); // 2/5 per inch * 10
    close(ladderPricePerSqft(PB.ladder, 'closed_cell', 1)!.pricePerSqft, 1.5);
    expect(ladderPricePerSqft([], 'open_cell', 3)).toBeNull();
  });
  it('price = sum of ladder prices + coatings at margin + trip', () => {
    const t = computeEstimate({
      priceBook: { ...PB, pricingMode: 'ladder' },
      areas: [free(1000, [{ id: 'l1', productId: 'cc', inches: 2 }, { id: 'l2', productId: 'coat', inches: 0 }])],
    });
    // ladder CC 2" = $3/sqft * 1000 = 3000 ; coating cost 500 at 50% = 1000 ; trip 100
    close(t.price, 4100, 0.01);
    expect(t.pricingMode).toBe('ladder');
    close(t.marginAmt, t.price - t.totalCost, 0.01);
  });
  it('per-estimate mode override', () => {
    const t = computeEstimate({ priceBook: PB, pricingMode: 'ladder', areas: [free(100, [{ id: 'l', productId: 'oc', inches: 5 }])] });
    close(t.calculatedPrice, 300, 0.01); // 200 + trip 100
  });
});

describe('minimum job', () => {
  it('applies the min job floor with a note', () => {
    const t = computeEstimate({ priceBook: { ...PB, charges: { ...PB.charges, minJob: 2500 } }, areas: [free(100, [{ id: 'l', productId: 'oc', inches: 3 }])] });
    expect(t.minJobApplied).toBe(true);
    expect(t.price).toBe(2500);
    expect(t.calculatedPrice).toBeLessThan(2500);
    expect(t.minJobNote).toMatch(/Minimum job/);
    close(t.marginAmt, 2500 - t.totalCost, 0.01);
  });
  it('does not apply when price exceeds min job', () => {
    const t = computeEstimate({ priceBook: { ...PB, charges: { ...PB.charges, minJob: 100 } }, areas: [free(1000, [{ id: 'l', productId: 'oc', inches: 3 }])] });
    expect(t.minJobApplied).toBe(false);
    expect(t.minJobNote).toBeUndefined();
  });
});

describe('widget quote range', () => {
  it('band around price book price, min job applied, rounded to $50', () => {
    const q = quoteRange({ ...PB, charges: { ...PB.charges, minJob: 0 } }, { sqft: 1000, foamPref: 'oc', ocInches: 5, ccInches: 2, bandPct: 10 });
    // OC 5": 5000bf -> 0.5 set=500 ; labor 5hr*50=250 ; trip 100 ; cost 850 ; price 1700 ; +/-10% -> 1530..1870
    expect(q.low).toBe(1550);
    expect(q.high).toBe(1850);
    expect(q.minJobApplied).toBe(false);
  });
  it('not sure spans OC and CC', () => {
    const q = quoteRange(PB, { sqft: 1000, foamPref: 'unsure', ocInches: 5, ccInches: 2, bandPct: 0 });
    expect(q.basis.length).toBe(2);
    expect(q.high).toBeGreaterThan(q.low);
  });
  it('min job floors the range', () => {
    const q = quoteRange({ ...PB, charges: { ...PB.charges, minJob: 3000 } }, { sqft: 100, foamPref: 'cc', ocInches: 5, ccInches: 2, bandPct: 15 });
    expect(q.low).toBe(3000);
    expect(q.high).toBe(3000);
    expect(q.minJobApplied).toBe(true);
  });
  it('sample price book produces a sensible $/sq ft', () => {
    const t = computeEstimate({ priceBook: SAMPLE_PRICE_BOOK, areas: [free(1500, [{ id: 'l', productId: 'oc-sample', inches: 5.5 }])] });
    expect(t.pricePerSqft).toBeGreaterThan(0.8);
    expect(t.pricePerSqft).toBeLessThan(4);
  });
});
