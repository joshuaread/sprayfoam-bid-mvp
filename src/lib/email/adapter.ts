export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailResult {
  status: 'stubbed' | 'sent' | 'failed';
  provider: string;
  id: string;
}

/**
 * Email seam. Demo uses StubEmailAdapter, which records "would email" entries in the local outbox.
 * A ResendEmailAdapter must run server-side (API key) and implement the same interface later.
 */
export interface EmailAdapter {
  send(msg: EmailMessage): Promise<EmailResult>;
}
