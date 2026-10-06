// Pure data types for the calc engine. No React or browser imports allowed in src/lib/engine.

export type ProductKind = 'open_cell' | 'closed_cell' | 'coating' | 'primer' | 'other';

export interface Product {
  id: string;
  name: string;
  kind: ProductKind;
  /** $ per set (foam) */
  setPrice: number;
  /** gallons per set (informational for foam) */
  setSizeGal: number;
  /** manufacturer rated (theoretical) yield, board feet per set */
  ratedYieldBfPerSet: number;
  /** e.g. 0.85 = crew gets 85% of rated yield in the field */
  fieldYieldFactor: number;
  /** waste percent, e.g. 10 = 10% */
  wastePct: number;
  /** optional R-value per inch, used only for suggested R-value text */
  rValuePerInch?: number;
  /** coatings/primers: how they are priced */
  coatingPricing?: 'per_sqft' | 'per_gal';
  /** coatings/primers: $ per sq ft per coat */
  pricePerSqft?: number;
  /** coatings/primers: $ per gallon */
  pricePerGal?: number;
  /** coatings/primers: coverage, sq ft per gallon per coat */
  coverageSqftPerGal?: number;
  active: boolean;
}

export interface LaborSettings {
  crewSize: number;
  hourlyRate: number;
  mode: 'production' | 'flat';
  /** rig production rate in board feet per hour (production mode) */
  prodRateBfPerHr: number;
  /** flat labor $ per board foot (flat mode) */
  laborPerBf: number;
}

export interface JobCharges {
  tripCharge: number;
  mileageRate: number;
  minJob: number;
}

export type LadderKind = 'open_cell' | 'closed_cell' | 'other';

export interface LadderRow {
  kind: LadderKind;
  thicknessIn: number;
  pricePerSqft: number;
}

export type PricingMode = 'margin' | 'ladder';

export interface PriceBook {
  products: Product[];
  labor: LaborSettings;
  charges: JobCharges;
  pricingMode: PricingMode;
  /** target gross margin percent, e.g. 40 = 40% */
  targetMarginPct: number;
  ladder: LadderRow[];
  /** label shown in UI; seeded books are clearly marked as sample numbers */
  label?: string;
}

// ---------- Areas ----------

export type OpeningKind = 'door' | 'window' | 'garage' | 'other';

export interface Opening {
  kind: OpeningKind;
  count: number;
  widthFt: number;
  heightFt: number;
}

export interface WallSegment {
  lengthFt: number;
  heightFt: number;
}

export interface Rect {
  lengthFt: number;
  widthFt: number;
}

export type AreaDims =
  | { shape: 'wall'; segments: WallSegment[]; openings: Opening[] }
  | { shape: 'gable'; spanFt: number; riseFt: number; qty: number }
  | { shape: 'roof_pitch'; lengthFt: number; widthFt: number; pitchRise: number }
  | { shape: 'attic_floor'; rects: Rect[] }
  | { shape: 'quonset'; spanFt: number; lengthFt: number; endWalls: number; openings: Opening[] }
  | {
      shape: 'metal_building';
      lengthFt: number;
      widthFt: number;
      eaveHeightFt: number;
      pitchRise: number;
      includeWalls: boolean;
      includeGables: boolean;
      includeRoof: boolean;
      openings: Opening[];
    }
  | { shape: 'rim_joist'; linearFt: number; joistHeightIn: number }
  | { shape: 'freeform'; sqft: number };

export type Shape = AreaDims['shape'];

export interface Layer {
  id: string;
  productId: string;
  /** foam thickness in inches (ignored for coatings/primers) */
  inches: number;
  /** coats (coatings/primers only) */
  coats?: number;
}

export interface Area {
  id: string;
  label: string;
  dims: AreaDims;
  layers: Layer[];
  /** optional R-value text the contractor enters themselves */
  rValueText?: string;
}

export interface EstimateInput {
  areas: Area[];
  priceBook: PriceBook;
  /** per-estimate overrides */
  pricingMode?: PricingMode;
  marginPct?: number;
  miles?: number;
}

// ---------- Results ----------

export interface AreaGeometry {
  sqft: number;
  /** human-readable ASCII formula with inputs substituted */
  formula: string;
  /** breakdown lines, ASCII */
  parts: string[];
}

export interface LayerResult {
  layerId: string;
  productId: string;
  productName: string;
  kind: ProductKind | 'missing';
  inches: number;
  coats: number;
  sqft: number;
  boardFeet: number;
  sets: number;
  materialCost: number;
  coatingCost: number;
  laborHours: number;
  laborCost: number;
  /** ladder price for this layer (ladder mode only, foam only) */
  ladderPrice?: number;
  ladderNote?: string;
  setsFormula: string;
}

export interface AreaResult {
  areaId: string;
  label: string;
  shape: Shape;
  sqft: number;
  formula: string;
  parts: string[];
  boardFeet: number;
  layers: LayerResult[];
}

export interface ProductSets {
  productId: string;
  productName: string;
  boardFeet: number;
  sets: number;
  setsRounded: number;
  materialCost: number;
}

export interface EstimateTotals {
  engine_version: string;
  pricingMode: PricingMode;
  marginPctTarget: number;
  sqft: number;
  boardFeet: number;
  sets: number;
  setsRounded: number;
  setsByProduct: ProductSets[];
  materialCost: number;
  laborHours: number;
  laborCost: number;
  tripCost: number;
  coatingCost: number;
  totalCost: number;
  calculatedPrice: number;
  price: number;
  minJob: number;
  minJobApplied: boolean;
  minJobNote?: string;
  marginAmt: number;
  marginPct: number;
  pricePerSqft: number;
  areas: AreaResult[];
  warnings: string[];
}
