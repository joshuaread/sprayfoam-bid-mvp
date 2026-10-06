import { uid } from '../id';
import { store } from '../storage';
import type { EmailAdapter, EmailMessage, EmailResult } from './adapter';

export class StubEmailAdapter implements EmailAdapter {
  async send(msg: EmailMessage): Promise<EmailResult> {
    const id = uid('mail');
    await store.addOutbox({ id, createdAt: new Date().toISOString(), ...msg, status: 'stubbed', provider: 'stub' });
    return { status: 'stubbed', provider: 'stub', id };
  }
}
