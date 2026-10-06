'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { quoteRange, type FoamPref, type PriceBook } from '@/lib/engine';
import { email } from '@/lib/email';
import { money, num } from '@/lib/format';
import { uid } from '@/lib/id';
import type { Branding, Lead, WidgetConfig } from '@/lib/models';
import { store } from '@/lib/storage';

type Step = 'type' | 'sqft' | 'foam' | 'contact' | 'range' | 'done';

function helperSqft(type: string, L: number, W: number, H: number): { sqft: number; how: string } {
  const per = 2 * (L + W);
  switch (type) {
    case 'attic':
      return { sqft: L * W * 1.15, how: 'footprint x 1.15 (roofline allowance)' };
    case 'walls':
      return { sqft: per * H * 0.85, how: 'perimeter x wall height, minus ~15% for doors/windows' };
    case 'crawlspace':
      return { sqft: per * H, how: 'perimeter x crawlspace wall height' };
    case 'pole_barn':
      return { sqft: per * H + L * W * 1.05, how: 'walls (perimeter x height) + roof (footprint x 1.05)' };
    case 'rim_joist':
      return { sqft: per * (9.25 / 12), how: 'perimeter x 9.25" joist height' };
    default:
      return { sqft: L * W, how: 'length x width' };
  }
}

export function WidgetFlow({ config, priceBook, branding, preview }: { config: WidgetConfig; priceBook: PriceBook; branding: Branding; preview?: boolean }) {
  const [step, setStep] = useState<Step>('type');
  const [ptype, setPtype] = useState('');
  const [sqft, setSqft] = useState(0);
  const [sqftText, setSqftText] = useState('');
  const [foam, setFoam] = useState<FoamPref>('unsure');
  const [helper, setHelper] = useState(false);
  const [hL, setHL] = useState(40);
  const [hW, setHW] = useState(30);
  const [hH, setHH] = useState(8);
  const [form, setForm] = useState({ name: '', phone: '', email: '', zip: '', consent: false, company_website: '' });
  const [err, setErr] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pt = config.projectTypes.find((p) => p.key === ptype);
  const types = config.projectTypes.filter((p) => p.enabled);
  const color = config.primaryColor || '#0f766e';
  const textColor = config.textColor || '#ffffff';

  const range = useMemo(
    () =>
      pt && sqft > 0
        ? quoteRange(priceBook, { sqft, foamPref: foam, ocInches: pt.ocInches, ccInches: pt.ccInches, bandPct: config.bandPct })
        : null,
    [pt, sqft, foam, priceBook, config.bandPct],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      window.parent?.postMessage({ type: 'sfbb:height', height: el.scrollHeight + 4 }, '*');
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (pt) setHH(pt.key === 'crawlspace' ? 3 : pt.key === 'pole_barn' ? 12 : 8);
  }, [pt]);

  const submitLead = async () => {
    setErr('');
    if (form.company_website) {
      // honeypot tripped: pretend success, store nothing
      setSubmitted(true);
      setStep(config.gated ? 'range' : 'done');
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !/^\d{5}$/.test(form.zip.trim())) {
      setErr('Please enter your name, phone, a valid email, and a 5-digit ZIP.');
      return;
    }
    if (!form.consent) {
      setErr('Please check the consent box so the contractor can contact you.');
      return;
    }
    const now = new Date().toISOString();
    const lead: Lead = {
      id: uid('lead'),
      createdAt: now,
      widgetKey: config.widgetKey,
      projectType: ptype,
      projectLabel: pt?.label ?? ptype,
      sqft: Math.round(sqft),
      foamPref: foam,
      quotedLow: range?.low ?? 0,
      quotedHigh: range?.high ?? 0,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      zip: form.zip.trim(),
      consent: true,
      consentText: config.consentText,
      consentAt: now,
      status: 'new',
      emailStatus: 'stubbed',
      emailTo: branding.email,
      preview: !!preview,
    };
    const res = await email.send({
      to: branding.email,
      subject: `New spray foam lead: ${lead.name} (${lead.projectLabel}, ~${lead.sqft} sq ft)`,
      body: `Lead ${lead.id}\n${lead.name} | ${lead.phone} | ${lead.email} | ZIP ${lead.zip}\nProject: ${lead.projectLabel}, ~${lead.sqft} sq ft, foam: ${lead.foamPref}\nRange shown: $${lead.quotedLow} - $${lead.quotedHigh}`,
    });
    lead.emailStatus = res.status;
    await store.saveLead(lead);
    setSubmitted(true);
    setStep(config.gated ? 'range' : 'done');
  };

  const Btn = ({ children, onClick, disabled, testId }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; testId?: string }) => (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-lg px-4 py-3 text-base font-semibold shadow-sm disabled:opacity-50"
      style={{ background: color, color: textColor }}
    >
      {children}
    </button>
  );
  const Back = ({ to }: { to: Step }) => (
    <button type="button" className="mt-2 text-sm text-slate-500 underline" onClick={() => setStep(to)}>
      Back
    </button>
  );

  const contactForm = (
    <div className="space-y-2" data-testid="lead-form">
      <input className="input" placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="input" placeholder="Phone" aria-label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className="input" placeholder="Email" aria-label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" placeholder="ZIP code" aria-label="ZIP" inputMode="numeric" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Company website
          <input tabIndex={-1} autoComplete="off" name="company_website" value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" aria-label="Consent" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
        <span>{config.consentText}</span>
      </label>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <Btn onClick={submitLead} testId="widget-submit">
        {config.gated ? 'See my price range' : 'Request an exact quote'}
      </Btn>
    </div>
  );

  const rangeBox = range ? (
    <div className="rounded-xl border-2 p-4 text-center" style={{ borderColor: color }} data-testid="widget-range">
      <div className="text-sm text-slate-600">Estimated range for ~{num(sqft)} sq ft</div>
      <div className="my-1 text-3xl font-bold" style={{ color }}>
        {range.low === range.high ? money(range.low) : `${money(range.low)} – ${money(range.high)}`}
      </div>
      {range.note ? <div className="text-xs text-slate-500">{range.note}</div> : null}
      <div className="mt-2 text-[11px] text-slate-500">Ballpark only. Final price requires an on-site measurement by {branding.companyName}.</div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="mx-auto max-w-md bg-white p-4 font-sans text-slate-900" data-testid="widget-root">
      <div className="mb-3 rounded-lg px-3 py-2 text-center font-semibold" style={{ background: color, color: textColor }}>
        {config.headline}
      </div>
      {preview ? <div className="mb-2 text-center text-[11px] text-slate-400">Preview</div> : null}

      {step === 'type' ? (
        <div>
          <div className="mb-2 font-semibold">1. What are you insulating?</div>
          <div className="grid grid-cols-2 gap-2">
            {types.map((t) => (
              <button
                key={t.key}
                type="button"
                data-testid={`wtype-${t.key}`}
                className={`rounded-lg border px-3 py-3 text-left text-sm font-medium ${ptype === t.key ? 'border-2' : 'border-slate-300'}`}
                style={ptype === t.key ? { borderColor: color } : undefined}
                onClick={() => {
                  setPtype(t.key);
                  setStep('sqft');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 'sqft' ? (
        <div className="space-y-2">
          <div className="font-semibold">2. About how many square feet?</div>
          <input
            className="input text-lg"
            inputMode="numeric"
            placeholder="e.g. 1200"
            aria-label="Approximate square feet"
            value={sqftText}
            onChange={(e) => {
              const t = e.target.value.replace(/[^0-9.]/g, '');
              setSqftText(t);
              setSqft(parseFloat(t) || 0);
            }}
          />
          <button type="button" className="text-sm underline" style={{ color }} onClick={() => setHelper((h) => !h)} data-testid="help-estimate">
            Help me estimate
          </button>
          {helper ? (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <label>
                  <span className="text-xs text-slate-500">Length ft</span>
                  <input className="input" inputMode="numeric" value={hL} onChange={(e) => setHL(parseFloat(e.target.value) || 0)} />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Width ft</span>
                  <input className="input" inputMode="numeric" value={hW} onChange={(e) => setHW(parseFloat(e.target.value) || 0)} />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Wall ht ft</span>
                  <input className="input" inputMode="numeric" value={hH} onChange={(e) => setHH(parseFloat(e.target.value) || 0)} />
                </label>
              </div>
              {(() => {
                const h = helperSqft(ptype, hL, hW, hH);
                return (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">
                      ≈ <b>{num(h.sqft)}</b> sq ft ({h.how})
                    </span>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => {
                        const v = Math.round(h.sqft);
                        setSqft(v);
                        setSqftText(String(v));
                        setHelper(false);
                      }}
                    >
                      Use this
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : null}
          <Btn onClick={() => setStep('foam')} disabled={sqft <= 0} testId="widget-next-sqft">
            Next
          </Btn>
          <Back to="type" />
        </div>
      ) : null}

      {step === 'foam' ? (
        <div className="space-y-2">
          <div className="font-semibold">3. Foam preference?</div>
          {(
            [
              ['oc', 'Open cell', 'Softer, great for sound and attics/walls'],
              ['cc', 'Closed cell', 'Rigid, higher R per inch, moisture barrier'],
              ['unsure', 'Not sure', 'Show me both'],
            ] as const
          ).map(([k, l, d]) => (
            <button
              key={k}
              type="button"
              data-testid={`wfoam-${k}`}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-left"
              onClick={() => {
                setFoam(k);
                setStep(config.gated ? 'contact' : 'range');
              }}
            >
              <div className="font-medium">{l}</div>
              <div className="text-xs text-slate-500">{d}</div>
            </button>
          ))}
          <Back to="sqft" />
        </div>
      ) : null}

      {step === 'contact' ? (
        <div className="space-y-2">
          <div className="font-semibold">4. Where should we send your range?</div>
          {contactForm}
          <Back to="foam" />
        </div>
      ) : null}

      {step === 'range' ? (
        <div className="space-y-3">
          {rangeBox}
          {submitted ? (
            <p className="text-center text-sm font-medium text-slate-700" data-testid="widget-thanks">
              Thanks! {branding.companyName} will reach out to schedule an exact quote.
            </p>
          ) : (
            <>
              <div className="font-semibold">Want an exact quote?</div>
              {contactForm}
            </>
          )}
          {!submitted ? <Back to="foam" /> : null}
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="space-y-3">
          {rangeBox}
          <p className="text-center text-sm font-medium text-slate-700" data-testid="widget-thanks">
            Thanks! {branding.companyName} will reach out to schedule an exact quote.
          </p>
        </div>
      ) : null}
      <div className="mt-4 text-center text-[10px] text-slate-400">Powered by Spray Foam Bid Builder (working name) · demo</div>
    </div>
  );
}
