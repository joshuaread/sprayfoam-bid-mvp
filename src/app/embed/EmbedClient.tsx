'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WidgetFlow } from '@/components/WidgetFlow';
import type { PriceBook } from '@/lib/engine';
import type { Branding, WidgetConfig } from '@/lib/models';
import { store } from '@/lib/storage';
import { decodeCfg } from '@/lib/widgetCfg';

export function EmbedClient() {
  const params = useSearchParams();
  const [data, setData] = useState<{ cfg: WidgetConfig; pb: PriceBook; b: Branding } | null>(null);
  const preview = params.get('preview') === '1';
  const cfgParam = params.get('cfg');
  useEffect(() => {
    document.body.style.background = 'transparent';
    (async () => {
      const stored = await store.getWidgetConfig();
      const cfg = decodeCfg(cfgParam) ?? stored;
      setData({ cfg, pb: await store.getPriceBook(), b: await store.getBranding() });
    })();
  }, [cfgParam]);
  if (!data) return null;
  return <WidgetFlow key={cfgParam ?? 'stored'} config={data.cfg} priceBook={data.pb} branding={data.b} preview={preview} />;
}
