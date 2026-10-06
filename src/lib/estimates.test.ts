import { SAMPLE_PRICE_BOOK, type PriceBook } from './engine';
import { createEstimate, duplicateEstimate, newArea } from './estimates';
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
    const copy = await duplicateEstimate(est);
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
    const v2 = await duplicateEstimate(est, true);
    expect(v2.number).toBe(est.number);
    expect(v2.version).toBe(est.version + 1);
    expect(v2.priceBookSnapshot).toEqual(est.priceBookSnapshot);
    expect(v2.snapshotAt).toBe(est.snapshotAt);
    expect(v2.totals!.price).toBe(est.totals!.price);
  });

  it('an old saved price book without other rows loads with the sample row merged in', async () => {
    await store.resetAll();
    const legacy = JSON.parse(JSON.stringify(SAMPLE_PRICE_BOOK)) as PriceBook;
    legacy.ladder = legacy.ladder.filter((r) => r.kind !== 'other');
    delete legacy.schemaVersion;
    await store.savePriceBook(legacy);
    const loaded = await store.getPriceBook();
    expect(loaded.ladder.filter((r) => r.kind === 'other').length).toBe(1);
  });
});
