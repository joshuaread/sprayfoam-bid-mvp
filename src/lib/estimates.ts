import { computeEstimate, type Area, type AreaDims, type PriceBook, type Shape } from './engine';
import { uid } from './id';
import { addDays } from './format';
import type { Branding, Estimate, Lead, WidgetConfig } from './models';
import { store } from './storage';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function defaultDims(shape: Shape): AreaDims {
  switch (shape) {
    case 'wall':
      return {
        shape,
        segments: [
          { lengthFt: 40, heightFt: 8 },
          { lengthFt: 30, heightFt: 9 },
        ],
        openings: [
          { kind: 'door', count: 1, widthFt: 3, heightFt: 6.75 },
          { kind: 'window', count: 4, widthFt: 3, heightFt: 4 },
        ],
      };
    case 'gable':
      return { shape, spanFt: 28, riseFt: 7, qty: 2 };
    case 'roof_pitch':
      return { shape, lengthFt: 40, widthFt: 28, pitchRise: 6 };
    case 'attic_floor':
      return { shape, rects: [{ lengthFt: 40, widthFt: 28 }] };
    case 'quonset':
      return { shape, spanFt: 40, lengthFt: 60, endWalls: 2, openings: [{ kind: 'garage', count: 1, widthFt: 12, heightFt: 12 }] };
    case 'metal_building':
      return {
        shape,
        lengthFt: 60,
        widthFt: 40,
        eaveHeightFt: 14,
        pitchRise: 1,
        includeWalls: true,
        includeGables: true,
        includeRoof: true,
        openings: [{ kind: 'garage', count: 2, widthFt: 12, heightFt: 12 }],
      };
    case 'rim_joist':
      return { shape, linearFt: 136, joistHeightIn: 9.25 };
    case 'freeform':
      return { shape, sqft: 500 };
  }
}

export function defaultProductId(pb: PriceBook, shape: Shape): string {
  const preferCC = shape === 'rim_joist' || shape === 'metal_building' || shape === 'quonset';
  const kind = preferCC ? 'closed_cell' : 'open_cell';
  return (pb.products.find((p) => p.active && p.kind === kind) ?? pb.products.find((p) => p.active) ?? pb.products[0])?.id ?? '';
}

export function newArea(pb: PriceBook, shape: Shape, label: string): Area {
  const productId = defaultProductId(pb, shape);
  const product = pb.products.find((p) => p.id === productId);
  return {
    id: uid('area'),
    label,
    dims: defaultDims(shape),
    layers: [{ id: uid('layer'), productId, inches: product?.kind === 'closed_cell' ? 2 : 5.5, coats: 1 }],
    rValueText: '',
  };
}

export function recompute(e: Estimate): Estimate {
  return {
    ...e,
    totals: computeEstimate({
      areas: e.areas,
      priceBook: e.priceBookSnapshot,
      pricingMode: e.pricingMode,
      marginPct: e.marginPct,
      miles: e.miles,
    }),
  };
}

export async function createEstimate(partial: Partial<Estimate> = {}): Promise<Estimate> {
  const pb = await store.getPriceBook();
  const branding: Branding = await store.getBranding();
  const now = new Date();
  const e: Estimate = {
    id: uid('est'),
    number: await store.nextEstimateNumber(),
    version: 1,
    status: 'draft',
    customerId: null,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    jobAddress: '',
    pricingMode: pb.pricingMode,
    marginPct: pb.targetMarginPct,
    miles: 0,
    validUntil: addDays(now, branding.validityDays || 30),
    notes: '',
    areas: [],
    priceBookSnapshot: clone(pb),
    snapshotAt: now.toISOString(),
    totals: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...partial,
  };
  const out = recompute(e);
  await store.saveEstimate(out);
  return out;
}

export async function duplicateEstimate(src: Estimate, asNewVersion = false): Promise<Estimate> {
  const now = new Date().toISOString();
  const copy: Estimate = {
    ...clone(src),
    id: uid('est'),
    number: asNewVersion ? src.number : await store.nextEstimateNumber(),
    version: asNewVersion ? src.version + 1 : 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  copy.areas = copy.areas.map((a) => ({ ...a, id: uid('area'), layers: a.layers.map((l) => ({ ...l, id: uid('layer') })) }));
  const out = recompute(copy);
  await store.saveEstimate(out);
  return out;
}

export async function convertLeadToEstimate(lead: Lead, widget: WidgetConfig): Promise<Estimate> {
  const pb = await store.getPriceBook();
  const customerId = lead.customerId ?? uid('cust');
  if (!lead.customerId) {
    await store.saveCustomer({
      id: customerId,
      name: lead.name || 'Widget lead',
      phone: lead.phone,
      email: lead.email,
      address: lead.zip ? `ZIP ${lead.zip}` : '',
      source: 'widget',
      notes: `From widget: ${lead.projectLabel}, ~${lead.sqft} sq ft, range $${lead.quotedLow}-$${lead.quotedHigh}`,
      createdAt: new Date().toISOString(),
    });
  }
  const pt = widget.projectTypes.find((p) => p.key === lead.projectType);
  const kind = lead.foamPref === 'cc' ? 'closed_cell' : 'open_cell';
  const product = pb.products.find((p) => p.active && p.kind === kind) ?? pb.products[0];
  const inches = kind === 'closed_cell' ? pt?.ccInches ?? 2 : pt?.ocInches ?? 3.5;
  const est = await createEstimate({
    customerId,
    customerName: lead.name,
    customerPhone: lead.phone,
    customerEmail: lead.email,
    jobAddress: lead.zip ? `ZIP ${lead.zip}` : '',
    leadId: lead.id,
    notes: `Converted from widget lead (${lead.projectLabel}). Homeowner estimate ~${lead.sqft} sq ft; measure on site.`,
    areas: [
      {
        id: uid('area'),
        label: `${lead.projectLabel} (homeowner estimate)`,
        dims: { shape: 'freeform', sqft: lead.sqft },
        layers: [{ id: uid('layer'), productId: product?.id ?? '', inches, coats: 1 }],
      },
    ],
  });
  await store.saveLead({ ...lead, status: 'estimated', estimateId: est.id, customerId });
  return est;
}
