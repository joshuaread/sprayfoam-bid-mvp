'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, PageTitle, TextField } from '@/components/ui';
import { createEstimate } from '@/lib/estimates';
import { money } from '@/lib/format';
import { uid } from '@/lib/id';
import type { Customer, Estimate } from '@/lib/models';
import { store } from '@/lib/storage';

const blank = (): Customer => ({ id: uid('cust'), name: '', phone: '', email: '', address: '', source: 'manual', notes: '', createdAt: new Date().toISOString() });

export default function CustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [draft, setDraft] = useState<Customer | null>(null);
  const router = useRouter();
  const load = async () => {
    setList(await store.listCustomers());
    setEstimates(await store.listEstimates());
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <PageTitle
        title="Customers"
        subtitle="Manual customers and converted widget leads."
        actions={
          <button type="button" className="btn-primary" onClick={() => setDraft(blank())}>
            Add customer
          </button>
        }
      />
      {draft ? (
        <div className="card mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <TextField label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} type="tel" />
            <TextField label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
            <TextField label="Address" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
          </div>
          <TextField label="Notes" value={draft.notes} onChange={(v) => setDraft({ ...draft, notes: v })} />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                if (!draft.name.trim()) return;
                await store.saveCustomer(draft);
                setDraft(null);
                load();
              }}
            >
              Save
            </button>
            <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {list.length === 0 ? <p className="text-slate-500">No customers yet.</p> : null}
      <div className="space-y-2">
        {list.map((c) => {
          const theirs = estimates.filter((e) => e.customerId === c.id);
          return (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {c.name} <Badge tone={c.source === 'widget' ? 'amber' : 'slate'}>{c.source}</Badge>
                  </div>
                  <div className="text-xs text-slate-500">{[c.phone, c.email, c.address].filter(Boolean).join(' · ')}</div>
                  {c.notes ? <div className="text-xs text-slate-500">{c.notes}</div> : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary !px-2 !py-1 !text-xs"
                    onClick={async () => {
                      const e = await createEstimate({ customerId: c.id, customerName: c.name, customerPhone: c.phone, customerEmail: c.email, jobAddress: c.address });
                      router.push(`/estimate/?id=${e.id}`);
                    }}
                  >
                    New estimate
                  </button>
                  <button type="button" className="btn-secondary !px-2 !py-1 !text-xs" onClick={() => setDraft(c)}>
                    Edit
                  </button>
                </div>
              </div>
              {theirs.length ? (
                <ul className="mt-2 text-sm">
                  {theirs.map((e) => (
                    <li key={e.id}>
                      <Link href={`/estimate/?id=${e.id}`} className="text-teal-800 underline">
                        #{e.number} v{e.version}
                      </Link>{' '}
                      · {e.status} · {money(e.totals?.price ?? 0)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
