import type { PriceBook } from '../engine';
import type { Branding, Customer, Estimate, Lead, OutboxEmail, WidgetConfig } from '../models';

/**
 * Storage seam. The demo uses LocalStorageAdapter (this browser only).
 * A SupabaseAdapter (Postgres + RLS per org) can implement the same interface later.
 */
export interface StorageAdapter {
  getPriceBook(): Promise<PriceBook>;
  savePriceBook(pb: PriceBook): Promise<void>;
  getBranding(): Promise<Branding>;
  saveBranding(b: Branding): Promise<void>;
  getWidgetConfig(): Promise<WidgetConfig>;
  saveWidgetConfig(w: WidgetConfig): Promise<void>;

  listEstimates(): Promise<Estimate[]>;
  getEstimate(id: string): Promise<Estimate | null>;
  saveEstimate(e: Estimate): Promise<void>;
  deleteEstimate(id: string): Promise<void>;
  nextEstimateNumber(): Promise<number>;

  listCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  saveCustomer(c: Customer): Promise<void>;
  deleteCustomer(id: string): Promise<void>;

  listLeads(): Promise<Lead[]>;
  saveLead(l: Lead): Promise<void>;

  listOutbox(): Promise<OutboxEmail[]>;
  addOutbox(m: OutboxEmail): Promise<void>;

  resetAll(): Promise<void>;
}
