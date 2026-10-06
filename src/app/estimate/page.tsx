import { Suspense } from 'react';
import { EstimateBuilder } from './EstimateBuilder';

export default function EstimatePage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading estimate…</p>}>
      <EstimateBuilder />
    </Suspense>
  );
}
