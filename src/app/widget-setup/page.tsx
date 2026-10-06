'use client';

import { useEffect, useMemo, useState } from 'react';
import { Field, NumField, PageTitle, TextField } from '@/components/ui';
import { BASE_PATH } from '@/lib/format';
import { DEFAULT_WIDGET, SITE_URL, type WidgetConfig } from '@/lib/models';
import { store } from '@/lib/storage';

export default function WidgetSetupPage() {
  const [cfg, setCfg] = useState<WidgetConfig | null>(null);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    store.getWidgetConfig().then(setCfg);
  }, []);
  const snippet = useMemo(
    () => `<div id="spray-foam-quote"></div>\n<script src="${SITE_URL}/widget.js" data-widget-key="${cfg?.widgetKey ?? ''}" data-target="#spray-foam-quote"></script>`,
    [cfg?.widgetKey],
  );
  if (!cfg) return <p>Loading…</p>;
  const save = (next: WidgetConfig) => {
    setCfg(next);
    void store.saveWidgetConfig(next);
  };
  return (
    <div className="space-y-4">
      <PageTitle title="Widget setup" subtitle="Homeowner instant-quote widget. It prices from your price book." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="card space-y-3">
            <TextField label="Headline" value={cfg.headline} onChange={(v) => save({ ...cfg, headline: v })} />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Range band +/- %" value={cfg.bandPct} onChange={(n) => save({ ...cfg, bandPct: n })} />
              <Field label="Mode">
                <select className="input" aria-label="Gated mode" value={cfg.gated ? 'gated' : 'ungated'} onChange={(e) => save({ ...cfg, gated: e.target.value === 'gated' })}>
                  <option value="ungated">Ungated: show range first</option>
                  <option value="gated">Gated: contact form first</option>
                </select>
              </Field>
              <Field label="Button color">
                <input type="color" className="h-10 w-20 rounded border border-slate-300" value={cfg.primaryColor} onChange={(e) => save({ ...cfg, primaryColor: e.target.value })} />
              </Field>
              <Field label="Button text color">
                <input type="color" className="h-10 w-20 rounded border border-slate-300" value={cfg.textColor} onChange={(e) => save({ ...cfg, textColor: e.target.value })} />
              </Field>
            </div>
            <TextField label="Consent text" value={cfg.consentText} onChange={(v) => save({ ...cfg, consentText: v })} />
            <p className="text-xs text-slate-500">Min job comes from the price book and is always applied to the range.</p>
          </section>
          <section className="card">
            <h2 className="mb-2 font-semibold">Project types &amp; assumed thickness</h2>
            <div className="space-y-2">
              {cfg.projectTypes.map((p, i) => (
                <div key={p.key} className="grid grid-cols-[auto_1.5fr_1fr_1fr] items-end gap-2">
                  <input
                    type="checkbox"
                    className="mb-3"
                    aria-label={`Enable ${p.label}`}
                    checked={p.enabled}
                    onChange={(e) => save({ ...cfg, projectTypes: cfg.projectTypes.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)) })}
                  />
                  <TextField label="Label" value={p.label} onChange={(v) => save({ ...cfg, projectTypes: cfg.projectTypes.map((x, j) => (j === i ? { ...x, label: v } : x)) })} />
                  <NumField label='OC in' value={p.ocInches} onChange={(n) => save({ ...cfg, projectTypes: cfg.projectTypes.map((x, j) => (j === i ? { ...x, ocInches: n } : x)) })} />
                  <NumField label='CC in' value={p.ccInches} onChange={(n) => save({ ...cfg, projectTypes: cfg.projectTypes.map((x, j) => (j === i ? { ...x, ccInches: n } : x)) })} />
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary mt-3 !py-1 text-xs" onClick={() => save({ ...DEFAULT_WIDGET, widgetKey: cfg.widgetKey })}>
              Reset widget defaults
            </button>
          </section>
          <section className="card space-y-2">
            <h2 className="font-semibold">Embed snippet</h2>
            <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-teal-100" data-testid="snippet">
              {snippet}
            </pre>
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(snippet);
                  setCopied('Copied!');
                } catch {
                  setCopied('Copy failed. Select the text above.');
                }
                setTimeout(() => setCopied(''), 1500);
              }}
            >
              Copy snippet
            </button>
            <span className="ml-2 text-sm text-teal-700">{copied}</span>
            <p className="text-xs text-slate-500">
              Demo limitation: the widget reads this browser&apos;s price book and saves leads to this browser, so it works end-to-end on the same-origin{' '}
              <a className="underline" href={`${BASE_PATH}/demo-site/`}>
                demo site
              </a>
              . On a real contractor site it needs the server-side quote API and lead storage (stubbed), plus allowed-domain checks and rate limits.
            </p>
          </section>
        </div>
        <section className="card">
          <h2 className="mb-2 font-semibold">Live preview</h2>
          <iframe
            title="Widget preview"
            className="h-[640px] w-full rounded border border-slate-200"
            src={`${BASE_PATH}/embed/?preview=1`}
          />
        </section>
      </div>
    </div>
  );
}
