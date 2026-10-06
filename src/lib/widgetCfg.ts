import type { WidgetConfig } from './models';

export function encodeCfg(cfg: WidgetConfig): string {
  const json = JSON.stringify(cfg);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCfg(s: string | null): WidgetConfig | null {
  if (!s) return null;
  try {
    let b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return JSON.parse(decodeURIComponent(escape(atob(b)))) as WidgetConfig;
  } catch {
    return null;
  }
}
