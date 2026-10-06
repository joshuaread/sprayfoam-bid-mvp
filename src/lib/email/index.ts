import type { EmailAdapter } from './adapter';
import { StubEmailAdapter } from './stubEmailAdapter';

export type { EmailAdapter, EmailMessage, EmailResult } from './adapter';

/** Swap point: ResendEmailAdapter (server-side) later. */
export const email: EmailAdapter = new StubEmailAdapter();
