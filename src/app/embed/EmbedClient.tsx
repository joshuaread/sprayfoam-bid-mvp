'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WidgetFlow } from '@/components/WidgetFlow';
import type { PriceBook } from '@/lib/engine';
import type { Branding, WidgetConfig } from '@/lib/models';
import { store } from '@/lib/storage';

export function EmbedClient() {
  const params = useSearchParams();
  const [data, setData] = useState<{ cfg: WidgetConfig; pb: PriceBook; b: Branding; rev: number } | null>(null);
  const preview = params.get('preview') === '1';
  useEffect(() => {
    document.body.style.background = 'transparent';
    let rev = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      const [cfg, pb, b] = await Promise.all([store.getWidgetConfig(), store.getPriceBook(), store.getBranding()]);
      setData({ cfg, pb, b, rev: ++rev });
    };
    void load();
    // The setup page edits localStorage in the parent window; storage events fire here (same origin).
    // Only the preview follows settings changes, so a live widget never resets under a homeowner.
    const onStorage = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 400);
    };
    if (preview) window.addEventListener('storage', onStorage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [preview]);
  if (!data) return null;
  return <WidgetFlow key={data.rev} config={data.cfg} priceBook={data.pb} branding={data.b} preview={preview} />;
}
