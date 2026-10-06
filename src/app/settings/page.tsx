'use client';

import { useEffect, useState } from 'react';
import { Field, NumField, PageTitle, TextField } from '@/components/ui';
import { DISCLAIMER, type Branding } from '@/lib/models';
import { store } from '@/lib/storage';

async function fileToResizedDataUrl(file: File, max = 400): Promise<string> {
  const src = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

export default function SettingsPage() {
  const [b, setB] = useState<Branding | null>(null);
  const [saved, setSaved] = useState('');
  useEffect(() => {
    store.getBranding().then(setB);
  }, []);
  if (!b) return <p>Loading…</p>;
  const save = (next: Branding) => {
    setB(next);
    void store.saveBranding(next);
    setSaved('Saved');
    setTimeout(() => setSaved(''), 1200);
  };
  return (
    <div className="space-y-4">
      <PageTitle title="Settings" subtitle="Branding and terms used on the customer PDF." actions={<span className="self-center text-sm text-teal-700">{saved}</span>} />
      <section className="card space-y-3">
        <h2 className="font-semibold">Branding</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {b.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoDataUrl} alt="Logo preview" className="max-h-16 max-w-36 object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No logo</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/png,image/jpeg"
              data-testid="logo-upload"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) save({ ...b, logoDataUrl: await fileToResizedDataUrl(f) });
              }}
            />
            {b.logoDataUrl ? (
              <button type="button" className="btn-secondary !py-1 text-xs" onClick={() => save({ ...b, logoDataUrl: '' })}>
                Remove logo
              </button>
            ) : null}
            <p className="text-xs text-slate-500">PNG or JPG. Stored in this browser as a data URL (resized to 400px).</p>
          </div>
          <Field label="Brand color">
            <input type="color" className="h-10 w-20 rounded border border-slate-300" value={b.brandColor} onChange={(e) => save({ ...b, brandColor: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Company name" value={b.companyName} onChange={(v) => save({ ...b, companyName: v })} />
          <TextField label="License #" value={b.licenseNo} onChange={(v) => save({ ...b, licenseNo: v })} />
          <TextField label="Phone" value={b.phone} onChange={(v) => save({ ...b, phone: v })} />
          <TextField label="Email (lead alerts go here)" value={b.email} onChange={(v) => save({ ...b, email: v })} />
          <TextField label="Address" value={b.address} onChange={(v) => save({ ...b, address: v })} />
          <TextField label="Website" value={b.website} onChange={(v) => save({ ...b, website: v })} />
        </div>
      </section>
      <section className="card space-y-3">
        <h2 className="font-semibold">Proposal terms</h2>
        <Field label="Terms">
          <textarea className="input min-h-28" value={b.terms} onChange={(e) => save({ ...b, terms: e.target.value })} />
        </Field>
        <NumField label="Proposal valid for (days)" value={b.validityDays} onChange={(n) => save({ ...b, validityDays: n })} className="max-w-48" />
        <div>
          <span className="label">Disclaimer (always printed)</span>
          <p className="rounded bg-slate-50 p-2 text-sm italic text-slate-600">{DISCLAIMER}</p>
        </div>
      </section>
      <section className="card space-y-2">
        <h2 className="font-semibold">Account (stubbed)</h2>
        <p className="text-sm text-slate-600">Demo mode: no login, no users, no billing. Magic-link auth, Crew users, and the Stripe customer portal come later.</p>
        <button
          type="button"
          className="btn-danger"
          onClick={async () => {
            if (!confirm('Erase all demo data in this browser (estimates, customers, leads, price book, settings)?')) return;
            await store.resetAll();
            location.reload();
          }}
        >
          Reset all demo data
        </button>
      </section>
    </div>
  );
}
