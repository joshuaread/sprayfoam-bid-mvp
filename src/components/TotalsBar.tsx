'use client';

import { useState } from 'react';
import type { EstimateTotals } from '@/lib/engine';
import { money, num } from '@/lib/format';

function shortName(n: string) {
  const s = n.replace(/\s*\(sample\)/i, '');
  if (/open cell/i.test(s)) return 'OC';
  if (/closed cell/i.test(s)) return 'CC';
  return s.length > 12 ? s.slice(0, 12) + '…' : s;
}

export function TotalsBar({ t }: { t: EstimateTotals | null }) {
  const [open, setOpen] = useState(false);
  if (!t) return null;
  const rows: [string, string][] = [
    ['Sq ft', num(t.sqft, 0)],
    ['Board feet', num(t.boardFeet, 0)],
    ['Sets', `${num(t.sets, 2)} total`],
    ['Sets to order', t.setsByProduct.length ? t.setsByProduct.map((s) => `${s.setsRounded} ${shortName(s.productName)}`).join(', ') : '0'],
    ['Material', money(t.materialCost)],
    ['Labor', `${money(t.laborCost)}${t.laborHours ? ` (${num(t.laborHours, 1)} hr)` : ''}`],
    ['Trip', money(t.tripCost)],
    ['Min job', t.minJobApplied ? `${money(t.minJob)} applied` : `${money(t.minJob)} (not needed)`],
    ['Coatings', money(t.coatingCost)],
    ['Total cost', money(t.totalCost)],
    ['Price', money(t.price)],
    ['Margin', `${money(t.marginAmt)} (${num(t.marginPct, 1)}%)`],
    ['Price / sq ft', money(t.pricePerSqft, 2)],
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-slate-900 text-white shadow-2xl" data-testid="totals-bar">
      <div className="mx-auto max-w-6xl px-3 py-2">
        {t.minJobApplied ? (
          <div className="mb-1 rounded bg-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-950" data-testid="min-job-note">
            {t.minJobNote}
          </div>
        ) : null}
        <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid="totals-toggle">
          <div className="grid flex-1 grid-cols-4 gap-2 text-[11px] leading-tight sm:grid-cols-6">
            <div>
              <div className="text-slate-400">Sq ft</div>
              <div className="text-sm font-semibold" data-testid="totals-sqft">{num(t.sqft, 0)}</div>
            </div>
            <div>
              <div className="text-slate-400">Board ft</div>
              <div className="text-sm font-semibold" data-testid="totals-bf">{num(t.boardFeet, 0)}</div>
            </div>
            <div>
              <div className="text-slate-400">Sets</div>
              <div className="text-sm font-semibold" data-testid="totals-sets">
                {num(t.sets, 2)} <span className="text-slate-400">/ {t.setsRounded}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400">Margin</div>
              <div className="text-sm font-semibold">{num(t.marginPct, 0)}%</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-slate-400">Cost</div>
              <div className="text-sm font-semibold">{money(t.totalCost)}</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-slate-400">$/sq ft</div>
              <div className="text-sm font-semibold">{money(t.pricePerSqft, 2)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Price {open ? '▾' : '▴'}</div>
            <div className="text-xl font-bold text-teal-300" data-testid="totals-price">{money(t.price)}</div>
          </div>
        </button>
        {open ? (
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-slate-700 pt-2 text-xs sm:grid-cols-4" data-testid="totals-detail">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
