'use client';

import { PITCH_OPTIONS, SHAPE_LABELS, computeAreaSqft, type Area, type AreaDims, type AreaResult, type Opening, type PriceBook } from '@/lib/engine';
import { num } from '@/lib/format';
import { uid } from '@/lib/id';
import { NumberInput } from './ui';

const OPENING_DEFAULTS: Record<Opening['kind'], Omit<Opening, 'kind'>> = {
  door: { count: 1, widthFt: 3, heightFt: 6.75 },
  window: { count: 1, widthFt: 3, heightFt: 4 },
  garage: { count: 1, widthFt: 16, heightFt: 7 },
  other: { count: 1, widthFt: 4, heightFt: 4 },
};

function Mini({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <NumberInput value={value} onChange={onChange} ariaLabel={label} className="!px-2" />
    </label>
  );
}

function OpeningsEditor({ openings, onChange }: { openings: Opening[]; onChange: (o: Opening[]) => void }) {
  const set = (i: number, patch: Partial<Opening>) => onChange(openings.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-2" data-testid="openings">
      <div className="mb-1 text-xs font-semibold text-slate-600">Openings (subtracted): count x W x H (ft)</div>
      {openings.map((o, i) => (
        <div key={i} className="mb-2 grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] items-end gap-1" data-testid="opening-row">
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500">Type</span>
            <select className="input !px-1" value={o.kind} aria-label="Opening type" onChange={(e) => set(i, { kind: e.target.value as Opening['kind'] })}>
              <option value="door">Door</option>
              <option value="window">Window</option>
              <option value="garage">Garage door</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Mini label="Count" value={o.count} onChange={(n) => set(i, { count: n })} />
          <Mini label="W ft" value={o.widthFt} onChange={(n) => set(i, { widthFt: n })} />
          <Mini label="H ft" value={o.heightFt} onChange={(n) => set(i, { heightFt: n })} />
          <button type="button" className="mb-1 px-2 text-lg text-slate-400 hover:text-red-600" aria-label="Remove opening" onClick={() => onChange(openings.filter((_, j) => j !== i))}>
            x
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-1">
        {(['door', 'window', 'garage'] as const).map((k) => (
          <button key={k} type="button" className="btn-secondary !px-2 !py-1 !text-xs" onClick={() => onChange([...openings, { kind: k, ...OPENING_DEFAULTS[k] }])}>
            + {k === 'garage' ? 'Garage door' : k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function PitchPicker({ rise, onChange }: { rise: number; onChange: (n: number) => void }) {
  const isCustom = !PITCH_OPTIONS.includes(rise);
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="block">
        <span className="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500">Pitch</span>
        <select
          className="input"
          aria-label="Pitch"
          value={isCustom ? 'custom' : String(rise)}
          onChange={(e) => (e.target.value === 'custom' ? onChange(rise === 0 ? 2.5 : rise + 0.5) : onChange(Number(e.target.value)))}
        >
          {PITCH_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}/12
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </label>
      {isCustom ? <Mini label="Custom rise /12" value={rise} onChange={onChange} /> : <div />}
    </div>
  );
}

export function DimsEditor({ dims, onChange }: { dims: AreaDims; onChange: (d: AreaDims) => void }) {
  switch (dims.shape) {
    case 'wall':
      return (
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-600">Perimeter segments: length x height (ft). Mix heights per segment.</div>
          {dims.segments.map((s, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2" data-testid="segment-row">
              <Mini label={`Seg ${i + 1} length`} value={s.lengthFt} onChange={(n) => onChange({ ...dims, segments: dims.segments.map((x, j) => (j === i ? { ...x, lengthFt: n } : x)) })} />
              <Mini label={`Seg ${i + 1} height`} value={s.heightFt} onChange={(n) => onChange({ ...dims, segments: dims.segments.map((x, j) => (j === i ? { ...x, heightFt: n } : x)) })} />
              <button type="button" className="mb-1 px-2 text-lg text-slate-400 hover:text-red-600" aria-label="Remove segment" onClick={() => onChange({ ...dims, segments: dims.segments.filter((_, j) => j !== i) })}>
                x
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary !px-2 !py-1 !text-xs" onClick={() => onChange({ ...dims, segments: [...dims.segments, { lengthFt: 10, heightFt: dims.segments.at(-1)?.heightFt ?? 8 }] })}>
            + Segment
          </button>
          <OpeningsEditor openings={dims.openings} onChange={(o) => onChange({ ...dims, openings: o })} />
        </div>
      );
    case 'gable':
      return (
        <div className="grid grid-cols-3 gap-2">
          <Mini label="Span ft" value={dims.spanFt} onChange={(n) => onChange({ ...dims, spanFt: n })} />
          <Mini label="Rise ft" value={dims.riseFt} onChange={(n) => onChange({ ...dims, riseFt: n })} />
          <Mini label="Qty" value={dims.qty} onChange={(n) => onChange({ ...dims, qty: n })} />
        </div>
      );
    case 'roof_pitch':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Mini label="Footprint length ft" value={dims.lengthFt} onChange={(n) => onChange({ ...dims, lengthFt: n })} />
            <Mini label="Footprint width ft" value={dims.widthFt} onChange={(n) => onChange({ ...dims, widthFt: n })} />
          </div>
          <PitchPicker rise={dims.pitchRise} onChange={(n) => onChange({ ...dims, pitchRise: n })} />
        </div>
      );
    case 'attic_floor':
      return (
        <div>
          {dims.rects.map((r, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Mini label={`Rect ${i + 1} L ft`} value={r.lengthFt} onChange={(n) => onChange({ ...dims, rects: dims.rects.map((x, j) => (j === i ? { ...x, lengthFt: n } : x)) })} />
              <Mini label={`Rect ${i + 1} W ft`} value={r.widthFt} onChange={(n) => onChange({ ...dims, rects: dims.rects.map((x, j) => (j === i ? { ...x, widthFt: n } : x)) })} />
              <button type="button" className="mb-1 px-2 text-lg text-slate-400 hover:text-red-600" aria-label="Remove rectangle" onClick={() => onChange({ ...dims, rects: dims.rects.filter((_, j) => j !== i) })}>
                x
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary !px-2 !py-1 !text-xs" onClick={() => onChange({ ...dims, rects: [...dims.rects, { lengthFt: 10, widthFt: 10 }] })}>
            + Rectangle
          </button>
        </div>
      );
    case 'quonset':
      return (
        <div>
          <div className="grid grid-cols-3 gap-2">
            <Mini label="Span (width) ft" value={dims.spanFt} onChange={(n) => onChange({ ...dims, spanFt: n })} />
            <Mini label="Length ft" value={dims.lengthFt} onChange={(n) => onChange({ ...dims, lengthFt: n })} />
            <Mini label="End walls (0-2)" value={dims.endWalls} onChange={(n) => onChange({ ...dims, endWalls: Math.min(2, Math.max(0, Math.round(n))) })} />
          </div>
          <OpeningsEditor openings={dims.openings} onChange={(o) => onChange({ ...dims, openings: o })} />
        </div>
      );
    case 'metal_building':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Mini label="Length ft" value={dims.lengthFt} onChange={(n) => onChange({ ...dims, lengthFt: n })} />
            <Mini label="Width ft" value={dims.widthFt} onChange={(n) => onChange({ ...dims, widthFt: n })} />
            <Mini label="Eave height ft" value={dims.eaveHeightFt} onChange={(n) => onChange({ ...dims, eaveHeightFt: n })} />
          </div>
          <PitchPicker rise={dims.pitchRise} onChange={(n) => onChange({ ...dims, pitchRise: n })} />
          <div className="flex flex-wrap gap-3 text-sm">
            {(
              [
                ['includeWalls', 'Walls'],
                ['includeGables', 'Gables'],
                ['includeRoof', 'Roof'],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex items-center gap-1">
                <input type="checkbox" checked={dims[k]} onChange={(e) => onChange({ ...dims, [k]: e.target.checked })} /> {l}
              </label>
            ))}
          </div>
          <OpeningsEditor openings={dims.openings} onChange={(o) => onChange({ ...dims, openings: o })} />
        </div>
      );
    case 'rim_joist':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Linear ft" value={dims.linearFt} onChange={(n) => onChange({ ...dims, linearFt: n })} />
          <div>
            <Mini label="Joist height in" value={dims.joistHeightIn} onChange={(n) => onChange({ ...dims, joistHeightIn: n })} />
            <div className="mt-1 flex gap-1">
              {[7.25, 9.25, 11.25].map((h) => (
                <button key={h} type="button" className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]" onClick={() => onChange({ ...dims, joistHeightIn: h })}>
                  {h}&quot;
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    case 'freeform':
      return <Mini label="Sq ft" value={dims.sqft} onChange={(n) => onChange({ ...dims, sqft: n })} />;
  }
}

export function AreaCard({
  area,
  result,
  priceBook,
  onChange,
  onRemove,
  onDuplicate,
  index,
}: {
  area: Area;
  result?: AreaResult;
  priceBook: PriceBook;
  onChange: (a: Area) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  index: number;
}) {
  const geo = computeAreaSqft(area.dims);
  const products = priceBook.products.filter((p) => p.active || area.layers.some((l) => l.productId === p.id));
  const suggestedR = area.layers.reduce((s, l) => {
    const p = priceBook.products.find((x) => x.id === l.productId);
    return s + (p?.rValuePerInch ?? 0) * (l.inches || 0);
  }, 0);
  return (
    <section className="card" data-testid="area-card" data-shape={area.dims.shape}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <input
            className="w-full border-b border-transparent bg-transparent text-lg font-semibold focus:border-teal-600 focus:outline-none"
            value={area.label}
            aria-label="Area name"
            onChange={(e) => onChange({ ...area, label: e.target.value })}
          />
          <div className="text-xs text-slate-500">
            #{index + 1} · {SHAPE_LABELS[area.dims.shape]}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="btn-secondary !px-2 !py-1 !text-xs" onClick={onDuplicate}>
            Copy
          </button>
          <button type="button" className="btn-danger !px-2 !py-1 !text-xs" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <DimsEditor dims={area.dims} onChange={(d) => onChange({ ...area, dims: d })} />

      <div className="mt-3 rounded-lg bg-teal-50 p-2 text-sm">
        <div className="font-semibold text-teal-900" data-testid="area-sqft">
          {num(geo.sqft, 1)} sq ft
          {result ? <span className="font-normal text-teal-800"> · {num(result.boardFeet, 0)} board ft</span> : null}
        </div>
        <div className="break-words font-mono text-[11px] text-teal-900/80">{geo.formula}</div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-xs font-semibold text-slate-600">Foam layers (product + inches)</div>
        {area.layers.map((l, i) => {
          const p = priceBook.products.find((x) => x.id === l.productId);
          const isCoating = p?.kind === 'coating' || p?.kind === 'primer';
          const lr = result?.layers.find((x) => x.layerId === l.id);
          return (
            <div key={l.id} className="mb-2 rounded-lg border border-slate-200 p-2" data-testid="layer-row">
              <div className="grid grid-cols-[1fr_5.5rem_auto] items-end gap-2">
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500">Layer {i + 1} product</span>
                  <select
                    className="input !px-1"
                    aria-label={`Layer ${i + 1} product`}
                    value={l.productId}
                    onChange={(e) => onChange({ ...area, layers: area.layers.map((x) => (x.id === l.id ? { ...x, productId: e.target.value } : x)) })}
                  >
                    {!p ? <option value={l.productId}>Missing product</option> : null}
                    {products.map((pp) => (
                      <option key={pp.id} value={pp.id}>
                        {pp.name}
                      </option>
                    ))}
                  </select>
                </label>
                {isCoating ? (
                  <Mini label="Coats" value={l.coats ?? 1} onChange={(n) => onChange({ ...area, layers: area.layers.map((x) => (x.id === l.id ? { ...x, coats: n } : x)) })} />
                ) : (
                  <Mini label={`Layer ${i + 1} inches`} value={l.inches} onChange={(n) => onChange({ ...area, layers: area.layers.map((x) => (x.id === l.id ? { ...x, inches: n } : x)) })} />
                )}
                <button type="button" className="mb-1 px-2 text-lg text-slate-400 hover:text-red-600" aria-label="Remove layer" onClick={() => onChange({ ...area, layers: area.layers.filter((x) => x.id !== l.id) })}>
                  x
                </button>
              </div>
              {lr ? (
                <div className="mt-1 text-[11px] text-slate-600">
                  {isCoating ? `Coating cost $${num(lr.coatingCost, 2)}` : `${num(lr.boardFeet, 0)} bf · ${num(lr.sets, 3)} sets · material $${num(lr.materialCost, 2)}`}
                  {lr.ladderNote ? ` · ${lr.ladderNote}` : ''}
                </div>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          className="btn-secondary !px-2 !py-1 !text-xs"
          data-testid="add-layer"
          onClick={() =>
            onChange({
              ...area,
              layers: [...area.layers, { id: uid('layer'), productId: priceBook.products.find((p) => p.active)?.id ?? '', inches: 1, coats: 1 }],
            })
          }
        >
          + Add layer
        </button>
      </div>
      <label className="mt-3 block">
        <span className="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500">R-value text for proposal (optional, you enter it)</span>
        <input
          className="input"
          value={area.rValueText ?? ''}
          placeholder={suggestedR > 0 ? `e.g. approx. R-${Math.round(suggestedR)} (verify with product data sheet)` : 'e.g. R-21'}
          onChange={(e) => onChange({ ...area, rValueText: e.target.value })}
        />
      </label>
    </section>
  );
}
