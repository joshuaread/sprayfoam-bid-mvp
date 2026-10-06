import type { Area, EstimateTotals, PriceBook, PricingMode } from './engine';

export const APP_NAME = 'Spray Foam Bid Builder';
export const APP_NAME_FULL = 'Spray Foam Bid Builder (working name)';
export const SITE_URL = 'https://joshuaread.github.io/sprayfoam-bid-mvp';
export const DISCLAIMER =
  'Planning aid only. Contractor verifies measurements, product data sheets, code requirements, and final price.';

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'lost';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  source: 'manual' | 'widget';
  notes: string;
  createdAt: string;
}

export interface Estimate {
  id: string;
  number: number;
  version: number;
  status: EstimateStatus;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  jobAddress: string;
  pricingMode: PricingMode;
  marginPct: number;
  miles: number;
  validUntil: string;
  notes: string;
  areas: Area[];
  /** price book copied onto the estimate at creation; later price-book edits don't change it */
  priceBookSnapshot: PriceBook;
  snapshotAt: string;
  totals: EstimateTotals | null;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branding {
  companyName: string;
  logoDataUrl: string;
  brandColor: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  licenseNo: string;
  terms: string;
  validityDays: number;
}

export interface WidgetProjectType {
  key: string;
  label: string;
  enabled: boolean;
  ocInches: number;
  ccInches: number;
}

export interface WidgetConfig {
  widgetKey: string;
  headline: string;
  projectTypes: WidgetProjectType[];
  bandPct: number;
  gated: boolean;
  primaryColor: string;
  textColor: string;
  consentText: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  widgetKey: string;
  projectType: string;
  projectLabel: string;
  sqft: number;
  foamPref: 'oc' | 'cc' | 'unsure';
  quotedLow: number;
  quotedHigh: number;
  name: string;
  phone: string;
  email: string;
  zip: string;
  consent: boolean;
  consentText: string;
  consentAt: string;
  status: 'new' | 'contacted' | 'estimated' | 'won' | 'lost';
  emailStatus: 'stubbed' | 'sent' | 'failed';
  emailTo: string;
  estimateId?: string;
  customerId?: string;
  preview?: boolean;
}

export interface OutboxEmail {
  id: string;
  createdAt: string;
  to: string;
  subject: string;
  body: string;
  status: 'stubbed';
  provider: string;
}

export const DEFAULT_BRANDING: Branding = {
  companyName: 'Sample Insulation Co. (demo)',
  logoDataUrl: '',
  brandColor: '#0f766e',
  phone: '(555) 010-0000',
  email: 'office@example.com',
  address: '123 Example Rd, Anytown, USA',
  website: 'example.com',
  licenseNo: 'DEMO-0000',
  terms:
    '50% deposit to schedule, balance due on completion. Price assumes clear access to all work areas. Changes to scope will be quoted separately.',
  validityDays: 30,
};

export const DEFAULT_WIDGET: WidgetConfig = {
  widgetKey: 'demo-widget-key',
  headline: 'Get an instant spray foam price range',
  projectTypes: [
    { key: 'attic', label: 'Attic', enabled: true, ocInches: 5.5, ccInches: 3 },
    { key: 'walls', label: 'Walls / new build', enabled: true, ocInches: 3.5, ccInches: 2 },
    { key: 'crawlspace', label: 'Crawlspace', enabled: true, ocInches: 3.5, ccInches: 2 },
    { key: 'pole_barn', label: 'Pole barn / metal building', enabled: true, ocInches: 3.5, ccInches: 2 },
    { key: 'rim_joist', label: 'Rim joist', enabled: true, ocInches: 3.5, ccInches: 2 },
    { key: 'other', label: 'Other', enabled: true, ocInches: 3.5, ccInches: 2 },
  ],
  bandPct: 15,
  gated: false,
  primaryColor: '#0f766e',
  textColor: '#ffffff',
  consentText: 'I agree to be contacted about my project by phone or email.',
};
