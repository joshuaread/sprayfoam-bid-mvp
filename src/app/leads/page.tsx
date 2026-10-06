'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, PageTitle } from '@/components/ui';
import { convertLeadToEstimate } from '@/lib/estimates';
import { BASE_PATH, money, num } from '@/lib/format';
import type { Lead, OutboxEmail, WidgetConfig } from '@/lib/models';
import { store } from '@/lib/storage';

const FOAM: Record<Lead['foamPref'], string> = { oc: 'Open cell', cc: 'Closed cell', unsure: 'Not sure' };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [outbox, setOutbox] = useState<OutboxEmail[]>([]);
  const [widget, setWidget] = useState<WidgetConfig | null>(null);
  const router = useRouter();
  const load = async () => {
    setLeads(await store.listLeads());
    setOutbox(await store.listOutbox());
    setWidget(await store.getWidgetConfig());
  };
  useEffect(() => {
    load();
    const onStorage = () => load();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return (
    <div>
      <PageTitle
        title="Leads inbox"
        subtitle="Homeowner leads from the instant-quote widget (stored in this browser)."
        actions={
          <a className="btn-secondary" href={`${BASE_PATH}/demo-site/`}>
            Open widget demo site
          </a>
        }
      />
      {leads.length === 0 ? <p className="text-slate-500">No leads yet. Try the widget on the demo site.</p> : null}
      <div className="space-y-3" data-testid="lead-list">
        {leads.map((l) => {
          const mail = outbox.find((m) => m.body.includes(l.id));
          return (
            <div key={l.id} className="card" data-testid="lead-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {l.name} <Badge tone={l.status === 'new' ? 'amber' : 'teal'}>{l.status}</Badge>
                    {l.preview ? <Badge>preview</Badge> : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    {l.projectLabel} · ~{num(l.sqft)} sq ft · {FOAM[l.foamPref]} · ZIP {l.zip}
                  </div>
                  <div className="text-sm text-slate-600">
                    {l.phone} · {l.email}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    Range shown: {money(l.quotedLow)} - {money(l.quotedHigh)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(l.createdAt).toLocaleString()} · consent: {l.consent ? 'yes' : 'no'}
                  </div>
                  <div className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-900" data-testid="lead-email-status">
                    Email stubbed: would email contractor at {l.emailTo || mail?.to || '(no email set)'}
                    {mail ? ` — "${mail.subject}"` : ''}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {l.estimateId ? (
                    <button type="button" className="btn-secondary !py-1 text-xs" onClick={() => router.push(`/estimate/?id=${l.estimateId}`)}>
                      Open estimate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary !py-1 text-xs"
                      data-testid="convert-lead"
                      onClick={async () => {
                        if (!widget) return;
                        const e = await convertLeadToEstimate(l, widget);
                        router.push(`/estimate/?id=${e.id}`);
                      }}
                    >
                      Convert to estimate
                    </button>
                  )}
                  <select
                    className="input !py-1 text-xs"
                    value={l.status}
                    aria-label="Lead status"
                    onChange={async (e) => {
                      await store.saveLead({ ...l, status: e.target.value as Lead['status'] });
                      load();
                    }}
                  >
                    {['new', 'contacted', 'estimated', 'won', 'lost'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
