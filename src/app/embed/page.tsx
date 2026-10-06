import { Suspense } from 'react';
import { EmbedClient } from './EmbedClient';

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedClient />
    </Suspense>
  );
}
