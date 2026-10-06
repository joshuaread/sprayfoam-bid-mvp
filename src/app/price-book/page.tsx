'use client';

import { useEffect, useState } from 'react';
import { Field, NumField, PageTitle } from '@/components/ui';
import { SAMPLE_PRICE_BOOK, type LadderRow, type PriceBook, type Product, type ProductKind } from '@/lib/engine';
import { uid } from '@/lib/id';
import { store } from '@/lib/storage';

const KINDS: { v: ProductKind; l: string }[] = [
  { v: 'open_cell', l: 'Open cell' },
  { v: 'closed_cell', l: 'Closed cell' },
  { v: 'coating', l: 'Coating' },
  { v: 'primer', l: 'Primer' },
  { v: 'other', l: 'Other foam' },
];

export default function PriceBookPage() {
  const [pb, setPb] = useState<PriceBook | null>(null);
  const [saved, setSaved] = useState('');
  useEffect(() => {
    store.getPriceBook().then(setPb);
  }, []);
  if (!pb) return <p>Loading…</p>;

  const save = (next: PriceBook) => {
    setPb(next);
    void store.savePriceBook(next);
    setSaved('Saved');
    setTimeout(() => setSaved(''), 1200);
  };
  const setProduct = (id: string, patch: Partial<Product>) => save({ ...pb, products: pb.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const setLadder = (i: number, patch: Partial<LadderRow>) => save({ ...pb, ladder: pb.ladder.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Price book"
        subtitle="Saved in this browser. New estimates snapshot these numbers; old estimates keep theirs."
        actions={
          <>
            <span className="self-center text-sm text-teal-700">{saved}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (confirm('Reset the price book to the sample numbers?')) save(JSON.parse(JSON.stringify(SAMPLE_PRICE_BOOK)));
              }}
            >
              Reset to samples
            </button>
          </>
        }
      />
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <b>Sample numbers.</b> The seeded prices, yields, and ladder are placeholders so the demo works. Replace them with your supplier pricing and your own field yields.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Products</h2>
        {pb.products.map((p) => {
          const coat = p.kind === 'coating' || p.kind === 'primer';
          return (
            <div key={p.id} className="card space-y-3" data-testid="product-card">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
                <Field label="Name">
                  <input className="input" value={p.name} onChange={(e) => setProduct(p.id, { name: e.target.value })} />
                </Field>
                <Field label="Kind">
                  <select className="input" value={p.kind} onChange={(e) => setProduct(p.id, { kind: e.target.value as ProductKind })}>
                    {KINDS.map((k) => (
                      <option key={k.v} value={k.v}>
                        {k.l}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-1 pb-2 text-sm">
                    <input type="checkbox" checked={p.active} onChange={(e) => setProduct(p.id, { active: e.target.checked })} /> Active
                  </label>
                  <button
                    type="button"
                    className="btn-danger !px-2 !py-1 !text-xs"
                    onClick={() => confirm(`Delete ${p.name}?`) && save({ ...pb, products: pb.products.filter((x) => x.id !== p.id) })}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {coat ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Field label="Priced by">
                    <select className="input" value={p.coatingPricing ?? 'per_sqft'} onChange={(e) => setProduct(p.id, { coatingPricing: e.target.value as 'per_sqft' | 'per_gal' })}>
                      <option value="per_sqft">$ per sq ft</option>
                      <option value="per_gal">$ per gallon</option>
                    </select>
                  </Field>
                  <NumField label="$ / sq ft / coat" value={p.pricePerSqft ?? 0} onChange={(n) => setProduct(p.id, { pricePerSqft: n })} />
                  <NumField label="$ / gallon" value={p.pricePerGal ?? 0} onChange={(n) => setProduct(p.id, { pricePerGal: n })} />
                  <NumField label="Coverage sq ft/gal" value={p.coverageSqftPerGal ?? 0} onChange={(n) => setProduct(p.id, { coverageSqftPerGal: n })} />
                  <NumField label="Waste %" value={p.wastePct} onChange={(n) => setProduct(p.id, { wastePct: n })} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                  <NumField label="Set price $" value={p.setPrice} onChange={(n) => setProduct(p.id, { setPrice: n })} />
                  <NumField label="Set size gal" value={p.setSizeGal} onChange={(n) => setProduct(p.id, { setSizeGal: n })} />
                  <NumField label="Rated yield bf/set" value={p.ratedYieldBfPerSet} onChange={(n) => setProduct(p.id, { ratedYieldBfPerSet: n })} />
                  <NumField label="Field-yield factor" value={p.fieldYieldFactor} onChange={(n) => setProduct(p.id, { fieldYieldFactor: n })} hint="0.85 = 85% of rated" />
                  <NumField label="Waste %" value={p.wastePct} onChange={(n) => setProduct(p.id, { wastePct: n })} />
                  <NumField label="R per inch (opt.)" value={p.rValuePerInch ?? 0} onChange={(n) => setProduct(p.id, { rValuePerInch: n })} />
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            save({
              ...pb,
              products: [
                ...pb.products,
                { id: uid('prod'), name: 'New product', kind: 'open_cell', setPrice: 0, setSizeGal: 110, ratedYieldBfPerSet: 15000, fieldYieldFactor: 0.85, wastePct: 10, active: true },
              ],
            })
          }
        >
          + Add product
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Labor</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Labor mode">
            <select className="input" value={pb.labor.mode} onChange={(e) => save({ ...pb, labor: { ...pb.labor, mode: e.target.value as 'production' | 'flat' } })}>
              <option value="production">Crew x hours (bf/hr)</option>
              <option value="flat">Flat $ per bf</option>
            </select>
          </Field>
          <NumField label="Crew size" value={pb.labor.crewSize} onChange={(n) => save({ ...pb, labor: { ...pb.labor, crewSize: n } })} />
          <NumField label="Hourly rate $" value={pb.labor.hourlyRate} onChange={(n) => save({ ...pb, labor: { ...pb.labor, hourlyRate: n } })} />
          <NumField label="Production bf/hr" value={pb.labor.prodRateBfPerHr} onChange={(n) => save({ ...pb, labor: { ...pb.labor, prodRateBfPerHr: n } })} />
          <NumField label="Flat $ / bf" value={pb.labor.laborPerBf} onChange={(n) => save({ ...pb, labor: { ...pb.labor, laborPerBf: n } })} />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Job charges &amp; pricing</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <NumField label="Trip charge $" value={pb.charges.tripCharge} onChange={(n) => save({ ...pb, charges: { ...pb.charges, tripCharge: n } })} />
          <NumField label="Mileage $/mi" value={pb.charges.mileageRate} onChange={(n) => save({ ...pb, charges: { ...pb.charges, mileageRate: n } })} />
          <NumField label="Minimum job $" value={pb.charges.minJob} onChange={(n) => save({ ...pb, charges: { ...pb.charges, minJob: n } })} />
          <Field label="Pricing mode">
            <select className="input" value={pb.pricingMode} onChange={(e) => save({ ...pb, pricingMode: e.target.value as PriceBook['pricingMode'] })}>
              <option value="margin">Cost-plus margin</option>
              <option value="ladder">Per-inch ladder</option>
            </select>
          </Field>
          <NumField label="Target margin %" value={pb.targetMarginPct} onChange={(n) => save({ ...pb, targetMarginPct: n })} hint="price = job cost / (1 - margin) + trip at cost" />
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Per-inch price ladder ($ / sq ft)</h2>
        <p className="text-xs text-slate-500">Used in ladder mode. Thicknesses between rows are interpolated; outside the range they scale per inch. Products of kind Other foam price from their own Other foam rows.</p>
        {pb.ladder.map((r, i) => (
          <div key={i} className="grid grid-cols-[1.2fr_1fr_1fr_auto] items-end gap-2">
            <Field label="Foam">
              <select className="input" value={r.kind} onChange={(e) => setLadder(i, { kind: e.target.value as LadderRow['kind'] })}>
                <option value="open_cell">Open cell</option>
                <option value="closed_cell">Closed cell</option>
                <option value="other">Other foam</option>
              </select>
            </Field>
            <NumField label="Inches" value={r.thicknessIn} onChange={(n) => setLadder(i, { thicknessIn: n })} />
            <NumField label="$ / sq ft" value={r.pricePerSqft} onChange={(n) => setLadder(i, { pricePerSqft: n })} />
            <button type="button" className="mb-1 px-2 text-lg text-slate-400 hover:text-red-600" aria-label="Remove ladder row" onClick={() => save({ ...pb, ladder: pb.ladder.filter((_, j) => j !== i) })}>
              x
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => save({ ...pb, ladder: [...pb.ladder, { kind: 'open_cell', thicknessIn: 1, pricePerSqft: 0 }] })}>
          + Ladder row
        </button>
      </section>
    </div>
  );
}
