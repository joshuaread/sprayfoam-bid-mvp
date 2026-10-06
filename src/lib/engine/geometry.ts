import type { AreaDims, AreaGeometry, Opening } from './types';

/** Round for display inside formula strings. */
export function fmt(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return String(r);
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pos = (v: unknown): number => Math.max(0, num(v));

/** Roof pitch factor: sqrt(1 + (rise/12)^2) */
export function pitchFactor(rise: number): number {
  const r = pos(rise);
  return Math.sqrt(1 + (r / 12) ** 2);
}

export const PITCH_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function openingsArea(openings: Opening[] | undefined): { sqft: number; parts: string[] } {
  let sqft = 0;
  const parts: string[] = [];
  for (const o of openings ?? []) {
    const a = pos(o.count) * pos(o.widthFt) * pos(o.heightFt);
    if (a <= 0) continue;
    sqft += a;
    parts.push(`${o.kind} ${fmt(pos(o.count))} x ${fmt(pos(o.widthFt))} x ${fmt(pos(o.heightFt))} = ${fmt(a)}`);
  }
  return { sqft, parts };
}

export function computeAreaSqft(dims: AreaDims): AreaGeometry {
  switch (dims.shape) {
    case 'wall': {
      const parts: string[] = [];
      let gross = 0;
      for (const s of dims.segments ?? []) {
        const a = pos(s.lengthFt) * pos(s.heightFt);
        gross += a;
        parts.push(`segment ${fmt(pos(s.lengthFt))} x ${fmt(pos(s.heightFt))} = ${fmt(a)}`);
      }
      const op = openingsArea(dims.openings);
      parts.push(...op.parts.map((p) => `minus ${p}`));
      const sqft = Math.max(0, gross - op.sqft);
      return {
        sqft,
        formula: `sum(L x H) - sum(count x W x H) = ${fmt(gross)} - ${fmt(op.sqft)} = ${fmt(sqft)} sq ft`,
        parts,
      };
    }
    case 'gable': {
      const sqft = 0.5 * pos(dims.spanFt) * pos(dims.riseFt) * pos(dims.qty);
      return {
        sqft,
        formula: `1/2 x span x rise x qty = 0.5 x ${fmt(pos(dims.spanFt))} x ${fmt(pos(dims.riseFt))} x ${fmt(pos(dims.qty))} = ${fmt(sqft)} sq ft`,
        parts: [],
      };
    }
    case 'roof_pitch': {
      const footprint = pos(dims.lengthFt) * pos(dims.widthFt);
      const f = pitchFactor(dims.pitchRise);
      const sqft = footprint * f;
      return {
        sqft,
        formula: `footprint x sqrt(1 + (rise/12)^2) = (${fmt(pos(dims.lengthFt))} x ${fmt(pos(dims.widthFt))}) x ${fmt(f, 4)} [${fmt(pos(dims.pitchRise))}/12] = ${fmt(sqft)} sq ft`,
        parts: [`footprint = ${fmt(footprint)} sq ft`, `pitch factor = ${fmt(f, 4)}`],
      };
    }
    case 'attic_floor': {
      const parts: string[] = [];
      let sqft = 0;
      for (const r of dims.rects ?? []) {
        const a = pos(r.lengthFt) * pos(r.widthFt);
        sqft += a;
        parts.push(`rect ${fmt(pos(r.lengthFt))} x ${fmt(pos(r.widthFt))} = ${fmt(a)}`);
      }
      return { sqft, formula: `sum(L x W) = ${fmt(sqft)} sq ft`, parts };
    }
    case 'quonset': {
      const r = pos(dims.spanFt) / 2;
      const arch = Math.PI * r * pos(dims.lengthFt);
      const endEach = (Math.PI * r * r) / 2;
      const ends = endEach * pos(dims.endWalls);
      const op = openingsArea(dims.openings);
      const sqft = Math.max(0, arch + ends - op.sqft);
      return {
        sqft,
        formula: `pi x r x L + endWalls x (pi x r^2 / 2) - openings = ${fmt(arch)} + ${fmt(ends)} - ${fmt(op.sqft)} = ${fmt(sqft)} sq ft (r = span/2 = ${fmt(r)})`,
        parts: [
          `arch = pi x ${fmt(r)} x ${fmt(pos(dims.lengthFt))} = ${fmt(arch)}`,
          `end walls = ${fmt(pos(dims.endWalls))} x ${fmt(endEach)} = ${fmt(ends)}`,
          ...op.parts.map((p) => `minus ${p}`),
        ],
      };
    }
    case 'metal_building': {
      const L = pos(dims.lengthFt);
      const W = pos(dims.widthFt);
      const H = pos(dims.eaveHeightFt);
      const rise = pos(dims.pitchRise);
      const walls = dims.includeWalls ? 2 * (L + W) * H : 0;
      const gableRise = (W / 2) * (rise / 12);
      const gables = dims.includeGables ? 2 * 0.5 * W * gableRise : 0;
      const f = pitchFactor(rise);
      const roof = dims.includeRoof ? L * W * f : 0;
      const op = openingsArea(dims.openings);
      const sqft = Math.max(0, walls + gables + roof - op.sqft);
      return {
        sqft,
        formula: `walls 2(L+W)xH + gables 2 x 1/2 x W x rise + roof LxW x pitch - openings = ${fmt(walls)} + ${fmt(gables)} + ${fmt(roof)} - ${fmt(op.sqft)} = ${fmt(sqft)} sq ft`,
        parts: [
          `walls = 2 x (${fmt(L)} + ${fmt(W)}) x ${fmt(H)} = ${fmt(walls)}${dims.includeWalls ? '' : ' (excluded)'}`,
          `gables = 2 x 0.5 x ${fmt(W)} x ${fmt(gableRise)} = ${fmt(gables)}${dims.includeGables ? '' : ' (excluded)'}`,
          `roof = ${fmt(L)} x ${fmt(W)} x ${fmt(f, 4)} [${fmt(rise)}/12] = ${fmt(roof)}${dims.includeRoof ? '' : ' (excluded)'}`,
          ...op.parts.map((p) => `minus ${p}`),
        ],
      };
    }
    case 'rim_joist': {
      const sqft = pos(dims.linearFt) * (pos(dims.joistHeightIn) / 12);
      return {
        sqft,
        formula: `linear ft x joist height = ${fmt(pos(dims.linearFt))} x (${fmt(pos(dims.joistHeightIn))}/12) = ${fmt(sqft)} sq ft`,
        parts: [],
      };
    }
    case 'freeform': {
      const sqft = pos(dims.sqft);
      return { sqft, formula: `entered = ${fmt(sqft)} sq ft`, parts: [] };
    }
    default: {
      return { sqft: 0, formula: 'unknown shape', parts: [] };
    }
  }
}

export const SHAPE_LABELS: Record<AreaDims['shape'], string> = {
  wall: 'Walls minus openings',
  gable: 'Gable ends',
  roof_pitch: 'Roof deck by pitch',
  attic_floor: 'Attic floor / flat',
  quonset: 'Quonset / arch',
  metal_building: 'Metal building',
  rim_joist: 'Rim joist',
  freeform: 'Freeform sq ft',
};
