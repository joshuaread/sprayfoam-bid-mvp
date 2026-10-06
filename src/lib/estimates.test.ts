import { SAMPLE_PRICE_BOOK, type PriceBook } from './engine';
import { createEstimate, DUPLICATE_KEPT_SNAPSHOT_NOTICE, duplicateEstimate, newArea } from './estimates';
import { store } from './storage';
import { describe, expect, it } from './testkit';

function installFakeLocalStorage() {
  const data = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    },
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('duplicate estimate and price book snapshots', () => {
  installFakeLocalStorage();

  const setup = async () => {
    await store.resetAll();
    await store.savePriceBook(JSON.parse(JSON.stringify(SAMPLE_PRICE_BOOK)) as PriceBook);
    const est = await createEstimate({ areas: [newArea(SAMPLE_PRICE_BOOK, 'freeform', 'Area 1')] });
    const edited: PriceBook = {
      ...(await store.getPriceBook()),
      targetMarginPct: 25,
      products: SAMPLE_PRICE_BOOK.products.map((p) => (p.kind === 'open_cell' ? { ...p, setPrice: p.setPrice * 2 } : p)),
    };
    await store.savePriceBook(edited);
    await sleep(5);
    return { est, edited };
  };

  it('plain Duplicate re-snapshots the current price book; the original keeps its own', async () => {
    const { est, edited } = await setup();
    const { estimate: copy, keptSnapshot } = await duplicateEstimate(est);
    expect(keptSnapshot).toBe(false);
    expect(copy.id).not.toBe(est.id);
    expect(copy.version).toBe(1);
    expect(copy.priceBookSnapshot).toEqual(edited);
    expect(copy.snapshotAt > est.snapshotAt).toBe(true);
    expect(copy.totals!.price).toBeGreaterThan(est.totals!.price);

    const original = (await store.getEstimate(est.id))!;
    expect(original.priceBookSnapshot).toEqual(est.priceBookSnapshot);
    expect(original.priceBookSnapshot.targetMarginPct).toBe(SAMPLE_PRICE_BOOK.targetMarginPct);
    expect(original.snapshotAt).toBe(est.snapshotAt);
  });

  it('Save as new version keeps the snapshot', async () => {
    const { est } = await setup();
    const { estimate: v2, keptSnapshot } = await duplicateEstimate(est, true);
    expect(keptSnapshot).toBe(false);
    expect(v2.number).toBe(est.number);
    expect(v2.version).toBe(est.version + 1);
    expect(v2.priceBookSnapshot).toEqual(est.priceBookSnapshot);
    expect(v2.snapshotAt).toBe(est.snapshotAt);
    expect(v2.totals!.price).toBe(est.totals!.price);
  });

  it('keeps the source snapshot and flags a notice when any layer product is missing from the current book', async () => {
    const { est } = await setup();
    const withMissing = {
      ...est,
      areas: [
        ...est.areas,
        { ...newArea(SAMPLE_PRICE_BOOK, 'freeform', 'Area 2'), layers: [{ id: 'lx', productId: 'deleted-product', inches: 2 }] },
      ],
    };
    await store.saveEstimate(withMissing);
    const { estimate: copy, keptSnapshot } = await duplicateEstimate(withMissing);
    expect(keptSnapshot).toBe(true);
    expect(copy.id).not.toBe(est.id);
    expect(copy.version).toBe(1);
    expect(copy.priceBookSnapshot).toEqual(est.priceBookSnapshot);
    expect(copy.snapshotAt).toBe(est.snapshotAt);
    expect(DUPLICATE_KEPT_SNAPSHOT_NOTICE).toMatch(/no longer in your price book/);
  });

  it('keeps the source estimate pricing mode and margin on duplicate', async () => {
    const { est } = await setup();
    const src = { ...est, pricingMode: 'ladder' as const, marginPct: 33 };
    await store.saveEstimate(src);
    const { estimate: copy } = await duplicateEstimate(src);
    expect(copy.pricingMode).toBe('ladder');
    expect(copy.marginPct).toBe(33);
  });
});
