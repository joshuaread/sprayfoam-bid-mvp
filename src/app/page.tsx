'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui';
import { BASE_PATH, money } from '@/lib/format';
import type { Estimate, Lead } from '@/lib/models';
import { APP_NAME_FULL } from '@/lib/models';
import { store } from '@/lib/storage';

const TILES = [
  { href: '/estimate/', label: 'New estimate', desc: 'Measure areas, add foam layers, get live totals.', primary: true },
  { href: '/estimates/', label: 'Estimates', desc: 'History, duplicate, new version.' },
  { href: '/customers/', label: 'Customers', desc: 'Manual entries and widget leads.' },
  { href: '/leads/', label: 'Leads', desc: 'Homeowner widget inbox.' },
  { href: '/price-book/', label: 'Price book', desc: 'Products, labor, trip, min job, ladder.' },
  { href: '/widget-setup/', label: 'Widget', desc: 'Instant-quote widget + embed snippet.' },
  { href: '/settings/', label: 'Settings', desc: 'Branding, logo, license #, terms.' },
];

export default function Dashboard() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    store.listEstimates().then(setEstimates);
    store.listLeads().then(setLeads);
  }, []);
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = estimates.filter((e) => e.updatedAt.startsWith(month));
  const sent = thisMonth.filter((e) => e.status === 'sent' || e.status === 'accepted');
  const accepted = thisMonth.filter((e) => e.status === 'accepted');
  const newLeads = leads.filter((l) => l.status === 'new');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{APP_NAME_FULL}</h1>
        <p className="text-slate-600">Messy jobsite measurements to a branded spray-foam bid, plus a homeowner instant-quote widget.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className={`card block transition hover:shadow-md ${t.primary ? 'border-teal-600 bg-teal-700 text-white' : ''}`}>
            <div className="font-semibold">{t.label}</div>
            <div className={`text-sm ${t.primary ? 'text-teal-50' : 'text-slate-600'}`}>{t.desc}</div>
          </Link>
        ))}
        <a href={`${BASE_PATH}/demo-site/`} className="card block border-dashed transition hover:shadow-md">
          <div className="font-semibold">Widget demo site</div>
          <div className="text-sm text-slate-600">A labeled DEMO contractor page with the widget embedded.</div>
        </a>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="label">This month sent</div>
          <div className="text-2xl font-bold">{sent.length}</div>
          <div className="text-sm text-slate-600">{money(sent.reduce((s, e) => s + (e.totals?.price ?? 0), 0))}</div>
        </div>
        <div className="card">
          <div className="label">This month accepted</div>
          <div className="text-2xl font-bold">{accepted.length}</div>
          <div className="text-sm text-slate-600">{money(accepted.reduce((s, e) => s + (e.totals?.price ?? 0), 0))}</div>
        </div>
        <div className="card">
          <div className="label">New leads</div>
          <div className="text-2xl font-bold">{newLeads.length}</div>
          <Link href="/leads/" className="text-sm text-teal-700 underline">
            Open inbox
          </Link>
        </div>
      </div>
      <div className="card">
        <h2 className="mb-2 font-semibold">Recent estimates</h2>
        {estimates.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : null}
        <ul className="divide-y divide-slate-100">
          {estimates.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <Link href={`/estimate/?id=${e.id}`} className="text-teal-800 underline">
                #{e.number}
                {e.version > 1 ? ` v${e.version}` : ''} {e.customerName || '(no customer)'}
              </Link>
              <span className="flex items-center gap-2">
                <Badge>{e.status}</Badge>
                {money(e.totals?.price ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
