import { SAMPLE_PRICE_BOOK, type PriceBook } from '../engine';
import { DEFAULT_BRANDING, DEFAULT_WIDGET, type Branding, type Customer, type Estimate, type Lead, type OutboxEmail, type WidgetConfig } from '../models';
import type { StorageAdapter } from './adapter';

const PREFIX = 'sfbb:v1:';
export const K = {
  priceBook: PREFIX + 'priceBook',
  branding: PREFIX + 'branding',
  widget: PREFIX + 'widget',
  estimates: PREFIX + 'estimates',
  customers: PREFIX + 'customers',
  leads: PREFIX + 'leads',
  outbox: PREFIX + 'outbox',
  counter: PREFIX + 'estimateCounter',
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return clone(fallback);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return clone(fallback);
    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function upsert<T extends { id: string }>(key: string, item: T): void {
  const list = read<T[]>(key, []);
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = item;
  else list.unshift(item);
  write(key, list);
}

export class LocalStorageAdapter implements StorageAdapter {
  async getPriceBook() {
    return read<PriceBook>(K.priceBook, SAMPLE_PRICE_BOOK);
  }
  async savePriceBook(pb: PriceBook) {
    write(K.priceBook, pb);
  }
  async getBranding() {
    return { ...DEFAULT_BRANDING, ...read<Partial<Branding>>(K.branding, {}) };
  }
  async saveBranding(b: Branding) {
    write(K.branding, b);
  }
  async getWidgetConfig() {
    return { ...DEFAULT_WIDGET, ...read<Partial<WidgetConfig>>(K.widget, {}) };
  }
  async saveWidgetConfig(w: WidgetConfig) {
    write(K.widget, w);
  }
  async listEstimates() {
    return read<Estimate[]>(K.estimates, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async getEstimate(id: string) {
    return read<Estimate[]>(K.estimates, []).find((e) => e.id === id) ?? null;
  }
  async saveEstimate(e: Estimate) {
    upsert(K.estimates, e);
  }
  async deleteEstimate(id: string) {
    write(K.estimates, read<Estimate[]>(K.estimates, []).filter((e) => e.id !== id));
  }
  async nextEstimateNumber() {
    const n = read<number>(K.counter, 1000) + 1;
    write(K.counter, n);
    return n;
  }
  async listCustomers() {
    return read<Customer[]>(K.customers, []).sort((a, b) => a.name.localeCompare(b.name));
  }
  async getCustomer(id: string) {
    return read<Customer[]>(K.customers, []).find((c) => c.id === id) ?? null;
  }
  async saveCustomer(c: Customer) {
    upsert(K.customers, c);
  }
  async deleteCustomer(id: string) {
    write(K.customers, read<Customer[]>(K.customers, []).filter((c) => c.id !== id));
  }
  async listLeads() {
    return read<Lead[]>(K.leads, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async saveLead(l: Lead) {
    upsert(K.leads, l);
  }
  async listOutbox() {
    return read<OutboxEmail[]>(K.outbox, []);
  }
  async addOutbox(m: OutboxEmail) {
    upsert(K.outbox, m);
  }
  async resetAll() {
    if (typeof window === 'undefined') return;
    Object.values(K).forEach((k) => window.localStorage.removeItem(k));
  }
}
