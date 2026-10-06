import type { StorageAdapter } from './adapter';
import { LocalStorageAdapter } from './localStorageAdapter';

export type { StorageAdapter } from './adapter';

/** Swap point: return a SupabaseAdapter here once auth + Postgres are wired up. */
export const store: StorageAdapter = new LocalStorageAdapter();
