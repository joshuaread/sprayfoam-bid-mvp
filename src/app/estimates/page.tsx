'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, PageTitle } from '@/components/ui';
import { DUPLICATE_KEPT_SNAPSHOT_NOTICE, duplicateEstimate } from '@/lib/estimates';
import { money, num } from '@/lib/format';
import type { Estimate } from '@/lib/models';
import { store } from '@/lib/storage';

export default function EstimatesPage() {
  const [list, setList] = useState<Estimate[]>([]);
  const [q, setQ] = useState('');
  const router = useRouter();
  const load = () => store.listEstimates().then(setList);
  useEffect(() => {
    load();
  }, []);
  const filtered = list.filter((e) => `${e.number} ${e.customerName} ${e.jobAddress} ${e.status}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageTitle
        title="Estimates"
        subtitle="Every estimate keeps its own price-book snapshot."
        actions={
          <Link href="/estimate/" className="btn-primary">
            New estimate
          </Link>
        }
      />
      <input className="input mb-3" placeholder="Search by number, customer, address, status" value={q} onChange={(e) => setQ(e.target.value)} />
      {filtered.length === 0 ? <p className="text-slate-500">No estimates yet.</p> : null}
      <div className="space-y-2" data-testid="estimate-list">
        {filtered.map((e) => (
          <div key={e.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/estimate/?id=${e.id}`} className="font-semibold text-teal-800 underline">
                #{e.number}
                {e.version > 1 ? ` v${e.version}` : ''} · {e.customerName || '(no customer)'}
              </Link>
              <div className="text-xs text-slate-500">
                {e.jobAddress || 'no address'} · {e.areas.length} area(s) · {num(e.totals?.sqft ?? 0)} sq ft · updated {new Date(e.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={e.status === 'accepted' ? 'teal' : e.status === 'lost' ? 'red' : e.status === 'sent' ? 'blue' : 'slate'}>{e.status}</Badge>
              <span className="font-semibold">{money(e.totals?.price ?? 0)}</span>
              <button
                type="button"
                className="btn-secondary !px-2 !py-1 !text-xs"
                onClick={async () => {
                  const { estimate: d, keptSnapshot } = await duplicateEstimate(e);
                  if (keptSnapshot) alert(DUPLICATE_KEPT_SNAPSHOT_NOTICE);
                  router.push(`/estimate/?id=${d.id}`);
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="btn-danger !px-2 !py-1 !text-xs"
                onClick={async () => {
                  if (!confirm(`Delete estimate #${e.number}?`)) return;
                  await store.deleteEstimate(e.id);
                  load();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
