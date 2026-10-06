'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AreaCard } from '@/components/AreaEditor';
import { TotalsBar } from '@/components/TotalsBar';
import { Badge, Field, NumberInput } from '@/components/ui';
import { SHAPE_LABELS, type Area, type Shape } from '@/lib/engine';
import { createEstimate, duplicateEstimate, newArea, recompute } from '@/lib/estimates';
import { money, num } from '@/lib/format';
import { uid } from '@/lib/id';
import type { Branding, Customer, Estimate, EstimateStatus } from '@/lib/models';
import { downloadCostSheetPdf, downloadCustomerPdf } from '@/lib/pdf';
import { store } from '@/lib/storage';

const SHAPES: Shape[] = ['wall', 'gable', 'roof_pitch', 'attic_floor', 'quonset', 'metal_building', 'rim_joist', 'freeform'];
const SHAPE_ICON: Record<Shape, string> = {
  wall: '▭',
  gable: '△',
  roof_pitch: '⌂',
  attic_floor: '▦',
  quonset: '◠',
  metal_building: '▣',
  rim_joist: '═',
  freeform: '✎',
};

export function EstimateBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const [est, setEst] = useState<Estimate | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [msg, setMsg] = useState('');
  const creating = useRef(false);

  useEffect(() => {
    store.listCustomers().then(setCustomers);
    store.getBranding().then(setBranding);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (id) {
        const e = await store.getEstimate(id);
        if (alive) setEst(e ? recompute(e) : null);
        return;
      }
      if (creating.current) return;
      creating.current = true;
      const e = await createEstimate();
      router.replace(`/estimate/?id=${e.id}`);
    })();
    return () => {
      alive = false;
    };
  }, [id, router]);

  const update = useCallback((patch: Partial<Estimate> | ((e: Estimate) => Estimate)) => {
    setEst((prev) => {
      if (!prev) return prev;
      const next = recompute({ ...(typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }), updatedAt: new Date().toISOString() });
      void store.saveEstimate(next);
      return next;
    });
  }, []);

  if (!est) {
    return id ? (
      <p className="text-slate-600">
        Estimate not found in this browser. <Link className="text-teal-700 underline" href="/estimates/">Back to estimates</Link>
      </p>
    ) : (
      <p className="text-slate-500">Creating estimate…</p>
    );
  }

  const pb = est.priceBookSnapshot;
  const t = est.totals;
  const setArea = (a: Area) => update((e) => ({ ...e, areas: e.areas.map((x) => (x.id === a.id ? a : x)) }));

  const addArea = (shape: Shape) => {
    const count = est.areas.filter((a) => a.dims.shape === shape).length + 1;
    update((e) => ({ ...e, areas: [...e.areas, newArea(pb, shape, `${SHAPE_LABELS[shape]} ${count}`)] }));
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  };

  const pickCustomer = (cid: string) => {
    const c = customers.find((x) => x.id === cid);
    if (!c) return update({ customerId: null });
    update({ customerId: c.id, customerName: c.name, customerPhone: c.phone, customerEmail: c.email, jobAddress: est.jobAddress || c.address });
  };

  const saveAsCustomer = async () => {
    if (!est.customerName.trim()) return setMsg('Enter a customer name first.');
    const c: Customer = {
      id: est.customerId ?? uid('cust'),
      name: est.customerName,
      phone: est.customerPhone,
      email: est.customerEmail,
      address: est.jobAddress,
      source: 'manual',
      notes: '',
      createdAt: new Date().toISOString(),
    };
    await store.saveCustomer(c);
    setCustomers(await store.listCustomers());
    update({ customerId: c.id });
    setMsg(`Saved customer ${c.name}.`);
  };

  const refreshPrices = async () => {
    if (!confirm('Replace this estimate’s price snapshot with the current price book? Totals may change.')) return;
    const cur = await store.getPriceBook();
    update({ priceBookSnapshot: JSON.parse(JSON.stringify(cur)), snapshotAt: new Date().toISOString() });
  };

  const pdf = async (kind: 'customer' | 'cost') => {
    const b = branding ?? (await store.getBranding());
    setBusy(kind);
    try {
      if (kind === 'customer') await downloadCustomerPdf(est, b);
      else await downloadCostSheetPdf(est, b);
      setMsg(kind === 'customer' ? 'Customer proposal PDF downloaded.' : 'Internal cost sheet PDF downloaded.');
    } catch (err) {
      setMsg(`PDF failed: ${(err as Error).message}`);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-4" data-testid="estimate-builder">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            Estimate #{est.number}
            {est.version > 1 ? <span className="text-slate-500"> v{est.version}</span> : null}
          </h1>
          <p className="text-xs text-slate-500">
            Prices snapshotted {new Date(est.snapshotAt).toLocaleString()} ·{' '}
            <button type="button" className="text-teal-700 underline" onClick={refreshPrices}>
              refresh from price book
            </button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input !w-auto !py-1 text-sm" aria-label="Status" value={est.status} onChange={(e) => update({ status: e.target.value as EstimateStatus })}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="lost">Lost</option>
          </select>
          <button
            type="button"
            className="btn-secondary !py-1"
            onClick={async () => {
              const { estimate: d } = await duplicateEstimate(est, true);
              router.push(`/estimate/?id=${d.id}`);
            }}
          >
            Save as v{est.version + 1}
          </button>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold">Customer &amp; job</h2>
        {customers.length > 0 ? (
          <Field label="Existing customer">
            <select className="input" value={est.customerId ?? ''} onChange={(e) => pickCustomer(e.target.value)}>
              <option value="">- New / not saved -</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer name">
            <input className="input" value={est.customerName} aria-label="Customer name" onChange={(e) => update({ customerName: e.target.value })} />
          </Field>
          <Field label="Job address">
            <input className="input" value={est.jobAddress} aria-label="Job address" onChange={(e) => update({ jobAddress: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="input" type="tel" value={est.customerPhone} onChange={(e) => update({ customerPhone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" value={est.customerEmail} onChange={(e) => update({ customerEmail: e.target.value })} />
          </Field>
          <Field label="Valid until">
            <input className="input" type="date" value={est.validUntil} onChange={(e) => update({ validUntil: e.target.value })} />
          </Field>
          <Field label="Notes on proposal (optional)">
            <input className="input" value={est.notes} onChange={(e) => update({ notes: e.target.value })} />
          </Field>
        </div>
        <button type="button" className="btn-secondary !py-1 text-xs" onClick={saveAsCustomer}>
          {est.customerId ? 'Update customer record' : 'Save as customer'}
        </button>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Pricing</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Mode">
            <select className="input" aria-label="Pricing mode" value={est.pricingMode} onChange={(e) => update({ pricingMode: e.target.value as Estimate['pricingMode'] })}>
              <option value="margin">Cost-plus margin</option>
              <option value="ladder">Per-inch ladder</option>
            </select>
          </Field>
          <Field label={est.pricingMode === 'ladder' ? 'Margin % (coatings)' : 'Target margin %'}>
            <NumberInput value={est.marginPct} onChange={(n) => update({ marginPct: n })} ariaLabel="Target margin %" />
          </Field>
          <Field label="Miles (one way)">
            <NumberInput value={est.miles} onChange={(n) => update({ miles: n })} ariaLabel="Miles" />
          </Field>
          <div className="text-xs text-slate-500">
            {est.pricingMode === 'margin' ? 'Price = job cost / (1 - margin), plus trip at cost.' : 'Price = ladder $/sq ft by foam type + thickness, plus coatings at margin, plus trip at cost.'}
            <br />
            Min job {money(pb.charges.minJob)} · trip {money(pb.charges.tripCharge)}
          </div>
        </div>
      </section>

      <div className="space-y-3" data-testid="area-list">
        {est.areas.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No areas yet. Add one below.</p> : null}
        {est.areas.map((a, i) => (
          <AreaCard
            key={a.id}
            index={i}
            area={a}
            result={t?.areas.find((r) => r.areaId === a.id)}
            priceBook={pb}
            onChange={setArea}
            onRemove={() => update((e) => ({ ...e, areas: e.areas.filter((x) => x.id !== a.id) }))}
            onDuplicate={() =>
              update((e) => {
                const copy: Area = JSON.parse(JSON.stringify(a));
                copy.id = uid('area');
                copy.label = `${a.label} (copy)`;
                copy.layers = copy.layers.map((l) => ({ ...l, id: uid('layer') }));
                const idx = e.areas.findIndex((x) => x.id === a.id);
                const areas = [...e.areas];
                areas.splice(idx + 1, 0, copy);
                return { ...e, areas };
              })
            }
          />
        ))}
      </div>

      <section className="card">
        <h2 className="mb-2 font-semibold">Add an area</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SHAPES.map((s) => (
            <button key={s} type="button" data-testid={`add-shape-${s}`} className="btn-secondary !justify-start !py-3 text-left" onClick={() => addArea(s)}>
              <span className="text-lg" aria-hidden>
                {SHAPE_ICON[s]}
              </span>
              {SHAPE_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      {t ? (
        <section className="card" data-testid="review">
          <h2 className="mb-2 font-semibold">Review &amp; price</h2>
          {t.minJobApplied ? <p className="mb-2 rounded bg-amber-100 px-2 py-1 text-sm text-amber-900">{t.minJobNote}</p> : null}
          {t.warnings.map((w) => (
            <p key={w} className="mb-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
              {w}
            </p>
          ))}
          <table className="w-full text-sm">
            <tbody>
              {t.setsByProduct.map((s) => (
                <tr key={s.productId} className="border-b border-slate-100">
                  <td className="py-1">{s.productName}</td>
                  <td className="py-1 text-right">{num(s.boardFeet, 0)} bf</td>
                  <td className="py-1 text-right">
                    {num(s.sets, 2)} sets <Badge>{s.setsRounded} to order</Badge>
                  </td>
                  <td className="py-1 text-right">{money(s.materialCost)}</td>
                </tr>
              ))}
              {(
                [
                  ['Labor', `${money(t.laborCost)}${t.laborHours ? ` · ${num(t.laborHours, 1)} hr` : ''}`],
                  ['Trip + mileage', money(t.tripCost)],
                  ['Coatings', money(t.coatingCost)],
                  ['Total cost', money(t.totalCost)],
                  ['Calculated price', money(t.calculatedPrice)],
                  ['Price', money(t.price)],
                  ['Gross margin (% excl. trip)', `${money(t.marginAmt)} (${num(t.marginPct, 1)}%)`],
                ] as const
              ).map(([k, v]) => (
                <tr key={k} className="border-b border-slate-100">
                  <td className="py-1 font-medium" colSpan={3}>
                    {k}
                  </td>
                  <td className="py-1 text-right font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-slate-400">engine v{t.engine_version}</p>
        </section>
      ) : null}

      <section className="card space-y-2">
        <h2 className="font-semibold">Documents</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" data-testid="btn-customer-pdf" disabled={!!busy} onClick={() => pdf('customer')}>
            {busy === 'customer' ? 'Building…' : 'Customer proposal PDF'}
          </button>
          <button type="button" className="btn-secondary" data-testid="btn-cost-pdf" disabled={!!busy} onClick={() => pdf('cost')}>
            {busy === 'cost' ? 'Building…' : 'Internal cost sheet PDF'}
          </button>
          <button type="button" className="btn-secondary" disabled title="Email sending is stubbed in the demo (Resend later)">
            Email to customer (stubbed)
          </button>
        </div>
        <p className="text-xs text-slate-500">PDFs are generated in your browser. Branding, logo, and terms come from Settings.</p>
        {msg ? (
          <p className="text-sm text-teal-800" data-testid="builder-msg">
            {msg}
          </p>
        ) : null}
      </section>

      <TotalsBar t={t} />
    </div>
  );
}
